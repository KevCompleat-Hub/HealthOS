/** Export, Import, Migration gespeicherter Stände und Speicher-Schnappschuss. 1:1 aus Referenz v5. */
import { GOALS, HABIT_LIBRARY, ITEM_STATUSES, PRIORITIES, REVIEW_STATUS, SCHEMA, TASK_CLASSES, TYPES } from './catalog.js';
import { normalizeConfig } from './config.js';
import { persistableRecState } from './intelligence.js';
import { classOfItem } from './plan/build.js';
import { migratePause } from './plan/materialize.js';
import { syncPlanRoutines } from './plan/routines.js';
import { persistableReviews } from './review/coach.js';
import type { Config, HabitLog, Habit, Item, Pause, Reviews, Routine, State } from './types.js';
import { weekStart } from './util/date.js';
import { uid } from './util/ids.js';

type Loose = Record<string, any>;

/**
 * Exportformat „healthos-export“, Schema 2.
 * Abweichung zur Referenz nur in der Signatur: Der Exportzeitpunkt wird übergeben, der Kern liest keine Uhr.
 */
export function buildExport(cfg: unknown, data: Pick<State, 'routines' | 'items' | 'habits' | 'habitLog' | 'pauses' | 'reviews'>, exportedAt: string) {
  const rts = data.routines || [];
  return {
    format: 'healthos-export', schema: SCHEMA, exportedAt, timezone: 'Europe/Berlin',
    hinweis: 'Lokaler Demo-Export: Einstellungen, Routinen und Wochenplan. Keine Messwerte, Laborwerte, Termine, Empfehlungen zu Laborwerten oder Pausengründe.',
    tables: {
      user_preferences: [normalizeConfig(cfg)],
      routine_templates: rts.map(r => ({ id: r.id, source: r.source, customized: !!r.customized, status: r.status, category: r.type, goal: r.goal || null, task_class: r.taskClass, priority: r.priority, paused_since: r.pausedSince || null, archived_from: r.archivedFrom || null, history: r.history || [] })),
      routine_versions: rts.flatMap(r => r.versions.map(v => ({ routine_id: r.id, valid_from: v.validFrom, title: v.title, kind: v.kind || null, weekdays: v.days, interval_weeks: v.interval || 1, time_local: v.time, duration_min: v.duration, note: v.note || null }))),
      routine_exceptions: rts.flatMap(r => (r.exceptions || []).map(e => ({ id: e.id, routine_id: r.id, weekday: e.weekday, valid_from: e.validFrom, time_local: e.time || null, duration_min: e.duration || null }))),
      agenda_items: data.items.filter(i => !i.sessionOnly).map(i => ({ id: i.id, routine_id: i.routine || null, title: i.title, category: i.type, kind: i.kind || null, task_class: classOfItem(i), priority: i.priority || 'normal', planned_date: i.date, planned_time: i.time || null, duration_min: i.duration || null, status: i.status, moved_from: i.movedFrom || null, moved_to: i.movedTo || null, replaces: i.replaces || null, override: !!i.override, pause_id: i.pauseId || null, note: i.note || null })),
      habits: data.habits.map(h => ({ id: h.id, name: h.name, library_key: h.lib || null, active: h.active !== false, pinned: !!h.pinned, ...(h.perWeek ? { per_week: h.perWeek } : {}) })),
      habit_events: Object.entries(data.habitLog).map(([k, v]) => { const [hid, date] = k.split('|'); return { habit_id: hid, date, status: v }; }),
      schedule_exceptions: (data.pauses || []).map(p => ({ id: p.id, kind: p.kind, from_date: p.from, to_date: p.to, scope: p.scope })),
      review_sessions: Object.entries(persistableReviews(data.reviews)).map(([k, r]) => ({ key: k, kind: r.kind, status: r.status, completed_at: r.at, snoozed_until: r.snoozedUntil, question_ids: r.questionIds, demo: r.demo })),
      review_measures: Object.entries(persistableReviews(data.reviews)).flatMap(([k, r]) => (r.measures || []).map(x => ({ review_key: k, measure_id: x.id, title: x.title, area: x.area, success_check: x.check, metric: x.metric, decision: x.decision, decided_at: x.decidedAt, valid_from: x.validFrom }))),
    },
  };
}

export interface ImportedState { cfg: Config; routines: Routine[]; items: Item[]; habits: Habit[]; habitLog: HabitLog; pauses: Pause[]; reviews: Reviews }
/** Liest einen Export Version 1 oder 2. Ungültige Einträge werden verworfen, nie geraten. */
export function parseImport(obj: unknown): { error: string } | { state: ImportedState; counts: { routines: number; items: number; pauses: number } } {
  try {
    const o = obj as Loose;
    if (!o || o.format !== 'healthos-export' || !o.tables) return { error: 'Das ist keine HealthOS-Exportdatei.' };
    if (![1, 2].includes(o.schema)) return { error: `Unbekannte Exportversion ${o.schema}.` };
    const t = o.tables as Loose; const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); const isTime = (s: unknown): s is string => typeof s === 'string' && /^\d{2}:\d{2}$/.test(s);
    const cfg = normalizeConfig((t.user_preferences || [])[0]);
    let routines: Routine[];
    if (o.schema >= 2 && Array.isArray(t.routine_templates)) {
      routines = (t.routine_templates as Loose[]).map(r => ({
        id: String(r.id), source: ['plan', 'eigene', 'empfehlung'].includes(r.source) ? r.source : 'eigene', customized: !!r.customized,
        status: ['aktiv', 'pausiert', 'archiviert'].includes(r.status) ? r.status : 'aktiv', type: TYPES[r.category] ? r.category : 'sonstiges',
        goal: (GOALS as Loose)[r.goal] ? r.goal : null, taskClass: TASK_CLASSES[r.task_class] ? r.task_class : 'same_day', priority: PRIORITIES[r.priority] ? r.priority : 'normal',
        pausedSince: isDate(r.paused_since) ? r.paused_since : undefined, archivedFrom: isDate(r.archived_from) ? r.archived_from : undefined,
        history: Array.isArray(r.history) ? r.history.slice(-60) : [],
        versions: ((t.routine_versions || []) as Loose[]).filter(v => v.routine_id === r.id && isDate(v.valid_from)).map(v => ({
          validFrom: v.valid_from, title: String(v.title || 'Routine').slice(0, 80), kind: v.kind || null, days: ((v.weekdays || []) as unknown[]).filter((d): d is number => Number.isInteger(d) && (d as number) >= 0 && (d as number) < 7),
          interval: v.interval_weeks === 2 ? 2 : 1, time: isTime(v.time_local) ? v.time_local : '12:00', duration: Math.max(1, Math.min(600, Number(v.duration_min) || 15)), note: v.note || '' })).sort((a, b) => a.validFrom.localeCompare(b.validFrom)),
        exceptions: ((t.routine_exceptions || []) as Loose[]).filter(e => e.routine_id === r.id && isDate(e.valid_from)).map(e => ({ id: e.id || uid('ex'), weekday: e.weekday, validFrom: e.valid_from, time: isTime(e.time_local) ? e.time_local : null, duration: e.duration_min || null })),
      } as Routine)).filter(r => r.versions.length);
    } else routines = syncPlanRoutines([], cfg, '2000-01-01').routines;
    const seen = new Set<string>();
    const items: Item[] = ((t.agenda_items || []) as Loose[]).filter(i => i && i.id && isDate(i.planned_date) && (ITEM_STATUSES as string[]).includes(i.status) && !seen.has(i.id) && seen.add(i.id)).slice(0, 20000).map(i => {
      const it: Loose = {
        id: String(i.id), routine: i.routine_id || i.routine_key || null, title: String(i.title || 'Eintrag').slice(0, 80), type: TYPES[i.category || i.type] ? (i.category || i.type) : 'sonstiges',
        kind: i.kind || null, priority: PRIORITIES[i.priority] ? i.priority : 'normal', date: i.planned_date, time: isTime(i.planned_time) ? i.planned_time : '', duration: i.duration_min || null,
        status: i.status, note: i.note || '',
      };
      if (TASK_CLASSES[i.task_class]) it.taskClass = i.task_class;
      ['moved_from', 'moved_to', 'replaces', 'pause_id'].forEach((k, n) => { if (i[k]) it[['movedFrom', 'movedTo', 'replaces', 'pauseId'][n] as string] = i[k]; });
      if (i.override) it.override = true;
      it.taskClass = classOfItem(it as Item);
      return it as Item;
    });
    const habits: Habit[] = ((t.habits || []) as Loose[]).map(h => ({ id: String(h.id), name: String(h.name || 'Gewohnheit').slice(0, 60), lib: HABIT_LIBRARY[h.library_key] ? h.library_key : undefined, active: h.active !== false, pinned: !!h.pinned, custom: !h.library_key, perWeek: Number.isInteger(h.per_week) && h.per_week >= 1 && h.per_week <= 6 ? h.per_week : undefined }));
    const habitLog: HabitLog = {}; ((t.habit_events || []) as Loose[]).forEach(e => { if (e && isDate(e.date) && (e.status === 'done' || e.status === 'skip')) habitLog[`${e.habit_id}|${e.date}`] = e.status; });
    const pauses = ((t.schedule_exceptions || []) as Loose[]).filter(p => isDate(p.from_date) && isDate(p.to_date)).map(p => migratePause({ id: p.id, kind: p.kind, reason: p.reason, from: p.from_date, to: p.to_date, scope: p.scope }));
    const reviews: Reviews = {};
    ((t.review_sessions || []) as Loose[]).forEach(r => { if (r && /^(W:\d{4}-\d{2}-\d{2}|M:\d{4}-\d{2})$/.test(r.key) && REVIEW_STATUS[r.status]) reviews[r.key] = { kind: r.kind === 'month' ? 'month' : 'week', status: r.status, at: isDate(r.completed_at) ? r.completed_at : null, snoozedUntil: isDate(r.snoozed_until) ? r.snoozed_until : null, questionIds: Array.isArray(r.question_ids) ? r.question_ids.slice(0, 10) : [], measures: [], demo: !!r.demo }; });
    ((t.review_measures || []) as Loose[]).forEach(x => { if (x && reviews[x.review_key]) reviews[x.review_key]!.measures!.push({ id: String(x.measure_id), title: String(x.title || '').slice(0, 120), area: x.area || 'alles', check: x.success_check || '', metric: x.metric || null, decision: x.decision === 'übernommen' ? 'übernommen' : 'nicht jetzt', decidedAt: isDate(x.decided_at) ? x.decided_at : null, validFrom: isDate(x.valid_from) ? x.valid_from : null }); });
    return { state: { cfg, routines, items, habits, habitLog, pauses, reviews }, counts: { routines: routines.length, items: items.length, pauses: pauses.length } };
  } catch (e) { return { error: 'Die Datei konnte nicht gelesen werden.' }; }
}

/** Gespeicherte Dokumente (Schema 1 oder 2) in den aktuellen Zustand überführen. */
export function migrateSaved(saved: Loose) {
  const schema = (saved.settings && saved.settings.schema) || 1;
  const cfg = normalizeConfig(saved.settings && saved.settings.config);
  const h = saved.habits || {};
  let routines: Routine[] | null = saved.plan && Array.isArray(saved.plan.routines) ? saved.plan.routines : null;
  if (!routines) routines = syncPlanRoutines([], cfg, '2000-01-01').routines;
  const items = ((saved.weeks || []) as Loose[]).flatMap(w => (Array.isArray(w.items) ? w.items as Item[] : [])).map(it => ({ ...it, taskClass: it.taskClass || classOfItem(it) }));
  return { cfg, theme: saved.settings && saved.settings.theme, routines, recState: (saved.plan && saved.plan.recState) || {}, reviews: (saved.plan && saved.plan.reviews) || {}, items, habits: h.habits as Habit[] | undefined, habitLog: (h.habitLog || {}) as HabitLog, pauses: ((h.pauses || []) as Loose[]).map(p => migratePause(p as Parameters<typeof migratePause>[0])), dismissed: (h.dismissed || []) as string[], fromSchema: schema as number };
}

/** Speicherbare Dokumente (Stand Referenz v5): Konfiguration, Routinen, Plan, ohne Messwerte und Laborbezug. */
export function snapshotDocs(cfg: unknown, data: Pick<State, 'routines' | 'recState' | 'reviews' | 'habits' | 'habitLog' | 'pauses' | 'dismissed' | 'items'>, theme: unknown): Record<string, unknown> {
  const docs: Record<string, unknown> = {
    settings: { schema: SCHEMA, config: normalizeConfig(cfg), theme },
    plan: { schema: SCHEMA, routines: data.routines || [], recState: persistableRecState(data.recState), reviews: persistableReviews(data.reviews) },
    habits: { schema: SCHEMA, habits: data.habits, habitLog: data.habitLog, pauses: (data.pauses || []).map(p => ({ id: p.id, kind: p.kind, from: p.from, to: p.to, scope: p.scope })), dismissed: data.dismissed },
  };
  const weeks: Record<string, Item[]> = {};
  data.items.filter(i => !i.sessionOnly).forEach(i => { const ws = weekStart(i.date); (weeks[ws] = weeks[ws] || []).push(i); });
  Object.keys(weeks).sort().forEach(ws => { docs[`week:${ws}`] = { schema: SCHEMA, weekStart: ws, items: weeks[ws] }; });
  return JSON.parse(JSON.stringify(docs));
}
