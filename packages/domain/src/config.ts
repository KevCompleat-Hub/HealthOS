/** Konfiguration normalisieren und prüfen. 1:1 aus Referenz v5. */
import { DEFAULT_CONFIG, GOALS, HABIT_LIBRARY, INTENSITIES, PLACES, SCHEMA, TONES } from './catalog.js';
import type { Config } from './types.js';
import { clone } from './util/ids.js';
import { parseNum, toMin } from './util/date.js';

type Loose = Record<string, any>;

/** Füllt fehlende Felder mit Standardwerten und bereinigt ungültige Werte. Nimmt beliebige Eingaben an. */
export function normalizeConfig(c: unknown): Config {
  const d = clone(DEFAULT_CONFIG);
  if (!c || typeof c !== 'object') return d;
  const x = c as Loose;
  const arr = <T>(v: unknown, f: T[]): T[] => (Array.isArray(v) ? (v as T[]) : f);
  const n = { ...d, ...x, work: { ...d.work, ...(x.work || {}) }, breaks: { ...d.breaks, ...(x.breaks || {}) }, training: { ...d.training, ...(x.training || {}) }, nutrition: { ...d.nutrition, ...(x.nutrition || {}) }, reminders: { ...d.reminders, ...(x.reminders || {}) }, review: { ...d.review, ...(x.review || {}) }, schema: SCHEMA } as Config;
  n.goals = arr<Config['goals'][number]>(n.goals, d.goals).filter(g => (GOALS as Loose)[g]);
  n.habits = arr<string>(n.habits, d.habits).filter(h => HABIT_LIBRARY[h]);
  n.work.days = arr<number>(n.work.days, d.work.days); n.work.home = arr<number>(n.work.home, []).filter(y => n.work.days.includes(y));
  n.training.days = arr<number>(n.training.days, d.training.days); n.training.places = arr<string>(n.training.places, d.training.places).filter(p => PLACES[p]);
  if (!INTENSITIES[n.reminders.intensity]) n.reminders.intensity = 'ausgewogen';
  if (!TONES[n.motivation]) n.motivation = 'ausgewogen';
  if (!(n.review.weeklyDay >= 0 && n.review.weeklyDay <= 6)) n.review.weeklyDay = 6;
  if (toMin(n.review.weeklyTime) == null) n.review.weeklyTime = '18:00';
  n.review.monthly = n.review.monthly !== false;
  return n;
}

export const validateWeight = (w: unknown): string => { if (String(w ?? '').trim() === '') return ''; const n = parseNum(w); return n >= 30 && n <= 300 ? '' : 'Bitte ein Gewicht zwischen 30 und 300 kg eingeben oder das Feld leer lassen.'; };

export function workError(c: Config): string {
  const s = toMin(c.work.start), e = toMin(c.work.end), l = toMin(c.work.lunch);
  if (!c.work.days.length) return '';
  if (s == null || e == null) return 'Bitte Arbeitsbeginn und Arbeitsende angeben.';
  if (e <= s) return 'Das Arbeitsende muss nach dem Arbeitsbeginn liegen.';
  if (l == null) return 'Bitte eine Uhrzeit für die Mittagspause angeben.';
  return '';
}
