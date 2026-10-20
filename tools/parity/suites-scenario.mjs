// Zustandsverläufe: beide Kerne starten mit denselben Demo-Daten und erhalten Tag für Tag dieselben Aktionen.
// Aktionen wählen Einträge über ihre Position, nicht über erzeugte IDs, damit beide Seiten dasselbe Objekt treffen.
import { prng } from './canon.mjs';
import { randomConfig } from './suites-basic.mjs';

const NOW = [0, 420, 749, 750, 1080, 1079, 1260, 1439];

/** Abgeleitete Ergebnisse eines Tages: alles, was Oberfläche, Statistik und Reviews aus dem Zustand berechnen. */
function derived(C, R, N, sR, sN, cfg, today, tag, heavy) {
  const both = (area, label, f) => C.call(area, `${tag} ${label}`, () => f(R, sR), () => f(N, sN));
  both('Zustand', 'state', (M, s) => s);
  both('Status', 'effStatus', (M, s) => s.items.map(i => M.effStatus(i, today)));
  for (const nm of NOW) both('Als Nächstes', `nextActions ${nm}`, (M, s) => M.nextActions(s, today, nm));
  both('Coach-Hinweis', 'coachHint', (M, s) => M.coachHint(s, today, cfg));
  for (const intensity of ['sanft', 'ausgewogen', 'deutlich']) both('Hinweise', `hints ${intensity}`, (M, s) => M.hints(s, today, { ...(typeof cfg === 'object' && cfg ? cfg : {}), reminders: { intensity } }));
  both('Wochenkennzahlen', 'stats', (M, s) => [M.trainingsInWeek(s, today), M.pauseStats(s, today), M.habitStats(s, today, today), M.missesInWeek(s, today), M.weightTrend(s, today), M.dayNutrition(s, today), M.dayNutrition(s, M.addDays(today, -1))]);
  both('Empfehlungen', 'recView', (M, s) => M.recView(s, cfg, today));
  both('Konflikte', 'findConflicts', (M, s) => M.findConflicts(s.items, M.weekDays(today)));
  for (const nm of [0, 1079, 1080, 1439]) both('Review-Zeitpunkte', `reviewOffer ${nm}`, (M, s) => [M.reviewDue(s, cfg, today, nm), M.reviewOffer(s, cfg, today, nm)]);
  both('Review-Zeitpunkte', 'nextWeeklyDate', (M, s) => [M.nextWeeklyDate(today, cfg, s), M.weeklyWindow(today, cfg), M.monthlyTarget(today), M.reviewForDate(today, cfg)]);
  both('Datengrundlage', 'coverage', (M, s) => [M.planStart(s), M.habitStart(s), [-21, -14, -7, 0, 7].map(k => { const ws = M.addDays(M.weekStart(today), k); return [M.weekCoverage(s, ws, today), M.goalAt(s, ws)]; }), M.trainingSeries(s, M.weekStart(today), 12, today)]);
  both('Export', 'buildExport', (M, s) => { const e = M === R ? M.buildExport(cfg, s) : M.buildExport(cfg, s, 'x'); e.exportedAt = 'fix'; return e; });
  both('Speicher', 'snapshotDocs', (M, s) => M.snapshotDocs(cfg, s, 'system'));
  both('Reviews', 'persistableReviews', (M, s) => [M.persistableReviews(s.reviews), M.runningMeasures(s, [], today)]);
  if (!heavy) return;
  const ws = R.weeklyWindow(today, cfg).target, ym = today.slice(0, 7), pym = R.prevYm(ym);
  both('Wochenreview', 'weekMetrics', (M, s) => M.weekMetrics(s, ws, today, cfg));
  both('Monatsreview', 'monthMetrics', (M, s) => [M.monthMetrics(s, ym, today, cfg), M.monthMetrics(s, pym, today, cfg)]);
  const prevIds = R.previousQuestionIds(sR, 'week', `W:${ws}`);
  both('Fragen', 'pickQuestions', (M, s) => {
    const wm = M.weekMetrics(s, ws, today, cfg), mm = M.monthMetrics(s, ym, today, cfg);
    return [M.previousQuestionIds(s, 'week', `W:${ws}`), M.previousQuestionIds(s, 'combined', `M:${ym}`), M.pickQuestions('week', wm, cfg, prevIds), M.pickQuestions('month', mm, cfg, []), M.pickQuestions('combined', { ...mm, ...wm }, cfg, ['umfang'])];
  });
}

/** Coach: Maßnahmen, Texte für beide Startzeitpunkte und die Wirkung jeder Maßnahme. */
function coach(C, R, N, sR, sN, cfg, today, tag, r) {
  const ws = R.weeklyWindow(today, cfg).target, ym = today.slice(0, 7);
  const answers = [null, {}, { umfang: 'zuviel' }, { umfang: 'mehr', 'training-hindernis': 'termine' }, { 'pausen-hindernis': r.pick(['meetings', 'uhrzeit', 'vergessen']), gewohnheit: r.pick(['ja', 'kleiner', 'pause']) }, { ernaehrung: r.pick(['hafer', 'gemuese', 'keine', 'huelsen']), fokus: r.pick(['bewegung', 'ernaehrung', 'fitter', 'werte']) }];
  const run = (M, s, kind, ans, keys, max) => {
    const m = kind === 'week' ? M.weekMetrics(s, ws, today, cfg) : M.monthMetrics(s, ym, today, cfg);
    const list = M.coachMeasures(kind, m, ans, s, cfg, today, keys, max);
    return list.map(x => {
      const nm = M.nextMonday(today);
      const eff = [nm, today].map(f => { const a = M.applyMeasureState(s, cfg, x, today, f); return [a.cfg, a.data, a.cfgChanged, a.kept, a.from, M.planDiff(s.items, a.data.items, today)]; });
      return [x, x.change(nm), x.change(today), eff, M.measureRecord(x, 'übernommen', today, nm), M.measureRecord(x, 'nicht jetzt', today)];
    });
  };
  for (const ans of answers) for (const kind of ['week', 'month']) {
    const keys = kind === 'week' ? [`W:${ws}`] : [`W:${ws}`, `M:${ym}`];
    const max = r.pick([3, 3, 1]);
    C.call('Coach', `${tag} ${kind} ${JSON.stringify(ans)} max${max}`, () => run(R, sR, kind, ans, keys, max), () => run(N, sN, kind, ans, keys, max));
  }
}

/** Zufällige Aktion mit festen Parametern für beide Seiten. Liefert [neuR, neuN, Beschreibung]. */
function action(C, R, N, sR, sN, cfgRef, today, r) {
  const idx = (arr) => (arr.length ? r.int(0, arr.length - 1) : -1);
  const ops = ['toggle', 'toggle', 'toggle', 'lateLog', 'skip', 'move', 'replace', 'delete', 'addItem', 'logWorkout', 'meal', 'habit', 'habit', 'pause', 'unpause', 'saveNew', 'saveEdit', 'status', 'duplicate', 'editInstance', 'acceptRec', 'declineRec', 'dismiss', 'review', 'snooze', 'config'];
  const op = r.pick(ops);
  const apply = f => [f(R, sR), f(N, sN)];
  const at = (s, list, i) => list(s)[i];
  switch (op) {
    case 'toggle': { const L = s => s.items.filter(i => i.date === today && ['geplant', 'erledigt'].includes(i.status)); const i = idx(L(sR)); if (i < 0) break; return [...apply((M, s) => M.A.toggleItem(s, at(s, L, i).id, today)), op]; }
    case 'lateLog': { const L = s => s.items.filter(i => i.status === 'verpasst' && i.date >= R.weekStart(today)); const i = idx(L(sR)); if (i < 0) break; return [...apply((M, s) => M.A.lateLog(s, at(s, L, i).id)), op]; }
    case 'skip': { const L = s => s.items.filter(i => i.date >= today && i.status === 'geplant'); const i = idx(L(sR)); if (i < 0) break; const st = r.pick(['ausgelassen', 'geplant']); return [...apply((M, s) => M.A.setStatus(s, at(s, L, i).id, st)), op]; }
    case 'move': { const L = s => s.items.filter(i => i.date >= today && i.status === 'geplant'); const i = idx(L(sR)); if (i < 0) break; const d = R.addDays(today, r.int(0, 4)); return [...apply((M, s) => M.A.moveItem(s, at(s, L, i).id, d)), op]; }
    case 'replace': { const L = s => s.items.filter(i => i.type === 'training' && i.status === 'verpasst' && !i.replacedBy); const i = idx(L(sR)); if (i < 0) break; const d = R.addDays(today, r.int(0, 2)); return [...apply((M, s) => M.A.replaceInWeek(s, at(s, L, i).id, d)), op]; }
    case 'delete': { const L = s => s.items.filter(i => !i.routine); const i = idx(L(sR)); if (i < 0) break; return [...apply((M, s) => M.A.deleteItem(s, at(s, L, i).id)), op]; }
    case 'addItem': { const deadline = r.bool(); const item = deadline ? { title: 'Frist', type: 'sonstiges', taskClass: 'deadline', date: R.addDays(today, r.int(-3, 5)), time: '', duration: null, routine: null } : { title: '30 Min. Home-Workout', type: 'training', kind: 'Home-Workout', date: R.addDays(today, r.int(0, 2)), time: '18:30', duration: 30, routine: null, priority: 'hoch' }; return [...apply((M, s) => M.A.addItem(s, item)), op]; }
    case 'logWorkout': { const L = s => s.items.filter(i => i.type === 'training' && ['geplant', 'verpasst'].includes(i.status) && i.date <= today); const i = r.bool() ? idx(L(sR)) : -1; const w = { date: today, kind: 'Laufen', duration: 30, intensity: 2, counts: r.bool(0.8) }; return [...apply((M, s) => M.A.logWorkout(s, w, i >= 0 ? at(s, L, i).id : null)), op]; }
    case 'meal': { const list = r.subset([['oats', 60], ['skyr', 150], ['chicken', 150], ['rice', 180], ['apple', 120]], 0.5); const meal = r.pick(['Frühstück', 'Mittagessen', 'Abendessen', 'Snack']); return [...apply((M, s) => M.A.addMealItems(s, today, meal, list)), op]; }
    case 'habit': { const i = idx(sR.habits); if (i < 0) break; const d = R.addDays(today, -r.int(0, 3)); return [...apply((M, s) => M.A.cycleHabit(s, s.habits[i].id, d)), op]; }
    case 'pause': { const from = R.addDays(today, r.int(-2, 6)); const p = { kind: r.pick(['urlaub', 'auszeit']), from, to: R.addDays(from, r.int(0, 9)), scope: r.pick(['alle', 'training']) }; return [...apply((M, s) => M.A.addPause(s, p, today)), op]; }
    case 'unpause': { const i = idx(sR.pauses || []); if (i < 0) break; return [...apply((M, s) => M.A.removePause(s, s.pauses[i].id, today)), op]; }
    case 'saveNew': { const draft = { title: r.pick(['Dehnen', ' Yoga ', 'Rad zur Arbeit']), kind: null, days: r.subset([0, 1, 2, 3, 4, 5, 6], 0.4).concat([r.int(0, 6)]), time: r.pick(['06:45', '12:00', '19:30']), duration: r.pick([10, '20', 45]), note: ' ', interval: r.pick([1, 2]), type: r.pick(['bewegung', 'training', 'sonstiges']), goal: r.pick([null, 'bewegung']), taskClass: r.pick(['same_day', 'weekly_flexible']), priority: 'normal', exceptions: [] }; const vf = R.addDays(today, r.int(0, 8)); return [...apply((M, s) => M.A.saveRoutine(s, null, draft, vf, today)), op]; }
    case 'saveEdit': { const i = idx(sR.routines); if (i < 0) break; const rt = sR.routines[i]; const v = rt.versions[rt.versions.length - 1]; const draft = { title: r.bool() ? v.title : `${v.title} neu`, kind: v.kind, days: r.bool() ? v.days : [r.int(0, 6)], time: r.bool() ? v.time : '07:15', duration: r.bool() ? v.duration : 25, note: v.note, interval: r.pick([1, 2]), type: rt.type, goal: rt.goal, taskClass: rt.taskClass, priority: rt.priority, exceptions: undefined }; const vf = R.addDays(today, r.int(0, 10)); return [...apply((M, s) => M.A.saveRoutine(s, s.routines[i].id, draft, vf, today)), op]; }
    case 'status': { const i = idx(sR.routines); if (i < 0) break; const st = r.pick(['aktiv', 'pausiert', 'archiviert']); return [...apply((M, s) => M.A.routineStatus(s, s.routines[i].id, st, today)), op]; }
    case 'duplicate': { const i = idx(sR.routines); if (i < 0) break; return [...apply((M, s) => M.A.duplicateRoutine(s, s.routines[i].id, today)), op]; }
    case 'editInstance': { const L = s => s.items.filter(i => i.date >= today && i.status === 'geplant'); const i = idx(L(sR)); if (i < 0) break; const scope = r.pick(['instance', 'from', 'weekday']); const patch = { time: r.pick(['06:30', '13:15', '21:45']), duration: r.pick([10, 30, 60]), ...(r.bool(0.3) ? { title: 'Geändert' } : {}) }; return [...apply((M, s) => M.A.editInstance(s, at(s, L, i).id, scope, patch, today)), op]; }
    case 'acceptRec': { const L = s => (s === sR ? R : N).recView(s, cfgRef, today).all; const i = idx(L(sR)); if (i < 0) break; const from = r.pick([undefined, today, R.addDays(R.weekStart(today), 7)]); return [...apply((M, s) => M.A.acceptRec(s, M.recView(s, cfgRef, today).all[i], cfgRef, today, from)), op]; }
    case 'declineRec': { const L = R.recView(sR, cfgRef, today).all; const i = idx(L); if (i < 0) break; const patch = r.pick([{ status: 'abgelehnt', decidedAt: today }, { remindAfter: R.addDays(today, 7) }, { firstShown: today, primaryOn: today }]); return [...apply((M, s) => M.A.recState(s, L[i].id, patch)), op]; }
    case 'dismiss': { const h = R.hints(sR, today, cfgRef).list; if (!h.length) break; return [...apply((M, s) => ({ ...s, dismissed: [...s.dismissed, M.hints(s, today, cfgRef).list[0].key] })), op]; }
    case 'review': {
      const nm = r.pick([0, 1080, 1439]);
      const offR = R.reviewOffer(sR, cfgRef, today, nm); if (!offR) break;
      const decide = r.pick(['übernommen', 'nicht jetzt']); const pickI = r.int(0, 2); const from = r.pick([undefined, today]); const mode = r.pick(['voll', 'kurz']);
      const flow = (M, s) => {
        const off = M.reviewOffer(s, cfgRef, today, nm);
        const kind = off.kind === 'week' ? 'week' : 'month';
        const ws = off.weekPeriod || M.weeklyWindow(today, cfgRef).target;
        const m = kind === 'week' ? M.weekMetrics(s, ws, today, cfgRef) : M.monthMetrics(s, off.period, today, cfgRef);
        const qs = M.pickQuestions(off.kind, m, cfgRef, M.previousQuestionIds(s, off.kind, off.key));
        const list = M.coachMeasures(kind, m, { umfang: 'passend' }, s, cfgRef, today, off.keys, mode === 'kurz' ? 1 : 3);
        let d = s; const x = list[Math.min(pickI, list.length - 1)];
        if (x) {
          if (decide === 'übernommen') { const res = M.applyMeasureState(d, cfgRef, x, today, x.canNow ? from : undefined); d = res.data; }
          const k0 = off.keys[off.keys.length - 1]; const cur = (d.reviews || {})[k0] || { kind: k0.startsWith('W:') ? 'week' : 'month', status: 'offen', measures: [] };
          d = { ...d, reviews: { ...d.reviews, [k0]: { ...cur, measures: [...(cur.measures || []), M.measureRecord(x, decide, today, x.canNow ? from : undefined)] } } };
        }
        return M.completeReviewState(d, off, today, qs.map(q => q.id), mode);
      };
      return [...apply(flow), op];
    }
    case 'snooze': { const off = R.reviewOffer(sR, cfgRef, today, 1439); if (!off) break; const k = off.keys[0]; const st = r.pick(['verschoben', 'uebersprungen']); return [...apply((M, s) => ({ ...s, reviews: { ...s.reviews, [k]: { kind: k.startsWith('W:') ? 'week' : 'month', status: st, snoozedUntil: st === 'verschoben' ? R.addDays(today, 1) : null, measures: [] } } })), op]; }
    case 'config': return ['config', null, op];
    default: break;
  }
  return [sR, sN, `${op} (übersprungen)`];
}

export function scenarios(C, R, N, { configsN = 12, startsN = 24, days = 21, seed0 = 1 } = {}) {
  const r = prng(seed0 * 7919);
  const starts = ['2026-10-19', '2026-10-24', '2026-10-25', '2026-10-31', '2026-11-01', '2026-12-28', '2026-12-31', '2027-01-01', '2027-03-27', '2027-03-28', '2027-02-26', '2026-03-29'];
  while (starts.length < startsN) starts.push(R.addDays('2026-01-05', r.int(0, 720)));
  const cfgs = [undefined, { review: { weeklyDay: 0 } }, { review: { weeklyDay: 3, weeklyTime: '07:00' } }, { goals: ['ernaehrung', 'werte'], nutrition: { calories: true, weight: true } }, { goals: ['bewegung'], breaks: { perDay: 2 }, work: { days: [0, 1, 2, 3, 4], home: [0, 4] } }, { goals: ['routinen'], training: { perWeek: 0 } }];
  while (cfgs.length < configsN) { const c = randomConfig(r); if (c && typeof c === 'object') cfgs.push(c); }
  let steps = 0;
  for (let ci = 0; ci < cfgs.length; ci++) for (let si = 0; si < startsN; si++) {
    let cfg = cfgs[ci];
    let today = starts[si];
    const tag0 = `K${ci}/S${starts[si]}`;
    let sR = R.seed(today, cfg), sN = N.seed(today, cfg);
    if (!C.eq('Demo-Daten', `${tag0} seed`, sR, sN)) continue;
    for (let day = 0; day < days; day++) {
      const tag = `${tag0} Tag ${day} (${today})`;
      const heavy = day % 3 === 0 || R.wdIdx(today) === (R.normalizeConfig(cfg).review.weeklyDay);
      derived(C, R, N, sR, sN, cfg, today, tag, heavy);
      if (heavy && (ci + si + day) % 4 === 0) coach(C, R, N, sR, sN, cfg, today, tag, r);
      const nOps = r.int(0, 4);
      for (let k = 0; k < nOps; k++) {
        const [a, b, op] = action(C, R, N, sR, sN, cfg, today, r);
        if (op === 'config') {
          const cfg2 = randomConfig(r); if (!cfg2 || typeof cfg2 !== 'object') continue;
          const from = r.pick([today, R.addDays(R.weekStart(today), 7)]);
          const sync = (M, s) => { const sp = M.syncPlanRoutines(s.routines, cfg2, from); const m = M.materialize({ ...s, routines: sp.routines }, today); return { ...m, habits: M.syncHabits(m.habits, cfg2) }; };
          sR = sync(R, sR); sN = sync(N, sN); cfg = cfg2;
        } else { sR = a; sN = b; }
        steps++;
        if (!C.eq('Aktionen', `${tag} nach ${op}`, sR, sN)) { day = days; break; }
      }
      today = R.addDays(today, 1);
      sR = R.materialize(sR, today); sN = N.materialize(sN, today);
      // Gelegentlich Tageswechsel ohne Öffnen der App: mehrere Tage überspringen
      if (r.bool(0.08)) { today = R.addDays(today, r.int(1, 5)); sR = R.materialize(sR, today); sN = N.materialize(sN, today); }
    }
  }
  return steps;
}
