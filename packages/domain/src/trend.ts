/**
 * Geglätteter Gewichtstrend (Erweiterung nach M1, W10). Ändert keine bestehende Regel.
 * Methode: zeitbasierter gleitender Mittelwert. Für jeden Messtag zählt der Durchschnitt aller Messungen der letzten 7 Kalendertage
 * (einschließlich des Tages). Fehlende Tage werden nicht aufgefüllt, mehrere Messungen an einem Tag fließen einzeln ein.
 */
import type { ISODate, Weight } from './types.js';
import { addDays, daysBetween } from './util/date.js';

export interface TrendPoint { date: ISODate; raw: number; trend: number; n: number }

export function smoothWeights(weights: Pick<Weight, 'date' | 'kg' | 'time'>[], windowDays = 7): TrendPoint[] {
  const list = [...weights].filter(w => Number.isFinite(w.kg)).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  const days = [...new Set(list.map(w => w.date))];
  return days.map(d => {
    const from = addDays(d, -(windowDays - 1));
    const win = list.filter(w => w.date >= from && w.date <= d);
    const sameDay = list.filter(w => w.date === d);
    const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
    return { date: d, raw: Math.round(avg(sameDay.map(w => w.kg)) * 10) / 10, trend: Math.round(avg(win.map(w => w.kg)) * 100) / 100, n: win.length };
  });
}

/**
 * Veränderung des Trends über einen Zeitraum. Aussagekräftig nur, wenn am Ende und am Anfang
 * jeweils mindestens minN Messungen im Fenster liegen und der Abstand mindestens 10 Tage beträgt.
 */
export function trendChange(weights: Pick<Weight, 'date' | 'kg' | 'time'>[], today: ISODate, spanDays = 14, minN = 3): { now: number; before: number; delta: number; days: number } | null {
  const pts = smoothWeights(weights.filter(w => w.date <= today));
  if (!pts.length) return null;
  const last = pts[pts.length - 1]!;
  if (last.n < minN || daysBetween(last.date, today) > 7) return null;
  const target = addDays(last.date, -spanDays);
  const before = [...pts].reverse().find(p => p.date <= target && p.n >= minN);
  if (!before || daysBetween(before.date, last.date) < 10) return null;
  return { now: last.trend, before: before.trend, delta: Math.round((last.trend - before.trend) * 10) / 10, days: daysBetween(before.date, last.date) };
}
