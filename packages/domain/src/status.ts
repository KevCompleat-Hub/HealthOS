/** Status, Wochenkennzahlen, „Als Nächstes“, Coach-Hinweis und In-App-Hinweise (HOS-003, 003B). 1:1 aus Referenz v5. */
import { GOALS, MAIN_MEALS } from './catalog.js';
import { normalizeConfig } from './config.js';
import { buildPlan, classOfItem } from './plan/build.js';
import { pausedAll } from './plan/materialize.js';
import type { EffectiveStatus, Food, Habit, ISODate, Item, Nutrients, State } from './types.js';
import { addDays, avg, byTime, dayLabelLc, daysBetween, isoWeek, parse, toMin, WD, wdIdx, weekDays, weekStart } from './util/date.js';
import type { HabitLog } from './types.js';

export const effStatus = (it: Item, today: ISODate): EffectiveStatus => {
  if (it.status === 'geplant' && it.date < today) {
    const c = classOfItem(it);
    return c === 'deadline' ? 'faellig' : c === 'optional_logging' ? 'nicht_erfasst' : 'verpasst';
  }
  return it.status;
};
export const inWeek = (date: ISODate, anchor: ISODate): boolean => { const d = weekDays(anchor); return date >= d[0]! && date <= d[6]!; };
/** Erledigte Plan-Trainings plus frei erfasste Einheiten ohne Plan-Bezug, nie doppelt. */
export const trainingsInWeek = (data: Pick<State, 'items' | 'workouts'>, anchor: ISODate): number =>
  data.items.filter(i => i.type === 'training' && i.status === 'erledigt' && inWeek(i.date, anchor)).length
  + data.workouts.filter(w => w.counts && !w.itemId && inWeek(w.date, anchor)).length;
/** Verpasst zählt als nicht erledigt. Bewusst ausgelassen, pausiert und verschoben fallen heraus. */
export function pauseStats(data: Pick<State, 'items'>, anchor: ISODate) {
  const list = data.items.filter(i => i.routine && i.routine.startsWith('pause') && inWeek(i.date, anchor) && !['verschoben', 'pausiert'].includes(i.status));
  const eligible = list.filter(i => i.status !== 'ausgelassen');
  return { done: eligible.filter(i => i.status === 'erledigt').length, eligible: eligible.length, skipped: list.length - eligible.length, missed: eligible.filter(i => i.status === 'verpasst').length };
}
export const habitOn = (h: Habit, d: ISODate): boolean => h.active !== false && !(h.inactiveFrom && d >= h.inactiveFrom);
/** Wochenziel einer Gewohnheit (1 bis 6 pro Woche) oder null für täglich. Erweiterung nach M1, ohne Wochenziel unverändert. */
export const weeklyTarget = (h: Habit): number | null => (Number.isInteger(h.perWeek) && (h.perWeek as number) >= 1 && (h.perWeek as number) <= 6 ? (h.perWeek as number) : null);

/**
 * Gewohnheit mit Wochenziel im Zeitraum [from, to], höchstens bis heute, je Kalenderwoche gerechnet.
 * Erwartet wird das Wochenziel anteilig zu den gültigen Tagen der Woche im Zeitraum (gerundet).
 * Erledigt zählt höchstens bis zum Wochenziel. „Bewusst ausgelassen“ verändert nichts. Tage vor startDay zählen nicht.
 */
export function weeklyHabitCounts(data: { habitLog: HabitLog; pauses?: State['pauses'] }, h: Habit, from: ISODate, to: ISODate, today: ISODate, startDay?: ISODate | null): { done: number; eligible: number } {
  const target = weeklyTarget(h); if (!target) return { done: 0, eligible: 0 };
  const end = to < today ? to : today; let done = 0, eligible = 0;
  for (let ws = weekStart(from); ws <= end; ws = addDays(ws, 7)) {
    let valid = 0, hits = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws, i);
      if (d < from || d > end || (startDay && d < startDay) || pausedAll(data, d) || !habitOn(h, d)) continue;
      valid++; if (data.habitLog[`${h.id}|${d}`] === 'done') hits++;
    }
    if (!valid) continue;
    const dn = Math.min(hits, target);
    done += dn; eligible += Math.max(Math.round((target * valid) / 7), dn);
  }
  return { done, eligible };
}

export function habitStats(data: Pick<State, 'habits' | 'habitLog' | 'pauses'>, anchor: ISODate, today: ISODate) {
  let done = 0, eligible = 0, skipped = 0;
  const hs = data.habits.filter(h => !weeklyTarget(h));
  weekDays(anchor).filter(d => d <= today && !pausedAll(data, d)).forEach(d => hs.filter(h => habitOn(h, d)).forEach(h => {
    const v = data.habitLog[`${h.id}|${d}`];
    if (v === 'skip') skipped++; else { eligible++; if (v === 'done') done++; }
  }));
  const ws = weekStart(anchor);
  data.habits.filter(h => weeklyTarget(h)).forEach(h => { const c = weeklyHabitCounts(data, h, ws, addDays(ws, 6), today); done += c.done; eligible += c.eligible; });
  return { done, eligible, skipped };
}
export function missesInWeek(data: Pick<State, 'items'>, anchor: ISODate) {
  const m = data.items.filter(i => inWeek(i.date, anchor) && i.status === 'verpasst');
  return { total: m.length, training: m.filter(i => i.type === 'training').length, bewegung: m.filter(i => i.type === 'bewegung').length, sonst: m.filter(i => !['training', 'bewegung'].includes(i.type)).length };
}
export function weightTrend(data: Pick<State, 'weights'>, today: ISODate) {
  const a = data.weights.filter(w => w.date > addDays(today, -7) && w.date <= today).map(w => w.kg);
  const b = data.weights.filter(w => w.date > addDays(today, -14) && w.date <= addDays(today, -7)).map(w => w.kg);
  if (!a.length || !b.length) return null;
  return { delta: avg(a) - avg(b), na: a.length, nb: b.length };
}
export function dayNutrition(data: Pick<State, 'meals'>, date: ISODate): (Nutrients & { missing: string[]; complete: boolean }) | null {
  const list = data.meals.filter(m => m.date === date);
  if (!list.length) return null;
  const t = list.reduce((s, m) => ({ kcal: s.kcal + m.snap.kcal, p: s.p + m.snap.p, c: s.c + m.snap.c, f: s.f + m.snap.f }), { kcal: 0, p: 0, c: 0, f: 0 });
  const missing = MAIN_MEALS.filter(x => !list.some(m => m.meal === x));
  return { ...t, missing, complete: missing.length === 0 };
}
/** Nährwert-Snapshot je Menge in Gramm, Werte des Lebensmittels je 100 g. */
export const snap = (food: Pick<Food, 'kcal' | 'p' | 'c' | 'f'>, qty: number): Nutrients => { const k = qty / 100; return { kcal: Math.round(food.kcal * k), p: +(food.p * k).toFixed(1), c: +(food.c * k).toFixed(1), f: +(food.f * k).toFixed(1) }; };

/** Abgelaufene Fristen (höchstens eine), dann heutige offene Einträge. Vergangene Tage erscheinen nie. */
export function nextActions(data: Pick<State, 'items'>, today: ISODate, nowMin: number): Item[] {
  const due = data.items.filter(i => effStatus(i, today) === 'faellig').sort(byTime);
  const todayDeadline = data.items.filter(i => i.date === today && i.status === 'geplant' && classOfItem(i) === 'deadline');
  const pr: Record<string, number> = { hoch: 0, normal: 1, niedrig: 2 };
  const key = (i: Item): number[] => {
    const m = toMin(i.time); const opt = classOfItem(i) === 'optional_logging' ? 1 : 0;
    const earlier = m != null && m + (i.duration || 0) < nowMin ? 1 : 0;
    return [opt, earlier, m == null ? 9999 : m, pr[i.priority || 'normal'] ?? 1];
  };
  const open = data.items.filter(i => i.date === today && i.status === 'geplant' && classOfItem(i) !== 'deadline')
    .sort((a, b) => { const ka = key(a), kb = key(b); for (let k = 0; k < ka.length; k++) if (ka[k] !== kb[k]) return ka[k]! - kb[k]!; return 0; });
  return [...due.slice(0, 1), ...todayDeadline, ...open].slice(0, 3);
}

export interface CoachHint { text: string; reason: string; action?: { label: string; sheet?: { kind: string; id: string }; go?: string[]; date?: ISODate } | null }
/** Regelbasierter Hinweis: Fokus nach Ziel mit Priorität 1, Tonalität nach Einstellung. */
export function coachHint(data: State, today: ISODate, cfg: unknown): CoachHint {
  const c = normalizeConfig(cfg);
  const top = c.goals[0];
  const focus = top ? `Fokus: ${GOALS[top]}, Priorität 1.` : 'Kein Ziel priorisiert.';
  const say = (base: string, mild: string, push: string) => (c.motivation === 'ruhig' ? base : c.motivation === 'anspornend' ? `${base} ${push}` : `${base} ${mild}`);
  const goal = buildPlan(c).tdays.length;
  const domain = !top ? (goal ? 'training' : 'bewegung')
    : (top === 'fitter' || top === 'abnehmen') ? (goal ? 'training' : 'bewegung')
      : top === 'bewegung' ? 'bewegung'
        : top === 'ernaehrung' ? (c.nutrition.calories ? 'ernaehrung' : 'gewohnheiten')
          : top === 'routinen' ? 'gewohnheiten' : 'termine';
  const days = weekDays(today);
  if (domain === 'training') {
    const t = trainingsInWeek(data, today);
    const planned = data.items.filter(i => i.type === 'training' && i.status === 'geplant' && i.date >= today && i.date <= days[6]!).sort(byTime);
    const reason = `Regel: Wochenziel ${goal} Trainingseinheiten, Woche Mo bis So. ${focus}`;
    if (t >= goal) return { text: say(`Wochenziel erreicht: ${t} von ${goal} Trainingseinheiten erledigt.`, 'Gut gemacht.', 'Stark, das Ziel steht.'), reason };
    if (t + planned.length >= goal) return { text: say(`${t} von ${goal} Trainingseinheiten erledigt. Die nächste ist für ${dayLabelLc(planned[0]!.date, today)} geplant.`, 'Das passt gut in die Woche.', `Noch ${goal - t} bis zum Wochenziel.`), reason };
    const missed = data.items.filter(i => i.type === 'training' && i.status === 'verpasst' && inWeek(i.date, today) && !i.replacedBy).sort(byTime).pop();
    if (missed && today < days[6]!) return { text: say(`${t} von ${goal} Trainingseinheiten erledigt. ${missed.title} am ${WD[wdIdx(missed.date)]} hat nicht stattgefunden.`, 'Diese Woche ist noch ein Ersatz möglich, wenn es passt.', 'Ein Ersatz in dieser Woche bringt dich ans Ziel.'), reason, action: { label: 'Ersatztermin wählen', sheet: { kind: 'item', id: missed.id } } };
    const tomorrow = addDays(today, 1);
    const target = tomorrow <= days[6]! ? tomorrow : today;
    return {
      text: say(`${t} von ${goal} Trainingseinheiten erledigt. Für diese Woche ist keine weitere geplant.`, 'Eine kurze Einheit reicht schon.', 'Eine kurze Einheit bringt dich näher ans Ziel.'), reason,
      action: { label: target === today ? '30 Min. Home-Workout heute einplanen' : '30 Min. Home-Workout morgen einplanen', date: target },
    };
  }
  if (domain === 'bewegung') {
    const p = pauseStats(data, today);
    const left = data.items.filter(i => i.routine && i.routine.startsWith('pause') && i.date === today && i.status === 'geplant').length;
    const reason = `Regel: Bewegungspausen an Arbeitstagen, verpasste Pausen werden nicht nachgeholt. ${focus}`;
    if (!p.eligible) return { text: 'Für diese Woche sind keine Bewegungspausen geplant.', reason, action: { label: 'Bewegungspausen einrichten', go: ['einstellungen'] } };
    return { text: say(`${p.done} von ${p.eligible} Bewegungspausen diese Woche erledigt.`, left ? `Heute steht noch ${left === 1 ? 'eine' : left} an.` : 'Jede kurze Runde zählt.', left ? 'Die nächste ist heute dran.' : 'Weiter so.'), reason };
  }
  if (domain === 'ernaehrung') {
    const n = dayNutrition(data, today);
    const reason = `Regel: Hauptmahlzeiten im Ernährungstagebuch, Erfassung ist optional. ${focus}`;
    const k = n ? 3 - n.missing.length : 0;
    return { text: say(`Heute ${k === 1 ? 'ist 1' : `sind ${k}`} von 3 Hauptmahlzeiten eingetragen.`, 'Kurz nachtragen reicht.', 'Trag die nächste gleich nach dem Essen ein.'), reason, action: k < 3 ? { label: 'Mahlzeit eintragen', go: ['erfassen', 'mahlzeit'] } : null };
  }
  if (domain === 'gewohnheiten') {
    const hs = habitStats(data, today, today);
    const reason = `Regel: aktive Gewohnheiten, bewusst ausgelassene Tage zählen nicht. ${focus}`;
    if (!hs.eligible) return { text: 'Es sind noch keine Gewohnheiten aktiv.', reason, action: { label: 'Gewohnheiten wählen', go: ['einstellungen'] } };
    return { text: say(`Gewohnheiten diese Woche: ${hs.done} von ${hs.eligible} erledigt.`, 'Kleine Schritte zählen.', 'Hak die heutigen gleich ab.'), reason, action: { label: 'Zu den Gewohnheiten', go: ['woche'] } };
  }
  const open = data.appointments.filter(a => a.status === 'offen' || a.status === 'aufgeschoben').length;
  const reason = `Regel: offene Einträge unter Termine und Vorsorge. ${focus} Keine medizinische Bewertung.`;
  return { text: open ? `${open} ${open === 1 ? 'Termin ist' : 'Termine sind'} noch nicht vereinbart.` : 'Alle eingetragenen Termine sind vereinbart oder erledigt.', reason, action: { label: 'Termine ansehen', go: ['gesundheit', 'termine'] } };
}

export interface Hint { key: string; icon: string; text: string; action: { label: string; sheet?: { kind: string; id: string }; go?: string[] } }
/** Nur Fristen und Termine. Fristen höchstens einmal pro Kalenderwoche. */
export function hints(data: Pick<State, 'items' | 'appointments' | 'dismissed'>, today: ISODate, cfg: unknown): { list: Hint[]; hidden: number; mode: string } {
  const mode = normalizeConfig(cfg).reminders.intensity;
  const lim = mode === 'sanft' ? { dl: 0, ap: 1, open: false, openDays: 0, max: 1 } : mode === 'deutlich' ? { dl: 7, ap: 7, open: true, openDays: 9999, max: 99 } : { dl: 2, ap: 3, open: true, openDays: 45, max: 3 };
  const wk = `${parse(weekStart(today)).getFullYear()}-${isoWeek(today)}`;
  const out: Hint[] = [];
  data.items.filter(i => classOfItem(i) === 'deadline' && i.status === 'geplant' && daysBetween(today, i.date) <= lim.dl).sort(byTime).forEach(i => {
    const late = i.date < today;
    out.push({ key: `dl-${i.id}-${wk}`, icon: 'flag', text: late ? `Frist für „${i.title}“ ist seit ${dayLabelLc(i.date, today)} abgelaufen. Die Aufgabe bleibt offen, bis du sie erledigst oder verwirfst.` : `„${i.title}“ ist ${i.date === today ? 'heute' : `bis ${dayLabelLc(i.date, today)}`} fällig.`, action: { label: 'Öffnen', sheet: { kind: 'item', id: i.id } } });
  });
  data.appointments.forEach(a => {
    const dd = daysBetween(today, a.date);
    if (a.status === 'vereinbart' && dd >= 0 && dd <= lim.ap)
      out.unshift({ key: `ap-${a.id}-${a.date}`, icon: 'calendar', text: `${a.title} ${dd === 0 ? 'heute' : dd === 1 ? 'morgen' : `in ${dd} Tagen`}${a.time ? ` um ${a.time} Uhr` : ''}.`, action: { label: 'Ansehen', go: ['gesundheit', 'termine'] } });
    if (lim.open && a.status === 'offen' && a.date && dd <= lim.openDays)
      out.push({ key: `of-${a.id}-${wk}`, icon: 'steth', text: `${a.title} ist noch nicht vereinbart.`, action: { label: 'Ansehen', go: ['gesundheit', 'termine'] } });
  });
  const list = out.filter(h => !data.dismissed.includes(h.key));
  return { list: list.slice(0, lim.max), hidden: Math.max(0, list.length - lim.max), mode };
}
