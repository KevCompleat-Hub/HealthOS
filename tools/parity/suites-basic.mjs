// Differenztests ohne Zustandsverlauf: Kataloge, Datum, Europe/Berlin, Konfiguration und Wochenplan, Labor und Empfehlungen, Import.
import { prng } from './canon.mjs';

const CATALOGS = ['TYPES', 'GOALS', 'PLACES', 'HABIT_LIBRARY', 'SLOTS', 'INTENSITIES', 'TONES', 'PAUSE_KINDS', 'TASK_CLASSES', 'PRIORITIES', 'STATUS_INFO',
  'DEFAULT_CONFIG', 'SCHEMA', 'FOODS', 'IDEA_FOODS', 'MEALS', 'MAIN_MEALS', 'WORKOUT_KINDS', 'INTENSITY', 'APPT_STATUS', 'REVIEW_STATUS', 'COVERAGE_LABEL',
  'ITEM_STATUSES', 'EVIDENCE', 'EVIDENCE_LEVELS', 'REC_STATUS', 'WD', 'WD_LONG', 'MONTHS', 'LAB_REC_IDS', 'AREA_GOALS'];

export function catalogs(C, R, N) {
  for (const k of CATALOGS) C.eq('Kataloge', k, R[k], N[k]);
  // Fragen und Laborregeln enthalten Funktionen: Struktur und Verhalten getrennt prüfen
  C.eq('Kataloge', 'QUESTIONS Struktur', R.QUESTIONS.map(q => [q.id, q.prio, !!q.monthly]), N.QUESTIONS.map(q => [q.id, q.prio, !!q.monthly]));
  const names = ['LDL', 'ldl-c', ' LDL-Cholesterin', 'HDL', 'Zink', 'zink im serum', 'Zinc', '', null, 'LDL ', 'zINK', 'Cholesterin LDL'];
  for (const k of ['ldl', 'zink']) {
    C.eq('Kataloge', `LAB_MARKERS.${k}`, { ...R.LAB_MARKERS[k], match: names.map(n => R.LAB_MARKERS[k].match(n)) }, { ...N.LAB_MARKERS[k], match: names.map(n => N.LAB_MARKERS[k].match(n)) });
  }
  for (const n of names) C.eq('Kataloge', `markerOf(${n})`, R.markerOf(n), N.markerOf(n));
  for (const u of ['mg/dl', 'mg/dL', ' MMOL/L ', 'μg/dl', 'µg/dl', 'ug/dl', null, '', 'g/l']) C.eq('Kataloge', `normUnit(${u})`, R.normUnit(u), N.normUnit(u));
  const cfg = R.normalizeConfig({ work: { days: [0, 1, 2, 3, 4], lunch: '12:15', lunchDur: 45, end: '18:00' }, training: { places: ['walkingpad'] } });
  for (const k of Object.keys(R.TAKE_ROUTINES)) C.eq('Kataloge', `TAKE_ROUTINES.${k}`, R.TAKE_ROUTINES[k](cfg), N.TAKE_ROUTINES[k](cfg));
}

export function dates(C, R, N) {
  const days = [];
  for (let d = '2023-12-25'; d <= '2029-01-07'; d = R.addDays(d, 1)) days.push(d);
  const ref = '2026-10-19';
  for (const d of days) {
    C.eq('Datum', d, [R.addDays(d, 1), R.addDays(d, -1), R.addDays(d, 7), R.addDays(d, -30), R.addDays(d, 400), R.wdIdx(d), R.weekStart(d), R.weekDays(d), R.isoWeek(d), R.daysBetween(ref, d), R.dayLabel(d, ref), R.dayLabelLc(d, R.addDays(d, 1)), R.fmtDM(d), R.fmtLong(d), R.fmtShort(d), R.ymOf(d), R.monthLast(R.ymOf(d)), R.prevYm(R.ymOf(d)), R.fmtYm(R.ymOf(d)), R.yy(d)],
      [N.addDays(d, 1), N.addDays(d, -1), N.addDays(d, 7), N.addDays(d, -30), N.addDays(d, 400), N.wdIdx(d), N.weekStart(d), N.weekDays(d), N.isoWeek(d), N.daysBetween(ref, d), N.dayLabel(d, ref), N.dayLabelLc(d, N.addDays(d, 1)), N.fmtDM(d), N.fmtLong(d), N.fmtShort(d), N.ymOf(d), N.monthLast(N.ymOf(d)), N.prevYm(N.ymOf(d)), N.fmtYm(N.ymOf(d)), N.yy(d)]);
  }
  const r = prng(7);
  for (let i = 0; i < 2000; i++) {
    const m = r.int(-30, 1500), t = `${String(r.int(0, 23)).padStart(2, '0')}:${String(r.int(0, 59)).padStart(2, '0')}`;
    const v = r.pick([0, -0, 1.25, -3.456, 12345.678, 0.05, -0.05, NaN, 7]); const s = r.pick(['12,5', ' 84.6 ', '', null, undefined, 'abc', '1e3', '0']);
    const e = r.pick(['', null, undefined]), d1 = r.int(0, 2), d2 = r.int(0, 2), a = r.int(0, 9), b = r.int(0, 9), w1 = r.int(0, 6), w2 = r.int(0, 6);
    const run = M => [M.hm(Math.max(0, m)), M.r15(m), M.toMin(t), M.toMin(e), M.parseNum(s), M.fmtNum(v, d1), M.fmtVal(v), M.signed(v, d2), M.pct(a, b), M.wdist(w1, w2), M.avg([1, 2, v])];
    C.eq('Format', `#${i}`, run(R), run(N));
  }
}

/** Europe/Berlin: jede Viertelstunde um alle Zeitumstellungen 2025 bis 2028, dazu jede Stunde 2026 und 2027. */
export function berlin(C, R, N) {
  const pts = [];
  for (const sw of ['2025-03-30', '2025-10-26', '2026-03-29', '2026-10-25', '2027-03-28', '2027-10-31', '2028-03-26', '2028-10-29', '2026-12-31', '2027-12-31']) {
    const base = Date.parse(`${sw}T00:00:00Z`);
    for (let k = -96; k <= 96; k++) pts.push(new Date(base + k * 15 * 60000));
  }
  for (let t = Date.parse('2026-01-01T00:00:00Z'); t < Date.parse('2028-01-01T00:00:00Z'); t += 3600000) pts.push(new Date(t));
  for (const d of pts) C.eq('Europe/Berlin', d.toISOString(), R.berlinParts(d), N.berlinParts(d));
}

export function randomConfig(r) {
  const days = r.subset([0, 1, 2, 3, 4, 5, 6], r.pick([0.3, 0.7, 0.9]));
  const t = () => `${String(r.int(5, 20)).padStart(2, '0')}:${r.pick(['00', '15', '30', '45'])}`;
  const c = {
    goals: r.shuffle(r.subset(['abnehmen', 'fitter', 'bewegung', 'ernaehrung', 'werte', 'routinen', 'unbekannt'], 0.4)),
    work: { days, home: r.subset(days.concat([5]), 0.4), start: r.bool(0.9) ? t() : '', end: r.bool(0.9) ? t() : 'x', lunch: r.bool(0.9) ? t() : null, lunchDur: r.pick([0, 15, 30, 45, 60, '30', undefined]) },
    breaks: { perDay: r.pick([0, 1, 2, 3, -1, '1', null]), duration: r.pick([5, 10, 15, 30, 45, 0, '15']) },
    training: { places: r.subset(['studio', 'zuhause', 'laufen', 'rad', 'schwimmen', 'spazieren', 'walkingpad', 'mond'], 0.4), perWeek: r.pick([0, 1, 2, 3, 4, 5, 6, 7, 2.5, -1, undefined]), days: r.subset([0, 1, 2, 3, 4, 5, 6, 7, -1], 0.3), slot: r.pick(['morgens', 'mittags', 'abends', 'nachts']), duration: r.pick([10, 30, 45, 60, 90, 180, 300, 0, '60']), freeDay: r.bool(0.7) },
    nutrition: { calories: r.bool(0.6), weight: r.bool(0.5), weightPerWeek: r.pick([0, 1, 2, 3, 4, '2']), habitsFirst: r.bool() },
    habits: r.subset(['wasser', 'treppe', 'bildschirm', 'gemuese', 'schlaf', 'vielfalt', 'abendrunde', 'quatsch'], 0.4),
    reminders: { intensity: r.pick(['sanft', 'ausgewogen', 'deutlich', 'laut']), lead: r.pick([0, 15, 30]), quietFrom: r.pick(['22:00', '21:00', '20:00', '23:30', '', '07:00']), quietTo: r.pick(['07:00', '06:00', '08:30', '', '22:00']) },
    motivation: r.pick(['ruhig', 'ausgewogen', 'anspornend', 'wild']),
    review: { weeklyDay: r.pick([0, 1, 2, 3, 4, 5, 6, 7, -1, undefined]), weeklyTime: r.pick(['18:00', '07:30', '20:15', '', 'abends', undefined]), monthly: r.pick([true, false, undefined]) },
  };
  for (const k of Object.keys(c)) if (r.bool(0.05)) delete c[k];
  if (r.bool(0.03)) return r.pick([null, undefined, 'kaputt', 42, []]);
  return c;
}

export function configs(C, R, N, n = 3000) {
  const r = prng(20261019);
  for (let i = 0; i < n; i++) {
    const cfg = randomConfig(r);
    C.call('Konfiguration', `normalizeConfig #${i}`, () => R.normalizeConfig(cfg), () => N.normalizeConfig(cfg));
    C.call('Wochenplan', `buildPlan #${i}`, () => R.buildPlan(cfg), () => N.buildPlan(cfg));
    const nc = R.normalizeConfig(cfg);
    C.call('Konfiguration', `workError #${i}`, () => R.workError(nc), () => N.workError(N.normalizeConfig(cfg)));
    C.call('Wochenplan', `suggestHabits #${i}`, () => R.suggestHabits(nc.goals), () => N.suggestHabits(nc.goals));
    const from = R.addDays('2026-01-05', r.int(0, 700));
    const sR = R.syncPlanRoutines([], cfg, '2000-01-01'), sN = N.syncPlanRoutines([], cfg, '2000-01-01');
    C.eq('Routinen', `syncPlanRoutines leer #${i}`, sR, sN);
    // zweiter Plan auf bestehende Routinen, teils angepasst oder archiviert
    const cfg2 = randomConfig(r);
    const base = sR.routines.map((rt, k) => (k % 4 === 1 ? { ...rt, customized: true } : k % 5 === 2 ? { ...rt, status: 'archiviert', archivedFrom: '2001-01-01' } : rt));
    C.call('Routinen', `syncPlanRoutines Wechsel #${i}`, () => R.syncPlanRoutines(base, cfg2, from), () => N.syncPlanRoutines(base, cfg2, from));
    C.call('Wochenplan', `syncHabits #${i}`, () => R.syncHabits([{ id: 'h-wasser', lib: 'wasser', name: 'x', active: true }, { id: 'h-treppe', lib: 'treppe', name: 'y', active: false, pinned: true }, { id: 'c1', name: 'eigene', active: true }], cfg), () => N.syncHabits([{ id: 'h-wasser', lib: 'wasser', name: 'x', active: true }, { id: 'h-treppe', lib: 'treppe', name: 'y', active: false, pinned: true }, { id: 'c1', name: 'eigene', active: true }], cfg));
    for (const w of [r.pick(['', ' ', '84,5', '29.9', '30', '300', '300,1', 'abc', null, undefined, 150])]) C.eq('Konfiguration', `validateWeight ${w}`, R.validateWeight(w), N.validateWeight(w));
  }
  // Ruhezeiten: alle Startzeiten in 15-Minuten-Schritten gegen typische Ruhezeiten
  const qs = [{ quietFrom: '22:00', quietTo: '07:00' }, { quietFrom: '20:00', quietTo: '06:00' }, { quietFrom: '12:00', quietTo: '14:00' }, { quietFrom: '', quietTo: '07:00' }, { quietFrom: '07:00', quietTo: '07:00' }];
  for (const q of qs) for (let m = 0; m < 1440; m += 15) for (const dur of [2, 15, 45, 90]) C.eq('Ruhezeiten', `${q.quietFrom}-${q.quietTo} ${m}/${dur}`, [R.fitQuiet(m, dur, q), R.inQuiet(m, q)], [N.fitQuiet(m, dur, q), N.inQuiet(m, q)]);
  for (let i = 0; i < 500; i++) { const pool = r.subset([0, 1, 2, 3, 4, 5, 6], 0.6), fixed = r.subset([0, 1, 2, 3, 4, 5, 6], 0.2); const k = r.int(0, 6); C.eq('Wochenplan', `spreadPick #${i}`, R.spreadPick(pool, k, fixed), N.spreadPick(pool, k, fixed)); }
  for (const k of ['train-0', 'train-6', 'pause1-ho', 'pause2-buero', 'walk', 'weigh', 'meals', 'review', 'u-r_1_ab', 'vorschlag-x', '']) C.eq('Wochenplan', `planMeta ${k}`, R.planMeta(k), N.planMeta(k));
}

/** Laborprüfung und Empfehlungen mit zufälligen Laborlisten und Entscheidungsständen. */
export function labs(C, R, N, n = 5000) {
  const r = prng(4711);
  const analytes = ['LDL-Cholesterin', 'LDL', 'ldl-c', ' LDL ', 'Zink', 'Zink im Serum', 'zink', 'Zinc', 'HbA1c', 'Ferritin'];
  const units = ['mg/dl', 'mg/dL', 'mmol/l', 'mmol/L', 'µg/dl', 'μg/dl', 'ug/dl', 'µmol/l', 'umol/l', 'g/l', '', '%'];
  for (let i = 0; i < n; i++) {
    const today = R.addDays('2026-01-01', r.int(0, 900));
    const list = Array.from({ length: r.int(0, 6) }, (_, k) => ({ id: `lab-${k}`, analyte: r.pick(analytes), value: r.pick([40, 55, 62, 70, 90, 115, 116, 124, 128, 160, 3.1, 0]), unit: r.pick(units), refMin: r.pick([null, null, 70, 60, 0]), refMax: r.pick([null, 115, 120, 160]), date: R.addDays(today, -r.int(0, 800)), lab: 'Demo', source: 'demo', confirmed: r.bool(0.8) }));
    for (const mk of ['ldl', 'zink']) C.eq('Laborprüfung', `${mk} #${i}`, R.labAssessment(list, mk, today), N.labAssessment(list, mk, today));
    const ws = R.weekStart(today);
    const recState = {};
    for (const id of ['ldl-muster', 'zink-lebensmittel', 'ballaststoffe', 'sitzen-unterbrechen', 'pflanzen-vielfalt']) if (r.bool(0.4)) recState[id] = { status: r.pick(['vorgeschlagen', 'angenommen', 'abgelehnt', 'abgeschlossen']), firstShown: r.pick([null, ws, R.addDays(ws, -7), today]), remindAfter: r.pick([null, R.addDays(today, 1), R.addDays(today, -1)]), primaryOn: r.pick([null, today, R.addDays(today, -1)]) };
    const cfg = randomConfig(r);
    const data = { labs: list, recState };
    C.call('Empfehlungen', `computeRecs #${i}`, () => R.computeRecs(data, cfg, today), () => N.computeRecs(data, cfg, today));
    C.call('Empfehlungen', `recView #${i}`, () => R.recView(data, cfg, today), () => N.recView(data, cfg, today));
    C.eq('Empfehlungen', `persistableRecState #${i}`, R.persistableRecState(recState), N.persistableRecState(recState));
    C.eq('Laboranzeige', `groupLabs #${i}`, [R.groupLabs(list), list.map(R.refText), list.map(R.refPos)], [N.groupLabs(list), list.map(N.refText), list.map(N.refPos)]);
  }
}

/** Import: echte Exporte aus beiden Modulen und zufällig beschädigte Varianten. */
export function imports(C, R, N, n = 1500) {
  const r = prng(99);
  const V2 = R.__v2;
  for (let i = 0; i < n; i++) {
    const today = R.addDays('2026-03-01', r.int(0, 500));
    const cfg = randomConfig(r);
    const st = R.seed(today, typeof cfg === 'object' && cfg ? cfg : undefined);
    const exp = R.buildExport(cfg, st); exp.exportedAt = 'fix';
    const mutate = o => {
      const x = JSON.parse(JSON.stringify(o));
      const t = x.tables;
      if (r.bool(0.3)) t.agenda_items.forEach(it => { if (r.bool(0.05)) it.planned_date = r.pick(['2026-13-01', '', null, 'heute']); if (r.bool(0.03)) it.status = r.pick(['fertig', null]); if (r.bool(0.03)) it.task_class = 'quatsch'; });
      if (r.bool(0.2)) t.routine_versions.forEach(v => { if (r.bool(0.1)) v.weekdays = [r.pick([0, 7, -1, 2.5, '3'])]; if (r.bool(0.1)) v.time_local = r.pick(['25:00', '7:00', '']); if (r.bool(0.1)) v.duration_min = r.pick([0, -5, 10000, 'x']); });
      if (r.bool(0.1)) delete t.routine_templates;
      if (r.bool(0.1)) x.schema = r.pick([1, 3, '2']);
      if (r.bool(0.05)) x.format = 'anders';
      if (r.bool(0.1)) t.agenda_items.push({ ...t.agenda_items[0] });
      if (r.bool(0.1)) t.review_sessions.push({ key: r.pick(['W:2026-1-1', 'M:2026-02', 'X']), kind: 'month', status: r.pick(['abgeschlossen', 'kaputt']) });
      if (r.bool(0.1)) t.schedule_exceptions.push({ id: 'p9', reason: r.pick(['Urlaub', 'Krankheit']), from_date: today, to_date: R.addDays(today, 3) });
      return x;
    };
    const input = r.bool(0.2) ? exp : mutate(exp);
    C.call('Import', `parseImport #${i}`, () => R.parseImport(input), () => N.parseImport(input));
    const bad = r.pick([null, 5, {}, { format: 'healthos-export' }, { format: 'healthos-export', schema: 2, tables: 'x' }, { format: 'healthos-export', schema: 2, tables: { agenda_items: 'x' } }]);
    C.call('Import', `parseImport ungültig #${i}`, () => R.parseImport(bad), () => N.parseImport(bad));
    if (V2 && i % 5 === 0) {
      // Export aus der Vorversion (Schema 1)
      const s1 = V2.seed(today); const e1 = V2.buildExport(V2.DEFAULT_CONFIG || {}, s1); e1.exportedAt = 'fix';
      C.call('Import', `parseImport Schema 1 #${i}`, () => R.parseImport(e1), () => N.parseImport(e1));
    }
    // gespeicherte Dokumente (Schema 2) und ältere Stände ohne Plan (Schema 1)
    const docs = R.snapshotDocs(cfg, st, r.pick(['light', 'dark', 'system']));
    C.eq('Speicher', `snapshotDocs #${i}`, docs, N.snapshotDocs(cfg, st, docs.settings.theme));
    const saved = { settings: docs.settings, plan: r.bool(0.7) ? docs.plan : undefined, habits: { ...docs.habits, pauses: [{ id: 'p1', reason: 'Krankheit', from: today, to: today }, { from: today, to: today, scope: 'training' }] }, weeks: Object.keys(docs).filter(k => k.startsWith('week:')).map(k => docs[k]) };
    if (r.bool(0.3)) saved.settings = { schema: 1, config: cfg };
    C.call('Migration', `migrateSaved #${i}`, () => R.migrateSaved(saved), () => N.migrateSaved(saved));
  }
}

/**
 * Coach-Historie: gezielte Review-Verläufe mit früheren Entscheidungen.
 * Ergänzt nach dem Mutationstest, weil zufällige Tagesverläufe selten drei oder mehr Reviews mit gleichen Maßnahmen erzeugen.
 * Prüft priorDecisions, runningMeasures, evalMeasure und coachMeasures mit vorhandener Entscheidungshistorie.
 */
export function coachHistory(C, R, N, n = 1500) {
  const r = prng(31337);
  const ids = ['training-weniger', 'training-mehr', 'pausen-anpassen', 'fortfuehren', 'gewohnheit-pause-h-wasser', 'empfehlung-ballaststoff-mahlzeit', 'training-verlegen-1', 'empfehlung-sitzen-unterbrechen'];
  const bases = ['2026-10-19', '2026-11-01', '2026-12-31', '2027-03-29'].map(d => [d, R.seed(d)]);
  for (let i = 0; i < n; i++) {
    const [today, st0] = r.pick(bases);
    const k = r.int(0, 6); const reviews = {};
    for (let j = 1; j <= k; j++) {
      const ws = R.addDays(R.weekStart(today), -7 * j);
      const month = r.bool(0.25);
      const key = month ? `M:${R.prevYm(ws.slice(0, 7))}` : `W:${ws}`;
      const at = R.addDays(ws, r.int(6, 9));
      const measures = r.subset(ids, 0.35).map(id => {
        const decision = r.pick(['übernommen', 'nicht jetzt']);
        return { id, title: id, area: 'x', check: 'x', metric: r.pick([null, { type: 'training', target: r.int(1, 3) }, { type: 'pauses', target: 3 }, { type: 'habits', target: 4 }, { type: 'routine', routine: 'pause1-ho', target: 2 }]), decision, decidedAt: at, validFrom: decision === 'übernommen' ? R.addDays(at, 1) : null, sig: r.pick([null, 'immer', '0/0/', '3/6/zuviel', `${r.int(0, 6)}/${r.int(3, 6)}/`]) };
      });
      reviews[key] = { kind: month ? 'month' : 'week', status: r.pick(['abgeschlossen', 'abgeschlossen', 'uebersprungen', 'offen']), at: r.bool(0.9) ? at : null, measures };
    }
    const data = { ...st0, reviews };
    const ws = R.weeklyWindow(today, undefined).target;
    const keys = r.pick([[`W:${ws}`], [`W:${ws}`, `M:${today.slice(0, 7)}`], []]);
    C.call('Coach-Historie', `priorDecisions #${i}`, () => R.priorDecisions(data, keys), () => N.priorDecisions(data, keys));
    C.call('Coach-Historie', `runningMeasures #${i}`, () => R.runningMeasures(data, keys, today), () => N.runningMeasures(data, keys, today));
    C.call('Coach-Historie', `previousQuestionIds #${i}`, () => [R.previousQuestionIds(data, 'week', keys[0] || ''), R.previousQuestionIds(data, 'combined', keys[1] || '')], () => [N.previousQuestionIds(data, 'week', keys[0] || ''), N.previousQuestionIds(data, 'combined', keys[1] || '')]);
    const ans = r.pick([{ umfang: 'zuviel' }, { umfang: 'mehr' }, { 'pausen-hindernis': 'meetings' }, { ernaehrung: 'hafer' }, {}]);
    const max = r.pick([1, 3]);
    const run = M => { const m = M.weekMetrics(data, ws, today, undefined); return M.coachMeasures('week', m, ans, data, undefined, today, keys.length ? keys : [`W:${ws}`], max).map(x => [x.id, x.score, x.sig, x.title]); };
    C.call('Coach-Historie', `coachMeasures #${i}`, () => run(R), () => run(N));
  }
}
