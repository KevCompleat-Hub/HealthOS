/** Routinen mit Versionen und Wochentags-Ausnahmen (HOS-004). 1:1 aus Referenz v5. */
import type { ISODate, Item, ItemStatus, PlanRoutine, Routine, RoutineVersion, Spec } from '../types.js';
import { daysBetween, wdIdx, WD, weekStart } from '../util/date.js';
import { buildPlan } from './build.js';

export const versionAt = (rt: Routine, date: ISODate): RoutineVersion | null =>
  [...(rt.versions || [])].sort((a, b) => a.validFrom.localeCompare(b.validFrom)).filter(v => v.validFrom <= date).pop() || null;
export const weeksBetween = (a: ISODate, b: ISODate): number => Math.round(daysBetween(weekStart(a), weekStart(b)) / 7);

/** Was eine Routine an einem Tag vorsieht, oder null. */
export function specAt(rt: Routine | null | undefined, date: ISODate): Spec | null {
  if (!rt) return null;
  if (rt.status === 'archiviert' && date >= (rt.archivedFrom || '0000-01-01')) return null;
  const v = versionAt(rt, date); if (!v) return null;
  const wd = wdIdx(date);
  if (!v.days.includes(wd)) return null;
  if ((v.interval || 1) > 1 && ((weeksBetween(v.validFrom, date) % v.interval!) + v.interval!) % v.interval! !== 0) return null;
  const ex = (rt.exceptions || []).filter(e => e.weekday === wd && e.validFrom <= date).sort((a, b) => a.validFrom.localeCompare(b.validFrom)).pop();
  return { title: v.title, kind: v.kind || null, time: ex && ex.time ? ex.time : v.time, duration: ex && ex.duration ? ex.duration : v.duration, note: v.note || '', exceptionId: ex ? ex.id : null };
}
export const specText = (v: Pick<RoutineVersion, 'days' | 'interval' | 'time' | 'duration'>): string =>
  `${v.days.map(d => WD[d]).join(' ')}${(v.interval || 1) > 1 ? ', alle 2 Wochen' : ''}, ${v.time} Uhr, ${v.duration} Min.`;

export function routineFromPlan(r: PlanRoutine, validFrom: ISODate): Routine {
  return {
    id: r.key, source: 'plan', customized: false, status: 'aktiv', type: r.type, goal: r.goal, taskClass: r.taskClass, priority: r.priority,
    versions: [{ validFrom, title: r.title, kind: r.kind || null, days: [...r.days], time: r.time, duration: r.duration, note: r.note || '', interval: 1 }],
    exceptions: [], history: [{ at: validFrom, text: 'Aus dem Wochenplan erstellt' }],
  };
}
type SpecLike = Pick<RoutineVersion, 'title' | 'time' | 'duration' | 'note' | 'days' | 'kind' | 'interval'>;
export const sameSpec = (v: SpecLike, r: SpecLike): boolean =>
  v.title === r.title && v.time === r.time && v.duration === r.duration && (v.note || '') === (r.note || '') && JSON.stringify(v.days) === JSON.stringify(r.days) && (v.kind || null) === (r.kind || null) && (v.interval || 1) === (r.interval || 1);

export function addVersion(rt: Routine, validFrom: ISODate, spec: Partial<RoutineVersion>, text: string): Routine {
  const base = versionAt(rt, validFrom) || rt.versions[rt.versions.length - 1];
  const v = { ...base, ...spec, validFrom } as RoutineVersion;
  const versions = rt.versions.filter(x => x.validFrom !== validFrom).concat([v]).sort((a, b) => a.validFrom.localeCompare(b.validFrom));
  return { ...rt, versions, history: [...(rt.history || []), { at: validFrom, text }] };
}

/** Wochenplan aus den Einstellungen in Routinen übertragen. Angepasste Routinen bleiben unverändert. */
export function syncPlanRoutines(routines: Routine[] | null | undefined, cfg: unknown, fromDate: ISODate): { routines: Routine[]; kept: Routine[] } {
  const plan = buildPlan(cfg);
  let out: Routine[] = (routines || []).map(r => ({ ...r }));
  plan.routines.forEach(r => {
    const i = out.findIndex(x => x.id === r.key);
    if (i < 0) { out.push(routineFromPlan(r, fromDate)); return; }
    let rt = out[i]!;
    if (rt.customized) return;
    if (rt.status === 'archiviert') rt = { ...rt, status: 'aktiv', archivedFrom: undefined, history: [...(rt.history || []), { at: fromDate, text: 'Durch den Wochenplan wieder aktiv' }] };
    const cur = versionAt(rt, fromDate) || rt.versions[rt.versions.length - 1];
    const spec = { title: r.title, kind: r.kind || null, days: [...r.days], time: r.time, duration: r.duration, note: r.note || '', interval: 1 };
    if (!cur || !sameSpec(cur, spec)) rt = addVersion(rt, fromDate, spec, 'Wochenplan angepasst');
    out[i] = { ...rt, type: r.type, goal: r.goal, taskClass: r.taskClass, priority: r.priority };
  });
  out = out.map(rt => (rt.source === 'plan' && !rt.customized && rt.status !== 'archiviert' && !plan.routines.some(r => r.key === rt.id)
    ? { ...rt, status: 'archiviert', archivedFrom: fromDate, history: [...(rt.history || []), { at: fromDate, text: 'Nicht mehr im Wochenplan, archiviert' }] } : rt));
  return { routines: out, kept: out.filter(rt => rt.source === 'plan' && rt.customized && rt.status !== 'archiviert') };
}

export const instanceOf = (rt: Routine, sp: Spec, date: ISODate, status: ItemStatus = 'geplant'): Item =>
  ({ id: `r:${rt.id}:${date}`, routine: rt.id, title: sp.title, type: rt.type, kind: sp.kind, date, time: sp.time, duration: sp.duration, note: sp.note || '', status, taskClass: rt.taskClass, priority: rt.priority, goal: rt.goal || null });
