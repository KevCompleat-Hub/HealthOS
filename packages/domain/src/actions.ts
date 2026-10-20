/** Zustandsänderungen (rein funktional). 1:1 aus Referenz v5, Objekt „A“. */
import { HABIT_LIBRARY } from './catalog.js';
import { normalizeConfig } from './config.js';
import type { Rec } from './intelligence.js';
import { TAKE_ROUTINES } from './intelligence.js';
import { allPauses, applyPauses, materialize, settle } from './plan/materialize.js';
import { addVersion, sameSpec, specText, versionAt } from './plan/routines.js';
import { snap } from './status.js';
import type { HHMM, ISODate, Item, ItemStatus, ItemType, Pause, RecStateEntry, Routine, RoutineException, RoutineStatus, State, Workout } from './types.js';
import { addDays, fmtDM, WD, WD_LONG, wdIdx } from './util/date.js';
import { clone, uid } from './util/ids.js';

export interface RoutineDraft {
  title: string; kind?: string | null; days: number[]; time: HHMM; duration: number | string; note?: string; interval?: number;
  type: ItemType; goal?: string | null; taskClass: Routine['taskClass']; priority: Routine['priority']; exceptions?: RoutineException[];
}
export interface InstancePatch { time: HHMM; duration: number; title?: string }

export const A = {
  setItem(d: State, id: string, patch: Partial<Item>): State { return { ...d, items: d.items.map(i => (i.id === id ? { ...i, ...patch } : i)) }; },
  toggleItem(d: State, id: string, today?: ISODate): State {
    const it = d.items.find(i => i.id === id); if (!it || !['geplant', 'erledigt'].includes(it.status)) return d;
    const done = it.status !== 'erledigt';
    let workouts = d.workouts;
    if (it.type === 'training') workouts = done
      ? [...workouts, { id: uid('w'), date: it.date, kind: it.kind || 'Krafttraining', duration: it.duration, intensity: null, counts: true, itemId: it.id, source: 'plan' }]
      : workouts.filter(w => w.itemId !== it.id);
    const next = { ...A.setItem(d, id, { status: done ? 'erledigt' : 'geplant' }), workouts };
    return today ? { ...next, items: settle(next.items, today) } : next;
  },
  lateLog(d: State, id: string): State {
    const it = d.items.find(i => i.id === id); if (!it) return d;
    const workouts: Workout[] = it.type === 'training' ? [...d.workouts, { id: uid('w'), date: it.date, kind: it.kind || 'Krafttraining', duration: it.duration, intensity: null, counts: true, itemId: it.id, source: 'nacherfasst' }] : d.workouts;
    return { ...A.setItem(d, id, { status: 'erledigt', lateLogged: true }), workouts };
  },
  setStatus(d: State, id: string, status: ItemStatus): State {
    const it = d.items.find(i => i.id === id); if (!it) return d;
    const next = A.setItem(d, id, { status });
    return it.status === 'erledigt' ? { ...next, workouts: next.workouts.filter(w => w.itemId !== id) } : next;
  },
  moveItem(d: State, id: string, date: ISODate): State {
    const it = d.items.find(i => i.id === id); if (!it) return d;
    const { pauseId, ...rest } = it;
    const copy: Item = { ...rest, id: uid('mv'), date, status: 'geplant', movedFrom: it.date, movedTo: undefined };
    const next = A.setItem(d, id, { status: 'verschoben', movedTo: date });
    return { ...next, items: [...next.items, copy] };
  },
  /** Ersatz für eine verpasste, wöchentlich flexible Einheit innerhalb derselben Woche. Das Original bleibt „verpasst“. */
  replaceInWeek(d: State, id: string, date: ISODate): State {
    const it = d.items.find(i => i.id === id); if (!it || it.replacedBy) return d;
    const { pauseId, ...rest } = it;
    const nid = uid('ers');
    const copy: Item = { ...rest, id: nid, date, status: 'geplant', replaces: it.id, note: `Ersatz für ${WD[wdIdx(it.date)]}, ${fmtDM(it.date)}.` };
    const next = A.setItem(d, id, { replacedBy: nid });
    return { ...next, items: [...next.items, copy] };
  },
  setDeadline(d: State, id: string, date: ISODate): State { return A.setItem(d, id, { date }); },
  deleteItem(d: State, id: string): State { return { ...d, items: d.items.filter(i => i.id !== id), workouts: d.workouts.filter(w => w.itemId !== id) }; },
  addItem(d: State, item: Partial<Item> & Pick<Item, 'title' | 'type' | 'date'>): State {
    return { ...d, items: [...d.items, { id: uid('it'), status: 'geplant', note: '', priority: 'normal', ...item, taskClass: item.taskClass || (item.type === 'training' ? 'weekly_flexible' : 'same_day') } as Item] };
  },
  logWorkout(d: State, w: Omit<Workout, 'id' | 'source' | 'itemId'> & Partial<Pick<Workout, 'source'>>, linkItemId?: string | null): State {
    let next: State = { ...d, workouts: [...d.workouts, { id: uid('w'), source: 'manuell', ...w, itemId: linkItemId || undefined } as Workout] };
    if (linkItemId) { const it = d.items.find(i => i.id === linkItemId); next = A.setItem(next, linkItemId, { status: 'erledigt', lateLogged: it && it.status === 'verpasst' ? true : undefined }); }
    return next;
  },
  addMealItems(d: State, date: ISODate, meal: string, list: [string, number][]): State {
    const add = list.map(([fid, q]) => { const f = d.foods.find(x => x.id === fid)!; return { id: uid('m'), date, meal, name: f.name, qty: q, unit: 'g', snap: snap(f, q), source: 'manuell' }; });
    return { ...d, meals: [...d.meals, ...add] };
  },
  cycleHabit(d: State, hid: string, date: ISODate): State {
    const k = `${hid}|${date}`; const v = d.habitLog[k]; const log = { ...d.habitLog };
    if (!v) log[k] = 'done'; else if (v === 'done') log[k] = 'skip'; else delete log[k];
    return { ...d, habitLog: log };
  },
  addPause(d: State, p: Omit<Pause, 'id'>, today: ISODate): State { const pauses = [...(d.pauses || []), { id: uid('p'), ...p }]; return { ...d, pauses, items: applyPauses(d.items, allPauses({ ...d, pauses }), today) }; },
  removePause(d: State, id: string, today: ISODate): State { const pauses = (d.pauses || []).filter(p => p.id !== id); return { ...d, pauses, items: applyPauses(d.items, allPauses({ ...d, pauses }), today) }; },
  /* ---------- Routinen ---------- */
  saveRoutine(d: State, rtId: string | null, draft: RoutineDraft, validFrom: ISODate, today: ISODate): State {
    const spec = { title: draft.title.trim(), kind: draft.kind || null, days: [...draft.days].sort((a, b) => a - b), time: draft.time, duration: Number(draft.duration), note: (draft.note || '').trim(), interval: draft.interval === 2 ? 2 : 1 };
    const meta = { type: draft.type, goal: (draft.goal || null) as Routine['goal'], taskClass: draft.taskClass, priority: draft.priority };
    let routines: Routine[];
    if (!rtId) {
      routines = [...d.routines, { id: `u-${uid('r')}`, source: 'eigene', customized: true, status: 'aktiv', ...meta, versions: [{ validFrom, ...spec }], exceptions: draft.exceptions || [], history: [{ at: validFrom, text: 'Routine angelegt' }] }];
    } else routines = d.routines.map(rt => {
      if (rt.id !== rtId) return rt;
      const cur = versionAt(rt, validFrom) || rt.versions[rt.versions.length - 1];
      let n: Routine = { ...rt, ...meta, customized: true, exceptions: draft.exceptions || rt.exceptions || [] };
      if (!cur || !sameSpec(cur, spec)) n = addVersion(n, validFrom, spec, `Ab ${fmtDM(validFrom)}: ${specText(spec)}`);
      else n = { ...n, history: [...(n.history || []), { at: today, text: 'Einstellungen der Routine geändert' }] };
      return n;
    });
    return materialize({ ...d, routines }, today);
  },
  routineStatus(d: State, rtId: string, status: RoutineStatus, today: ISODate): State {
    const text = ({ aktiv: 'Wieder aktiv', pausiert: 'Pausiert', archiviert: 'Archiviert' } as Record<string, string>)[status] as string;
    const routines = d.routines.map(rt => {
      if (rt.id !== rtId) return rt;
      const n: Routine = { ...rt, status, history: [...(rt.history || []), { at: today, text }] };
      if (status === 'pausiert') n.pausedSince = today; else delete n.pausedSince;
      if (status === 'archiviert') n.archivedFrom = today; else delete n.archivedFrom;
      return n;
    });
    return materialize({ ...d, routines }, today);
  },
  duplicateRoutine(d: State, rtId: string, today: ISODate): State {
    const rt = d.routines.find(r => r.id === rtId); if (!rt) return d;
    const v = versionAt(rt, today) || rt.versions[rt.versions.length - 1]!;
    const copy: Routine = { ...clone(rt), id: `u-${uid('r')}`, source: 'eigene', customized: true, status: 'pausiert', pausedSince: today, versions: [{ ...v, validFrom: today, title: `${v.title} (Kopie)` }], exceptions: [], history: [{ at: today, text: `Kopie von „${v.title}“, pausiert bis zur Aktivierung` }] };
    delete copy.archivedFrom;
    return materialize({ ...d, routines: [...d.routines, copy] }, today);
  },
  /** Einzeltermin, Routine ab Datum oder dauerhafte Wochentagsausnahme. */
  editInstance(d: State, itemId: string, scope: 'instance' | 'from' | 'weekday', patch: InstancePatch, today: ISODate): State {
    const it = d.items.find(i => i.id === itemId); if (!it) return d;
    if (scope === 'instance' || !it.routine) return materialize(A.setItem(d, itemId, { ...patch, override: true }), today);
    const rt = d.routines.find(r => r.id === it.routine); if (!rt) return d;
    let nrt: Routine;
    if (scope === 'from') nrt = addVersion({ ...rt, customized: true }, it.date, patch, `Ab ${fmtDM(it.date)}: ${patch.title ? `„${patch.title}“, ` : ''}${patch.time} Uhr, ${patch.duration} Min.`);
    else {
      const wd = wdIdx(it.date);
      nrt = { ...rt, customized: true, exceptions: [...(rt.exceptions || []).filter(e => !(e.weekday === wd && e.validFrom === it.date)), { id: uid('ex'), weekday: wd, validFrom: it.date, time: patch.time, duration: patch.duration }], history: [...(rt.history || []), { at: it.date, text: `Ausnahme ab ${fmtDM(it.date)}: jeden ${WD_LONG[wd]} ${patch.time} Uhr, ${patch.duration} Min.` }] };
    }
    return materialize({ ...d, routines: d.routines.map(r => (r.id === rt.id ? nrt : r)) }, today);
  },
  /* ---------- Empfehlungen: nur auf ausdrückliche Zustimmung, ohne Duplikate ---------- */
  recState(d: State, id: string, patch: RecStateEntry): State { return { ...d, recState: { ...(d.recState || {}), [id]: { ...((d.recState || {})[id] || {}), ...patch } } }; },
  acceptRec(d: State, rec: Rec, cfg: unknown, today: ISODate, from?: ISODate): State {
    const vf = from && from > today ? from : today;
    const t = rec.take; let next = d; let target: string | null = null;
    if (t.kind === 'routine') {
      const id = `vorschlag-${t.key}`; target = id;
      const spec = TAKE_ROUTINES[t.key]!(normalizeConfig(cfg));
      const ex = d.routines.find(r => r.id === id);
      let routines = d.routines;
      if (!ex) routines = [...routines, { id, source: 'empfehlung', customized: true, status: 'aktiv', type: spec.type, goal: spec.goal, taskClass: spec.taskClass, priority: spec.priority, versions: [{ validFrom: vf, title: spec.title, kind: null, days: spec.days, time: spec.time, duration: spec.duration, note: spec.note, interval: 1 }], exceptions: [], history: [{ at: vf, text: 'Aus einer Empfehlung übernommen' }] }];
      else if (ex.status !== 'aktiv') routines = routines.map(r => (r.id === id ? { ...r, status: 'aktiv', pausedSince: undefined, archivedFrom: undefined, history: [...(r.history || []), { at: today, text: 'Durch eine Empfehlung wieder aktiv' }] } : r));
      next = materialize({ ...d, routines }, today);
    } else if (t.kind === 'habit') {
      const ex = d.habits.find(h => h.lib === t.key);
      target = ex ? ex.id : `h-${t.key}`;
      next = { ...d, habits: ex ? d.habits.map(h => (h.lib === t.key ? { ...h, active: true, pinned: true } : h)) : [...d.habits, { id: `h-${t.key}`, lib: t.key, name: HABIT_LIBRARY[t.key]!.name, active: true, pinned: true }] };
    } else if (t.kind === 'task') {
      const open = d.items.find(i => i.fromRec === rec.id && i.status === 'geplant');
      if (open) target = open.id;
      else { target = uid('task'); next = { ...d, items: [...d.items, { id: target, routine: null, title: t.title, type: 'sonstiges', taskClass: 'deadline', priority: 'hoch', date: addDays(today, t.days), time: '', duration: null, status: 'geplant', note: 'Aus einer Empfehlung. Nur in dieser Sitzung gespeichert.', fromRec: rec.id, sessionOnly: !!rec.lab_marker_id }] }; }
    }
    return A.recState(next, rec.id, { status: 'angenommen', decidedAt: today, reviewDate: addDays(today, rec.reviewDays || 28), target, takeKind: t.kind });
  },
};
