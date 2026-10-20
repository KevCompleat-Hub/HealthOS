/**
 * Fachliche Unit-Tests des TypeScript-Kerns. Jeder Test belegt eine Geschäftsregel aus dem Implementierungsplan HOS-007
 * (GR-Nummern in Klammern). Sie ergänzen die Differenztests, die das Verhalten gegen die Referenz v5 absichern.
 */
import { describe, expect, it } from 'vitest';
import {
  A, addDays, applyMeasureState, berlinParts, buildExport, buildPlan, coachMeasures, completeReviewState, computeRecs, effStatus, goalAt, isoWeek,
  labAssessment, materialize, migrateSaved, nextActions, normalizeConfig, parseImport, persistableRecState, persistableReviews, recView, reviewOffer,
  seed, settle, slotItem, snapshotDocs, specAt, syncPlanRoutines, trainingSeries, trainingsInWeek, weekCoverage, weekMetrics, weeklyWindow, weekStart, wdIdx,
  type Item, type Lab, type State,
} from '../src/index.js';

const TODAY = '2026-10-19'; // Montag
const item = (p: Partial<Item>): Item => ({ id: 'x', routine: null, title: 'T', type: 'sonstiges', date: '2026-10-18', time: '10:00', duration: 10, status: 'geplant', ...p });

describe('Datum und Zeitzone (GR 1)', () => {
  it('liefert den Berliner Kalendertag unabhängig von UTC', () => {
    expect(berlinParts(new Date('2026-10-18T22:30:00Z'))).toEqual({ date: '2026-10-19', minutes: 30 });
    expect(berlinParts(new Date('2026-07-31T22:00:00Z'))).toEqual({ date: '2026-08-01', minutes: 0 });
  });
  it('rechnet über die Zeitumstellung kalendarisch', () => {
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
    expect(addDays('2027-03-27', 2)).toBe('2027-03-29');
    expect(berlinParts(new Date('2026-10-25T00:59:00Z')).minutes).toBe(2 * 60 + 59);
    expect(berlinParts(new Date('2026-10-25T01:00:00Z')).minutes).toBe(2 * 60);
  });
  it('kennt Wochenstart und Kalenderwoche über den Jahreswechsel', () => {
    expect(weekStart('2027-01-03')).toBe('2026-12-28');
    expect(isoWeek('2026-12-31')).toBe(53);
    expect(isoWeek('2027-01-04')).toBe(1);
    expect(wdIdx(TODAY)).toBe(0);
  });
});

describe('Aufgabenklassen und Tageswechsel (GR 2)', () => {
  it('schließt vergangene Einträge je Klasse ab', () => {
    const out = settle([
      item({ id: 'a', taskClass: 'same_day' }), item({ id: 'b', taskClass: 'weekly_flexible' }),
      item({ id: 'c', taskClass: 'optional_logging' }), item({ id: 'd', taskClass: 'deadline' }), item({ id: 'e', taskClass: 'same_day', date: TODAY }),
    ], TODAY);
    expect(out.map(i => i.status)).toEqual(['verpasst', 'verpasst', 'nicht_erfasst', 'geplant', 'geplant']);
  });
  it('zeigt abgelaufene Fristen als „faellig“ und nie vergangene Tagesaufgaben unter „Als Nächstes“', () => {
    const d = { items: [item({ id: 'f', taskClass: 'deadline' }), item({ id: 'p', taskClass: 'same_day' }), item({ id: 'h', taskClass: 'same_day', date: TODAY, time: '18:00' })] };
    expect(effStatus(d.items[0]!, TODAY)).toBe('faellig');
    expect(nextActions(d, TODAY, 600).map(i => i.id)).toEqual(['f', 'h']);
  });
});

describe('Planerzeugung und Routinen (GR 3 bis 7)', () => {
  const st = seed(TODAY);
  it('ist idempotent', () => {
    const once = materialize(st, TODAY), twice = materialize(once, TODAY);
    expect(twice.items.length).toBe(once.items.length);
    expect(new Set(twice.items.map(i => i.id)).size).toBe(twice.items.length);
  });
  it('überschreibt keine einzeln geänderten oder vergangenen Einträge', () => {
    const it0 = st.items.find(i => i.routine === 'pause1-ho' && i.date >= TODAY)!;
    const edited = A.editInstance(st, it0.id, 'instance', { time: '15:00', duration: 10 }, TODAY);
    const rt = edited.routines.find(r => r.id === 'pause1-ho')!;
    const changed = { ...edited, routines: edited.routines.map(r => (r.id === rt.id ? { ...r, versions: r.versions.map(v => ({ ...v, time: '09:00' })) } : r)) };
    const again = materialize(changed, TODAY);
    expect(again.items.find(i => i.id === it0.id)!.time).toBe('15:00');
    const past = st.items.find(i => i.date < TODAY && i.routine)!;
    expect(again.items.find(i => i.id === past.id)).toEqual(st.items.find(i => i.id === past.id));
  });
  it('wendet Versionen ab Datum und Wochentags-Ausnahmen an', () => {
    const it0 = st.items.find(i => i.routine === 'train-1' && i.date > TODAY)!;
    const next = A.editInstance(st, it0.id, 'weekday', { time: '06:30', duration: 45 }, TODAY);
    const rt = next.routines.find(r => r.id === 'train-1')!;
    expect(specAt(rt, it0.date)!.time).toBe('06:30');
    expect(specAt(rt, addDays(it0.date, -7))!.time).not.toBe('06:30');
  });
  it('setzt bei Pausen nur freie Einträge aus und stellt sie exakt wieder her', () => {
    const p = A.addPause(st, { kind: 'urlaub', from: TODAY, to: addDays(TODAY, 6), scope: 'alle' }, TODAY);
    expect(p.items.filter(i => i.status === 'pausiert').length).toBeGreaterThan(0);
    const back = A.removePause(p, p.pauses[0]!.id, TODAY);
    expect(back.items).toEqual(st.items);
  });
  it('lässt angepasste Routinen bei Planänderungen unverändert', () => {
    const custom = st.routines.map(r => (r.id === 'train-5' ? { ...r, customized: true } : r));
    const sync = syncPlanRoutines(custom, { training: { perWeek: 3, days: [0, 2, 4] } }, addDays(TODAY, 7));
    expect(sync.routines.find(r => r.id === 'train-5')).toEqual(custom.find(r => r.id === 'train-5'));
    expect(sync.kept.map(r => r.id)).toContain('train-5');
  });
});

describe('Ersatz und Zählung (GR 8 bis 10)', () => {
  it('Ersatz nur in derselben Woche, Original bleibt verpasst, Training nicht doppelt', () => {
    const st = seed('2026-10-22');
    const missed = { ...st, items: st.items.map(i => (i.routine === 'train-1' && i.date === '2026-10-20' ? { ...i, status: 'verpasst' as const } : i)) };
    const t = missed.items.find(i => i.routine === 'train-1' && i.date === '2026-10-20')!;
    const rep = A.replaceInWeek(missed, t.id, '2026-10-23');
    expect(rep.items.find(i => i.id === t.id)!.status).toBe('verpasst');
    const copy = rep.items.find(i => i.replaces === t.id)!;
    const done = A.toggleItem(rep, copy.id, '2026-10-23');
    expect(trainingsInWeek(done, '2026-10-23')).toBe(trainingsInWeek(rep, '2026-10-23') + 1);
    const withFree = A.logWorkout(done, { date: '2026-10-23', kind: 'Laufen', duration: 30, intensity: 2, counts: true }, copy.id);
    expect(trainingsInWeek(withFree, '2026-10-23')).toBe(trainingsInWeek(done, '2026-10-23'));
  });
});

describe('Health Intelligence (GR 12, 13)', () => {
  const lab = (p: Partial<Lab>): Lab => ({ id: 'l', analyte: 'LDL-Cholesterin', value: 130, unit: 'mg/dl', refMin: null, refMax: 115, date: '2026-09-01', lab: 'Demo', source: 'demo', confirmed: true, ...p });
  it('wertet nur eindeutige, bestätigte, aktuelle Werte mit Referenz aus', () => {
    expect(labAssessment([lab({})], 'ldl', TODAY).state).toBe('auffaellig');
    expect(labAssessment([lab({ unit: 'g/l' })], 'ldl', TODAY).state).toBe('unklar');
    expect(labAssessment([lab({ confirmed: false })], 'ldl', TODAY).state).toBe('unklar');
    expect(labAssessment([lab({ refMax: null })], 'ldl', TODAY).state).toBe('unklar');
    expect(labAssessment([lab({ date: '2025-01-01' })], 'ldl', TODAY).state).toBe('unklar');
    expect(labAssessment([lab({ id: 'a', date: '2026-08-01', value: 100 }), lab({})], 'ldl', TODAY).state).toBe('unklar');
    expect(labAssessment([], 'zink', TODAY).state).toBe('fehlt');
  });
  it('zeigt höchstens zwei neue Vorschläge pro Woche und keine Präparate', () => {
    const data = { labs: [lab({}), lab({ id: 'z', analyte: 'Zink', value: 60, unit: 'µg/dl', refMin: 70, refMax: 120 })], recState: {} };
    const cfg = { goals: ['werte', 'ernaehrung', 'bewegung'] };
    const v = recView(data, cfg, TODAY);
    expect(v.visible.length).toBeLessThanOrEqual(2);
    const all = computeRecs(data, cfg, TODAY);
    for (const r of all) expect(`${r.action} ${r.why}`).not.toMatch(/\d+\s*mg\b/);
    expect(persistableRecState({ 'ldl-muster': { status: 'angenommen' }, ballaststoffe: { status: 'abgelehnt' } })).toEqual({ ballaststoffe: { status: 'abgelehnt' } });
  });
});

describe('Reviews (GR 14 bis 17)', () => {
  it('trennt Analysezeitraum und Check-in-Termin für alle sieben Wochentage', () => {
    for (let wd = 0; wd <= 6; wd++) {
      const w = weeklyWindow('2026-10-21', { review: { weeklyDay: wd } });
      expect(w.target < w.start).toBe(true);
      expect(wdIdx(w.start)).toBe(wd);
    }
  });
  it('nutzt das damals gültige Wochenziel', () => {
    const st = seed(TODAY);
    const sync = syncPlanRoutines(st.routines, { training: { perWeek: 4, days: [0, 2, 4, 5] } }, '2026-10-26');
    const d = materialize({ ...st, routines: sync.routines }, TODAY);
    expect(goalAt(d, '2026-10-12')).toBe(2);
    expect(goalAt(d, '2026-10-26')).toBe(4);
  });
  it('zeigt Datenlücken nicht als 0', () => {
    const st = seed(TODAY);
    const series = trainingSeries(st, weekStart(TODAY), 12, TODAY);
    expect(series.some(x => x.coverage === 'keine' && x.value === null)).toBe(true);
    expect(weekCoverage(st, addDays(weekStart(TODAY), 7), TODAY)).toBe('zukunft');
  });
  it('bietet am 01.11.2026 einen gemeinsamen Ablauf an und schließt genau den Termin ab', () => {
    const st = seed('2026-11-01');
    const off = reviewOffer(st, undefined, '2026-11-01', 1100)!;
    expect(off.kind).toBe('combined');
    expect(off.keys).toEqual(['W:2026-10-26', 'M:2026-10']);
    const slot = slotItem(st, off)!;
    const done = completeReviewState(st, off, '2026-11-01', ['umfang'], 'voll');
    expect(done.reviews['W:2026-10-26']!.status).toBe('abgeschlossen');
    expect(done.items.find(i => i.id === slot.id)!.status).toBe('erledigt');
  });
  it('wendet Maßnahmen standardmäßig ab nächstem Montag an, Vorschau gleich Übernahme', () => {
    const st = seed('2026-11-01');
    const m = weekMetrics(st, '2026-10-26', '2026-11-01', undefined);
    const list = coachMeasures('week', m, { umfang: 'zuviel' }, st, undefined, '2026-11-01', ['W:2026-10-26']);
    const x = list.find(y => y.id === 'training-weniger')!;
    const a = applyMeasureState(st, undefined, x, '2026-11-01');
    const b = applyMeasureState(st, undefined, x, '2026-11-01');
    expect(a.from).toBe('2026-11-02');
    expect(JSON.stringify(a.data)).toBe(JSON.stringify(b.data));
    expect(a.cfg.training.perWeek).toBe(1);
  });
  it('speichert keine Antworten und keine laborbezogenen Maßnahmen', () => {
    const out = persistableReviews({ 'W:2026-10-12': { kind: 'week', status: 'abgeschlossen', at: '2026-10-18', measures: [{ id: 'a', title: '', area: 'x', check: '', metric: null, decision: 'übernommen', decidedAt: '2026-10-18', validFrom: '2026-10-19', lab: true }, { id: 'b', title: '', area: 'x', check: '', metric: null, decision: 'nicht jetzt', decidedAt: '2026-10-18', validFrom: null }], answers: { umfang: 'zuviel' } } as never });
    expect(out['W:2026-10-12']!.measures!.map(x => x.id)).toEqual(['b']);
    expect(JSON.stringify(out)).not.toContain('zuviel');
  });
});

describe('Export, Import, Migration (HOS-001)', () => {
  it('Export und Import ergeben denselben Plan', () => {
    const st: State = seed(TODAY);
    const res = parseImport(JSON.parse(JSON.stringify(buildExport(undefined, st, '2026-10-19T10:00:00.000Z'))));
    if ('error' in res) throw new Error(res.error);
    expect(res.state.routines.map(r => r.id)).toEqual(st.routines.map(r => r.id));
    expect(res.state.items.length).toBe(st.items.filter(i => !i.sessionOnly).length);
  });
  it('migriert gespeicherte Stände und neutralisiert Pausengründe', () => {
    const st = seed(TODAY);
    const docs = snapshotDocs(undefined, st, 'system') as Record<string, never>;
    const m = migrateSaved({ settings: { schema: 1, config: {} }, habits: { pauses: [{ id: 'p', reason: 'Krankheit', from: TODAY, to: TODAY }] }, weeks: Object.keys(docs).filter(k => k.startsWith('week:')).map(k => docs[k]) });
    expect(m.fromSchema).toBe(1);
    expect(m.pauses[0]).toEqual({ id: 'p', kind: 'auszeit', from: TODAY, to: TODAY, scope: 'alle' });
    expect(JSON.stringify(m)).not.toContain('Krankheit');
  });
  it('normalisiert jede Eingabe zu einer gültigen Konfiguration', () => {
    for (const x of [null, 5, 'x', [], { review: { weeklyDay: 9, weeklyTime: '' } }]) {
      const c = normalizeConfig(x);
      expect(c.review.weeklyDay).toBeGreaterThanOrEqual(0);
      expect(c.review.weeklyTime).toMatch(/^\d{2}:\d{2}$/);
      expect(buildPlan(c).tdays.length).toBeLessThanOrEqual(5);
    }
  });
  it('dokumentiert Befund B-01 der Referenz: nicht lesbare Check-in-Zeit wird nicht ersetzt', () => {
    // Referenz v5 prüft nur auf leere Zeit. „abends“ ergibt NaN statt null und bleibt stehen.
    // Die Planung verschiebt den Check-in dann mit irreführendem Ruhezeit-Hinweis auf 07:15. Bewusst unverändert übernommen, Entscheidung in M2.
    const c = normalizeConfig({ review: { weeklyTime: 'abends' } });
    expect(c.review.weeklyTime).toBe('abends');
    const plan = buildPlan(c);
    expect(plan.routines.find(r => r.key === 'review')!.time).toBe('07:15');
    expect(plan.notes).toContain('Wochen-Check-in liegt um 07:15 Uhr, damit nichts in deine Ruhezeit fällt.');
  });
});
