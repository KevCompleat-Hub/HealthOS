/** Datengrundlage und damals geltendes Wochenziel (HOS-006). 1:1 aus Referenz v5. */
import { specAt } from '../plan/routines.js';
import { pausedAll } from '../plan/materialize.js';
import { trainingsInWeek } from '../status.js';
import type { Coverage, ISODate, State } from '../types.js';
import { addDays, avg, isoWeek, weekDays } from '../util/date.js';

export function planStart(data: Pick<State, 'items'>): ISODate | null { let s: ISODate | null = null; data.items.forEach(i => { if (i.routine && (!s || i.date < s)) s = i.date; }); return s; }
export function habitStart(data: Pick<State, 'habitLog'>): ISODate | null { let s: ISODate | null = null; Object.keys(data.habitLog || {}).forEach(k => { const d = k.split('|')[1] as ISODate; if (!s || d < s) s = d; }); return s; }

/** Nur eine vergangene Woche mit Plan an allen Tagen ist „vollständig“. Nur dann bedeutet 0 Trainings nachweislich keine Aktivität. */
export function weekCoverage(data: Pick<State, 'items' | 'workouts' | 'pauses'>, ws: ISODate, today: ISODate, ps: ISODate | null = planStart(data)): Coverage {
  const we = addDays(ws, 6);
  if (ws > today) return 'zukunft';
  if (!ps || we < ps) return data.workouts.some(w => w.date >= ws && w.date <= we) ? 'teilweise' : 'keine';
  if (ws < ps) return 'teilweise';
  if (weekDays(ws).every(d => pausedAll(data, d))) return 'pausiert';
  if (we >= today) return 'laufend';
  return 'vollstaendig';
}
/** Wochenziel aus den damals gültigen Routinenversionen der Trainingsroutinen. */
export function goalAt(data: Pick<State, 'routines'>, ws: ISODate): number {
  let n = 0;
  (data.routines || []).forEach(rt => {
    if (rt.type !== 'training' || rt.taskClass !== 'weekly_flexible') return;
    weekDays(ws).forEach(d => { if (rt.status === 'pausiert' && rt.pausedSince && d >= rt.pausedSince) return; if (specAt(rt, d)) n++; });
  });
  return n;
}
export interface SeriesPoint { key: ISODate; label: string; value: number | null; faint: boolean; coverage: Coverage; goal: number | null }
export function trainingSeries(data: Pick<State, 'items' | 'workouts' | 'pauses' | 'routines'>, endWs: ISODate, n: number, today: ISODate): SeriesPoint[] {
  const ps = planStart(data);
  return Array.from({ length: n }, (_, k) => addDays(endWs, -7 * (n - 1 - k))).map(s => {
    const cov = weekCoverage(data, s, today, ps);
    const cnt = trainingsInWeek(data, s);
    const value = cov === 'keine' || cov === 'pausiert' || cov === 'zukunft' ? null : cnt;
    return { key: s, label: `KW${isoWeek(s)}`, value, faint: cov === 'teilweise' || cov === 'laufend', coverage: cov, goal: cov === 'keine' ? null : goalAt(data, s) };
  });
}
/** Durchschnitt nur aus vollständig erfassten Wochen, mindestens zwei. */
export function avgComplete(series: SeriesPoint[]): { avg: number | null; n: number; goal: number | null } {
  const v = series.filter(x => x.coverage === 'vollstaendig');
  return v.length >= 2 ? { avg: avg(v.map(x => x.value as number)), n: v.length, goal: avg(v.map(x => x.goal || 0)) } : { avg: null, n: v.length, goal: null };
}
export function gapText(series: SeriesPoint[]): string {
  const g = series.filter(x => x.coverage === 'keine' || x.coverage === 'pausiert'), t = series.filter(x => x.coverage === 'teilweise' || x.coverage === 'laufend');
  const parts: string[] = [];
  if (g.length) parts.push(`${g.length === 1 ? 'Für' : 'Für die'} ${g.map(x => x.label).join(', ')} liegen keine Plan-Daten vor oder die Woche war pausiert. Diese ${g.length === 1 ? 'Woche wird' : 'Wochen werden'} als Datenlücke gezeigt, nicht als 0.`);
  if (t.length) parts.push(`${t.map(x => x.label).join(', ')} ${t.length === 1 ? 'ist' : 'sind'} unvollständig erfasst und ${t.length === 1 ? 'fließt' : 'fließen'} nicht in Durchschnitte ein.`);
  return parts.join(' ');
}
