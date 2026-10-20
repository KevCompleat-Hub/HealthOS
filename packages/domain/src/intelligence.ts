/**
 * Health Intelligence (HOS-005): Laborprüfung, Regeln, Wochenlimit und Primärvorschlag. 1:1 aus Referenz v5.
 * Regelbasiert, ohne KI, keine Präparate und keine Dosierungen.
 */
import { EVIDENCE, GOALS } from './catalog.js';
import { normalizeConfig } from './config.js';
import type { Config, EvidenceLevel, GoalKey, ISODate, ItemType, Lab, Priority, RecState, RecStatus, State, TaskClass, Weekday } from './types.js';
import { daysBetween, fmtDM, fmtVal, hm, parse, r15, toMin, weekStart } from './util/date.js';

export type MarkerId = 'ldl' | 'zink';
export interface LabMarker { label: string; match: (n: unknown) => boolean; units: string[]; dir: 'high' | 'low' }
export const LAB_MARKERS: Record<MarkerId, LabMarker> = {
  ldl: { label: 'LDL-Cholesterin', match: n => /^ldl/i.test(String(n).trim()), units: ['mg/dl', 'mmol/l'], dir: 'high' },
  zink: { label: 'Zink', match: n => /^zink/i.test(String(n).trim()), units: ['µg/dl', 'ug/dl', 'µmol/l', 'umol/l'], dir: 'low' },
};
export const normUnit = (u: unknown): string => String(u || '').trim().toLowerCase().replace('μ', 'µ');
export const markerOf = (analyte: string): MarkerId | null => (Object.keys(LAB_MARKERS) as MarkerId[]).find(k => LAB_MARKERS[k].match(analyte)) || null;

export interface LabAssessment { state: 'fehlt' | 'unklar' | 'auffaellig' | 'unauffaellig'; reason?: string; latest?: Lab }
export type LabAssessments = Record<MarkerId, LabAssessment>;
/** Ein Laborwert löst nur eine Empfehlung aus, wenn Einheit, Referenz, Bestätigung und Aktualität eindeutig sind. */
export function labAssessment(labs: Lab[], markerId: MarkerId, today: ISODate): LabAssessment {
  const M = LAB_MARKERS[markerId];
  const list = labs.filter(l => M.match(l.analyte)).sort((a, b) => a.date.localeCompare(b.date));
  if (!list.length) return { state: 'fehlt', reason: 'Kein Messwert vorhanden.' };
  const l = list[list.length - 1]!;
  if (!M.units.includes(normUnit(l.unit))) return { state: 'unklar', reason: `Die Einheit „${l.unit}“ ist für diese Auswertung nicht eindeutig.`, latest: l };
  if (!l.confirmed) return { state: 'unklar', reason: 'Der Wert ist nicht als mit dem Originalbefund abgeglichen markiert.', latest: l };
  const bound = M.dir === 'high' ? l.refMax : l.refMin;
  if (bound == null) return { state: 'unklar', reason: 'Für diese Auswertung fehlt die passende Laborreferenz.', latest: l };
  if (daysBetween(l.date, today) > 548) return { state: 'unklar', reason: 'Der letzte Wert ist älter als 18 Monate.', latest: l };
  const out = (x: Lab) => (M.dir === 'high' ? x.value > (x.refMax as number) : x.value < (x.refMin as number));
  const near = list.filter(x => x !== l && normUnit(x.unit) === normUnit(l.unit) && daysBetween(x.date, l.date) <= 90 && (M.dir === 'high' ? x.refMax : x.refMin) != null);
  if (near.some(x => out(x) !== out(l))) return { state: 'unklar', reason: 'Messungen der letzten 90 Tage widersprechen sich.', latest: l };
  return { state: out(l) ? 'auffaellig' : 'unauffaellig', latest: l };
}

export interface TakeRoutineSpec { title: string; type: ItemType; goal: GoalKey; taskClass: TaskClass; priority: Priority; days: Weekday[]; time: string; duration: number; note: string }
export const TAKE_ROUTINES: Record<string, (c: Config) => TakeRoutineSpec> = {
  'ballaststoff-mahlzeit': () => ({ title: 'Mahlzeit mit Haferflocken oder Hülsenfrüchten', type: 'ernaehrung', goal: 'ernaehrung', taskClass: 'same_day', priority: 'normal', days: [1, 4], time: '07:30', duration: 10, note: 'Zum Beispiel Haferflocken mit Beeren oder ein Gericht mit Linsen, Bohnen oder Kichererbsen.' }),
  'gehen-mittag': c => ({ title: 'Gehen nach dem Mittagessen', type: 'bewegung', goal: 'bewegung', taskClass: 'same_day', priority: 'normal', days: [...c.work.days], time: hm(r15((toMin(c.work.lunch) ?? 750) + (Number(c.work.lunchDur) || 30))), duration: 10, note: c.training.places.includes('walkingpad') ? 'Draußen oder auf dem Walking-Pad. Verpasst wird nicht nachgeholt.' : 'Draußen oder durchs Gebäude. Verpasst wird nicht nachgeholt.' }),
  'pause-nachmittag': c => ({ title: 'Kurz aufstehen am Nachmittag', type: 'bewegung', goal: 'bewegung', taskClass: 'same_day', priority: 'niedrig', days: [...c.work.days], time: hm(r15(((toMin(c.work.lunch) ?? 750) + (Number(c.work.lunchDur) || 30) + (toMin(c.work.end) ?? 1050)) / 2 + 30)), duration: 5, note: 'Aufstehen, ein paar Schritte, kurz dehnen.' }),
};

export type RecTake = { kind: 'routine'; key: string; label: string } | { kind: 'habit'; key: string; label: string } | { kind: 'task'; title: string; days: number; label: string; key?: undefined };
export interface RecDef {
  id: string; goal_id: GoalKey | undefined; lab_marker_id: MarkerId | null; base: number; suppressedBy?: string;
  trigger: string; title: string; why: string; action: string; frequency: string; evidence_strength: EvidenceLevel; sources: string[];
  safety_notes: string; contraindications: string; reviewDays: number; take: RecTake;
}
export interface Rec extends RecDef {
  status: RecStatus; firstShown: ISODate | null; remindAfter: ISODate | null; primaryOn: ISODate | null; decidedAt: ISODate | null; reviewDate: ISODate | null; score: number;
}

/* Regeldefinitionen: Texte automatisiert und unverändert aus der Referenz übernommen. */
export const REC_DEFS: ((c: Config, lab: LabAssessments) => RecDef | null)[] = [
  (c: Config, lab: LabAssessments): RecDef | null => lab.ldl.state !== 'auffaellig' ? null : {
    id: 'ldl-muster', goal_id: 'werte', lab_marker_id: 'ldl', base: 90,
    trigger: `LDL-Cholesterin ${fmtVal(lab.ldl.latest!.value)} ${lab.ldl.latest!.unit} am ${fmtDM(lab.ldl.latest!.date)}${String(parse(lab.ldl.latest!.date).getFullYear()).slice(2)}, über der Laborreferenz (bis ${fmtVal(lab.ldl.latest!.refMax)}). Fiktiver, als bestätigt markierter Demo-Wert.`,
    title: 'Lösliche Ballaststoffe und pflanzliche Öle in den Alltag holen',
    why: 'Leitlinien setzen bei erhöhtem LDL-Cholesterin auf ein insgesamt herzgesundes Ernährungsmuster: mehr Ballaststoffe, etwa aus Haferflocken und Hülsenfrüchten, ungesättigte statt gesättigter Fette sowie viel Gemüse und Vollkorn. Einzelne Lebensmittel senken den Wert nicht garantiert.',
    action: 'An zwei Tagen pro Woche eine Mahlzeit mit Haferflocken oder Hülsenfrüchten. Beim Kochen öfter Raps- oder Olivenöl statt Butter.',
    frequency: '2 Mahlzeiten pro Woche', evidence_strength: 'gut', sources: ['aha2026', 'esc2025'],
    safety_notes: 'Ersetzt keinen ärztlich empfohlenen Maßnahmenplan. Verordnete Medikamente nicht eigenständig ändern oder absetzen. Die ESC/EAS-Leitlinie rät von Nahrungsergänzungsmitteln ohne belegte Sicherheit und Wirksamkeit zur LDL-Senkung ab.',
    contraindications: 'Befund und Gesamtrisiko ärztlich einordnen lassen. Bei Allergien oder Unverträglichkeiten passende Alternativen wählen.',
    reviewDays: 56, take: { kind: 'routine', key: 'ballaststoff-mahlzeit', label: 'Als Routine übernehmen' },
  },
  (c: Config, lab: LabAssessments): RecDef | null => lab.zink.state !== 'auffaellig' ? null : {
    id: 'zink-lebensmittel', goal_id: 'werte', lab_marker_id: 'zink', base: 85,
    trigger: `Zink ${fmtVal(lab.zink.latest!.value)} ${lab.zink.latest!.unit} am ${fmtDM(lab.zink.latest!.date)}${String(parse(lab.zink.latest!.date).getFullYear()).slice(2)}, unter der Laborreferenz (ab ${fmtVal(lab.zink.latest!.refMin)}). Fiktiver, als bestätigt markierter Demo-Wert.`,
    title: 'Zinkhaltige Lebensmittel kennen und den Befund ärztlich einordnen',
    why: 'Ein einzelner niedriger Wert ist nicht automatisch ein Mangel. Ob eine Maßnahme nötig ist, klärt eine Ärztin oder ein Arzt mit dem Befund und deinem Kontext.',
    action: 'Frage für den nächsten Arzttermin notieren. Im Alltag liefern zum Beispiel Fleisch, Meeresfrüchte, Hülsenfrüchte, Nüsse, Samen wie Kürbiskerne und Milchprodukte Zink, Obst und Gemüse dagegen wenig.',
    frequency: 'Einmalig, Aufgabe mit Frist in 14 Tagen', evidence_strength: 'gut', sources: ['odszinc', 'odscopper'],
    safety_notes: 'Keine Empfehlung für Zinkpräparate und keine Dosierung. Höhere Zinkgaben können die Kupferaufnahme beeinträchtigen. Präparate nur nach ärztlicher oder pharmazeutischer Rücksprache.',
    contraindications: 'Bei Medikamenteneinnahme mögliche Wechselwirkungen ärztlich oder in der Apotheke klären.',
    reviewDays: 30, take: { kind: 'task', title: 'Laborbefund ärztlich besprechen', days: 14, label: 'Als Aufgabe übernehmen' },
  },
  (c: Config, lab: LabAssessments): RecDef | null => !c.goals.some(g => ['ernaehrung', 'abnehmen', 'werte'].includes(g)) ? null : {
    id: 'ballaststoffe', goal_id: c.goals.find(g => ['ernaehrung', 'abnehmen', 'werte'].includes(g)), lab_marker_id: null, base: 60, suppressedBy: 'ldl-muster',
    trigger: `Dein Ziel „${GOALS[c.goals.find(g => ['ernaehrung', 'abnehmen', 'werte'].includes(g)) as GoalKey]}“.`,
    title: 'Zweimal pro Woche Haferflocken oder Hülsenfrüchte',
    why: 'Ballaststoffreiche Lebensmittel wie Vollkorn, Haferflocken und Hülsenfrüchte sind ein Kernbaustein gesunder Ernährungsmuster. Die DGE nennt für Erwachsene einen Richtwert von mindestens 30 g Ballaststoffen pro Tag.',
    action: 'An zwei Tagen ein Frühstück mit Haferflocken oder ein Gericht mit Linsen, Bohnen oder Kichererbsen einplanen.',
    frequency: '2 Mahlzeiten pro Woche', evidence_strength: 'gut', sources: ['dge2021', 'aha2026'],
    safety_notes: 'Ballaststoffe schrittweise steigern und ausreichend trinken.',
    contraindications: 'Bei Darmerkrankungen oder ärztlich verordneter ballaststoffarmer Kost vorher Rücksprache halten.',
    reviewDays: 28, take: { kind: 'routine', key: 'ballaststoff-mahlzeit', label: 'Als Routine übernehmen' },
  },
  (c: Config, lab: LabAssessments): RecDef | null => {
    if (!c.goals.some(g => ['bewegung', 'fitter', 'abnehmen', 'werte'].includes(g)) || c.work.days.length < 3) return null;
    const pd = Number(c.breaks.perDay) || 0;
    const take: RecTake = pd === 0 ? { kind: 'routine', key: 'gehen-mittag', label: 'Als Routine übernehmen' } : pd === 1 ? { kind: 'routine', key: 'pause-nachmittag', label: 'Als Routine übernehmen' } : { kind: 'habit', key: 'abendrunde', label: 'Als Gewohnheit übernehmen' };
    const title = pd === 0 ? '10 Minuten gehen nach dem Mittagessen' : pd === 1 ? 'Am Nachmittag kurz aufstehen' : 'Kurze Runde nach dem Abendessen';
    return {
      id: 'sitzen-unterbrechen', goal_id: c.goals.find(g => ['bewegung', 'fitter', 'abnehmen', 'werte'].includes(g)), lab_marker_id: null, base: 70,
      trigger: `${c.work.days.length} Arbeitstage pro Woche, ${pd === 0 ? 'keine' : pd === 1 ? 'eine' : 'zwei'} Bewegungspause${pd === 1 ? '' : 'n'} geplant.`,
      title,
      why: 'Die WHO empfiehlt Erwachsenen, Sitzzeiten zu begrenzen und durch Bewegung jeder Intensität zu ersetzen. Auch leichte Bewegung zählt. Der konkrete Zeitpunkt ist ein praktischer Vorschlag für deinen Arbeitsalltag, kein eigener Studienbefund.',
      action: pd === 0 ? 'An Arbeitstagen nach dem Mittagessen 10 Minuten gehen.' : pd === 1 ? 'An Arbeitstagen am Nachmittag 5 Minuten aufstehen und gehen.' : 'Nach dem Abendessen eine kurze Runde gehen, als Gewohnheit zum Abhaken.',
      frequency: pd === 2 ? 'Täglich, als Gewohnheit' : 'An Arbeitstagen', evidence_strength: 'gut', sources: ['who2020'],
      safety_notes: 'Bei Beschwerden oder ärztlich verordneter Schonung anpassen. Verpasste Termine werden nicht nachgeholt.',
      contraindications: 'Bei akuten Beschwerden aussetzen.',
      reviewDays: 28, take,
    };
  },
  (c: Config, lab: LabAssessments): RecDef | null => !c.goals.some(g => ['ernaehrung', 'werte'].includes(g)) ? null : {
    id: 'pflanzen-vielfalt', goal_id: c.goals.find(g => ['ernaehrung', 'werte'].includes(g)), lab_marker_id: null, base: 50,
    trigger: `Dein Ziel „${GOALS[c.goals.find(g => ['ernaehrung', 'werte'].includes(g)) as GoalKey]}“.`,
    title: 'Beeren, Gemüse und Nüsse öfter in den Einkauf',
    why: 'Herzgesunde Ernährungsmuster setzen auf Vielfalt aus Gemüse, Obst, Vollkorn, Hülsenfrüchten und Nüssen. Heidelbeeren oder andere Beeren sind ein Baustein davon, aber kein nachgewiesenes Mittel gegen einen bestimmten Blutwert.',
    action: 'Als Gewohnheit: an jedem Tag zwei Sorten Obst oder Gemüse.',
    frequency: 'Täglich, als Gewohnheit', evidence_strength: 'gut', sources: ['aha2026', 'dge2021'],
    safety_notes: 'Keine Nahrungsergänzungsmittel nötig, es geht um das Ernährungsmuster.',
    contraindications: 'Bei Nussallergie Nüsse weglassen.',
    reviewDays: 28, take: { kind: 'habit', key: 'vielfalt', label: 'Als Gewohnheit übernehmen' },
  },
];

export const LAB_REC_IDS = ['ldl-muster', 'zink-lebensmittel'];
/** In der Referenz bleiben laborbezogene Entscheidungen nur in der Sitzung. */
export const persistableRecState = (rs: RecState | null | undefined): RecState => Object.fromEntries(Object.entries(rs || {}).filter(([k]) => !LAB_REC_IDS.includes(k)));

export function computeRecs(data: Pick<State, 'labs' | 'recState'>, cfg: unknown, today: ISODate): Rec[] {
  const c = normalizeConfig(cfg);
  const lab = {} as LabAssessments; (Object.keys(LAB_MARKERS) as MarkerId[]).forEach(k => { lab[k] = labAssessment(data.labs, k, today); });
  const rs = data.recState || {};
  let all: Rec[] = REC_DEFS.map(f => f(c, lab)).filter((r): r is RecDef => Boolean(r)).map(r => {
    const s = rs[r.id] || {};
    const gi = c.goals.indexOf(r.goal_id as GoalKey);
    return { ...r, status: s.status || 'vorgeschlagen', firstShown: s.firstShown || null, remindAfter: s.remindAfter || null, primaryOn: s.primaryOn || null, decidedAt: s.decidedAt || null, reviewDate: s.reviewDate || null, score: r.base + (gi < 0 ? 0 : (6 - gi) * 5) + (r.lab_marker_id ? 30 : 0) };
  });
  all = all.filter(r => !(r.suppressedBy && all.some(x => x.id === r.suppressedBy && x.status !== 'abgelehnt')));
  return all.sort((a, b) => b.score - a.score);
}
/** Höchstens zwei neue Vorschläge pro Woche, höchstens ein Primärvorschlag pro Tag. */
export function recView(data: Pick<State, 'labs' | 'recState'>, cfg: unknown, today: ISODate) {
  const all = computeRecs(data, cfg, today);
  const ws = weekStart(today);
  const introduced = all.filter(r => r.firstShown && r.firstShown >= ws).length;
  const slots = Math.max(0, 2 - introduced);
  const open = all.filter(r => r.status === 'vorgeschlagen');
  const visible = [...open.filter(r => r.firstShown), ...open.filter(r => !r.firstShown).slice(0, slots)];
  const ready = visible.filter(r => !(r.remindAfter && r.remindAfter > today));
  const shownToday = all.find(r => r.primaryOn === today);
  const primary = shownToday ? (shownToday.status === 'vorgeschlagen' && !(shownToday.remindAfter && shownToday.remindAfter > today) ? shownToday : null) : (ready[0] || null);
  return { all, visible, ready, primary, primaryDone: !!shownToday && !primary, waiting: open.length - visible.length };
}
export function recSourceList(r: Pick<RecDef, 'sources'>) { return r.sources.map(k => EVIDENCE[k]).filter(Boolean); }

/* ---------- Laborwerte gruppieren (Anzeige-Hilfen der Referenz) ---------- */
export function groupLabs(labs: Lab[]) {
  const map: Record<string, Lab[]> = {};
  labs.forEach(l => { (map[l.analyte] = map[l.analyte] || []).push(l); });
  return Object.entries(map).map(([name, arr0]) => {
    const arr = [...arr0].sort((a, b) => a.date.localeCompare(b.date));
    const latest = arr[arr.length - 1]!;
    return { name, latest, all: arr, same: arr.filter(x => x.unit === latest.unit), other: arr.filter(x => x.unit !== latest.unit) };
  }).sort((a, b) => a.name.localeCompare(b.name, 'de'));
}
export const refText = (l: Lab): string => l.refMin != null && l.refMax != null ? `${fmtVal(l.refMin)} bis ${fmtVal(l.refMax)} ${l.unit}` : l.refMax != null ? `bis ${fmtVal(l.refMax)} ${l.unit}` : l.refMin != null ? `ab ${fmtVal(l.refMin)} ${l.unit}` : 'keine Referenz hinterlegt';
export const refPos = (l: Lab): 'oberhalb' | 'unterhalb' | 'innerhalb' | null => (l.refMin == null && l.refMax == null) ? null : (l.refMax != null && l.value > l.refMax) ? 'oberhalb' : (l.refMin != null && l.value < l.refMin) ? 'unterhalb' : 'innerhalb';
/** Hilfsfunktionen, die nur innerhalb der Regeltexte genutzt werden. */
export const _ruleHelpers = { fmtDM, fmtVal, parse, GOALS };
