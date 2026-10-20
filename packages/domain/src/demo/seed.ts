/**
 * Fiktive Demo-Daten wie Referenz v5. Nur für Tests und Vorschau, nie mit echten Gesundheitsdaten mischen.
 */
import { DEFAULT_CONFIG, FOODS } from '../catalog.js';
import { normalizeConfig } from '../config.js';
import { syncHabits } from '../plan/build.js';
import { materialize } from '../plan/materialize.js';
import { instanceOf, specAt, syncPlanRoutines } from '../plan/routines.js';
import { weeklyWindow } from '../review/schedule.js';
import { snap } from '../status.js';
import type { Appointment, FavMeal, HabitLog, ISODate, Item, Lab, Meal, Reviews, State, Steps, Weight, Workout } from '../types.js';
import { addDays, pad, weekStart } from '../util/date.js';
import { rng, uid } from '../util/ids.js';

export function seed(today: ISODate, cfg: unknown = DEFAULT_CONFIG): State {
  const r = rng(11);
  const ws = weekStart(today);
  const routines = syncPlanRoutines([], cfg, '2000-01-01').routines;
  const items: Item[] = []; const workouts: Workout[] = [];
  for (let d = addDays(ws, -35); d < today; d = addDays(d, 1)) routines.forEach(rt => {
    const sp = specAt(rt, d); if (!sp) return;
    items.push(instanceOf(rt, sp, d, r() < 0.8 ? 'erledigt' : 'ausgelassen'));
  });
  // Demo: die letzte Bewegungspause vor heute wurde nicht gemacht und wird beim Tageswechsel zu „verpasst“
  const pastPauses = items.filter(i => (i.routine as string).startsWith('pause') && i.date >= ws);
  if (pastPauses.length) pastPauses[pastPauses.length - 1]!.status = 'geplant';
  items.filter(i => i.type === 'training' && i.status === 'erledigt').forEach(i =>
    workouts.push({ id: uid('w'), date: i.date, kind: i.kind || 'Krafttraining', duration: i.duration, intensity: 2, counts: true, itemId: i.id, source: 'demo' }));
  for (let w = 6; w <= 9; w++) {
    const start = addDays(ws, -w * 7);
    const n = r() < 0.2 ? 0 : r() < 0.55 ? 1 : 2;
    [1, 5].slice(0, n).forEach(di => workouts.push({ id: uid('w'), date: addDays(start, di), kind: di === 1 ? 'Krafttraining' : 'Radfahren', duration: di === 1 ? 55 : 70, intensity: 2, counts: true, source: 'demo' }));
  }
  // Demo-Aufgabe mit Frist: bleibt offen, bis sie erledigt oder verworfen wird
  items.push({ id: 'demo-frist', routine: null, title: 'Impfpass heraussuchen', type: 'sonstiges', taskClass: 'deadline', priority: 'normal', date: addDays(today, -2), time: '', duration: null, status: 'geplant', note: 'Demo-Aufgabe mit Frist. Sie bleibt sichtbar, bis du sie erledigst oder verwirfst.' });
  const weights: Weight[] = [];
  for (let i = 120; i >= 1; i--) if (r() < 0.45)
    weights.push({ id: uid('wg'), date: addDays(today, -i), time: `07:${pad(Math.floor(r() * 50) + 5)}`, kg: Math.round((88.6 - (120 - i) * 0.022 + (r() - 0.5) * 0.9) * 10) / 10, note: '', source: 'demo' });
  const steps: Steps[] = [];
  for (let i = 45; i >= 1; i--) if (r() < 0.78)
    steps.push({ id: uid('st'), date: addDays(today, -i), count: Math.round((3800 + r() * 7600) / 10) * 10, source: 'demo' });
  const foods = FOODS.map(f => ({ ...f, fav: ['oats', 'skyr', 'chicken', 'rice'].includes(f.id), custom: false }));
  const favMeals: FavMeal[] = [
    { id: 'fm1', name: 'Overnight Oats', items: [['oats', 60], ['skyr', 150], ['banana', 100]] },
    { id: 'fm2', name: 'Hähnchen-Reis-Bowl', items: [['chicken', 150], ['rice', 180], ['broccoli', 150]] },
    { id: 'fm3', name: 'Brot mit Hummus und Apfel', items: [['bread', 100], ['hummus', 50], ['apple', 150]] },
  ];
  const meals: Meal[] = [];
  const addFav = (date: ISODate, meal: string, fm: FavMeal) => fm.items.forEach(([fid, q]) => { const f = foods.find(x => x.id === fid)!; meals.push({ id: uid('m'), date, meal, name: f.name, qty: q, unit: 'g', snap: snap(f, q), source: 'demo' }); });
  for (let i = 6; i >= 1; i--) {
    const date = addDays(today, -i);
    if (r() < 0.85) addFav(date, 'Frühstück', favMeals[0]!);
    if (r() < 0.75) addFav(date, 'Mittagessen', favMeals[1]!);
    if (r() < 0.7) addFav(date, 'Abendessen', favMeals[2]!);
  }
  addFav(today, 'Frühstück', favMeals[0]!);
  const lab = (analyte: string, value: number, unit: string, refMin: number | null, refMax: number | null, ago: number, confirmed = true): Lab => ({ id: uid('lab'), analyte, value, unit, refMin, refMax, date: addDays(today, -ago), lab: 'Demo-Labor', source: 'demo', confirmed });
  const labs: Lab[] = [
    lab('LDL-Cholesterin', 128, 'mg/dl', null, 115, 380), lab('LDL-Cholesterin', 124, 'mg/dl', null, 115, 40),
    lab('HbA1c', 5.3, '%', 4.0, 5.6, 380), lab('HbA1c', 5.4, '%', 4.0, 5.6, 40),
    lab('Vitamin D (25-OH)', 48, 'nmol/l', 75, 250, 720), lab('Vitamin D (25-OH)', 22, 'ng/ml', 30, 100, 380), lab('Vitamin D (25-OH)', 41, 'ng/ml', 30, 100, 40),
    lab('Ferritin', 96, 'µg/l', 30, 400, 40),
    lab('Zink', 62, 'µg/dl', 70, 120, 40),
  ];
  const appointments: Appointment[] = [
    { id: 'ap1', title: 'Blutabnahme', practice: 'Hausarztpraxis (Demo)', date: addDays(today, 2), time: '08:00', status: 'vereinbart', link: '', note: 'Demo-Notiz: Überweisungsschein mitnehmen.' },
    { id: 'ap2', title: 'Befundbesprechung', practice: 'Hausarztpraxis (Demo)', date: addDays(today, 9), time: '10:15', status: 'vereinbart', link: '', note: '' },
    { id: 'ap3', title: 'Zahnärztliche Kontrolle', practice: 'Zahnarztpraxis (Demo)', date: addDays(today, 35), time: '', status: 'offen', link: '', note: 'Termin noch vereinbaren.' },
    { id: 'ap4', title: 'Augenärztliche Kontrolle', practice: 'Augenarztpraxis (Demo)', date: addDays(today, -50), time: '15:30', status: 'erledigt', link: '', note: '' },
  ];
  const habits = syncHabits([], cfg);
  const habitLog: HabitLog = {};
  for (let i = 1; i <= 13; i++) { const d = addDays(today, -i); habits.forEach(h => { const x = r(); if (x < 0.62) habitLog[`${h.id}|${d}`] = 'done'; else if (x < 0.72) habitLog[`${h.id}|${d}`] = 'skip'; }); }
  /* Demo-Historie immer vor dem aktuell zu prüfenden Zeitraum */
  const tw0 = weeklyWindow(today, cfg).target;
  const reviews: Reviews = {
    [`W:${addDays(tw0, -7)}`]: { kind: 'week', status: 'abgeschlossen', at: addDays(tw0, -1), questionIds: ['umfang', 'pausen-hindernis'], measures: [{ id: 'fortfuehren', title: 'Alles so fortführen', area: 'alles', check: 'Beim nächsten Review vergleichen.', metric: null, decision: 'übernommen', decidedAt: addDays(tw0, -1), validFrom: tw0 }], demo: true },
    [`W:${addDays(tw0, -14)}`]: { kind: 'week', status: 'uebersprungen', at: addDays(tw0, -8), questionIds: [], measures: [], demo: true },
  };
  /* Check-in-Termine der Demo passend zur Review-Historie */
  const wdR = normalizeConfig(cfg).review.weeklyDay;
  const slotOf = (t: ISODate) => (wdR >= 4 ? addDays(t, wdR) : addDays(t, 7 + wdR));
  items.forEach(i => { if (i.routine === 'review' && i.date < today) i.status = i.date === slotOf(addDays(tw0, -7)) ? 'erledigt' : 'geplant'; });
  return materialize({ routines, items, workouts, weights, steps, foods, favMeals, meals, labs, appointments, habits, habitLog, dismissed: [], pauses: [], recState: {}, reviews }, today);
}
