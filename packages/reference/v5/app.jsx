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

/* Lokales Datum und Uhrzeit immer in Europe/Berlin, unabhängig von der Gerätezeitzone */
let _fmtBerlin = null;
function berlinParts(d = new Date()) {
  try {
    _fmtBerlin = _fmtBerlin || new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const p = {}; _fmtBerlin.formatToParts(d).forEach(x => { p[x.type] = x.value; });
    return { date: `${p.year}-${p.month}-${p.day}`, minutes: (Number(p.hour) % 24) * 60 + Number(p.minute) };
  } catch (e) { return { date: iso(d), minutes: d.getHours() * 60 + d.getMinutes() }; }
}

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
/* Datenmodell für die spätere Migration (Supabase):
   config -> user_preferences, routines -> routine_templates + routine_versions + routine_exceptions,
   items -> agenda_items, habits/habitLog -> habits/habit_events, pauses -> schedule_exceptions. */
const SCHEMA = 2;
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
  vielfalt: { name: 'Zwei Sorten Obst oder Gemüse am Tag', goals: ['ernaehrung', 'werte'] },
};
const SLOTS = { morgens: 'Morgens', mittags: 'Mittags', abends: 'Abends' };
const INTENSITIES = { sanft: ['Sanft', 'Nur das Wichtigste, höchstens ein Hinweis.'], ausgewogen: ['Ausgewogen', 'Nahe Termine und Fristen, höchstens drei Hinweise.'], deutlich: ['Deutlich', 'Alle offenen Fristen und Termine der nächsten Woche.'] };
const TONES = { ruhig: ['Ruhig', '1 von 2 Trainingseinheiten erledigt.'], ausgewogen: ['Ausgewogen', '1 von 2 Trainingseinheiten erledigt. Das passt gut in die Woche.'], anspornend: ['Anspornend', '1 von 2 Trainingseinheiten erledigt. Noch 1 bis zum Wochenziel.'] };
/* Bewusst ohne medizinische Gründe: nur Urlaub oder neutrale Auszeit */
const PAUSE_KINDS = { urlaub: 'Urlaub', auszeit: 'Auszeit ohne Grund' };
const TASK_CLASSES = {
  same_day: ['Tagesgebunden', 'Nur am geplanten Tag sinnvoll. Wird sie verpasst, verfällt sie und wird nicht nachgeholt.'],
  weekly_flexible: ['Wöchentlich flexibel', 'Zählt fürs Wochenziel. Verpasst kannst du sie in derselben Woche ersetzen, danach entsteht kein Rückstand.'],
  deadline: ['Mit Frist', 'Bleibt offen, bis du sie erledigst oder verwirfst. Erinnerung höchstens einmal pro Woche.'],
  optional_logging: ['Optional erfassen', 'Fehlt ein Eintrag, gilt er als nicht erfasst. Keine Aufgabe, kein Rückstand.'],
};
const PRIORITIES = { hoch: 'Hoch', normal: 'Normal', niedrig: 'Niedrig' };
const STATUS_INFO = {
  geplant: ['Geplant', 'clock', ''], erledigt: ['Erledigt', 'check', 'ok'], ausgelassen: ['Bewusst ausgelassen', 'minus', 'muted'],
  verpasst: ['Verpasst', 'x', 'muted'], pausiert: ['Pausiert', 'pause', 'muted'], verschoben: ['Verschoben', 'move', 'muted'],
  faellig: ['Frist abgelaufen', 'flag', 'warn'], nicht_erfasst: ['Nicht erfasst', 'minus', 'muted'],
};
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
  review: { weeklyDay: 6, weeklyTime: '18:00', monthly: true },
};
const clone = o => JSON.parse(JSON.stringify(o));
function normalizeConfig(c) {
  const d = clone(DEFAULT_CONFIG);
  if (!c || typeof c !== 'object') return d;
  const arr = (v, f) => (Array.isArray(v) ? v : f);
  const n = { ...d, ...c, work: { ...d.work, ...(c.work || {}) }, breaks: { ...d.breaks, ...(c.breaks || {}) }, training: { ...d.training, ...(c.training || {}) }, nutrition: { ...d.nutrition, ...(c.nutrition || {}) }, reminders: { ...d.reminders, ...(c.reminders || {}) }, review: { ...d.review, ...(c.review || {}) }, schema: SCHEMA };
  n.goals = arr(n.goals, d.goals).filter(g => GOALS[g]);
  n.habits = arr(n.habits, d.habits).filter(h => HABIT_LIBRARY[h]);
  n.work.days = arr(n.work.days, d.work.days); n.work.home = arr(n.work.home, []).filter(x => n.work.days.includes(x));
  n.training.days = arr(n.training.days, d.training.days); n.training.places = arr(n.training.places, d.training.places).filter(p => PLACES[p]);
  if (!INTENSITIES[n.reminders.intensity]) n.reminders.intensity = 'ausgewogen';
  if (!TONES[n.motivation]) n.motivation = 'ausgewogen';
  if (!(n.review.weeklyDay >= 0 && n.review.weeklyDay <= 6)) n.review.weeklyDay = 6;
  if (toMin(n.review.weeklyTime) == null) n.review.weeklyTime = '18:00';
  n.review.monthly = n.review.monthly !== false;
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
function planMeta(key) {
  if (key.startsWith('train-')) return { taskClass: 'weekly_flexible', goal: 'fitter', priority: 'hoch' };
  if (key.startsWith('pause') || key === 'walk') return { taskClass: 'same_day', goal: 'bewegung', priority: 'normal' };
  if (key === 'weigh') return { taskClass: 'optional_logging', goal: 'abnehmen', priority: 'niedrig' };
  if (key === 'meals') return { taskClass: 'optional_logging', goal: 'ernaehrung', priority: 'niedrig' };
  if (key === 'review') return { taskClass: 'same_day', goal: 'routinen', priority: 'normal' };
  return { taskClass: 'same_day', goal: null, priority: 'normal' };
}
const classOfItem = it => it.taskClass || (it.routine ? planMeta(it.routine).taskClass : it.type === 'training' ? 'weekly_flexible' : 'same_day');
function buildPlan(cfg) {
  const c = normalizeConfig(cfg);
  const routines = [], notes = [], warn = [];
  const work = c.work.days, home = c.work.home;
  const push = r => {
    const f = fitQuiet(toMin(r.time), r.duration, c.reminders);
    if (f.shifted) notes.push(`${r.title} liegt um ${hm(f.m)} Uhr, damit nichts in deine Ruhezeit fällt.`);
    routines.push({ ...r, time: hm(f.m), ...planMeta(r.key) });
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
    push({ key: 'weigh', title: 'Gewicht erfassen', type: 'messen', days: n === 1 ? [0] : n === 2 ? [0, 3] : [0, 2, 4], time: hm(Math.max(360, Math.min(450, wStart - 30))), duration: 2, note: 'Optional. Möglichst unter ähnlichen Bedingungen, zum Beispiel morgens.' });
  }
  if (c.nutrition.calories) push({ key: 'meals', title: 'Mahlzeiten eintragen', type: 'ernaehrung', days: [0, 1, 2, 3, 4, 5, 6], time: '20:30', duration: 5, note: 'Optional. Fehlt ein Eintrag, gilt der Tag als nicht erfasst.' });
  push({ key: 'review', title: 'Wochen-Check-in', type: 'rueckblick', days: [c.review.weeklyDay], time: c.review.weeklyTime, duration: 5, note: 'Etwa 3 bis 5 Minuten. Verschieben oder überspringen ist jederzeit möglich.' });
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
  const top = Object.keys(HABIT_LIBRARY).filter(k => k !== 'vielfalt').map(k => [k, score(k)]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  return top.length ? top : ['wasser', 'treppe', 'bildschirm'];
}
function syncHabits(habits, cfg) {
  const want = new Set(normalizeConfig(cfg).habits);
  const out = (habits || []).map(h => (h.lib && !h.pinned ? { ...h, active: want.has(h.lib) } : h));
  want.forEach(k => { if (!out.some(h => h.lib === k)) out.push({ id: `h-${k}`, lib: k, name: HABIT_LIBRARY[k].name, active: true }); });
  return out;
}

/* ---------- Routinen: Vorlagen mit Versionen und Wochentags-Ausnahmen ---------- */
const versionAt = (rt, date) => [...(rt.versions || [])].sort((a, b) => a.validFrom.localeCompare(b.validFrom)).filter(v => v.validFrom <= date).pop() || null;
const weeksBetween = (a, b) => Math.round(daysBetween(weekStart(a), weekStart(b)) / 7);
function specAt(rt, date) {
  if (!rt) return null;
  if (rt.status === 'archiviert' && date >= (rt.archivedFrom || '0000-01-01')) return null;
  const v = versionAt(rt, date); if (!v) return null;
  const wd = wdIdx(date);
  if (!v.days.includes(wd)) return null;
  if ((v.interval || 1) > 1 && ((weeksBetween(v.validFrom, date) % v.interval) + v.interval) % v.interval !== 0) return null;
  const ex = (rt.exceptions || []).filter(e => e.weekday === wd && e.validFrom <= date).sort((a, b) => a.validFrom.localeCompare(b.validFrom)).pop();
  return { title: v.title, kind: v.kind || null, time: ex && ex.time ? ex.time : v.time, duration: ex && ex.duration ? ex.duration : v.duration, note: v.note || '', exceptionId: ex ? ex.id : null };
}
const specText = v => `${v.days.map(d => WD[d]).join(' ')}${(v.interval || 1) > 1 ? ', alle 2 Wochen' : ''}, ${v.time} Uhr, ${v.duration} Min.`;
function routineFromPlan(r, validFrom) {
  return {
    id: r.key, source: 'plan', customized: false, status: 'aktiv', type: r.type, goal: r.goal, taskClass: r.taskClass, priority: r.priority,
    versions: [{ validFrom, title: r.title, kind: r.kind || null, days: [...r.days], time: r.time, duration: r.duration, note: r.note || '', interval: 1 }],
    exceptions: [], history: [{ at: validFrom, text: 'Aus dem Wochenplan erstellt' }],
  };
}
const sameSpec = (v, r) => v.title === r.title && v.time === r.time && v.duration === r.duration && (v.note || '') === (r.note || '') && JSON.stringify(v.days) === JSON.stringify(r.days) && (v.kind || null) === (r.kind || null) && (v.interval || 1) === (r.interval || 1);
function addVersion(rt, validFrom, spec, text) {
  const base = versionAt(rt, validFrom) || rt.versions[rt.versions.length - 1];
  const v = { ...base, ...spec, validFrom };
  const versions = rt.versions.filter(x => x.validFrom !== validFrom).concat([v]).sort((a, b) => a.validFrom.localeCompare(b.validFrom));
  return { ...rt, versions, history: [...(rt.history || []), { at: validFrom, text }] };
}
/* Wochenplan aus den Einstellungen in Routinen übertragen. Von dir angepasste Routinen bleiben unverändert. */
function syncPlanRoutines(routines, cfg, fromDate) {
  const plan = buildPlan(cfg);
  let out = (routines || []).map(r => ({ ...r }));
  plan.routines.forEach(r => {
    const i = out.findIndex(x => x.id === r.key);
    if (i < 0) { out.push(routineFromPlan(r, fromDate)); return; }
    let rt = out[i];
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
const instanceOf = (rt, sp, date, status = 'geplant') => ({ id: `r:${rt.id}:${date}`, routine: rt.id, title: sp.title, type: rt.type, kind: sp.kind, date, time: sp.time, duration: sp.duration, note: sp.note || '', status, taskClass: rt.taskClass, priority: rt.priority, goal: rt.goal || null });
/* Nur unveränderte, zukünftige Routineninstanzen dürfen von der Planung angepasst werden */
const isPlanFree = (it, today) => !!it.routine && !it.movedFrom && !it.override && !it.replaces && it.date >= today && (it.status === 'geplant' || it.status === 'pausiert');
const allPauses = st => [...(st.pauses || []), ...(st.routines || []).filter(r => r.status === 'pausiert').map(r => ({ id: `routine:${r.id}`, routineId: r.id, from: r.pausedSince || '0000-01-01', to: '9999-12-31', scope: 'routine' }))];
function applyPauses(items, pauses, today) {
  return items.map(it => {
    if (!isPlanFree(it, today)) return it;
    const p = (pauses || []).find(x => it.date >= x.from && it.date <= x.to && (x.scope === 'routine' ? it.routine === x.routineId : (x.scope === 'alle' || it.type === 'training')));
    if (p) return it.status === 'pausiert' && it.pauseId === p.id ? it : { ...it, status: 'pausiert', pauseId: p.id };
    if (it.status === 'pausiert') { const { pauseId, ...rest } = it; return { ...rest, status: 'geplant' }; }
    return it;
  });
}
/* Tageswechsel: Vergangene, nicht erledigte Einträge werden je nach Aufgabenklasse abgeschlossen.
   Tagesgebunden und wöchentlich -> verpasst, optional -> nicht erfasst, Frist -> bleibt offen. */
function settle(items, today) {
  return items.map(it => {
    if (it.status !== 'geplant' || it.date >= today) return it;
    const c = classOfItem(it);
    if (c === 'deadline') return it;
    return { ...it, taskClass: c, status: c === 'optional_logging' ? 'nicht_erfasst' : 'verpasst' };
  });
}
/* Erzeugt Instanzen ab heute bis Ende nächster Woche (oder bis horizon). Idempotent über feste IDs. */
function materialize(st, today, horizon) {
  const routines = st.routines || [];
  const rmap = new Map(routines.map(r => [r.id, r]));
  const end = [addDays(weekStart(today), 13), horizon || ''].sort().pop();
  const items = [];
  st.items.forEach(it0 => {
    const it = it0.taskClass ? it0 : { ...it0, taskClass: classOfItem(it0) };
    if (!isPlanFree(it, today)) { items.push(it); return; }
    const rt = rmap.get(it.routine); const sp = specAt(rt, it.date);
    if (!sp) return;
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
function planDiff(a, b, today) {
  const fut = l => new Map(l.filter(i => isPlanFree(i, today)).map(i => [i.id, i]));
  const A_ = fut(a), B_ = fut(b); const changes = [];
  B_.forEach((v, k) => {
    const o = A_.get(k);
    if (!o) changes.push({ kind: 'neu', it: v });
    else if (o.time !== v.time || o.duration !== v.duration || o.title !== v.title || o.status !== v.status) changes.push({ kind: 'geändert', it: v, old: o });
  });
  A_.forEach((v, k) => { if (!B_.has(k)) changes.push({ kind: 'entfällt', it: v }); });
  changes.sort((x, y) => byTime(x.it, y.it));
  const n = k => changes.filter(c => c.kind === k).length;
  return { added: n('neu'), changed: n('geändert'), removed: n('entfällt'), changes, kept: b.length - B_.size };
}
function findConflicts(items, dates) {
  const out = [];
  [...new Set(dates)].forEach(d => {
    const list = items.filter(i => i.date === d && i.time && i.duration && i.status === 'geplant');
    for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
      const s1 = toMin(list[a].time), e1 = s1 + list[a].duration, s2 = toMin(list[b].time), e2 = s2 + list[b].duration;
      if (s1 < e2 && s2 < e1) out.push(`${WD[wdIdx(d)]}, ${fmtDM(d)}: ${list[a].title} (${list[a].time}) überschneidet sich mit ${list[b].title} (${list[b].time}).`);
    }
  });
  return [...new Set(out)];
}
const pausedAll = (data, d) => (data.pauses || []).some(p => p.scope === 'alle' && d >= p.from && d <= p.to);
const validateWeight = w => { if (String(w ?? '').trim() === '') return ''; const n = parseNum(w); return n >= 30 && n <= 300 ? '' : 'Bitte ein Gewicht zwischen 30 und 300 kg eingeben oder das Feld leer lassen.'; };
function workError(c) {
  const s = toMin(c.work.start), e = toMin(c.work.end), l = toMin(c.work.lunch);
  if (!c.work.days.length) return '';
  if (s == null || e == null) return 'Bitte Arbeitsbeginn und Arbeitsende angeben.';
  if (e <= s) return 'Das Arbeitsende muss nach dem Arbeitsbeginn liegen.';
  if (l == null) return 'Bitte eine Uhrzeit für die Mittagspause angeben.';
  return '';
}
function migratePause(p) {
  const kind = PAUSE_KINDS[p.kind] ? p.kind : (p.reason === 'Urlaub' ? 'urlaub' : 'auszeit');
  return { id: p.id || uid('p'), kind, from: p.from, to: p.to, scope: p.scope === 'training' ? 'training' : 'alle' };
}

/* ---------------- Export / Import ---------------- */
function buildExport(cfg, data) {
  const rts = data.routines || [];
  return {
    format: 'healthos-export', schema: SCHEMA, exportedAt: new Date().toISOString(), timezone: 'Europe/Berlin',
    hinweis: 'Lokaler Demo-Export: Einstellungen, Routinen und Wochenplan. Keine Messwerte, Laborwerte, Termine, Empfehlungen zu Laborwerten oder Pausengründe.',
    tables: {
      user_preferences: [normalizeConfig(cfg)],
      routine_templates: rts.map(r => ({ id: r.id, source: r.source, customized: !!r.customized, status: r.status, category: r.type, goal: r.goal || null, task_class: r.taskClass, priority: r.priority, paused_since: r.pausedSince || null, archived_from: r.archivedFrom || null, history: r.history || [] })),
      routine_versions: rts.flatMap(r => r.versions.map(v => ({ routine_id: r.id, valid_from: v.validFrom, title: v.title, kind: v.kind || null, weekdays: v.days, interval_weeks: v.interval || 1, time_local: v.time, duration_min: v.duration, note: v.note || null }))),
      routine_exceptions: rts.flatMap(r => (r.exceptions || []).map(e => ({ id: e.id, routine_id: r.id, weekday: e.weekday, valid_from: e.validFrom, time_local: e.time || null, duration_min: e.duration || null }))),
      agenda_items: data.items.filter(i => !i.sessionOnly).map(i => ({ id: i.id, routine_id: i.routine || null, title: i.title, category: i.type, kind: i.kind || null, task_class: classOfItem(i), priority: i.priority || 'normal', planned_date: i.date, planned_time: i.time || null, duration_min: i.duration || null, status: i.status, moved_from: i.movedFrom || null, moved_to: i.movedTo || null, replaces: i.replaces || null, override: !!i.override, pause_id: i.pauseId || null, note: i.note || null })),
      habits: data.habits.map(h => ({ id: h.id, name: h.name, library_key: h.lib || null, active: h.active !== false, pinned: !!h.pinned })),
      habit_events: Object.entries(data.habitLog).map(([k, v]) => { const [hid, date] = k.split('|'); return { habit_id: hid, date, status: v }; }),
      schedule_exceptions: (data.pauses || []).map(p => ({ id: p.id, kind: p.kind, from_date: p.from, to_date: p.to, scope: p.scope })),
      review_sessions: Object.entries(persistableReviews(data.reviews)).map(([k, r]) => ({ key: k, kind: r.kind, status: r.status, completed_at: r.at, snoozed_until: r.snoozedUntil, question_ids: r.questionIds, demo: r.demo })),
      review_measures: Object.entries(persistableReviews(data.reviews)).flatMap(([k, r]) => r.measures.map(x => ({ review_key: k, measure_id: x.id, title: x.title, area: x.area, success_check: x.check, metric: x.metric, decision: x.decision, decided_at: x.decidedAt, valid_from: x.validFrom }))),
    },
  };
}
const ITEM_STATUSES = ['geplant', 'erledigt', 'ausgelassen', 'verpasst', 'pausiert', 'verschoben', 'nicht_erfasst'];
function parseImport(obj) {
  try {
    if (!obj || obj.format !== 'healthos-export' || !obj.tables) return { error: 'Das ist keine HealthOS-Exportdatei.' };
    if (![1, 2].includes(obj.schema)) return { error: `Unbekannte Exportversion ${obj.schema}.` };
    const t = obj.tables; const isDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); const isTime = s => typeof s === 'string' && /^\d{2}:\d{2}$/.test(s);
    const cfg = normalizeConfig((t.user_preferences || [])[0]);
    let routines;
    if (obj.schema >= 2 && Array.isArray(t.routine_templates)) {
      routines = t.routine_templates.map(r => ({
        id: String(r.id), source: ['plan', 'eigene', 'empfehlung'].includes(r.source) ? r.source : 'eigene', customized: !!r.customized,
        status: ['aktiv', 'pausiert', 'archiviert'].includes(r.status) ? r.status : 'aktiv', type: TYPES[r.category] ? r.category : 'sonstiges',
        goal: GOALS[r.goal] ? r.goal : null, taskClass: TASK_CLASSES[r.task_class] ? r.task_class : 'same_day', priority: PRIORITIES[r.priority] ? r.priority : 'normal',
        pausedSince: isDate(r.paused_since) ? r.paused_since : undefined, archivedFrom: isDate(r.archived_from) ? r.archived_from : undefined,
        history: Array.isArray(r.history) ? r.history.slice(-60) : [],
        versions: (t.routine_versions || []).filter(v => v.routine_id === r.id && isDate(v.valid_from)).map(v => ({
          validFrom: v.valid_from, title: String(v.title || 'Routine').slice(0, 80), kind: v.kind || null, days: (v.weekdays || []).filter(d => Number.isInteger(d) && d >= 0 && d < 7),
          interval: v.interval_weeks === 2 ? 2 : 1, time: isTime(v.time_local) ? v.time_local : '12:00', duration: Math.max(1, Math.min(600, Number(v.duration_min) || 15)), note: v.note || '' })).sort((a, b) => a.validFrom.localeCompare(b.validFrom)),
        exceptions: (t.routine_exceptions || []).filter(e => e.routine_id === r.id && isDate(e.valid_from)).map(e => ({ id: e.id || uid('ex'), weekday: e.weekday, validFrom: e.valid_from, time: isTime(e.time_local) ? e.time_local : null, duration: e.duration_min || null })),
      })).filter(r => r.versions.length);
    } else routines = syncPlanRoutines([], cfg, '2000-01-01').routines;
    const seen = new Set();
    const items = (t.agenda_items || []).filter(i => i && i.id && isDate(i.planned_date) && ITEM_STATUSES.includes(i.status) && !seen.has(i.id) && seen.add(i.id)).slice(0, 20000).map(i => {
      const it = {
        id: String(i.id), routine: i.routine_id || i.routine_key || null, title: String(i.title || 'Eintrag').slice(0, 80), type: TYPES[i.category || i.type] ? (i.category || i.type) : 'sonstiges',
        kind: i.kind || null, priority: PRIORITIES[i.priority] ? i.priority : 'normal', date: i.planned_date, time: isTime(i.planned_time) ? i.planned_time : '', duration: i.duration_min || null,
        status: i.status, note: i.note || '',
      };
      if (TASK_CLASSES[i.task_class]) it.taskClass = i.task_class;
      ['moved_from', 'moved_to', 'replaces', 'pause_id'].forEach((k, n) => { if (i[k]) it[['movedFrom', 'movedTo', 'replaces', 'pauseId'][n]] = i[k]; });
      if (i.override) it.override = true;
      it.taskClass = classOfItem(it);
      return it;
    });
    const habits = (t.habits || []).map(h => ({ id: String(h.id), name: String(h.name || 'Gewohnheit').slice(0, 60), lib: HABIT_LIBRARY[h.library_key] ? h.library_key : undefined, active: h.active !== false, pinned: !!h.pinned, custom: !h.library_key }));
    const habitLog = {}; (t.habit_events || []).forEach(e => { if (e && isDate(e.date) && (e.status === 'done' || e.status === 'skip')) habitLog[`${e.habit_id}|${e.date}`] = e.status; });
    const pauses = (t.schedule_exceptions || []).filter(p => isDate(p.from_date) && isDate(p.to_date)).map(p => migratePause({ id: p.id, kind: p.kind, reason: p.reason, from: p.from_date, to: p.to_date, scope: p.scope }));
    const reviews = {};
    (t.review_sessions || []).forEach(r => { if (r && /^(W:\d{4}-\d{2}-\d{2}|M:\d{4}-\d{2})$/.test(r.key) && REVIEW_STATUS[r.status]) reviews[r.key] = { kind: r.kind === 'month' ? 'month' : 'week', status: r.status, at: isDate(r.completed_at) ? r.completed_at : null, snoozedUntil: isDate(r.snoozed_until) ? r.snoozed_until : null, questionIds: Array.isArray(r.question_ids) ? r.question_ids.slice(0, 10) : [], measures: [], demo: !!r.demo }; });
    (t.review_measures || []).forEach(x => { if (x && reviews[x.review_key]) reviews[x.review_key].measures.push({ id: String(x.measure_id), title: String(x.title || '').slice(0, 120), area: x.area || 'alles', check: x.success_check || '', metric: x.metric || null, decision: x.decision === 'übernommen' ? 'übernommen' : 'nicht jetzt', decidedAt: isDate(x.decided_at) ? x.decided_at : null, validFrom: isDate(x.valid_from) ? x.valid_from : null }); });
    return { state: { cfg, routines, items, habits, habitLog, pauses, reviews }, counts: { routines: routines.length, items: items.length, pauses: pauses.length } };
  } catch (e) { return { error: 'Die Datei konnte nicht gelesen werden.' }; }
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
  refs(c) { const settings = c.db.doc(`${c.base}/settings`); return { settings, plan: c.db.doc(`${c.base}/plan`), habits: c.db.doc(`${c.base}/habits`), weeks: settings.collection('weeks') }; },
  async load(c) {
    const r = Store.refs(c);
    const s = await r.settings.get();
    if (!s.exists) return null;
    const [p, h, w] = await Promise.all([r.plan.get(), r.habits.get(), r.weeks.get()]);
    return { settings: s.data(), plan: p.exists ? p.data() : null, habits: h.exists ? h.data() : null, weeks: w.docs.map(d => ({ id: d.id, ...d.data() })) };
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
    await r.plan.delete(); await r.habits.delete(); await r.settings.delete();
  },
};
/* Gespeicherte Daten von Version 1 oder 2 in den aktuellen Stand überführen. Kein stiller Datenverlust. */
function migrateSaved(saved) {
  const schema = (saved.settings && saved.settings.schema) || 1;
  const cfg = normalizeConfig(saved.settings && saved.settings.config);
  const h = saved.habits || {};
  let routines = saved.plan && Array.isArray(saved.plan.routines) ? saved.plan.routines : null;
  if (!routines) routines = syncPlanRoutines([], cfg, '2000-01-01').routines;
  const items = (saved.weeks || []).flatMap(w => (Array.isArray(w.items) ? w.items : [])).map(it => ({ ...it, taskClass: it.taskClass || classOfItem(it) }));
  return { cfg, theme: saved.settings && saved.settings.theme, routines, recState: (saved.plan && saved.plan.recState) || {}, reviews: (saved.plan && saved.plan.reviews) || {}, items, habits: h.habits, habitLog: h.habitLog || {}, pauses: (h.pauses || []).map(migratePause), dismissed: h.dismissed || [], fromSchema: schema };
}
/* Gespeichert werden nur Konfiguration, Routinen und Plan. Messwerte, Laborwerte, Termine, Basisdaten,
   laborbezogene Empfehlungen und reine Sitzungseinträge nicht. */
function snapshotDocs(cfg, data, theme) {
  const docs = {
    settings: { schema: SCHEMA, config: normalizeConfig(cfg), theme },
    plan: { schema: SCHEMA, routines: data.routines || [], recState: persistableRecState(data.recState), reviews: persistableReviews(data.reviews) },
    habits: { schema: SCHEMA, habits: data.habits, habitLog: data.habitLog, pauses: (data.pauses || []).map(p => ({ id: p.id, kind: p.kind, from: p.from, to: p.to, scope: p.scope })), dismissed: data.dismissed },
  };
  const weeks = {};
  data.items.filter(i => !i.sessionOnly).forEach(i => { const ws = weekStart(i.date); (weeks[ws] = weeks[ws] || []).push(i); });
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
  { id: 'lentils', name: 'Linsen, gekocht', kcal: 116, p: 9, c: 20, f: 0.4 },
  { id: 'chickpeas', name: 'Kichererbsen, gekocht', kcal: 164, p: 8.9, c: 27, f: 2.6 },
  { id: 'blueberries', name: 'Heidelbeeren', kcal: 57, p: 0.7, c: 14, f: 0.3 },
  { id: 'walnuts', name: 'Walnüsse', kcal: 654, p: 15, c: 14, f: 65 },
  { id: 'pumpkinseeds', name: 'Kürbiskerne', kcal: 559, p: 30, c: 11, f: 49 },
  { id: 'rapeseedoil', name: 'Rapsöl', kcal: 884, p: 0, c: 0, f: 100 },
];
const IDEA_FOODS = ['oats', 'lentils', 'chickpeas', 'blueberries', 'walnuts', 'pumpkinseeds', 'rapeseedoil'];
const MEALS = ['Frühstück', 'Mittagessen', 'Abendessen', 'Snack'];
const MAIN_MEALS = ['Frühstück', 'Mittagessen', 'Abendessen'];
const snap = (food, qty) => { const k = qty / 100; return { kcal: Math.round(food.kcal * k), p: +(food.p * k).toFixed(1), c: +(food.c * k).toFixed(1), f: +(food.f * k).toFixed(1) }; };
const WORKOUT_KINDS = ['Krafttraining', 'Home-Workout', 'Laufen', 'Gehen', 'Radfahren', 'Schwimmen', 'Yoga', 'Sonstiges'];
const INTENSITY = ['leicht', 'moderat', 'fordernd', 'hart', 'maximal'];
const APPT_STATUS = { offen: 'Offen', vereinbart: 'Vereinbart', erledigt: 'Erledigt', aufgeschoben: 'Aufgeschoben' };

function seed(today, cfg = DEFAULT_CONFIG) {
  const r = rng(11);
  const ws = weekStart(today);
  const routines = syncPlanRoutines([], cfg, '2000-01-01').routines;
  const items = []; const workouts = [];
  for (let d = addDays(ws, -35); d < today; d = addDays(d, 1)) routines.forEach(rt => {
    const sp = specAt(rt, d); if (!sp) return;
    items.push(instanceOf(rt, sp, d, r() < 0.8 ? 'erledigt' : 'ausgelassen'));
  });
  // Demo: die letzte Bewegungspause vor heute wurde nicht gemacht und wird beim Tageswechsel zu „verpasst“
  const pastPauses = items.filter(i => i.routine.startsWith('pause') && i.date >= ws);
  if (pastPauses.length) pastPauses[pastPauses.length - 1].status = 'geplant';
  items.filter(i => i.type === 'training' && i.status === 'erledigt').forEach(i =>
    workouts.push({ id: uid('w'), date: i.date, kind: i.kind || 'Krafttraining', duration: i.duration, intensity: 2, counts: true, itemId: i.id, source: 'demo' }));
  for (let w = 6; w <= 9; w++) {
    const start = addDays(ws, -w * 7);
    const n = r() < 0.2 ? 0 : r() < 0.55 ? 1 : 2;
    [1, 5].slice(0, n).forEach(di => workouts.push({ id: uid('w'), date: addDays(start, di), kind: di === 1 ? 'Krafttraining' : 'Radfahren', duration: di === 1 ? 55 : 70, intensity: 2, counts: true, source: 'demo' }));
  }
  // Demo-Aufgabe mit Frist: bleibt offen, bis sie erledigt oder verworfen wird
  items.push({ id: 'demo-frist', routine: null, title: 'Impfpass heraussuchen', type: 'sonstiges', taskClass: 'deadline', priority: 'normal', date: addDays(today, -2), time: '', duration: null, status: 'geplant', note: 'Demo-Aufgabe mit Frist. Sie bleibt sichtbar, bis du sie erledigst oder verwirfst.' });
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
  const lab = (analyte, value, unit, refMin, refMax, ago, confirmed = true) => ({ id: uid('lab'), analyte, value, unit, refMin, refMax, date: addDays(today, -ago), lab: 'Demo-Labor', source: 'demo', confirmed });
  const labs = [
    lab('LDL-Cholesterin', 128, 'mg/dl', null, 115, 380), lab('LDL-Cholesterin', 124, 'mg/dl', null, 115, 40),
    lab('HbA1c', 5.3, '%', 4.0, 5.6, 380), lab('HbA1c', 5.4, '%', 4.0, 5.6, 40),
    lab('Vitamin D (25-OH)', 48, 'nmol/l', 75, 250, 720), lab('Vitamin D (25-OH)', 22, 'ng/ml', 30, 100, 380), lab('Vitamin D (25-OH)', 41, 'ng/ml', 30, 100, 40),
    lab('Ferritin', 96, 'µg/l', 30, 400, 40),
    lab('Zink', 62, 'µg/dl', 70, 120, 40),
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
  // Fiktive Review-Historie für die Vergleichsansicht
  /* Demo-Historie immer vor dem aktuell zu prüfenden Zeitraum, damit kein fälliger Check-in vorab als erledigt gilt */
  const tw0 = weeklyWindow(today, cfg).target;
  const reviews = {
    [`W:${addDays(tw0, -7)}`]: { kind: 'week', status: 'abgeschlossen', at: addDays(tw0, -1), questionIds: ['umfang', 'pausen-hindernis'], measures: [{ id: 'fortfuehren', title: 'Alles so fortführen', area: 'alles', check: 'Beim nächsten Review vergleichen.', metric: null, decision: 'übernommen', decidedAt: addDays(tw0, -1), validFrom: tw0 }], demo: true },
    [`W:${addDays(tw0, -14)}`]: { kind: 'week', status: 'uebersprungen', at: addDays(tw0, -8), questionIds: [], measures: [], demo: true },
  };
  /* Check-in-Termine der Demo passend zur Review-Historie: nur der abgeschlossene Check-in gilt als erledigt */
  const wdR = normalizeConfig(cfg).review.weeklyDay;
  const slotOf = t => (wdR >= 4 ? addDays(t, wdR) : addDays(t, 7 + wdR));
  items.forEach(i => { if (i.routine === 'review' && i.date < today) i.status = i.date === slotOf(addDays(tw0, -7)) ? 'erledigt' : 'geplant'; });
  return materialize({ routines, items, workouts, weights, steps, foods, favMeals, meals, labs, appointments, habits, habitLog, dismissed: [], pauses: [], recState: {}, reviews }, today);
}

/* ---------------- Fachlogik ---------------- */
/* Einheitlicher Status für Anzeige, Statistik und Export */
const effStatus = (it, today) => {
  if (it.status === 'geplant' && it.date < today) {
    const c = classOfItem(it);
    return c === 'deadline' ? 'faellig' : c === 'optional_logging' ? 'nicht_erfasst' : 'verpasst';
  }
  return it.status;
};
const inWeek = (date, anchor) => { const d = weekDays(anchor); return date >= d[0] && date <= d[6]; };
/* Abgeschlossene Trainings aus dem Plan plus frei erfasste Einheiten, die fürs Ziel zählen (ohne Doppelzählung) */
const trainingsInWeek = (data, anchor) =>
  data.items.filter(i => i.type === 'training' && i.status === 'erledigt' && inWeek(i.date, anchor)).length
  + data.workouts.filter(w => w.counts && !w.itemId && inWeek(w.date, anchor)).length;
/* Verpasst zählt als nicht erledigt im Nenner. Bewusst ausgelassen, pausiert und verschoben fallen heraus. */
function pauseStats(data, anchor) {
  const list = data.items.filter(i => i.routine && i.routine.startsWith('pause') && inWeek(i.date, anchor) && !['verschoben', 'pausiert'].includes(i.status));
  const eligible = list.filter(i => i.status !== 'ausgelassen');
  return { done: eligible.filter(i => i.status === 'erledigt').length, eligible: eligible.length, skipped: list.length - eligible.length, missed: eligible.filter(i => i.status === 'verpasst').length };
}
function habitStats(data, anchor, today) {
  let done = 0, eligible = 0, skipped = 0;
  const hs = data.habits;
  weekDays(anchor).filter(d => d <= today && !pausedAll(data, d)).forEach(d => hs.filter(h => habitOn(h, d)).forEach(h => {
    const v = data.habitLog[`${h.id}|${d}`];
    if (v === 'skip') skipped++; else { eligible++; if (v === 'done') done++; }
  }));
  return { done, eligible, skipped };
}
function missesInWeek(data, anchor) {
  const m = data.items.filter(i => inWeek(i.date, anchor) && i.status === 'verpasst');
  return { total: m.length, training: m.filter(i => i.type === 'training').length, bewegung: m.filter(i => i.type === 'bewegung').length, sonst: m.filter(i => !['training', 'bewegung'].includes(i.type)).length };
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
/* Heute als Nächstes: abgelaufene Fristen (höchstens eine), dann heutige offene Einträge.
   Kommende zuerst, früher am Tag verpasste Zeiten danach („noch heute möglich“), optionale Erfassungen zuletzt.
   Vergangene Tage erscheinen hier nie. */
function nextActions(data, today, nowMin) {
  const due = data.items.filter(i => effStatus(i, today) === 'faellig').sort(byTime);
  const todayDeadline = data.items.filter(i => i.date === today && i.status === 'geplant' && classOfItem(i) === 'deadline');
  const pr = { hoch: 0, normal: 1, niedrig: 2 };
  const key = i => {
    const m = toMin(i.time); const opt = classOfItem(i) === 'optional_logging' ? 1 : 0;
    const earlier = m != null && m + (i.duration || 0) < nowMin ? 1 : 0;
    return [opt, earlier, m == null ? 9999 : m, pr[i.priority || 'normal'] ?? 1];
  };
  const open = data.items.filter(i => i.date === today && i.status === 'geplant' && classOfItem(i) !== 'deadline')
    .sort((a, b) => { const ka = key(a), kb = key(b); for (let k = 0; k < ka.length; k++) if (ka[k] !== kb[k]) return ka[k] - kb[k]; return 0; });
  return [...due.slice(0, 1), ...todayDeadline, ...open].slice(0, 3);
}
/* Regelbasierter Hinweis: Fokus nach Ziel mit Priorität 1, Tonalität nach Einstellung */
function coachHint(data, today, cfg) {
  const c = normalizeConfig(cfg);
  const top = c.goals[0];
  const focus = top ? `Fokus: ${GOALS[top]}, Priorität 1.` : 'Kein Ziel priorisiert.';
  const say = (base, mild, push) => (c.motivation === 'ruhig' ? base : c.motivation === 'anspornend' ? `${base} ${push}` : `${base} ${mild}`);
  const goal = buildPlan(c).tdays.length;
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
    const missed = data.items.filter(i => i.type === 'training' && i.status === 'verpasst' && inWeek(i.date, today) && !i.replacedBy).sort(byTime).pop();
    if (missed && today < days[6]) return { text: say(`${t} von ${goal} Trainingseinheiten erledigt. ${missed.title} am ${WD[wdIdx(missed.date)]} hat nicht stattgefunden.`, 'Diese Woche ist noch ein Ersatz möglich, wenn es passt.', 'Ein Ersatz in dieser Woche bringt dich ans Ziel.'), reason, action: { label: 'Ersatztermin wählen', sheet: { kind: 'item', id: missed.id } } };
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
    const reason = `Regel: Bewegungspausen an Arbeitstagen, verpasste Pausen werden nicht nachgeholt. ${focus}`;
    if (!p.eligible) return { text: 'Für diese Woche sind keine Bewegungspausen geplant.', reason, action: { label: 'Bewegungspausen einrichten', go: ['einstellungen'] } };
    return { text: say(`${p.done} von ${p.eligible} Bewegungspausen diese Woche erledigt.`, left ? `Heute steht noch ${left === 1 ? 'eine' : left} an.` : 'Jede kurze Runde zählt.', left ? 'Die nächste ist heute dran.' : 'Weiter so.'), reason };
  }
  if (domain === 'ernaehrung') {
    const n = dayNutrition(data, today);
    const reason = `Regel: Hauptmahlzeiten im Ernährungstagebuch, Erfassung ist optional. ${focus}`;
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
/* In-App-Hinweise: nur Fristen und Termine. Tagesgebundene Aufgaben erzeugen nie Hinweise.
   Fristen erscheinen höchstens einmal pro Kalenderwoche (Ausblenden gilt für die Woche). */
function hints(data, today, cfg) {
  const mode = normalizeConfig(cfg).reminders.intensity;
  const lim = mode === 'sanft' ? { dl: 0, ap: 1, open: false, max: 1 } : mode === 'deutlich' ? { dl: 7, ap: 7, open: true, openDays: 9999, max: 99 } : { dl: 2, ap: 3, open: true, openDays: 45, max: 3 };
  const wk = `${parse(weekStart(today)).getFullYear()}-${isoWeek(today)}`;
  const out = [];
  data.items.filter(i => classOfItem(i) === 'deadline' && i.status === 'geplant' && daysBetween(today, i.date) <= lim.dl).sort(byTime).forEach(i => {
    const late = i.date < today;
    out.push({ key: `dl-${i.id}-${wk}`, icon: 'flag', text: late ? `Frist für „${i.title}“ ist seit ${dayLabelLc(i.date, today)} abgelaufen. Die Aufgabe bleibt offen, bis du sie erledigst oder verwirfst.` : `„${i.title}“ ist ${i.date === today ? 'heute' : `bis ${dayLabelLc(i.date, today)}`} fällig.`, action: { label: 'Öffnen', sheet: { kind: 'item', id: i.id } } });
  });
  data.appointments.forEach(a => {
    const dd = daysBetween(today, a.date);
    if (a.status === 'vereinbart' && dd >= 0 && dd <= lim.ap)
      out.unshift({ key: `ap-${a.id}-${a.date}`, icon: 'calendar', text: `${a.title} ${dd === 0 ? 'heute' : dd === 1 ? 'morgen' : `in ${dd} Tagen`}${a.time ? ` um ${a.time} Uhr` : ''}.`, action: { label: 'Ansehen', go: ['gesundheit', 'termine'] } });
    if (lim.open && a.status === 'offen' && a.date && dd <= lim.openDays)
      out.push({ key: `of-${a.id}-${wk}`, icon: 'steth', text: `${a.title} ist noch nicht vereinbart.`, action: { label: 'Ansehen', go: ['gesundheit', 'termine'] } });
  });
  const list = out.filter(h => !data.dismissed.includes(h.key));
  return { list: list.slice(0, lim.max), hidden: Math.max(0, list.length - lim.max), mode };
}

/* ---------------- Health Intelligence (regelbasiert, nur Demo-Daten) ---------------- */
/* Kuratierte Quellen. Alle am 18.10.2026 per Websuche als existent geprüft. Inhalte werden nur verlinkt. */
const EVIDENCE = {
  aha2026: { title: '2026 Dietary Guidance to Improve Cardiovascular Health', publisher: 'American Heart Association, Circulation', date: '31.03.2026', url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001435', note: 'Wissenschaftliches Statement. Betont Ernährungsmuster statt einzelner Lebensmittel oder Nährstoffe.' },
  esc2025: { title: '2025 Focused Update of the 2019 ESC/EAS Guidelines for the management of dyslipidaemias', publisher: 'ESC und EAS, European Heart Journal', date: '29.08.2025', url: 'https://doi.org/10.1093/eurheartj/ehaf190', note: 'Leitlinie. Rät von Nahrungsergänzungsmitteln ohne belegte Sicherheit und LDL-senkende Wirksamkeit ab.' },
  who2020: { title: 'WHO guidelines on physical activity and sedentary behaviour (Zusammenfassung)', publisher: 'WHO, British Journal of Sports Medicine', date: '2020', url: 'https://doi.org/10.1136/bjsports-2020-102955', note: 'Sitzzeit begrenzen und durch Bewegung jeder Intensität ersetzen. Laut WHO starke Empfehlung bei mittlerer Evidenzsicherheit.' },
  dge2021: { title: 'FAQ Ballaststoffe', publisher: 'Deutsche Gesellschaft für Ernährung (DGE)', date: '2021', url: 'https://www.dge.de/fileadmin/dok/gesunde-ernaehrung/faq/DGE-FAQ-Ballaststoffe-2021.pdf', note: 'Richtwert für Erwachsene: mindestens 30 g Ballaststoffe pro Tag.' },
  odszinc: { title: 'Zinc, Fact Sheet for Health Professionals', publisher: 'NIH Office of Dietary Supplements', date: 'Aktualisierungsdatum nicht geprüft', url: 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/', note: 'Lebensmittelquellen für Zink und Einordnung von Serumwerten.' },
  odscopper: { title: 'Copper, Fact Sheet for Health Professionals', publisher: 'NIH Office of Dietary Supplements', date: 'Aktualisierungsdatum nicht geprüft', url: 'https://ods.od.nih.gov/factsheets/Copper-HealthProfessional/', note: 'Zusammenhang zwischen hohen Zinkgaben und Kupferversorgung.' },
};
const EVIDENCE_LEVELS = { gut: ['Gut belegt', 'Durch Leitlinien oder große Übersichtsarbeiten gestützt.'], begrenzt: ['Begrenzt belegt', 'Hinweise vorhanden, aber nicht eindeutig.'], unklar: ['Unklar', 'Keine belastbare direkte Empfehlung.'] };
const REC_STATUS = { vorgeschlagen: 'Vorgeschlagen', angenommen: 'Angenommen', abgelehnt: 'Abgelehnt', abgeschlossen: 'Abgeschlossen' };
const LAB_MARKERS = {
  ldl: { label: 'LDL-Cholesterin', match: n => /^ldl/i.test(String(n).trim()), units: ['mg/dl', 'mmol/l'], dir: 'high' },
  zink: { label: 'Zink', match: n => /^zink/i.test(String(n).trim()), units: ['µg/dl', 'ug/dl', 'µmol/l', 'umol/l'], dir: 'low' },
};
const normUnit = u => String(u || '').trim().toLowerCase().replace('μ', 'µ');
const markerOf = analyte => Object.keys(LAB_MARKERS).find(k => LAB_MARKERS[k].match(analyte)) || null;
/* Ein Laborwert löst nur dann eine Empfehlung aus, wenn Einheit, Referenz, Bestätigung und Aktualität eindeutig sind */
function labAssessment(labs, markerId, today) {
  const M = LAB_MARKERS[markerId];
  const list = labs.filter(l => M.match(l.analyte)).sort((a, b) => a.date.localeCompare(b.date));
  if (!list.length) return { state: 'fehlt', reason: 'Kein Messwert vorhanden.' };
  const l = list[list.length - 1];
  if (!M.units.includes(normUnit(l.unit))) return { state: 'unklar', reason: `Die Einheit „${l.unit}“ ist für diese Auswertung nicht eindeutig.`, latest: l };
  if (!l.confirmed) return { state: 'unklar', reason: 'Der Wert ist nicht als mit dem Originalbefund abgeglichen markiert.', latest: l };
  const bound = M.dir === 'high' ? l.refMax : l.refMin;
  if (bound == null) return { state: 'unklar', reason: 'Für diese Auswertung fehlt die passende Laborreferenz.', latest: l };
  if (daysBetween(l.date, today) > 548) return { state: 'unklar', reason: 'Der letzte Wert ist älter als 18 Monate.', latest: l };
  const out = x => (M.dir === 'high' ? x.value > x.refMax : x.value < x.refMin);
  const near = list.filter(x => x !== l && normUnit(x.unit) === normUnit(l.unit) && daysBetween(x.date, l.date) <= 90 && (M.dir === 'high' ? x.refMax : x.refMin) != null);
  if (near.some(x => out(x) !== out(l))) return { state: 'unklar', reason: 'Messungen der letzten 90 Tage widersprechen sich.', latest: l };
  return { state: out(l) ? 'auffaellig' : 'unauffaellig', latest: l };
}
const TAKE_ROUTINES = {
  'ballaststoff-mahlzeit': () => ({ title: 'Mahlzeit mit Haferflocken oder Hülsenfrüchten', type: 'ernaehrung', goal: 'ernaehrung', taskClass: 'same_day', priority: 'normal', days: [1, 4], time: '07:30', duration: 10, note: 'Zum Beispiel Haferflocken mit Beeren oder ein Gericht mit Linsen, Bohnen oder Kichererbsen.' }),
  'gehen-mittag': c => ({ title: 'Gehen nach dem Mittagessen', type: 'bewegung', goal: 'bewegung', taskClass: 'same_day', priority: 'normal', days: [...c.work.days], time: hm(r15((toMin(c.work.lunch) ?? 750) + (Number(c.work.lunchDur) || 30))), duration: 10, note: c.training.places.includes('walkingpad') ? 'Draußen oder auf dem Walking-Pad. Verpasst wird nicht nachgeholt.' : 'Draußen oder durchs Gebäude. Verpasst wird nicht nachgeholt.' }),
  'pause-nachmittag': c => ({ title: 'Kurz aufstehen am Nachmittag', type: 'bewegung', goal: 'bewegung', taskClass: 'same_day', priority: 'niedrig', days: [...c.work.days], time: hm(r15(((toMin(c.work.lunch) ?? 750) + (Number(c.work.lunchDur) || 30) + (toMin(c.work.end) ?? 1050)) / 2 + 30)), duration: 5, note: 'Aufstehen, ein paar Schritte, kurz dehnen.' }),
};
const REC_DEFS = [
  (c, lab) => lab.ldl.state !== 'auffaellig' ? null : {
    id: 'ldl-muster', goal_id: 'werte', lab_marker_id: 'ldl', base: 90,
    trigger: `LDL-Cholesterin ${fmtVal(lab.ldl.latest.value)} ${lab.ldl.latest.unit} am ${fmtDM(lab.ldl.latest.date)}${String(parse(lab.ldl.latest.date).getFullYear()).slice(2)}, über der Laborreferenz (bis ${fmtVal(lab.ldl.latest.refMax)}). Fiktiver, als bestätigt markierter Demo-Wert.`,
    title: 'Lösliche Ballaststoffe und pflanzliche Öle in den Alltag holen',
    why: 'Leitlinien setzen bei erhöhtem LDL-Cholesterin auf ein insgesamt herzgesundes Ernährungsmuster: mehr Ballaststoffe, etwa aus Haferflocken und Hülsenfrüchten, ungesättigte statt gesättigter Fette sowie viel Gemüse und Vollkorn. Einzelne Lebensmittel senken den Wert nicht garantiert.',
    action: 'An zwei Tagen pro Woche eine Mahlzeit mit Haferflocken oder Hülsenfrüchten. Beim Kochen öfter Raps- oder Olivenöl statt Butter.',
    frequency: '2 Mahlzeiten pro Woche', evidence_strength: 'gut', sources: ['aha2026', 'esc2025'],
    safety_notes: 'Ersetzt keinen ärztlich empfohlenen Maßnahmenplan. Verordnete Medikamente nicht eigenständig ändern oder absetzen. Die ESC/EAS-Leitlinie rät von Nahrungsergänzungsmitteln ohne belegte Sicherheit und Wirksamkeit zur LDL-Senkung ab.',
    contraindications: 'Befund und Gesamtrisiko ärztlich einordnen lassen. Bei Allergien oder Unverträglichkeiten passende Alternativen wählen.',
    reviewDays: 56, take: { kind: 'routine', key: 'ballaststoff-mahlzeit', label: 'Als Routine übernehmen' },
  },
  (c, lab) => lab.zink.state !== 'auffaellig' ? null : {
    id: 'zink-lebensmittel', goal_id: 'werte', lab_marker_id: 'zink', base: 85,
    trigger: `Zink ${fmtVal(lab.zink.latest.value)} ${lab.zink.latest.unit} am ${fmtDM(lab.zink.latest.date)}${String(parse(lab.zink.latest.date).getFullYear()).slice(2)}, unter der Laborreferenz (ab ${fmtVal(lab.zink.latest.refMin)}). Fiktiver, als bestätigt markierter Demo-Wert.`,
    title: 'Zinkhaltige Lebensmittel kennen und den Befund ärztlich einordnen',
    why: 'Ein einzelner niedriger Wert ist nicht automatisch ein Mangel. Ob eine Maßnahme nötig ist, klärt eine Ärztin oder ein Arzt mit dem Befund und deinem Kontext.',
    action: 'Frage für den nächsten Arzttermin notieren. Im Alltag liefern zum Beispiel Fleisch, Meeresfrüchte, Hülsenfrüchte, Nüsse, Samen wie Kürbiskerne und Milchprodukte Zink, Obst und Gemüse dagegen wenig.',
    frequency: 'Einmalig, Aufgabe mit Frist in 14 Tagen', evidence_strength: 'gut', sources: ['odszinc', 'odscopper'],
    safety_notes: 'Keine Empfehlung für Zinkpräparate und keine Dosierung. Höhere Zinkgaben können die Kupferaufnahme beeinträchtigen. Präparate nur nach ärztlicher oder pharmazeutischer Rücksprache.',
    contraindications: 'Bei Medikamenteneinnahme mögliche Wechselwirkungen ärztlich oder in der Apotheke klären.',
    reviewDays: 30, take: { kind: 'task', title: 'Laborbefund ärztlich besprechen', days: 14, label: 'Als Aufgabe übernehmen' },
  },
  (c, lab) => !c.goals.some(g => ['ernaehrung', 'abnehmen', 'werte'].includes(g)) ? null : {
    id: 'ballaststoffe', goal_id: c.goals.find(g => ['ernaehrung', 'abnehmen', 'werte'].includes(g)), lab_marker_id: null, base: 60, suppressedBy: 'ldl-muster',
    trigger: `Dein Ziel „${GOALS[c.goals.find(g => ['ernaehrung', 'abnehmen', 'werte'].includes(g))]}“.`,
    title: 'Zweimal pro Woche Haferflocken oder Hülsenfrüchte',
    why: 'Ballaststoffreiche Lebensmittel wie Vollkorn, Haferflocken und Hülsenfrüchte sind ein Kernbaustein gesunder Ernährungsmuster. Die DGE nennt für Erwachsene einen Richtwert von mindestens 30 g Ballaststoffen pro Tag.',
    action: 'An zwei Tagen ein Frühstück mit Haferflocken oder ein Gericht mit Linsen, Bohnen oder Kichererbsen einplanen.',
    frequency: '2 Mahlzeiten pro Woche', evidence_strength: 'gut', sources: ['dge2021', 'aha2026'],
    safety_notes: 'Ballaststoffe schrittweise steigern und ausreichend trinken.',
    contraindications: 'Bei Darmerkrankungen oder ärztlich verordneter ballaststoffarmer Kost vorher Rücksprache halten.',
    reviewDays: 28, take: { kind: 'routine', key: 'ballaststoff-mahlzeit', label: 'Als Routine übernehmen' },
  },
  (c, lab) => {
    if (!c.goals.some(g => ['bewegung', 'fitter', 'abnehmen', 'werte'].includes(g)) || c.work.days.length < 3) return null;
    const pd = Number(c.breaks.perDay) || 0;
    const take = pd === 0 ? { kind: 'routine', key: 'gehen-mittag', label: 'Als Routine übernehmen' } : pd === 1 ? { kind: 'routine', key: 'pause-nachmittag', label: 'Als Routine übernehmen' } : { kind: 'habit', key: 'abendrunde', label: 'Als Gewohnheit übernehmen' };
    const title = pd === 0 ? '10 Minuten gehen nach dem Mittagessen' : pd === 1 ? 'Am Nachmittag kurz aufstehen' : 'Kurze Runde nach dem Abendessen';
    return {
      id: 'sitzen-unterbrechen', goal_id: c.goals.find(g => ['bewegung', 'fitter', 'abnehmen', 'werte'].includes(g)), lab_marker_id: null, base: 70,
      trigger: `${c.work.days.length} Arbeitstage pro Woche, ${pd === 0 ? 'keine' : pd === 1 ? 'eine' : 'zwei'} Bewegungspause${pd === 1 ? '' : 'n'} geplant.`,
      title,
      why: 'Die WHO empfiehlt Erwachsenen, Sitzzeiten zu begrenzen und durch Bewegung jeder Intensität zu ersetzen. Auch leichte Bewegung zählt. Der konkrete Zeitpunkt ist ein praktischer Vorschlag für deinen Arbeitsalltag, kein eigener Studienbefund.',
      action: pd === 0 ? 'An Arbeitstagen nach dem Mittagessen 10 Minuten gehen.' : pd === 1 ? 'An Arbeitstagen am Nachmittag 5 Minuten aufstehen und gehen.' : 'Nach dem Abendessen eine kurze Runde gehen, als Gewohnheit zum Abhaken.',
      frequency: pd === 2 ? 'Täglich, als Gewohnheit' : 'An Arbeitstagen', evidence_strength: 'gut', sources: ['who2020'],
      safety_notes: 'Bei Beschwerden oder ärztlich verordneter Schonung anpassen. Verpasste Termine werden nicht nachgeholt.',
      contraindications: 'Bei akuten Beschwerden aussetzen.',
      reviewDays: 28, take,
    };
  },
  (c, lab) => !c.goals.some(g => ['ernaehrung', 'werte'].includes(g)) ? null : {
    id: 'pflanzen-vielfalt', goal_id: c.goals.find(g => ['ernaehrung', 'werte'].includes(g)), lab_marker_id: null, base: 50,
    trigger: `Dein Ziel „${GOALS[c.goals.find(g => ['ernaehrung', 'werte'].includes(g))]}“.`,
    title: 'Beeren, Gemüse und Nüsse öfter in den Einkauf',
    why: 'Herzgesunde Ernährungsmuster setzen auf Vielfalt aus Gemüse, Obst, Vollkorn, Hülsenfrüchten und Nüssen. Heidelbeeren oder andere Beeren sind ein Baustein davon, aber kein nachgewiesenes Mittel gegen einen bestimmten Blutwert.',
    action: 'Als Gewohnheit: an jedem Tag zwei Sorten Obst oder Gemüse.',
    frequency: 'Täglich, als Gewohnheit', evidence_strength: 'gut', sources: ['aha2026', 'dge2021'],
    safety_notes: 'Keine Nahrungsergänzungsmittel nötig, es geht um das Ernährungsmuster.',
    contraindications: 'Bei Nussallergie Nüsse weglassen.',
    reviewDays: 28, take: { kind: 'habit', key: 'vielfalt', label: 'Als Gewohnheit übernehmen' },
  },
];
const LAB_REC_IDS = ['ldl-muster', 'zink-lebensmittel'];
/* Laborbezogene Entscheidungen bleiben nur in der Sitzung, damit nichts Medizinisches im Speicher landet */
const persistableRecState = rs => Object.fromEntries(Object.entries(rs || {}).filter(([k]) => !LAB_REC_IDS.includes(k)));
function computeRecs(data, cfg, today) {
  const c = normalizeConfig(cfg);
  const lab = {}; Object.keys(LAB_MARKERS).forEach(k => { lab[k] = labAssessment(data.labs, k, today); });
  const rs = data.recState || {};
  let all = REC_DEFS.map(f => f(c, lab)).filter(Boolean).map(r => {
    const s = rs[r.id] || {};
    const gi = c.goals.indexOf(r.goal_id);
    return { ...r, status: s.status || 'vorgeschlagen', firstShown: s.firstShown || null, remindAfter: s.remindAfter || null, primaryOn: s.primaryOn || null, decidedAt: s.decidedAt || null, reviewDate: s.reviewDate || null, score: r.base + (gi < 0 ? 0 : (6 - gi) * 5) + (r.lab_marker_id ? 30 : 0) };
  });
  all = all.filter(r => !(r.suppressedBy && all.some(x => x.id === r.suppressedBy && x.status !== 'abgelehnt')));
  return all.sort((a, b) => b.score - a.score);
}
/* Höchstens zwei neue Vorschläge pro Woche, höchstens ein Primärvorschlag pro Tag */
function recView(data, cfg, today) {
  const all = computeRecs(data, cfg, today);
  const ws = weekStart(today);
  const introduced = all.filter(r => r.firstShown && r.firstShown >= ws).length;
  const slots = Math.max(0, 2 - introduced);
  const open = all.filter(r => r.status === 'vorgeschlagen');
  const visible = [...open.filter(r => r.firstShown), ...open.filter(r => !r.firstShown).slice(0, slots)];
  const ready = visible.filter(r => !(r.remindAfter && r.remindAfter > today));
  const shownToday = all.find(r => r.primaryOn === today);
  const primary = shownToday ? (shownToday.status === 'vorgeschlagen' && !(shownToday.remindAfter && shownToday.remindAfter > today) ? shownToday : null) : (ready[0] || null);
  return { all, visible, ready, primary, primaryDone: !!shownToday && !primary, waiting: open.length - visible.length };
}
function recSourceList(r) { return r.sources.map(k => EVIDENCE[k]).filter(Boolean); }

const A = {
  setItem(d, id, patch) { return { ...d, items: d.items.map(i => (i.id === id ? { ...i, ...patch } : i)) }; },
  toggleItem(d, id, today) {
    const it = d.items.find(i => i.id === id); if (!it || !['geplant', 'erledigt'].includes(it.status)) return d;
    const done = it.status !== 'erledigt';
    let workouts = d.workouts;
    if (it.type === 'training') workouts = done
      ? [...workouts, { id: uid('w'), date: it.date, kind: it.kind || 'Krafttraining', duration: it.duration, intensity: null, counts: true, itemId: it.id, source: 'plan' }]
      : workouts.filter(w => w.itemId !== it.id);
    const next = { ...A.setItem(d, id, { status: done ? 'erledigt' : 'geplant' }), workouts };
    return today ? { ...next, items: settle(next.items, today) } : next;
  },
  lateLog(d, id) {
    const it = d.items.find(i => i.id === id); if (!it) return d;
    const workouts = it.type === 'training' ? [...d.workouts, { id: uid('w'), date: it.date, kind: it.kind || 'Krafttraining', duration: it.duration, intensity: null, counts: true, itemId: it.id, source: 'nacherfasst' }] : d.workouts;
    return { ...A.setItem(d, id, { status: 'erledigt', lateLogged: true }), workouts };
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
  /* Ersatz für eine verpasste, wöchentlich flexible Einheit innerhalb derselben Woche. Das Original bleibt „verpasst“. */
  replaceInWeek(d, id, date) {
    const it = d.items.find(i => i.id === id); if (!it || it.replacedBy) return d;
    const { pauseId, ...rest } = it;
    const nid = uid('ers');
    const copy = { ...rest, id: nid, date, status: 'geplant', replaces: it.id, note: `Ersatz für ${WD[wdIdx(it.date)]}, ${fmtDM(it.date)}.` };
    const next = A.setItem(d, id, { replacedBy: nid });
    return { ...next, items: [...next.items, copy] };
  },
  setDeadline(d, id, date) { return A.setItem(d, id, { date }); },
  deleteItem(d, id) { return { ...d, items: d.items.filter(i => i.id !== id), workouts: d.workouts.filter(w => w.itemId !== id) }; },
  addItem(d, item) { return { ...d, items: [...d.items, { id: uid('it'), status: 'geplant', note: '', priority: 'normal', ...item, taskClass: item.taskClass || (item.type === 'training' ? 'weekly_flexible' : 'same_day') }] }; },
  logWorkout(d, w, linkItemId) {
    let next = { ...d, workouts: [...d.workouts, { id: uid('w'), source: 'manuell', ...w, itemId: linkItemId || undefined }] };
    if (linkItemId) { const it = d.items.find(i => i.id === linkItemId); next = A.setItem(next, linkItemId, { status: 'erledigt', lateLogged: it && it.status === 'verpasst' ? true : undefined }); }
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
  addPause(d, p, today) { const pauses = [...(d.pauses || []), { id: uid('p'), ...p }]; return { ...d, pauses, items: applyPauses(d.items, allPauses({ ...d, pauses }), today) }; },
  removePause(d, id, today) { const pauses = (d.pauses || []).filter(p => p.id !== id); return { ...d, pauses, items: applyPauses(d.items, allPauses({ ...d, pauses }), today) }; },
  /* Routinen */
  saveRoutine(d, rtId, draft, validFrom, today) {
    const spec = { title: draft.title.trim(), kind: draft.kind || null, days: [...draft.days].sort((a, b) => a - b), time: draft.time, duration: Number(draft.duration), note: (draft.note || '').trim(), interval: draft.interval === 2 ? 2 : 1 };
    const meta = { type: draft.type, goal: draft.goal || null, taskClass: draft.taskClass, priority: draft.priority };
    let routines;
    if (!rtId) {
      routines = [...d.routines, { id: `u-${uid('r')}`, source: 'eigene', customized: true, status: 'aktiv', ...meta, versions: [{ validFrom, ...spec }], exceptions: draft.exceptions || [], history: [{ at: validFrom, text: 'Routine angelegt' }] }];
    } else routines = d.routines.map(rt => {
      if (rt.id !== rtId) return rt;
      const cur = versionAt(rt, validFrom) || rt.versions[rt.versions.length - 1];
      let n = { ...rt, ...meta, customized: true, exceptions: draft.exceptions || rt.exceptions || [] };
      if (!cur || !sameSpec(cur, spec)) n = addVersion(n, validFrom, spec, `Ab ${fmtDM(validFrom)}: ${specText(spec)}`);
      else n = { ...n, history: [...(n.history || []), { at: today, text: 'Einstellungen der Routine geändert' }] };
      return n;
    });
    return materialize({ ...d, routines }, today);
  },
  routineStatus(d, rtId, status, today) {
    const text = { aktiv: 'Wieder aktiv', pausiert: 'Pausiert', archiviert: 'Archiviert' }[status];
    const routines = d.routines.map(rt => {
      if (rt.id !== rtId) return rt;
      const n = { ...rt, status, history: [...(rt.history || []), { at: today, text }] };
      if (status === 'pausiert') n.pausedSince = today; else delete n.pausedSince;
      if (status === 'archiviert') n.archivedFrom = today; else delete n.archivedFrom;
      return n;
    });
    return materialize({ ...d, routines }, today);
  },
  duplicateRoutine(d, rtId, today) {
    const rt = d.routines.find(r => r.id === rtId); if (!rt) return d;
    const v = versionAt(rt, today) || rt.versions[rt.versions.length - 1];
    const copy = { ...clone(rt), id: `u-${uid('r')}`, source: 'eigene', customized: true, status: 'pausiert', pausedSince: today, versions: [{ ...v, validFrom: today, title: `${v.title} (Kopie)` }], exceptions: [], history: [{ at: today, text: `Kopie von „${v.title}“, pausiert bis zur Aktivierung` }] };
    delete copy.archivedFrom;
    return materialize({ ...d, routines: [...d.routines, copy] }, today);
  },
  /* Einzeltermin oder Routine ab Datum oder dauerhafte Wochentagsausnahme */
  editInstance(d, itemId, scope, patch, today) {
    const it = d.items.find(i => i.id === itemId); if (!it) return d;
    if (scope === 'instance' || !it.routine) return materialize(A.setItem(d, itemId, { ...patch, override: true }), today);
    const rt = d.routines.find(r => r.id === it.routine); if (!rt) return d;
    let nrt;
    if (scope === 'from') nrt = addVersion({ ...rt, customized: true }, it.date, patch, `Ab ${fmtDM(it.date)}: ${patch.title ? `„${patch.title}“, ` : ''}${patch.time} Uhr, ${patch.duration} Min.`);
    else {
      const wd = wdIdx(it.date);
      nrt = { ...rt, customized: true, exceptions: [...(rt.exceptions || []).filter(e => !(e.weekday === wd && e.validFrom === it.date)), { id: uid('ex'), weekday: wd, validFrom: it.date, time: patch.time, duration: patch.duration }], history: [...(rt.history || []), { at: it.date, text: `Ausnahme ab ${fmtDM(it.date)}: jeden ${WD_LONG[wd]} ${patch.time} Uhr, ${patch.duration} Min.` }] };
    }
    return materialize({ ...d, routines: d.routines.map(r => (r.id === rt.id ? nrt : r)) }, today);
  },
  /* Empfehlungen: nur auf ausdrückliche Zustimmung, ohne Duplikate */
  recState(d, id, patch) { return { ...d, recState: { ...(d.recState || {}), [id]: { ...((d.recState || {})[id] || {}), ...patch } } }; },
  acceptRec(d, rec, cfg, today, from) {
    const vf = from && from > today ? from : today;
    const t = rec.take; let next = d; let target = null;
    if (t.kind === 'routine') {
      const id = `vorschlag-${t.key}`; target = id;
      const spec = TAKE_ROUTINES[t.key](normalizeConfig(cfg));
      const ex = d.routines.find(r => r.id === id);
      let routines = d.routines;
      if (!ex) routines = [...routines, { id, source: 'empfehlung', customized: true, status: 'aktiv', type: spec.type, goal: spec.goal, taskClass: spec.taskClass, priority: spec.priority, versions: [{ validFrom: vf, title: spec.title, kind: null, days: spec.days, time: spec.time, duration: spec.duration, note: spec.note, interval: 1 }], exceptions: [], history: [{ at: vf, text: 'Aus einer Empfehlung übernommen' }] }];
      else if (ex.status !== 'aktiv') routines = routines.map(r => (r.id === id ? { ...r, status: 'aktiv', pausedSince: undefined, archivedFrom: undefined, history: [...(r.history || []), { at: today, text: 'Durch eine Empfehlung wieder aktiv' }] } : r));
      next = materialize({ ...d, routines }, today);
    } else if (t.kind === 'habit') {
      const ex = d.habits.find(h => h.lib === t.key);
      target = ex ? ex.id : `h-${t.key}`;
      next = { ...d, habits: ex ? d.habits.map(h => (h.lib === t.key ? { ...h, active: true, pinned: true } : h)) : [...d.habits, { id: `h-${t.key}`, lib: t.key, name: HABIT_LIBRARY[t.key].name, active: true, pinned: true }] };
    } else if (t.kind === 'task') {
      const open = d.items.find(i => i.fromRec === rec.id && i.status === 'geplant');
      if (open) target = open.id;
      else { target = uid('task'); next = { ...d, items: [...d.items, { id: target, routine: null, title: t.title, type: 'sonstiges', taskClass: 'deadline', priority: 'hoch', date: addDays(today, t.days), time: '', duration: null, status: 'geplant', note: 'Aus einer Empfehlung. Nur in dieser Sitzung gespeichert.', fromRec: rec.id, sessionOnly: !!rec.lab_marker_id }] }; }
    }
    return A.recState(next, rec.id, { status: 'angenommen', decidedAt: today, reviewDate: addDays(today, rec.reviewDays || 28), target, takeKind: t.kind });
  },
};
const WD_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

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
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  move: <><path d="M4 12h14" /><path d="M13 7l5 5-5 5" /></>,
  repeat: <><path d="M17 3l3 3-3 3" /><path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H20" /><path d="M7 21l-3-3 3-3" /><path d="M20 13v1.5A3.5 3.5 0 0 1 16.5 18H4" /></>,
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" />,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  archive: <><rect x="3" y="4" width="18" height="5" rx="1.5" /><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4" /></>,
  book: <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19" />,
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
    const opener = document.activeElement;
    if (ref.current) ref.current.focus();
    return () => {
      window.removeEventListener('keydown', onKey); document.body.style.overflow = prev;
      /* Fokus nach dem Schließen zurück zum auslösenden Element */
      setTimeout(() => { if (opener && document.contains(opener) && typeof opener.focus === 'function') opener.focus(); }, 0);
    };
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
function StatusTag({ it, today, always }) {
  const st = effStatus(it, today);
  const [l, ic, cls] = STATUS_INFO[st] || STATUS_INFO.geplant;
  if (st === 'geplant' && !always) {
    if (it.movedFrom) return <span className="tag"><Icon name="move" size={12} />Nachgeholt von {dayLabel(it.movedFrom, today)}</span>;
    if (it.replaces) return <span className="tag"><Icon name="move" size={12} />Ersatztermin</span>;
    return null;
  }
  if (st === 'erledigt' && !always) return it.lateLogged ? <span className="tag tag-ok"><Icon name="check" size={12} />nacherfasst</span> : null;
  const text = st === 'verschoben' ? `Verschoben auf ${dayLabel(it.movedTo, today)}` : st === 'faellig' ? `Frist seit ${dayLabel(it.date, today)}` : l;
  return <span className={`tag ${cls ? `tag-${cls}` : ''}`}><Icon name={ic} size={12} />{text}</span>;
}
function ItemRow({ it, ctx, showDay, next }) {
  const { today, commit, openSheet, nowMin } = ctx;
  const st = effStatus(it, today);
  const t = TYPES[it.type] || TYPES.sonstiges;
  const cls = classOfItem(it);
  const checkable = ['geplant', 'erledigt', 'faellig'].includes(st);
  const earlier = next && st === 'geplant' && it.date === today && it.time && toMin(it.time) + (it.duration || 0) < nowMin;
  return <li className={`row st-${st}`}>
    <button className="check" disabled={!checkable} aria-pressed={st === 'erledigt'}
      aria-label={st === 'erledigt' ? `${it.title}: wieder öffnen` : checkable ? `${it.title} als erledigt markieren` : `${it.title}: ${STATUS_INFO[st][0]}`}
      onClick={() => commit(d => (st === 'faellig' ? A.setStatus(d, it.id, 'erledigt') : A.toggleItem(d, it.id, today)), st === 'erledigt' ? `Wieder offen: ${it.title}` : `Erledigt: ${it.title}`)}>
      {st === 'erledigt' ? <Icon name="check" size={16} /> : st === 'verpasst' ? <Icon name="x" size={14} /> : ['ausgelassen', 'verschoben', 'pausiert', 'nicht_erfasst'].includes(st) ? <Icon name="minus" size={16} /> : null}
    </button>
    <button className="row-main" onClick={() => openSheet({ kind: 'item', id: it.id })} aria-label={`${it.title}, ${STATUS_INFO[st][0]}, Optionen öffnen`}>
      <span className="row-title">{it.title}</span>
      <span className="row-meta">
        {showDay && it.date !== today && <span>{cls === 'deadline' ? `Frist ${dayLabel(it.date, today)}` : dayLabel(it.date, today)}</span>}
        {it.time && <span>{it.time} Uhr</span>}
        {it.duration ? <span>{it.duration} Min.</span> : null}
        {earlier && <span className="tag tag-muted">noch heute möglich</span>}
        {cls === 'optional_logging' && st === 'geplant' && <span>optional</span>}
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
function BarChart({ data, goal, height = 160, label, fmt = v => fmtNum(v), table, goalLabel = 'Ziel', extraCol, coverageCol }) {
  const W = 340, H = height, pl = 40, pr = 8, pt = 12, pb = 24;
  const max = Math.max(goal || 0, ...data.map(d => d.value || 0)) * 1.15 || 1;
  const bw = (W - pl - pr) / data.length;
  const y = v => pt + (1 - v / max) * (H - pt - pb);
  const every = Math.ceil(data.length / 8);
  return <><svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={label}>
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
    {goal ? <g><line x1={pl} x2={W - pr} y1={y(goal)} y2={y(goal)} className="c-goal" /><text x={W - pr} y={y(goal) - 5} textAnchor="end" className="c-axis c-goal-t">{goalLabel} {fmt(goal)}</text></g> : null}
  </svg>
  {table && <details className="fold small"><summary>Werte als Tabelle</summary><div className="table-scroll"><table className="tbl"><thead><tr><th scope="col">Zeitraum</th><th scope="col">{table}</th>{extraCol && <th scope="col">{extraCol[0]}</th>}{coverageCol && <th scope="col">Datengrundlage</th>}</tr></thead><tbody>{data.map(d => <tr key={d.key}><td>{d.label}</td><td>{d.value == null ? (d.coverage ? 'Datenlücke' : 'nicht erfasst') : fmtNum(d.value)}{d.faint && !coverageCol ? ' (unvollständig)' : ''}</td>{extraCol && <td>{extraCol[1](d)}</td>}{coverageCol && <td>{COVERAGE_LABEL[d.coverage] || ''}</td>}</tr>)}</tbody></table></div></details>}
  </>;
}

/* ---------------- Heute ---------------- */
function DayArc({ items, nowMin, done, total, onPick }) {
  const W = 320, H = 186, cx = 160, cy = 160, r = 130;
  const pos = m => { const t = Math.min(1, Math.max(0, (m - 360) / 960)); const a = Math.PI * (1 - t); return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
  const [nx, ny] = pos(nowMin);
  const timed = items.filter(i => i.time);
  return <div className="arc-wrap">
    <svg viewBox={`0 0 ${W} ${H}`} className="arc" role="img" aria-label={`Tagesbogen von 6 bis 22 Uhr: ${done} von ${total} Einträgen erledigt`}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} className="arc-track" />
      {nowMin > 360 && <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${nx.toFixed(1)} ${ny.toFixed(1)}`} className="arc-elapsed" />}
      {[720, 1080].map(m => { const [tx, ty] = pos(m); const [ix, iy] = [cx + (tx - cx) * 0.9, cy + (ty - cy) * 0.9]; return <text key={m} x={ix} y={iy + 4} textAnchor="middle" className="arc-axis">{m / 60}</text>; })}
      <g className="sun" aria-hidden="true"><circle cx={nx} cy={ny} r={15} className="sun-halo" /><circle cx={nx} cy={ny} r={7.5} className="sun-core" /></g>
      {timed.map(it => {
        const [x, y] = pos(toMin(it.time));
        return <g key={it.id} className={`arc-dot st-${it.status}`} role="button" tabIndex={0} aria-label={`${it.title} um ${it.time} Uhr, ${STATUS_INFO[it.status] ? STATUS_INFO[it.status][0] : ''}`}
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
function CoachLine({ ctx }) {
  const { data, today, commit, go, cfg, openSheet } = ctx;
  const c = coachHint(data, today, cfg);
  const act = () => {
    if (c.action.go) return go(...c.action.go);
    if (c.action.sheet) return openSheet(c.action.sheet);
    commit(d => A.addItem(d, { title: 'Home-Workout', type: 'training', kind: 'Home-Workout', date: c.action.date, time: '18:30', duration: 30, routine: null, taskClass: 'weekly_flexible', priority: 'hoch' }), 'Home-Workout eingeplant');
  };
  return <div className="coach" aria-label="Hinweis zur Woche">
    <div className="coach-icon"><Icon name="spark" size={18} /></div>
    <div>
      <p className="coach-text">{c.text}</p>
      <p className="coach-why">{c.reason}</p>
      {c.action && <button className="btn small" onClick={act}>{c.action.label}</button>}
    </div>
  </div>;
}
function Today({ ctx, onSetup }) {
  const { data, today, nowMin, go, openSheet, commit, cfg, markRecs } = ctx;
  const goal = goalAt(data, weekStart(today));
  const todays = data.items.filter(i => i.date === today).sort(byTime);
  const active = todays.filter(i => i.status !== 'verschoben' && i.status !== 'pausiert');
  const pausedToday = todays.some(i => i.status === 'pausiert');
  const counted = active.filter(i => i.status !== 'ausgelassen' && classOfItem(i) !== 'optional_logging');
  const done = counted.filter(i => i.status === 'erledigt').length;
  const next = nextActions(data, today, nowMin);
  const h = Math.floor(nowMin / 60);
  const greet = h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
  const tw = trainingsInWeek(data, today);
  const ps = pauseStats(data, today);
  const stepsToday = data.steps.find(s => s.date === today);
  const wt = weightTrend(data, today);
  const appts = data.appointments.filter(a => a.status === 'vereinbart' && a.date >= today && a.date <= addDays(today, 21)).sort(byTime).slice(0, 3);
  const hr = hints(data, today, cfg);
  const hs = hr.list;
  const rv = recView(data, cfg, today);
  useEffect(() => { if (rv.primary && rv.primary.primaryOn !== today) markRecs([rv.primary.id], true); }, [rv.primary && rv.primary.id, today]);
  const [arcOpen, setArcOpen] = useState(true);
  return <div className="screen">
    <header className="hero">
      <p className="greet">{greet}</p>
      <h1 className="h-date">{fmtLong(today)}</h1>
    </header>
    {cfg.skipped && <div className="setup-banner"><p>Du nutzt noch den Demo-Plan. In etwa zwei Minuten entsteht dein persönlicher Wochenplan.</p><button className="btn small primary" onClick={onSetup}>Plan einrichten</button></div>}
    {pausedToday && <p className="callout pause-note"><Icon name="pause" size={16} /> Heute ist pausiert. Pausierte Einträge zählen nicht in deine Ziele.</p>}

    <section className="block tight" aria-labelledby="next-h">
      <div className="h2-row"><h2 className="h2" id="next-h">Als Nächstes</h2><span className="muted small">{counted.length ? `${done} von ${counted.length} heute erledigt` : ''}</span></div>
      {next.length
        ? <ul className="list">{next.map(it => <ItemRow key={it.id} it={it} ctx={ctx} showDay next />)}</ul>
        : <Empty text={todays.length ? 'Für heute ist nichts mehr offen. Verpasstes von gestern wird nicht nachgeholt.' : 'Für heute ist nichts geplant.'} action={<button className="btn small" onClick={() => go('woche')}>Woche ansehen</button>} />}
    </section>

    <ReviewCard ctx={ctx} />

    {rv.primary && <section className="block" aria-labelledby="rec-h">
      <div className="h2-row"><h2 className="h2" id="rec-h">Empfehlung für dich</h2><button className="link" onClick={() => go('gesundheit', 'fuerdich')}>Alle Empfehlungen</button></div>
      <RecCard rec={rv.primary} ctx={ctx} compact />
    </section>}

    <section className="block" aria-labelledby="prog-h">
      <div className="h2-row"><h2 className="h2" id="prog-h">Fortschritt</h2>
        <button className="link" aria-expanded={arcOpen} onClick={() => setArcOpen(!arcOpen)}>{arcOpen ? 'Tagesbogen ausblenden' : 'Tagesbogen zeigen'}</button></div>
      {arcOpen && <DayArc items={active} nowMin={nowMin} done={done} total={counted.length} onPick={id => openSheet({ kind: 'item', id })} />}
      <div className="stats">
        <Stat icon="dumbbell" label="Training" value={goal ? `${tw} von ${goal}` : `${tw}`} sub={goal ? 'Einheiten diese Woche' : 'kein Trainingsziel'} onClick={() => go('woche')} />
        <Stat icon="activity" label="Bewegungspausen" value={ps.eligible ? `${ps.done} von ${ps.eligible}` : 'keine geplant'} missing={!ps.eligible} sub="werktags, diese Woche" onClick={() => go('woche')} />
        <Stat icon="steps" label="Schritte heute" value={stepsToday ? fmtNum(stepsToday.count) : 'nicht erfasst'} missing={!stepsToday} sub={stepsToday ? 'manuell eingetragen' : 'optional, tippen zum Eintragen'} onClick={() => go('erfassen', 'schritte')} />
        <Stat icon="scale" label="Gewicht" value={wt ? `${signed(wt.delta)} kg` : 'zu wenige Werte'} missing={!wt} sub={wt ? 'Ø 7 Tage ggü. Vorwoche' : 'je Woche 1 Wert nötig'} onClick={() => go('entwicklung')} />
      </div>
      <CoachLine ctx={ctx} />
    </section>

    <section className="block">
      <h2 className="h2">Schnell erfassen</h2>
      <div className="quick">
        {[['gewicht', 'Gewicht', 'scale'], ['schritte', 'Schritte', 'steps'], ['training', 'Training', 'dumbbell'], ['mahlzeit', 'Mahlzeit', 'utensils']].map(([k, l, ic]) =>
          <button key={k} className="quick-btn" onClick={() => go('erfassen', k)}><Icon name={ic} size={20} /><span>{l}</span></button>)}
      </div>
    </section>

    <section className="block">
      <details className="fold">
        <summary><span>Ganzer Tag</span><span className="muted">{todays.length} Einträge</span></summary>
        {todays.length ? <ul className="list">{todays.map(it => <ItemRow key={it.id} it={it} ctx={ctx} />)}</ul> : <Empty text="Heute ist nichts geplant." />}
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
          <button className="icon-btn sm" aria-label="Hinweis für diese Woche ausblenden" onClick={() => commit(d => ({ ...d, dismissed: [...d.dismissed, hh.key].slice(-200) }), 'Hinweis ausgeblendet')}><Icon name="x" size={16} /></button>
        </div>
      </li>)}</ul> : <Empty text="Keine offenen Fristen oder nahen Termine." />}
      {hr.hidden > 0 && <p className="hint">{hr.hidden} weitere {hr.hidden === 1 ? 'Hinweis ist' : 'Hinweise sind'} wegen deiner Einstellung „{INTENSITIES[hr.mode][0]}“ ausgeblendet.</p>}
      <p className="footnote"><Icon name="bell" size={14} /> Hinweise erscheinen nur hier in der App und nur für Fristen und Termine. Verpasste Tagesaufgaben erzeugen keine Hinweise. Push-Benachrichtigungen gibt es noch nicht.</p>
    </section>
  </div>;
}

/* ---------------- Woche ---------------- */
function HabitGrid({ ctx, days }) {
  const { data, today, commit } = ctx;
  const [name, setName] = useState(''); const [err, setErr] = useState('');
  const habits = data.habits.filter(h => days.some(d => habitOn(h, d)));
  const pausedHabits = data.habits.filter(h => h.active !== false && h.inactiveFrom && h.inactiveFrom <= addDays(today, 7));
  const add = () => {
    const n = name.trim();
    if (!n) return setErr('Bitte einen Namen eingeben.');
    if (n.length > 60) return setErr('Bitte höchstens 60 Zeichen.');
    if (habits.some(h => h.name.toLowerCase() === n.toLowerCase())) return setErr('Diese Gewohnheit gibt es schon.');
    setErr('');
    commit(d => ({ ...d, habits: [...d.habits, { id: uid('h'), name: n, active: true, custom: true }] }), `Gewohnheit angelegt: ${n}`); setName('');
  };
  return <div className="panel">
    {habits.length ? <div className="table-scroll"><table className="habits">
      <thead><tr><th scope="col"><span className="sr">Gewohnheit</span></th>{days.map(d => <th key={d} scope="col" className={d === today ? 'is-today' : ''}>{WD[wdIdx(d)]}</th>)}</tr></thead>
      <tbody>{habits.map(h => <tr key={h.id}><th scope="row">{h.name}</th>{days.map(d => {
        const v = data.habitLog[`${h.id}|${d}`]; const paused = pausedAll(data, d) || !habitOn(h, d);
        return <td key={d}><button className={`hcell ${v || ''} ${paused ? 'paused' : ''}`} disabled={d > today || paused}
          aria-label={`${h.name}, ${WD_LONG[wdIdx(d)]}: ${paused ? 'pausiert' : v === 'done' ? 'erledigt' : v === 'skip' ? 'bewusst ausgelassen' : 'offen'}`}
          onClick={() => commit(dd => A.cycleHabit(dd, h.id, d), null)}>{v === 'done' ? <Icon name="check" size={14} /> : v === 'skip' ? <Icon name="minus" size={14} /> : null}</button></td>;
      })}</tr>)}</tbody>
    </table></div> : <p className="hint">Keine aktiven Gewohnheiten. Lege unten eine an oder wähle Vorschläge in den Einstellungen.</p>}
    <p className="hint">Tippen wechselt zwischen erledigt, bewusst ausgelassen und offen. Zukünftige und pausierte Tage sind gesperrt.</p>
    {pausedHabits.length > 0 && <ul className="plain">{pausedHabits.map(h => <li key={h.id}>„{h.name}“ pausiert {h.inactiveFrom > today ? `ab ${fmtDM(h.inactiveFrom)}` : `seit ${fmtDM(h.inactiveFrom)}`}. <button className="link inline" onClick={() => commit(d => ({ ...d, habits: d.habits.map(x => (x.id === h.id ? { ...x, inactiveFrom: undefined } : x)) }), `„${h.name}“ wieder aktiv`)}>Wieder aktivieren</button></li>)}</ul>}
    <div className="inline-add">
      <input className="input" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(); }} placeholder="Neue Gewohnheit, z. B. Abends dehnen" aria-label="Neue Gewohnheit" />
      <button className="btn" onClick={add}>Anlegen</button>
    </div>
    {err && <p className="err" role="alert">{err}</p>}
  </div>;
}
function StatusLegend() {
  return <details className="fold small legend-fold"><summary>Was bedeuten die Status?</summary>
    <ul className="legend-list">{Object.entries(STATUS_INFO).map(([k, [l, ic, cls]]) => <li key={k}><span className={`tag ${cls ? `tag-${cls}` : ''}`}><Icon name={ic} size={12} />{l}</span><span>{{
      geplant: 'Steht noch an.', erledigt: 'Abgeschlossen, auch wenn nachträglich erfasst.', ausgelassen: 'Von dir bewusst nicht gemacht. Zählt nicht in die Quote.',
      verpasst: 'Tagesgebunden oder wöchentlich und nicht passiert. Wird nicht nachgeholt, zählt als nicht erledigt.', pausiert: 'Durch Urlaub, Auszeit oder pausierte Routine ausgesetzt.',
      verschoben: 'Auf einen anderen Tag gelegt, der neue Termin steht dort.', faellig: 'Aufgabe mit Frist, noch offen. Bleibt sichtbar, bis du sie erledigst oder verwirfst.',
      nicht_erfasst: 'Optionale Erfassung ohne Eintrag. Kein Wert 0 und keine Aufgabe.' }[k]}</span></li>)}</ul>
  </details>;
}
function Week({ ctx }) {
  const { data, today, openSheet, go, cfg, ensureHorizon } = ctx;
  const [off, setOff] = useState(0);
  const earliest = data.items.reduce((m, i) => (i.date < m ? i.date : m), today);
  const minOff = Math.max(-52, -Math.ceil(daysBetween(weekStart(earliest), weekStart(today)) / 7));
  const maxOff = 8;
  const anchor = addDays(today, off * 7);
  const days = weekDays(anchor);
  useEffect(() => { if (off > 1) ensureHorizon(days[6]); }, [off]);
  const [sel, setSel] = useState(today);
  const selDay = days.includes(sel) ? sel : days[0];
  const plan = useMemo(() => buildPlan(cfg), [cfg]);
  const tw = trainingsInWeek(data, anchor);
  const goal = goalAt(data, weekStart(anchor));
  const cov = weekCoverage(data, weekStart(anchor), today);
  const ps = pauseStats(data, anchor);
  const hs = habitStats(data, anchor, today);
  const ms = missesInWeek(data, anchor);
  const dayItems = data.items.filter(i => i.date === selDay).sort(byTime);
  const dayAppts = data.appointments.filter(a => a.date === selDay && a.status !== 'offen');
  const weekPauses = (data.pauses || []).filter(p => p.from <= days[6] && p.to >= days[0]);
  const isFree = wdIdx(selDay) === plan.freeDay;
  const go2 = n => { setOff(n); const d = addDays(today, n * 7); setSel(n === 0 ? today : weekDays(d)[0]); };
  return <div className="screen">
    <header className="page-head">
      <h1 className="h1">Woche</h1>
      <div className="week-nav">
        <button className="icon-btn" aria-label="Vorherige Woche" disabled={off <= minOff} onClick={() => go2(off - 1)}><Icon name="left" /></button>
        <div className="week-title"><b>KW {isoWeek(anchor)}</b><span>{fmtDM(days[0])} bis {fmtDM(days[6])}{off === 0 ? ', aktuell' : ''}</span></div>
        <button className="icon-btn" aria-label="Nächste Woche" disabled={off >= maxOff} onClick={() => go2(off + 1)}><Icon name="right" /></button>
      </div>
    </header>
    {off !== 0 && <button className="link" onClick={() => go2(0)}>Zur aktuellen Woche</button>}

    {weekPauses.map(p => <p key={p.id} className="callout pause-note"><Icon name="pause" size={16} /> {PAUSE_KINDS[p.kind]}: {fmtDM(p.from)} bis {fmtDM(p.to)}, {p.scope === 'alle' ? 'alle Routinen pausiert' : 'Training pausiert'}. Pausierte Einträge zählen nicht in die Ziele.</p>)}

    <div className="daystrip" role="tablist" aria-label="Tag wählen">
      {days.map(d => {
        const its = data.items.filter(i => i.date === d && i.status !== 'verschoben');
        const dn = its.filter(i => i.status === 'erledigt').length;
        const due = its.some(i => effStatus(i, today) === 'faellig');
        const free = wdIdx(d) === plan.freeDay;
        return <button key={d} role="tab" aria-selected={d === selDay} className={`day ${d === selDay ? 'on' : ''} ${d === today ? 'is-today' : ''} ${free ? 'is-free' : ''}`} onClick={() => setSel(d)}>
          <span className="day-wd">{WD[wdIdx(d)]}</span><span className="day-n">{parse(d).getDate()}</span>
          <span className="day-dots" aria-hidden="true">{its.slice(0, 4).map((i, k) => { const s = effStatus(i, today); return <i key={k} className={s === 'erledigt' ? 'd-done' : s === 'faellig' ? 'd-warn' : ['ausgelassen', 'pausiert', 'verpasst', 'nicht_erfasst'].includes(s) ? 'd-skip' : ''} />; })}</span>
          <span className="sr">{dn} von {its.length} erledigt{due ? ', eine Frist ist abgelaufen' : ''}{free ? ', freier Tag' : ''}</span>
        </button>;
      })}
    </div>

    <section className="block">
      <div className="h2-row"><h2 className="h2">{fmtLong(selDay)}</h2>{isFree && <span className="tag tag-sun">Freier Tag</span>}</div>
      {isFree && <p className="hint top0">Kein Training geplant. Nutze den Tag zur Erholung oder flexibel.</p>}
      {dayItems.length || dayAppts.length ? <ul className="list">
        {dayItems.map(it => <ItemRow key={it.id} it={it} ctx={ctx} />)}
        {dayAppts.map(a => <li key={a.id} className={`row ${a.status === 'erledigt' ? 'st-erledigt' : ''}`}>
          <span className="check static"><Icon name="steth" size={16} /></span>
          <button className="row-main" onClick={() => go('gesundheit', 'termine')}><span className="row-title">{a.title}</span><span className="row-meta">{a.time && <span>{a.time} Uhr</span>}<span>{APPT_STATUS[a.status]}</span></span></button>
          <span className="row-icon"><Icon name="calendar" size={18} /></span>
        </li>)}
      </ul> : <Empty text={selDay > addDays(weekStart(today), 13) && !dayItems.length ? 'Noch keine Einträge. Zukünftige Wochen werden beim Öffnen geplant.' : 'Für diesen Tag ist nichts geplant.'} />}
      {selDay >= today && <div className="btn-row two">
        <button className="btn block-btn" onClick={() => openSheet({ kind: 'addItem', date: selDay })}><Icon name="plus" size={18} /> Eintrag planen</button>
        <button className="btn block-btn" onClick={() => openSheet({ kind: 'pause', from: selDay })}><Icon name="pause" size={18} /> Pause eintragen</button>
      </div>}
      <button className="link" onClick={() => go('routinen')}><Icon name="repeat" size={16} />&nbsp;Routinen verwalten</button>
    </section>

    <section className="panel goals">
      <div className="goal"><div className="goal-head"><span>Training</span><b>{goal ? `${tw} von ${goal}` : `${tw}, kein Ziel`}</b></div><Progress value={tw} max={goal || 1} label="Trainingseinheiten" /></div>
      <div className="goal"><div className="goal-head"><span>Bewegungspausen</span><b>{ps.eligible ? `${ps.done} von ${ps.eligible}` : 'keine geplant'}</b></div><Progress value={ps.done} max={ps.eligible} label="Bewegungspausen" /></div>
      <div className="goal"><div className="goal-head"><span>Gewohnheiten</span><b>{hs.eligible ? `${Math.round((hs.done / hs.eligible) * 100)} %` : 'noch keine Tage'}</b></div><Progress value={hs.done} max={hs.eligible} label="Gewohnheiten" /></div>
      {cov === 'keine' && <p className="callout gap top0">Für diese Woche liegen keine Plan-Daten vor. Das ist eine Datenlücke, keine fehlende Leistung.</p>}
      {off < 0 && goal !== goalAt(data, weekStart(today)) && cov !== 'keine' && <p className="hint top0">Wochenziel damals: {goal}. Aktuelles Ziel: {goalAt(data, weekStart(today))}.</p>}
      {ms.total > 0 && <p className="hint top0">Nicht stattgefunden: {[ms.training && `${ms.training} Training`, ms.bewegung && `${ms.bewegung} Bewegung`, ms.sonst && `${ms.sonst} Sonstiges`].filter(Boolean).join(', ')}. Wird nicht nachgeholt.</p>}
      <p className="hint top0">Verpasst zählt als nicht erledigt. Bewusst ausgelassene und pausierte Einträge fallen aus dem Nenner.</p>
      <StatusLegend />
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
  const planned = data.items.filter(i => i.type === 'training' && i.date === date && ['geplant', 'verpasst'].includes(i.status) && !i.replacedBy).sort(byTime)[0];
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
      {planned && <label className="toggle"><input type="checkbox" checked={link} onChange={e => setLink(e.target.checked)} /><span>{planned.status === 'verpasst' ? 'Verpasste' : 'Geplante'} Einheit „{planned.title}“ am {planned.date === today ? 'heutigen Tag' : fmtDM(planned.date)} als erledigt {planned.status === 'verpasst' ? 'nacherfassen' : 'abhaken'}</span></label>}
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
  const { data, today, nowMin, commit, cfg } = ctx;
  const h = Math.floor(nowMin / 60);
  const showIdeas = normalizeConfig(cfg).goals.some(g => ['ernaehrung', 'werte', 'abnehmen'].includes(g));
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
      {showIdeas && <div className="ideas"><span className="field-label">Ideen passend zu deinen Zielen</span>
        <div className="chips">{IDEA_FOODS.map(fid => { const f = data.foods.find(x => x.id === fid); return f ? <button key={fid} className={`chip sm ${foodId === fid ? 'on' : ''}`} aria-pressed={foodId === fid} onClick={() => { setFoodId(fid); setQ(''); }}>{f.name}</button> : null; })}</div>
        <p className="hint top0">Beispiele für ballaststoffreiche und pflanzliche Lebensmittel. Keine Präparate, keine Kaufempfehlung.</p></div>}
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
function AcceptedMeasures({ ctx }) {
  const { data, today, cfg, commit } = ctx;
  const accepted = computeRecs(data, cfg, today).filter(r => r.status === 'angenommen');
  if (!accepted.length) return <Empty text="Noch keine Empfehlung angenommen. Vorschläge findest du unter Gesundheit, Für dich." />;
  const days = weekDays(today);
  return <ul className="list">{accepted.map(r => {
    const s = (data.recState || {})[r.id] || {};
    let prog = '';
    if (s.takeKind === 'routine') { const its = data.items.filter(i => i.routine === s.target && inWeek(i.date, today) && !['verschoben', 'pausiert', 'ausgelassen'].includes(i.status)); prog = `${its.filter(i => i.status === 'erledigt').length} von ${its.length} diese Woche`; }
    if (s.takeKind === 'habit') { const n = days.filter(d => d <= today && data.habitLog[`${s.target}|${d}`] === 'done').length; prog = `${n} Tage diese Woche abgehakt`; }
    if (s.takeKind === 'task') { const it = data.items.find(i => i.id === s.target); prog = it ? (it.status === 'erledigt' ? 'Aufgabe erledigt' : 'Aufgabe offen') : 'Aufgabe nicht mehr vorhanden'; }
    return <li key={r.id} className="row compact">
      <div className="row-main static"><span className="row-title">{r.title}</span><span className="row-meta"><span>{prog}</span>{s.reviewDate && <span>Überprüfen am {fmtDM(s.reviewDate)}</span>}</span></div>
      <button className="btn small ghost" onClick={() => commit(d => A.recState(d, r.id, { status: 'abgeschlossen', decidedAt: today }), 'Maßnahme abgeschlossen')}>Abschließen</button>
    </li>;
  })}</ul>;
}
function Development({ ctx }) {
  const { data, today, cfg } = ctx;
  const goal = goalAt(data, weekStart(today));
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
  const weeks = trainingSeries(data, weekStart(today), 8, today);
  const kcal = Array.from({ length: 7 }, (_, i) => { const d = addDays(today, -6 + i); const n = dayNutrition(data, d); return { key: d, label: WD[wdIdx(d)], value: n ? n.kcal : null, faint: n && !n.complete }; });
  const tw = trainingsInWeek(data, today), ps = pauseStats(data, today), hs = habitStats(data, today, today), ms = missesInWeek(data, today);
  const lastWeek = addDays(today, -7);
  const twPrev = trainingsInWeek(data, lastWeek), psPrev = pauseStats(data, lastWeek);
  const suggestions = [];
  if (!goal) suggestions.push('Kein Trainingsziel gesetzt. Wenn du magst, plane in den Einstellungen eine Einheit pro Woche ein.');
  else if (tw < goal) suggestions.push(`Die ${goal} Trainingstermine der nächsten Woche bewusst freihalten oder einen davon auf einen ruhigeren Tag legen.`);
  else suggestions.push(`Den Rhythmus mit ${goal} ${goal === 1 ? 'Einheit' : 'Einheiten'} beibehalten.`);
  if (ps.eligible && ps.done / ps.eligible < 0.6) suggestions.push('Die Bewegungspause auf ein Zeitfenster legen, das an den meisten Tagen frei ist. Das geht unter Routinen verwalten.');
  else suggestions.push('Bewegungspausen laufen gut. Optional eine zweite kurze Pause am Nachmittag testen.');
  return <div className="screen">
    <header className="page-head"><h1 className="h1">Entwicklung</h1></header>
    <ReviewHistory ctx={ctx} />

    <section className="block">
      <h2 className="h2">Kurzüberblick dieser Woche</h2>
      <div className="panel review">
        <h3 className="h3">Was geklappt hat</h3>
        <p>{goal ? `${tw} von ${goal}` : tw} Trainingseinheiten (Vorwoche: {twPrev}). {ps.done} von {ps.eligible} Bewegungspausen (Vorwoche: {psPrev.done} von {psPrev.eligible}). {hs.done} Gewohnheiten erledigt.</p>
        <h3 className="h3">Was nicht stattgefunden hat</h3>
        <p>{ms.total ? `${ms.total} ${ms.total === 1 ? 'Eintrag' : 'Einträge'} (${[ms.training && `${ms.training} Training`, ms.bewegung && `${ms.bewegung} Bewegung`, ms.sonst && `${ms.sonst} Sonstiges`].filter(Boolean).join(', ')}). Das wird nicht nachgeholt. Wenn sich etwas wiederholt, lohnt sich ein anderer Zeitpunkt.` : 'Nichts verpasst bisher.'} {ps.skipped ? `${ps.skipped} bewusst ausgelassen.` : ''}</p>
        <h3 className="h3">Angenommene Maßnahmen</h3>
        <AcceptedMeasures ctx={ctx} />
        <p className="hint">Zur Reflexion: Was hat geholfen, was war schwierig? HealthOS behauptet keinen Zusammenhang zwischen einzelnen Maßnahmen und einzelnen Messwerten.</p>
        <h3 className="h3">Vorschläge für nächste Woche</h3>
        <ul className="plain">{suggestions.map(s => <li key={s}>{s}</li>)}</ul>
        <p className="hint">Der Rückblick folgt festen Regeln aus deinen Einträgen. Er ist keine medizinische Bewertung.</p>
      </div>
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

    <h2 className="h2 block">Verläufe</h2>
    <Segmented label="Zeitraum" value={String(range)} onChange={v => setRange(Number(v))} options={[['7', '7 Tage'], ['30', '30 Tage'], ['90', '90 Tage'], ['365', '1 Jahr']]} />
    <section className="block tight">
      <div className="h2-row"><h3 className="h3 top0">Gewicht</h3><span className="muted small">{pts.length} Messungen</span></div>
      <div className="panel">
        {pts.length ? <>
          <p className="kpi">{delta != null ? <><b>{signed(delta)} kg</b><span>seit {fmtShort(pts[0].date)}, dem ersten Wert im Zeitraum</span></> : <span>Nur eine Messung im Zeitraum, noch keine Veränderung berechenbar.</span>}</p>
          <LineChart points={pts} from={from} to={today} trend={trend} label={`Gewichtsverlauf mit ${pts.length} Messungen`} maxGap={range <= 30 ? 6 : 10} />
          <p className="legend"><span className="lg-dot" /> Messung <span className="lg-dash" /> Ø der letzten 7 Tage <span className="lg-gap" /> Lücke bedeutet: keine Messung</p>
          <details className="fold small"><summary>Werte als Tabelle</summary>
            <div className="table-scroll"><table className="tbl"><thead><tr><th>Datum</th><th>Uhrzeit</th><th>kg</th></tr></thead><tbody>{[...ws].reverse().map(w => <tr key={w.id}><td>{fmtDM(w.date)}</td><td>{w.time || 'nicht erfasst'}</td><td>{fmtNum(w.kg, 1)}</td></tr>)}</tbody></table></div>
          </details>
        </> : <Empty text="In diesem Zeitraum gibt es keine Messung. Das ist kein Fehler, Gewicht ist optional." action={<button className="btn small" onClick={() => ctx.go('erfassen', 'gewicht')}>Ersten Wert erfassen</button>} />}
      </div>
    </section>
    <section className="block">
      <h3 className="h3 top0">Trainingseinheiten pro Woche</h3>
      <div className="panel"><BarChart data={weeks} goal={goal || null} goalLabel="Ziel aktuell" label="Trainingseinheiten der letzten acht Wochen" table="Einheiten" extraCol={['Ziel damals', d => (d.goal == null ? '–' : d.goal)]} coverageCol />
        <p className="legend"><span className="lg-bar" /> vollständig <span className="lg-bar faint" /> unvollständig <span className="lg-missing" /> Datenlücke</p>
        <CoverageNote text={gapText(weeks)} />
        <p className="hint">Gezählt werden abgeschlossene Einheiten, die für das Wochenziel zählen.</p></div>
    </section>
    <section className="block">
      <div className="h2-row"><h3 className="h3 top0">Schritte, letzte {stepDays} Tage</h3><span className="muted small">{stepVals.length} von {stepDays} Tagen erfasst</span></div>
      <div className="panel">
        {stepVals.length ? <p className="kpi"><b>{fmtNum(avg(stepVals))}</b><span>Ø an Tagen mit Eintrag</span></p> : null}
        <BarChart data={stepData} label="Schritte pro Tag" fmt={v => v >= 1000 ? `${fmtNum(v / 1000)}k` : fmtNum(v)} table="Schritte" />
        <p className="legend"><span className="lg-missing" /> nicht erfasst, wird nicht als 0 gezählt</p>
      </div>
    </section>
    <section className="block">
      <h3 className="h3 top0">Kalorien, letzte 7 Tage</h3>
      <div className="panel"><BarChart data={kcal} label="Kalorien pro Tag" table="kcal" />
        <p className="legend"><span className="lg-bar" /> vollständig <span className="lg-bar faint" /> unvollständig <span className="lg-missing" /> nicht erfasst</p></div>
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
const yy = d => String(parse(d).getFullYear()).slice(2);
function EvidenceBadge({ level }) {
  const e = EVIDENCE_LEVELS[level] || EVIDENCE_LEVELS.unklar;
  return <span className={`tag ev-${level}`} title={e[1]}><Icon name="book" size={12} />{e[0]}</span>;
}
function RecCard({ rec, ctx, compact }) {
  const { commit, today, cfg, openSheet } = ctx;
  const decided = rec.status !== 'vorgeschlagen';
  return <article className={`rec ${compact ? 'compact' : ''}`}>
    <div className="rec-top"><EvidenceBadge level={rec.evidence_strength} />{rec.lab_marker_id && <span className="tag tag-note">Demo-Laborwert</span>}{decided && <span className="tag tag-muted">{REC_STATUS[rec.status]}</span>}</div>
    <h3 className="rec-title">{rec.title}</h3>
    <p className="rec-trigger">Anlass: {rec.trigger}</p>
    {!compact && <p className="rec-why">{rec.why}</p>}
    <p className="rec-action"><b>Vorschlag:</b> {rec.action}</p>
    {rec.lab_marker_id && <p className="rec-safety"><Icon name="info" size={14} /> {rec.safety_notes}</p>}
    <div className="btn-row">
      {!decided && <button className="btn small primary" onClick={() => commit(d => A.acceptRec(d, rec, cfg, today), rec.take.kind === 'routine' ? 'Als Routine übernommen' : rec.take.kind === 'habit' ? 'Als Gewohnheit übernommen' : 'Aufgabe angelegt')}>{rec.take.label}</button>}
      <button className="btn small" onClick={() => openSheet({ kind: 'rec', id: rec.id })}>Begründung und Quellen</button>
      {!decided && <button className="btn small ghost" onClick={() => commit(d => A.recState(d, rec.id, { remindAfter: addDays(today, 3) }), 'Erinnerung in 3 Tagen')}>Später</button>}
      {!decided && <button className="btn small ghost" onClick={() => commit(d => A.recState(d, rec.id, { status: 'abgelehnt', decidedAt: today }), 'Empfehlung abgelehnt, sie erscheint nicht wieder')}>Ablehnen</button>}
    </div>
  </article>;
}
function RecSheet({ id, ctx, close }) {
  const { data, cfg, today, commit } = ctx;
  const rec = computeRecs(data, cfg, today).find(r => r.id === id);
  if (!rec) return <Sheet title="Empfehlung" close={close}><p>Diese Empfehlung trifft gerade nicht zu, zum Beispiel weil sich Ziele oder Werte geändert haben.</p></Sheet>;
  const decided = rec.status !== 'vorgeschlagen';
  return <Sheet title={rec.title} close={close}>
    <div className="rec-detail">
      <div className="rec-top"><EvidenceBadge level={rec.evidence_strength} /><span className="tag tag-muted">{REC_STATUS[rec.status]}</span></div>
      <dl>
        <dt>Anlass</dt><dd>{rec.trigger}</dd>
        <dt>Warum</dt><dd>{rec.why}</dd>
        <dt>Vorschlag</dt><dd>{rec.action}</dd>
        <dt>Häufigkeit</dt><dd>{rec.frequency}</dd>
        <dt>Sicherheit</dt><dd>{rec.safety_notes}</dd>
        <dt>Wann nicht oder nur nach Rücksprache</dt><dd>{rec.contraindications}</dd>
        <dt>Evidenz</dt><dd>{EVIDENCE_LEVELS[rec.evidence_strength][0]}: {EVIDENCE_LEVELS[rec.evidence_strength][1]} Die Einordnung stammt aus dem HealthOS-Regelwerk auf Basis der Quellen, sie ist keine offizielle Evidenzstufe der Quelle.</dd>
        <dt>Quellen</dt><dd><ul className="plain">{recSourceList(rec).map(s => <li key={s.url}><a className="ext" href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a><br /><small>{s.publisher}, {s.date}. {s.note}</small></li>)}</ul></dd>
        {rec.reviewDate && <><dt>Überprüfen am</dt><dd>{fmtDM(rec.reviewDate)}{yy(rec.reviewDate)}</dd></>}
      </dl>
      <p className="hint">Regelbasierter Vorschlag ohne KI-Auswertung und ohne Diagnose. {rec.lab_marker_id ? 'Laborbezogene Entscheidungen werden nicht gespeichert.' : ''}</p>
      {!decided ? <div className="btn-row">
        <button className="btn primary" onClick={() => { commit(d => A.acceptRec(d, rec, cfg, today), 'Übernommen'); close(); }}>{rec.take.label}</button>
        <button className="btn ghost" onClick={() => { commit(d => A.recState(d, rec.id, { status: 'abgelehnt', decidedAt: today }), 'Empfehlung abgelehnt'); close(); }}>Ablehnen</button>
      </div> : rec.status === 'abgelehnt' ? <button className="btn wide" onClick={() => { commit(d => A.recState(d, rec.id, { status: 'vorgeschlagen', remindAfter: null }), 'Wieder vorgeschlagen'); close(); }}>Doch wieder vorschlagen</button> : null}
    </div>
  </Sheet>;
}
function RecsList({ ctx }) {
  const { data, cfg, today, markRecs, openSheet } = ctx;
  const rv = recView(data, cfg, today);
  const missing = rv.visible.filter(r => !r.firstShown).map(r => r.id).join(',');
  useEffect(() => { if (missing) markRecs(missing.split(','), false); }, [missing]);
  const snoozed = rv.visible.filter(r => r.remindAfter && r.remindAfter > today);
  const decided = rv.all.filter(r => r.status !== 'vorgeschlagen');
  return <>
    <p className="demo-note"><Icon name="info" size={16} /> Regelbasierte Vorschläge aus deinen Zielen, deinem Arbeitsalltag und fiktiven Demo-Laborwerten. Keine Diagnose, keine KI, keine Präparate-Empfehlungen.</p>
    {rv.ready.length ? <div className="recs">{rv.ready.map(r => <RecCard key={r.id} rec={r} ctx={ctx} />)}</div>
      : <Empty text={rv.all.length ? 'Gerade gibt es keinen neuen Vorschlag.' : 'Für deine Ziele gibt es aktuell keine hinterlegte Empfehlung.'} />}
    {rv.waiting > 0 && <p className="hint">{rv.waiting} weitere {rv.waiting === 1 ? 'Empfehlung folgt' : 'Empfehlungen folgen'} in den nächsten Wochen. HealthOS zeigt höchstens zwei neue pro Woche.</p>}
    {snoozed.length > 0 && <><h3 className="h3">Später</h3><ul className="list">{snoozed.map(r => <li key={r.id} className="row compact"><button className="row-main" onClick={() => openSheet({ kind: 'rec', id: r.id })}><span className="row-title">{r.title}</span><span className="row-meta"><span>wieder ab {fmtDM(r.remindAfter)}</span></span></button></li>)}</ul></>}
    {decided.length > 0 && <details className="fold small"><summary>Entschieden ({decided.length})</summary>
      <ul className="list">{decided.map(r => <li key={r.id} className="row compact"><button className="row-main" onClick={() => openSheet({ kind: 'rec', id: r.id })}><span className="row-title">{r.title}</span><span className="row-meta"><span>{REC_STATUS[r.status]}</span>{r.decidedAt && <span>am {fmtDM(r.decidedAt)}</span>}</span></button></li>)}</ul>
    </details>}
    <details className="fold small"><summary>Alle Quellen</summary>
      <ul className="plain sources">{Object.values(EVIDENCE).map(s => <li key={s.url}><a className="ext" href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a><br /><small>{s.publisher}, {s.date}. {s.note}</small></li>)}</ul>
    </details>
  </>;
}
function LabInfluence({ g, ctx }) {
  const { data, cfg, today } = ctx;
  const m = markerOf(g.name);
  if (!m) return <p className="hint">Für diesen Wert ist in HealthOS keine Alltagsempfehlung hinterlegt. Dafür gibt es hier keine belastbare direkte Empfehlung, bitte ärztlich einordnen lassen.</p>;
  const a = labAssessment(data.labs, m, today);
  if (a.state === 'unklar') return <p className="callout">Keine Empfehlung: {a.reason}</p>;
  if (a.state === 'unauffaellig') return <p className="hint">Der letzte Wert liegt innerhalb der Laborreferenz. Keine spezifische Empfehlung.</p>;
  const recs = computeRecs(data, cfg, today).filter(r => r.lab_marker_id === m);
  return recs.length ? <div className="recs">{recs.map(r => <RecCard key={r.id} rec={r} ctx={ctx} />)}</div> : <p className="hint">Keine passende Empfehlung.</p>;
}
function LabCard({ g, open, toggle, ctx }) {
  const l = g.latest; const pos = refPos(l);
  const from = g.same[0].date, to = l.date;
  return <li className={`lab ${open ? 'open' : ''}`}>
    <button className="lab-head" aria-expanded={open} onClick={toggle}>
      <span className="lab-name">{g.name}</span>
      <span className="lab-val"><b>{fmtVal(l.value)}</b> {l.unit}</span>
      <span className="lab-meta">{fmtShort(l.date)} {yy(l.date)}{pos && <span className={`tag ${pos === 'innerhalb' ? '' : 'tag-note'}`}>{pos} Laborreferenz</span>}{l.confirmed ? <span className="tag tag-muted">bestätigt</span> : <span className="tag tag-warn">nicht bestätigt</span>}</span>
    </button>
    {open && <div className="lab-body">
      <p className="hint">Referenz laut Befund: {refText(l)}. {pos && pos !== 'innerhalb' ? 'Das ist eine reine Einordnung gegenüber dem Labor, keine Bewertung und kein Nachweis eines Mangels. Fragen dazu klärst du ärztlich.' : ''}</p>
      {g.same.length > 1
        ? <LineChart points={g.same.map(x => ({ id: x.id, date: x.date, value: x.value }))} from={from} to={to} band={{ min: l.refMin, max: l.refMax }} maxGap={9999} label={`Verlauf ${g.name}`} digits={l.value % 1 ? 1 : 0} />
        : <p className="hint">Für einen Verlauf sind mindestens zwei Messungen in derselben Einheit nötig.</p>}
      {g.other.length > 0 && <p className="callout">{g.other.length} {g.other.length === 1 ? 'Messung liegt' : 'Messungen liegen'} in {[...new Set(g.other.map(o => o.unit))].join(', ')} vor und {g.other.length === 1 ? 'wird' : 'werden'} nicht im Verlauf verglichen, weil keine geprüfte Umrechnung hinterlegt ist.</p>}
      <div className="table-scroll"><table className="tbl"><thead><tr><th>Datum</th><th>Wert</th><th>Referenz</th></tr></thead>
        <tbody>{[...g.all].reverse().map(x => <tr key={x.id}><td>{fmtDM(x.date)}{yy(x.date)}</td><td>{fmtVal(x.value)} {x.unit}</td><td>{refText(x)}</td></tr>)}</tbody></table></div>
      <p className="hint">Quelle: {l.lab}{l.source === 'demo' ? ', fiktiver Demo-Wert' : ', manuell eingetragen'}</p>
      <h3 className="h3">Was kann ich im Alltag beeinflussen?</h3>
      <LabInfluence g={g} ctx={ctx} />
    </div>}
  </li>;
}
function Labs({ ctx }) {
  const { data, openSheet } = ctx;
  const [open, setOpen] = useState(null);
  const groups = groupLabs(data.labs);
  return <>
    <p className="demo-note"><Icon name="info" size={16} /> Fiktive Beispielwerte, nicht gespeichert. Die App stellt keine Diagnosen und bewertet keine Werte medizinisch.</p>
    {groups.length ? <ul className="labs">{groups.map(g => <LabCard key={g.name} g={g} ctx={ctx} open={open === g.name} toggle={() => setOpen(open === g.name ? null : g.name)} />)}</ul> : <Empty text="Noch keine Laborwerte." />}
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
    <Segmented label="Bereich" value={seg} onChange={setSeg} options={[['fuerdich', 'Für dich'], ['werte', 'Blutwerte'], ['termine', 'Termine']]} />
    {seg === 'fuerdich' ? <RecsList ctx={ctx} /> : seg === 'werte' ? <Labs ctx={ctx} /> : <Appointments ctx={ctx} />}
  </div>;
}

/* ---------------- Sheets ---------------- */
function ChangePreview({ diff, conflicts, empty, all }) {
  if (!diff) return null;
  const list = all ? diff.changes : diff.changes.slice(0, 6);
  return <div className="preview">
    <p className="preview-sum">{diff.added + diff.changed + diff.removed ? `Betroffen ab heute: ${diff.added} neu, ${diff.changed} geändert, ${diff.removed} entfallen.` : (empty || 'Keine zukünftigen Termine betroffen.')}</p>
    {list.length > 0 && <ul className="preview-list">{list.map((c, i) => <li key={i}><span className={`tag ${c.kind === 'entfällt' ? 'tag-muted' : c.kind === 'neu' ? '' : 'tag-note'}`}>{c.kind}</span> {WD[wdIdx(c.it.date)]}, {fmtDM(c.it.date)}: {c.it.title}{c.it.time ? `, ${c.kind === 'geändert' && c.old.time !== c.it.time ? `${c.old.time} → ` : ''}${c.it.time} Uhr` : ''}</li>)}{diff.changes.length > list.length && <li className="muted">und {diff.changes.length - list.length} weitere</li>}</ul>}
    <p className="hint top0">Erledigte, ausgelassene, verpasste, verschobene und einzeln geänderte Termine bleiben unverändert.</p>
    {conflicts && conflicts.length > 0 && <div className="callout warn"><b>Überschneidungen, bitte prüfen:</b><ul className="plain">{conflicts.slice(0, 4).map(c => <li key={c}>{c}</li>)}</ul>HealthOS verschiebt nichts automatisch.</div>}
  </div>;
}
function ItemSheet({ id, ctx, close }) {
  const { data, today, commit, openSheet } = ctx;
  const it = data.items.find(i => i.id === id);
  const [dl, setDl] = useState(it ? it.date : today);
  if (!it) return <Sheet title="Eintrag" close={close}><p>Dieser Eintrag existiert nicht mehr.</p></Sheet>;
  const st = effStatus(it, today);
  const cls = classOfItem(it);
  const rt = it.routine ? data.routines.find(r => r.id === it.routine) : null;
  const pause = it.status === 'pausiert' ? allPauses(data).find(p => p.id === it.pauseId) : null;
  const run = (fn, msg) => { commit(fn, msg); close(); };
  const moveOpts = Array.from({ length: 8 }, (_, i) => addDays(today, i)).filter(d => d !== it.date);
  const weekEnd = weekDays(today)[6];
  const replOpts = cls === 'weekly_flexible' && st === 'verpasst' && inWeek(it.date, today) && !it.replacedBy
    ? Array.from({ length: daysBetween(today, weekEnd) + 1 }, (_, i) => addDays(today, i)).filter(d => !data.items.some(x => x.date === d && x.type === 'training' && ['geplant', 'erledigt'].includes(x.status))) : [];
  return <Sheet title={it.title} close={close}>
    <p className="sheet-sub">{dayLabel(it.date, today)}{it.time ? `, ${it.time} Uhr` : ''}{it.duration ? `, ${it.duration} Min.` : ''}</p>
    <div className="chips static"><StatusTag it={it} today={today} always /><span className="tag tag-muted">{TASK_CLASSES[cls][0]}</span>{it.override && <span className="tag tag-muted">einzeln geändert</span>}{it.lateLogged && <span className="tag tag-muted">nacherfasst</span>}</div>
    {it.note && <p className="hint">{it.note}</p>}

    {st === 'pausiert' && <p className="callout">Pausiert{pause && pause.scope !== 'routine' ? `: ${PAUSE_KINDS[pause.kind]}, ${fmtDM(pause.from)} bis ${fmtDM(pause.to)}` : ', weil die Routine pausiert ist'}. Die Pause kannst du in den Einstellungen oder unter Routinen aufheben.</p>}
    {st === 'verschoben' && <p className="callout">Auf {dayLabel(it.movedTo, today)} verschoben. Den neuen Termin findest du dort.</p>}
    {st === 'nicht_erfasst' && <p className="callout">Optionale Erfassung ohne Eintrag. Das ist kein Rückstand.</p>}
    {st === 'verpasst' && <>
      <p className="callout">Hat nicht stattgefunden. {cls === 'weekly_flexible' ? 'Für das Wochenziel kannst du einen Ersatz in derselben Woche wählen. Danach entsteht kein Rückstand.' : 'Tagesgebundene Aufgaben werden nicht nachgeholt.'}</p>
      {it.replacedBy && <p className="hint">Ersatztermin ist bereits geplant.</p>}
      {replOpts.length > 0 && <><h3 className="h3">Ersatz in dieser Woche</h3><div className="chips">{replOpts.map(d => <button key={d} className="chip" onClick={() => run(x => A.replaceInWeek(x, it.id, d), `Ersatz am ${dayLabel(d, today)} geplant`)}>{dayLabel(d, today)}</button>)}</div></>}
      {cls === 'weekly_flexible' && inWeek(it.date, today) && !it.replacedBy && !replOpts.length && <p className="hint">In dieser Woche ist kein freier Tag mehr ohne Training.</p>}
      <button className="btn ghost wide" onClick={() => run(x => A.lateLog(x, it.id), 'Als erledigt nacherfasst')}>Doch erledigt, nacherfassen</button>
    </>}
    {st === 'faellig' && <>
      <button className="btn primary wide" onClick={() => run(x => A.setStatus(x, it.id, 'erledigt'), `Erledigt: ${it.title}`)}>Als erledigt markieren</button>
      <div className="inline-add"><input className="input" type="date" min={today} value={dl} onChange={e => setDl(e.target.value)} aria-label="Neue Frist" /><button className="btn" disabled={!dl || dl < today} onClick={() => run(x => A.setDeadline(x, it.id, dl), `Neue Frist: ${dayLabel(dl, today)}`)}>Neue Frist</button></div>
      <button className="btn ghost wide" onClick={() => run(x => A.setStatus(x, it.id, 'ausgelassen'), 'Verworfen')}>Nicht mehr nötig, verwerfen</button>
    </>}
    {(st === 'geplant' || st === 'erledigt') && <>
      <button className="btn primary wide" onClick={() => run(x => A.toggleItem(x, it.id, today), st === 'erledigt' ? `Wieder offen: ${it.title}` : `Erledigt: ${it.title}`)}>{st === 'erledigt' ? 'Wieder öffnen' : 'Als erledigt markieren'}</button>
      {st === 'geplant' && <>
        <button className="btn wide" onClick={() => openSheet({ kind: 'edit', id: it.id })}><Icon name="edit" size={18} /> Uhrzeit oder Dauer ändern</button>
        <h3 className="h3">Verschieben auf</h3>
        <div className="chips">{moveOpts.map(d => <button key={d} className="chip" onClick={() => run(x => A.moveItem(x, it.id, d), `Verschoben auf ${dayLabel(d, today)}`)}>{dayLabel(d, today)}</button>)}</div>
        {it.routine && <p className="hint">Gilt nur für diesen Termin. Die Routine bleibt unverändert.</p>}
        <button className="btn ghost wide" onClick={() => run(x => A.setStatus(x, it.id, 'ausgelassen'), 'Bewusst ausgelassen')}>Bewusst auslassen</button>
      </>}
    </>}
    {st === 'ausgelassen' && it.date >= today && <button className="btn wide" onClick={() => run(x => A.setStatus(x, it.id, 'geplant'), 'Wieder eingeplant')}>Wieder einplanen</button>}
    {!it.routine && !['erledigt'].includes(st) && <button className="btn danger wide" onClick={() => run(x => A.deleteItem(x, it.id), 'Eintrag gelöscht')}>Eintrag löschen</button>}
    {it.routine === 'review' && <button className="btn wide" onClick={() => { close(); ctx.startReview(reviewForDate(it.date, ctx.cfg)); }}><Icon name="spark" size={18} /> Check-in öffnen</button>}
    {rt && <button className="link" onClick={() => openSheet({ kind: 'routine', id: rt.id })}><Icon name="repeat" size={16} />&nbsp;Routine „{(versionAt(rt, today) || rt.versions[0]).title}“ bearbeiten</button>}
  </Sheet>;
}
function EditInstanceSheet({ id, ctx, close }) {
  const { data, today, commit } = ctx;
  const it = data.items.find(i => i.id === id);
  const [time, setTime] = useState(it ? it.time : '');
  const [dur, setDur] = useState(it ? String(it.duration || '') : '');
  const [title, setTitle] = useState(it ? it.title : '');
  const [scope, setScope] = useState('instance');
  const n = parseNum(dur);
  const err = !it ? 'x' : !time ? 'Bitte eine Uhrzeit angeben.' : !(Number.isInteger(n) && n > 0 && n <= 600) ? 'Bitte eine Dauer zwischen 1 und 600 Minuten eingeben.' : (scope !== 'weekday' && !title.trim()) ? 'Bitte einen Titel eingeben.' : '';
  const patch = scope === 'weekday' ? { time, duration: n } : { time, duration: n, title: title.trim() };
  const next = useMemo(() => (err ? null : A.editInstance(data, it.id, scope, patch, today)), [time, dur, title, scope, data, err]);
  if (!it) return <Sheet title="Termin ändern" close={close}><p>Dieser Eintrag existiert nicht mehr.</p></Sheet>;
  const diff = next ? planDiff(data.items, next.items, today) : null;
  if (diff && scope === 'instance') { const after = next.items.find(x => x.id === it.id); if (after && (after.time !== it.time || after.duration !== it.duration || after.title !== it.title)) diff.changes = [{ kind: 'geändert', it: after, old: it }, ...diff.changes]; diff.changed = diff.changes.filter(c => c.kind === 'geändert').length; }
  const dates = diff ? diff.changes.map(c => c.it.date) : [];
  const conflicts = next ? findConflicts(next.items, dates) : [];
  const wd = WD_LONG[wdIdx(it.date)];
  return <Sheet title="Termin ändern" close={close}>
    <div className="form">
      <p className="sheet-sub">{it.title}, {dayLabel(it.date, today)}</p>
      {scope !== 'weekday' && <Field label="Titel"><input className="input" value={title} onChange={e => setTitle(e.target.value)} /></Field>}
      <div className="grid2">
        <Field label="Uhrzeit"><input className="input" type="time" value={time} onChange={e => setTime(e.target.value)} /></Field>
        <Field label="Dauer in Minuten"><input className="input" inputMode="numeric" value={dur} onChange={e => setDur(e.target.value)} /></Field>
      </div>
      {it.routine && <fieldset className="scope"><legend className="field-label">Was soll sich ändern?</legend>
        {[['instance', 'Nur diesen Termin', `Nur ${dayLabelLc(it.date, today)}. Die Routine bleibt, wie sie ist.`],
          ['from', `Ganze Routine ab ${fmtDM(it.date)}`, 'Alle Wochentage dieser Routine ab diesem Datum. Frühere Termine bleiben unverändert.'],
          ['weekday', `Jeden ${wd} ab ${fmtDM(it.date)}`, `Dauerhafte Ausnahme nur für ${wd}e. Andere Tage bleiben wie bisher.`]].map(([k, l, h]) =>
          <label key={k} className={`radio ${scope === k ? 'on' : ''}`}><input type="radio" name="scope" checked={scope === k} onChange={() => setScope(k)} /><span><b>{l}</b><small>{h}</small></span></label>)}
      </fieldset>}
      {err ? <p className="err" role="alert">{err}</p> : <ChangePreview diff={diff} conflicts={conflicts} />}
      <button className="btn primary wide" disabled={!!err} onClick={() => { commit(() => next, scope === 'instance' ? 'Termin geändert' : scope === 'from' ? 'Routine ab Datum geändert' : `Ausnahme für ${wd} gespeichert`); close(); }}>Änderung übernehmen</button>
    </div>
  </Sheet>;
}
function AddItemSheet({ date, ctx, close }) {
  const { today, commit } = ctx;
  const [title, setTitle] = useState(''); const [type, setType] = useState('training'); const [cls, setCls] = useState('weekly_flexible');
  const [d, setD] = useState(date); const [time, setTime] = useState('18:00'); const [dur, setDur] = useState('30'); const [err, setErr] = useState('');
  const pickType = t => { setType(t); setCls(t === 'training' ? 'weekly_flexible' : 'same_day'); };
  const save = () => {
    const n = parseNum(dur);
    if (!title.trim()) return setErr('Bitte einen Titel eingeben.');
    if (!d || d < today) return setErr('Bitte ein Datum ab heute wählen.');
    if (cls !== 'deadline' && !time) return setErr('Bitte eine Uhrzeit angeben.');
    if (cls !== 'deadline' && !(Number.isInteger(n) && n > 0 && n <= 600)) return setErr('Bitte eine Dauer zwischen 1 und 600 Minuten eingeben.');
    commit(x => A.addItem(x, { title: title.trim(), type, kind: type === 'training' ? 'Sonstiges' : null, date: d, time: cls === 'deadline' ? '' : time, duration: cls === 'deadline' ? null : n, routine: null, taskClass: cls }), `Geplant: ${title.trim()}, ${dayLabel(d, today)}`);
    close();
  };
  return <Sheet title="Eintrag planen" close={close}>
    <div className="form">
      <Field label="Titel"><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="z. B. Laufen am Neckar" /></Field>
      <Field label="Art"><Chips options={[['training', 'Training'], ['bewegung', 'Bewegung'], ['sonstiges', 'Aufgabe']]} value={type} onChange={pickType} /></Field>
      <Field label="Verhalten, wenn es nicht klappt"><Chips options={Object.entries(TASK_CLASSES).filter(([k]) => k !== 'optional_logging').map(([k, v]) => [k, v[0]])} value={cls} onChange={setCls} small /></Field>
      <p className="hint top0">{TASK_CLASSES[cls][1]}</p>
      <div className="grid2">
        <Field label={cls === 'deadline' ? 'Erledigen bis' : 'Datum'}><input className="input" type="date" min={today} value={d} onChange={e => setD(e.target.value)} /></Field>
        {cls !== 'deadline' && <Field label="Uhrzeit"><input className="input" type="time" value={time} onChange={e => setTime(e.target.value)} /></Field>}
      </div>
      {cls !== 'deadline' && <Field label="Dauer in Minuten"><input className="input" inputMode="numeric" value={dur} onChange={e => setDur(e.target.value)} /></Field>}
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary wide" onClick={save}>Eintrag planen</button>
      <p className="hint">Für etwas Wiederkehrendes lege besser eine Routine an.</p>
    </div>
  </Sheet>;
}
function PauseSheet({ ctx, close, from: from0 }) {
  const { today, commit } = ctx;
  const [kind, setKind] = useState('urlaub');
  const [from, setFrom] = useState(from0 || today);
  const [to, setTo] = useState(addDays(from0 || today, 6));
  const [scope, setScope] = useState('alle');
  const [err, setErr] = useState('');
  const save = () => {
    if (!from || !to) return setErr('Bitte Beginn und Ende angeben.');
    if (to < from) return setErr('Das Ende darf nicht vor dem Beginn liegen.');
    if (to < today) return setErr('Die Pause muss mindestens bis heute reichen. Vergangene Einträge werden nicht verändert.');
    if (daysBetween(from, to) > 365) return setErr('Bitte höchstens ein Jahr am Stück.');
    commit(d => A.addPause(d, { kind, from, to, scope }, today), `Pausiert bis ${fmtDM(to)}`);
    close();
  };
  return <Sheet title="Pause eintragen" close={close}>
    <div className="form">
      <Field label="Art der Pause"><Chips options={Object.entries(PAUSE_KINDS)} value={kind} onChange={setKind} /></Field>
      <p className="hint top0">Gründe wie Krankheit werden bewusst nicht erfasst. „Auszeit ohne Grund“ passt für alles, was du nicht benennen möchtest.</p>
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
function InfoSheet({ close, onSettings }) {
  return <Sheet title="Über diese Demo" close={close}>
    <div className="form">
      <h3 className="h3">Was funktioniert</h3>
      <p className="hint">Einrichtung, automatischer Wochenplan, Routinen mit Versionen und Ausnahmen, Abhaken, Verschieben, Ersatz in derselben Woche, Pausen, Erfassen von Gewicht, Schritten, Training und Mahlzeiten, Laborwerte, Termine und regelbasierte Empfehlungen mit Quellen.</p>
      <h3 className="h3">Was gespeichert wird</h3>
      <p className="hint">Nur Einstellungen, Routinen, Wochenplan, Gewohnheiten und Pausen ohne Grund, privat für dein Konto. Messwerte, Laborwerte, Termine, Gewicht und laborbezogene Empfehlungen bleiben Demo-Daten dieser Sitzung.</p>
      <h3 className="h3">Was bewusst fehlt</h3>
      <p className="hint">Keine Push-Benachrichtigungen, kein Datei-Upload, keine Verbindung zu Health Connect, keine KI-Auswertung. Diese Datei ist noch keine installierbare App (PWA).</p>
      <button className="btn wide" onClick={() => { close(); onSettings(); }}>Zu den Einstellungen</button>
    </div>
  </Sheet>;
}

function LabSheet({ ctx, close }) {
  const { data, today, commit } = ctx;
  const names = [...new Set(data.labs.map(l => l.analyte))];
  const [f, setF] = useState({ analyte: '', value: '', unit: '', refMin: '', refMax: '', date: today, lab: '', confirmed: false });
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
    commit(d => ({ ...d, labs: [...d.labs, { id: uid('lab'), analyte: f.analyte.trim(), value: v, unit: f.unit.trim(), refMin: mn, refMax: mx, date: f.date, lab: f.lab.trim() || 'nicht angegeben', source: 'manuell', confirmed: !!f.confirmed }] }), `${f.analyte.trim()} gespeichert`);
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
      <Toggle checked={f.confirmed} onChange={v => set('confirmed', v)}>Mit dem Originalbefund abgeglichen (bestätigt)</Toggle>
      <p className="hint">Werte in anderer Einheit werden als eigene Reihe geführt und nicht umgerechnet. Nur bestätigte Werte mit eindeutiger Einheit und Referenz können Empfehlungen auslösen. Laborwerte werden nicht gespeichert.</p>
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
/* ---------------- Routinen (HOS-004) ---------------- */
const SOURCE_LABEL = { plan: 'Wochenplan', eigene: 'Eigene', empfehlung: 'Empfehlung' };
function RoutinesScreen({ ctx }) {
  const { data, today, openSheet, go } = ctx;
  const groups = [['aktiv', 'Aktiv'], ['pausiert', 'Pausiert'], ['archiviert', 'Archiviert']];
  const sorted = [...data.routines].sort((a, b) => ((versionAt(a, today) || a.versions[0]).time || '').localeCompare((versionAt(b, today) || b.versions[0]).time || ''));
  return <div className="screen">
    <header className="page-head"><h1 className="h1">Routinen</h1><button className="btn small primary" onClick={() => openSheet({ kind: 'routine' })}><Icon name="plus" size={16} /> Neue Routine</button></header>
    <p className="hint top0">Routinen sind die Vorlagen hinter deinem Wochenplan. Änderungen gelten ab einem Datum, frühere Einträge bleiben unverändert.</p>
    {groups.map(([st, label]) => {
      const list = sorted.filter(r => r.status === st);
      if (!list.length && st !== 'aktiv') return null;
      const body = list.length ? <ul className="list">{list.map(r => {
        const v = versionAt(r, today) || r.versions[r.versions.length - 1];
        const next = data.items.filter(i => i.routine === r.id && i.date >= today && i.status === 'geplant').sort(byTime)[0];
        return <li key={r.id} className="row">
          <span className="row-icon lead"><Icon name={(TYPES[r.type] || TYPES.sonstiges).icon} size={18} /></span>
          <button className="row-main" onClick={() => openSheet({ kind: 'routine', id: r.id })}>
            <span className="row-title">{v.title}</span>
            <span className="row-meta"><span>{specText(v)}</span><span>{TASK_CLASSES[r.taskClass][0]}</span><span>{SOURCE_LABEL[r.source]}{r.customized && r.source === 'plan' ? ', angepasst' : ''}</span>{(r.exceptions || []).length > 0 && <span>{r.exceptions.length} Ausnahme{r.exceptions.length > 1 ? 'n' : ''}</span>}{st === 'aktiv' && next && <span>nächster: {dayLabel(next.date, today)}</span>}</span>
          </button>
        </li>;
      })}</ul> : <Empty text="Keine aktiven Routinen." action={<button className="btn small" onClick={() => openSheet({ kind: 'routine' })}>Routine anlegen</button>} />;
      return <section key={st} className="block">{st === 'archiviert' ? <details className="fold"><summary><span>{label}</span><span className="muted">{list.length}</span></summary>{body}</details> : <><h2 className="h2">{label} <span className="muted">{list.length}</span></h2>{body}</>}</section>;
    })}
    <button className="link" onClick={() => go('woche')}>Zurück zur Woche</button>
  </div>;
}
function RoutineSheet({ id, ctx, close }) {
  const { data, today, commit } = ctx;
  const rt = id ? data.routines.find(r => r.id === id) : null;
  const v0 = rt ? (versionAt(rt, today) || rt.versions[rt.versions.length - 1]) : null;
  const [f, setF] = useState(() => rt ? { title: v0.title, kind: v0.kind, type: rt.type, goal: rt.goal || '', taskClass: rt.taskClass, priority: rt.priority || 'normal', days: [...v0.days], interval: v0.interval || 1, time: v0.time, duration: String(v0.duration), note: v0.note || '', exceptions: clone(rt.exceptions || []) }
    : { title: '', kind: null, type: 'bewegung', goal: '', taskClass: 'same_day', priority: 'normal', days: [0, 2, 4], interval: 1, time: '12:30', duration: '15', note: '', exceptions: [] });
  const [from, setFrom] = useState(today);
  const [ex, setEx] = useState({ weekday: '', time: '', duration: '' });
  const [tab, setTab] = useState('bearbeiten');
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const n = parseNum(f.duration);
  const err = !f.title.trim() ? 'Bitte einen Titel eingeben.' : f.title.trim().length > 80 ? 'Bitte höchstens 80 Zeichen.' : !f.days.length ? 'Bitte mindestens einen Wochentag wählen.' : !f.time ? 'Bitte eine Uhrzeit angeben.' : !(Number.isInteger(n) && n > 0 && n <= 600) ? 'Bitte eine Dauer zwischen 1 und 600 Minuten eingeben.' : !from || from < today ? 'Änderungen gelten frühestens ab heute.' : '';
  const next = useMemo(() => (err ? null : A.saveRoutine(data, rt ? rt.id : null, { ...f, duration: n }, from, today)), [f, from, data, err]);
  const diff = next ? planDiff(data.items, next.items, today) : null;
  const conflicts = next && diff ? findConflicts(next.items, diff.changes.map(c => c.it.date)) : [];
  const addEx = () => {
    const wd = Number(ex.weekday);
    if (ex.weekday === '' || !f.days.includes(wd)) return;
    if (!ex.time && !ex.duration) return;
    set('exceptions', [...f.exceptions.filter(e => !(e.weekday === wd && e.validFrom === from)), { id: uid('ex'), weekday: wd, validFrom: from, time: ex.time || null, duration: ex.duration ? Number(ex.duration) : null }]);
    setEx({ weekday: '', time: '', duration: '' });
  };
  const status = (s, msg) => { commit(d => A.routineStatus(d, rt.id, s, today), msg); close(); };
  return <Sheet title={rt ? v0.title : 'Neue Routine'} close={close}>
    {rt && <Segmented label="Bereich" value={tab} onChange={setTab} options={[['bearbeiten', 'Bearbeiten'], ['verlauf', 'Verlauf']]} />}
    {tab === 'verlauf' && rt ? <div className="form">
      <h3 className="h3 top0">Versionen</h3>
      <ul className="list">{[...rt.versions].reverse().map(v => <li key={v.validFrom} className="row compact"><div className="row-main static"><span className="row-title">{v.validFrom <= '2000-01-01' ? 'Von Anfang an' : `Ab ${fmtDM(v.validFrom)}${yy(v.validFrom)}`}{v === v0 && <span className="tag">aktuell</span>}</span><span className="row-meta"><span>{v.title}</span><span>{specText(v)}</span></span></div></li>)}</ul>
      <h3 className="h3">Änderungsprotokoll</h3>
      <ul className="plain history">{[...(rt.history || [])].reverse().slice(0, 20).map((h, i) => <li key={i}><b>{h.at <= '2000-01-01' ? 'Anfang' : fmtDM(h.at)}</b> {h.text}</li>)}</ul>
    </div> : <div className="form">
      {rt && rt.source === 'plan' && !rt.customized && <p className="hint top0">Diese Routine stammt aus deinem Wochenplan. Nach einer Änderung hier bleibt sie bei späteren Planänderungen in den Einstellungen unverändert.</p>}
      <Field label="Titel"><input className="input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="z. B. Dehnen nach dem Aufstehen" /></Field>
      <Field label="Kategorie"><Chips small options={Object.entries(TYPES).map(([k, t]) => [k, t.label])} value={f.type} onChange={v => set('type', v)} /></Field>
      <Field label="Aufgabenklasse"><Chips small options={Object.entries(TASK_CLASSES).filter(([k]) => k !== 'deadline').map(([k, c]) => [k, c[0]])} value={f.taskClass} onChange={v => set('taskClass', v)} /></Field>
      <p className="hint top0">{TASK_CLASSES[f.taskClass][1]}</p>
      <Field label="Wochentage"><DayToggles label="Wochentage" value={f.days} onChange={v => set('days', v)} /></Field>
      <Field label="Wiederholung"><Chips small options={[[1, 'Jede Woche'], [2, 'Alle 2 Wochen']]} value={f.interval} onChange={v => set('interval', v)} /></Field>
      <div className="grid2">
        <Field label="Uhrzeit"><input className="input" type="time" value={f.time} onChange={e => set('time', e.target.value)} /></Field>
        <Field label="Dauer in Minuten"><input className="input" inputMode="numeric" value={f.duration} onChange={e => set('duration', e.target.value)} /></Field>
      </div>
      <div className="grid2">
        <Field label="Ziel"><select className="input" value={f.goal} onChange={e => set('goal', e.target.value)}><option value="">Kein Ziel</option>{Object.entries(GOALS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Priorität"><select className="input" value={f.priority} onChange={e => set('priority', e.target.value)}>{Object.entries(PRIORITIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
      </div>
      <Field label="Notiz (optional)"><input className="input" value={f.note} onChange={e => set('note', e.target.value)} /></Field>
      <h3 className="h3">Ausnahmen für einzelne Wochentage</h3>
      {f.exceptions.length ? <ul className="list">{f.exceptions.map(e => <li key={e.id} className="row compact"><div className="row-main static"><span className="row-title">Jeden {WD_LONG[e.weekday]}</span><span className="row-meta">{e.time && <span>{e.time} Uhr</span>}{e.duration && <span>{e.duration} Min.</span>}<span>ab {fmtDM(e.validFrom)}</span></span></div>
        <button className="icon-btn sm" aria-label={`Ausnahme ${WD_LONG[e.weekday]} entfernen`} onClick={() => set('exceptions', f.exceptions.filter(x => x.id !== e.id))}><Icon name="trash" size={16} /></button></li>)}</ul> : <p className="hint top0">Keine Ausnahmen. Beispiel: jeden Dienstag eine Stunde später.</p>}
      <div className="ex-add">
        <select className="input" aria-label="Wochentag der Ausnahme" value={ex.weekday} onChange={e => setEx({ ...ex, weekday: e.target.value })}><option value="">Tag</option>{f.days.map(d => <option key={d} value={d}>{WD[d]}</option>)}</select>
        <input className="input" type="time" aria-label="Uhrzeit der Ausnahme" value={ex.time} onChange={e => setEx({ ...ex, time: e.target.value })} />
        <input className="input" inputMode="numeric" aria-label="Dauer der Ausnahme in Minuten" placeholder="Min." value={ex.duration} onChange={e => setEx({ ...ex, duration: e.target.value })} />
        <button className="btn" onClick={addEx} disabled={ex.weekday === '' || (!ex.time && !ex.duration)}>Hinzufügen</button>
      </div>
      <Field label="Gültig ab" hint="Termine vor diesem Datum bleiben unverändert."><input className="input" type="date" min={today} value={from} onChange={e => setFrom(e.target.value)} /></Field>
      {err ? <p className="err" role="alert">{err}</p> : <ChangePreview diff={diff} conflicts={conflicts} empty={rt ? 'Keine zukünftigen Termine betroffen.' : 'Noch keine Termine im geplanten Zeitraum.'} />}
      <button className="btn primary wide" disabled={!!err} onClick={() => { commit(() => next, rt ? 'Routine gespeichert' : 'Routine angelegt'); close(); }}>{rt ? 'Änderungen speichern' : 'Routine anlegen'}</button>
      {rt && <div className="btn-row">
        {rt.status === 'aktiv' && <button className="btn small" onClick={() => status('pausiert', 'Routine pausiert')}><Icon name="pause" size={16} /> Pausieren</button>}
        {rt.status !== 'aktiv' && <button className="btn small" onClick={() => status('aktiv', 'Routine wieder aktiv')}>Reaktivieren</button>}
        {rt.status !== 'archiviert' && <button className="btn small" onClick={() => status('archiviert', 'Routine archiviert')}><Icon name="archive" size={16} /> Archivieren</button>}
        <button className="btn small" onClick={() => { commit(d => A.duplicateRoutine(d, rt.id, today), 'Kopie angelegt, sie ist pausiert'); close(); }}><Icon name="copy" size={16} /> Duplizieren</button>
      </div>}
      {rt && <p className="hint">Pausieren setzt zukünftige Termine aus, Reaktivieren stellt sie wieder her. Archivieren entfernt zukünftige geplante Termine. Erledigtes bleibt immer erhalten.</p>}
    </div>}
  </Sheet>;
}

/* ---------------- HOS-006: Health Review & Adapt ---------------- */
/* Regelbasiert und nur mit vorhandenen Daten. Keine Gesamtbewertung, keine Diagnosen, keine Ursache-Wirkungs-Behauptungen.
   Gespeichert werden nur Status, Datum, gestellte Fragen (IDs) und beschlossene Plan-Maßnahmen. Antworten bleiben in der Sitzung. */
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const ymOf = d => d.slice(0, 7);
const monthLast = ym => { const [y, m] = ym.split('-').map(Number); return iso(new Date(y, m, 0)); };
const prevYm = ym => ymOf(addDays(`${ym}-01`, -1));
const fmtYm = ym => `${MONTHS[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`;
const REVIEW_STATUS = { offen: 'Offen', verschoben: 'Verschoben', uebersprungen: 'Übersprungen', abgeschlossen: 'Abgeschlossen' };
const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);

/* ---------- Datengrundlage: vollständig, unvollständig, keine Daten ---------- */
const COVERAGE_LABEL = { vollstaendig: 'vollständig erfasst', laufend: 'läuft noch', teilweise: 'unvollständig erfasst', keine: 'keine Daten', pausiert: 'pausiert', zukunft: 'noch nicht begonnen' };
function planStart(data) { let s = null; data.items.forEach(i => { if (i.routine && (!s || i.date < s)) s = i.date; }); return s; }
function habitStart(data) { let s = null; Object.keys(data.habitLog || {}).forEach(k => { const d = k.split('|')[1]; if (!s || d < s) s = d; }); return s; }
/* Eine Woche ist nur dann „vollständig“, wenn für alle Tage ein Plan existierte und die Woche vorbei ist.
   Nur dann bedeutet 0 Trainings nachweislich keine Aktivität. */
function weekCoverage(data, ws, today, ps = planStart(data)) {
  const we = addDays(ws, 6);
  if (ws > today) return 'zukunft';
  if (!ps || we < ps) return data.workouts.some(w => w.date >= ws && w.date <= we) ? 'teilweise' : 'keine';
  if (ws < ps) return 'teilweise';
  if (weekDays(ws).every(d => pausedAll(data, d))) return 'pausiert';
  if (we >= today) return 'laufend';
  return 'vollstaendig';
}
/* Damals geltendes Wochenziel: aus den Routinenversionen der Trainingsroutinen, nicht aus den heutigen Einstellungen */
function goalAt(data, ws) {
  let n = 0;
  (data.routines || []).forEach(rt => {
    if (rt.type !== 'training' || rt.taskClass !== 'weekly_flexible') return;
    weekDays(ws).forEach(d => { if (rt.status === 'pausiert' && rt.pausedSince && d >= rt.pausedSince) return; if (specAt(rt, d)) n++; });
  });
  return n;
}
function trainingSeries(data, endWs, n, today) {
  const ps = planStart(data);
  return Array.from({ length: n }, (_, k) => addDays(endWs, -7 * (n - 1 - k))).map(s => {
    const cov = weekCoverage(data, s, today, ps);
    const cnt = trainingsInWeek(data, s);
    const value = cov === 'keine' || cov === 'pausiert' || cov === 'zukunft' ? null : cnt;
    return { key: s, label: `KW${isoWeek(s)}`, value, faint: cov === 'teilweise' || cov === 'laufend', coverage: cov, goal: cov === 'keine' ? null : goalAt(data, s) };
  });
}
/* Durchschnitt nur aus vollständig erfassten Wochen, mindestens zwei */
function avgComplete(series) { const v = series.filter(x => x.coverage === 'vollstaendig'); return v.length >= 2 ? { avg: avg(v.map(x => x.value)), n: v.length, goal: avg(v.map(x => x.goal || 0)) } : { avg: null, n: v.length, goal: null }; }
function gapText(series) {
  const g = series.filter(x => x.coverage === 'keine' || x.coverage === 'pausiert'), t = series.filter(x => x.coverage === 'teilweise' || x.coverage === 'laufend');
  const parts = [];
  if (g.length) parts.push(`${g.length === 1 ? 'Für' : 'Für die'} ${g.map(x => x.label).join(', ')} liegen keine Plan-Daten vor oder die Woche war pausiert. Diese ${g.length === 1 ? 'Woche wird' : 'Wochen werden'} als Datenlücke gezeigt, nicht als 0.`);
  if (t.length) parts.push(`${t.map(x => x.label).join(', ')} ${t.length === 1 ? 'ist' : 'sind'} unvollständig erfasst und ${t.length === 1 ? 'fließt' : 'fließen'} nicht in Durchschnitte ein.`);
  return parts.join(' ');
}

/* ---------- Zeitpunkte ---------- */
/* Analysierter Zeitraum (target) und Check-in-Termin (slot) sind getrennt */
function weeklyWindow(today, cfg) {
  const c = normalizeConfig(cfg); const wd = c.review.weeklyDay; const ws = weekStart(today);
  if (wd >= 4) {
    const target = wdIdx(today) >= wd ? ws : addDays(ws, -7);
    return { target, start: addDays(target, wd), end: addDays(target, 9) };
  }
  const target = addDays(ws, -7);
  return { target, start: addDays(ws, wd), end: addDays(ws, wd + 3) };
}
function monthlyTarget(today) {
  const ym = ymOf(today);
  if (daysBetween(today, monthLast(ym)) <= 2) return ym;
  if (Number(today.slice(8)) <= 7) return prevYm(ym);
  return null;
}
function weeklyDescriptor(today, cfg) {
  const w = weeklyWindow(today, cfg);
  return { kind: 'week', key: `W:${w.target}`, keys: [`W:${w.target}`], period: w.target, weekPeriod: w.target, slotDate: w.start, windowEnd: w.end, label: `Wochen-Check-in KW ${isoWeek(w.target)}`, minutes: '3 bis 5' };
}
function monthlyDescriptor(ym) { return { kind: 'month', key: `M:${ym}`, keys: [`M:${ym}`], period: ym, label: `Monatsreview ${fmtYm(ym)}`, minutes: '10 bis 15' }; }
function combinedDescriptor(w, m) { return { kind: 'combined', key: m.key, keys: [w.key, m.key], period: m.period, weekPeriod: w.weekPeriod, slotDate: w.slotDate, windowEnd: w.windowEnd, label: `Wochen- und Monatsreview`, sub: `KW ${isoWeek(w.weekPeriod)} und ${fmtYm(m.period)}`, minutes: '10 bis 15' }; }
const reviewOpen = (r, today) => !r || ((r.status === 'offen' || r.status === 'verschoben') && !(r.snoozedUntil && r.snoozedUntil > today));
function reviewDue(data, cfg, today, nowMin) {
  const c = normalizeConfig(cfg); const rs = data.reviews || {}; const out = [];
  if (c.review.monthly) { const ym = monthlyTarget(today); if (ym && reviewOpen(rs[`M:${ym}`], today)) out.push(monthlyDescriptor(ym)); }
  const w = weeklyDescriptor(today, c);
  const started = today > w.slotDate || (today === w.slotDate && nowMin >= (toMin(c.review.weeklyTime) ?? 1080));
  if (started && today <= w.windowEnd && reviewOpen(rs[w.key], today)) out.push(w);
  return out;
}
/* Sind Woche und Monat gleichzeitig fällig, wird ein gemeinsamer Ablauf angeboten */
function reviewOffer(data, cfg, today, nowMin) {
  const due = reviewDue(data, cfg, today, nowMin);
  const w = due.find(x => x.kind === 'week'), m = due.find(x => x.kind === 'month');
  return w && m ? combinedDescriptor(w, m) : due[0] || null;
}
function reviewForDate(date, cfg) { return weeklyDescriptor(date, cfg); }
function nextWeeklyDate(today, cfg, data) {
  const c = normalizeConfig(cfg);
  for (let i = 0; i < 14; i++) {
    const d = addDays(today, i);
    if (wdIdx(d) !== c.review.weeklyDay) continue;
    const r = (data.reviews || {})[`W:${weeklyWindow(d, c).target}`];
    if (!r || (r.status !== 'abgeschlossen' && r.status !== 'uebersprungen')) return d;
  }
  return null;
}
/* Der zugehörige Check-in-Termin im Plan. Folgt einer Verschiebung, nie ein Termin vor dem Check-in-Tag. */
function slotItem(d, rv) {
  if (!rv.slotDate) return null;
  const list = d.items.filter(i => i.routine === 'review');
  let it = list.find(i => i.date === rv.slotDate && !i.movedFrom) || list.find(i => i.date === rv.slotDate) || null;
  for (let k = 0; it && it.status === 'verschoben' && k < 10; k++) { const from = it; it = list.find(i => i.movedFrom === from.date && i.date === from.movedTo) || null; }
  if (it) return ['geplant', 'verpasst'].includes(it.status) ? it : null;
  const end = rv.windowEnd || addDays(rv.slotDate, 3);
  return list.filter(i => i.date >= rv.slotDate && i.date <= end && ['geplant', 'verpasst'].includes(i.status)).sort(byTime)[0] || null;
}
function completeReviewState(d, rv, today, questionIds, mode) {
  let n = d;
  rv.keys.forEach(k => {
    const kind = k.startsWith('W:') ? 'week' : 'month';
    const cur = (n.reviews || {})[k] || { kind, status: 'offen', measures: [] };
    if (cur.status === 'abgeschlossen') return;
    n = { ...n, reviews: { ...(n.reviews || {}), [k]: { ...cur, kind, status: 'abgeschlossen', at: today, snoozedUntil: null, questionIds, mode: mode || 'voll', combined: rv.keys.length > 1 } } };
  });
  const it = slotItem(n, rv);
  if (it) n = it.status === 'verpasst' ? A.lateLog(n, it.id) : A.setItem(n, it.id, { status: 'erledigt' });
  return n;
}

/* ---------- Kennzahlen ---------- */
function adherence(items, from, to, today, pred = () => true) {
  const l = items.filter(i => i.date >= from && i.date <= to && pred(i) && !['verschoben', 'pausiert', 'ausgelassen'].includes(i.status) && !(i.status === 'geplant' && i.date >= today) && classOfItem(i) !== 'deadline');
  const done = l.filter(i => i.status === 'erledigt').length;
  return { done, eligible: l.length, missed: l.filter(i => i.status === 'verpasst').length, rate: l.length ? done / l.length : null };
}
const isPause = i => !!i.routine && i.routine.startsWith('pause');
const isTrainingPlan = i => i.type === 'training';
const habitOn = (h, d) => h.active !== false && !(h.inactiveFrom && d >= h.inactiveFrom);
/* Gewohnheiten: Tage vor dem ersten Eintrag sind keine Daten, nicht „nicht erledigt“ */
function habitAdherence(data, from, to, today) {
  const hs0 = habitStart(data);
  const per = data.habits.filter(h => h.active !== false || h.inactiveFrom).map(h => {
    let done = 0, eligible = 0;
    for (let d = from; d <= to && d <= today; d = addDays(d, 1)) {
      if (!hs0 || d < hs0 || pausedAll(data, d) || !habitOn(h, d)) continue;
      const v = data.habitLog[`${h.id}|${d}`];
      if (v === 'skip') continue;
      eligible++; if (v === 'done') done++;
    }
    return { id: h.id, name: h.name, lib: h.lib, custom: h.custom, done, eligible, rate: eligible ? done / eligible : null };
  });
  const done = per.reduce((s, h) => s + h.done, 0), eligible = per.reduce((s, h) => s + h.eligible, 0);
  return { per, done, eligible, rate: eligible ? done / eligible : null };
}
function windowCoverage(data, from, to, today) { const ps = planStart(data); if (!ps) return 0; const a = from > ps ? from : ps, b = to < today ? to : today; return a > b ? 0 : daysBetween(a, b) + 1; }
function avgIn(list, from, to, key) { const v = list.filter(x => x.date >= from && x.date <= to).map(x => x[key]); return v.length ? { avg: avg(v), n: v.length } : null; }
function weightChange(weights, from, to) {
  const l = weights.filter(w => w.date >= from && w.date <= to).sort((a, b) => a.date.localeCompare(b.date));
  if (l.length < 4 || daysBetween(l[0].date, l[l.length - 1].date) < 14) return { n: l.length, delta: null };
  const k = Math.max(2, Math.floor(l.length / 4));
  return { n: l.length, delta: avg(l.slice(-k).map(w => w.kg)) - avg(l.slice(0, k).map(w => w.kg)), from: l[0].date, to: l[l.length - 1].date };
}
function trainingHistory(data, ws, weeks) {
  let done = 0, planned = 0;
  for (let k = 0; k < weeks; k++) { const s = addDays(ws, -7 * k); const a = adherence(data.items, s, addDays(s, 6), addDays(s, 7), isTrainingPlan); done += a.done; planned += a.eligible; }
  return { done, planned, rate: planned ? done / planned : null, weeks };
}
function weekMetrics(data, ws, today, cfg) {
  const c = normalizeConfig(cfg); const days = weekDays(ws); const until = days[6] < today ? days[6] : today;
  const goal = goalAt(data, ws); const coverage = weekCoverage(data, ws, today);
  const prev = addDays(ws, -7);
  const its = data.items.filter(i => i.date >= ws && i.date <= days[6]);
  const trDone = trainingsInWeek(data, ws);
  const trMissed = its.filter(i => i.type === 'training' && i.status === 'verpasst' && !i.replacedBy);
  const pa = adherence(data.items, ws, until, today, isPause);
  const paMissed = its.filter(i => isPause(i) && i.status === 'verpasst');
  const officeMissed = paMissed.filter(i => i.routine.endsWith('buero')).length;
  const ha = habitAdherence(data, ws, until, today);
  const routines = [...new Set(its.filter(i => i.routine).map(i => i.routine))].map(id => {
    const a = adherence(data.items, ws, until, today, i => i.routine === id);
    const rt = data.routines.find(r => r.id === id);
    return { id, title: rt ? (versionAt(rt, ws) || rt.versions[0]).title : id, ...a };
  }).filter(r => r.eligible > 0);
  const w = avgIn(data.weights, ws, days[6], 'kg'), wPrev = avgIn(data.weights, prev, addDays(prev, 6), 'kg');
  const st = avgIn(data.steps, ws, days[6], 'count'), stPrev = avgIn(data.steps, prev, addDays(prev, 6), 'count');
  const nutDays = days.filter(d => d <= until && dayNutrition(data, d)), nutFull = nutDays.filter(d => dayNutrition(data, d).complete);
  const weakHabit = ha.per.filter(h => h.eligible >= 4 && h.rate < 0.4).sort((a, b) => a.rate - b.rate)[0] || null;
  const positives = [], obstacles = [];
  if (coverage !== 'keine') {
    if (goal && trDone >= goal) positives.push(`Trainingsziel erreicht: ${trDone} von ${goal} Einheiten.`);
    else if (trDone > 0) positives.push(`${trDone} ${trDone === 1 ? 'Trainingseinheit' : 'Trainingseinheiten'} geschafft.`);
    if (pa.eligible >= 3 && pa.rate >= 0.7) positives.push(`Bewegungspausen an ${pa.done} von ${pa.eligible} Tagen.`);
    const bestHabit = ha.per.filter(h => h.done >= 5).sort((a, b) => b.done - a.done)[0];
    if (bestHabit) positives.push(`„${bestHabit.name}“ an ${bestHabit.done} Tagen.`);
    if (st && stPrev && st.n >= 3 && stPrev.n >= 3 && st.avg > stPrev.avg * 1.1) positives.push(`Im Schnitt mehr Schritte als in der Vorwoche (${fmtNum(st.avg)} statt ${fmtNum(stPrev.avg)}).`);
    trMissed.forEach(i => obstacles.push(`${i.title} am ${WD_LONG[wdIdx(i.date)]} hat nicht stattgefunden.`));
    if (paMissed.length >= 2 && officeMissed / paMissed.length >= 0.6 && c.work.days.some(d => !c.work.home.includes(d))) obstacles.push(`${paMissed.length} Bewegungspausen haben nicht stattgefunden, davon ${officeMissed} an Bürotagen.`);
    else if (paMissed.length >= 1) obstacles.push(`${paMissed.length} ${paMissed.length === 1 ? 'Bewegungspause hat' : 'Bewegungspausen haben'} nicht stattgefunden.`);
    if (weakHabit) obstacles.push(`„${weakHabit.name}“ war schwer umzusetzen (${weakHabit.done} von ${weakHabit.eligible} Tagen).`);
  }
  return {
    ws, until, goal, coverage, trDone, trMissed, trOpen: its.filter(i => i.type === 'training' && i.status === 'geplant' && i.date >= today).length,
    pauses: pa, pauseMissed: paMissed.length, officeMissed, habits: ha, weakHabit, routines,
    weight: w, weightPrev: wPrev, steps: st, stepsPrev: stPrev, nutDays: nutDays.length, nutFull: nutFull.length, nutDue: days.filter(d => d <= until).length,
    positives, obstacles, hist3: trainingHistory(data, ws, 3), pauseHist2: adherence(data.items, addDays(ws, -7), until, today, isPause),
  };
}
function monthMetrics(data, ym, today, cfg) {
  const c = normalizeConfig(cfg);
  const end = monthLast(ym) < today ? monthLast(ym) : today;
  const s30 = addDays(end, -29), p30s = addDays(end, -59), p30e = addDays(end, -30), s90 = addDays(end, -89);
  const series = trainingSeries(data, weekStart(end), 12, today);
  const trNow = avgComplete(series.slice(-4)), trPrev = avgComplete(series.slice(-8, -4)), tr12 = avgComplete(series);
  const cov30 = windowCoverage(data, s30, end, today), cov60 = windowCoverage(data, p30s, p30e, today);
  const pa30 = adherence(data.items, s30, end, today, isPause), pa60 = adherence(data.items, p30s, p30e, today, isPause);
  const ha30 = habitAdherence(data, s30, end, today), ha60 = habitAdherence(data, p30s, p30e, today);
  const firstW = data.weights.length ? data.weights.reduce((m, w) => (w.date < m ? w.date : m), end) : null;
  const wc30 = weightChange(data.weights, s30, end), wc90 = weightChange(data.weights, s90, end), wcAll = firstW && daysBetween(firstW, end) > 90 ? weightChange(data.weights, firstW, end) : null;
  const st30 = avgIn(data.steps, s30, end, 'count'), st60 = avgIn(data.steps, p30s, p30e, 'count');
  const nut = Array.from({ length: 30 }, (_, k) => addDays(s30, k)).filter(d => dayNutrition(data, d));
  const routines = data.routines.filter(r => r.status !== 'archiviert').map(r => {
    const a = adherence(data.items, addDays(end, -27), end, today, i => i.routine === r.id);
    return { id: r.id, title: (versionAt(r, end) || r.versions[r.versions.length - 1]).title, ...a };
  }).filter(r => r.eligible >= 4);
  /* Trend nur, wenn beide Vergleichszeiträume ausreichend erfasst sind */
  const trend = (a, b, ok, tol = 0.1) => (!ok || a == null || b == null ? 'zu wenige Daten' : a > b * (1 + tol) ? 'steigend' : a < b * (1 - tol) ? 'rückläufig' : 'stabil');
  const rateOk = cov30 >= 21 && cov60 >= 21;
  const goals = c.goals.map(g => {
    if (g === 'fitter') return { g, status: trNow.avg != null ? `Ø ${fmtNum(trNow.avg, 1)} Trainings pro Woche bei damals geltendem Ziel Ø ${fmtNum(trNow.goal, 1)} (${trNow.n} vollständige Wochen)` : 'zu wenige vollständig erfasste Wochen', trend: trend(trNow.avg, trPrev.avg, trNow.avg != null && trPrev.avg != null) };
    if (g === 'bewegung') return { g, status: pa30.eligible ? `${pct(pa30.done, pa30.eligible)} % der Bewegungspausen, Daten aus ${cov30} von 30 Tagen${st30 ? `, Ø ${fmtNum(st30.avg)} Schritte an ${st30.n} Tagen` : ''}` : 'keine Daten zu Bewegungspausen', trend: trend(pa30.rate, pa60.rate, rateOk) };
    if (g === 'abnehmen') return { g, status: wc30.delta != null ? `Gewicht ${signed(wc30.delta)} kg in 30 Tagen (${wc30.n} Messungen)` : `zu wenige Messungen für einen Vergleich (${wc30.n})`, trend: wc30.delta == null ? 'zu wenige Daten' : wc30.delta < -0.3 ? 'gesunken' : wc30.delta > 0.3 ? 'gestiegen' : 'stabil' };
    if (g === 'ernaehrung') return { g, status: nut.length ? `Mahlzeiten an ${nut.length} von 30 Tagen erfasst` : 'keine Mahlzeiten erfasst', trend: nut.length < 10 ? 'zu wenige Daten' : 'erfasst' };
    if (g === 'werte') return { g, status: 'Laborwerte nur als fiktive Demo, siehe Gesundheit', trend: 'keine Bewertung' };
    return { g, status: ha30.eligible ? `Gewohnheiten zu ${pct(ha30.done, ha30.eligible)} % in 30 Tagen` : 'keine Einträge zu Gewohnheiten', trend: trend(ha30.rate, ha60.rate, ha30.eligible >= 14 && ha60.eligible >= 14) };
  });
  return {
    ym, end, s30, cov30, cov60, planStart: planStart(data),
    training: { now: trNow, prev: trPrev, w12: tr12, series, gaps: gapText(series), goalNow: goalAt(data, weekStart(today)) },
    pauses: { now: pa30, prev: pa60 }, habits: { now: ha30, prev: ha60 }, weight: { wc30, wc90, wcAll, firstW }, steps: { now: st30, prev: st60 }, nutDays: nut.length,
    good: routines.filter(r => r.rate >= 0.7), problem: routines.filter(r => r.rate < 0.5), routines, goals,
  };
}

/* ---------- Reflexionsfragen ---------- */
const QUESTIONS = [
  { id: 'training-hindernis', prio: 9, when: m => m.trMissed && m.trMissed.length > 0, text: () => 'Was hat das Training am ehesten verhindert?', options: () => [['termine', 'Termine oder Arbeit'], ['energie', 'Wenig Energie'], ['uhrzeit', 'Die Uhrzeit passt nicht'], ['anderes', 'Etwas anderes']] },
  { id: 'pausen-hindernis', prio: 8, when: m => m.pauseMissed >= 2, text: () => 'Was hat die Bewegungspausen am ehesten verhindert?', options: () => [['meetings', 'Meetings oder Termine'], ['vergessen', 'Vergessen'], ['uhrzeit', 'Die Uhrzeit passt nicht'], ['anderes', 'Etwas anderes']] },
  { id: 'gewohnheit', prio: 7, when: m => !!m.weakHabit, text: m => `Passt „${m.weakHabit.name}“ gerade in deinen Alltag?`, options: () => [['ja', 'Ja, weiter so'], ['kleiner', 'Zu groß, vereinfachen'], ['pause', 'Gerade nicht wichtig']] },
  { id: 'umfang', prio: 6, when: () => true, text: () => 'Wie hat sich der Umfang deines Plans angefühlt?', options: () => [['zuviel', 'Zu viel'], ['passend', 'Passend'], ['mehr', 'Es dürfte mehr sein']] },
  { id: 'gut', prio: 5, when: m => m.positives && m.positives.length > 0, text: () => 'Was hat gut funktioniert und soll so bleiben?', options: () => [['zeiten', 'Feste Uhrzeiten'], ['kurz', 'Kurze Einheiten'], ['planung', 'Vorausplanen'], ['anderes', 'Etwas anderes']] },
  { id: 'ernaehrung', prio: 4, when: (m, c) => c.goals.some(g => ['ernaehrung', 'werte', 'abnehmen'].includes(g)), text: () => 'Welche kleine Ernährungsänderung wäre für dich realistisch?', options: () => [['hafer', 'Haferflocken zum Frühstück'], ['huelsen', 'Öfter Hülsenfrüchte'], ['gemuese', 'Mehr Obst und Gemüse'], ['keine', 'Gerade keine']] },
  { id: 'monat-huerde', monthly: true, prio: 9, when: () => true, text: () => 'Was war im letzten Monat die größte Hürde?', options: () => [['zeit', 'Zeit'], ['planung', 'Planung'], ['energie', 'Energie'], ['keine', 'Keine besondere']] },
  { id: 'fokus', monthly: true, prio: 10, when: (m, c) => c.goals.length > 1, text: () => 'Worauf möchtest du dich im nächsten Monat konzentrieren?', options: (m, c) => c.goals.map(g => [g, GOALS[g]]) },
];
function pickQuestions(kind, m, cfg, previousIds) {
  const c = normalizeConfig(cfg); const monthly = kind !== 'week'; const max = monthly ? 5 : 3;
  const pool = QUESTIONS.filter(q => (monthly || !q.monthly) && q.when(m, c)).sort((a, b) => b.prio - a.prio);
  const fresh = pool.filter(q => !previousIds.includes(q.id)), seen = pool.filter(q => previousIds.includes(q.id));
  const minN = Math.min(monthly ? 3 : 1, pool.length);
  const out = fresh.slice(0, max);
  for (const q of seen) { if (out.length >= minN) break; out.push(q); }
  return out.map(q => ({ id: q.id, text: q.text(m, c), options: q.options(m, c) }));
}
function previousQuestionIds(data, kind, key) {
  const prev = Object.entries(data.reviews || {}).filter(([k, r]) => (kind === 'combined' || r.kind === kind) && k !== key && r.status === 'abgeschlossen').sort((a, b) => (b[1].at || '').localeCompare(a[1].at || ''))[0];
  return prev ? prev[1].questionIds || [] : [];
}

/* ---------- Adaptiver Coach ---------- */
const nextMonday = today => addDays(weekStart(today), 7);
function versionRoutines(d, ids, patchOf, from, today, text) {
  const routines = d.routines.map(rt => (ids.includes(rt.id) ? addVersion({ ...rt, customized: true }, from, patchOf(rt), text) : rt));
  return materialize({ ...d, routines }, today);
}
/* Frühere Entscheidungen: übernommen in den letzten zwei Reviews oder „nicht jetzt“ ohne neuen Anlass werden nicht erneut vorgeschlagen */
function priorDecisions(data, keys) {
  return Object.entries(data.reviews || {}).filter(([k]) => !keys.includes(k)).sort((a, b) => (b[1].at || '').localeCompare(a[1].at || '')).slice(0, 4)
    .flatMap(([, r], idx) => (r.measures || []).map(x => ({ ...x, recent: idx < 2 })));
}
const AREA_GOALS = { training: ['fitter', 'abnehmen'], bewegung: ['bewegung', 'werte'], ernaehrung: ['ernaehrung', 'werte', 'abnehmen'], gewohnheiten: ['routinen'], ziele: [] };
function coachMeasures(kind, m, answers, data, cfg, today, keys, max = 3) {
  const c = normalizeConfig(cfg); const nm = nextMonday(today); const out = [];
  const keyList = Array.isArray(keys) ? keys : [keys];
  const decidedHere = keyList.flatMap(k => (((data.reviews || {})[k] || {}).measures || []).map(x => x.id));
  const prior = priorDecisions(data, keyList);
  const blocked = x => decidedHere.includes(x.id) || prior.some(p => p.id === x.id && ((p.decision === 'übernommen' && p.recent && x.id !== 'fortfuehren') || (p.decision === 'nicht jetzt' && p.sig === x.sig)));
  const plan = buildPlan(c); const goal = plan.tdays.length; const per = Math.min(5, c.training.perWeek);
  const ws = kind === 'week' ? m.ws : weekStart(m.end);
  const hist = trainingHistory(data, ws, 3);
  const when = f => (f === today ? 'ab sofort' : `ab ${fmtDM(f)}`);
  const planEvidence = { kind: 'plan', text: 'Planungsvorschlag aus deinen Einträgen, keine Gesundheitsaussage.' };
  const ans = answers || {};
  if (goal >= 2 && ((hist.planned >= 4 && hist.rate < 0.6) || ans.umfang === 'zuviel')) out.push({
    id: 'training-weniger', area: 'training', base: 80 + (ans.umfang === 'zuviel' ? 20 : 0), canNow: true, sig: `${hist.done}/${hist.planned}/${ans.umfang || ''}`,
    title: `Training auf ${per - 1}× pro Woche anpassen`,
    why: `${hist.planned ? `In den letzten ${hist.weeks} Wochen fanden ${hist.done} von ${hist.planned} geplanten Einheiten statt.` : ''}${ans.umfang === 'zuviel' ? ' Du hast den Umfang als zu viel empfunden.' : ''} Ein Plan, der in deine Wochen passt, ist eine gute Basis, um später wieder zu steigern.`.trim(),
    change: f => `${when(f)}: ${per - 1} statt ${per} Einheiten pro Woche.${f === today ? ' Bereits erledigte Einheiten bleiben.' : ' Die laufende Woche bleibt, wie sie ist.'}`,
    check: `In den nächsten drei Wochen jeweils ${per - 1} ${per - 1 === 1 ? 'Einheit' : 'Einheiten'} erledigen.`, metric: { type: 'training', target: per - 1 }, evidence: planEvidence,
    build: cc => ({ cfg: { ...cc, training: { ...cc.training, perWeek: Math.max(0, Math.min(5, cc.training.perWeek) - 1) } } }),
  });
  plan.tdays.forEach(d => {
    const rt = data.routines.find(r => r.id === `train-${d}`); if (!rt || rt.customized || rt.status !== 'aktiv') return;
    const occ = data.items.filter(i => i.routine === rt.id && i.date < today && ['erledigt', 'verpasst'].includes(i.status) && !i.replacedBy).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
    const miss = occ.filter(i => i.status === 'verpasst').length;
    if (occ.length < 3 || miss < 2) return;
    const cands = [0, 1, 2, 3, 4, 5, 6].filter(x => !plan.tdays.includes(x) && x !== plan.freeDay);
    const score = x => (plan.tdays.some(t => t !== d && wdist(t, x) <= 1) ? 0 : 2) + (ans['training-hindernis'] === 'termine' && !c.work.days.includes(x) ? 2 : 0) + (c.work.days.includes(x) === c.work.days.includes(d) ? 1 : 0);
    const alt = cands.sort((a, b) => score(b) - score(a) || wdist(b, d) - wdist(a, d))[0];
    if (alt == null) return;
    out.push({
      id: `training-verlegen-${d}`, area: 'training', base: 85 + (['termine', 'uhrzeit'].includes(ans['training-hindernis']) ? 10 : 0), canNow: true, sig: `${miss}/${occ.length}`,
      title: `Training von ${WD_LONG[d]} auf ${WD_LONG[alt]} verlegen`,
      why: `Die Einheit am ${WD_LONG[d]} hat bei den letzten ${occ.length} Terminen ${miss}-mal nicht stattgefunden.${ans['training-hindernis'] === 'termine' ? ' Du nennst Termine oder Arbeit als Hürde.' : ''}`,
      change: f => `${when(f)} liegt sie am ${WD_LONG[alt]}. Die Uhrzeit ergibt sich aus deinem Arbeitsalltag.`,
      check: `Die Einheit am ${WD_LONG[alt]} in den nächsten drei Wochen mindestens zweimal erledigen.`, metric: { type: 'training', target: goal }, evidence: planEvidence,
      build: cc => ({ cfg: { ...cc, training: { ...cc.training, days: [...new Set([...buildPlan(cc).tdays.filter(x => x !== d), alt])].sort((a, b) => a - b) } } }),
    });
  });
  const metGoal = kind === 'week' ? m.goal > 0 && m.trDone >= m.goal : (m.training && m.training.now.avg != null && m.training.now.avg >= m.training.now.goal);
  if (goal && goal < 4 && metGoal && hist.planned >= 4 && hist.rate >= 0.9 && ans.umfang !== 'zuviel' && c.goals.some(g => ['fitter', 'abnehmen'].includes(g))) out.push({
    id: 'training-mehr', area: 'training', base: 50 + (ans.umfang === 'mehr' ? 35 : 0), canNow: true, sig: `${hist.done}/${hist.planned}/${ans.umfang || ''}`,
    title: `Optional: ${per + 1}× pro Woche trainieren`,
    why: `In den letzten ${hist.weeks} Wochen fanden ${hist.done} von ${hist.planned} Einheiten statt.${ans.umfang === 'mehr' ? ' Du hast angegeben, dass es mehr sein dürfte.' : ''} Nur sinnvoll, wenn es sich gut anfühlt.`,
    change: f => `${when(f)}: ${per + 1} statt ${per} Einheiten. Den zusätzlichen Tag wählt die Planung mit möglichst viel Abstand.`,
    check: `In den nächsten drei Wochen mindestens zweimal ${per + 1} Einheiten.`, metric: { type: 'training', target: per + 1 }, evidence: planEvidence,
    build: cc => ({ cfg: { ...cc, training: { ...cc.training, perWeek: Math.min(5, cc.training.perWeek + 1) } } }),
  });
  /* Nur nicht individuell angepasste Pausen-Routinen werden vorgeschlagen */
  const pauseIds = data.routines.filter(r => r.status === 'aktiv' && r.id.startsWith('pause1') && !r.customized).map(r => r.id);
  const ph = kind === 'week' ? m.pauseHist2 : m.pauses.now;
  if (pauseIds.length && ((ph.eligible >= 4 && ph.rate < 0.5) || ['meetings', 'uhrzeit'].includes(ans['pausen-hindernis']))) {
    const r0 = data.routines.find(r => r.id === pauseIds[0]); const v0 = versionAt(r0, nm) || r0.versions[r0.versions.length - 1];
    const after = hm(r15((toMin(c.work.lunch) ?? 750) + (Number(c.work.lunchDur) || 30)));
    const newTime = after === v0.time ? hm(Math.min(1380, toMin(v0.time) + 60)) : after; const newDur = Math.min(v0.duration, 10);
    out.push({
      id: 'pausen-anpassen', area: 'bewegung', base: 75 + (ans['pausen-hindernis'] ? 10 : 0), canNow: true, sig: `${ph.done}/${ph.eligible}/${ans['pausen-hindernis'] || ''}`,
      title: `Bewegungspause kürzer und um ${newTime} Uhr`,
      why: `${ph.eligible ? `Zuletzt fanden ${ph.done} von ${ph.eligible} Bewegungspausen statt.` : ''}${ans['pausen-hindernis'] === 'meetings' ? ' Du nennst Meetings als Hürde.' : ans['pausen-hindernis'] === 'uhrzeit' ? ' Die Uhrzeit passt laut dir nicht.' : ''} Verpasste Pausen sind abgeschlossen, es wird nichts nachgeholt.`.trim(),
      change: f => `${when(f)}: ${newTime} Uhr und ${newDur} Minuten statt ${v0.time} Uhr und ${v0.duration} Minuten.`,
      check: 'Mindestens drei Bewegungspausen pro Woche.', metric: { type: 'pauses', target: 3 },
      evidence: { kind: 'rec', level: 'gut', sources: ['who2020'], text: 'Sitzzeit durch Bewegung zu ersetzen ist gut belegt. Uhrzeit und Länge sind Planungsentscheidungen.' },
      build: (cc, from) => ({ fn: d => versionRoutines(d, pauseIds, () => ({ time: newTime, duration: newDur }), from, today, `Aus Review: ${newTime} Uhr, ${newDur} Min.`) }),
    });
  }
  const wh = m.weakHabit || (kind !== 'week' && m.habits ? m.habits.now.per.filter(h => h.eligible >= 8 && h.rate < 0.4).sort((a, b) => a.rate - b.rate)[0] : null);
  if (wh && ans.gewohnheit !== 'ja') out.push({
    id: `gewohnheit-pause-${wh.id}`, area: 'gewohnheiten', base: 60 + (['kleiner', 'pause'].includes(ans.gewohnheit) ? 25 : 0), canNow: true, sig: `${wh.done}/${wh.eligible}/${ans.gewohnheit || ''}`,
    title: `„${wh.name}“ vorerst pausieren`,
    why: `„${wh.name}“ gelang an ${wh.done} von ${wh.eligible} Tagen.${ans.gewohnheit === 'kleiner' ? ' Du findest sie gerade zu groß.' : ans.gewohnheit === 'pause' ? ' Sie ist dir gerade nicht wichtig.' : ''} Weniger gleichzeitige Gewohnheiten können den Fokus erleichtern.`,
    change: f => `${when(f)} verschwindet die Gewohnheit aus dem Raster. Bisherige Haken bleiben, reaktivieren geht jederzeit in der Woche.`,
    check: 'Die übrigen Gewohnheiten an mindestens vier Tagen pro Woche abhaken.', metric: { type: 'habits', target: 4 }, evidence: planEvidence,
    build: (cc, from) => ({ fn: d => ({ ...d, habits: d.habits.map(h => (h.id === wh.id ? { ...h, inactiveFrom: from } : h)) }) }),
  });
  const recs = computeRecs(data, c, today);
  const foodAns = ans.ernaehrung;
  if (foodAns !== 'keine' && (foodAns || c.goals.some(g => ['ernaehrung', 'werte', 'abnehmen'].includes(g)))) {
    const want = foodAns === 'gemuese' ? ['pflanzen-vielfalt'] : ['ldl-muster', 'ballaststoffe'];
    const rec = recs.find(r => want.includes(r.id) && (r.status === 'vorgeschlagen' || (foodAns && r.status === 'abgelehnt')));
    if (rec) out.push({
      id: `empfehlung-${rec.take.key || rec.id}`, area: 'ernaehrung', base: 65 + (foodAns ? 20 : 0) + (rec.lab_marker_id ? 5 : 0), lab: !!rec.lab_marker_id, canNow: rec.take.kind === 'routine', sig: `${rec.id}/${foodAns || ''}`,
      title: rec.take.kind === 'habit' ? `Gewohnheit: ${HABIT_LIBRARY[rec.take.key].name}` : 'Zweimal pro Woche eine Mahlzeit mit Haferflocken oder Hülsenfrüchten',
      why: `${rec.why}${foodAns ? ' Du hast diese Richtung selbst gewählt.' : ''}`,
      change: f => (rec.take.kind === 'routine' ? `${rec.action} Neue Routine dienstags und freitags um 07:30 Uhr, ${when(f)}.` : `${rec.action} Erscheint im Gewohnheiten-Raster.`),
      check: rec.take.kind === 'routine' ? 'In zwei Wochen prüfen, ob die Mahlzeit an beiden Tagen geklappt hat.' : 'An mindestens fünf Tagen pro Woche abhaken.',
      metric: rec.take.kind === 'routine' ? { type: 'routine', routine: `vorschlag-${rec.take.key}`, target: 2 } : { type: 'habits', target: 5 },
      evidence: { kind: 'rec', level: rec.evidence_strength, sources: rec.sources, text: 'Verknüpft mit Health Intelligence.' },
      build: (cc, from) => ({ fn: d => A.acceptRec(d, rec, cc, today, from) }),
    });
  }
  const hi = recs.find(r => r.status === 'vorgeschlagen' && r.id === 'sitzen-unterbrechen');
  if (hi && !out.some(x => x.id === 'pausen-anpassen')) out.push({
    id: `empfehlung-${hi.id}`, area: 'bewegung', base: 55, canNow: hi.take.kind === 'routine', sig: hi.id, title: hi.title, why: hi.why, change: f => `${hi.action}${hi.take.kind === 'routine' ? ` Gilt ${when(f)}.` : ''}`, check: 'In zwei Wochen prüfen, wie oft es geklappt hat.',
    metric: hi.take.kind === 'routine' ? { type: 'routine', routine: `vorschlag-${hi.take.key}`, target: 3 } : { type: 'habits', target: 4 },
    evidence: { kind: 'rec', level: hi.evidence_strength, sources: hi.sources, text: 'Verknüpft mit Health Intelligence.' }, build: (cc, from) => ({ fn: d => A.acceptRec(d, hi, cc, today, from) }),
  });
  if (kind !== 'week' && ans.fokus && ans.fokus !== c.goals[0] && c.goals.includes(ans.fokus)) out.push({
    id: `fokus-${ans.fokus}`, area: 'ziele', base: 90, canNow: false, immediate: true, sig: ans.fokus,
    title: `Fokus auf „${GOALS[ans.fokus]}“ legen`, why: 'Du hast diesen Bereich für den nächsten Monat gewählt.',
    change: () => `„${GOALS[ans.fokus]}“ wird Priorität 1. Das betrifft keine Termine, sondern den Hinweis auf „Heute“ und die Vorschläge.`,
    check: 'Im nächsten Monatsreview prüfen, ob der Fokus passt.', metric: null, evidence: planEvidence,
    build: cc => ({ cfg: { ...cc, goals: [ans.fokus, ...cc.goals.filter(g => g !== ans.fokus)] } }),
  });
  /* Relevanz: Grundgewicht plus Bezug zu deinen priorisierten Zielen */
  out.forEach(x => { const gi = Math.min(...(AREA_GOALS[x.area] || []).map(g => { const i = c.goals.indexOf(g); return i < 0 ? 99 : i; }), 99); x.score = x.base + (gi < 99 ? (6 - gi) * 4 : 0); });
  const picked = []; const areas = new Set();
  out.filter(x => !blocked(x)).sort((a, b) => b.score - a.score).forEach(x => { if (picked.length < max && !areas.has(x.area)) { picked.push(x); areas.add(x.area); } });
  if (picked.length < Math.min(max, 3) && !decidedHere.includes('fortfuehren') && (max > 1 || !picked.length)) picked.push({
    id: 'fortfuehren', area: 'alles', score: 0, sig: 'immer', canNow: false, title: picked.length ? 'Alles andere so fortführen' : 'Alles so fortführen',
    why: picked.length ? 'Was gut läuft, bleibt unverändert.' : 'Es gibt keinen klaren Anlass für eine Änderung. Stabilität ist auch ein Ergebnis.',
    change: () => 'Keine Änderung am Plan.', check: 'Beim nächsten Review vergleichen.', metric: null, evidence: planEvidence, build: () => ({}),
  });
  return picked;
}
/* Rein funktional, für Vorschau und Übernahme gleich. Standard: ab nächstem Montag. */
function applyMeasureState(data, cfg, measure, today, from) {
  const f = from || nextMonday(today);
  let c2 = normalizeConfig(cfg), d2 = data;
  const r = measure.build ? measure.build(c2, f) || {} : {};
  let kept = [];
  if (r.cfg) {
    c2 = normalizeConfig(r.cfg);
    const sync = syncPlanRoutines(d2.routines, c2, f);
    kept = sync.kept;
    d2 = materialize({ ...d2, routines: sync.routines }, today);
    d2 = { ...d2, habits: syncHabits(d2.habits, c2) };
  }
  if (r.fn) d2 = r.fn(d2);
  return { cfg: c2, data: d2, cfgChanged: !!r.cfg, kept, from: f };
}
const measureRecord = (m, decision, today, from) => ({ id: m.id, title: m.title, area: m.area, check: m.check, metric: m.metric || null, decision, decidedAt: today, validFrom: decision === 'übernommen' ? (from || nextMonday(today)) : null, sig: m.sig || null, lab: !!m.lab });
function evalMeasure(rec, data, today) {
  if (!rec || rec.decision !== 'übernommen' || !rec.metric) return null;
  const from = rec.validFrom || rec.decidedAt; const lastFull = addDays(weekStart(today), -1);
  const weeks = []; for (let s = weekStart(from); addDays(s, 6) <= lastFull; s = addDays(s, 7)) if (s >= weekStart(from)) weeks.push(s);
  if (rec.metric.type === 'routine') { const a = adherence(data.items, from, today, today, i => i.routine === rec.metric.routine); return a.eligible ? `${a.done} von ${a.eligible} Terminen erledigt` : 'noch keine Termine'; }
  if (!weeks.length) return 'noch keine abgeschlossene Woche';
  const hit = weeks.filter(s => rec.metric.type === 'training' ? trainingsInWeek(data, s) >= rec.metric.target
    : rec.metric.type === 'pauses' ? adherence(data.items, s, addDays(s, 6), today, isPause).done >= rec.metric.target
      : habitAdherence(data, s, addDays(s, 6), today).per.filter(h => h.done >= rec.metric.target).length > 0).length;
  return `in ${hit} von ${weeks.length} ${weeks.length === 1 ? 'Woche' : 'Wochen'} erreicht`;
}
function runningMeasures(data, keys, today) {
  return Object.entries(data.reviews || {}).filter(([k, r]) => !keys.includes(k) && r.status === 'abgeschlossen').sort((a, b) => (b[1].at || '').localeCompare(a[1].at || '')).slice(0, 3)
    .flatMap(([, r]) => (r.measures || []).filter(x => x.decision === 'übernommen' && x.id !== 'fortfuehren')).filter((x, i, arr) => arr.findIndex(y => y.id === x.id && y.decidedAt === x.decidedAt) === i).map(x => ({ ...x, status: evalMeasure(x, data, today) }));
}
const persistableReviews = rs => Object.fromEntries(Object.entries(rs || {}).map(([k, r]) => [k, { kind: r.kind, status: r.status, at: r.at || null, snoozedUntil: r.snoozedUntil || null, questionIds: r.questionIds || [], mode: r.mode || null, combined: !!r.combined, measures: (r.measures || []).filter(x => !x.lab).map(({ lab, ...x }) => x), demo: !!r.demo }]));

/* ---------- Oberfläche ---------- */
function MiniStat({ label, value, sub }) { return <div className="mini"><span className="mini-l">{label}</span><b>{value}</b>{sub && <small>{sub}</small>}</div>; }
function MeasureEvidence({ e }) {
  if (!e) return null;
  if (e.kind === 'plan') return <p className="hint top0"><Icon name="info" size={14} /> {e.text}</p>;
  return <div className="m-ev"><EvidenceBadge level={e.level} /><span>{e.text}</span>{(e.sources || []).map(k => EVIDENCE[k] && <a key={k} className="ext" href={EVIDENCE[k].url} target="_blank" rel="noopener noreferrer">{EVIDENCE[k].publisher.split(',')[0]}</a>)}</div>;
}
function MeasureCard({ m, n, decision, data, cfg, today, onDecide, onUndo, canUndo }) {
  const [confirm, setConfirm] = useState(false);
  const [from, setFrom] = useState(nextMonday(today));
  const prev = useMemo(() => (confirm ? applyMeasureState(data, cfg, m, today, from) : null), [confirm, from, data, cfg]);
  const diff = prev ? planDiff(data.items, prev.data.items, today) : null;
  const conflicts = prev && diff ? findConflicts(prev.data.items, diff.changes.map(x => x.it.date)) : [];
  const noChange = m.id === 'fortfuehren';
  const habitNote = prev && JSON.stringify(prev.data.habits) !== JSON.stringify(data.habits) ? 'Gewohnheiten: Änderung im Raster.' : '';
  const cfgNote = prev && prev.cfgChanged ? 'Einstellung wird angepasst.' : '';
  return <article className={`measure ${decision ? 'decided' : ''}`} aria-label={`Maßnahme ${n}: ${m.title}`}>
    <div className="m-head"><span className="m-n" aria-hidden="true">{n}</span><h3 className="m-title">{m.title}</h3></div>
    <dl className="m-dl"><dt>Warum</dt><dd>{m.why}</dd><dt>Was sich ändert</dt><dd>{m.change(from)}</dd><dt>So prüfst du den Erfolg</dt><dd>{m.check}</dd></dl>
    <MeasureEvidence e={m.evidence} />
    {decision ? <div className="m-decided-row"><p className="m-decided"><Icon name={decision === 'übernommen' ? 'check' : 'minus'} size={16} /> {decision === 'übernommen' ? (noChange ? 'Beschlossen' : 'Übernommen') : 'Nicht jetzt'}</p>
      {canUndo && <button className="btn small ghost" onClick={() => onUndo(m)}>Rückgängig machen</button>}</div>
      : confirm ? <div className="m-confirm">
        {m.canNow && <fieldset className="scope"><legend className="field-label">Ab wann?</legend>
          {[[nextMonday(today), `Ab nächstem Montag, ${fmtDM(nextMonday(today))}`, 'Empfohlen. Die laufende Woche bleibt unverändert.'], [today, 'Ab sofort', 'Termine ab heute werden angepasst. Erledigtes bleibt.']].map(([v, l, h]) =>
            <label key={v} className={`radio ${from === v ? 'on' : ''}`}><input type="radio" name={`ab-${m.id}`} checked={from === v} onChange={() => setFrom(v)} /><span><b>{l}</b><small>{h}</small></span></label>)}
        </fieldset>}
        {noChange ? <p className="top0">Es wird nichts geändert.</p> : <ChangePreview diff={diff} conflicts={conflicts} all empty={[cfgNote, habitNote].filter(Boolean).join(' ') || (m.immediate ? 'Keine Termine betroffen. Gilt sofort.' : 'Keine Termine im geplanten Zeitraum betroffen.')} />}
        {prev && prev.kept.length > 0 && <p className="hint">Von dir angepasst und daher unverändert: {prev.kept.map(r => (versionAt(r, today) || r.versions[0]).title).join(', ')}.</p>}
        <div className="btn-row"><button className="btn small primary" onClick={() => { onDecide(m, 'übernommen', from); setConfirm(false); }}>Bestätigen</button><button className="btn small ghost" onClick={() => setConfirm(false)}>Abbrechen</button></div>
      </div>
        : <div className="btn-row"><button className="btn small primary" onClick={() => setConfirm(true)}>{noChange ? 'Beschließen' : 'Vorschau und übernehmen'}</button><button className="btn small ghost" onClick={() => onDecide(m, 'nicht jetzt')}>Nicht jetzt</button></div>}
  </article>;
}
function Question({ q, value, onChange, note, onNote }) {
  return <fieldset className="q"><legend className="q-text">{q.text}</legend>
    <Chips options={q.options} value={value || ''} onChange={v => onChange(value === v ? undefined : v)} />
    {(value === 'anderes' || q.id === 'gut') && <input className="input" value={note || ''} onChange={e => onNote(e.target.value)} placeholder="Optional: in eigenen Worten" aria-label="Eigene Notiz, wird nicht gespeichert" />}
  </fieldset>;
}
function RunningMeasures({ list }) {
  if (!list.length) return null;
  return <section className="r-sec"><h3 className="h3 top0">Laufende Maßnahmen zuerst</h3>
    <ul className="plain">{list.map(x => <li key={x.id + x.decidedAt}><b>{x.title}</b><br /><small>Ziel: {x.check} Stand: {x.status || 'noch keine Auswertung möglich'}.</small></li>)}</ul></section>;
}
function CoverageNote({ text }) { return text ? <p className="callout gap"><Icon name="info" size={14} /> {text}</p> : null; }
function WeekSummary({ m }) {
  const wDelta = m.weight && m.weightPrev ? m.weight.avg - m.weightPrev.avg : null;
  const noPlan = m.coverage === 'keine';
  return <>
    {noPlan && <CoverageNote text="Für diese Woche liegen keine Plan-Daten vor. Es gibt daher nichts zu bewerten, das ist kein Rückstand." />}
    {m.coverage === 'teilweise' && <CoverageNote text="Die Planung beginnt mitten in dieser Woche. Werte vor dem Start fließen nicht ein." />}
    <div className="minis">
      <MiniStat label="Training" value={noPlan ? 'keine Daten' : m.goal ? `${m.trDone} von ${m.goal}` : `${m.trDone}`} sub={noPlan ? '' : m.goal ? (m.trDone >= m.goal ? 'Ziel dieser Woche erreicht' : m.trOpen ? `${m.trOpen} noch geplant` : `Ziel dieser Woche: ${m.goal}`) : 'kein Ziel in dieser Woche'} />
      <MiniStat label="Bewegungspausen" value={m.pauses.eligible ? `${m.pauses.done} von ${m.pauses.eligible}` : 'keine Daten'} sub={m.pauseMissed ? `${m.pauseMissed} verpasst, abgeschlossen` : m.pauses.eligible ? 'nichts verpasst' : ''} />
      <MiniStat label="Gewohnheiten" value={m.habits.eligible ? `${pct(m.habits.done, m.habits.eligible)} %` : 'keine Einträge'} sub={m.habits.eligible ? `${m.habits.done} von ${m.habits.eligible} Haken` : ''} />
      <MiniStat label="Gewicht" value={wDelta != null ? `${signed(wDelta)} kg` : m.weight ? `${m.weight.n} Messung${m.weight.n > 1 ? 'en' : ''}` : 'nicht erfasst'} sub={wDelta != null ? 'Ø ggü. Vorwoche' : m.weight ? 'kein Vergleich möglich' : 'optional'} />
      <MiniStat label="Schritte" value={m.steps ? `Ø ${fmtNum(m.steps.avg)}` : 'nicht erfasst'} sub={m.steps ? `an ${m.steps.n} von 7 Tagen` : 'optional'} />
      <MiniStat label="Mahlzeiten" value={`${m.nutDays} von ${m.nutDue}`} sub={m.nutFull ? `${m.nutFull} Tage vollständig` : 'Tage erfasst'} />
    </div>
    {m.routines.length > 0 && <section className="r-sec"><h3 className="h3 top0">Routinen</h3><ul className="bars">{[...m.routines].sort((a, b) => b.rate - a.rate).map(r => <li key={r.id}><span>{r.title}</span><Progress value={r.done} max={r.eligible} label={r.title} /><small>{r.done} von {r.eligible}</small></li>)}</ul></section>}
    <p className="callout"><Icon name="info" size={14} /> Verpasste Tagesaufgaben wie Bewegungspausen sind abgeschlossen. Sie werden nicht nachgeholt und erzeugen keine neuen Aufgaben.</p>
  </>;
}
function PosNeg({ m }) {
  return <>
    <section className="r-sec"><h3 className="h3 top0">Was gut lief</h3>{m.positives.length ? <ul className="plain good">{m.positives.map(x => <li key={x}>{x}</li>)}</ul> : <p className="hint top0">{m.coverage === 'keine' ? 'Ohne Daten gibt es hier nichts auszuwerten.' : 'Diese Woche gab es keine besonderen Ausschläge. Das ist in Ordnung.'}</p>}</section>
    <section className="r-sec"><h3 className="h3 top0">Mögliche Hindernisse</h3>{m.obstacles.length ? <ul className="plain">{m.obstacles.map(x => <li key={x}>{x}</li>)}</ul> : <p className="hint top0">Keine auffälligen Hindernisse in deinen Einträgen.</p>}
      <p className="hint">Das sind Beobachtungen aus deinen Einträgen, keine Erklärungen. Warum etwas so war, weißt du am besten.</p></section>
  </>;
}
function MonthSummary({ m, showCurrent }) {
  const rate = (a, cov) => (a && a.eligible ? `${pct(a.done, a.eligible)} %${cov < 30 ? ` (Daten aus ${cov} von 30 Tagen)` : ''}` : 'keine Daten');
  const wc = x => (x && x.delta != null ? `${signed(x.delta)} kg (${x.n} Messungen)` : `zu wenige Messungen${x ? ` (${x.n})` : ''}`);
  const tr = a => (a.avg != null ? `Ø ${fmtNum(a.avg, 1)} bei Ziel Ø ${fmtNum(a.goal, 1)} (${a.n} Wochen)` : `zu wenige vollständige Wochen (${a.n})`);
  return <>
    <p className="hint top0">Zeitraum bis {fmtDM(m.end)}. {m.planStart ? `Plan-Daten seit ${fmtDM(m.planStart)}${yy(m.planStart)}.` : 'Noch keine Plan-Daten.'} Fehlende Daten werden nicht geschätzt und nicht als 0 gezählt. Bewusst ohne Gesamtscore.</p>
    <div className="table-scroll"><table className="tbl cmp"><caption className="sr">Vergleich der Zeiträume</caption><thead><tr><th scope="col">Bereich</th><th scope="col">Letzte 30 Tage</th><th scope="col">30 Tage davor</th><th scope="col">90 Tage oder länger</th></tr></thead><tbody>
      <tr><th scope="row">Training pro Woche</th><td>{tr(m.training.now)}</td><td>{tr(m.training.prev)}</td><td>12 Wochen: {tr(m.training.w12)}</td></tr>
      <tr><th scope="row">Bewegungspausen</th><td>{rate(m.pauses.now, m.cov30)}</td><td>{rate(m.pauses.prev, m.cov60)}</td><td>nicht genug Daten</td></tr>
      <tr><th scope="row">Gewohnheiten</th><td>{rate(m.habits.now, 30)}</td><td>{rate(m.habits.prev, 30)}</td><td>nicht genug Daten</td></tr>
      <tr><th scope="row">Gewicht</th><td>{wc(m.weight.wc30)}</td><td>–</td><td>90 Tage: {wc(m.weight.wc90)}{m.weight.wcAll ? `, gesamt seit ${fmtDM(m.weight.firstW)}: ${wc(m.weight.wcAll)}` : ''}</td></tr>
      <tr><th scope="row">Schritte</th><td>{m.steps.now ? `Ø ${fmtNum(m.steps.now.avg)} an ${m.steps.now.n} Tagen` : 'nicht erfasst'}</td><td>{m.steps.prev ? `Ø ${fmtNum(m.steps.prev.avg)} an ${m.steps.prev.n} Tagen` : 'nicht erfasst'}</td><td>–</td></tr>
      <tr><th scope="row">Mahlzeiten erfasst</th><td>{m.nutDays ? `${m.nutDays} Tage` : 'nicht erfasst'}</td><td>–</td><td>–</td></tr>
    </tbody></table></div>
    <div className="panel">
      <BarChart data={m.training.series} goal={m.training.goalNow || null} goalLabel="Ziel aktuell" label="Trainingseinheiten der letzten zwölf Wochen" table="Einheiten" extraCol={['Ziel damals', d => (d.goal == null ? '–' : d.goal)]} coverageCol />
      <p className="legend"><span className="lg-bar" /> vollständig <span className="lg-bar faint" /> unvollständig <span className="lg-missing" /> Datenlücke</p>
      <CoverageNote text={m.training.gaps} />
    </div>
  </>;
}
function MonthGoals({ m }) {
  return <>
    <section className="r-sec"><h3 className="h3 top0">Ziele und Trend</h3><ul className="list">{m.goals.map(x => <li key={x.g} className="row compact"><div className="row-main static"><span className="row-title">{GOALS[x.g]}</span><span className="row-meta"><span>{x.status}</span><span className="tag tag-muted">{x.trend}</span></span></div></li>)}</ul>
      <p className="hint">Trends vergleichen die letzten 30 Tage mit den 30 Tagen davor, nur wenn beide Zeiträume ausreichend erfasst sind. Trainingsziele werden mit dem damals geltenden Ziel verglichen. Gewicht wird nur beschrieben, nicht bewertet.</p></section>
    <section className="r-sec"><h3 className="h3 top0">Routinen in den letzten 4 Wochen</h3>
      {m.good.length > 0 && <><p className="sub-l">Funktioniert gut</p><ul className="bars">{m.good.map(r => <li key={r.id}><span>{r.title}</span><Progress value={r.done} max={r.eligible} label={r.title} /><small>{r.done} von {r.eligible}</small></li>)}</ul></>}
      {m.problem.length > 0 && <><p className="sub-l">Schwierig</p><ul className="bars">{m.problem.map(r => <li key={r.id}><span>{r.title}</span><Progress value={r.done} max={r.eligible} label={r.title} /><small>{r.done} von {r.eligible}</small></li>)}</ul></>}
      {!m.good.length && !m.problem.length && <p className="hint top0">Noch zu wenige Termine für eine Einordnung. Das ist kein Problem, nur eine Datenlücke.</p>}
    </section>
  </>;
}
function MonthHealth({ ctx }) {
  const { data, cfg, today } = ctx;
  const recs = computeRecs(data, cfg, today);
  const labs = Object.keys(LAB_MARKERS).map(k => ({ k, a: labAssessment(data.labs, k, today) }));
  return <>
    <section className="r-sec"><h3 className="h3 top0">Empfehlungen mit Evidenz</h3>
      {recs.length ? <ul className="list">{recs.map(r => <li key={r.id} className="row compact"><button className="row-main" onClick={() => ctx.openSheet({ kind: 'rec', id: r.id })}><span className="row-title">{r.title}</span><span className="row-meta"><EvidenceBadge level={r.evidence_strength} /><span>{REC_STATUS[r.status]}</span>{r.lab_marker_id && <span>Demo-Laborwert</span>}</span></button></li>)}</ul> : <p className="hint top0">Keine passenden Empfehlungen.</p>}</section>
    <section className="r-sec"><h3 className="h3 top0">Laborwerte (fiktive Demo)</h3><ul className="plain">{labs.map(({ k, a }) => <li key={k}><b>{LAB_MARKERS[k].label}:</b> {a.state === 'auffaellig' ? `letzter Wert ${a.latest.value} ${a.latest.unit} außerhalb der Laborreferenz` : a.state === 'unauffaellig' ? 'innerhalb der Laborreferenz' : a.state === 'fehlt' ? 'kein Wert' : `keine Auswertung, ${a.reason}`}</li>)}</ul>
      <p className="hint">Keine Diagnose. Laborbefunde gehören in ärztliche Einordnung. Laborbezogene Inhalte werden nicht gespeichert.</p></section>
  </>;
}
function ShortSummary({ wm, mm }) {
  const items = [];
  if (wm.coverage === 'keine') items.push('Für die Woche liegen keine Plan-Daten vor.');
  else {
    items.push(wm.goal ? `Training: ${wm.trDone} von ${wm.goal}.` : `Training: ${wm.trDone}.`);
    if (wm.positives[0]) items.push(wm.positives.find(p => !p.startsWith('Trainingsziel') && !p.includes('Trainingseinheit')) || wm.positives[0]);
    if (wm.obstacles[0]) items.push(wm.obstacles[0]);
  }
  if (mm) items.push(mm.training.now.avg != null ? `Monat: Ø ${fmtNum(mm.training.now.avg, 1)} Trainings pro Woche in ${mm.training.now.n} vollständigen Wochen.` : 'Monat: zu wenige vollständige Wochen für einen Durchschnitt.');
  return <ul className="plain short">{items.slice(0, 4).map(x => <li key={x}>{x}</li>)}</ul>;
}
const STEPS = {
  week: { voll: [['woche', 'Deine Woche'], ['muster', 'Gut gelaufen und Hindernisse'], ['fragen', 'Kurz nachgedacht'], ['massnahmen', 'Was passen wir an?'], ['fertig', 'Abschluss']], kurz: [['kurz', 'Das Wichtigste'], ['massnahmen', 'Eine Anpassung'], ['fertig', 'Abschluss']] },
  month: { voll: [['status', 'Dein Monat'], ['ziele', 'Ziele und Routinen'], ['gesundheit', 'Gesundheit und Empfehlungen'], ['woche', 'Letzte Woche im Detail'], ['fragen', 'Kurz nachgedacht'], ['massnahmen', 'Prioritäten für den nächsten Monat'], ['fertig', 'Abschluss']], kurz: [['kurz', 'Das Wichtigste'], ['massnahmen', 'Eine Anpassung'], ['fertig', 'Abschluss']] },
  combined: { voll: [['status', 'Dein Monat'], ['wochekomplett', 'Deine Woche'], ['ziele', 'Ziele und Routinen'], ['gesundheit', 'Gesundheit und Empfehlungen'], ['fragen', 'Kurz nachgedacht'], ['massnahmen', 'Was passen wir an?'], ['fertig', 'Abschluss']], kurz: [['kurz', 'Das Wichtigste'], ['massnahmen', 'Eine Anpassung'], ['fertig', 'Abschluss']] },
};
function ReviewFlow({ review, ctx, answers, setAnswers, onDecide, onUndo, undoable, onFinish, onSnooze, onSkip, close, startStep = 0 }) {
  const { data, cfg, today } = ctx;
  const mode = review.mode === 'kurz' ? 'kurz' : 'voll';
  const steps = STEPS[review.kind][mode];
  const [i, setI] = useState(startStep);
  const [confirmBoth, setConfirmBoth] = useState(false);
  const ref = useRef(null), titleRef = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; if (titleRef.current) titleRef.current.focus(); }, [i]);
  useEffect(() => { const k = e => { if (e.key === 'Escape') close(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  const wPeriod = review.weekPeriod || weeklyWindow(today, cfg).target;
  const wm = useMemo(() => weekMetrics(data, wPeriod, today, cfg), [review.key]);
  const mm = useMemo(() => (review.kind !== 'week' ? monthMetrics(data, review.period, today, cfg) : null), [review.key]);
  const merged = review.kind === 'week' ? wm : { ...wm, ...mm, ws: wm.ws, goal: wm.goal };
  const questions = useMemo(() => (mode === 'kurz' ? [] : pickQuestions(review.kind, merged, cfg, previousQuestionIds(data, review.kind, review.key))), [review.key, mode]);
  const k = steps[i][0];
  const maxNew = mode === 'kurz' ? 1 : 3;
  const ansKey = JSON.stringify(answers);
  /* Vorschläge werden bei geänderten Antworten neu berechnet. Bereits entschiedene bleiben unverändert. */
  const measures = useMemo(() => (k === 'massnahmen' ? coachMeasures(review.kind === 'week' ? 'week' : 'month', review.kind === 'week' ? wm : { ...mm, weakHabit: wm.weakHabit, pauseHist2: wm.pauseHist2 }, answers, data, cfg, today, review.keys, maxNew) : []), [k, ansKey, data, cfg]);
  const [lastAns, setLastAns] = useState(null);
  useEffect(() => { if (k === 'massnahmen') setLastAns(a => (a === null ? ansKey : a)); }, [k]);
  const recs = review.keys.map(x => (data.reviews || {})[x] || {});
  const decidedList = recs.flatMap(r => r.measures || []).filter((x, n, arr) => arr.findIndex(y => y.id === x.id) === n);
  const decisions = Object.fromEntries(decidedList.map(x => [x.id, x.decision]));
  const done = recs.every(r => r.status === 'abgeschlossen');
  const running = useMemo(() => runningMeasures(data, review.keys, today), [review.key]);
  const setA = (id, v) => setAnswers({ ...answers, [id]: v });
  const legacy = decidedList.filter(x => !measures.some(m => m.id === x.id));
  const newOnes = done ? [] : measures.filter(m => !decisions[m.id]).slice(0, Math.max(0, maxNew - decidedList.filter(x => x.id !== 'fortfuehren').length));
  const shownMeasures = measures.filter(m => decisions[m.id]).concat(newOnes);
  const cfgNow = normalizeConfig(cfg);
  return <div className="ob review" role="dialog" aria-modal="true" aria-labelledby="rv-title">
    <div className="ob-inner">
      <div className="ob-top">
        <div className="ob-progress" style={{ gridTemplateColumns: `repeat(${steps.length},1fr)` }} aria-hidden="true">{steps.map((_, n) => <span key={n} className={n <= i ? 'on' : ''} />)}</div>
        <div className="ob-meta"><span aria-live="polite">{review.label}{mode === 'kurz' ? ', Kurzfassung' : ''}, Schritt {i + 1} von {steps.length}</span><button className="link" onClick={close}>Schließen</button></div>
      </div>
      <div className="ob-body" ref={ref}>
        <h1 id="rv-title" className="ob-title" tabIndex={-1} ref={titleRef}>{steps[i][1]}</h1>
        {i === 0 && <p className="ob-lead">{review.kind === 'week' ? `Woche vom ${fmtDM(wPeriod)} bis ${fmtDM(addDays(wPeriod, 6))}.` : review.kind === 'combined' ? `${review.sub}. Ein gemeinsamer Ablauf, Kennzahlen und Fragen erscheinen nur einmal.` : `${fmtYm(review.period)}.`} Etwa {mode === 'kurz' ? '1 bis 2' : review.minutes} Minuten.{done ? ' Dieses Review ist bereits abgeschlossen, du siehst es noch einmal an.' : ''}</p>}
        {k === 'kurz' && <><ShortSummary wm={wm} mm={mm} /><RunningMeasures list={running} /><p className="hint">Verpasste Tagesaufgaben sind abgeschlossen und werden nicht nachgeholt.</p></>}
        {k === 'woche' && <WeekSummary m={wm} />}
        {k === 'wochekomplett' && <><WeekSummary m={wm} /><PosNeg m={wm} /></>}
        {k === 'muster' && <PosNeg m={wm} />}
        {k === 'status' && <MonthSummary m={mm} />}
        {k === 'ziele' && <MonthGoals m={mm} />}
        {k === 'gesundheit' && <MonthHealth ctx={ctx} />}
        {k === 'fragen' && <>
          <p className="ob-lead">Tippen genügt, alles ist freiwillig. Antworten fließen nur in die Vorschläge dieses Reviews ein und werden nicht gespeichert. Du kannst sie jederzeit ändern, die Vorschläge passen sich an.</p>
          {questions.map(q => <Question key={q.id} q={q} value={answers[q.id]} onChange={v => setA(q.id, v)} note={answers[`${q.id}:notiz`]} onNote={v => setA(`${q.id}:notiz`, v)} />)}
        </>}
        {k === 'massnahmen' && <>
          <RunningMeasures list={mode === 'kurz' ? [] : running} />
          <p className="ob-lead">{mode === 'kurz' ? 'Höchstens eine Anpassung.' : 'Höchstens drei neue Vorschläge, nach Relevanz sortiert.'} Nichts ändert sich ohne deine Bestätigung. Planänderungen gelten standardmäßig ab {fmtDM(nextMonday(today))}.</p>
          {lastAns !== null && lastAns !== ansKey && <p className="callout" role="status">Die Vorschläge wurden nach deinen geänderten Antworten neu berechnet.</p>}
          <div className="measures">
            {legacy.map((x, n) => <article key={x.id} className="measure decided"><div className="m-head"><span className="m-n">{n + 1}</span><h3 className="m-title">{x.title}</h3></div><dl className="m-dl"><dt>So prüfst du den Erfolg</dt><dd>{x.check}</dd></dl>
              <div className="m-decided-row"><p className="m-decided"><Icon name={x.decision === 'übernommen' ? 'check' : 'minus'} size={16} /> {x.decision === 'übernommen' ? 'Übernommen' : 'Nicht jetzt'}{x.validFrom ? ` ab ${fmtDM(x.validFrom)}` : ''}</p>{undoable(review, x.id) && <button className="btn small ghost" onClick={() => onUndo(review, x)}>Rückgängig machen</button>}</div></article>)}
            {shownMeasures.map((m, n) => <MeasureCard key={m.id} m={m} n={n + 1 + legacy.length} decision={decisions[m.id]} data={data} cfg={cfg} today={today} onDecide={(mm2, dec, from) => onDecide(review, mm2, dec, from)} onUndo={mm2 => onUndo(review, mm2)} canUndo={undoable(review, m.id)} />)}
            {!legacy.length && !shownMeasures.length && <Empty text="Keine neuen Vorschläge. Es gibt keinen neuen Anlass für eine Änderung." />}
          </div>
        </>}
        {k === 'fertig' && <>
          <section className="r-sec"><h3 className="h3 top0">Beschlossen</h3>{decidedList.filter(x => x.decision === 'übernommen').length ? <ul className="plain">{decidedList.filter(x => x.decision === 'übernommen').map(x => <li key={x.id}><b>{x.title}</b>{x.validFrom ? ` (ab ${fmtDM(x.validFrom)})` : ''}<br /><small>{x.check}</small></li>)}</ul> : <p className="hint top0">Keine Änderung beschlossen. Auch das ist eine Entscheidung.</p>}</section>
          {review.kind === 'combined' && !done && <label className="toggle confirm-both"><input type="checkbox" checked={confirmBoth} onChange={e => setConfirmBoth(e.target.checked)} /><span>Wochen-Check-in KW {isoWeek(review.weekPeriod)} und Monatsreview {fmtYm(review.period)} gemeinsam abschließen</span></label>}
          <p className="hint">{review.kind !== 'month' ? `Nächster Check-in: ${WD_LONG[cfgNow.review.weeklyDay]}, ${cfgNow.review.weeklyTime} Uhr.` : 'Nächstes Monatsreview zum Monatsende.'} Vergangene Reviews findest du unter Entwicklung.</p>
          <p className="hint">Gespeichert werden nur Status, Datum und beschlossene Plan-Maßnahmen. Antworten und Notizen nicht.</p>
        </>}
      </div>
      <div className="ob-foot">
        {i > 0 ? <button className="btn ghost" onClick={() => setI(i - 1)}>Zurück</button> : <button className="link" onClick={onSnooze}>Morgen erinnern</button>}
        {i === 0 && !done ? <button className="link" onClick={onSkip}>Überspringen</button> : <span />}
        {k !== 'fertig' ? <button className="btn primary" onClick={() => setI(i + 1)}>Weiter</button>
          : <button className="btn primary" disabled={review.kind === 'combined' && !done && !confirmBoth} onClick={() => onFinish(review, questions.map(q => q.id), mode)}>{done ? 'Schließen' : review.kind === 'combined' ? 'Beide abschließen' : 'Abschließen'}</button>}
      </div>
    </div>
  </div>;
}
function ReviewCard({ ctx }) {
  const { data, cfg, today, nowMin, startReview, snoozeReview, skipReview } = ctx;
  const offer = reviewOffer(data, cfg, today, nowMin);
  if (offer) return <section className="block" aria-labelledby="rv-h">
    <div className="review-card">
      <div className="rc-icon" aria-hidden="true"><Icon name="spark" size={20} /></div>
      <div>
        <h2 className="h2 top0" id="rv-h">{offer.label}</h2>
        <p className="hint top0">{offer.sub ? `${offer.sub}, ` : ''}etwa {offer.minutes} Minuten. Kurz zurückschauen und gemeinsam anpassen, was nicht passt. Die Kurzfassung dauert 1 bis 2 Minuten.</p>
        <div className="btn-row"><button className="btn small primary" onClick={() => startReview(offer)}>Starten</button><button className="btn small" onClick={() => startReview({ ...offer, mode: 'kurz' })}>Kurzfassung</button><button className="btn small ghost" onClick={() => snoozeReview(offer)}>Morgen</button><button className="btn small ghost" onClick={() => skipReview(offer)}>Diesmal überspringen</button></div>
      </div>
    </div>
  </section>;
  const w = weeklyDescriptor(today, cfg); const r = (data.reviews || {})[w.key];
  const next = nextWeeklyDate(today, cfg, data);
  if (r && r.status === 'abgeschlossen' && r.at === today) return <p className="review-done"><Icon name="check" size={16} /> Check-in erledigt.{next ? ` Der nächste ist am ${dayLabel(next, today)}.` : ''}</p>;
  return null;
}
function ReviewHistory({ ctx }) {
  const { data, today, cfg, startReview } = ctx;
  const [showNow, setShowNow] = useState(false);
  const entries = Object.entries(data.reviews || {}).sort((a, b) => b[0].localeCompare(a[0]));
  const weekly = entries.filter(([, r]) => r.kind === 'week').slice(0, 8);
  const goalNow = goalAt(data, weekStart(today));
  const ym = monthlyTarget(today) || ymOf(today);
  return <section className="block first">
    <h2 className="h2">Reviews</h2>
    <div className="btn-row top0">
      <button className="btn small primary" onClick={() => startReview(weeklyDescriptor(today, cfg))}>Wochen-Check-in öffnen</button>
      <button className="btn small" onClick={() => startReview(monthlyDescriptor(ym))}>Monatsreview öffnen</button>
    </div>
    {weekly.length > 0 ? <>
      <label className="toggle"><input type="checkbox" checked={showNow} onChange={e => setShowNow(e.target.checked)} /><span>Aktuelles Ziel ({goalNow}) zum Vergleich zeigen</span></label>
      <div className="table-scroll"><table className="tbl cmp"><caption className="sr">Vergangene Wochen-Check-ins</caption><thead><tr><th scope="col">Woche</th><th scope="col">Status</th><th scope="col">Training (Ziel damals)</th>{showNow && <th scope="col">Ziel aktuell</th>}<th scope="col">Pausen</th><th scope="col">Maßnahmen</th></tr></thead><tbody>
        {weekly.map(([k, r]) => { const ws = k.slice(2); const cov = weekCoverage(data, ws, today); const pa = adherence(data.items, ws, addDays(ws, 6), today, isPause); const g = goalAt(data, ws); return <tr key={k}>
          <td>KW {isoWeek(ws)}{r.demo ? ' (Demo)' : ''}{r.combined ? ', mit Monat' : ''}{r.mode === 'kurz' ? ', kurz' : ''}</td><td>{REVIEW_STATUS[r.status]}</td>
          <td>{cov === 'keine' ? 'keine Daten' : `${trainingsInWeek(data, ws)} von ${g}`}</td>{showNow && <td>{goalNow}</td>}
          <td>{pa.eligible ? `${pa.done} von ${pa.eligible}` : 'keine Daten'}</td>
          <td>{(r.measures || []).filter(x => x.decision === 'übernommen').map(x => <span key={x.id} className="m-line">{x.title}{evalMeasure(x, data, today) ? `: ${evalMeasure(x, data, today)}` : ''}</span>)}{!(r.measures || []).some(x => x.decision === 'übernommen') && '–'}</td></tr>; })}
      </tbody></table></div></> : <Empty text="Noch keine Reviews. Der erste Check-in erscheint zum eingestellten Zeitpunkt auf Heute." />}
    {entries.filter(([, r]) => r.kind === 'month').length > 0 && <p className="hint">Monatsreviews: {entries.filter(([, r]) => r.kind === 'month').map(([k, r]) => `${fmtYm(k.slice(2))} ${REVIEW_STATUS[r.status].toLowerCase()}`).join(', ')}.</p>}
    <p className="hint">Werte werden aus dem Plan neu berechnet. Das Trainingsziel ist das damals geltende Ziel aus den Routinenversionen. Antworten aus Reviews werden nicht gespeichert.</p>
  </section>;
}
function StepReviews({ cfg, setCfg }) {
  const r = cfg.review; const set = (k, v) => setCfg(c => ({ ...c, review: { ...c.review, [k]: v } }));
  return <>
    <Field label="Wochen-Check-in am"><Chips small options={WD.map((w, i) => [i, w])} value={r.weeklyDay} onChange={v => set('weeklyDay', v)} /></Field>
    <Field label="Uhrzeit"><input className="input" type="time" value={r.weeklyTime} onChange={e => set('weeklyTime', e.target.value)} /></Field>
    <Toggle checked={r.monthly} onChange={v => set('monthly', v)}>Monatsreview zum Monatsende anbieten</Toggle>
    <p className="hint">{r.weeklyDay >= 4 ? `Am ${WD_LONG[r.weeklyDay]} blickst du auf die laufende Woche zurück, verfügbar bis Mittwoch der Folgewoche.` : `Am ${WD_LONG[r.weeklyDay]} blickst du auf die Vorwoche zurück, verfügbar für drei Tage.`} Fallen Wochen- und Monatsreview zusammen, gibt es einen gemeinsamen Ablauf.</p>
  </>;
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

function StepWeight({ body, setBody }) {
  const err = validateWeight(body.weight);
  return <>
    <Field label="Aktuelles Gewicht in kg (optional)"><input className="input" inputMode="decimal" value={body.weight} onChange={e => setBody(b => ({ ...b, weight: e.target.value }))} placeholder="z. B. 84,6" /></Field>
    <p className="hint top0">Nur für diese Sitzung als erste Messung. Wird nicht gespeichert. In der Demo bitte nur fiktive Werte.</p>
    {err && <p className="err" role="alert">{err}</p>}
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
function StepNutrition({ cfg, setCfg, onTouch, body, setBody }) {
  const n = cfg.nutrition; const set = k => setSec(setCfg, 'nutrition', k);
  return <>
    <Toggle checked={n.calories} onChange={v => setCfg(c => ({ ...c, nutrition: { ...c.nutrition, calories: v, habitsFirst: v ? false : c.nutrition.habitsFirst } }))}>Kalorien und Makros erfassen</Toggle>
    <Toggle checked={n.habitsFirst} onChange={v => setCfg(c => ({ ...c, nutrition: { ...c.nutrition, habitsFirst: v, calories: v ? false : c.nutrition.calories } }))}>Zunächst nur Ernährungsgewohnheiten verbessern, ohne Kalorien</Toggle>
    <Toggle checked={n.weight} onChange={set('weight')}>Gewicht tracken</Toggle>
    {n.weight && <Field label="Wie oft wiegen?"><Chips options={[[1, '1× pro Woche'], [2, '2×'], [3, '3×']]} value={n.weightPerWeek} onChange={set('weightPerWeek')} /></Field>}
    {n.weight && body && setBody && <StepWeight body={body} setBody={setBody} />}
    {n.weight && <p className="hint top0">Gewicht erfassen ist optional. Fehlt eine Messung, gilt sie als nicht erfasst, nicht als Rückstand.</p>}
    <h3 className="h3">Gewohnheiten</h3>
    <Chips multi options={Object.entries(HABIT_LIBRARY).filter(([k]) => k !== 'vielfalt').map(([k, h]) => [k, h.name])} value={cfg.habits} onChange={v => { onTouch && onTouch(); setCfg(c => ({ ...c, habits: v.slice(0, 5) })); }} />
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
  ['ziele', 'Was möchtest du erreichen?', 'Wähle aus und sortiere nach Wichtigkeit.'],
  ['arbeit', 'Dein Arbeitsalltag', 'Damit Pausen und Training in deinen Tag passen.'],
  ['pausen', 'Bewegung während der Arbeit', 'Kurze Pausen, die realistisch in den Alltag passen.'],
  ['training', 'Training', 'Wo, wie oft und wann du trainieren möchtest.'],
  ['ernaehrung', 'Ernährung und Tracking', 'Was du festhalten möchtest. Alles optional.'],
  ['erinnerungen', 'Hinweise und Motivation', 'Wie deutlich HealthOS dich erinnern soll.'],
  ['plan', 'Dein Wochenplan', 'Prüfe den Vorschlag. Alles bleibt später in den Einstellungen änderbar.'],
];
function StepContent({ k, cfg, setCfg, body, setBody, onTouch }) {
  if (k === 'ziele') return <StepGoals cfg={cfg} setCfg={setCfg} />;
  if (k === 'arbeit') return <StepWork cfg={cfg} setCfg={setCfg} />;
  if (k === 'pausen') return <StepBreaks cfg={cfg} setCfg={setCfg} />;
  if (k === 'training') return <StepTraining cfg={cfg} setCfg={setCfg} />;
  if (k === 'ernaehrung') return <StepNutrition cfg={cfg} setCfg={setCfg} onTouch={onTouch} body={body} setBody={setBody} />;
  if (k === 'erinnerungen') return <StepReminders cfg={cfg} setCfg={setCfg} />;
  if (k === 'reviews') return <StepReviews cfg={cfg} setCfg={setCfg} />;
  return <PlanPreview cfg={cfg} />;
}
function Onboarding({ initial, initialBody, onDone, onLater, startStep = 0 }) {
  const [i, setI] = useState(startStep);
  const [cfg, setCfg] = useState(() => normalizeConfig(initial));
  const [body, setBody] = useState(initialBody || { weight: '' });
  const [err, setErr] = useState('');
  const [touched, setTouched] = useState(false);
  const ref = useRef(null);
  const [k, title, lead] = OB_STEPS[i];
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; setErr(''); if (k === 'ernaehrung' && !touched) setCfg(c => ({ ...c, habits: suggestHabits(c.goals) })); }, [i]);
  const check = () => (k === 'ernaehrung' ? (cfg.nutrition.weight ? validateWeight(body.weight) : '') : k === 'arbeit' ? workError(cfg) : '');
  const next = () => { const e = check(); if (e) return setErr(e); if (i < OB_STEPS.length - 1) setI(i + 1); else onDone(cfg, body); };
  const skip = () => {
    if (k === 'ernaehrung') setBody({ weight: '' });
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
const SET_SECTIONS = [['ziele', 'Ziele und Priorität'], ['arbeit', 'Arbeitsalltag'], ['pausen', 'Bewegungspausen'], ['training', 'Training'], ['ernaehrung', 'Ernährung, Tracking und Gewohnheiten'], ['erinnerungen', 'Hinweise und Motivation'], ['reviews', 'Wochen-Check-in und Monatsreview']];
function sectionSummary(k, c) {
  if (k === 'reviews') return `${WD_LONG[c.review.weeklyDay]}, ${c.review.weeklyTime} Uhr${c.review.monthly ? ', Monatsreview an' : ', Monatsreview aus'}`;
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
    <p className="hint">Gespeichert werden Einstellungen, Routinen mit Versionen, Wochenplan mit Status, Gewohnheiten und Pausen ohne Grund, privat für dein Konto in diesem Artifact. Nicht gespeichert werden Gewicht, Schritte, Trainingsdetails, Mahlzeiten, Laborwerte, Termine und Entscheidungen zu laborbezogenen Empfehlungen. Sie bleiben Demo-Daten dieser Sitzung.</p>
    {store.migrated && <p className="hint">Gespeicherte Daten wurden von Version {store.migrated} auf Version {SCHEMA} übertragen.</p>}
    {store.error && <p className="err" role="alert">{store.error}</p>}
  </>;
  if (store.status === 'error') return <p className="err" role="alert">Der Speicher konnte nicht geladen werden ({store.message}). Änderungen gelten nur bis zum Neuladen.</p>;
  return <p className="hint">In dieser Ansicht ist kein persönlicher Speicher verfügbar, etwa wenn du abgemeldet bist oder die Seite außerhalb von Claude geöffnet ist. Alles gilt nur bis zum Neuladen.</p>;
}
function Settings({ ctx, cfg, applyConfig, store, theme, setTheme, onExport, onImport, onDeleteStored, onRestart, onResetDemo }) {
  const { data, today, commit, openSheet } = ctx;
  const [draft, setDraft] = useState(cfg);
  useEffect(() => setDraft(cfg), [cfg]);
  const [open, setOpen] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(cfg);
  const err = workError(draft);
  const preview = useMemo(() => { if (!dirty || err) return null; const sync = syncPlanRoutines(data.routines, draft, today); const m = materialize({ ...data, routines: sync.routines }, today); return { diff: planDiff(data.items, m.items, today), kept: sync.kept }; }, [draft, data, dirty, err]);
  const diff = preview && preview.diff;
  const fileRef = useRef(null);
  const [imp, setImp] = useState(null);
  const readFile = e => {
    const file = e.target.files && e.target.files[0]; e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setImp({ error: 'Die Datei ist größer als 5 MB.' });
    const fr = new FileReader();
    fr.onload = () => { try { setImp(parseImport(JSON.parse(String(fr.result)))); } catch (x) { setImp({ error: 'Die Datei ist kein gültiges JSON.' }); } };
    fr.onerror = () => setImp({ error: 'Die Datei konnte nicht gelesen werden.' });
    fr.readAsText(file);
  };
  const pauses = [...(data.pauses || [])].sort((a, b) => a.from.localeCompare(b.from));
  return <div className={`screen ${dirty ? 'has-apply' : ''}`}>
    <header className="page-head"><h1 className="h1">Einstellungen</h1></header>
    {cfg.skipped && <p className="callout">Du nutzt noch den Demo-Plan. <button className="link inline" onClick={onRestart}>Einrichtung starten</button></p>}
    {store.status === 'ready' && store.offline && <p className="callout warn">Offline. Änderungen gelten vorerst nur in dieser Sitzung und werden gespeichert, sobald wieder eine Verbindung besteht und du etwas änderst.</p>}

    <section className="block first">
      <h2 className="h2">Deine Angaben</h2>
      <ul className="set-list">{SET_SECTIONS.map(([k, l]) => <li key={k} className={open === k ? 'open' : ''}>
        <button className="set-head" aria-expanded={open === k} onClick={() => setOpen(open === k ? null : k)}>
          <span><b>{l}</b><small>{sectionSummary(k, draft)}</small></span><Icon name={open === k ? 'up' : 'down'} size={18} />
        </button>
        {open === k && <div className="set-body form"><StepContent k={k} cfg={draft} setCfg={setDraft} /></div>}
      </li>)}
      </ul>
    </section>

    <section className="block">
      <div className="h2-row"><h2 className="h2">{dirty ? 'Neuer Wochenplan, Vorschau' : 'Dein Wochenplan'}</h2></div>
      <div className="panel"><PlanPreview cfg={draft} /></div>
    </section>

    <section className="block">
      <h2 className="h2">Routinen</h2>
      <button className="btn wide" onClick={() => ctx.go('routinen')}><Icon name="repeat" size={18} /> Routinen verwalten ({data.routines.filter(r => r.status === 'aktiv').length} aktiv)</button>
      <p className="hint">Einzelne Routinen bearbeiten, pausieren, archivieren oder duplizieren. Von dir angepasste Routinen bleiben bei Änderungen am Wochenplan unverändert.</p>
    </section>

    <section className="block">
      <h2 className="h2">Pausen und Ausnahmen</h2>
      {pauses.length ? <ul className="list">{pauses.map(p => <li key={p.id} className="row compact">
        <div className="row-main static"><span className="row-title">{PAUSE_KINDS[p.kind]}</span><span className="row-meta"><span>{fmtDM(p.from)} bis {fmtDM(p.to)}</span><span>{p.scope === 'alle' ? 'alle Routinen' : 'nur Training'}</span>{p.to < today && <span>abgelaufen</span>}</span></div>
        <button className="icon-btn sm" aria-label={`Pause ${PAUSE_KINDS[p.kind]} vom ${fmtDM(p.from)} entfernen`} onClick={() => commit(d => A.removePause(d, p.id, today), 'Pause entfernt')}><Icon name="trash" size={16} /></button>
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
        <p className="hint">Der Export ist eine lokale Datei auf deinem Gerät mit Einstellungen, Routinen und Plan in einer Tabellenstruktur für die spätere Übernahme nach Supabase. Messwerte, Laborwerte und Termine sind nicht enthalten.</p>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr" onChange={readFile} aria-label="Exportdatei auswählen" />
        <button className="btn small" onClick={() => fileRef.current && fileRef.current.click()}>Export importieren</button>
        {imp && (imp.error ? <p className="err" role="alert">{imp.error}</p> : <div className="callout">
          <p className="top0">Gefunden: {imp.counts.routines} Routinen, {imp.counts.items} Einträge, {imp.counts.pauses} Pausen. Der Import ersetzt Einstellungen, Routinen, Plan, Gewohnheiten und Pausen.</p>
          <div className="btn-row"><button className="btn small primary" onClick={() => { onImport(imp.state); setImp(null); }}>Importieren</button><button className="btn small ghost" onClick={() => setImp(null)}>Abbrechen</button></div>
        </div>)}
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
      <p>{err ? err : diff ? `Ab heute: ${diff.added} neu, ${diff.changed} geändert, ${diff.removed} entfallen. Vergangenes und Erledigtes bleibt unverändert.` : ''}{preview && preview.kept.length ? ` ${preview.kept.length} von dir angepasste ${preview.kept.length === 1 ? 'Routine bleibt' : 'Routinen bleiben'} unverändert.` : ''}</p>
      <div className="btn-row">
        <button className="btn small ghost" onClick={() => setDraft(cfg)}>Verwerfen</button>
        <button className="btn small primary" disabled={!!err} onClick={() => applyConfig({ ...draft, onboardingDone: true, skipped: false }, 'Wochenplan angepasst')}>Übernehmen</button>
      </div>
    </div>}
  </div>;
}

/* ---------------- App ---------------- */
const TABS = [['heute', 'Heute', 'sun'], ['woche', 'Woche', 'calendar'], ['erfassen', 'Erfassen', 'plus'], ['entwicklung', 'Entwicklung', 'trend'], ['gesundheit', 'Gesundheit', 'heart']];
const EMPTY_BODY = { weight: '' };
const TAB_OF = { routinen: 'woche', einstellungen: null };
function App({ initialTab = 'heute', initialSheet = null, initialCapture = 'gewicht', initialHealth = 'fuerdich', initialConfig = null, initialStore = null, initialOnboarding = false, getNow = () => new Date() }) {
  const [clock, setClock] = useState(() => berlinParts(getNow()));
  const today = clock.date, nowMin = clock.minutes;
  const [cfg, setCfg] = useState(() => normalizeConfig(initialConfig || DEFAULT_CONFIG));
  const [data, setData] = useState(() => seed(today, normalizeConfig(initialConfig || DEFAULT_CONFIG)));
  const [body, setBody] = useState(EMPTY_BODY);
  const [tab, setTab] = useState(initialTab);
  const [captureSeg, setCaptureSeg] = useState(initialCapture);
  const [healthSeg, setHealthSeg] = useState(initialHealth);
  const [sheet, setSheet] = useState(initialSheet);
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState('system');
  const [store, setStore] = useState(initialStore || { status: 'pending' });
  const [showOb, setShowOb] = useState(initialOnboarding);
  const [review, setReview] = useState(null);
  const [answers, setAnswers] = useState({});
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  const undoRef = useRef(null);
  const conn = useRef(null), lastSaved = useRef({}), chain = useRef(Promise.resolve()), settled = useRef(false), lastDay = useRef(today);
  const say = (msg, undo = false) => setToast({ msg, undo, k: Date.now() + Math.random() });

  /* Uhr und Tageswechsel in Europe/Berlin: Intervall, Rückkehr aus dem Hintergrund, Fokus */
  useEffect(() => {
    const tick = () => setClock(c => { const n = berlinParts(getNow()); return n.date !== c.date || n.minutes !== c.minutes ? n : c; });
    const t = setInterval(tick, 30000);
    const vis = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', vis); window.addEventListener('focus', tick); window.addEventListener('pageshow', tick);
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); window.removeEventListener('focus', tick); window.removeEventListener('pageshow', tick); window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  useEffect(() => { if (lastDay.current !== today) { lastDay.current = today; undoRef.current = null; setData(d => materialize(d, today)); } }, [today]);
  useEffect(() => { const el = document.documentElement; if (theme === 'system') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4500); return () => clearTimeout(t); }, [toast]);

  /* Laden aus dem persönlichen Artifact-Speicher inklusive Migration älterer Stände */
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
          const m = migrateSaved(saved);
          saved.weeks.forEach(w => { lastSaved.current[`week:${w.id}`] = '?'; });
          setCfg(m.cfg);
          if (m.theme) setTheme(m.theme);
          setData(d => {
            const st = { ...d, routines: m.routines, recState: m.recState, reviews: m.reviews, items: m.items, habits: m.habits || d.habits, habitLog: m.habitLog, pauses: m.pauses, dismissed: m.dismissed };
            const mat = materialize(st, today);
            return { ...mat, habits: syncHabits(mat.habits, m.cfg) };
          });
          finish({ status: 'ready', savedAt: saved.settings.savedAt || null, restored: !!m.cfg.onboardingDone, migrated: m.fromSchema < SCHEMA ? m.fromSchema : null });
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
        const ref = k === 'settings' ? r.settings : k === 'plan' ? r.plan : k === 'habits' ? r.habits : r.weeks.doc(k.slice(5));
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
  }, [cfg, data.items, data.routines, data.recState, data.reviews, data.habits, data.habitLog, data.pauses, data.dismissed, theme, store.status]);

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
    setData(d => { const sync = syncPlanRoutines(d.routines, n, today); const m = materialize({ ...d, routines: sync.routines }, today); return { ...m, habits: syncHabits(m.habits, n) }; });
    if (msg) say(msg);
  };
  const markRecs = (ids, primary) => setData(d => {
    const rs = { ...(d.recState || {}) }; let changed = false;
    ids.forEach(id => { const cur = rs[id] || {}; const patch = {}; if (!cur.firstShown) patch.firstShown = today; if (primary && cur.primaryOn !== today) patch.primaryOn = today; if (Object.keys(patch).length) { rs[id] = { ...cur, ...patch }; changed = true; } });
    return changed ? { ...d, recState: rs } : d;
  });
  const ensureHorizon = end => setData(d => (d.items.some(i => i.routine && i.date >= end) ? d : materialize(d, today, end)));
  const finishOnboarding = (c, b) => {
    applyConfig({ ...c, onboardingDone: true, skipped: false }, 'Dein Wochenplan ist aktiv');
    setBody(b);
    const kg = parseNum(b.weight);
    if (c.nutrition.weight && kg >= 30 && kg <= 300) setData(d => ({ ...d, weights: [...d.weights, { id: uid('wg'), date: today, time: '', kg: Math.round(kg * 10) / 10, note: 'aus der Einrichtung', source: 'manuell' }] }));
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
  const importPlan = st => {
    undoRef.current = null;
    const n = normalizeConfig({ ...st.cfg, onboardingDone: true });
    setCfg(n);
    setData(d => { const m = materialize({ ...d, routines: st.routines, items: st.items, habits: st.habits.length ? st.habits : d.habits, habitLog: st.habitLog, pauses: st.pauses, recState: {}, reviews: st.reviews || {}, dismissed: [] }, today); return { ...m, habits: syncHabits(m.habits, n) }; });
    setShowOb(false);
    say('Import abgeschlossen');
  };
  const deleteStored = async () => {
    const c = conn.current; if (!c) return;
    try {
      await chain.current; await Store.deleteAll(c); lastSaved.current = {};
      const fresh = normalizeConfig(DEFAULT_CONFIG);
      setCfg(fresh); setData(seed(today, fresh)); setBody(EMPTY_BODY); setTheme('system');
      setStore(st => ({ ...st, savedAt: null, error: null, restored: false, migrated: null }));
      say('Gespeicherte Daten gelöscht'); setShowOb(true); go('heute');
    } catch (e) { say('Löschen war nicht möglich. Bitte später erneut versuchen.'); }
  };
  const resetDemo = () => { undoRef.current = null; setData(seed(today, cfg)); say('Demo-Daten zurückgesetzt'); };

  /* Reviews: verschieben, überspringen, Maßnahmen bestätigen und rückgängig machen, abschließen */
  const kindOf = k => (k.startsWith('W:') ? 'week' : 'month');
  const putKeys = (d, rv, patch) => rv.keys.reduce((acc, k) => { const cur = (acc.reviews || {})[k] || { kind: kindOf(k), status: 'offen', measures: [] }; return { ...acc, reviews: { ...(acc.reviews || {}), [k]: { ...cur, kind: kindOf(k), ...patch(cur) } } }; }, d);
  const undoMap = useRef({});
  const planSig = (d, c) => JSON.stringify([c, d.routines, d.habits, d.recState]);
  const startReview = rv => { setSheet(null); setReview(rv); };
  const snoozeReview = rv => { undoRef.current = null; setData(d => putKeys(d, rv, cur => (cur.status === 'abgeschlossen' ? {} : { status: 'verschoben', snoozedUntil: addDays(today, 1) }))); setReview(null); say('Kein Problem, morgen wieder.'); };
  const skipReview = rv => { undoRef.current = null; setData(d => putKeys(d, rv, cur => (cur.status === 'abgeschlossen' ? {} : { status: 'uebersprungen', at: today }))); setReview(null); say(rv.kind === 'month' ? 'Übersprungen. Nächsten Monat geht es weiter.' : 'Übersprungen. Nächste Woche geht es weiter.'); };
  const decideMeasure = (rv, m, decision, from) => {
    undoRef.current = null;
    const rec = measureRecord(m, decision, today, from);
    const addRec = cur => ({ measures: [...(cur.measures || []).filter(x => x.id !== m.id), rec] });
    if (decision === 'übernommen') {
      const r = applyMeasureState(data, cfg, m, today, from);
      const next = putKeys(r.data, rv, addRec);
      const c2 = r.cfgChanged ? r.cfg : cfg;
      undoMap.current[`${rv.key}|${m.id}`] = { cfg, routines: data.routines, habits: data.habits, recState: data.recState, itemIds: new Set(data.items.map(x => x.id)), after: planSig(next, c2) };
      if (r.cfgChanged) setCfg(r.cfg);
      setData(next);
      say(m.id === 'fortfuehren' ? 'Beschlossen' : `Übernommen, gilt ${r.from === today ? 'ab sofort' : `ab ${fmtDM(r.from)}`}`);
    } else { setData(d => putKeys(d, rv, addRec)); say('Vermerkt: nicht jetzt'); }
  };
  const undoable = (rv, id) => { const u = undoMap.current[`${rv.key}|${id}`]; return !!u && u.after === planSig(data, cfg); };
  const undoMeasure = (rv, m) => {
    const key = `${rv.key}|${m.id}`; const u = undoMap.current[key];
    if (!u || u.after !== planSig(data, cfg)) { say('Rückgängig ist nicht mehr möglich, weil sich der Plan inzwischen geändert hat. Passe ihn unter Routinen an.'); return; }
    setCfg(u.cfg);
    setData(d => {
      const items = d.items.filter(x => u.itemIds.has(x.id) || !['geplant', 'pausiert'].includes(x.status));
      const n = materialize({ ...d, routines: u.routines, habits: u.habits, recState: u.recState, items }, today);
      return putKeys(n, rv, cur => ({ measures: (cur.measures || []).filter(x => x.id !== m.id) }));
    });
    delete undoMap.current[key];
    say('Maßnahme rückgängig gemacht');
  };
  const finishReview = (rv, questionIds, mode) => {
    if (rv.keys.every(k => ((data.reviews || {})[k] || {}).status === 'abgeschlossen')) { setReview(null); return; }
    undoRef.current = null;
    setData(d => completeReviewState(d, rv, today, questionIds, mode));
    setReview(null); setAnswers(a => { const n = { ...a }; delete n[rv.key]; return n; });
    say(rv.kind === 'combined' ? 'Wochen- und Monatsreview abgeschlossen' : rv.kind === 'week' ? 'Check-in abgeschlossen' : 'Monatsreview abgeschlossen');
  };
  const ctx = { data, today, nowMin, commit, go, openSheet: setSheet, cfg, markRecs, ensureHorizon, startReview, snoozeReview, skipReview };
  const close = () => setSheet(null);
  const activeTab = TAB_OF[tab] !== undefined ? TAB_OF[tab] : tab;
  return <div className="app">
    <div className="topbar">
      <span className="brand"><span className="brand-mark" aria-hidden="true" /><span className="brand-text">HealthOS</span></span>
      <span className="demo-pill">Fiktive Demo-Daten</span>
      <button className={`icon-btn ${tab === 'einstellungen' ? 'on' : ''}`} aria-label="Einstellungen" onClick={() => go('einstellungen')}><Icon name="gear" /></button>
      <button className="icon-btn" aria-label="Über diese Demo" onClick={() => setSheet({ kind: 'info' })}><Icon name="info" /></button>
    </div>
    {!online && <p className="callout warn offline" role="status">Keine Verbindung. Du kannst weiterarbeiten, gespeichert wird erst wieder mit Verbindung.</p>}
    <main id="main">
      {tab === 'heute' && <Today ctx={ctx} onSetup={() => setShowOb(true)} />}
      {tab === 'woche' && <Week ctx={ctx} />}
      {tab === 'routinen' && <RoutinesScreen ctx={ctx} />}
      {tab === 'erfassen' && <Capture ctx={ctx} seg={captureSeg} setSeg={setCaptureSeg} />}
      {tab === 'entwicklung' && <Development ctx={ctx} />}
      {tab === 'gesundheit' && <Health ctx={ctx} seg={healthSeg} setSeg={setHealthSeg} />}
      {tab === 'einstellungen' && <Settings ctx={ctx} cfg={cfg} applyConfig={applyConfig} store={{ ...store, offline: !online }} theme={theme} setTheme={setTheme}
        onExport={exportPlan} onImport={importPlan} onDeleteStored={deleteStored} onRestart={() => setShowOb(true)} onResetDemo={resetDemo} />}
    </main>
    <nav className="tabbar" aria-label="Hauptnavigation">
      {TABS.map(([k, l, ic]) => <button key={k} className={activeTab === k ? 'on' : ''} aria-current={activeTab === k ? 'page' : undefined} onClick={() => go(k)}><Icon name={ic} size={22} /><span>{l}</span></button>)}
    </nav>
    {toast && <div className="toast" role="status" key={toast.k}><span>{toast.msg}</span>{toast.undo && <button onClick={undo}>Rückgängig</button>}</div>}
    {sheet && sheet.kind === 'item' && <ItemSheet key={sheet.id} id={sheet.id} ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'edit' && <EditInstanceSheet id={sheet.id} ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'routine' && <RoutineSheet key={sheet.id || 'neu'} id={sheet.id} ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'rec' && <RecSheet id={sheet.id} ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'addItem' && <AddItemSheet date={sheet.date} ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'lab' && <LabSheet ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'appt' && <ApptSheet id={sheet.id} followOf={sheet.followOf} ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'pause' && <PauseSheet ctx={ctx} close={close} from={sheet.from} />}
    {sheet && sheet.kind === 'info' && <InfoSheet close={close} onSettings={() => go('einstellungen')} />}
    {review && <ReviewFlow key={review.key + (review.mode || '')} review={review} ctx={ctx} answers={answers[review.key] || {}} setAnswers={a => setAnswers(s => ({ ...s, [review.key]: a }))} onDecide={decideMeasure} onUndo={undoMeasure} undoable={undoable} onFinish={finishReview} onSnooze={() => snoozeReview(review)} onSkip={() => skipReview(review)} close={() => setReview(null)} />}
    {showOb && store.status !== 'pending' && <Onboarding initial={cfg} initialBody={body} onDone={finishOnboarding} onLater={later} />}
    {store.status === 'pending' && !initialStore && <div className="splash" role="status"><span className="brand-mark big" aria-hidden="true" /><span>HealthOS wird geladen</span></div>}
  </div>;
}

if (typeof document !== 'undefined' && document.getElementById('root')) {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
}
if (typeof module !== 'undefined') module.exports = { weekCoverage, goalAt, trainingSeries, avgComplete, gapText, reviewOffer, weeklyDescriptor, monthlyDescriptor, completeReviewState, slotItem, habitOn, runningMeasures, planStart, habitAdherence, reviewDue, weeklyWindow, monthlyTarget, weekMetrics, monthMetrics, pickQuestions, coachMeasures, applyMeasureState, measureRecord, persistableReviews, evalMeasure, previousQuestionIds, ReviewFlow, ReviewHistory, adherence, App, seed, A, buildPlan, materialize, planDiff, applyPauses, settle, normalizeConfig, DEFAULT_CONFIG, snapshotDocs, buildExport, parseImport, migrateSaved, Onboarding, Settings, habitStats, syncHabits, syncPlanRoutines, OB_STEPS, effStatus, nextActions, hints, coachHint, trainingsInWeek, pauseStats, computeRecs, recView, labAssessment, specAt, versionAt, berlinParts, findConflicts, missesInWeek, persistableRecState, RoutineSheet, EditInstanceSheet, ItemSheet, RecSheet, LabCard, groupLabs, RoutinesScreen, Development, Week, Today };
