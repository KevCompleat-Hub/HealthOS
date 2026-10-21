/** Kennzahlen für Wochen- und Monatsreview (HOS-006). 1:1 aus Referenz v5. Keine Gesamtbewertung. */
import { normalizeConfig } from '../config.js';
import { classOfItem } from '../plan/build.js';
import { pausedAll } from '../plan/materialize.js';
import { versionAt } from '../plan/routines.js';
import { dayNutrition, habitOn, isLimit, trainingsInWeek, weeklyHabitCounts, weeklyTarget } from '../status.js';
import type { GoalKey, ISODate, Item, State, Weight } from '../types.js';
import { addDays, avg, daysBetween, fmtNum, monthLast, pct, signed, WD_LONG, wdIdx, weekDays, weekStart } from '../util/date.js';
import { avgComplete, gapText, goalAt, habitStart, planStart, trainingSeries, weekCoverage } from './coverage.js';

export interface Adherence { done: number; eligible: number; missed: number; rate: number | null }
export function adherence(items: Item[], from: ISODate, to: ISODate, today: ISODate, pred: (i: Item) => boolean = () => true): Adherence {
  const l = items.filter(i => i.date >= from && i.date <= to && pred(i) && !['verschoben', 'pausiert', 'ausgelassen'].includes(i.status) && !(i.status === 'geplant' && i.date >= today) && classOfItem(i) !== 'deadline');
  const done = l.filter(i => i.status === 'erledigt').length;
  return { done, eligible: l.length, missed: l.filter(i => i.status === 'verpasst').length, rate: l.length ? done / l.length : null };
}
export const isPause = (i: Item): boolean => !!i.routine && i.routine.startsWith('pause');
export const isTrainingPlan = (i: Item): boolean => i.type === 'training';

export interface HabitRate { id: string; name: string; lib?: string; custom?: boolean; done: number; eligible: number; rate: number | null }
/** Tage vor dem ersten Eintrag sind keine Daten, nicht „nicht erledigt“. */
export function habitAdherence(data: Pick<State, 'habits' | 'habitLog' | 'pauses'>, from: ISODate, to: ISODate, today: ISODate): { per: HabitRate[]; done: number; eligible: number; rate: number | null } {
  const hs0 = habitStart(data);
  const per = data.habits.filter(h => (h.active !== false || h.inactiveFrom) && !isLimit(h)).map(h => {
    if (weeklyTarget(h)) { const c = hs0 ? weeklyHabitCounts(data, h, from, to, today, hs0) : { done: 0, eligible: 0 }; return { id: h.id, name: h.name, lib: h.lib, custom: h.custom, done: c.done, eligible: c.eligible, rate: c.eligible ? c.done / c.eligible : null }; }
    let done = 0, eligible = 0;
    for (let d = from; d <= to && d <= today; d = addDays(d, 1)) {
      if (!hs0 || d < hs0 || pausedAll(data, d) || !habitOn(h, d)) continue;
      const v = data.habitLog[`${h.id}|${d}`];
      if (v === 'skip') continue;
      eligible++; if (v === 'done') done++;
    }
    return { id: h.id, name: h.name, lib: h.lib, custom: h.custom, done, eligible, rate: eligible ? done / eligible : null };
  });
  const done = per.reduce((s, h) => s + h.done, 0), eligible = per.reduce((s, h) => s + h.eligible, 0);
  return { per, done, eligible, rate: eligible ? done / eligible : null };
}
export function windowCoverage(data: Pick<State, 'items'>, from: ISODate, to: ISODate, today: ISODate): number { const ps = planStart(data); if (!ps) return 0; const a = from > ps ? from : ps, b = to < today ? to : today; return a > b ? 0 : daysBetween(a, b) + 1; }
export function avgIn<K extends string>(list: ({ date: ISODate } & Record<K, number>)[], from: ISODate, to: ISODate, key: K): { avg: number; n: number } | null {
  const v = list.filter(x => x.date >= from && x.date <= to).map(x => x[key]); return v.length ? { avg: avg(v), n: v.length } : null;
}
export function weightChange(weights: Weight[], from: ISODate, to: ISODate): { n: number; delta: number | null; from?: ISODate; to?: ISODate } {
  const l = weights.filter(w => w.date >= from && w.date <= to).sort((a, b) => a.date.localeCompare(b.date));
  if (l.length < 4 || daysBetween(l[0]!.date, l[l.length - 1]!.date) < 14) return { n: l.length, delta: null };
  const k = Math.max(2, Math.floor(l.length / 4));
  return { n: l.length, delta: avg(l.slice(-k).map(w => w.kg)) - avg(l.slice(0, k).map(w => w.kg)), from: l[0]!.date, to: l[l.length - 1]!.date };
}
export function trainingHistory(data: Pick<State, 'items'>, ws: ISODate, weeks: number) {
  let done = 0, planned = 0;
  for (let k = 0; k < weeks; k++) { const s = addDays(ws, -7 * k); const a = adherence(data.items, s, addDays(s, 6), addDays(s, 7), isTrainingPlan); done += a.done; planned += a.eligible; }
  return { done, planned, rate: planned ? done / planned : null, weeks };
}

export function weekMetrics(data: State, ws: ISODate, today: ISODate, cfg: unknown) {
  const c = normalizeConfig(cfg); const days = weekDays(ws); const until = days[6]! < today ? days[6]! : today;
  const goal = goalAt(data, ws); const coverage = weekCoverage(data, ws, today);
  const prev = addDays(ws, -7);
  const its = data.items.filter(i => i.date >= ws && i.date <= days[6]!);
  const trDone = trainingsInWeek(data, ws);
  const trMissed = its.filter(i => i.type === 'training' && i.status === 'verpasst' && !i.replacedBy);
  const pa = adherence(data.items, ws, until, today, isPause);
  const paMissed = its.filter(i => isPause(i) && i.status === 'verpasst');
  const officeMissed = paMissed.filter(i => (i.routine as string).endsWith('buero')).length;
  const ha = habitAdherence(data, ws, until, today);
  const routines = [...new Set(its.filter(i => i.routine).map(i => i.routine as string))].map(id => {
    const a = adherence(data.items, ws, until, today, i => i.routine === id);
    const rt = data.routines.find(r => r.id === id);
    return { id, title: rt ? (versionAt(rt, ws) || rt.versions[0]!).title : id, ...a };
  }).filter(r => r.eligible > 0);
  const w = avgIn(data.weights, ws, days[6]!, 'kg'), wPrev = avgIn(data.weights, prev, addDays(prev, 6), 'kg');
  const st = avgIn(data.steps, ws, days[6]!, 'count'), stPrev = avgIn(data.steps, prev, addDays(prev, 6), 'count');
  const nutDays = days.filter(d => d <= until && dayNutrition(data, d)), nutFull = nutDays.filter(d => dayNutrition(data, d)!.complete);
  const weakHabit = ha.per.filter(h => h.eligible >= 4 && (h.rate as number) < 0.4).sort((a, b) => (a.rate as number) - (b.rate as number))[0] || null;
  const positives: string[] = [], obstacles: string[] = [];
  if (coverage !== 'keine') {
    if (goal && trDone >= goal) positives.push(`Trainingsziel erreicht: ${trDone} von ${goal} Einheiten.`);
    else if (trDone > 0) positives.push(`${trDone} ${trDone === 1 ? 'Trainingseinheit' : 'Trainingseinheiten'} geschafft.`);
    if (pa.eligible >= 3 && (pa.rate as number) >= 0.7) positives.push(`Bewegungspausen an ${pa.done} von ${pa.eligible} Tagen.`);
    const bestHabit = ha.per.filter(h => h.done >= 5).sort((a, b) => b.done - a.done)[0];
    if (bestHabit) positives.push(`„${bestHabit.name}“ an ${bestHabit.done} Tagen.`);
    if (st && stPrev && st.n >= 3 && stPrev.n >= 3 && st.avg > stPrev.avg * 1.1) positives.push(`Im Schnitt mehr Schritte als in der Vorwoche (${fmtNum(st.avg)} statt ${fmtNum(stPrev.avg)}).`);
    trMissed.forEach(i => obstacles.push(`${i.title} am ${WD_LONG[wdIdx(i.date)]} hat nicht stattgefunden.`));
    if (paMissed.length >= 2 && officeMissed / paMissed.length >= 0.6 && c.work.days.some(d => !c.work.home.includes(d))) obstacles.push(`${paMissed.length} Bewegungspausen haben nicht stattgefunden, davon ${officeMissed} an Bürotagen.`);
    else if (paMissed.length >= 1) obstacles.push(`${paMissed.length} ${paMissed.length === 1 ? 'Bewegungspause hat' : 'Bewegungspausen haben'} nicht stattgefunden.`);
    if (weakHabit) obstacles.push(`„${weakHabit.name}“ war schwer umzusetzen (${weakHabit.done} von ${weakHabit.eligible} Tagen).`);
  }
  return {
    ws, until, goal, coverage, trDone, trMissed, trOpen: its.filter(i => i.type === 'training' && i.status === 'geplant' && i.date >= today).length,
    pauses: pa, pauseMissed: paMissed.length, officeMissed, habits: ha, weakHabit, routines,
    weight: w, weightPrev: wPrev, steps: st, stepsPrev: stPrev, nutDays: nutDays.length, nutFull: nutFull.length, nutDue: days.filter(d => d <= until).length,
    positives, obstacles, hist3: trainingHistory(data, ws, 3), pauseHist2: adherence(data.items, addDays(ws, -7), until, today, isPause),
  };
}
export type WeekMetrics = ReturnType<typeof weekMetrics>;

export function monthMetrics(data: State, ym: string, today: ISODate, cfg: unknown) {
  const c = normalizeConfig(cfg);
  const end = monthLast(ym) < today ? monthLast(ym) : today;
  const s30 = addDays(end, -29), p30s = addDays(end, -59), p30e = addDays(end, -30), s90 = addDays(end, -89);
  const series = trainingSeries(data, weekStart(end), 12, today);
  const trNow = avgComplete(series.slice(-4)), trPrev = avgComplete(series.slice(-8, -4)), tr12 = avgComplete(series);
  const cov30 = windowCoverage(data, s30, end, today), cov60 = windowCoverage(data, p30s, p30e, today);
  const pa30 = adherence(data.items, s30, end, today, isPause), pa60 = adherence(data.items, p30s, p30e, today, isPause);
  const ha30 = habitAdherence(data, s30, end, today), ha60 = habitAdherence(data, p30s, p30e, today);
  const firstW = data.weights.length ? data.weights.reduce((m, w) => (w.date < m ? w.date : m), end) : null;
  const wc30 = weightChange(data.weights, s30, end), wc90 = weightChange(data.weights, s90, end), wcAll = firstW && daysBetween(firstW, end) > 90 ? weightChange(data.weights, firstW, end) : null;
  const st30 = avgIn(data.steps, s30, end, 'count'), st60 = avgIn(data.steps, p30s, p30e, 'count');
  const nut = Array.from({ length: 30 }, (_, k) => addDays(s30, k)).filter(d => dayNutrition(data, d));
  const routines = data.routines.filter(r => r.status !== 'archiviert').map(r => {
    const a = adherence(data.items, addDays(end, -27), end, today, i => i.routine === r.id);
    return { id: r.id, title: (versionAt(r, end) || r.versions[r.versions.length - 1]!).title, ...a };
  }).filter(r => r.eligible >= 4);
  /* Trend nur, wenn beide Vergleichszeiträume ausreichend erfasst sind */
  const trend = (a: number | null, b: number | null, ok: boolean, tol = 0.1) => (!ok || a == null || b == null ? 'zu wenige Daten' : a > b * (1 + tol) ? 'steigend' : a < b * (1 - tol) ? 'rückläufig' : 'stabil');
  const rateOk = cov30 >= 21 && cov60 >= 21;
  const goals = c.goals.map((g: GoalKey) => {
    if (g === 'fitter') return { g, status: trNow.avg != null ? `Ø ${fmtNum(trNow.avg, 1)} Trainings pro Woche bei damals geltendem Ziel Ø ${fmtNum(trNow.goal as number, 1)} (${trNow.n} vollständige Wochen)` : 'zu wenige vollständig erfasste Wochen', trend: trend(trNow.avg, trPrev.avg, trNow.avg != null && trPrev.avg != null) };
    if (g === 'bewegung') return { g, status: pa30.eligible ? `${pct(pa30.done, pa30.eligible)} % der Bewegungspausen, Daten aus ${cov30} von 30 Tagen${st30 ? `, Ø ${fmtNum(st30.avg)} Schritte an ${st30.n} Tagen` : ''}` : 'keine Daten zu Bewegungspausen', trend: trend(pa30.rate, pa60.rate, rateOk) };
    if (g === 'abnehmen') return { g, status: wc30.delta != null ? `Gewicht ${signed(wc30.delta)} kg in 30 Tagen (${wc30.n} Messungen)` : `zu wenige Messungen für einen Vergleich (${wc30.n})`, trend: wc30.delta == null ? 'zu wenige Daten' : wc30.delta < -0.3 ? 'gesunken' : wc30.delta > 0.3 ? 'gestiegen' : 'stabil' };
    if (g === 'ernaehrung') return { g, status: nut.length ? `Mahlzeiten an ${nut.length} von 30 Tagen erfasst` : 'keine Mahlzeiten erfasst', trend: nut.length < 10 ? 'zu wenige Daten' : 'erfasst' };
    if (g === 'werte') return { g, status: 'Laborwerte nur als fiktive Demo, siehe Gesundheit', trend: 'keine Bewertung' };
    return { g, status: ha30.eligible ? `Gewohnheiten zu ${pct(ha30.done, ha30.eligible)} % in 30 Tagen` : 'keine Einträge zu Gewohnheiten', trend: trend(ha30.rate, ha60.rate, ha30.eligible >= 14 && ha60.eligible >= 14) };
  });
  return {
    ym, end, s30, cov30, cov60, planStart: planStart(data),
    training: { now: trNow, prev: trPrev, w12: tr12, series, gaps: gapText(series), goalNow: goalAt(data, weekStart(today)) },
    pauses: { now: pa30, prev: pa60 }, habits: { now: ha30, prev: ha60 }, weight: { wc30, wc90, wcAll, firstW }, steps: { now: st30, prev: st60 }, nutDays: nut.length,
    good: routines.filter(r => (r.rate as number) >= 0.7), problem: routines.filter(r => (r.rate as number) < 0.5), routines, goals,
  };
}
export type MonthMetrics = ReturnType<typeof monthMetrics>;
