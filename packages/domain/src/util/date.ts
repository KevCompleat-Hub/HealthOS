/**
 * Datum und Format. 1:1 aus der Referenz v5 (Abschnitt „Datum & Format“).
 * Kalendertage werden kalendarisch über lokale Date-Objekte gerechnet. Der aktuelle Zeitpunkt
 * wird nie im Kern gelesen, sondern immer übergeben.
 */
import type { HHMM, ISODate, Weekday } from '../types.js';

export const pad = (n: number): string => String(n).padStart(2, '0');
export const iso = (d: Date): ISODate => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s: ISODate): Date => { const [y, m, d] = s.split('-').map(Number) as [number, number, number]; return new Date(y, m - 1, d); };
export const addDays = (s: ISODate, n: number): ISODate => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
export const wdIdx = (s: ISODate): Weekday => (parse(s).getDay() + 6) % 7;
export const weekStart = (s: ISODate): ISODate => addDays(s, -wdIdx(s));
export const weekDays = (s: ISODate): ISODate[] => Array.from({ length: 7 }, (_, i) => addDays(weekStart(s), i));
export const WD: readonly string[] = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const WD_LONG: readonly string[] = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
export const daysBetween = (a: ISODate, b: ISODate): number => Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);
export const fmtLong = (s: ISODate): string => parse(s).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtShort = (s: ISODate): string => parse(s).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
export const fmtDM = (s: ISODate): string => { const d = parse(s); return `${d.getDate()}.${d.getMonth() + 1}.`; };
export const fmtNum = (n: number | string, d = 0): string => Number(n).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtVal = (v: number | string | null): string => Number(v).toLocaleString('de-DE', { maximumFractionDigits: 2 });
export const parseNum = (s: unknown): number => { const t = String(s ?? '').trim().replace(',', '.'); return t === '' ? NaN : Number(t); };
/** Minuten seit Mitternacht. Leere oder fehlende Zeit ergibt null (wie Referenz). */
export const toMin = (t: HHMM | '' | null | undefined): number | null => { if (!t) return null; const [h, m] = t.split(':').map(Number) as [number, number]; return h * 60 + m; };
export const byTime = (a: { date: ISODate; time?: HHMM | '' | null }, b: { date: ISODate; time?: HHMM | '' | null }): number =>
  (a.date + (a.time || '99:99')).localeCompare(b.date + (b.time || '99:99'));
export const isoWeek = (s: ISODate): number => {
  const d = parse(s); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - w1.getTime()) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
};
export const dayLabel = (s: ISODate, today: ISODate): string => {
  if (s === today) return 'Heute';
  if (s === addDays(today, 1)) return 'Morgen';
  if (s === addDays(today, -1)) return 'Gestern';
  return `${WD[wdIdx(s)]}, ${fmtDM(s)}`;
};
export const dayLabelLc = (s: ISODate, today: ISODate): string => { const l = dayLabel(s, today); return ['Heute', 'Morgen', 'Gestern'].includes(l) ? l.toLowerCase() : l; };
export const avg = (a: number[]): number => a.reduce((s, x) => s + x, 0) / a.length;
export const signed = (v: number, d = 1): string => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${fmtNum(Math.abs(v), d)}`;
export const hm = (m: number): HHMM => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export const r15 = (m: number): number => Math.round(m / 15) * 15;
export const wdist = (a: number, b: number): number => { const x = Math.abs(a - b); return Math.min(x, 7 - x); };
export const pct = (a: number, b: number): number | null => (b ? Math.round((a / b) * 100) : null);
export const yy = (d: ISODate): string => String(parse(d).getFullYear()).slice(2);

/* ---------- Monate ---------- */
export const MONTHS: readonly string[] = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const ymOf = (d: ISODate): string => d.slice(0, 7);
export const monthLast = (ym: string): ISODate => { const [y, m] = ym.split('-').map(Number) as [number, number]; return iso(new Date(y, m, 0)); };
export const prevYm = (ym: string): string => ymOf(addDays(`${ym}-01`, -1));
export const fmtYm = (ym: string): string => `${MONTHS[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`;

/* ---------- Europe/Berlin ---------- */
let fmtBerlin: Intl.DateTimeFormat | null = null;
/**
 * Lokaler Kalendertag und Minute in Europe/Berlin für einen gegebenen Zeitpunkt.
 * Abweichung zur Referenz nur in der Signatur: Der Zeitpunkt ist Pflichtparameter, der Kern liest keine Uhr.
 */
export function berlinParts(d: Date): { date: ISODate; minutes: number } {
  try {
    fmtBerlin = fmtBerlin || new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const p: Record<string, string> = {}; fmtBerlin.formatToParts(d).forEach(x => { p[x.type] = x.value; });
    return { date: `${p.year}-${p.month}-${p.day}`, minutes: (Number(p.hour) % 24) * 60 + Number(p.minute) };
  } catch (e) { return { date: iso(d), minutes: d.getHours() * 60 + d.getMinutes() }; }
}
