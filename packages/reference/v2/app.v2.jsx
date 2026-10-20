/* HealthOS – Demo-Prototyp. Alle Daten sind fiktiv und liegen nur im Arbeitsspeicher. */
const { useState, useMemo, useEffect, useRef } = React;

/* ---------------- Datum & Format ---------------- */
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const wdIdx = s => (parse(s).getDay() + 6) % 7;
const weekStart = s => addDays(s, -wdIdx(s));
const weekDays = s => Array.from({ length: 7 }, (_, i) => addDays(weekStart(s), i));
const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
const fmtLong = s => parse(s).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtShort = s => parse(s).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
const fmtDM = s => { const d = parse(s); return `${d.getDate()}.${d.getMonth() + 1}.`; };
const fmtNum = (n, d = 0) => Number(n).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtVal = v => Number(v).toLocaleString('de-DE', { maximumFractionDigits: 2 });
const parseNum = s => { const t = String(s ?? '').trim().replace(',', '.'); return t === '' ? NaN : Number(t); };
const toMin = t => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const byTime = (a, b) => (a.date + (a.time || '99:99')).localeCompare(b.date + (b.time || '99:99'));
const isoWeek = s => {
  const d = parse(s); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
};
const dayLabel = (s, today) => {
  if (s === today) return 'Heute';
  if (s === addDays(today, 1)) return 'Morgen';
  if (s === addDays(today, -1)) return 'Gestern';
  return `${WD[wdIdx(s)]}, ${fmtDM(s)}`;
};
const dayLabelLc = (s, today) => { const l = dayLabel(s, today); return ['Heute', 'Morgen', 'Gestern'].includes(l) ? l.toLowerCase() : l; };
const avg = a => a.reduce((s, x) => s + x, 0) / a.length;
const signed = (v, d = 1) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${fmtNum(Math.abs(v), d)}`;

let _id = 0;
const uid = p => `${p}_${++_id}_${Math.random().toString(36).slice(2, 6)}`;
function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------------- Stammdaten der Demo ---------------- */
const TYPES = {
  training: { label: 'Training', icon: 'dumbbell' },
  bewegung: { label: 'Bewegung', icon: 'activity' },
  ernaehrung: { label: 'Ernährung', icon: 'utensils' },
  messen: { label: 'Messen', icon: 'scale' },
  rueckblick: { label: 'Rückblick', icon: 'trend' },
  sonstiges: { label: 'Sonstiges', icon: 'clock' },
};

/* ---------------- Konfiguration & Planungs-Engine ---------------- */
/* Datenmodell ist bewusst an das spätere Supabase-Schema angelehnt:
   config -> user_preferences, buildPlan().routines -> habit_templates,
   items -> agenda_items (Instanzen), habits/habitLog -> habits/habit_events,
   pauses -> schedule_exceptions. Siehe buildExport(). */
const SCHEMA = 1;
const GOALS = { abnehmen: 'Abnehmen', fitter: 'Fitter werden', bewegung: 'Mehr Bewegung', ernaehrung: 'Bessere Ernährung', werte: 'Gesundheitswerte verbessern', routinen: 'Routinen aufbauen' };
const PLACES = {
  studio: { label: 'Fitnessstudio', title: 'Krafttraining im Studio', kind: 'Krafttraining' },
  zuhause: { label: 'Zuhause', title: 'Home-Workout', kind: 'Home-Workout' },
  walkingpad: { label: 'Walking-Pad', title: 'Walking-Pad-Einheit', kind: 'Gehen' },
  spazieren: { label: 'Spazierengehen', title: 'Zügiger Spaziergang', kind: 'Gehen' },
  laufen: { label: 'Laufen', title: 'Lauftraining', kind: 'Laufen' },
  rad: { label: 'Radfahren', title: 'Radtour', kind: 'Radfahren' },
  schwimmen: { label: 'Schwimmen', title: 'Schwimmen', kind: 'Schwimmen' },
};
const HABIT_LIBRARY = {
  wasser: { name: 'Zwei Liter Wasser', goals: ['ernaehrung', 'abnehmen', 'werte'] },
  gemuese: { name: 'Gemüse zu einer Hauptmahlzeit', goals: ['ernaehrung', 'werte', 'abnehmen'] },
  getraenke: { name: 'Süße Getränke durch Wasser ersetzen', goals: ['abnehmen', 'ernaehrung'] },
  treppe: { name: 'Treppe statt Aufzug', goals: ['bewegung', 'fitter', 'abnehmen'] },
  abendrunde: { name: 'Kurze Runde nach dem Abendessen', goals: ['bewegung', 'werte'] },
  schlaf: { name: 'Feste Schlafenszeit', goals: ['routinen', 'fitter', 'werte'] },
  bildschirm: { name: 'Bildschirm aus ab 22:30', goals: ['routinen'] },
};
const SLOTS = { morgens: 'Morgens', mittags: 'Mittags', abends: 'Abends' };
const INTENSITIES = { sanft: ['Sanft', 'Nur das Wichtigste, höchstens ein Hinweis.'], ausgewogen: ['Ausgewogen', 'Offene Aufgaben der letzten Tage und nahe Termine.'], deutlich: ['Deutlich', 'Alle offenen Punkte, auch ältere.'] };
const TONES = { ruhig: ['Ruhig', '1 von 2 Trainingseinheiten erledigt.'], ausgewogen: ['Ausgewogen', '1 von 2 Trainingseinheiten erledigt. Das passt gut in die Woche.'], anspornend: ['Anspornend', '1 von 2 Trainingseinheiten erledigt. Noch 1 bis zum Wochenziel.'] };
const PAUSE_REASONS = ['Urlaub', 'Krankheit', 'Erholung', 'Sonstiges'];
const DEFAULT_CONFIG = {
  schema: SCHEMA, onboardingDone: false, skipped: false,
  goals: ['fitter', 'bewegung'],
  work: { days: [0, 1, 2, 3, 4], home: [0, 4], start: '08:30', end: '17:30', lunch: '12:30', lunchDur: 30 },
  breaks: { perDay: 1, duration: 15 },
  training: { places: ['studio', 'rad', 'spazieren'], perWeek: 2, days: [1, 5], slot: 'abends', duration: 60, freeDay: true },
  nutrition: { calories: true, weight: false, weightPerWeek: 2, habitsFirst: false },
  habits: ['wasser', 'treppe', 'bildschirm'],
  reminders: { intensity: 'ausgewogen', lead: 15, quietFrom: '22:00', quietTo: '07:00' },
  motivation: 'ausgewogen',
};
const clone = o => JSON.parse(JSON.stringify(o));
function normalizeConfig(c) {
  const d = clone(DEFAULT_CONFIG);
  if (!c || typeof c !== 'object') return d;
  const arr = (v, f) => (Array.isArray(v) ? v : f);
  const n = { ...d, ...c, work: { ...d.work, ...(c.work || {}) }, breaks: { ...d.breaks, ...(c.breaks || {}) }, training: { ...d.training, ...(c.training || {}) }, nutrition: { ...d.nutrition, ...(c.nutrition || {}) }, reminders: { ...d.reminders, ...(c.reminders || {}) }, schema: SCHEMA };
  n.goals = arr(n.goals, d.goals).filter(g => GOALS[g]);
  n.habits = arr(n.habits, d.habits).filter(h => HABIT_LIBRARY[h]);
  n.work.days = arr(n.work.days, d.work.days); n.work.home = arr(n.work.home, []).filter(x => n.work.days.includes(x));
  n.training.days = arr(n.training.days, d.training.days); n.training.places = arr(n.training.places, d.training.places).filter(p => PLACES[p]);
  return n;
}
const hm = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const r15 = m => Math.round(m / 15) * 15;
const wdist = (a, b) => { const x = Math.abs(a - b); return Math.min(x, 7 - x); };
function spreadPick(pool, n, fixed = []) {
  const sel = [...fixed]; const left = pool.filter(d => !sel.includes(d)); const out = [];
  while (out.length < n && left.length) {
    let best = left[0], score = -1;
    left.forEach(d => { const s = sel.length ? Math.min(...sel.map(x => wdist(x, d))) : 0; if (s > score) { score = s; best = d; } });
    sel.push(best); out.push(best); left.splice(left.indexOf(best), 1);
  }
  return out;
}
function inQuiet(m, q) {
  const f = toMin(q.quietFrom), t = toMin(q.quietTo);
  if (f == null || t == null || f === t) return false;
  return f > t ? (m >= f || m < t) : (m >= f && m < t);
}
function fitQuiet(start, dur, q) {
  const ok = m => m >= 0 && m + dur <= 1440 && !inQuiet(m, q) && !inQuiet(m + Math.max(0, dur - 1), q);
  if (ok(start)) return { m: start, shifted: false };
  const f = toMin(q.quietFrom), t = toMin(q.quietTo);
  const earlier = Math.floor((f - dur - 15) / 15) * 15;
  if (start >= 720 && ok(earlier)) return { m: earlier, shifted: true };
  const later = Math.ceil((t + 15) / 15) * 15;
  if (ok(later)) return { m: later, shifted: true };
  return { m: start, shifted: false };
}
function buildPlan(cfg) {
  const c = normalizeConfig(cfg);
  const routines = [], notes = [], warn = [];
  const work = c.work.days, home = c.work.home;
  const push = r => {
    const f = fitQuiet(toMin(r.time), r.duration, c.reminders);
    if (f.shifted) notes.push(`${r.title} liegt um ${hm(f.m)} Uhr, damit nichts in deine Ruhezeit fällt.`);
    routines.push({ ...r, time: hm(f.m) });
  };
  const prefDays = [...new Set(c.training.days)].filter(d => d >= 0 && d < 7);
  let freeDay = null;
  if (c.training.freeDay) {
    const order = [6, 5, 0, 1, 2, 3, 4];
    const cands = [...order.filter(d => !work.includes(d)), ...order.filter(d => work.includes(d))];
    freeDay = cands.find(d => !prefDays.includes(d));
    if (freeDay == null) freeDay = cands[0];
  }
  const avail = [0, 1, 2, 3, 4, 5, 6].filter(d => d !== freeDay);
  const per = Math.max(0, Math.min(5, Math.round(c.training.perWeek || 0)));
  if ((c.training.perWeek || 0) > 5) warn.push('Es werden höchstens 5 Trainingseinheiten pro Woche geplant.');
  const prefAvail = prefDays.filter(d => avail.includes(d));
  const tdays = (per <= prefAvail.length ? spreadPick(prefAvail, per) : [...prefAvail, ...spreadPick(avail.filter(d => !prefAvail.includes(d)), per - prefAvail.length, prefAvail)]).sort((a, b) => a - b);
  const added = tdays.filter(d => !prefAvail.includes(d));
  if (added.length) notes.push(`Für ${per} Einheiten hat die Planung ${added.map(d => WD[d]).join(', ')} mit möglichst viel Abstand ergänzt.`);
  if (per && prefAvail.length > per) notes.push(`Von deinen ${prefAvail.length} bevorzugten Tagen werden ${per} mit möglichst viel Abstand genutzt.`);
  if (freeDay != null && prefDays.includes(freeDay)) notes.push(`${WD[freeDay]} bleibt als freier Tag frei, obwohl er als Trainingstag gewählt war.`);
  if (!per) notes.push('Keine Trainingseinheiten geplant. Bewegungspausen und Gewohnheiten bleiben aktiv.');
  const places = c.training.places;
  const pickPlace = d => {
    const pref = !work.includes(d) ? ['rad', 'laufen', 'schwimmen', 'studio', 'zuhause', 'spazieren', 'walkingpad']
      : home.includes(d) ? ['zuhause', 'walkingpad', 'studio', 'laufen', 'rad', 'schwimmen', 'spazieren']
        : ['studio', 'zuhause', 'schwimmen', 'laufen', 'rad', 'walkingpad', 'spazieren'];
    return pref.find(p => places.includes(p)) || null;
  };
  const dur = Math.max(10, Math.min(180, Number(c.training.duration) || 45));
  const lunch = toMin(c.work.lunch) ?? 750, lunchDur = Number(c.work.lunchDur) || 30;
  const wStart = toMin(c.work.start) ?? 510, wEnd = toMin(c.work.end) ?? 1050;
  const tTime = d => {
    const isWork = work.includes(d);
    if (c.training.slot === 'morgens') return isWork ? Math.max(330, r15(wStart - dur - 30)) : 570;
    if (c.training.slot === 'mittags') return isWork ? lunch : 720;
    return isWork ? Math.min(1380 - dur, r15(wEnd + 60)) : 1020;
  };
  tdays.forEach(d => {
    const p = pickPlace(d); const P = p ? PLACES[p] : { title: 'Training nach Wahl', kind: 'Sonstiges' };
    push({ key: `train-${d}`, title: P.title, kind: P.kind, type: 'training', days: [d], time: hm(tTime(d)), duration: dur, note: c.training.slot === 'mittags' && work.includes(d) ? 'Ersetzt an diesem Tag die Bewegungspause zur Mittagszeit.' : '' });
  });
  const perDay = Math.max(0, Math.min(2, Number(c.breaks.perDay) || 0));
  const bdur = Math.max(5, Math.min(30, Number(c.breaks.duration) || 15));
  if (perDay && work.length) {
    const lunchTrain = c.training.slot === 'mittags' ? tdays.filter(d => work.includes(d)) : [];
    const hoNote = places.includes('walkingpad') ? 'Walking-Pad oder eine Runde um den Block.' : 'Eine Runde um den Block oder ein paar Dehnübungen.';
    const ofNote = 'Treppe, eine Runde ums Gebäude oder kurz dehnen.';
    const ho1 = work.filter(d => home.includes(d) && !lunchTrain.includes(d)), of1 = work.filter(d => !home.includes(d) && !lunchTrain.includes(d));
    if (ho1.length) push({ key: 'pause1-ho', title: 'Bewegungspause', type: 'bewegung', days: ho1, time: hm(lunch), duration: bdur, note: hoNote });
    if (of1.length) push({ key: 'pause1-buero', title: 'Bewegungspause', type: 'bewegung', days: of1, time: hm(lunch), duration: bdur, note: ofNote });
    if (perDay === 2) {
      const pm = r15((lunch + lunchDur + wEnd) / 2);
      const ho2 = work.filter(d => home.includes(d)), of2 = work.filter(d => !home.includes(d));
      if (ho2.length) push({ key: 'pause2-ho', title: 'Bewegungspause am Nachmittag', type: 'bewegung', days: ho2, time: hm(pm), duration: bdur, note: hoNote });
      if (of2.length) push({ key: 'pause2-buero', title: 'Bewegungspause am Nachmittag', type: 'bewegung', days: of2, time: hm(pm), duration: bdur, note: ofNote });
    }
  }
  if (places.includes('spazieren') && c.goals.some(g => ['bewegung', 'abnehmen', 'werte'].includes(g))) {
    const wd = [6, 5].find(d => d !== freeDay && !tdays.includes(d));
    if (wd != null) push({ key: 'walk', title: 'Spaziergang', type: 'bewegung', days: [wd], time: '11:00', duration: 40, note: 'Gern draußen und ohne Tempo-Vorgabe.' });
  }
  if (c.nutrition.weight) {
    const n = Math.max(1, Math.min(3, Number(c.nutrition.weightPerWeek) || 2));
    push({ key: 'weigh', title: 'Gewicht erfassen', type: 'messen', days: n === 1 ? [0] : n === 2 ? [0, 3] : [0, 2, 4], time: hm(Math.max(360, Math.min(450, wStart - 30))), duration: 2, note: 'Möglichst unter ähnlichen Bedingungen, zum Beispiel morgens.' });
  }
  if (c.nutrition.calories) push({ key: 'meals', title: 'Mahlzeiten eintragen', type: 'ernaehrung', days: [0, 1, 2, 3, 4, 5, 6], time: '20:30', duration: 5, note: '' });
  const rd = freeDay != null && (freeDay === 5 || freeDay === 6) ? freeDay : 6;
  push({ key: 'review', title: 'Wochenrückblick', type: 'rueckblick', days: [rd], time: '18:00', duration: 15, note: 'Kurz zurückschauen und die nächste Woche planen.' });
  const load = [0, 1, 2, 3, 4, 5, 6].map(d => routines.filter(r => r.days.includes(d) && (r.type === 'training' || r.type === 'bewegung')).reduce((s, r) => s + r.duration, 0));
  load.forEach((m, d) => { if (m > 120) warn.push(`${WD[d]}: über zwei Stunden Aktivität geplant. Prüfe, ob das realistisch ist.`); });
  if (per === 5) warn.push('Fünf Trainingseinheiten sind für den Einstieg viel. Du kannst jederzeit reduzieren.');
  const consec = tdays.filter(d => tdays.includes((d + 1) % 7) && !(d === 6 && !tdays.includes(0)));
  if (consec.length) notes.push(`Training an aufeinanderfolgenden Tagen (${consec.map(d => `${WD[d]} und ${WD[(d + 1) % 7]}`).join(', ')}). Prüfe, ob dir das passt.`);
  return {
    routines, freeDay, tdays, notes, warn,
    summary: { trainings: tdays.length, pauses: routines.filter(r => r.key.startsWith('pause')).reduce((s, r) => s + r.days.length, 0), activeMin: load.reduce((s, m) => s + m, 0) },
  };
}
function suggestHabits(goals) {
  const score = k => goals.reduce((s, g, i) => s + (HABIT_LIBRARY[k].goals.includes(g) ? 6 - i : 0), 0);
  const top = Object.keys(HABIT_LIBRARY).map(k => [k, score(k)]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  return top.length ? top : ['wasser', 'treppe', 'bildschirm'];
}
function syncHabits(habits, cfg) {
  const want = new Set(normalizeConfig(cfg).habits);
  const out = (habits || []).map(h => (h.lib ? { ...h, active: want.has(h.lib) } : h));
  want.forEach(k => { if (!out.some(h => h.lib === k)) out.push({ id: `h-${k}`, lib: k, name: HABIT_LIBRARY[k].name, active: true }); });
  return out;
}
const instanceOf = (r, date, status = 'geplant') => ({ id: `r:${r.key}:${date}`, routine: r.key, title: r.title, type: r.type, kind: r.kind, date, time: r.time, duration: r.duration, note: r.note || '', status });
const isPlanFree = (it, today) => !!it.routine && !it.movedFrom && it.date >= today && (it.status === 'geplant' || it.status === 'pausiert');
function applyPauses(items, pauses, today) {
  return items.map(it => {
    if (!isPlanFree(it, today)) return it;
    const p = (pauses || []).find(x => it.date >= x.from && it.date <= x.to && (x.scope === 'alle' || it.type === 'training'));
    if (p) return it.status === 'pausiert' && it.pauseId === p.id ? it : { ...it, status: 'pausiert', pauseId: p.id };
    if (it.status === 'pausiert') { const { pauseId, ...rest } = it; return { ...rest, status: 'geplant' }; }
    return it;
  });
}
/* Erzeugt Instanzen ab heute bis Ende nächster Woche. Idempotent: feste IDs je Routine und Tag.
   Vergangene, erledigte, ausgelassene, verschobene und manuelle Einträge bleiben unangetastet. */
function materialize(st, cfg, today) {
  const plan = buildPlan(cfg);
  const rmap = new Map(plan.routines.map(r => [r.key, r]));
  const end = addDays(weekStart(today), 13);
  const items = [];
  st.items.forEach(it => {
    if (!isPlanFree(it, today)) { items.push(it); return; }
    const r = rmap.get(it.routine);
    if (!r || !r.days.includes(wdIdx(it.date))) return;
    items.push({ ...it, title: r.title, type: r.type, kind: r.kind, time: r.time, duration: r.duration, note: r.note || '' });
  });
  const have = new Set(items.map(i => i.id));
  for (let d = today; d <= end; d = addDays(d, 1)) plan.routines.forEach(r => {
    if (!r.days.includes(wdIdx(d))) return;
    const id = `r:${r.key}:${d}`;
    if (!have.has(id)) { have.add(id); items.push(instanceOf(r, d)); }
  });
  return { ...st, items: applyPauses(items, st.pauses, today) };
}
function planDiff(a, b, today) {
  const fut = l => new Map(l.filter(i => isPlanFree(i, today)).map(i => [i.id, i]));
  const A_ = fut(a), B_ = fut(b); let added = 0, removed = 0, changed = 0;
  B_.forEach((v, k) => { const o = A_.get(k); if (!o) added++; else if (o.time !== v.time || o.duration !== v.duration || o.title !== v.title || o.status !== v.status) changed++; });
  A_.forEach((v, k) => { if (!B_.has(k)) removed++; });
  return { added, removed, changed, kept: b.length - B_.size };
}
const pausedAll = (data, d) => (data.pauses || []).some(p => p.scope === 'alle' && d >= p.from && d <= p.to);
function validateBody(b) {
  const chk = (v, lo, hi, msg) => { if (String(v).trim() === '') return ''; const n = parseNum(v); return n >= lo && n <= hi ? '' : msg; };
  return chk(b.age, 18, 110, 'Bitte ein Alter zwischen 18 und 110 eingeben oder das Feld leer lassen.')
    || chk(b.height, 120, 230, 'Bitte eine Körpergröße zwischen 120 und 230 cm eingeben oder das Feld leer lassen.')
    || chk(b.weight, 30, 300, 'Bitte ein Gewicht zwischen 30 und 300 kg eingeben oder das Feld leer lassen.');
}
function workError(c) {
  const s = toMin(c.work.start), e = toMin(c.work.end), l = toMin(c.work.lunch);
  if (!c.work.days.length) return '';
  if (s == null || e == null) return 'Bitte Arbeitsbeginn und Arbeitsende angeben.';
  if (e <= s) return 'Das Arbeitsende muss nach dem Arbeitsbeginn liegen.';
  if (l == null) return 'Bitte eine Uhrzeit für die Mittagspause angeben.';
  return '';
}
function buildExport(cfg, data) {
  const plan = buildPlan(cfg);
  return {
    format: 'healthos-export', schema: SCHEMA, exportedAt: new Date().toISOString(), timezone: 'Europe/Berlin',
    hinweis: 'Nur Einstellungen und Wochenplan aus der Demo. Keine Messwerte, Laborwerte, Termine oder Basisdaten.',
    tables: {
      user_preferences: [normalizeConfig(cfg)],
      habit_templates: plan.routines.map(r => ({ key: r.key, title: r.title, type: r.type, weekdays: r.days, time_local: r.time, duration_min: r.duration, note: r.note || null })),
      agenda_items: data.items.map(i => ({ id: i.id, routine_key: i.routine || null, title: i.title, type: i.type, planned_date: i.date, planned_time: i.time || null, duration_min: i.duration || null, status: i.status, moved_from: i.movedFrom || null, moved_to: i.movedTo || null, pause_id: i.pauseId || null })),
      habits: data.habits.map(h => ({ id: h.id, name: h.name, library_key: h.lib || null, active: h.active !== false })),
      habit_events: Object.entries(data.habitLog).map(([k, v]) => { const [hid, date] = k.split('|'); return { habit_id: hid, date, status: v }; }),
      schedule_exceptions: (data.pauses || []).map(p => ({ id: p.id, reason: p.reason, from_date: p.from, to_date: p.to, scope: p.scope })),
    },
  };
}

/* ---------------- Persönlicher Artifact-Speicher (claude.use("db")) ---------------- */
const Store = {
  async connect() {
    if (typeof window === 'undefined' || !window.claude || typeof window.claude.use !== 'function') return null;
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user) return null;
    const id = await user.id();
    if (!id) return null;
    return { db, base: `data/users/${id}` };
  },
  refs(c) { const settings = c.db.doc(`${c.base}/settings`); return { settings, habits: c.db.doc(`${c.base}/habits`), weeks: settings.collection('weeks') }; },
  async load(c) {
    const r = Store.refs(c);
    const s = await r.settings.get();
    if (!s.exists) return null;
    const [h, w] = await Promise.all([r.habits.get(), r.weeks.get()]);
    return { settings: s.data(), habits: h.exists ? h.data() : null, weeks: w.docs.map(d => ({ id: d.id, ...d.data() })) };
  },
  async write(ref, body) {
    try { await ref.set(body); } catch (e) {
      if (e && e.code === 'unavailable') { await new Promise(res => setTimeout(res, 500 + Math.random() * 700)); await ref.set(body); } else throw e;
    }
  },
  async deleteAll(c) {
    const r = Store.refs(c);
    const w = await r.weeks.get();
    for (const d of w.docs) await r.weeks.doc(d.id).delete();
    await r.habits.delete(); await r.settings.delete();
  },
};
/* Gespeichert werden nur Konfiguration und Plan. Messwerte, Laborwerte, Termine und Basisdaten nicht. */
function snapshotDocs(cfg, data, theme) {
  const docs = {
    settings: { schema: SCHEMA, config: normalizeConfig(cfg), theme },
    habits: { schema: SCHEMA, habits: data.habits, habitLog: data.habitLog, pauses: data.pauses || [], dismissed: data.dismissed },
  };
  const weeks = {};
  data.items.forEach(i => { const ws = weekStart(i.date); (weeks[ws] = weeks[ws] || []).push(i); });
  Object.keys(weeks).sort().forEach(ws => { docs[`week:${ws}`] = { schema: SCHEMA, weekStart: ws, items: weeks[ws] }; });
  return JSON.parse(JSON.stringify(docs));
}

/* Nährwerte je 100 g: grobe Demo-Werte, nicht geprüft */
const FOODS = [
  { id: 'oats', name: 'Haferflocken', kcal: 370, p: 13, c: 59, f: 7 },
  { id: 'skyr', name: 'Skyr natur', kcal: 63, p: 11, c: 4, f: 0.2 },
  { id: 'banana', name: 'Banane', kcal: 93, p: 1.2, c: 20, f: 0.2 },
  { id: 'chicken', name: 'Hähnchenbrust, gegart', kcal: 165, p: 31, c: 0, f: 3.6 },
  { id: 'rice', name: 'Basmatireis, gekocht', kcal: 130, p: 2.7, c: 28, f: 0.3 },
  { id: 'broccoli', name: 'Brokkoli', kcal: 34, p: 2.8, c: 4, f: 0.4 },
  { id: 'bread', name: 'Vollkornbrot', kcal: 220, p: 8, c: 38, f: 2 },
  { id: 'hummus', name: 'Hummus', kcal: 250, p: 7, c: 14, f: 18 },
  { id: 'salmon', name: 'Lachs, gegart', kcal: 208, p: 20, c: 0, f: 13 },
  { id: 'apple', name: 'Apfel', kcal: 52, p: 0.3, c: 14, f: 0.2 },
  { id: 'potato', name: 'Kartoffeln, gekocht', kcal: 86, p: 2, c: 18, f: 0.1 },
  { id: 'egg', name: 'Ei, gekocht', kcal: 155, p: 13, c: 1, f: 11 },
];
const MEALS = ['Frühstück', 'Mittagessen', 'Abendessen', 'Snack'];
const MAIN_MEALS = ['Frühstück', 'Mittagessen', 'Abendessen'];
const snap = (food, qty) => { const k = qty / 100; return { kcal: Math.round(food.kcal * k), p: +(food.p * k).toFixed(1), c: +(food.c * k).toFixed(1), f: +(food.f * k).toFixed(1) }; };
const WORKOUT_KINDS = ['Krafttraining', 'Home-Workout', 'Laufen', 'Gehen', 'Radfahren', 'Schwimmen', 'Yoga', 'Sonstiges'];
const INTENSITY = ['leicht', 'moderat', 'fordernd', 'hart', 'maximal'];
const APPT_STATUS = { offen: 'Offen', vereinbart: 'Vereinbart', erledigt: 'Erledigt', aufgeschoben: 'Aufgeschoben' };

function seed(today, cfg = DEFAULT_CONFIG) {
  const r = rng(11);
  const ws = weekStart(today);
  const plan = buildPlan(cfg);
  const items = []; const workouts = [];
  for (let d = addDays(ws, -7); d < today; d = addDays(d, 1)) plan.routines.forEach(rt => {
    if (rt.days.includes(wdIdx(d))) items.push(instanceOf(rt, d, r() < 0.8 ? 'erledigt' : 'ausgelassen'));
  });
  // genau ein überfälliger Eintrag: letzte Bewegungspause vor heute in dieser Woche
  const pastPauses = items.filter(i => i.routine.startsWith('pause') && i.date >= ws);
  if (pastPauses.length) pastPauses[pastPauses.length - 1].status = 'geplant';
  items.filter(i => i.type === 'training' && i.status === 'erledigt').forEach(i =>
    workouts.push({ id: uid('w'), date: i.date, kind: i.kind || 'Krafttraining', duration: i.duration, intensity: 2, counts: true, itemId: i.id, source: 'demo' }));
  for (let w = 2; w <= 9; w++) {
    const start = addDays(ws, -w * 7);
    const n = r() < 0.2 ? 0 : r() < 0.55 ? 1 : 2;
    [1, 5].slice(0, n).forEach(di => workouts.push({ id: uid('w'), date: addDays(start, di), kind: di === 1 ? 'Krafttraining' : 'Radfahren', duration: di === 1 ? 55 : 70, intensity: 2, counts: true, source: 'demo' }));
  }
  const weights = [];
  for (let i = 120; i >= 1; i--) if (r() < 0.45)
    weights.push({ id: uid('wg'), date: addDays(today, -i), time: `07:${pad(Math.floor(r() * 50) + 5)}`, kg: Math.round((88.6 - (120 - i) * 0.022 + (r() - 0.5) * 0.9) * 10) / 10, note: '', source: 'demo' });
  const steps = [];
  for (let i = 45; i >= 1; i--) if (r() < 0.78)
    steps.push({ id: uid('st'), date: addDays(today, -i), count: Math.round((3800 + r() * 7600) / 10) * 10, source: 'demo' });
  const foods = FOODS.map(f => ({ ...f, fav: ['oats', 'skyr', 'chicken', 'rice'].includes(f.id), custom: false }));
  const favMeals = [
    { id: 'fm1', name: 'Overnight Oats', items: [['oats', 60], ['skyr', 150], ['banana', 100]] },
    { id: 'fm2', name: 'Hähnchen-Reis-Bowl', items: [['chicken', 150], ['rice', 180], ['broccoli', 150]] },
    { id: 'fm3', name: 'Brot mit Hummus und Apfel', items: [['bread', 100], ['hummus', 50], ['apple', 150]] },
  ];
  const meals = [];
  const addFav = (date, meal, fm) => fm.items.forEach(([fid, q]) => { const f = foods.find(x => x.id === fid); meals.push({ id: uid('m'), date, meal, name: f.name, qty: q, unit: 'g', snap: snap(f, q), source: 'demo' }); });
  for (let i = 6; i >= 1; i--) {
    const date = addDays(today, -i);
    if (r() < 0.85) addFav(date, 'Frühstück', favMeals[0]);
    if (r() < 0.75) addFav(date, 'Mittagessen', favMeals[1]);
    if (r() < 0.7) addFav(date, 'Abendessen', favMeals[2]);
  }
  addFav(today, 'Frühstück', favMeals[0]);
  const lab = (analyte, value, unit, refMin, refMax, ago) => ({ id: uid('lab'), analyte, value, unit, refMin, refMax, date: addDays(today, -ago), lab: 'Demo-Labor', source: 'demo' });
  const labs = [
    lab('LDL-Cholesterin', 128, 'mg/dl', null, 115, 380), lab('LDL-Cholesterin', 118, 'mg/dl', null, 115, 40),
    lab('HbA1c', 5.3, '%', 4.0, 5.6, 380), lab('HbA1c', 5.4, '%', 4.0, 5.6, 40),
    lab('Vitamin D (25-OH)', 48, 'nmol/l', 75, 250, 720), lab('Vitamin D (25-OH)', 22, 'ng/ml', 30, 100, 380), lab('Vitamin D (25-OH)', 41, 'ng/ml', 30, 100, 40),
    lab('Ferritin', 96, 'µg/l', 30, 400, 40),
  ];
  const appointments = [
    { id: 'ap1', title: 'Blutabnahme', practice: 'Hausarztpraxis (Demo)', date: addDays(today, 2), time: '08:00', status: 'vereinbart', link: '', note: 'Demo-Notiz: Überweisungsschein mitnehmen.' },
    { id: 'ap2', title: 'Befundbesprechung', practice: 'Hausarztpraxis (Demo)', date: addDays(today, 9), time: '10:15', status: 'vereinbart', link: '', note: '' },
    { id: 'ap3', title: 'Zahnärztliche Kontrolle', practice: 'Zahnarztpraxis (Demo)', date: addDays(today, 35), time: '', status: 'offen', link: '', note: 'Termin noch vereinbaren.' },
    { id: 'ap4', title: 'Augenärztliche Kontrolle', practice: 'Augenarztpraxis (Demo)', date: addDays(today, -50), time: '15:30', status: 'erledigt', link: '', note: '' },
  ];
  const habits = syncHabits([], cfg);
  const habitLog = {};
  for (let i = 1; i <= 13; i++) { const d = addDays(today, -i); habits.forEach(h => { const x = r(); if (x < 0.62) habitLog[`${h.id}|${d}`] = 'done'; else if (x < 0.72) habitLog[`${h.id}|${d}`] = 'skip'; }); }
  return materialize({ items, workouts, weights, steps, foods, favMeals, meals, labs, appointments, habits, habitLog, dismissed: [], pauses: [] }, cfg, today);
}

/* ---------------- Fachlogik ---------------- */
const isOverdue = (it, today) => it.status === 'geplant' && it.date < today;
const effStatus = (it, today) => (isOverdue(it, today) ? 'ueberfaellig' : it.status);
const inWeek = (date, anchor) => { const d = weekDays(anchor); return date >= d[0] && date <= d[6]; };
/* Abgeschlossene Trainings aus dem Plan plus frei erfasste Einheiten, die fürs Ziel zählen (ohne Doppelzählung) */
const trainingsInWeek = (data, anchor) =>
  data.items.filter(i => i.type === 'training' && i.status === 'erledigt' && inWeek(i.date, anchor)).length
  + data.workouts.filter(w => w.counts && !w.itemId && inWeek(w.date, anchor)).length;
function pauseStats(data, anchor) {
  const list = data.items.filter(i => i.routine && i.routine.startsWith('pause') && inWeek(i.date, anchor) && i.status !== 'verschoben' && i.status !== 'pausiert');
  const eligible = list.filter(i => i.status !== 'ausgelassen');
  return { done: eligible.filter(i => i.status === 'erledigt').length, eligible: eligible.length, skipped: list.length - eligible.length };
}
function habitStats(data, anchor, today) {
  let done = 0, eligible = 0, skipped = 0;
  const hs = data.habits.filter(h => h.active !== false);
  weekDays(anchor).filter(d => d <= today && !pausedAll(data, d)).forEach(d => hs.forEach(h => {
    const v = data.habitLog[`${h.id}|${d}`];
    if (v === 'skip') skipped++; else { eligible++; if (v === 'done') done++; }
  }));
  return { done, eligible, skipped };
}
function weightTrend(data, today) {
  const a = data.weights.filter(w => w.date > addDays(today, -7) && w.date <= today).map(w => w.kg);
  const b = data.weights.filter(w => w.date > addDays(today, -14) && w.date <= addDays(today, -7)).map(w => w.kg);
  if (!a.length || !b.length) return null;
  return { delta: avg(a) - avg(b), na: a.length, nb: b.length };
}
function dayNutrition(data, date) {
  const list = data.meals.filter(m => m.date === date);
  if (!list.length) return null;
  const t = list.reduce((s, m) => ({ kcal: s.kcal + m.snap.kcal, p: s.p + m.snap.p, c: s.c + m.snap.c, f: s.f + m.snap.f }), { kcal: 0, p: 0, c: 0, f: 0 });
  const missing = MAIN_MEALS.filter(x => !list.some(m => m.meal === x));
  return { ...t, missing, complete: missing.length === 0 };
}
/* Regelbasierter Hinweis: Fokus nach Ziel mit Priorität 1, Tonalität nach Einstellung */
function coachHint(data, today, cfg) {
  const c = normalizeConfig(cfg);
  const top = c.goals[0];
  const focus = top ? `Fokus: ${GOALS[top]}, Priorität 1.` : 'Kein Ziel priorisiert.';
  const say = (base, mild, push) => (c.motivation === 'ruhig' ? base : c.motivation === 'anspornend' ? `${base} ${push}` : `${base} ${mild}`);
  const plan = buildPlan(c);
  const goal = plan.tdays.length;
  const domain = !top ? (goal ? 'training' : 'bewegung')
    : (top === 'fitter' || top === 'abnehmen') ? (goal ? 'training' : 'bewegung')
      : top === 'bewegung' ? 'bewegung'
        : top === 'ernaehrung' ? (c.nutrition.calories ? 'ernaehrung' : 'gewohnheiten')
          : top === 'routinen' ? 'gewohnheiten' : 'termine';
  const days = weekDays(today);
  if (domain === 'training') {
    const t = trainingsInWeek(data, today);
    const planned = data.items.filter(i => i.type === 'training' && i.status === 'geplant' && i.date >= today && i.date <= days[6]).sort(byTime);
    const reason = `Regel: Wochenziel ${goal} Trainingseinheiten, Woche Mo bis So. ${focus}`;
    if (t >= goal) return { text: say(`Wochenziel erreicht: ${t} von ${goal} Trainingseinheiten erledigt.`, 'Gut gemacht.', 'Stark, das Ziel steht.'), reason };
    if (t + planned.length >= goal) return { text: say(`${t} von ${goal} Trainingseinheiten erledigt. Die nächste ist für ${dayLabelLc(planned[0].date, today)} geplant.`, 'Das passt gut in die Woche.', `Noch ${goal - t} bis zum Wochenziel.`), reason };
    const tomorrow = addDays(today, 1);
    const target = tomorrow <= days[6] ? tomorrow : today;
    return {
      text: say(`${t} von ${goal} Trainingseinheiten erledigt. Für diese Woche ist keine weitere geplant.`, 'Eine kurze Einheit reicht schon.', 'Eine kurze Einheit bringt dich näher ans Ziel.'), reason,
      action: { label: target === today ? '30 Min. Home-Workout heute einplanen' : '30 Min. Home-Workout morgen einplanen', date: target },
    };
  }
  if (domain === 'bewegung') {
    const p = pauseStats(data, today);
    const left = data.items.filter(i => i.routine && i.routine.startsWith('pause') && i.date === today && i.status === 'geplant').length;
    const reason = `Regel: Bewegungspausen an Arbeitstagen. ${focus}`;
    if (!p.eligible) return { text: 'Für diese Woche sind keine Bewegungspausen geplant.', reason, action: { label: 'Bewegungspausen einrichten', go: ['einstellungen'] } };
    return { text: say(`${p.done} von ${p.eligible} Bewegungspausen diese Woche erledigt.`, left ? `Heute steht noch ${left === 1 ? 'eine' : left} an.` : 'Jede kurze Runde zählt.', left ? 'Die nächste ist heute dran.' : 'Weiter so.'), reason };
  }
  if (domain === 'ernaehrung') {
    const n = dayNutrition(data, today);
    const reason = `Regel: Hauptmahlzeiten im Ernährungstagebuch. ${focus}`;
    const k = n ? 3 - n.missing.length : 0;
    return { text: say(`Heute ${k === 1 ? 'ist 1' : `sind ${k}`} von 3 Hauptmahlzeiten eingetragen.`, 'Kurz nachtragen reicht.', 'Trag die nächste gleich nach dem Essen ein.'), reason, action: k < 3 ? { label: 'Mahlzeit eintragen', go: ['erfassen', 'mahlzeit'] } : null };
  }
  if (domain === 'gewohnheiten') {
    const hs = habitStats(data, today, today);
    const reason = `Regel: aktive Gewohnheiten, bewusst ausgelassene Tage zählen nicht. ${focus}`;
    if (!hs.eligible) return { text: 'Es sind noch keine Gewohnheiten aktiv.', reason, action: { label: 'Gewohnheiten wählen', go: ['einstellungen'] } };
    return { text: say(`Gewohnheiten diese Woche: ${hs.done} von ${hs.eligible} erledigt.`, 'Kleine Schritte zählen.', 'Hak die heutigen gleich ab.'), reason, action: { label: 'Zu den Gewohnheiten', go: ['woche'] } };
  }
  const open = data.appointments.filter(a => a.status === 'offen' || a.status === 'aufgeschoben').length;
  const reason = `Regel: offene Einträge unter Termine und Vorsorge. ${focus} Keine medizinische Bewertung.`;
  return { text: open ? `${open} ${open === 1 ? 'Termin ist' : 'Termine sind'} noch nicht vereinbart.` : 'Alle eingetragenen Termine sind vereinbart oder erledigt.', reason, action: { label: 'Termine ansehen', go: ['gesundheit', 'termine'] } };
}
function hints(data, today, cfg) {
  const mode = normalizeConfig(cfg).reminders.intensity;
  const lim = mode === 'sanft' ? { od: 1, ap: 1, open: false, max: 1 } : mode === 'deutlich' ? { od: 14, ap: 7, open: true, openDays: 9999, max: 99 } : { od: 7, ap: 3, open: true, openDays: 45, max: 3 };
  const out = [];
  data.items.filter(i => isOverdue(i, today) && i.date >= addDays(today, -lim.od)).sort(byTime).reverse().forEach(i =>
    out.push({ key: `od-${i.id}`, icon: 'clock', text: `${i.title} von ${dayLabelLc(i.date, today)} ist noch offen.`, action: { label: 'Neu planen', sheet: { kind: 'item', id: i.id } } }));
  data.appointments.forEach(a => {
    const dd = daysBetween(today, a.date);
    if (a.status === 'vereinbart' && dd >= 0 && dd <= lim.ap)
      out.unshift({ key: `ap-${a.id}-${a.date}`, icon: 'calendar', text: `${a.title} ${dd === 0 ? 'heute' : dd === 1 ? 'morgen' : `in ${dd} Tagen`}${a.time ? ` um ${a.time} Uhr` : ''}.`, action: { label: 'Ansehen', go: ['gesundheit', 'termine'] } });
    if (lim.open && a.status === 'offen' && a.date && dd <= lim.openDays)
      out.push({ key: `of-${a.id}`, icon: 'steth', text: `${a.title} ist noch nicht vereinbart.`, action: { label: 'Ansehen', go: ['gesundheit', 'termine'] } });
  });
  const list = out.filter(h => !data.dismissed.includes(h.key));
  return { list: list.slice(0, lim.max), hidden: Math.max(0, list.length - lim.max), mode };
}

const A = {
  setItem(d, id, patch) { return { ...d, items: d.items.map(i => (i.id === id ? { ...i, ...patch } : i)) }; },
  toggleItem(d, id) {
    const it = d.items.find(i => i.id === id); if (!it || it.status === 'pausiert' || it.status === 'verschoben') return d;
    const done = it.status !== 'erledigt';
    let workouts = d.workouts;
    if (it.type === 'training') workouts = done
      ? [...workouts, { id: uid('w'), date: it.date, kind: it.kind || 'Krafttraining', duration: it.duration, intensity: null, counts: true, itemId: it.id, source: 'plan' }]
      : workouts.filter(w => w.itemId !== it.id);
    return { ...A.setItem(d, id, { status: done ? 'erledigt' : 'geplant' }), workouts };
  },
  setStatus(d, id, status) {
    const it = d.items.find(i => i.id === id); if (!it) return d;
    const next = A.setItem(d, id, { status });
    return it.status === 'erledigt' ? { ...next, workouts: next.workouts.filter(w => w.itemId !== id) } : next;
  },
  moveItem(d, id, date) {
    const it = d.items.find(i => i.id === id); if (!it) return d;
    const { pauseId, ...rest } = it;
    const copy = { ...rest, id: uid('mv'), date, status: 'geplant', movedFrom: it.date, movedTo: undefined };
    const next = A.setItem(d, id, { status: 'verschoben', movedTo: date });
    return { ...next, items: [...next.items, copy] };
  },
  deleteItem(d, id) { return { ...d, items: d.items.filter(i => i.id !== id), workouts: d.workouts.filter(w => w.itemId !== id) }; },
  addItem(d, item) { return { ...d, items: [...d.items, { id: uid('it'), status: 'geplant', note: '', ...item }] }; },
  logWorkout(d, w, linkItemId) {
    let next = { ...d, workouts: [...d.workouts, { id: uid('w'), source: 'manuell', ...w, itemId: linkItemId || undefined }] };
    if (linkItemId) next = A.setItem(next, linkItemId, { status: 'erledigt' });
    return next;
  },
  addMealItems(d, date, meal, list) {
    const add = list.map(([fid, q]) => { const f = d.foods.find(x => x.id === fid); return { id: uid('m'), date, meal, name: f.name, qty: q, unit: 'g', snap: snap(f, q), source: 'manuell' }; });
    return { ...d, meals: [...d.meals, ...add] };
  },
  cycleHabit(d, hid, date) {
    const k = `${hid}|${date}`; const v = d.habitLog[k]; const log = { ...d.habitLog };
    if (!v) log[k] = 'done'; else if (v === 'done') log[k] = 'skip'; else delete log[k];
    return { ...d, habitLog: log };
  },
  addPause(d, p, today) { const pauses = [...(d.pauses || []), { id: uid('p'), ...p }]; return { ...d, pauses, items: applyPauses(d.items, pauses, today) }; },
  removePause(d, id, today) { const pauses = (d.pauses || []).filter(p => p.id !== id); return { ...d, pauses, items: applyPauses(d.items, pauses, today) }; },
};

/* ---------------- UI-Bausteine ---------------- */
const ICONS = {
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  calendar: <><rect x="3" y="4.5" width="18" height="16.5" rx="2.5" /><path d="M8 2.5v4M16 2.5v4M3 10h18" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  trend: <><path d="M3 20h18" /><path d="M5 16l4.5-5 3.5 3 6-7" /><path d="M15 7h4v4" /></>,
  heart: <path d="M12 20s-7.5-4.6-9-9.5C1.9 6.9 4.3 4 7.4 4c2 0 3.6 1.1 4.6 2.7C13 5.1 14.6 4 16.6 4c3.1 0 5.5 2.9 4.4 6.5-1.5 4.9-9 9.5-9 9.5z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  minus: <path d="M6.5 12h11" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  left: <path d="M15 5l-7 7 7 7" />,
  right: <path d="M9 5l7 7-7 7" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.6v.1" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></>,
  trash: <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />,
  star: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" />,
  bell: <><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" /><path d="M10 20.5h4" /></>,
  dumbbell: <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />,
  activity: <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />,
  utensils: <><path d="M7 3v18M4.5 3v5a2.5 2.5 0 0 0 5 0V3" /><path d="M17 21V3c-2.2 1.3-3 4-3 7 0 1.7 1.3 3 3 3" /></>,
  steth: <><path d="M6 3v6a5 5 0 0 0 10 0V3" /><path d="M11 14v2a4 4 0 0 0 8 0v-2" /><circle cx="19" cy="12" r="2" /></>,
  drop: <path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z" />,
  scale: <><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M8.5 10a5 5 0 0 1 7 0l-2.3 2.2" /></>,
  doc: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>,
  up: <path d="M6 15l6-6 6 6" />,
  down: <path d="M6 9l6 6 6-6" />,
  pause: <path d="M9 5.5v13M15 5.5v13" />,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  steps: <><path d="M8 4.5c1.7 0 2.5 1.8 2.5 4.2S9.7 13 8 13s-2.5-1.9-2.5-4.3S6.3 4.5 8 4.5zM6 15.5h4l-.4 3a1.6 1.6 0 0 1-3.2 0z" /><path d="M16 7.5c1.7 0 2.5 1.8 2.5 4.2S17.7 16 16 16s-2.5-1.9-2.5-4.3.8-4.2 2.5-4.2zM14 18.5h4l-.2 1.2a1.8 1.8 0 0 1-3.6 0z" /></>,
};
function Icon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{ICONS[name]}</svg>;
}
function Segmented({ value, onChange, options, label }) {
  return <div className="seg" role="tablist" aria-label={label}>
    {options.map(([v, l]) => <button key={v} role="tab" aria-selected={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}
  </div>;
}
function Field({ label, children, hint }) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>;
}
function Sheet({ title, close, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    if (ref.current) ref.current.focus();
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, []);
  return <div className="sheet-wrap" role="dialog" aria-modal="true" aria-label={title}>
    <div className="backdrop" onClick={close} />
    <div className="sheet" ref={ref} tabIndex={-1}>
      <div className="sheet-grip" aria-hidden="true" />
      <div className="sheet-head"><h2 className="h2">{title}</h2><button className="icon-btn" aria-label="Schließen" onClick={close}><Icon name="x" /></button></div>
      <div className="sheet-body">{children}</div>
    </div>
  </div>;
}
function Progress({ value, max, label }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return <div className="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}><span style={{ width: `${pct}%` }} /></div>;
}
function StatusTag({ it, today }) {
  const st = effStatus(it, today);
  if (st === 'verschoben') return <span className="tag tag-muted">Verschoben auf {dayLabel(it.movedTo, today)}</span>;
  if (st === 'ausgelassen') return <span className="tag tag-muted">Bewusst ausgelassen</span>;
  if (st === 'ueberfaellig') return <span className="tag tag-warn">Überfällig</span>;
  if (st === 'pausiert') return <span className="tag tag-muted">Pausiert</span>;
  if (it.movedFrom && st === 'geplant') return <span className="tag">Nachgeholt von {dayLabel(it.movedFrom, today)}</span>;
  return null;
}
function ItemRow({ it, ctx, showDay }) {
  const { today, commit, openSheet } = ctx;
  const st = effStatus(it, today);
  const t = TYPES[it.type] || TYPES.sonstiges;
  const checkable = st !== 'verschoben' && st !== 'ausgelassen' && st !== 'pausiert';
  return <li className={`row st-${st}`}>
    <button className="check" disabled={!checkable} aria-pressed={st === 'erledigt'}
      aria-label={st === 'erledigt' ? `${it.title}: wieder öffnen` : `${it.title} als erledigt markieren`}
      onClick={() => commit(d => A.toggleItem(d, it.id), st === 'erledigt' ? `Wieder offen: ${it.title}` : `Erledigt: ${it.title}`)}>
      {st === 'erledigt' ? <Icon name="check" size={16} /> : st === 'ausgelassen' || st === 'verschoben' || st === 'pausiert' ? <Icon name="minus" size={16} /> : null}
    </button>
    <button className="row-main" onClick={() => openSheet({ kind: 'item', id: it.id })} aria-label={`${it.title}, Optionen öffnen`}>
      <span className="row-title">{it.title}</span>
      <span className="row-meta">
        {showDay && it.date !== today && <span>{dayLabel(it.date, today)}</span>}
        {it.time && <span>{it.time} Uhr</span>}
        {it.duration ? <span>{it.duration} Min.</span> : null}
        <StatusTag it={it} today={today} />
      </span>
    </button>
    <span className="row-icon" title={t.label}><Icon name={t.icon} size={18} /></span>
  </li>;
}
function Empty({ text, action }) {
  return <div className="empty"><p>{text}</p>{action}</div>;
}

/* ---------------- Diagramme ---------------- */
function LineChart({ points, from, to, band, trend, height = 180, maxGap = 10, label, digits = 1 }) {
  const W = 340, H = height, pl = 40, pr = 12, pt = 12, pb = 26;
  if (!points.length) return null;
  const span = Math.max(1, daysBetween(from, to));
  const x = d => pl + (daysBetween(from, d) / span) * (W - pl - pr);
  const vals = points.map(p => p.value).concat(trend ? trend.map(p => p.value) : []);
  if (band && band.min != null) vals.push(band.min);
  if (band && band.max != null) vals.push(band.max);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const padv = (hi - lo) * 0.18 || Math.max(1, Math.abs(hi) * 0.05); lo -= padv; hi += padv;
  const y = v => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
  const segs = []; let cur = [];
  points.forEach((p, i) => { if (i && daysBetween(points[i - 1].date, p.date) > maxGap) { segs.push(cur); cur = []; } cur.push(p); });
  segs.push(cur);
  const path = arr => arr.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const ticks = [lo + (hi - lo) * 0.15, (lo + hi) / 2, hi - (hi - lo) * 0.15];
  const by = band ? [y(band.max != null ? band.max : hi), y(band.min != null ? band.min : lo)] : null;
  return <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={label}>
    {by && <rect x={pl} y={by[0]} width={W - pl - pr} height={Math.max(0, by[1] - by[0])} className="c-band" />}
    {ticks.map((t, i) => <g key={i}><line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} className="c-grid" /><text x={pl - 6} y={y(t) + 4} textAnchor="end" className="c-axis">{fmtNum(t, digits)}</text></g>)}
    {segs.map((s, i) => <path key={i} d={path(s)} className="c-line" />)}
    {trend && trend.length > 1 && <path d={path(trend)} className="c-trend" />}
    {points.map(p => <circle key={p.id || p.date + p.value} cx={x(p.date)} cy={y(p.value)} r={points.length > 60 ? 2.4 : 3.4} className="c-dot" />)}
    <text x={pl} y={H - 6} className="c-axis">{fmtShort(from)}</text>
    <text x={W - pr} y={H - 6} textAnchor="end" className="c-axis">{fmtShort(to)}</text>
  </svg>;
}
function BarChart({ data, goal, height = 160, label, fmt = v => fmtNum(v) }) {
  const W = 340, H = height, pl = 40, pr = 8, pt = 12, pb = 24;
  const max = Math.max(goal || 0, ...data.map(d => d.value || 0)) * 1.15 || 1;
  const bw = (W - pl - pr) / data.length;
  const y = v => pt + (1 - v / max) * (H - pt - pb);
  const every = Math.ceil(data.length / 8);
  return <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={label}>
    {[0, max / 2].map((t, i) => <g key={i}><line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} className="c-grid" /><text x={pl - 6} y={y(t) + 4} textAnchor="end" className="c-axis">{fmt(t)}</text></g>)}
    {data.map((d, i) => {
      const bx = pl + i * bw + bw * 0.18, w = bw * 0.64;
      return <g key={d.key}>
        {d.value == null
          ? <line x1={bx} x2={bx + w} y1={y(0) - 2} y2={y(0) - 2} className="c-missing" />
          : <rect x={bx} y={y(d.value)} width={w} height={Math.max(1, y(0) - y(d.value))} rx={Math.min(4, w / 3)} className={d.faint ? 'c-bar faint' : 'c-bar'} />}
        {(i % every === 0 || i === data.length - 1) && <text x={bx + w / 2} y={H - 7} textAnchor="middle" className="c-axis">{d.label}</text>}
      </g>;
    })}
    {goal ? <g><line x1={pl} x2={W - pr} y1={y(goal)} y2={y(goal)} className="c-goal" /><text x={W - pr} y={y(goal) - 5} textAnchor="end" className="c-axis c-goal-t">Ziel {fmt(goal)}</text></g> : null}
  </svg>;
}

/* ---------------- Heute ---------------- */
function DayArc({ items, now, done, total, onPick }) {
  const W = 320, H = 186, cx = 160, cy = 160, r = 130;
  const pos = m => { const t = Math.min(1, Math.max(0, (m - 360) / 960)); const a = Math.PI * (1 - t); return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
  const nowM = now.getHours() * 60 + now.getMinutes();
  const [nx, ny] = pos(nowM);
  const timed = items.filter(i => i.time);
  return <div className="arc-wrap">
    <svg viewBox={`0 0 ${W} ${H}`} className="arc" role="img" aria-label={`Tagesbogen von 6 bis 22 Uhr: ${done} von ${total} Einträgen erledigt`}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} className="arc-track" />
      {nowM > 360 && <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${nx.toFixed(1)} ${ny.toFixed(1)}`} className="arc-elapsed" />}
      {[720, 1080].map(m => { const [tx, ty] = pos(m); const [ix, iy] = [cx + (tx - cx) * 0.9, cy + (ty - cy) * 0.9]; return <text key={m} x={ix} y={iy + 4} textAnchor="middle" className="arc-axis">{m / 60}</text>; })}
      <g className="sun" aria-hidden="true"><circle cx={nx} cy={ny} r={15} className="sun-halo" /><circle cx={nx} cy={ny} r={7.5} className="sun-core" /></g>
      {timed.map(it => {
        const [x, y] = pos(toMin(it.time));
        return <g key={it.id} className={`arc-dot st-${it.status}`} role="button" tabIndex={0} aria-label={`${it.title} um ${it.time} Uhr`}
          onClick={() => onPick(it.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(it.id); } }}>
          <circle cx={x} cy={y} r={16} className="dot-hit" />
          <circle cx={x} cy={y} r={8} className="dot" />
          {it.status === 'erledigt' && <path d={`M ${x - 3.4} ${y + 0.2} l 2.3 2.4 l 4.4 -4.8`} className="dot-check" />}
        </g>;
      })}
      <text x={cx} y={cy - 36} textAnchor="middle" className="arc-big">{total ? `${done} von ${total}` : 'Frei'}</text>
      <text x={cx} y={cy - 12} textAnchor="middle" className="arc-small">{total ? 'heute erledigt' : 'nichts geplant'}</text>
      <text x={cx - r} y={cy + 20} textAnchor="middle" className="arc-axis">6 Uhr</text>
      <text x={cx + r} y={cy + 20} textAnchor="middle" className="arc-axis">22 Uhr</text>
    </svg>
  </div>;
}
function Stat({ label, value, sub, onClick, missing, icon }) {
  const inner = <><span className="stat-top"><Icon name={icon} size={16} />{label}</span><span className={missing ? 'stat-val missing' : 'stat-val'}>{value}</span><span className="stat-sub">{sub}</span></>;
  return onClick ? <button className="stat" onClick={onClick}>{inner}</button> : <div className="stat">{inner}</div>;
}
function CoachCard({ ctx }) {
  const { data, today, commit, go, cfg } = ctx;
  const c = coachHint(data, today, cfg);
  return <section className="coach" aria-label="Hinweis zur Woche">
    <div className="coach-icon"><Icon name="spark" size={18} /></div>
    <div>
      <p className="coach-text">{c.text}</p>
      <p className="coach-why">{c.reason}</p>
      {c.action && <button className="btn small" onClick={() => c.action.go ? go(...c.action.go) : commit(d => A.addItem(d, { title: 'Home-Workout', type: 'training', kind: 'Home-Workout', date: c.action.date, time: '18:30', duration: 30, routine: null }), 'Home-Workout eingeplant')}>{c.action.label}</button>}
    </div>
  </section>;
}
function Today({ ctx, onSetup }) {
  const { data, today, now, go, openSheet, commit, cfg } = ctx;
  const goal = useMemo(() => buildPlan(cfg).tdays.length, [cfg]);
  const todays = data.items.filter(i => i.date === today).sort(byTime);
  const active = todays.filter(i => i.status !== 'verschoben' && i.status !== 'pausiert');
  const pausedToday = todays.some(i => i.status === 'pausiert');
  const counted = active.filter(i => i.status !== 'ausgelassen');
  const done = counted.filter(i => i.status === 'erledigt').length;
  const overdue = data.items.filter(i => isOverdue(i, today) && i.date >= addDays(today, -7)).sort(byTime);
  const next = [...overdue.slice(0, 1), ...active.filter(i => i.status === 'geplant')].slice(0, 3);
  const h = now.getHours();
  const greet = h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
  const tw = trainingsInWeek(data, today);
  const ps = pauseStats(data, today);
  const stepsToday = data.steps.find(s => s.date === today);
  const wt = weightTrend(data, today);
  const appts = data.appointments.filter(a => a.status === 'vereinbart' && a.date >= today && a.date <= addDays(today, 21)).sort(byTime).slice(0, 3);
  const hr = hints(data, today, cfg);
  const hs = hr.list;
  return <div className="screen">
    <header className="hero">
      <p className="greet">{greet}</p>
      <h1 className="h-date">{fmtLong(today)}</h1>
    </header>
    {cfg.skipped && <div className="setup-banner"><p>Du nutzt noch den Demo-Plan. In etwa zwei Minuten entsteht dein persönlicher Wochenplan.</p><button className="btn small primary" onClick={onSetup}>Plan einrichten</button></div>}
    {pausedToday && <p className="callout pause-note"><Icon name="pause" size={16} /> Heute ist pausiert. Pausierte Einträge zählen nicht in deine Ziele.</p>}
    <DayArc items={active} now={now} done={done} total={counted.length} onPick={id => openSheet({ kind: 'item', id })} />

    <section className="block">
      <h2 className="h2">Als Nächstes</h2>
      {next.length
        ? <ul className="list">{next.map(it => <ItemRow key={it.id} it={it} ctx={ctx} showDay />)}</ul>
        : <Empty text="Für heute ist nichts mehr offen." action={<button className="btn small" onClick={() => go('woche')}>Woche ansehen</button>} />}
    </section>

    <section className="block">
      <h2 className="h2 sr">Kurzer Überblick</h2>
      <div className="stats">
        <Stat icon="dumbbell" label="Training" value={goal ? `${tw} von ${goal}` : `${tw}`} sub={goal ? 'Einheiten diese Woche' : 'kein Trainingsziel'} onClick={() => go('woche')} />
        <Stat icon="activity" label="Bewegungspausen" value={ps.eligible ? `${ps.done} von ${ps.eligible}` : 'keine geplant'} missing={!ps.eligible} sub="werktags, diese Woche" onClick={() => go('woche')} />
        <Stat icon="steps" label="Schritte heute" value={stepsToday ? fmtNum(stepsToday.count) : 'noch nicht erfasst'} missing={!stepsToday} sub={stepsToday ? 'manuell eingetragen' : 'Tippen zum Eintragen'} onClick={() => go('erfassen', 'schritte')} />
        <Stat icon="scale" label="Gewicht" value={wt ? `${signed(wt.delta)} kg` : 'zu wenige Werte'} missing={!wt} sub={wt ? 'Ø 7 Tage ggü. Vorwoche' : 'je Woche 1 Wert nötig'} onClick={() => go('entwicklung')} />
      </div>
    </section>

    <CoachCard ctx={ctx} />

    <section className="block">
      <h2 className="h2">Schnell erfassen</h2>
      <div className="quick">
        {[['gewicht', 'Gewicht', 'scale'], ['schritte', 'Schritte', 'steps'], ['training', 'Training', 'dumbbell'], ['mahlzeit', 'Mahlzeit', 'utensils']].map(([k, l, ic]) =>
          <button key={k} className="quick-btn" onClick={() => go('erfassen', k)}><Icon name={ic} size={20} /><span>{l}</span></button>)}
      </div>
    </section>

    <section className="block">
      <details className="fold">
        <summary><span>Ganzer Tag</span><span className="muted">{active.length} Einträge</span></summary>
        <ul className="list">{todays.map(it => <ItemRow key={it.id} it={it} ctx={ctx} />)}</ul>
      </details>
    </section>

    <section className="block">
      <div className="h2-row"><h2 className="h2">Nächste Termine</h2><button className="link" onClick={() => go('gesundheit', 'termine')}>Alle</button></div>
      {appts.length ? <ul className="list">{appts.map(a =>
        <li key={a.id} className="row"><span className="date-chip"><b>{parse(a.date).getDate()}</b><small>{parse(a.date).toLocaleDateString('de-DE', { month: 'short' })}</small></span>
          <button className="row-main" onClick={() => go('gesundheit', 'termine')}><span className="row-title">{a.title}</span><span className="row-meta"><span>{dayLabel(a.date, today)}</span>{a.time && <span>{a.time} Uhr</span>}<span>{a.practice}</span></span></button></li>)}</ul>
        : <Empty text="In den nächsten drei Wochen ist kein Termin vereinbart." />}
    </section>

    <section className="block">
      <h2 className="h2">Hinweise</h2>
      {hs.length ? <ul className="hints">{hs.map(hh => <li key={hh.key} className="hint-row">
        <Icon name={hh.icon} size={18} />
        <p>{hh.text}</p>
        <div className="hint-actions">
          <button className="btn small" onClick={() => hh.action.sheet ? openSheet(hh.action.sheet) : go(...hh.action.go)}>{hh.action.label}</button>
          <button className="icon-btn sm" aria-label="Hinweis ausblenden" onClick={() => commit(d => ({ ...d, dismissed: [...d.dismissed, hh.key] }), 'Hinweis ausgeblendet')}><Icon name="x" size={16} /></button>
        </div>
      </li>)}</ul> : <Empty text="Keine offenen Hinweise." />}
      {hr.hidden > 0 && <p className="hint">{hr.hidden} weitere {hr.hidden === 1 ? 'Hinweis ist' : 'Hinweise sind'} wegen deiner Einstellung „{INTENSITIES[hr.mode][0]}“ ausgeblendet.</p>}
      <p className="footnote"><Icon name="bell" size={14} /> Hinweise erscheinen nur hier in der App. Push-Benachrichtigungen sind in dieser Demo nicht aktiv.</p>
    </section>
  </div>;
}

/* ---------------- Woche ---------------- */
function HabitGrid({ ctx, days }) {
  const { data, today, commit } = ctx;
  const [name, setName] = useState(''); const [err, setErr] = useState('');
  const habits = data.habits.filter(h => h.active !== false);
  const add = () => {
    const n = name.trim();
    if (!n) return setErr('Bitte einen Namen eingeben.');
    if (n.length > 60) return setErr('Bitte höchstens 60 Zeichen.');
    if (habits.some(h => h.name.toLowerCase() === n.toLowerCase())) return setErr('Diese Gewohnheit gibt es schon.');
    setErr('');
    commit(d => ({ ...d, habits: [...d.habits, { id: uid('h'), name: n, active: true, custom: true }] }), `Gewohnheit angelegt: ${n}`); setName('');
  };
  return <div className="panel">
    {habits.length ? <table className="habits">
      <thead><tr><th scope="col"><span className="sr">Gewohnheit</span></th>{days.map(d => <th key={d} scope="col" className={d === today ? 'is-today' : ''}>{WD[wdIdx(d)]}</th>)}</tr></thead>
      <tbody>{habits.map(h => <tr key={h.id}><th scope="row">{h.name}</th>{days.map(d => {
        const v = data.habitLog[`${h.id}|${d}`]; const paused = pausedAll(data, d);
        return <td key={d}><button className={`hcell ${v || ''} ${paused ? 'paused' : ''}`} disabled={d > today || paused}
          aria-label={`${h.name}, ${WD[wdIdx(d)]}: ${paused ? 'pausiert' : v === 'done' ? 'erledigt' : v === 'skip' ? 'bewusst ausgelassen' : 'offen'}`}
          onClick={() => commit(dd => A.cycleHabit(dd, h.id, d), null)}>{v === 'done' ? <Icon name="check" size={14} /> : v === 'skip' ? <Icon name="minus" size={14} /> : null}</button></td>;
      })}</tr>)}</tbody>
    </table> : <p className="hint">Keine aktiven Gewohnheiten. Lege unten eine an oder wähle Vorschläge in den Einstellungen.</p>}
    <p className="hint">Tippen wechselt zwischen erledigt, bewusst ausgelassen und offen. Zukünftige und pausierte Tage sind gesperrt.</p>
    <div className="inline-add">
      <input className="input" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(); }} placeholder="Neue Gewohnheit, z. B. Abends dehnen" aria-label="Neue Gewohnheit" />
      <button className="btn" onClick={add}>Anlegen</button>
    </div>
    {err && <p className="err" role="alert">{err}</p>}
  </div>;
}
function Week({ ctx }) {
  const { data, today, openSheet, go, cfg } = ctx;
  const [off, setOff] = useState(0);
  const anchor = addDays(today, off * 7);
  const days = weekDays(anchor);
  const [sel, setSel] = useState(today);
  const selDay = days.includes(sel) ? sel : days[0];
  const plan = useMemo(() => buildPlan(cfg), [cfg]);
  const tw = trainingsInWeek(data, anchor);
  const goal = plan.tdays.length;
  const ps = pauseStats(data, anchor);
  const hs = habitStats(data, anchor, today);
  const dayItems = data.items.filter(i => i.date === selDay).sort(byTime);
  const dayAppts = data.appointments.filter(a => a.date === selDay && a.status !== 'offen');
  const weekPauses = (data.pauses || []).filter(p => p.from <= days[6] && p.to >= days[0]);
  const isFree = wdIdx(selDay) === plan.freeDay;
  return <div className="screen">
    <header className="page-head">
      <h1 className="h1">Woche</h1>
      <div className="week-nav">
        <button className="icon-btn" aria-label="Vorherige Woche" disabled={off <= -1} onClick={() => setOff(off - 1)}><Icon name="left" /></button>
        <div className="week-title"><b>KW {isoWeek(anchor)}</b><span>{fmtDM(days[0])} bis {fmtDM(days[6])}{off === 0 ? ', aktuelle Woche' : ''}</span></div>
        <button className="icon-btn" aria-label="Nächste Woche" disabled={off >= 1} onClick={() => setOff(off + 1)}><Icon name="right" /></button>
      </div>
    </header>

    {weekPauses.map(p => <p key={p.id} className="callout pause-note"><Icon name="pause" size={16} /> {p.reason}: {fmtDM(p.from)} bis {fmtDM(p.to)}, {p.scope === 'alle' ? 'alles pausiert' : 'Training pausiert'}. Pausierte Einträge zählen nicht in die Ziele.</p>)}

    <section className="panel goals">
      <div className="goal"><div className="goal-head"><span>Training</span><b>{goal ? `${tw} von ${goal}` : `${tw}, kein Ziel`}</b></div><Progress value={tw} max={goal || 1} label="Trainingseinheiten" /></div>
      <div className="goal"><div className="goal-head"><span>Bewegungspausen</span><b>{ps.eligible ? `${ps.done} von ${ps.eligible}` : 'keine geplant'}</b></div><Progress value={ps.done} max={ps.eligible} label="Bewegungspausen" /></div>
      <div className="goal"><div className="goal-head"><span>Gewohnheiten</span><b>{hs.eligible ? `${Math.round((hs.done / hs.eligible) * 100)} %` : 'noch keine Tage'}</b></div><Progress value={hs.done} max={hs.eligible} label="Gewohnheiten" /></div>
      <p className="hint">Gezählt werden abgeschlossene Einheiten. Bewusst ausgelassene und pausierte Termine fallen aus dem Nenner.</p>
    </section>

    <div className="daystrip" role="tablist" aria-label="Tag wählen">
      {days.map(d => {
        const its = data.items.filter(i => i.date === d && i.status !== 'verschoben');
        const dn = its.filter(i => i.status === 'erledigt').length;
        const od = its.some(i => isOverdue(i, today));
        const free = wdIdx(d) === plan.freeDay;
        return <button key={d} role="tab" aria-selected={d === selDay} className={`day ${d === selDay ? 'on' : ''} ${d === today ? 'is-today' : ''} ${free ? 'is-free' : ''}`} onClick={() => setSel(d)}>
          <span className="day-wd">{WD[wdIdx(d)]}</span><span className="day-n">{parse(d).getDate()}</span>
          <span className="day-dots" aria-hidden="true">{its.slice(0, 4).map((i, k) => <i key={k} className={i.status === 'erledigt' ? 'd-done' : isOverdue(i, today) ? 'd-warn' : (i.status === 'ausgelassen' || i.status === 'pausiert') ? 'd-skip' : ''} />)}</span>
          <span className="sr">{dn} von {its.length} erledigt{od ? ', etwas ist überfällig' : ''}{free ? ', freier Tag' : ''}</span>
        </button>;
      })}
    </div>

    <section className="block">
      <div className="h2-row"><h2 className="h2">{fmtLong(selDay)}</h2>{isFree && <span className="tag tag-sun">Freier Tag</span>}</div>
      {isFree && <p className="hint top0">Kein Training geplant. Nutze den Tag zur Erholung oder flexibel zum Nachholen.</p>}
      {dayItems.length || dayAppts.length ? <ul className="list">
        {dayItems.map(it => <ItemRow key={it.id} it={it} ctx={ctx} />)}
        {dayAppts.map(a => <li key={a.id} className={`row ${a.status === 'erledigt' ? 'st-erledigt' : ''}`}>
          <span className="check static"><Icon name="steth" size={16} /></span>
          <button className="row-main" onClick={() => go('gesundheit', 'termine')}><span className="row-title">{a.title}</span><span className="row-meta">{a.time && <span>{a.time} Uhr</span>}<span>{APPT_STATUS[a.status]}</span></span></button>
          <span className="row-icon"><Icon name="calendar" size={18} /></span>
        </li>)}
      </ul> : <Empty text="Für diesen Tag ist nichts geplant." />}
      <div className="btn-row two">
        <button className="btn block-btn" onClick={() => openSheet({ kind: 'addItem', date: selDay < today ? today : selDay })}><Icon name="plus" size={18} /> Eintrag planen</button>
        <button className="btn block-btn" onClick={() => openSheet({ kind: 'pause', from: selDay < today ? today : selDay })}><Icon name="pause" size={18} /> Pause eintragen</button>
      </div>
      <button className="link" onClick={() => go('einstellungen')}>Routinen und Wochenplan ändern</button>
    </section>

    <section className="block">
      <h2 className="h2">Gewohnheiten</h2>
      <HabitGrid ctx={ctx} days={days} />
    </section>
  </div>;
}

/* ---------------- Erfassen ---------------- */
function Recent({ title, rows, onDelete, empty }) {
  return <section className="block">
    <h2 className="h2">{title}</h2>
    {rows.length ? <ul className="list">{rows.map(r => <li key={r.id} className="row compact">
      <div className="row-main static"><span className="row-title">{r.main}</span><span className="row-meta">{r.sub.map((s, i) => <span key={i}>{s}</span>)}</span></div>
      {r.demo && <span className="tag tag-muted">Demo</span>}
      <button className="icon-btn sm" aria-label={`${r.main} löschen`} onClick={() => onDelete(r.id)}><Icon name="trash" size={16} /></button>
    </li>)}</ul> : <Empty text={empty} />}
  </section>;
}
function WeightForm({ ctx }) {
  const { data, today, commit } = ctx;
  const [date, setDate] = useState(today); const [time, setTime] = useState(''); const [kg, setKg] = useState(''); const [note, setNote] = useState(''); const [err, setErr] = useState('');
  const save = () => {
    const v = parseNum(kg);
    if (!(v >= 30 && v <= 300)) return setErr('Bitte ein Gewicht zwischen 30 und 300 kg eingeben.');
    if (!date || date > today) return setErr('Bitte ein Datum bis heute wählen.');
    setErr('');
    commit(d => ({ ...d, weights: [...d.weights, { id: uid('wg'), date, time, kg: Math.round(v * 10) / 10, note: note.trim(), source: 'manuell' }] }), `Gewicht gespeichert: ${fmtNum(v, 1)} kg`);
    setKg(''); setNote('');
  };
  const recent = [...data.weights].sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || ''))).slice(0, 6);
  return <>
    <div className="panel form">
      <Field label="Gewicht in kg"><input className="input big" inputMode="decimal" value={kg} onChange={e => setKg(e.target.value)} placeholder="z. B. 84,6" /></Field>
      <div className="grid2">
        <Field label="Datum"><input className="input" type="date" max={today} value={date} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="Uhrzeit (optional)"><input className="input" type="time" value={time} onChange={e => setTime(e.target.value)} /></Field>
      </div>
      <Field label="Notiz (optional)"><input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="z. B. nach dem Aufstehen" /></Field>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary wide" onClick={save}>Gewicht speichern</button>
    </div>
    <Recent title="Zuletzt erfasst" empty="Noch keine Messung erfasst." onDelete={id => commit(d => ({ ...d, weights: d.weights.filter(w => w.id !== id) }), 'Messung gelöscht')}
      rows={recent.map(w => ({ id: w.id, main: `${fmtNum(w.kg, 1)} kg`, sub: [dayLabel(w.date, today), w.time ? `${w.time} Uhr` : null, w.note || null].filter(Boolean), demo: w.source === 'demo' }))} />
  </>;
}
function StepsForm({ ctx }) {
  const { data, today, commit } = ctx;
  const [date, setDate] = useState(today); const [count, setCount] = useState(''); const [err, setErr] = useState('');
  const existing = data.steps.find(s => s.date === date);
  const save = () => {
    const v = parseNum(count.replace(/\./g, ''));
    if (!(Number.isInteger(v) && v >= 0 && v <= 100000)) return setErr('Bitte eine ganze Zahl zwischen 0 und 100.000 eingeben.');
    if (!date || date > today) return setErr('Bitte ein Datum bis heute wählen.');
    setErr('');
    commit(d => ({ ...d, steps: [...d.steps.filter(s => s.date !== date), { id: uid('st'), date, count: v, source: 'manuell' }] }), existing ? 'Schrittzahl ersetzt' : 'Schrittzahl gespeichert');
    setCount('');
  };
  const recent = [...data.steps].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  return <>
    <div className="panel form">
      <Field label="Schritte"><input className="input big" inputMode="numeric" value={count} onChange={e => setCount(e.target.value)} placeholder="z. B. 7.420" /></Field>
      <Field label="Datum" hint={existing ? `Für diesen Tag sind bereits ${fmtNum(existing.count)} Schritte eingetragen. Speichern ersetzt den Wert, statt zu addieren.` : 'Ein Wert pro Tag, manuell eingetragen.'}>
        <input className="input" type="date" max={today} value={date} onChange={e => setDate(e.target.value)} />
      </Field>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary wide" onClick={save}>{existing ? 'Schrittzahl ersetzen' : 'Schrittzahl speichern'}</button>
      <p className="hint">Automatischer Abgleich mit Health Connect oder Samsung Health ist noch nicht verfügbar.</p>
    </div>
    <Recent title="Zuletzt erfasst" empty="Noch keine Schritte erfasst." onDelete={id => commit(d => ({ ...d, steps: d.steps.filter(s => s.id !== id) }), 'Eintrag gelöscht')}
      rows={recent.map(s => ({ id: s.id, main: `${fmtNum(s.count)} Schritte`, sub: [dayLabel(s.date, today)], demo: s.source === 'demo' }))} />
  </>;
}
function TrainingForm({ ctx }) {
  const { data, today, commit } = ctx;
  const [kind, setKind] = useState('Krafttraining'); const [date, setDate] = useState(today); const [dur, setDur] = useState('45');
  const [intensity, setIntensity] = useState(1); const [counts, setCounts] = useState(true); const [note, setNote] = useState(''); const [link, setLink] = useState(true); const [err, setErr] = useState('');
  const planned = data.items.filter(i => i.type === 'training' && i.date === date && i.status === 'geplant').sort(byTime)[0];
  const save = () => {
    const v = parseNum(dur);
    if (!(Number.isInteger(v) && v >= 1 && v <= 600)) return setErr('Bitte eine Dauer zwischen 1 und 600 Minuten eingeben.');
    if (!date || date > today) return setErr('Bitte ein Datum bis heute wählen.');
    setErr('');
    commit(d => A.logWorkout(d, { date, kind, duration: v, intensity, counts, note: note.trim() }, planned && link ? planned.id : null), planned && link ? `${kind} gespeichert, geplante Einheit abgehakt` : `${kind} gespeichert`);
    setNote('');
  };
  const recent = [...data.workouts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  return <>
    <div className="panel form">
      <Field label="Art"><div className="chips">{WORKOUT_KINDS.map(k => <button key={k} className={`chip ${kind === k ? 'on' : ''}`} aria-pressed={kind === k} onClick={() => setKind(k)}>{k}</button>)}</div></Field>
      <div className="grid2">
        <Field label="Datum"><input className="input" type="date" max={today} value={date} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="Dauer in Minuten"><input className="input" inputMode="numeric" value={dur} onChange={e => setDur(e.target.value)} /></Field>
      </div>
      <Field label="Wie anstrengend war es?"><div className="chips">{INTENSITY.map((l, i) => <button key={l} className={`chip ${intensity === i ? 'on' : ''}`} aria-pressed={intensity === i} onClick={() => setIntensity(i)}>{l}</button>)}</div></Field>
      <label className="toggle"><input type="checkbox" checked={counts} onChange={e => setCounts(e.target.checked)} /><span>Zählt als Trainingseinheit für das Wochenziel</span></label>
      {planned && <label className="toggle"><input type="checkbox" checked={link} onChange={e => setLink(e.target.checked)} /><span>Geplante Einheit „{planned.title}“ am {dayLabel(planned.date, today).toLowerCase() === 'heute' ? 'heutigen Tag' : fmtDM(planned.date)} abhaken</span></label>}
      <Field label="Notiz (optional)"><input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="z. B. Beine und Rücken" /></Field>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary wide" onClick={save}>Training speichern</button>
    </div>
    <Recent title="Zuletzt erfasst" empty="Noch kein Training erfasst." onDelete={id => commit(d => {
      const w = d.workouts.find(x => x.id === id);
      const next = { ...d, workouts: d.workouts.filter(x => x.id !== id) };
      return w && w.itemId ? A.setItem(next, w.itemId, { status: 'geplant' }) : next;
    }, 'Training gelöscht')}
      rows={recent.map(w => ({ id: w.id, main: `${w.kind}, ${w.duration} Min.`, sub: [dayLabel(w.date, today), w.intensity != null ? INTENSITY[w.intensity] : null, w.counts ? 'zählt fürs Ziel' : 'zählt nicht'].filter(Boolean), demo: w.source === 'demo' }))} />
  </>;
}
function MealForm({ ctx }) {
  const { data, today, now, commit } = ctx;
  const h = now.getHours();
  const [date, setDate] = useState(today);
  const [meal, setMeal] = useState(h < 11 ? 'Frühstück' : h < 15 ? 'Mittagessen' : h < 21 ? 'Abendessen' : 'Snack');
  const [q, setQ] = useState(''); const [foodId, setFoodId] = useState(null); const [qty, setQty] = useState('100'); const [err, setErr] = useState('');
  const [nf, setNf] = useState(null);
  const food = data.foods.find(f => f.id === foodId);
  const qn = parseNum(qty);
  const preview = food && qn > 0 ? snap(food, qn) : null;
  const list = data.foods.filter(f => f.name.toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) => (b.fav - a.fav) || a.name.localeCompare(b.name, 'de')).slice(0, 8);
  const add = () => {
    if (!food) return setErr('Bitte ein Lebensmittel wählen.');
    if (!(qn > 0 && qn <= 3000)) return setErr('Bitte eine Menge zwischen 1 und 3.000 g eingeben.');
    if (!date || date > today) return setErr('Bitte ein Datum bis heute wählen.');
    setErr('');
    commit(d => A.addMealItems(d, date, meal, [[food.id, qn]]), `${food.name} hinzugefügt`);
    setFoodId(null); setQty('100'); setQ('');
  };
  const favKcal = fm => fm.items.reduce((s, [fid, g]) => { const f = data.foods.find(x => x.id === fid); return s + (f ? snap(f, g).kcal : 0); }, 0);
  const nut = dayNutrition(data, date);
  const entries = data.meals.filter(m => m.date === date);
  const saveNew = () => {
    const vals = ['kcal', 'p', 'c', 'f'].map(k => parseNum(nf[k]));
    if (!nf.name.trim()) return setNf({ ...nf, err: 'Bitte einen Namen eingeben.' });
    if (vals.some(v => !(v >= 0)) || vals[0] > 950) return setNf({ ...nf, err: 'Bitte alle Nährwerte je 100 g als Zahl eingeben (kcal höchstens 950).' });
    const id = uid('food');
    commit(d => ({ ...d, foods: [...d.foods, { id, name: nf.name.trim(), kcal: vals[0], p: vals[1], c: vals[2], f: vals[3], fav: false, custom: true }] }), `Lebensmittel angelegt: ${nf.name.trim()}`);
    setFoodId(id); setNf(null);
  };
  return <>
    <div className="panel form">
      <div className="grid2">
        <Field label="Datum"><input className="input" type="date" max={today} value={date} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="Mahlzeit"><select className="input" value={meal} onChange={e => setMeal(e.target.value)}>{MEALS.map(m => <option key={m}>{m}</option>)}</select></Field>
      </div>
      <Field label="Favoriten mit einem Tipp hinzufügen">
        <div className="fav-list">{data.favMeals.map(fm => <button key={fm.id} className="fav" onClick={() => commit(d => A.addMealItems(d, date, meal, fm.items.filter(([fid]) => d.foods.some(f => f.id === fid))), `${fm.name} als ${meal} eingetragen`)}>
          <Icon name="star" size={16} /><span><b>{fm.name}</b><small>ca. {fmtNum(favKcal(fm))} kcal, {fm.items.length} Zutaten</small></span><Icon name="plus" size={18} />
        </button>)}</div>
      </Field>
      <Field label="Oder einzelnes Lebensmittel"><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Suchen, z. B. Reis" /></Field>
      <ul className="food-list">{list.map(f => <li key={f.id} className={foodId === f.id ? 'on' : ''}>
        <button className="food-pick" aria-pressed={foodId === f.id} onClick={() => setFoodId(f.id)}><span>{f.name}{f.custom && <em> eigenes</em>}</span><small>{fmtNum(f.kcal)} kcal je 100 g</small></button>
        <button className={`icon-btn sm star ${f.fav ? 'on' : ''}`} aria-pressed={f.fav} aria-label={f.fav ? `${f.name} aus Favoriten entfernen` : `${f.name} als Favorit markieren`}
          onClick={() => commit(d => ({ ...d, foods: d.foods.map(x => x.id === f.id ? { ...x, fav: !x.fav } : x) }), null)}><Icon name="star" size={16} /></button>
      </li>)}{!list.length && <li className="muted pad">Kein Treffer. Lege das Lebensmittel unten selbst an.</li>}</ul>
      {food && <div className="pick-detail">
        <Field label={`Menge von ${food.name} in g`}><input className="input" inputMode="decimal" value={qty} onChange={e => setQty(e.target.value)} /></Field>
        {preview && <p className="macro-line"><b>{fmtNum(preview.kcal)} kcal</b><span>E {fmtNum(preview.p, 1)} g</span><span>K {fmtNum(preview.c, 1)} g</span><span>F {fmtNum(preview.f, 1)} g</span></p>}
      </div>}
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary wide" onClick={add} disabled={!food}>Zu {meal} hinzufügen</button>
      {nf ? <div className="subform">
        <h3 className="h3">Eigenes Lebensmittel, Werte je 100 g</h3>
        <Field label="Name"><input className="input" value={nf.name} onChange={e => setNf({ ...nf, name: e.target.value })} /></Field>
        <div className="grid4">{[['kcal', 'kcal'], ['p', 'Eiweiß g'], ['c', 'Kohlenh. g'], ['f', 'Fett g']].map(([k, l]) => <Field key={k} label={l}><input className="input" inputMode="decimal" value={nf[k]} onChange={e => setNf({ ...nf, [k]: e.target.value })} /></Field>)}</div>
        {nf.err && <p className="err" role="alert">{nf.err}</p>}
        <div className="btn-row"><button className="btn primary" onClick={saveNew}>Lebensmittel anlegen</button><button className="btn ghost" onClick={() => setNf(null)}>Abbrechen</button></div>
      </div> : <button className="link" onClick={() => setNf({ name: q, kcal: '', p: '', c: '', f: '' })}>Eigenes Lebensmittel anlegen</button>}
      <p className="hint">Die Nährwerte der Demo-Lebensmittel sind grobe Beispielwerte und nicht geprüft. Gespeicherte Einträge behalten ihre Werte, auch wenn du ein Lebensmittel später änderst.</p>
    </div>

    <section className="block">
      <div className="h2-row"><h2 className="h2">{dayLabel(date, today)} gegessen</h2>{nut && !nut.complete && <span className="tag tag-warn">Unvollständig</span>}</div>
      {nut ? <div className="panel">
        <p className="macro-line big"><b>{fmtNum(nut.kcal)} kcal</b><span>E {fmtNum(nut.p)} g</span><span>K {fmtNum(nut.c)} g</span><span>F {fmtNum(nut.f)} g</span></p>
        {!nut.complete && <p className="hint">Noch nicht erfasst: {nut.missing.join(', ')}. Die Summe zeigt nur die eingetragenen Mahlzeiten.</p>}
        <p className="hint">Kein Kalorienziel festgelegt. Ein Ziel ist optional.</p>
        {MEALS.filter(m => entries.some(e => e.meal === m)).map(m => {
          const es = entries.filter(e => e.meal === m);
          return <div key={m} className="meal-group">
            <div className="h2-row"><h3 className="h3">{m}<span className="muted"> {fmtNum(es.reduce((s, e) => s + e.snap.kcal, 0))} kcal</span></h3>
              <button className="link" onClick={() => commit(d => {
                const items = es.map(e => [d.foods.find(f => f.name === e.name)?.id, e.qty]).filter(([fid]) => fid);
                return { ...d, favMeals: [...d.favMeals, { id: uid('fm'), name: `${m} vom ${fmtDM(date)}`, items }] };
              }, 'Als Favorit gespeichert')}>Als Favorit speichern</button></div>
            <ul className="list">{es.map(e => <li key={e.id} className="row compact"><div className="row-main static"><span className="row-title">{e.name}</span><span className="row-meta"><span>{fmtNum(e.qty)} g</span><span>{fmtNum(e.snap.kcal)} kcal</span></span></div>
              <button className="icon-btn sm" aria-label={`${e.name} entfernen`} onClick={() => commit(d => ({ ...d, meals: d.meals.filter(x => x.id !== e.id) }), 'Eintrag entfernt')}><Icon name="trash" size={16} /></button></li>)}</ul>
          </div>;
        })}
      </div> : <Empty text="Für diesen Tag ist noch nichts eingetragen." />}
    </section>
  </>;
}
function Capture({ ctx, seg, setSeg }) {
  return <div className="screen">
    <header className="page-head"><h1 className="h1">Erfassen</h1></header>
    <p className="demo-note"><Icon name="info" size={16} /> Bitte nur fiktive Testwerte eingeben. Die Demo speichert nichts dauerhaft, nach dem Neuladen beginnt sie von vorn.</p>
    <Segmented label="Was möchtest du erfassen?" value={seg} onChange={setSeg} options={[['gewicht', 'Gewicht'], ['schritte', 'Schritte'], ['training', 'Training'], ['mahlzeit', 'Mahlzeit']]} />
    {seg === 'gewicht' && <WeightForm ctx={ctx} />}
    {seg === 'schritte' && <StepsForm ctx={ctx} />}
    {seg === 'training' && <TrainingForm ctx={ctx} />}
    {seg === 'mahlzeit' && <MealForm ctx={ctx} />}
  </div>;
}

/* ---------------- Entwicklung ---------------- */
function Development({ ctx }) {
  const { data, today, cfg } = ctx;
  const goal = useMemo(() => buildPlan(cfg).tdays.length, [cfg]);
  const [range, setRange] = useState(30);
  const from = addDays(today, -(range - 1));
  const ws = [...data.weights].filter(w => w.date >= from && w.date <= today).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  const pts = ws.map(w => ({ id: w.id, date: w.date, value: w.kg }));
  const mDays = [...new Set(ws.map(w => w.date))];
  const trend = mDays.map(d => ({ date: d, value: avg(data.weights.filter(w => w.date > addDays(d, -7) && w.date <= d).map(w => w.kg)) }));
  const delta = pts.length > 1 ? pts[pts.length - 1].value - pts[0].value : null;
  const stepDays = Math.min(range, 30);
  const stepData = Array.from({ length: stepDays }, (_, i) => { const d = addDays(today, -(stepDays - 1 - i)); const s = data.steps.find(x => x.date === d); return { key: d, label: stepDays <= 7 ? WD[wdIdx(d)] : fmtDM(d), value: s ? s.count : null }; });
  const stepVals = stepData.filter(d => d.value != null).map(d => d.value);
  const weeks = Array.from({ length: 8 }, (_, i) => { const s = addDays(weekStart(today), -(7 - i) * 7); return { key: s, label: `KW${isoWeek(s)}`, value: trainingsInWeek(data, s) }; });
  const kcal = Array.from({ length: 7 }, (_, i) => { const d = addDays(today, -6 + i); const n = dayNutrition(data, d); return { key: d, label: WD[wdIdx(d)], value: n ? n.kcal : null, faint: n && !n.complete }; });
  const tw = trainingsInWeek(data, today), ps = pauseStats(data, today), hs = habitStats(data, today, today);
  const lastWeek = addDays(today, -7);
  const twPrev = trainingsInWeek(data, lastWeek), psPrev = pauseStats(data, lastWeek);
  const suggestions = [];
  if (!goal) suggestions.push('Kein Trainingsziel gesetzt. Wenn du magst, plane in den Einstellungen eine Einheit pro Woche ein.');
  else if (tw < goal) suggestions.push(`Die ${goal} Trainingstermine der nächsten Woche bewusst freihalten oder einen davon auf einen ruhigeren Tag legen.`);
  else suggestions.push(`Den Rhythmus mit ${goal} ${goal === 1 ? 'Einheit' : 'Einheiten'} beibehalten.`);
  if (ps.eligible && ps.done / ps.eligible < 0.6) suggestions.push('Die Bewegungspause auf ein festes Zeitfenster direkt nach dem Mittagessen legen.');
  else suggestions.push('Bewegungspausen laufen gut. Optional eine zweite kurze Pause am Nachmittag testen.');
  return <div className="screen">
    <header className="page-head"><h1 className="h1">Entwicklung</h1></header>
    <Segmented label="Zeitraum" value={String(range)} onChange={v => setRange(Number(v))} options={[['7', '7 Tage'], ['30', '30 Tage'], ['90', '90 Tage'], ['365', '1 Jahr']]} />

    <section className="block">
      <div className="h2-row"><h2 className="h2">Gewicht</h2><span className="muted">{pts.length} Messungen</span></div>
      <div className="panel">
        {pts.length ? <>
          <p className="kpi">{delta != null ? <><b>{signed(delta)} kg</b><span>seit {fmtShort(pts[0].date)}, dem ersten Wert im Zeitraum</span></> : <span>Nur eine Messung im Zeitraum, noch keine Veränderung berechenbar.</span>}</p>
          <LineChart points={pts} from={from} to={today} trend={trend} label={`Gewichtsverlauf mit ${pts.length} Messungen`} maxGap={range <= 30 ? 6 : 10} />
          <p className="legend"><span className="lg-dot" /> Messung <span className="lg-dash" /> Ø der letzten 7 Tage <span className="lg-gap" /> Lücke bedeutet: keine Messung</p>
          <details className="fold small"><summary>Werte als Tabelle</summary>
            <table className="tbl"><thead><tr><th>Datum</th><th>Uhrzeit</th><th>kg</th></tr></thead><tbody>{[...ws].reverse().map(w => <tr key={w.id}><td>{fmtDM(w.date)}</td><td>{w.time || 'nicht erfasst'}</td><td>{fmtNum(w.kg, 1)}</td></tr>)}</tbody></table>
          </details>
        </> : <Empty text="In diesem Zeitraum gibt es keine Messung." action={<button className="btn small" onClick={() => ctx.go('erfassen', 'gewicht')}>Ersten Wert erfassen</button>} />}
      </div>
    </section>

    <section className="block">
      <div className="h2-row"><h2 className="h2">Trainingseinheiten pro Woche</h2></div>
      <div className="panel"><BarChart data={weeks} goal={goal || null} label="Trainingseinheiten der letzten acht Wochen" />
        <p className="hint">Gezählt werden abgeschlossene Einheiten, die für das Wochenziel zählen.</p></div>
    </section>

    <section className="block">
      <div className="h2-row"><h2 className="h2">Schritte, letzte {stepDays} Tage</h2><span className="muted">{stepVals.length} von {stepDays} Tagen erfasst</span></div>
      <div className="panel">
        {stepVals.length ? <p className="kpi"><b>{fmtNum(avg(stepVals))}</b><span>Ø an Tagen mit Eintrag</span></p> : null}
        <BarChart data={stepData} label="Schritte pro Tag" fmt={v => v >= 1000 ? `${fmtNum(v / 1000)}k` : fmtNum(v)} />
        <p className="legend"><span className="lg-missing" /> nicht erfasst, wird nicht als 0 gezählt</p>
      </div>
    </section>

    <section className="block">
      <div className="h2-row"><h2 className="h2">Kalorien, letzte 7 Tage</h2></div>
      <div className="panel"><BarChart data={kcal} label="Kalorien pro Tag" />
        <p className="legend"><span className="lg-bar" /> vollständig <span className="lg-bar faint" /> unvollständig <span className="lg-missing" /> nicht erfasst</p></div>
    </section>

    <section className="block">
      <h2 className="h2">Ziele</h2>
      <div className="panel goals">
        <div className="goal"><div className="goal-head"><span>{goal ? `${goal} Trainingseinheiten pro Woche` : 'Training, kein Wochenziel'}</span><b>{goal ? `${tw} von ${goal}` : tw}</b></div><Progress value={tw} max={goal || 1} label="Trainingsziel" /></div>
        <div className="goal"><div className="goal-head"><span>Bewegungspause an Werktagen</span><b>{ps.done} von {ps.eligible}</b></div><Progress value={ps.done} max={ps.eligible} label="Bewegungspausen" /></div>
        <div className="goal"><div className="goal-head"><span>Gewohnheiten</span><b>{hs.eligible ? `${Math.round(hs.done / hs.eligible * 100)} %` : 'noch keine Tage'}</b></div><Progress value={hs.done} max={hs.eligible} label="Gewohnheiten" /></div>
        <p className="hint">Gewichts- und Kalorienziel sind nicht festgelegt. Beides ist optional, HealthOS legt keine Zielwerte automatisch fest.</p>
      </div>
    </section>

    <section className="block">
      <h2 className="h2">Wochenrückblick</h2>
      <div className="panel review">
        <h3 className="h3">Was geklappt hat</h3>
        <p>{goal ? `${tw} von ${goal}` : tw} Trainingseinheiten (Vorwoche: {twPrev}). {ps.done} von {ps.eligible} Bewegungspausen (Vorwoche: {psPrev.done} von {psPrev.eligible}). {hs.done} Gewohnheiten erledigt.</p>
        <h3 className="h3">Was offen ist</h3>
        <p>{(() => { const od = data.items.filter(i => isOverdue(i, today) && inWeek(i.date, today)).length; const sk = data.items.filter(i => i.status === 'ausgelassen' && inWeek(i.date, today)).length; return `${od} ${od === 1 ? 'Eintrag ist' : 'Einträge sind'} überfällig, ${sk} bewusst ausgelassen. Beides lässt sich neu planen.`; })()}</p>
        <h3 className="h3">Vorschläge für nächste Woche</h3>
        <ul className="plain">{suggestions.map(s => <li key={s}>{s}</li>)}</ul>
        <p className="hint">Der Rückblick folgt festen Regeln aus deinen Einträgen. Er ist keine medizinische Bewertung.</p>
      </div>
    </section>
  </div>;
}

/* ---------------- Gesundheit ---------------- */
function groupLabs(labs) {
  const map = {};
  labs.forEach(l => { (map[l.analyte] = map[l.analyte] || []).push(l); });
  return Object.entries(map).map(([name, arr]) => {
    arr = [...arr].sort((a, b) => a.date.localeCompare(b.date));
    const latest = arr[arr.length - 1];
    return { name, latest, all: arr, same: arr.filter(x => x.unit === latest.unit), other: arr.filter(x => x.unit !== latest.unit) };
  }).sort((a, b) => a.name.localeCompare(b.name, 'de'));
}
const refText = l => l.refMin != null && l.refMax != null ? `${fmtVal(l.refMin)} bis ${fmtVal(l.refMax)} ${l.unit}` : l.refMax != null ? `bis ${fmtVal(l.refMax)} ${l.unit}` : l.refMin != null ? `ab ${fmtVal(l.refMin)} ${l.unit}` : 'keine Referenz hinterlegt';
const refPos = l => (l.refMin == null && l.refMax == null) ? null : (l.refMax != null && l.value > l.refMax) ? 'oberhalb' : (l.refMin != null && l.value < l.refMin) ? 'unterhalb' : 'innerhalb';
function LabCard({ g, open, toggle, ctx }) {
  const l = g.latest; const pos = refPos(l);
  const from = g.same[0].date, to = l.date;
  return <li className={`lab ${open ? 'open' : ''}`}>
    <button className="lab-head" aria-expanded={open} onClick={toggle}>
      <span className="lab-name">{g.name}</span>
      <span className="lab-val"><b>{fmtVal(l.value)}</b> {l.unit}</span>
      <span className="lab-meta">{fmtShort(l.date)}{pos && <span className={`tag ${pos === 'innerhalb' ? '' : 'tag-note'}`}>{pos} Laborreferenz</span>}</span>
    </button>
    {open && <div className="lab-body">
      <p className="hint">Referenz laut Befund: {refText(l)}. {pos && pos !== 'innerhalb' ? 'Das ist eine reine Einordnung gegenüber dem Laborwert, keine Bewertung. Fragen dazu klärst du ärztlich.' : ''}</p>
      {g.same.length > 1
        ? <LineChart points={g.same.map(x => ({ id: x.id, date: x.date, value: x.value }))} from={from} to={to} band={{ min: l.refMin, max: l.refMax }} maxGap={9999} label={`Verlauf ${g.name}`} digits={l.value % 1 ? 1 : 0} />
        : <p className="hint">Für einen Verlauf sind mindestens zwei Messungen in derselben Einheit nötig.</p>}
      {g.other.length > 0 && <p className="callout">{g.other.length} {g.other.length === 1 ? 'Messung liegt' : 'Messungen liegen'} in {[...new Set(g.other.map(o => o.unit))].join(', ')} vor und {g.other.length === 1 ? 'wird' : 'werden'} nicht im Verlauf verglichen, weil keine geprüfte Umrechnung hinterlegt ist.</p>}
      <table className="tbl"><thead><tr><th>Datum</th><th>Wert</th><th>Referenz</th></tr></thead>
        <tbody>{[...g.all].reverse().map(x => <tr key={x.id}><td>{fmtDM(x.date)}{String(parse(x.date).getFullYear()).slice(2) !== String(parse(ctx.today).getFullYear()).slice(2) ? String(parse(x.date).getFullYear()).slice(2) : ''}</td><td>{fmtVal(x.value)} {x.unit}</td><td>{refText(x)}</td></tr>)}</tbody></table>
      <p className="hint">Quelle: {l.lab}{l.source === 'demo' ? ', fiktiver Demo-Wert' : ', manuell eingetragen'}</p>
    </div>}
  </li>;
}
function Labs({ ctx }) {
  const { data, openSheet } = ctx;
  const [open, setOpen] = useState(null);
  const groups = groupLabs(data.labs);
  return <>
    <p className="demo-note"><Icon name="info" size={16} /> Fiktive Beispielwerte. Die App stellt keine Diagnosen und bewertet keine Werte medizinisch.</p>
    <ul className="labs">{groups.map(g => <LabCard key={g.name} g={g} ctx={ctx} open={open === g.name} toggle={() => setOpen(open === g.name ? null : g.name)} />)}</ul>
    <button className="btn block-btn" onClick={() => openSheet({ kind: 'lab' })}><Icon name="plus" size={18} /> Laborwert eintragen</button>
    <div className="panel muted-panel">
      <Icon name="doc" size={20} />
      <div><b>Befunde als PDF oder Bild ablegen</b><p className="hint">Folgt mit sicherem, privatem Speicher und Anmeldung. In dieser Demo nicht verfügbar.</p></div>
    </div>
  </>;
}
function Appointments({ ctx }) {
  const { data, today, commit, openSheet } = ctx;
  const groups = [
    ['Vereinbart', data.appointments.filter(a => a.status === 'vereinbart').sort(byTime)],
    ['Noch zu vereinbaren', data.appointments.filter(a => a.status === 'offen' || a.status === 'aufgeschoben').sort(byTime)],
    ['Erledigt', data.appointments.filter(a => a.status === 'erledigt').sort(byTime).reverse()],
  ];
  return <>
    {groups.map(([title, list]) => <section key={title} className="block">
      <h2 className="h2">{title}</h2>
      {list.length ? <ul className="appts">{list.map(a => <li key={a.id} className="appt">
        <div className="appt-top">
          <span className="date-chip"><b>{parse(a.date).getDate()}</b><small>{parse(a.date).toLocaleDateString('de-DE', { month: 'short' })}</small></span>
          <div className="appt-main"><span className="row-title">{a.title}</span>
            <span className="row-meta"><span>{a.status === 'offen' ? `bis ${fmtDM(a.date)}` : dayLabel(a.date, today)}</span>{a.time && <span>{a.time} Uhr</span>}<span>{a.practice}</span></span>
            {a.note && <p className="hint">{a.note}</p>}
            {a.link && <a className="link" href={a.link} target="_blank" rel="noopener noreferrer">Buchungsseite öffnen (externer Link)</a>}
          </div>
        </div>
        <div className="chips" role="group" aria-label={`Status von ${a.title}`}>{Object.entries(APPT_STATUS).map(([k, l]) =>
          <button key={k} className={`chip sm ${a.status === k ? 'on' : ''}`} aria-pressed={a.status === k} onClick={() => commit(d => ({ ...d, appointments: d.appointments.map(x => x.id === a.id ? { ...x, status: k } : x) }), `${a.title}: ${l}`)}>{l}</button>)}</div>
        <div className="btn-row">
          <button className="btn small" onClick={() => openSheet({ kind: 'appt', id: a.id })}>Bearbeiten oder verschieben</button>
          {a.status === 'erledigt' && <button className="btn small" onClick={() => openSheet({ kind: 'appt', followOf: a.id })}>Folgetermin anlegen</button>}
        </div>
      </li>)}</ul> : <Empty text="Keine Einträge." />}
    </section>)}
    <button className="btn block-btn" onClick={() => openSheet({ kind: 'appt' })}><Icon name="plus" size={18} /> Termin oder Vorsorge anlegen</button>
    <p className="hint pad-x">Vorsorge-Intervalle legst du selbst fest, etwa nach ärztlicher Empfehlung. Die App schlägt keine medizinischen Intervalle vor und bucht keine Termine.</p>
  </>;
}
function Health({ ctx, seg, setSeg }) {
  return <div className="screen">
    <header className="page-head"><h1 className="h1">Gesundheit</h1></header>
    <Segmented label="Bereich" value={seg} onChange={setSeg} options={[['werte', 'Blutwerte'], ['termine', 'Termine und Vorsorge']]} />
    {seg === 'werte' ? <Labs ctx={ctx} /> : <Appointments ctx={ctx} />}
  </div>;
}

/* ---------------- Sheets ---------------- */
function ItemSheet({ id, ctx, close }) {
  const { data, today, commit, go } = ctx;
  const it = data.items.find(i => i.id === id);
  if (!it) return <Sheet title="Eintrag" close={close}><p>Dieser Eintrag existiert nicht mehr.</p></Sheet>;
  const pause = it.status === 'pausiert' ? (data.pauses || []).find(p => p.id === it.pauseId) : null;
  const st = effStatus(it, today);
  const opts = Array.from({ length: 8 }, (_, i) => addDays(today, i)).filter(d => d !== it.date);
  const run = (fn, msg) => { commit(fn, msg); close(); };
  return <Sheet title={it.title} close={close}>
    <p className="sheet-sub">{dayLabel(it.date, today)}{it.time ? `, ${it.time} Uhr` : ''}{it.duration ? `, ${it.duration} Min.` : ''}{it.routine ? ', aus einer Routine' : ''}</p>
    {it.note && <p className="hint">{it.note}</p>}
    {st === 'pausiert' ? <p className="callout">Pausiert{pause ? ` wegen ${pause.reason}, ${fmtDM(pause.from)} bis ${fmtDM(pause.to)}` : ''}. Du kannst die Pause in den Einstellungen entfernen.</p>
    : st === 'verschoben' ? <p className="callout">Dieser Eintrag wurde auf {dayLabel(it.movedTo, today)} verschoben. Den neuen Termin findest du dort.</p> : <>
      {st !== 'ausgelassen' && <button className="btn primary wide" onClick={() => run(d => A.toggleItem(d, it.id), st === 'erledigt' ? `Wieder offen: ${it.title}` : `Erledigt: ${it.title}`)}>{st === 'erledigt' ? 'Wieder öffnen' : 'Als erledigt markieren'}</button>}
      {st !== 'erledigt' && <>
        <h3 className="h3">Verschieben auf</h3>
        <div className="chips">{opts.map(d => <button key={d} className="chip" onClick={() => run(dd => A.moveItem(dd, it.id, d), `Verschoben auf ${dayLabel(d, today)}`)}>{dayLabel(d, today)}</button>)}</div>
        {it.routine && <p className="hint">Gilt nur für diesen einen Termin. Die Routine bleibt unverändert.</p>}
        {st === 'ausgelassen'
          ? <button className="btn wide" onClick={() => run(d => A.setStatus(d, it.id, 'geplant'), 'Wieder eingeplant')}>Wieder einplanen</button>
          : <button className="btn ghost wide" onClick={() => run(d => A.setStatus(d, it.id, 'ausgelassen'), 'Bewusst ausgelassen')}>Bewusst auslassen</button>}
      </>}
      {!it.routine && <button className="btn danger wide" onClick={() => run(d => A.deleteItem(d, it.id), 'Eintrag gelöscht')}>Eintrag löschen</button>}
    </>}
    {it.routine && <button className="link" onClick={() => { close(); go('einstellungen'); }}>Routine dauerhaft ändern</button>}
  </Sheet>;
}
function AddItemSheet({ date, ctx, close }) {
  const { today, commit } = ctx;
  const [title, setTitle] = useState(''); const [type, setType] = useState('training'); const [d, setD] = useState(date); const [time, setTime] = useState('18:00'); const [dur, setDur] = useState('30'); const [err, setErr] = useState('');
  const save = () => {
    const n = parseNum(dur);
    if (!title.trim()) return setErr('Bitte einen Titel eingeben.');
    if (!d || d < today) return setErr('Bitte ein Datum ab heute wählen.');
    if (!(Number.isInteger(n) && n > 0 && n <= 600)) return setErr('Bitte eine Dauer zwischen 1 und 600 Minuten eingeben.');
    commit(x => A.addItem(x, { title: title.trim(), type, date: d, time, duration: n, routine: null }), `Geplant: ${title.trim()}, ${dayLabel(d, today)}`);
    close();
  };
  return <Sheet title="Eintrag planen" close={close}>
    <div className="form">
      <Field label="Titel"><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="z. B. Laufen am Neckar" /></Field>
      <Field label="Art"><div className="chips">{['training', 'bewegung', 'sonstiges'].map(k => <button key={k} className={`chip ${type === k ? 'on' : ''}`} aria-pressed={type === k} onClick={() => setType(k)}>{TYPES[k].label}</button>)}</div></Field>
      <div className="grid2">
        <Field label="Datum"><input className="input" type="date" min={today} value={d} onChange={e => setD(e.target.value)} /></Field>
        <Field label="Uhrzeit"><input className="input" type="time" value={time} onChange={e => setTime(e.target.value)} /></Field>
      </div>
      <Field label="Dauer in Minuten"><input className="input" inputMode="numeric" value={dur} onChange={e => setDur(e.target.value)} /></Field>
      {type === 'training' && <p className="hint">Zählt für das Wochenziel, sobald du es abhakst.</p>}
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary wide" onClick={save}>Eintrag planen</button>
    </div>
  </Sheet>;
}
function LabSheet({ ctx, close }) {
  const { data, today, commit } = ctx;
  const names = [...new Set(data.labs.map(l => l.analyte))];
  const [f, setF] = useState({ analyte: '', value: '', unit: '', refMin: '', refMax: '', date: today, lab: '' });
  const [err, setErr] = useState('');
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const pickName = n => { const last = [...data.labs].filter(l => l.analyte === n).sort((a, b) => b.date.localeCompare(a.date))[0]; setF(s => ({ ...s, analyte: n, unit: last ? last.unit : s.unit })); };
  const save = () => {
    const v = parseNum(f.value), mn = f.refMin === '' ? null : parseNum(f.refMin), mx = f.refMax === '' ? null : parseNum(f.refMax);
    if (!f.analyte.trim()) return setErr('Bitte den Parameter benennen.');
    if (!Number.isFinite(v)) return setErr('Bitte den Wert als Zahl eingeben.');
    if (!f.unit.trim()) return setErr('Bitte die Einheit genau wie im Befund angeben.');
    if ((mn != null && !Number.isFinite(mn)) || (mx != null && !Number.isFinite(mx))) return setErr('Referenzwerte bitte als Zahl eingeben oder leer lassen.');
    if (!f.date || f.date > today) return setErr('Bitte ein Messdatum bis heute wählen.');
    commit(d => ({ ...d, labs: [...d.labs, { id: uid('lab'), analyte: f.analyte.trim(), value: v, unit: f.unit.trim(), refMin: mn, refMax: mx, date: f.date, lab: f.lab.trim() || 'nicht angegeben', source: 'manuell' }] }), `${f.analyte.trim()} gespeichert`);
    close();
  };
  return <Sheet title="Laborwert eintragen" close={close}>
    <div className="form">
      <p className="demo-note"><Icon name="info" size={16} /> Bitte nur fiktive Testwerte verwenden. Nichts wird dauerhaft gespeichert.</p>
      <Field label="Parameter"><input className="input" value={f.analyte} onChange={e => set('analyte', e.target.value)} placeholder="Name wie im Befund" /></Field>
      <div className="chips">{names.map(n => <button key={n} className={`chip sm ${f.analyte === n ? 'on' : ''}`} onClick={() => pickName(n)}>{n}</button>)}</div>
      <div className="grid2">
        <Field label="Wert"><input className="input" inputMode="decimal" value={f.value} onChange={e => set('value', e.target.value)} /></Field>
        <Field label="Einheit wie im Befund"><input className="input" value={f.unit} onChange={e => set('unit', e.target.value)} placeholder="z. B. mg/dl" /></Field>
        <Field label="Referenz von (optional)"><input className="input" inputMode="decimal" value={f.refMin} onChange={e => set('refMin', e.target.value)} /></Field>
        <Field label="Referenz bis (optional)"><input className="input" inputMode="decimal" value={f.refMax} onChange={e => set('refMax', e.target.value)} /></Field>
        <Field label="Messdatum"><input className="input" type="date" max={today} value={f.date} onChange={e => set('date', e.target.value)} /></Field>
        <Field label="Labor (optional)"><input className="input" value={f.lab} onChange={e => set('lab', e.target.value)} /></Field>
      </div>
      <p className="hint">Werte in anderer Einheit werden als eigene Reihe geführt und nicht umgerechnet.</p>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary wide" onClick={save}>Laborwert speichern</button>
    </div>
  </Sheet>;
}
function ApptSheet({ id, followOf, ctx, close }) {
  const { data, today, commit } = ctx;
  const src = data.appointments.find(a => a.id === (id || followOf));
  const editing = !!id && !!src;
  const [f, setF] = useState(editing ? { ...src } : { title: src ? src.title : '', practice: src ? src.practice : '', date: '', time: '', status: 'offen', link: '', note: '' });
  const [err, setErr] = useState('');
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    if (!f.title.trim()) return setErr('Bitte einen Titel eingeben.');
    if (!f.date) return setErr(f.status === 'offen' ? 'Bitte ein Datum angeben, bis wann der Termin vereinbart sein soll.' : 'Bitte ein Datum angeben.');
    if (f.link && !/^https:\/\//.test(f.link.trim())) return setErr('Der Link muss mit https:// beginnen.');
    const clean = { ...f, title: f.title.trim(), practice: f.practice.trim(), link: f.link.trim(), note: f.note.trim() };
    commit(d => ({ ...d, appointments: editing ? d.appointments.map(a => a.id === id ? clean : a) : [...d.appointments, { ...clean, id: uid('ap') }] }), editing ? 'Termin aktualisiert' : 'Termin angelegt');
    close();
  };
  return <Sheet title={editing ? 'Termin bearbeiten' : followOf ? 'Folgetermin anlegen' : 'Termin oder Vorsorge anlegen'} close={close}>
    <div className="form">
      <Field label="Titel"><input className="input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="z. B. Zahnärztliche Kontrolle" /></Field>
      <Field label="Praxis oder Kontakt (optional)"><input className="input" value={f.practice} onChange={e => set('practice', e.target.value)} /></Field>
      <Field label="Status"><div className="chips">{Object.entries(APPT_STATUS).map(([k, l]) => <button key={k} className={`chip sm ${f.status === k ? 'on' : ''}`} aria-pressed={f.status === k} onClick={() => set('status', k)}>{l}</button>)}</div></Field>
      <div className="grid2">
        <Field label={f.status === 'offen' ? 'Vereinbaren bis' : 'Datum'}><input className="input" type="date" value={f.date} onChange={e => set('date', e.target.value)} /></Field>
        <Field label="Uhrzeit (optional)"><input className="input" type="time" value={f.time} onChange={e => set('time', e.target.value)} /></Field>
      </div>
      <Field label="Buchungslink (optional)" hint="Nur ein Link zur Praxis. Die App bucht nichts."><input className="input" inputMode="url" value={f.link} onChange={e => set('link', e.target.value)} placeholder="https://" /></Field>
      <Field label="Notiz (optional)"><textarea className="input" rows={2} value={f.note} onChange={e => set('note', e.target.value)} placeholder="z. B. Kontrolle wie besprochen" /></Field>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary wide" onClick={save}>{editing ? 'Änderungen speichern' : 'Termin anlegen'}</button>
      {editing && <button className="btn danger wide" onClick={() => { commit(d => ({ ...d, appointments: d.appointments.filter(a => a.id !== id) }), 'Termin gelöscht'); close(); }}>Termin löschen</button>}
    </div>
  </Sheet>;
}
function InfoSheet({ close, onSettings }) {
  return <Sheet title="Über diese Demo" close={close}>
    <div className="form">
      <h3 className="h3">Was funktioniert</h3>
      <p className="hint">Einrichtung mit automatischem Wochenplan, Abhaken, Verschieben, Auslassen, Pausieren, Planen, Gewicht, Schritte, Training, Mahlzeiten, Laborwerte und Termine erfassen. Alle Auswertungen rechnen live mit diesen Daten.</p>
      <h3 className="h3">Was gespeichert wird</h3>
      <p className="hint">Nur Einstellungen, Wochenplan, Gewohnheiten und Pausen, privat für dein Konto. Messwerte, Laborwerte, Termine und Basisdaten bleiben Demo-Daten und werden nicht gespeichert.</p>
      <h3 className="h3">Was bewusst fehlt</h3>
      <p className="hint">Keine Push-Benachrichtigungen, kein Datei-Upload, keine Verbindung zu Health Connect oder anderen Diensten. Alle Werte sind fiktiv.</p>
      <button className="btn wide" onClick={() => { close(); onSettings(); }}>Zu den Einstellungen</button>
    </div>
  </Sheet>;
}

/* ---------------- Einrichtung & Einstellungen ---------------- */
function Chips({ options, value, onChange, multi, small }) {
  const sel = multi ? value : [value];
  return <div className="chips">{options.map(([k, l]) => {
    const on = sel.includes(k);
    return <button key={String(k)} className={`chip ${small ? 'sm' : ''} ${on ? 'on' : ''}`} aria-pressed={on}
      onClick={() => onChange(multi ? (on ? value.filter(x => x !== k) : [...value, k]) : k)}>{l}</button>;
  })}</div>;
}
function DayToggles({ value, onChange, enabled, label }) {
  return <div className="daytoggles" role="group" aria-label={label}>{WD.map((w, i) => {
    const on = value.includes(i); const dis = enabled && !enabled.includes(i);
    return <button key={i} className={`dt ${on ? 'on' : ''}`} aria-pressed={on} disabled={dis} onClick={() => onChange(on ? value.filter(x => x !== i) : [...value, i].sort((a, b) => a - b))}>{w}</button>;
  })}</div>;
}
function Stepper({ value, min, max, onChange, label }) {
  return <div className="stepper" role="group" aria-label={label}>
    <button className="icon-btn" aria-label={`${label} verringern`} disabled={value <= min} onClick={() => onChange(value - 1)}><Icon name="minus" /></button>
    <output aria-live="polite">{value}</output>
    <button className="icon-btn" aria-label={`${label} erhöhen`} disabled={value >= max} onClick={() => onChange(value + 1)}><Icon name="plus" /></button>
  </div>;
}
function Toggle({ checked, onChange, children }) {
  return <label className="toggle"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /><span>{children}</span></label>;
}
const setSec = (setCfg, sec, key) => v => setCfg(c => ({ ...c, [sec]: { ...c[sec], [key]: v } }));

function StepBasics({ body, setBody }) {
  const set = k => e => setBody(b => ({ ...b, [k]: e.target.value }));
  return <>
    <div className="grid3">
      <Field label="Alter"><input className="input" inputMode="numeric" value={body.age} onChange={set('age')} placeholder="Jahre" /></Field>
      <Field label="Größe"><input className="input" inputMode="numeric" value={body.height} onChange={set('height')} placeholder="cm" /></Field>
      <Field label="Gewicht"><input className="input" inputMode="decimal" value={body.weight} onChange={set('weight')} placeholder="kg" /></Field>
    </div>
    <p className="demo-note"><Icon name="info" size={16} /> Alles freiwillig. In der Demo bitte nur fiktive Werte oder leer lassen. Diese Angaben werden nicht gespeichert und fließen derzeit in keine Berechnung ein. Ein Gewicht wird nur für diese Sitzung als erste Messung eingetragen.</p>
  </>;
}
function StepGoals({ cfg, setCfg }) {
  const move = (i, dir) => setCfg(c => { const g = [...c.goals]; const j = i + dir; if (j < 0 || j >= g.length) return c; [g[i], g[j]] = [g[j], g[i]]; return { ...c, goals: g }; });
  return <>
    <Chips multi options={Object.entries(GOALS)} value={cfg.goals} onChange={v => setCfg(c => ({ ...c, goals: v }))} />
    {cfg.goals.length > 1 && <>
      <h3 className="h3">Reihenfolge nach Wichtigkeit</h3>
      <ol className="rank">{cfg.goals.map((g, i) => <li key={g}>
        <span className="rank-n">{i + 1}</span><span className="rank-t">{GOALS[g]}</span>
        <button className="icon-btn sm" aria-label={`${GOALS[g]} wichtiger`} disabled={i === 0} onClick={() => move(i, -1)}><Icon name="up" size={18} /></button>
        <button className="icon-btn sm" aria-label={`${GOALS[g]} weniger wichtig`} disabled={i === cfg.goals.length - 1} onClick={() => move(i, 1)}><Icon name="down" size={18} /></button>
      </li>)}</ol>
    </>}
    <p className="hint">{cfg.goals.length ? 'Priorität 1 bestimmt, worauf sich der Hinweis auf „Heute“ konzentriert, und welche Gewohnheiten vorgeschlagen werden.' : 'Ohne Auswahl plant HealthOS ausgewogen mit Bewegung und Training.'}</p>
  </>;
}
function StepWork({ cfg, setCfg }) {
  const w = cfg.work; const set = k => v => setSec(setCfg, 'work', k)(v);
  const err = workError(cfg);
  const l = toMin(w.lunch), s = toMin(w.start), e = toMin(w.end);
  return <>
    <Field label="Arbeitstage"><DayToggles label="Arbeitstage" value={w.days} onChange={v => setCfg(c => ({ ...c, work: { ...c.work, days: v, home: c.work.home.filter(d => v.includes(d)) } }))} /></Field>
    <Field label="Davon im Homeoffice"><DayToggles label="Homeoffice-Tage" value={w.home} enabled={w.days} onChange={set('home')} /></Field>
    {w.days.length ? <>
      <div className="grid2">
        <Field label="Arbeitsbeginn"><input className="input" type="time" value={w.start} onChange={ev => set('start')(ev.target.value)} /></Field>
        <Field label="Arbeitsende"><input className="input" type="time" value={w.end} onChange={ev => set('end')(ev.target.value)} /></Field>
        <Field label="Mittagspause ab"><input className="input" type="time" value={w.lunch} onChange={ev => set('lunch')(ev.target.value)} /></Field>
        <Field label="Dauer"><select className="input" value={w.lunchDur} onChange={ev => set('lunchDur')(Number(ev.target.value))}>{[15, 30, 45, 60].map(m => <option key={m} value={m}>{m} Min.</option>)}</select></Field>
      </div>
      {!err && l != null && (l < s || l > e) && <p className="hint">Die Mittagspause liegt außerhalb der Arbeitszeit. Das ist möglich, bitte kurz prüfen.</p>}
    </> : <p className="hint">Ohne Arbeitstage plant HealthOS keine Bewegungspausen. Training liegt dann zu den Zeiten fürs Wochenende.</p>}
    {err && <p className="err" role="alert">{err}</p>}
  </>;
}
function StepBreaks({ cfg, setCfg }) {
  const b = cfg.breaks; const lunch = toMin(cfg.work.lunch), end = toMin(cfg.work.end);
  const pm = lunch != null && end != null ? hm(r15((lunch + (cfg.work.lunchDur || 30) + end) / 2)) : null;
  return <>
    <Field label="Bewegungspausen pro Arbeitstag"><Chips options={[[0, 'Keine'], [1, 'Eine'], [2, 'Zwei']]} value={b.perDay} onChange={setSec(setCfg, 'breaks', 'perDay')} /></Field>
    {b.perDay > 0 && <Field label="Dauer je Pause"><Chips options={[5, 10, 15, 20].map(m => [m, `${m} Min.`])} value={b.duration} onChange={setSec(setCfg, 'breaks', 'duration')} /></Field>}
    <p className="hint">{!cfg.work.days.length ? 'Ohne Arbeitstage werden keine Bewegungspausen geplant.' : b.perDay === 0 ? 'Es werden keine Pausen eingeplant.' : `Erste Pause zur Mittagszeit um ${cfg.work.lunch || '–'} Uhr${b.perDay === 2 && pm ? `, zweite am Nachmittag um ${pm} Uhr` : ''}. Im Homeoffice und im Büro mit passenden Ideen.`}</p>
  </>;
}
function StepTraining({ cfg, setCfg }) {
  const t = cfg.training; const set = k => setSec(setCfg, 'training', k);
  return <>
    <Field label="Wo kannst du trainieren oder dich bewegen?"><Chips multi options={Object.entries(PLACES).map(([k, p]) => [k, p.label])} value={t.places} onChange={set('places')} /></Field>
    <Field label="Trainingseinheiten pro Woche"><Stepper label="Trainingseinheiten pro Woche" value={t.perWeek} min={0} max={5} onChange={set('perWeek')} /></Field>
    {t.perWeek > 0 && <>
      <Field label="Bevorzugte Tage" hint={t.days.length < t.perWeek ? 'Fehlende Tage ergänzt die Planung automatisch mit möglichst viel Abstand.' : null}><DayToggles label="Bevorzugte Trainingstage" value={t.days} onChange={set('days')} /></Field>
      <Field label="Bevorzugte Tageszeit"><Chips options={Object.entries(SLOTS)} value={t.slot} onChange={set('slot')} /></Field>
      <Field label="Dauer je Einheit"><Chips options={[20, 30, 45, 60, 75, 90].map(m => [m, `${m} Min.`])} value={t.duration} onChange={set('duration')} /></Field>
    </>}
    <Toggle checked={t.freeDay} onChange={set('freeDay')}>Mindestens einen freien Tag ohne Training einplanen</Toggle>
    {!t.places.length && t.perWeek > 0 && <p className="hint">Ohne Auswahl heißt die Einheit „Training nach Wahl“.</p>}
  </>;
}
function StepNutrition({ cfg, setCfg, onTouch }) {
  const n = cfg.nutrition; const set = k => setSec(setCfg, 'nutrition', k);
  return <>
    <Toggle checked={n.calories} onChange={v => setCfg(c => ({ ...c, nutrition: { ...c.nutrition, calories: v, habitsFirst: v ? false : c.nutrition.habitsFirst } }))}>Kalorien und Makros erfassen</Toggle>
    <Toggle checked={n.habitsFirst} onChange={v => setCfg(c => ({ ...c, nutrition: { ...c.nutrition, habitsFirst: v, calories: v ? false : c.nutrition.calories } }))}>Zunächst nur Ernährungsgewohnheiten verbessern, ohne Kalorien</Toggle>
    <Toggle checked={n.weight} onChange={set('weight')}>Gewicht tracken</Toggle>
    {n.weight && <Field label="Wie oft wiegen?"><Chips options={[[1, '1× pro Woche'], [2, '2×'], [3, '3×']]} value={n.weightPerWeek} onChange={set('weightPerWeek')} /></Field>}
    <h3 className="h3">Gewohnheiten</h3>
    <Chips multi options={Object.entries(HABIT_LIBRARY).map(([k, h]) => [k, h.name])} value={cfg.habits} onChange={v => { onTouch && onTouch(); setCfg(c => ({ ...c, habits: v.slice(0, 5) })); }} />
    <div className="btn-row"><button className="btn small" onClick={() => { onTouch && onTouch(); setCfg(c => ({ ...c, habits: suggestHabits(c.goals) })); }}>Vorschlag passend zu meinen Zielen</button></div>
    <p className="hint">Höchstens fünf. Eigene Gewohnheiten legst du in der Woche an. Ein Kalorienziel wird nicht automatisch festgelegt.</p>
  </>;
}
function StepReminders({ cfg, setCfg }) {
  const r = cfg.reminders; const set = k => setSec(setCfg, 'reminders', k);
  return <>
    <Field label="Wie deutlich sollen Hinweise sein?"><Chips options={Object.entries(INTENSITIES).map(([k, v]) => [k, v[0]])} value={r.intensity} onChange={set('intensity')} /></Field>
    <p className="hint top0">{INTENSITIES[r.intensity][1]}</p>
    <Field label="Tonalität der Motivation"><Chips options={Object.entries(TONES).map(([k, v]) => [k, v[0]])} value={cfg.motivation} onChange={v => setCfg(c => ({ ...c, motivation: v }))} /></Field>
    <p className="example">Beispiel: {TONES[cfg.motivation][1]}</p>
    <div className="grid2">
      <Field label="Ruhezeit ab"><input className="input" type="time" value={r.quietFrom} onChange={e => set('quietFrom')(e.target.value)} /></Field>
      <Field label="Ruhezeit bis"><input className="input" type="time" value={r.quietTo} onChange={e => set('quietTo')(e.target.value)} /></Field>
    </div>
    <Field label="Vorlauf für Erinnerungen"><Chips options={[[0, 'Zur Zeit'], [10, '10 Min.'], [15, '15 Min.'], [30, '30 Min.']]} value={r.lead} onChange={set('lead')} /></Field>
    <p className="hint">In der Ruhezeit plant HealthOS nichts ein. Push-Benachrichtigungen gibt es noch nicht, Hinweise erscheinen nur in der App. Der Vorlauf wird gespeichert und greift, sobald Push verfügbar ist.</p>
  </>;
}
function PlanPreview({ cfg }) {
  const plan = useMemo(() => buildPlan(cfg), [cfg]);
  const s = plan.summary;
  return <div className="plan">
    <div className="plan-sum">
      <div><b>{s.trainings}</b><span>Trainings</span></div>
      <div><b>{s.pauses}</b><span>Bewegungspausen</span></div>
      <div><b>{fmtNum(s.activeMin / 60, 1)} h</b><span>Aktivität pro Woche</span></div>
    </div>
    <ul className="plan-days">{[0, 1, 2, 3, 4, 5, 6].map(d => {
      const rs = plan.routines.filter(r => r.days.includes(d)).sort((a, b) => a.time.localeCompare(b.time));
      return <li key={d} className={d === plan.freeDay ? 'free' : ''}>
        <span className="pd-wd">{WD[d]}</span>
        <div className="pd-items">
          {d === plan.freeDay && <span className="tag tag-sun">Freier Tag</span>}
          {rs.length ? rs.map(r => <span key={r.key} className={`pd-item t-${r.type}`}><Icon name={(TYPES[r.type] || TYPES.sonstiges).icon} size={14} /><b>{r.time}</b> {r.title}{r.duration > 5 ? `, ${r.duration} Min.` : ''}</span>) : <span className="muted">nichts geplant</span>}
        </div>
      </li>;
    })}</ul>
    {plan.warn.map(w => <p key={w} className="callout warn">{w}</p>)}
    {plan.notes.map(n => <p key={n} className="hint">{n}</p>)}
    {cfg.habits.length > 0 && <p className="hint">Gewohnheiten zum Abhaken: {cfg.habits.map(h => HABIT_LIBRARY[h].name).join(', ')}.</p>}
  </div>;
}
const OB_STEPS = [
  ['basis', 'Über dich', 'Optional. Du kannst diesen Schritt einfach überspringen.'],
  ['ziele', 'Was möchtest du erreichen?', 'Wähle aus und sortiere nach Wichtigkeit.'],
  ['arbeit', 'Dein Arbeitsalltag', 'Damit Pausen und Training in deinen Tag passen.'],
  ['pausen', 'Bewegung während der Arbeit', 'Kurze Pausen, die realistisch in den Alltag passen.'],
  ['training', 'Training', 'Wo, wie oft und wann du trainieren möchtest.'],
  ['ernaehrung', 'Ernährung und Tracking', 'Was du festhalten möchtest. Alles optional.'],
  ['erinnerungen', 'Hinweise und Motivation', 'Wie deutlich HealthOS dich erinnern soll.'],
  ['plan', 'Dein Wochenplan', 'Prüfe den Vorschlag. Alles bleibt später in den Einstellungen änderbar.'],
];
function StepContent({ k, cfg, setCfg, body, setBody, onTouch }) {
  if (k === 'basis') return <StepBasics body={body} setBody={setBody} />;
  if (k === 'ziele') return <StepGoals cfg={cfg} setCfg={setCfg} />;
  if (k === 'arbeit') return <StepWork cfg={cfg} setCfg={setCfg} />;
  if (k === 'pausen') return <StepBreaks cfg={cfg} setCfg={setCfg} />;
  if (k === 'training') return <StepTraining cfg={cfg} setCfg={setCfg} />;
  if (k === 'ernaehrung') return <StepNutrition cfg={cfg} setCfg={setCfg} onTouch={onTouch} />;
  if (k === 'erinnerungen') return <StepReminders cfg={cfg} setCfg={setCfg} />;
  return <PlanPreview cfg={cfg} />;
}
function Onboarding({ initial, initialBody, onDone, onLater, startStep = 0 }) {
  const [i, setI] = useState(startStep);
  const [cfg, setCfg] = useState(() => normalizeConfig(initial));
  const [body, setBody] = useState(initialBody || { age: '', height: '', weight: '' });
  const [err, setErr] = useState('');
  const [touched, setTouched] = useState(false);
  const ref = useRef(null);
  const [k, title, lead] = OB_STEPS[i];
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; setErr(''); if (k === 'ernaehrung' && !touched) setCfg(c => ({ ...c, habits: suggestHabits(c.goals) })); }, [i]);
  const check = () => (k === 'basis' ? validateBody(body) : k === 'arbeit' ? workError(cfg) : '');
  const next = () => { const e = check(); if (e) return setErr(e); if (i < OB_STEPS.length - 1) setI(i + 1); else onDone(cfg, body); };
  const skip = () => {
    if (k === 'basis') setBody({ age: '', height: '', weight: '' });
    if (k === 'arbeit' && workError(cfg)) setCfg(c => ({ ...c, work: clone(DEFAULT_CONFIG.work) }));
    setI(i + 1);
  };
  return <div className="ob" role="dialog" aria-modal="true" aria-labelledby="ob-title">
    <div className="ob-inner">
      <div className="ob-top">
        <div className="ob-progress" aria-hidden="true">{OB_STEPS.map((_, n) => <span key={n} className={n <= i ? 'on' : ''} />)}</div>
        <div className="ob-meta"><span>Schritt {i + 1} von {OB_STEPS.length}</span><button className="link" onClick={onLater}>Später einrichten</button></div>
      </div>
      <div className="ob-body" ref={ref}>
        <h1 id="ob-title" className="ob-title">{title}</h1>
        <p className="ob-lead">{lead}</p>
        <div className="form"><StepContent k={k} cfg={cfg} setCfg={setCfg} body={body} setBody={setBody} onTouch={() => setTouched(true)} /></div>
        {err && <p className="err" role="alert">{err}</p>}
      </div>
      <div className="ob-foot">
        {i > 0 ? <button className="btn ghost" onClick={() => setI(i - 1)}>Zurück</button> : <span />}
        {k !== 'plan' ? <button className="link" onClick={skip}>Überspringen</button> : <span />}
        <button className="btn primary" onClick={next}>{k === 'plan' ? 'Plan übernehmen' : 'Weiter'}</button>
      </div>
    </div>
  </div>;
}
function PauseSheet({ ctx, close, from: from0 }) {
  const { today, commit } = ctx;
  const [reason, setReason] = useState('Urlaub');
  const [from, setFrom] = useState(from0 || today);
  const [to, setTo] = useState(addDays(from0 || today, 6));
  const [scope, setScope] = useState('alle');
  const [err, setErr] = useState('');
  const save = () => {
    if (!from || !to) return setErr('Bitte Beginn und Ende angeben.');
    if (to < from) return setErr('Das Ende darf nicht vor dem Beginn liegen.');
    if (to < today) return setErr('Die Pause muss mindestens bis heute reichen. Vergangene Einträge werden nicht verändert.');
    if (daysBetween(from, to) > 365) return setErr('Bitte höchstens ein Jahr am Stück.');
    commit(d => A.addPause(d, { reason, from, to, scope }, today), `Pausiert bis ${fmtDM(to)}`);
    close();
  };
  return <Sheet title="Pause eintragen" close={close}>
    <div className="form">
      <Field label="Grund"><Chips options={PAUSE_REASONS.map(r => [r, r])} value={reason} onChange={setReason} /></Field>
      <div className="grid2">
        <Field label="Von"><input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} /></Field>
        <Field label="Bis"><input className="input" type="date" min={from} value={to} onChange={e => setTo(e.target.value)} /></Field>
      </div>
      <Field label="Was pausieren?"><Chips options={[['alle', 'Alle Routinen'], ['training', 'Nur Training']]} value={scope} onChange={setScope} /></Field>
      <p className="hint">Wirkt ab heute auf geplante Routinen. Erledigte, ausgelassene, verschobene und vergangene Einträge bleiben unverändert. Pausierte Tage zählen nicht in die Ziele.</p>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary wide" onClick={save}>Pause speichern</button>
    </div>
  </Sheet>;
}
const SET_SECTIONS = [['ziele', 'Ziele und Priorität'], ['arbeit', 'Arbeitsalltag'], ['pausen', 'Bewegungspausen'], ['training', 'Training'], ['ernaehrung', 'Ernährung, Tracking und Gewohnheiten'], ['erinnerungen', 'Hinweise und Motivation']];
function sectionSummary(k, c) {
  if (k === 'ziele') return c.goals.length ? c.goals.map(g => GOALS[g]).join(', ') : 'keine gewählt';
  if (k === 'arbeit') return c.work.days.length ? `${c.work.days.map(d => WD[d]).join(' ')}, ${c.work.start} bis ${c.work.end}` : 'keine Arbeitstage';
  if (k === 'pausen') return c.breaks.perDay ? `${c.breaks.perDay}× pro Arbeitstag, ${c.breaks.duration} Min.` : 'keine';
  if (k === 'training') return c.training.perWeek ? `${c.training.perWeek}× pro Woche, ${SLOTS[c.training.slot].toLowerCase()}, ${c.training.duration} Min.` : 'kein Training geplant';
  if (k === 'ernaehrung') return [c.nutrition.calories && 'Kalorien', c.nutrition.habitsFirst && 'Gewohnheiten zuerst', c.nutrition.weight && `Gewicht ${c.nutrition.weightPerWeek}×/Woche`].filter(Boolean).join(', ') || 'kein Tracking';
  return `${INTENSITIES[c.reminders.intensity][0]}, Ton ${TONES[c.motivation][0].toLowerCase()}, Ruhe ${c.reminders.quietFrom} bis ${c.reminders.quietTo}`;
}
function StorageInfo({ store }) {
  const t = store.savedAt ? new Date(store.savedAt).toLocaleString('de-DE', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
  if (store.status === 'pending') return <p className="hint">Speicher wird geprüft …</p>;
  if (store.status === 'ready') return <>
    <p className="store-ok"><Icon name="check" size={16} /> Persönlicher Speicher aktiv{t ? `, zuletzt gespeichert ${t} Uhr` : ''}.</p>
    <p className="hint">Gespeichert werden Einstellungen, Wochenplan mit Status, Gewohnheiten und Pausen, privat für dein Konto in diesem Artifact. Nicht gespeichert werden Basisdaten, Gewicht, Schritte, Trainingsdetails, Mahlzeiten, Laborwerte und Termine. Sie bleiben Demo-Daten und sind nach dem Neuladen wieder im Ausgangszustand.</p>
    {store.error && <p className="err" role="alert">{store.error}</p>}
  </>;
  if (store.status === 'error') return <p className="err" role="alert">Der Speicher konnte nicht geladen werden ({store.message}). Änderungen gelten nur bis zum Neuladen.</p>;
  return <p className="hint">In dieser Ansicht ist kein persönlicher Speicher verfügbar, etwa wenn du abgemeldet bist oder die Seite außerhalb von Claude geöffnet ist. Alles gilt nur bis zum Neuladen.</p>;
}
function Settings({ ctx, cfg, applyConfig, body, setBody, store, theme, setTheme, onExport, onDeleteStored, onRestart, onResetDemo }) {
  const { data, today, commit, openSheet } = ctx;
  const [draft, setDraft] = useState(cfg);
  useEffect(() => setDraft(cfg), [cfg]);
  const [open, setOpen] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(cfg);
  const err = workError(draft);
  const diff = useMemo(() => (dirty && !err ? planDiff(data.items, materialize(data, draft, today).items, today) : null), [draft, data, dirty, err]);
  const bodyErr = validateBody(body);
  const pauses = [...(data.pauses || [])].sort((a, b) => a.from.localeCompare(b.from));
  return <div className={`screen ${dirty ? 'has-apply' : ''}`}>
    <header className="page-head"><h1 className="h1">Einstellungen</h1></header>
    {cfg.skipped && <p className="callout">Du nutzt noch den Demo-Plan. <button className="link inline" onClick={onRestart}>Einrichtung starten</button></p>}

    <section className="block first">
      <h2 className="h2">Deine Angaben</h2>
      <ul className="set-list">{SET_SECTIONS.map(([k, l]) => <li key={k} className={open === k ? 'open' : ''}>
        <button className="set-head" aria-expanded={open === k} onClick={() => setOpen(open === k ? null : k)}>
          <span><b>{l}</b><small>{sectionSummary(k, draft)}</small></span><Icon name={open === k ? 'up' : 'down'} size={18} />
        </button>
        {open === k && <div className="set-body form"><StepContent k={k} cfg={draft} setCfg={setDraft} body={body} setBody={setBody} /></div>}
      </li>)}
        <li className={open === 'basis' ? 'open' : ''}>
          <button className="set-head" aria-expanded={open === 'basis'} onClick={() => setOpen(open === 'basis' ? null : 'basis')}>
            <span><b>Basisdaten</b><small>{[body.age && `${body.age} Jahre`, body.height && `${body.height} cm`].filter(Boolean).join(', ') || 'nicht angegeben, nur für diese Sitzung'}</small></span><Icon name={open === 'basis' ? 'up' : 'down'} size={18} />
          </button>
          {open === 'basis' && <div className="set-body form"><StepBasics body={body} setBody={setBody} />{bodyErr && <p className="err" role="alert">{bodyErr}</p>}</div>}
        </li>
      </ul>
    </section>

    <section className="block">
      <div className="h2-row"><h2 className="h2">{dirty ? 'Neuer Wochenplan, Vorschau' : 'Dein Wochenplan'}</h2></div>
      <div className="panel"><PlanPreview cfg={draft} /></div>
    </section>

    <section className="block">
      <h2 className="h2">Pausen und Ausnahmen</h2>
      {pauses.length ? <ul className="list">{pauses.map(p => <li key={p.id} className="row compact">
        <div className="row-main static"><span className="row-title">{p.reason}</span><span className="row-meta"><span>{fmtDM(p.from)} bis {fmtDM(p.to)}</span><span>{p.scope === 'alle' ? 'alle Routinen' : 'nur Training'}</span>{p.to < today && <span>abgelaufen</span>}</span></div>
        <button className="icon-btn sm" aria-label={`Pause ${p.reason} entfernen`} onClick={() => commit(d => A.removePause(d, p.id, today), 'Pause entfernt')}><Icon name="trash" size={16} /></button>
      </li>)}</ul> : <Empty text="Keine Pause eingetragen." />}
      <button className="btn block-btn" onClick={() => openSheet({ kind: 'pause' })}><Icon name="pause" size={18} /> Pause eintragen</button>
    </section>

    <section className="block">
      <h2 className="h2">Speicherung</h2>
      <div className="panel">
        <StorageInfo store={store} />
        <div className="btn-row">
          <button className="btn small" onClick={onExport}>Plan als JSON exportieren</button>
          {store.status === 'ready' && (confirmDel
            ? <><button className="btn small danger-solid" onClick={() => { setConfirmDel(false); onDeleteStored(); }}>Endgültig löschen</button><button className="btn small ghost" onClick={() => setConfirmDel(false)}>Abbrechen</button></>
            : <button className="btn small" onClick={() => setConfirmDel(true)}>Gespeicherte Daten löschen</button>)}
        </div>
        <p className="hint">Der Export enthält Einstellungen und Plan in einer Tabellenstruktur, die später nach Supabase übernommen werden kann.</p>
      </div>
    </section>

    <section className="block">
      <h2 className="h2">Darstellung und Demo</h2>
      <Segmented label="Farbschema" value={theme} onChange={setTheme} options={[['system', 'System'], ['light', 'Hell'], ['dark', 'Dunkel']]} />
      <div className="btn-row">
        <button className="btn small" onClick={onRestart}>Einrichtung erneut starten</button>
        <button className="btn small" onClick={onResetDemo}>Demo-Daten zurücksetzen</button>
      </div>
    </section>

    {dirty && <div className="apply-bar" role="region" aria-label="Änderungen übernehmen">
      <p>{err ? err : diff ? `Ab heute: ${diff.added} neu, ${diff.changed} geändert, ${diff.removed} entfallen. Vergangenes und Erledigtes bleibt unverändert.` : ''}</p>
      <div className="btn-row">
        <button className="btn small ghost" onClick={() => setDraft(cfg)}>Verwerfen</button>
        <button className="btn small primary" disabled={!!err} onClick={() => applyConfig({ ...draft, onboardingDone: true, skipped: false }, 'Wochenplan angepasst')}>Übernehmen</button>
      </div>
    </div>}
  </div>;
}

/* ---------------- App ---------------- */
const TABS = [['heute', 'Heute', 'sun'], ['woche', 'Woche', 'calendar'], ['erfassen', 'Erfassen', 'plus'], ['entwicklung', 'Entwicklung', 'trend'], ['gesundheit', 'Gesundheit', 'heart']];
const EMPTY_BODY = { age: '', height: '', weight: '' };
function App({ initialTab = 'heute', initialSheet = null, initialCapture = 'gewicht', initialHealth = 'werte', initialConfig = null, initialStore = null, initialOnboarding = false }) {
  const [today] = useState(() => iso(new Date()));
  const [cfg, setCfg] = useState(() => normalizeConfig(initialConfig || DEFAULT_CONFIG));
  const [data, setData] = useState(() => seed(today, normalizeConfig(initialConfig || DEFAULT_CONFIG)));
  const [body, setBody] = useState(EMPTY_BODY);
  const [tab, setTab] = useState(initialTab);
  const [captureSeg, setCaptureSeg] = useState(initialCapture);
  const [healthSeg, setHealthSeg] = useState(initialHealth);
  const [sheet, setSheet] = useState(initialSheet);
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState('system');
  const [now, setNow] = useState(() => new Date());
  const [store, setStore] = useState(initialStore || { status: 'pending' });
  const [showOb, setShowOb] = useState(initialOnboarding);
  const undoRef = useRef(null);
  const conn = useRef(null), lastSaved = useRef({}), chain = useRef(Promise.resolve()), settled = useRef(false);
  const say = (msg, undo = false) => setToast({ msg, undo, k: Date.now() + Math.random() });

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);
  useEffect(() => { const el = document.documentElement; if (theme === 'system') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4500); return () => clearTimeout(t); }, [toast]);

  /* Laden aus dem persönlichen Artifact-Speicher */
  useEffect(() => {
    if (initialStore) return;
    let cancelled = false;
    const finish = s => { if (settled.current || cancelled) return; settled.current = true; setStore(s); if (s.status !== 'ready' || !s.restored) setShowOb(true); };
    const timer = setTimeout(() => finish({ status: 'none' }), 8000);
    (async () => {
      try {
        const c = await Store.connect();
        if (!c) return finish({ status: 'none' });
        const saved = await Store.load(c);
        if (settled.current || cancelled) return;
        conn.current = c;
        if (saved) {
          const c2 = normalizeConfig(saved.settings.config);
          saved.weeks.forEach(w => { lastSaved.current[`week:${w.id}`] = '?'; });
          setCfg(c2);
          if (saved.settings.theme) setTheme(saved.settings.theme);
          setData(d => {
            const st = { ...d, items: saved.weeks.flatMap(w => (Array.isArray(w.items) ? w.items : [])), habits: (saved.habits && saved.habits.habits) || d.habits, habitLog: (saved.habits && saved.habits.habitLog) || {}, pauses: (saved.habits && saved.habits.pauses) || [], dismissed: (saved.habits && saved.habits.dismissed) || [] };
            return { ...materialize(st, c2, today), habits: syncHabits(st.habits, c2) };
          });
          finish({ status: 'ready', savedAt: saved.settings.savedAt || null, restored: !!c2.onboardingDone });
        } else finish({ status: 'ready', savedAt: null, restored: false });
      } catch (e) { finish({ status: 'error', message: (e && e.code) || 'unbekannt' }); }
    })();
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  /* Speichern: nur geänderte Dokumente, nacheinander, nach kurzer Pause */
  const saveDocs = async docs => {
    const c = conn.current; if (!c) return;
    const r = Store.refs(c);
    Object.keys(lastSaved.current).forEach(k => { if (k.startsWith('week:') && !docs[k]) docs[k] = { schema: SCHEMA, weekStart: k.slice(5), items: [] }; });
    let wrote = false;
    try {
      for (const [k, b] of Object.entries(docs)) {
        const s = JSON.stringify(b);
        if (lastSaved.current[k] === s) continue;
        const ref = k === 'settings' ? r.settings : k === 'habits' ? r.habits : r.weeks.doc(k.slice(5));
        await Store.write(ref, { ...b, savedAt: new Date().toISOString() });
        lastSaved.current[k] = s; wrote = true;
      }
      if (wrote) setStore(st => ({ ...st, savedAt: new Date().toISOString(), error: null }));
    } catch (e) {
      const code = e && e.code;
      setStore(st => ({ ...st, error: code === 'quota_exceeded' ? 'Der Speicher ist voll. Lösche gespeicherte Daten oder setze die Demo zurück.' : code === 'revoked' ? 'Der Zugriff auf den Speicher wurde beendet. Änderungen gelten nur bis zum Neuladen.' : 'Speichern ist fehlgeschlagen. Änderungen gelten bis zum Neuladen, der nächste Versuch folgt bei der nächsten Änderung.' }));
    }
  };
  useEffect(() => {
    if (store.status !== 'ready' || !conn.current || !cfg.onboardingDone) return;
    const t = setTimeout(() => { const docs = snapshotDocs(cfg, data, theme); chain.current = chain.current.then(() => saveDocs(docs)).catch(() => {}); }, 800);
    return () => clearTimeout(t);
  }, [cfg, data.items, data.habits, data.habitLog, data.pauses, data.dismissed, theme, store.status]);

  const commit = (fn, msg) => {
    setData(prev => { undoRef.current = prev; return fn(prev); });
    if (msg) say(msg, true);
  };
  const undo = () => { if (undoRef.current) { const p = undoRef.current; undoRef.current = null; setData(p); } say('Rückgängig gemacht'); };
  const go = (t, sub) => { setTab(t); if (t === 'erfassen' && sub) setCaptureSeg(sub); if (t === 'gesundheit' && sub) setHealthSeg(sub); setSheet(null); if (typeof window !== 'undefined') window.scrollTo({ top: 0 }); };
  const applyConfig = (next, msg) => {
    const n = normalizeConfig(next);
    undoRef.current = null;
    setCfg(n);
    setData(d => { const m = materialize(d, n, today); return { ...m, habits: syncHabits(m.habits, n) }; });
    if (msg) say(msg);
  };
  const finishOnboarding = (c, b) => {
    applyConfig({ ...c, onboardingDone: true, skipped: false }, 'Dein Wochenplan ist aktiv');
    setBody(b);
    const kg = parseNum(b.weight);
    if (kg >= 30 && kg <= 300) setData(d => ({ ...d, weights: [...d.weights, { id: uid('wg'), date: today, time: '', kg: Math.round(kg * 10) / 10, note: 'aus der Einrichtung', source: 'manuell' }] }));
    setShowOb(false); go('heute');
  };
  const later = () => { applyConfig({ ...cfg, onboardingDone: true, skipped: true }, 'Demo-Plan aktiv. Die Einrichtung findest du in den Einstellungen.'); setShowOb(false); };
  const exportPlan = async () => {
    try {
      const dl = typeof window !== 'undefined' && window.claude && typeof window.claude.use === 'function' ? await window.claude.use('downloads') : null;
      if (!dl) return say('Export ist in dieser Ansicht nicht verfügbar.');
      await dl.save({ filename: `healthos-plan-${today}.json`, data: JSON.stringify(buildExport(cfg, data), null, 2) });
      say('Export bereitgestellt');
    } catch (e) { say(e && e.code === 'declined' ? 'Export abgebrochen' : 'Export war nicht möglich.'); }
  };
  const deleteStored = async () => {
    const c = conn.current; if (!c) return;
    try {
      await chain.current; await Store.deleteAll(c); lastSaved.current = {};
      const fresh = normalizeConfig(DEFAULT_CONFIG);
      setCfg(fresh); setData(seed(today, fresh)); setBody(EMPTY_BODY); setTheme('system');
      setStore(st => ({ ...st, savedAt: null, error: null, restored: false }));
      say('Gespeicherte Daten gelöscht'); setShowOb(true); go('heute');
    } catch (e) { say('Löschen war nicht möglich. Bitte später erneut versuchen.'); }
  };
  const resetDemo = () => { undoRef.current = null; setData(seed(today, cfg)); say('Demo-Daten zurückgesetzt'); };

  const ctx = { data, today, now, commit, go, openSheet: setSheet, cfg };
  const close = () => setSheet(null);
  return <div className="app">
    <div className="topbar">
      <span className="brand"><span className="brand-mark" aria-hidden="true" /><span className="brand-text">HealthOS</span></span>
      <span className="demo-pill">Fiktive Demo-Daten</span>
      <button className={`icon-btn ${tab === 'einstellungen' ? 'on' : ''}`} aria-label="Einstellungen" onClick={() => go('einstellungen')}><Icon name="gear" /></button>
      <button className="icon-btn" aria-label="Über diese Demo" onClick={() => setSheet({ kind: 'info' })}><Icon name="info" /></button>
    </div>
    <main>
      {tab === 'heute' && <Today ctx={ctx} onSetup={() => setShowOb(true)} />}
      {tab === 'woche' && <Week ctx={ctx} />}
      {tab === 'erfassen' && <Capture ctx={ctx} seg={captureSeg} setSeg={setCaptureSeg} />}
      {tab === 'entwicklung' && <Development ctx={ctx} />}
      {tab === 'gesundheit' && <Health ctx={ctx} seg={healthSeg} setSeg={setHealthSeg} />}
      {tab === 'einstellungen' && <Settings ctx={ctx} cfg={cfg} applyConfig={applyConfig} body={body} setBody={setBody} store={store} theme={theme} setTheme={setTheme}
        onExport={exportPlan} onDeleteStored={deleteStored} onRestart={() => setShowOb(true)} onResetDemo={resetDemo} />}
    </main>
    <nav className="tabbar" aria-label="Hauptnavigation">
      {TABS.map(([k, l, ic]) => <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => go(k)}><Icon name={ic} size={22} /><span>{l}</span></button>)}
    </nav>
    {toast && <div className="toast" role="status" key={toast.k}><span>{toast.msg}</span>{toast.undo && <button onClick={undo}>Rückgängig</button>}</div>}
    {sheet && sheet.kind === 'item' && <ItemSheet id={sheet.id} ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'addItem' && <AddItemSheet date={sheet.date} ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'lab' && <LabSheet ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'appt' && <ApptSheet id={sheet.id} followOf={sheet.followOf} ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'pause' && <PauseSheet ctx={ctx} close={close} from={sheet.from} />}
    {sheet && sheet.kind === 'info' && <InfoSheet close={close} onSettings={() => go('einstellungen')} />}
    {showOb && store.status !== 'pending' && <Onboarding initial={cfg} initialBody={body} onDone={finishOnboarding} onLater={later} />}
    {store.status === 'pending' && !initialStore && <div className="splash" role="status"><span className="brand-mark big" aria-hidden="true" /><span>HealthOS wird geladen</span></div>}
  </div>;
}

if (typeof document !== 'undefined' && document.getElementById('root')) {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
}
if (typeof module !== 'undefined') module.exports = { App, seed, A, LabCard, ItemSheet, groupLabs, coachHint, hints, trainingsInWeek, pauseStats, dayNutrition, buildPlan, materialize, planDiff, applyPauses, normalizeConfig, DEFAULT_CONFIG, snapshotDocs, buildExport, Onboarding, Settings, habitStats, syncHabits, OB_STEPS };
