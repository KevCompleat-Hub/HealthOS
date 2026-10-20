/** Wochenplan aus den Einstellungen (HOS-002). 1:1 aus Referenz v5. */
import { HABIT_LIBRARY, PLACES } from '../catalog.js';
import { normalizeConfig } from '../config.js';
import type { Config, GoalKey, Habit, Item, Plan, PlanRoutine, Priority, TaskClass, Weekday } from '../types.js';
import { hm, r15, toMin, WD, wdist } from '../util/date.js';

export function spreadPick(pool: Weekday[], n: number, fixed: Weekday[] = []): Weekday[] {
  const sel = [...fixed]; const left = pool.filter(d => !sel.includes(d)); const out: Weekday[] = [];
  while (out.length < n && left.length) {
    let best = left[0]!, score = -1;
    left.forEach(d => { const s = sel.length ? Math.min(...sel.map(x => wdist(x, d))) : 0; if (s > score) { score = s; best = d; } });
    sel.push(best); out.push(best); left.splice(left.indexOf(best), 1);
  }
  return out;
}
export function inQuiet(m: number, q: Config['reminders']): boolean {
  const f = toMin(q.quietFrom), t = toMin(q.quietTo);
  if (f == null || t == null || f === t) return false;
  return f > t ? (m >= f || m < t) : (m >= f && m < t);
}
export function fitQuiet(start: number, dur: number, q: Config['reminders']): { m: number; shifted: boolean } {
  const ok = (m: number) => m >= 0 && m + dur <= 1440 && !inQuiet(m, q) && !inQuiet(m + Math.max(0, dur - 1), q);
  if (ok(start)) return { m: start, shifted: false };
  const f = toMin(q.quietFrom) as number, t = toMin(q.quietTo) as number;
  const earlier = Math.floor((f - dur - 15) / 15) * 15;
  if (start >= 720 && ok(earlier)) return { m: earlier, shifted: true };
  const later = Math.ceil((t + 15) / 15) * 15;
  if (ok(later)) return { m: later, shifted: true };
  return { m: start, shifted: false };
}
export function planMeta(key: string): { taskClass: TaskClass; goal: GoalKey | null; priority: Priority } {
  if (key.startsWith('train-')) return { taskClass: 'weekly_flexible', goal: 'fitter', priority: 'hoch' };
  if (key.startsWith('pause') || key === 'walk') return { taskClass: 'same_day', goal: 'bewegung', priority: 'normal' };
  if (key === 'weigh') return { taskClass: 'optional_logging', goal: 'abnehmen', priority: 'niedrig' };
  if (key === 'meals') return { taskClass: 'optional_logging', goal: 'ernaehrung', priority: 'niedrig' };
  if (key === 'review') return { taskClass: 'same_day', goal: 'routinen', priority: 'normal' };
  return { taskClass: 'same_day', goal: null, priority: 'normal' };
}
export const classOfItem = (it: Pick<Item, 'taskClass' | 'routine' | 'type'>): TaskClass =>
  it.taskClass || (it.routine ? planMeta(it.routine).taskClass : it.type === 'training' ? 'weekly_flexible' : 'same_day');

type RawRoutine = Omit<PlanRoutine, 'taskClass' | 'goal' | 'priority'>;

export function buildPlan(cfg: unknown): Plan {
  const c = normalizeConfig(cfg);
  const routines: PlanRoutine[] = [], notes: string[] = [], warn: string[] = [];
  const work = c.work.days, home = c.work.home;
  const push = (r: RawRoutine) => {
    const f = fitQuiet(toMin(r.time) as number, r.duration, c.reminders);
    if (f.shifted) notes.push(`${r.title} liegt um ${hm(f.m)} Uhr, damit nichts in deine Ruhezeit fällt.`);
    routines.push({ ...r, time: hm(f.m), ...planMeta(r.key) });
  };
  const prefDays = [...new Set(c.training.days)].filter(d => d >= 0 && d < 7);
  let freeDay: Weekday | null | undefined = null;
  if (c.training.freeDay) {
    const order = [6, 5, 0, 1, 2, 3, 4];
    const cands = [...order.filter(d => !work.includes(d)), ...order.filter(d => work.includes(d))];
    freeDay = cands.find(d => !prefDays.includes(d));
    if (freeDay == null) freeDay = cands[0];
  }
  const avail = [0, 1, 2, 3, 4, 5, 6].filter(d => d !== freeDay);
  const per = Math.max(0, Math.min(5, Math.round(c.training.perWeek || 0)));
  if ((c.training.perWeek || 0) > 5) warn.push('Es werden höchstens 5 Trainingseinheiten pro Woche geplant.');
  const prefAvail = prefDays.filter(d => avail.includes(d));
  const tdays = (per <= prefAvail.length ? spreadPick(prefAvail, per) : [...prefAvail, ...spreadPick(avail.filter(d => !prefAvail.includes(d)), per - prefAvail.length, prefAvail)]).sort((a, b) => a - b);
  const added = tdays.filter(d => !prefAvail.includes(d));
  if (added.length) notes.push(`Für ${per} Einheiten hat die Planung ${added.map(d => WD[d]).join(', ')} mit möglichst viel Abstand ergänzt.`);
  if (per && prefAvail.length > per) notes.push(`Von deinen ${prefAvail.length} bevorzugten Tagen werden ${per} mit möglichst viel Abstand genutzt.`);
  if (freeDay != null && prefDays.includes(freeDay)) notes.push(`${WD[freeDay]} bleibt als freier Tag frei, obwohl er als Trainingstag gewählt war.`);
  if (!per) notes.push('Keine Trainingseinheiten geplant. Bewegungspausen und Gewohnheiten bleiben aktiv.');
  const places = c.training.places;
  const pickPlace = (d: Weekday) => {
    const pref = !work.includes(d) ? ['rad', 'laufen', 'schwimmen', 'studio', 'zuhause', 'spazieren', 'walkingpad']
      : home.includes(d) ? ['zuhause', 'walkingpad', 'studio', 'laufen', 'rad', 'schwimmen', 'spazieren']
        : ['studio', 'zuhause', 'schwimmen', 'laufen', 'rad', 'walkingpad', 'spazieren'];
    return pref.find(p => places.includes(p)) || null;
  };
  const dur = Math.max(10, Math.min(180, Number(c.training.duration) || 45));
  const lunch = toMin(c.work.lunch) ?? 750, lunchDur = Number(c.work.lunchDur) || 30;
  const wStart = toMin(c.work.start) ?? 510, wEnd = toMin(c.work.end) ?? 1050;
  const tTime = (d: Weekday) => {
    const isWork = work.includes(d);
    if (c.training.slot === 'morgens') return isWork ? Math.max(330, r15(wStart - dur - 30)) : 570;
    if (c.training.slot === 'mittags') return isWork ? lunch : 720;
    return isWork ? Math.min(1380 - dur, r15(wEnd + 60)) : 1020;
  };
  tdays.forEach(d => {
    const p = pickPlace(d); const P = p ? PLACES[p]! : { title: 'Training nach Wahl', kind: 'Sonstiges' };
    push({ key: `train-${d}`, title: P.title, kind: P.kind, type: 'training', days: [d], time: hm(tTime(d)), duration: dur, note: c.training.slot === 'mittags' && work.includes(d) ? 'Ersetzt an diesem Tag die Bewegungspause zur Mittagszeit.' : '' });
  });
  const perDay = Math.max(0, Math.min(2, Number(c.breaks.perDay) || 0));
  const bdur = Math.max(5, Math.min(30, Number(c.breaks.duration) || 15));
  if (perDay && work.length) {
    const lunchTrain = c.training.slot === 'mittags' ? tdays.filter(d => work.includes(d)) : [];
    const hoNote = places.includes('walkingpad') ? 'Walking-Pad oder eine Runde um den Block.' : 'Eine Runde um den Block oder ein paar Dehnübungen.';
    const ofNote = 'Treppe, eine Runde ums Gebäude oder kurz dehnen.';
    const ho1 = work.filter(d => home.includes(d) && !lunchTrain.includes(d)), of1 = work.filter(d => !home.includes(d) && !lunchTrain.includes(d));
    if (ho1.length) push({ key: 'pause1-ho', title: 'Bewegungspause', type: 'bewegung', days: ho1, time: hm(lunch), duration: bdur, note: hoNote });
    if (of1.length) push({ key: 'pause1-buero', title: 'Bewegungspause', type: 'bewegung', days: of1, time: hm(lunch), duration: bdur, note: ofNote });
    if (perDay === 2) {
      const pm = r15((lunch + lunchDur + wEnd) / 2);
      const ho2 = work.filter(d => home.includes(d)), of2 = work.filter(d => !home.includes(d));
      if (ho2.length) push({ key: 'pause2-ho', title: 'Bewegungspause am Nachmittag', type: 'bewegung', days: ho2, time: hm(pm), duration: bdur, note: hoNote });
      if (of2.length) push({ key: 'pause2-buero', title: 'Bewegungspause am Nachmittag', type: 'bewegung', days: of2, time: hm(pm), duration: bdur, note: ofNote });
    }
  }
  if (places.includes('spazieren') && c.goals.some(g => ['bewegung', 'abnehmen', 'werte'].includes(g))) {
    const wd = [6, 5].find(d => d !== freeDay && !tdays.includes(d));
    if (wd != null) push({ key: 'walk', title: 'Spaziergang', type: 'bewegung', days: [wd], time: '11:00', duration: 40, note: 'Gern draußen und ohne Tempo-Vorgabe.' });
  }
  if (c.nutrition.weight) {
    const n = Math.max(1, Math.min(3, Number(c.nutrition.weightPerWeek) || 2));
    push({ key: 'weigh', title: 'Gewicht erfassen', type: 'messen', days: n === 1 ? [0] : n === 2 ? [0, 3] : [0, 2, 4], time: hm(Math.max(360, Math.min(450, wStart - 30))), duration: 2, note: 'Optional. Möglichst unter ähnlichen Bedingungen, zum Beispiel morgens.' });
  }
  if (c.nutrition.calories) push({ key: 'meals', title: 'Mahlzeiten eintragen', type: 'ernaehrung', days: [0, 1, 2, 3, 4, 5, 6], time: '20:30', duration: 5, note: 'Optional. Fehlt ein Eintrag, gilt der Tag als nicht erfasst.' });
  push({ key: 'review', title: 'Wochen-Check-in', type: 'rueckblick', days: [c.review.weeklyDay], time: c.review.weeklyTime, duration: 5, note: 'Etwa 3 bis 5 Minuten. Verschieben oder überspringen ist jederzeit möglich.' });
  const load = [0, 1, 2, 3, 4, 5, 6].map(d => routines.filter(r => r.days.includes(d) && (r.type === 'training' || r.type === 'bewegung')).reduce((s, r) => s + r.duration, 0));
  load.forEach((m, d) => { if (m > 120) warn.push(`${WD[d]}: über zwei Stunden Aktivität geplant. Prüfe, ob das realistisch ist.`); });
  if (per === 5) warn.push('Fünf Trainingseinheiten sind für den Einstieg viel. Du kannst jederzeit reduzieren.');
  const consec = tdays.filter(d => tdays.includes((d + 1) % 7) && !(d === 6 && !tdays.includes(0)));
  if (consec.length) notes.push(`Training an aufeinanderfolgenden Tagen (${consec.map(d => `${WD[d]} und ${WD[(d + 1) % 7]}`).join(', ')}). Prüfe, ob dir das passt.`);
  return {
    routines, freeDay, tdays, notes, warn,
    summary: { trainings: tdays.length, pauses: routines.filter(r => r.key.startsWith('pause')).reduce((s, r) => s + r.days.length, 0), activeMin: load.reduce((s, m) => s + m, 0) },
  };
}
export function suggestHabits(goals: GoalKey[]): string[] {
  const score = (k: string) => goals.reduce((s, g, i) => s + (HABIT_LIBRARY[k]!.goals.includes(g) ? 6 - i : 0), 0);
  const top = Object.keys(HABIT_LIBRARY).filter(k => k !== 'vielfalt').map(k => [k, score(k)] as [string, number]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  return top.length ? top : ['wasser', 'treppe', 'bildschirm'];
}
export function syncHabits(habits: Habit[] | null | undefined, cfg: unknown): Habit[] {
  const want = new Set(normalizeConfig(cfg).habits);
  const out = (habits || []).map(h => (h.lib && !h.pinned ? { ...h, active: want.has(h.lib) } : h));
  want.forEach(k => { if (!out.some(h => h.lib === k)) out.push({ id: `h-${k}`, lib: k, name: HABIT_LIBRARY[k]!.name, active: true }); });
  return out;
}
