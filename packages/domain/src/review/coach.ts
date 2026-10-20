/** Adaptiver Coach (HOS-006). 1:1 aus Referenz v5. Höchstens drei Maßnahmen, nichts ohne Bestätigung. */
import { A } from '../actions.js';
import { GOALS, HABIT_LIBRARY } from '../catalog.js';
import { normalizeConfig } from '../config.js';
import { computeRecs } from '../intelligence.js';
import { buildPlan, syncHabits } from '../plan/build.js';
import { materialize } from '../plan/materialize.js';
import { addVersion, syncPlanRoutines, versionAt } from '../plan/routines.js';
import { trainingsInWeek } from '../status.js';
import type { Config, EvidenceLevel, ISODate, MeasureDecision, MeasureMetric, MeasureRecord, ReviewRecord, Reviews, Routine, RoutineVersion, State } from '../types.js';
import { addDays, fmtDM, hm, r15, toMin, WD_LONG, wdist, weekStart } from '../util/date.js';
import { adherence, habitAdherence, isPause, trainingHistory, type Adherence, type HabitRate } from './metrics.js';

export const nextMonday = (today: ISODate): ISODate => addDays(weekStart(today), 7);
export function versionRoutines(d: State, ids: string[], patchOf: (rt: Routine) => Partial<RoutineVersion>, from: ISODate, today: ISODate, text: string): State {
  const routines = d.routines.map(rt => (ids.includes(rt.id) ? addVersion({ ...rt, customized: true }, from, patchOf(rt), text) : rt));
  return materialize({ ...d, routines }, today);
}
/** Übernommen in den letzten zwei Reviews oder „nicht jetzt“ ohne neuen Anlass wird nicht erneut vorgeschlagen. */
export function priorDecisions(data: Pick<State, 'reviews'>, keys: string[]): (MeasureRecord & { recent: boolean })[] {
  return Object.entries(data.reviews || {}).filter(([k]) => !keys.includes(k)).sort((a, b) => (b[1].at || '').localeCompare(a[1].at || '')).slice(0, 4)
    .flatMap(([, r], idx) => (r.measures || []).map(x => ({ ...x, recent: idx < 2 })));
}
export const AREA_GOALS: Record<string, string[]> = { training: ['fitter', 'abnehmen'], bewegung: ['bewegung', 'werte'], ernaehrung: ['ernaehrung', 'werte', 'abnehmen'], gewohnheiten: ['routinen'], ziele: [] };

export type MeasureEvidence = { kind: 'plan'; text: string } | { kind: 'rec'; level: EvidenceLevel; sources: string[]; text: string };
export interface MeasureBuild { cfg?: Config; fn?: (d: State) => State }
export interface Measure {
  id: string; area: string; base?: number; score?: number; canNow: boolean; immediate?: boolean; sig: string; lab?: boolean;
  title: string; why: string; change: (from: ISODate) => string; check: string; metric: MeasureMetric | null; evidence: MeasureEvidence;
  build: (cc: Config, from: ISODate) => MeasureBuild;
}
/** Kennzahlen, die der Coach nutzt: Woche (weekMetrics) oder Monat (monthMetrics plus Wochenteile). */
export interface CoachMetrics {
  ws?: ISODate; end?: ISODate; goal?: number; trDone?: number;
  pauseHist2?: Adherence; pauses?: Adherence | { now: Adherence; prev?: Adherence };
  weakHabit?: HabitRate | null; habits?: { now: { per: HabitRate[] } } | unknown;
  training?: { now: { avg: number | null; goal: number | null } };
}
type Answers = Record<string, string | undefined>;

export function coachMeasures(kind: 'week' | 'month', m: CoachMetrics, answers: Answers | null | undefined, data: State, cfg: unknown, today: ISODate, keys: string | string[], max = 3): Measure[] {
  const c = normalizeConfig(cfg); const nm = nextMonday(today); const out: Measure[] = [];
  const keyList = Array.isArray(keys) ? keys : [keys];
  const decidedHere = keyList.flatMap(k => (((data.reviews || {})[k] || {} as ReviewRecord).measures || []).map(x => x.id));
  const prior = priorDecisions(data, keyList);
  const blocked = (x: Measure) => decidedHere.includes(x.id) || prior.some(p => p.id === x.id && ((p.decision === 'übernommen' && p.recent && x.id !== 'fortfuehren') || (p.decision === 'nicht jetzt' && p.sig === x.sig)));
  const plan = buildPlan(c); const goal = plan.tdays.length; const per = Math.min(5, c.training.perWeek);
  const ws = kind === 'week' ? m.ws as ISODate : weekStart(m.end as ISODate);
  const hist = trainingHistory(data, ws, 3);
  const when = (f: ISODate) => (f === today ? 'ab sofort' : `ab ${fmtDM(f)}`);
  const planEvidence: MeasureEvidence = { kind: 'plan', text: 'Planungsvorschlag aus deinen Einträgen, keine Gesundheitsaussage.' };
  const ans: Answers = answers || {};
  if (goal >= 2 && ((hist.planned >= 4 && (hist.rate as number) < 0.6) || ans.umfang === 'zuviel')) out.push({
    id: 'training-weniger', area: 'training', base: 80 + (ans.umfang === 'zuviel' ? 20 : 0), canNow: true, sig: `${hist.done}/${hist.planned}/${ans.umfang || ''}`,
    title: `Training auf ${per - 1}× pro Woche anpassen`,
    why: `${hist.planned ? `In den letzten ${hist.weeks} Wochen fanden ${hist.done} von ${hist.planned} geplanten Einheiten statt.` : ''}${ans.umfang === 'zuviel' ? ' Du hast den Umfang als zu viel empfunden.' : ''} Ein Plan, der in deine Wochen passt, ist eine gute Basis, um später wieder zu steigern.`.trim(),
    change: f => `${when(f)}: ${per - 1} statt ${per} Einheiten pro Woche.${f === today ? ' Bereits erledigte Einheiten bleiben.' : ' Die laufende Woche bleibt, wie sie ist.'}`,
    check: `In den nächsten drei Wochen jeweils ${per - 1} ${per - 1 === 1 ? 'Einheit' : 'Einheiten'} erledigen.`, metric: { type: 'training', target: per - 1 }, evidence: planEvidence,
    build: cc => ({ cfg: { ...cc, training: { ...cc.training, perWeek: Math.max(0, Math.min(5, cc.training.perWeek) - 1) } } }),
  });
  plan.tdays.forEach(d => {
    const rt = data.routines.find(r => r.id === `train-${d}`); if (!rt || rt.customized || rt.status !== 'aktiv') return;
    const occ = data.items.filter(i => i.routine === rt.id && i.date < today && ['erledigt', 'verpasst'].includes(i.status) && !i.replacedBy).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
    const miss = occ.filter(i => i.status === 'verpasst').length;
    if (occ.length < 3 || miss < 2) return;
    const cands = [0, 1, 2, 3, 4, 5, 6].filter(x => !plan.tdays.includes(x) && x !== plan.freeDay);
    const score = (x: number) => (plan.tdays.some(t => t !== d && wdist(t, x) <= 1) ? 0 : 2) + (ans['training-hindernis'] === 'termine' && !c.work.days.includes(x) ? 2 : 0) + (c.work.days.includes(x) === c.work.days.includes(d) ? 1 : 0);
    const alt = cands.sort((a, b) => score(b) - score(a) || wdist(b, d) - wdist(a, d))[0];
    if (alt == null) return;
    out.push({
      id: `training-verlegen-${d}`, area: 'training', base: 85 + (['termine', 'uhrzeit'].includes(ans['training-hindernis'] as string) ? 10 : 0), canNow: true, sig: `${miss}/${occ.length}`,
      title: `Training von ${WD_LONG[d]} auf ${WD_LONG[alt]} verlegen`,
      why: `Die Einheit am ${WD_LONG[d]} hat bei den letzten ${occ.length} Terminen ${miss}-mal nicht stattgefunden.${ans['training-hindernis'] === 'termine' ? ' Du nennst Termine oder Arbeit als Hürde.' : ''}`,
      change: f => `${when(f)} liegt sie am ${WD_LONG[alt]}. Die Uhrzeit ergibt sich aus deinem Arbeitsalltag.`,
      check: `Die Einheit am ${WD_LONG[alt]} in den nächsten drei Wochen mindestens zweimal erledigen.`, metric: { type: 'training', target: goal }, evidence: planEvidence,
      build: cc => ({ cfg: { ...cc, training: { ...cc.training, days: [...new Set([...buildPlan(cc).tdays.filter(x => x !== d), alt])].sort((a, b) => a - b) } } }),
    });
  });
  const metGoal = kind === 'week' ? (m.goal as number) > 0 && (m.trDone as number) >= (m.goal as number) : (m.training && m.training.now.avg != null && m.training.now.avg >= (m.training.now.goal as number));
  if (goal && goal < 4 && metGoal && hist.planned >= 4 && (hist.rate as number) >= 0.9 && ans.umfang !== 'zuviel' && c.goals.some(g => ['fitter', 'abnehmen'].includes(g))) out.push({
    id: 'training-mehr', area: 'training', base: 50 + (ans.umfang === 'mehr' ? 35 : 0), canNow: true, sig: `${hist.done}/${hist.planned}/${ans.umfang || ''}`,
    title: `Optional: ${per + 1}× pro Woche trainieren`,
    why: `In den letzten ${hist.weeks} Wochen fanden ${hist.done} von ${hist.planned} Einheiten statt.${ans.umfang === 'mehr' ? ' Du hast angegeben, dass es mehr sein dürfte.' : ''} Nur sinnvoll, wenn es sich gut anfühlt.`,
    change: f => `${when(f)}: ${per + 1} statt ${per} Einheiten. Den zusätzlichen Tag wählt die Planung mit möglichst viel Abstand.`,
    check: `In den nächsten drei Wochen mindestens zweimal ${per + 1} Einheiten.`, metric: { type: 'training', target: per + 1 }, evidence: planEvidence,
    build: cc => ({ cfg: { ...cc, training: { ...cc.training, perWeek: Math.min(5, cc.training.perWeek + 1) } } }),
  });
  /* Nur nicht individuell angepasste Pausen-Routinen werden vorgeschlagen */
  const pauseIds = data.routines.filter(r => r.status === 'aktiv' && r.id.startsWith('pause1') && !r.customized).map(r => r.id);
  const ph = (kind === 'week' ? m.pauseHist2 : (m.pauses as { now: Adherence }).now) as Adherence;
  if (pauseIds.length && ((ph.eligible >= 4 && (ph.rate as number) < 0.5) || ['meetings', 'uhrzeit'].includes(ans['pausen-hindernis'] as string))) {
    const r0 = data.routines.find(r => r.id === pauseIds[0])!; const v0 = versionAt(r0, nm) || r0.versions[r0.versions.length - 1]!;
    const after = hm(r15((toMin(c.work.lunch) ?? 750) + (Number(c.work.lunchDur) || 30)));
    const newTime = after === v0.time ? hm(Math.min(1380, (toMin(v0.time) as number) + 60)) : after; const newDur = Math.min(v0.duration, 10);
    out.push({
      id: 'pausen-anpassen', area: 'bewegung', base: 75 + (ans['pausen-hindernis'] ? 10 : 0), canNow: true, sig: `${ph.done}/${ph.eligible}/${ans['pausen-hindernis'] || ''}`,
      title: `Bewegungspause kürzer und um ${newTime} Uhr`,
      why: `${ph.eligible ? `Zuletzt fanden ${ph.done} von ${ph.eligible} Bewegungspausen statt.` : ''}${ans['pausen-hindernis'] === 'meetings' ? ' Du nennst Meetings als Hürde.' : ans['pausen-hindernis'] === 'uhrzeit' ? ' Die Uhrzeit passt laut dir nicht.' : ''} Verpasste Pausen sind abgeschlossen, es wird nichts nachgeholt.`.trim(),
      change: f => `${when(f)}: ${newTime} Uhr und ${newDur} Minuten statt ${v0.time} Uhr und ${v0.duration} Minuten.`,
      check: 'Mindestens drei Bewegungspausen pro Woche.', metric: { type: 'pauses', target: 3 },
      evidence: { kind: 'rec', level: 'gut', sources: ['who2020'], text: 'Sitzzeit durch Bewegung zu ersetzen ist gut belegt. Uhrzeit und Länge sind Planungsentscheidungen.' },
      build: (cc, from) => ({ fn: d => versionRoutines(d, pauseIds, () => ({ time: newTime, duration: newDur }), from, today, `Aus Review: ${newTime} Uhr, ${newDur} Min.`) }),
    });
  }
  const monthHabits = m.habits as { now: { per: HabitRate[] } } | undefined;
  const wh = m.weakHabit || (kind !== 'week' && monthHabits ? monthHabits.now.per.filter(h => h.eligible >= 8 && (h.rate as number) < 0.4).sort((a, b) => (a.rate as number) - (b.rate as number))[0] : null);
  if (wh && ans.gewohnheit !== 'ja') out.push({
    id: `gewohnheit-pause-${wh.id}`, area: 'gewohnheiten', base: 60 + (['kleiner', 'pause'].includes(ans.gewohnheit as string) ? 25 : 0), canNow: true, sig: `${wh.done}/${wh.eligible}/${ans.gewohnheit || ''}`,
    title: `„${wh.name}“ vorerst pausieren`,
    why: `„${wh.name}“ gelang an ${wh.done} von ${wh.eligible} Tagen.${ans.gewohnheit === 'kleiner' ? ' Du findest sie gerade zu groß.' : ans.gewohnheit === 'pause' ? ' Sie ist dir gerade nicht wichtig.' : ''} Weniger gleichzeitige Gewohnheiten können den Fokus erleichtern.`,
    change: f => `${when(f)} verschwindet die Gewohnheit aus dem Raster. Bisherige Haken bleiben, reaktivieren geht jederzeit in der Woche.`,
    check: 'Die übrigen Gewohnheiten an mindestens vier Tagen pro Woche abhaken.', metric: { type: 'habits', target: 4 }, evidence: planEvidence,
    build: (cc, from) => ({ fn: d => ({ ...d, habits: d.habits.map(h => (h.id === wh.id ? { ...h, inactiveFrom: from } : h)) }) }),
  });
  const recs = computeRecs(data, c, today);
  const foodAns = ans.ernaehrung;
  if (foodAns !== 'keine' && (foodAns || c.goals.some(g => ['ernaehrung', 'werte', 'abnehmen'].includes(g)))) {
    const want = foodAns === 'gemuese' ? ['pflanzen-vielfalt'] : ['ldl-muster', 'ballaststoffe'];
    const rec = recs.find(r => want.includes(r.id) && (r.status === 'vorgeschlagen' || (foodAns && r.status === 'abgelehnt')));
    if (rec) out.push({
      id: `empfehlung-${rec.take.key || rec.id}`, area: 'ernaehrung', base: 65 + (foodAns ? 20 : 0) + (rec.lab_marker_id ? 5 : 0), lab: !!rec.lab_marker_id, canNow: rec.take.kind === 'routine', sig: `${rec.id}/${foodAns || ''}`,
      title: rec.take.kind === 'habit' ? `Gewohnheit: ${HABIT_LIBRARY[rec.take.key]!.name}` : 'Zweimal pro Woche eine Mahlzeit mit Haferflocken oder Hülsenfrüchten',
      why: `${rec.why}${foodAns ? ' Du hast diese Richtung selbst gewählt.' : ''}`,
      change: f => (rec.take.kind === 'routine' ? `${rec.action} Neue Routine dienstags und freitags um 07:30 Uhr, ${when(f)}.` : `${rec.action} Erscheint im Gewohnheiten-Raster.`),
      check: rec.take.kind === 'routine' ? 'In zwei Wochen prüfen, ob die Mahlzeit an beiden Tagen geklappt hat.' : 'An mindestens fünf Tagen pro Woche abhaken.',
      metric: rec.take.kind === 'routine' ? { type: 'routine', routine: `vorschlag-${rec.take.key}`, target: 2 } : { type: 'habits', target: 5 },
      evidence: { kind: 'rec', level: rec.evidence_strength, sources: rec.sources, text: 'Verknüpft mit Health Intelligence.' },
      build: (cc, from) => ({ fn: d => A.acceptRec(d, rec, cc, today, from) }),
    });
  }
  const hi = recs.find(r => r.status === 'vorgeschlagen' && r.id === 'sitzen-unterbrechen');
  if (hi && !out.some(x => x.id === 'pausen-anpassen')) out.push({
    id: `empfehlung-${hi.id}`, area: 'bewegung', base: 55, canNow: hi.take.kind === 'routine', sig: hi.id, title: hi.title, why: hi.why, change: f => `${hi.action}${hi.take.kind === 'routine' ? ` Gilt ${when(f)}.` : ''}`, check: 'In zwei Wochen prüfen, wie oft es geklappt hat.',
    metric: hi.take.kind === 'routine' ? { type: 'routine', routine: `vorschlag-${hi.take.key}`, target: 3 } : { type: 'habits', target: 4 },
    evidence: { kind: 'rec', level: hi.evidence_strength, sources: hi.sources, text: 'Verknüpft mit Health Intelligence.' }, build: (cc, from) => ({ fn: d => A.acceptRec(d, hi, cc, today, from) }),
  });
  if (kind !== 'week' && ans.fokus && ans.fokus !== c.goals[0] && (c.goals as string[]).includes(ans.fokus)) {
    const fokus = ans.fokus as Config['goals'][number];
    out.push({
      id: `fokus-${fokus}`, area: 'ziele', base: 90, canNow: false, immediate: true, sig: fokus,
      title: `Fokus auf „${GOALS[fokus]}“ legen`, why: 'Du hast diesen Bereich für den nächsten Monat gewählt.',
      change: () => `„${GOALS[fokus]}“ wird Priorität 1. Das betrifft keine Termine, sondern den Hinweis auf „Heute“ und die Vorschläge.`,
      check: 'Im nächsten Monatsreview prüfen, ob der Fokus passt.', metric: null, evidence: planEvidence,
      build: cc => ({ cfg: { ...cc, goals: [fokus, ...cc.goals.filter(g => g !== fokus)] } }),
    });
  }
  /* Relevanz: Grundgewicht plus Bezug zu den priorisierten Zielen */
  out.forEach(x => { const gi = Math.min(...(AREA_GOALS[x.area] || []).map(g => { const i = (c.goals as string[]).indexOf(g); return i < 0 ? 99 : i; }), 99); x.score = (x.base as number) + (gi < 99 ? (6 - gi) * 4 : 0); });
  const picked: Measure[] = []; const areas = new Set<string>();
  out.filter(x => !blocked(x)).sort((a, b) => (b.score as number) - (a.score as number)).forEach(x => { if (picked.length < max && !areas.has(x.area)) { picked.push(x); areas.add(x.area); } });
  if (picked.length < Math.min(max, 3) && !decidedHere.includes('fortfuehren') && (max > 1 || !picked.length)) picked.push({
    id: 'fortfuehren', area: 'alles', score: 0, sig: 'immer', canNow: false, title: picked.length ? 'Alles andere so fortführen' : 'Alles so fortführen',
    why: picked.length ? 'Was gut läuft, bleibt unverändert.' : 'Es gibt keinen klaren Anlass für eine Änderung. Stabilität ist auch ein Ergebnis.',
    change: () => 'Keine Änderung am Plan.', check: 'Beim nächsten Review vergleichen.', metric: null, evidence: planEvidence, build: () => ({}),
  });
  return picked;
}

/** Rein funktional, für Vorschau und Übernahme gleich. Standard: ab nächstem Montag. */
export function applyMeasureState(data: State, cfg: unknown, measure: Pick<Measure, 'build'> | { build?: Measure['build'] }, today: ISODate, from?: ISODate | null): { cfg: Config; data: State; cfgChanged: boolean; kept: Routine[]; from: ISODate } {
  const f = from || nextMonday(today);
  let c2 = normalizeConfig(cfg), d2 = data;
  const r: MeasureBuild = measure.build ? measure.build(c2, f) || {} : {};
  let kept: Routine[] = [];
  if (r.cfg) {
    c2 = normalizeConfig(r.cfg);
    const sync = syncPlanRoutines(d2.routines, c2, f);
    kept = sync.kept;
    d2 = materialize({ ...d2, routines: sync.routines }, today);
    d2 = { ...d2, habits: syncHabits(d2.habits, c2) };
  }
  if (r.fn) d2 = r.fn(d2);
  return { cfg: c2, data: d2, cfgChanged: !!r.cfg, kept, from: f };
}
export const measureRecord = (m: Pick<Measure, 'id' | 'title' | 'area' | 'check' | 'metric' | 'sig' | 'lab'>, decision: MeasureDecision, today: ISODate, from?: ISODate | null): MeasureRecord =>
  ({ id: m.id, title: m.title, area: m.area, check: m.check, metric: m.metric || null, decision, decidedAt: today, validFrom: decision === 'übernommen' ? (from || nextMonday(today)) : null, sig: m.sig || null, lab: !!m.lab });
export function evalMeasure(rec: MeasureRecord | null | undefined, data: State, today: ISODate): string | null {
  if (!rec || rec.decision !== 'übernommen' || !rec.metric) return null;
  const metric = rec.metric;
  const from = (rec.validFrom || rec.decidedAt) as ISODate; const lastFull = addDays(weekStart(today), -1);
  const weeks: ISODate[] = []; for (let s = weekStart(from); addDays(s, 6) <= lastFull; s = addDays(s, 7)) if (s >= weekStart(from)) weeks.push(s);
  if (metric.type === 'routine') { const a = adherence(data.items, from, today, today, i => i.routine === metric.routine); return a.eligible ? `${a.done} von ${a.eligible} Terminen erledigt` : 'noch keine Termine'; }
  if (!weeks.length) return 'noch keine abgeschlossene Woche';
  const hit = weeks.filter(s => metric.type === 'training' ? trainingsInWeek(data, s) >= metric.target
    : metric.type === 'pauses' ? adherence(data.items, s, addDays(s, 6), today, isPause).done >= metric.target
      : habitAdherence(data, s, addDays(s, 6), today).per.filter(h => h.done >= metric.target).length > 0).length;
  return `in ${hit} von ${weeks.length} ${weeks.length === 1 ? 'Woche' : 'Wochen'} erreicht`;
}
export function runningMeasures(data: State, keys: string[], today: ISODate) {
  return Object.entries(data.reviews || {}).filter(([k, r]) => !keys.includes(k) && r.status === 'abgeschlossen').sort((a, b) => (b[1].at || '').localeCompare(a[1].at || '')).slice(0, 3)
    .flatMap(([, r]) => (r.measures || []).filter(x => x.decision === 'übernommen' && x.id !== 'fortfuehren')).filter((x, i, arr) => arr.findIndex(y => y.id === x.id && y.decidedAt === x.decidedAt) === i).map(x => ({ ...x, status: evalMeasure(x, data, today) }));
}
/** Speicherbar sind nur Status, Datum, Fragen-IDs und Plan-Maßnahmen ohne Laborbezug (Stand Referenz v5). */
export const persistableReviews = (rs: Reviews | null | undefined): Reviews => Object.fromEntries(Object.entries(rs || {}).map(([k, r]) => [k, { kind: r.kind, status: r.status, at: r.at || null, snoozedUntil: r.snoozedUntil || null, questionIds: r.questionIds || [], mode: r.mode || null, combined: !!r.combined, measures: (r.measures || []).filter(x => !x.lab).map(({ lab, ...x }) => x), demo: !!r.demo }]));
