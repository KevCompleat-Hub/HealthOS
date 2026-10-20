/** Pausen, Tageswechsel, Planerzeugung, Änderungsvorschau und Konflikte. 1:1 aus Referenz v5. */
import { PAUSE_KINDS } from '../catalog.js';
import type { EffectivePause, ISODate, Item, Pause, Routine, State } from '../types.js';
import { addDays, byTime, fmtDM, toMin, WD, wdIdx, weekStart } from '../util/date.js';
import { uid } from '../util/ids.js';
import { classOfItem } from './build.js';
import { instanceOf, specAt } from './routines.js';

/** Nur unveränderte, zukünftige Routineninstanzen dürfen von der Planung angepasst werden. */
export const isPlanFree = (it: Item, today: ISODate): boolean =>
  !!it.routine && !it.movedFrom && !it.override && !it.replaces && it.date >= today && (it.status === 'geplant' || it.status === 'pausiert');

export const allPauses = (st: { pauses?: Pause[]; routines?: Routine[] }): EffectivePause[] =>
  [...(st.pauses || []), ...(st.routines || []).filter(r => r.status === 'pausiert').map(r => ({ id: `routine:${r.id}`, routineId: r.id, from: r.pausedSince || '0000-01-01', to: '9999-12-31', scope: 'routine' as const }))];

export function applyPauses(items: Item[], pauses: EffectivePause[] | null | undefined, today: ISODate): Item[] {
  return items.map(it => {
    if (!isPlanFree(it, today)) return it;
    const p = (pauses || []).find(x => it.date >= x.from && it.date <= x.to && (x.scope === 'routine' ? it.routine === x.routineId : (x.scope === 'alle' || it.type === 'training')));
    if (p) return it.status === 'pausiert' && it.pauseId === p.id ? it : { ...it, status: 'pausiert', pauseId: p.id };
    if (it.status === 'pausiert') { const { pauseId, ...rest } = it; return { ...rest, status: 'geplant' }; }
    return it;
  });
}

/** Tageswechsel: tagesgebunden und wöchentlich werden „verpasst“, optional „nicht erfasst“, Fristen bleiben offen. */
export function settle(items: Item[], today: ISODate): Item[] {
  return items.map(it => {
    if (it.status !== 'geplant' || it.date >= today) return it;
    const c = classOfItem(it);
    if (c === 'deadline') return it;
    return { ...it, taskClass: c, status: c === 'optional_logging' ? 'nicht_erfasst' : 'verpasst' };
  });
}

/** Erzeugt Instanzen ab heute bis Ende nächster Woche (oder bis horizon). Idempotent über feste IDs. */
export function materialize<S extends Pick<State, 'items' | 'routines' | 'pauses'>>(st: S, today: ISODate, horizon?: ISODate): S {
  const routines = st.routines || [];
  const rmap = new Map(routines.map(r => [r.id, r]));
  const end = [addDays(weekStart(today), 13), horizon || ''].sort().pop() as ISODate;
  const items: Item[] = [];
  st.items.forEach(it0 => {
    const it = it0.taskClass ? it0 : { ...it0, taskClass: classOfItem(it0) };
    if (!isPlanFree(it, today)) { items.push(it); return; }
    const rt = rmap.get(it.routine as string); const sp = specAt(rt, it.date);
    if (!sp || !rt) return;
    items.push({ ...it, title: sp.title, type: rt.type, kind: sp.kind, time: sp.time, duration: sp.duration, note: sp.note, taskClass: rt.taskClass, priority: rt.priority, goal: rt.goal || null });
  });
  const have = new Set(items.map(i => i.id));
  for (let d = today; d <= end; d = addDays(d, 1)) routines.forEach(rt => {
    const sp = specAt(rt, d); if (!sp) return;
    const id = `r:${rt.id}:${d}`;
    if (!have.has(id)) { have.add(id); items.push(instanceOf(rt, sp, d)); }
  });
  return { ...st, items: settle(applyPauses(items, allPauses(st), today), today) };
}

export interface PlanChange { kind: 'neu' | 'geändert' | 'entfällt'; it: Item; old?: Item }
export function planDiff(a: Item[], b: Item[], today: ISODate): { added: number; changed: number; removed: number; changes: PlanChange[]; kept: number } {
  const fut = (l: Item[]) => new Map(l.filter(i => isPlanFree(i, today)).map(i => [i.id, i]));
  const A_ = fut(a), B_ = fut(b); const changes: PlanChange[] = [];
  B_.forEach((v, k) => {
    const o = A_.get(k);
    if (!o) changes.push({ kind: 'neu', it: v });
    else if (o.time !== v.time || o.duration !== v.duration || o.title !== v.title || o.status !== v.status) changes.push({ kind: 'geändert', it: v, old: o });
  });
  A_.forEach((v, k) => { if (!B_.has(k)) changes.push({ kind: 'entfällt', it: v }); });
  changes.sort((x, y) => byTime(x.it, y.it));
  const n = (k: PlanChange['kind']) => changes.filter(c => c.kind === k).length;
  return { added: n('neu'), changed: n('geändert'), removed: n('entfällt'), changes, kept: b.length - B_.size };
}

export function findConflicts(items: Item[], dates: ISODate[]): string[] {
  const out: string[] = [];
  [...new Set(dates)].forEach(d => {
    const list = items.filter(i => i.date === d && i.time && i.duration && i.status === 'geplant');
    for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
      const A1 = list[a]!, B1 = list[b]!;
      const s1 = toMin(A1.time) as number, e1 = s1 + (A1.duration as number), s2 = toMin(B1.time) as number, e2 = s2 + (B1.duration as number);
      if (s1 < e2 && s2 < e1) out.push(`${WD[wdIdx(d)]}, ${fmtDM(d)}: ${A1.title} (${A1.time}) überschneidet sich mit ${B1.title} (${B1.time}).`);
    }
  });
  return [...new Set(out)];
}

export const pausedAll = (data: { pauses?: Pause[] }, d: ISODate): boolean => (data.pauses || []).some(p => p.scope === 'alle' && d >= p.from && d <= p.to);

/** Ältere Pausen ohne Art (oder mit Grund) in neutrale Pausen überführen. */
export function migratePause(p: { id?: string; kind?: string; reason?: string; from: ISODate; to: ISODate; scope?: string }): Pause {
  const kind = (PAUSE_KINDS[p.kind as string] ? p.kind : (p.reason === 'Urlaub' ? 'urlaub' : 'auszeit')) as Pause['kind'];
  return { id: p.id || uid('p'), kind, from: p.from, to: p.to, scope: p.scope === 'training' ? 'training' : 'alle' };
}
