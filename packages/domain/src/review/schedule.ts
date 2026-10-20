/** Review-Zeitpunkte, Check-in-Termin und Abschluss (HOS-006). 1:1 aus Referenz v5. */
import { A } from '../actions.js';
import { normalizeConfig } from '../config.js';
import type { ISODate, Item, ReviewKind, ReviewRecord, State } from '../types.js';
import { addDays, byTime, daysBetween, fmtYm, isoWeek, monthLast, prevYm, toMin, wdIdx, weekStart, ymOf } from '../util/date.js';

export interface ReviewDescriptor {
  kind: ReviewKind | 'combined'; key: string; keys: string[]; period: string; weekPeriod?: ISODate; slotDate?: ISODate; windowEnd?: ISODate;
  label: string; sub?: string; minutes: string; mode?: 'voll' | 'kurz';
}
/** Analysierter Zeitraum (target) und Check-in-Termin (start) sind getrennt. */
export function weeklyWindow(today: ISODate, cfg: unknown): { target: ISODate; start: ISODate; end: ISODate } {
  const c = normalizeConfig(cfg); const wd = c.review.weeklyDay; const ws = weekStart(today);
  if (wd >= 4) {
    const target = wdIdx(today) >= wd ? ws : addDays(ws, -7);
    return { target, start: addDays(target, wd), end: addDays(target, 9) };
  }
  const target = addDays(ws, -7);
  return { target, start: addDays(ws, wd), end: addDays(ws, wd + 3) };
}
export function monthlyTarget(today: ISODate): string | null {
  const ym = ymOf(today);
  if (daysBetween(today, monthLast(ym)) <= 2) return ym;
  if (Number(today.slice(8)) <= 7) return prevYm(ym);
  return null;
}
export function weeklyDescriptor(today: ISODate, cfg: unknown): ReviewDescriptor {
  const w = weeklyWindow(today, cfg);
  return { kind: 'week', key: `W:${w.target}`, keys: [`W:${w.target}`], period: w.target, weekPeriod: w.target, slotDate: w.start, windowEnd: w.end, label: `Wochen-Check-in KW ${isoWeek(w.target)}`, minutes: '3 bis 5' };
}
export function monthlyDescriptor(ym: string): ReviewDescriptor { return { kind: 'month', key: `M:${ym}`, keys: [`M:${ym}`], period: ym, label: `Monatsreview ${fmtYm(ym)}`, minutes: '10 bis 15' }; }
export function combinedDescriptor(w: ReviewDescriptor, m: ReviewDescriptor): ReviewDescriptor {
  return { kind: 'combined', key: m.key, keys: [w.key, m.key], period: m.period, weekPeriod: w.weekPeriod, slotDate: w.slotDate, windowEnd: w.windowEnd, label: `Wochen- und Monatsreview`, sub: `KW ${isoWeek(w.weekPeriod as ISODate)} und ${fmtYm(m.period)}`, minutes: '10 bis 15' };
}
export const reviewOpen = (r: ReviewRecord | undefined, today: ISODate): boolean => !r || ((r.status === 'offen' || r.status === 'verschoben') && !(r.snoozedUntil && r.snoozedUntil > today));
export function reviewDue(data: Pick<State, 'reviews'>, cfg: unknown, today: ISODate, nowMin: number): ReviewDescriptor[] {
  const c = normalizeConfig(cfg); const rs = data.reviews || {}; const out: ReviewDescriptor[] = [];
  if (c.review.monthly) { const ym = monthlyTarget(today); if (ym && reviewOpen(rs[`M:${ym}`], today)) out.push(monthlyDescriptor(ym)); }
  const w = weeklyDescriptor(today, c);
  const started = today > (w.slotDate as ISODate) || (today === w.slotDate && nowMin >= (toMin(c.review.weeklyTime) ?? 1080));
  if (started && today <= (w.windowEnd as ISODate) && reviewOpen(rs[w.key], today)) out.push(w);
  return out;
}
/** Sind Woche und Monat gleichzeitig fällig, wird ein gemeinsamer Ablauf angeboten. */
export function reviewOffer(data: Pick<State, 'reviews'>, cfg: unknown, today: ISODate, nowMin: number): ReviewDescriptor | null {
  const due = reviewDue(data, cfg, today, nowMin);
  const w = due.find(x => x.kind === 'week'), m = due.find(x => x.kind === 'month');
  return w && m ? combinedDescriptor(w, m) : due[0] || null;
}
export function reviewForDate(date: ISODate, cfg: unknown): ReviewDescriptor { return weeklyDescriptor(date, cfg); }
export function nextWeeklyDate(today: ISODate, cfg: unknown, data: Pick<State, 'reviews'>): ISODate | null {
  const c = normalizeConfig(cfg);
  for (let i = 0; i < 14; i++) {
    const d = addDays(today, i);
    if (wdIdx(d) !== c.review.weeklyDay) continue;
    const r = (data.reviews || {})[`W:${weeklyWindow(d, c).target}`];
    if (!r || (r.status !== 'abgeschlossen' && r.status !== 'uebersprungen')) return d;
  }
  return null;
}
/** Zugehöriger Check-in-Termin im Plan. Folgt einer Verschiebung, nie ein Termin vor dem Check-in-Tag. */
export function slotItem(d: Pick<State, 'items'>, rv: Pick<ReviewDescriptor, 'slotDate' | 'windowEnd'>): Item | null {
  if (!rv.slotDate) return null;
  const list = d.items.filter(i => i.routine === 'review');
  let it: Item | null = list.find(i => i.date === rv.slotDate && !i.movedFrom) || list.find(i => i.date === rv.slotDate) || null;
  for (let k = 0; it && it.status === 'verschoben' && k < 10; k++) { const from: Item = it; it = list.find(i => i.movedFrom === from.date && i.date === from.movedTo) || null; }
  if (it) return ['geplant', 'verpasst'].includes(it.status) ? it : null;
  const end = rv.windowEnd || addDays(rv.slotDate, 3);
  return list.filter(i => i.date >= (rv.slotDate as ISODate) && i.date <= end && ['geplant', 'verpasst'].includes(i.status)).sort(byTime)[0] || null;
}
export function completeReviewState(d: State, rv: Pick<ReviewDescriptor, 'keys' | 'slotDate' | 'windowEnd'>, today: ISODate, questionIds: string[], mode?: 'voll' | 'kurz' | null): State {
  let n = d;
  rv.keys.forEach(k => {
    const kind: ReviewKind = k.startsWith('W:') ? 'week' : 'month';
    const cur: ReviewRecord = (n.reviews || {})[k] || { kind, status: 'offen', measures: [] };
    if (cur.status === 'abgeschlossen') return;
    n = { ...n, reviews: { ...(n.reviews || {}), [k]: { ...cur, kind, status: 'abgeschlossen', at: today, snoozedUntil: null, questionIds, mode: mode || 'voll', combined: rv.keys.length > 1 } } };
  });
  const it = slotItem(n, rv);
  if (it) n = it.status === 'verpasst' ? A.lateLog(n, it.id) : A.setItem(n, it.id, { status: 'erledigt' });
  return n;
}
