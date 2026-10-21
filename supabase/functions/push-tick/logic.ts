// Fällige Push-Erinnerungen bestimmen. Reine Logik ohne Netz, läuft in der Supabase Edge Function und in Node-Tests.
// Texte sind neutral: keine Messwerte, keine Gesundheitsangaben, nur Plan-Titel und Uhrzeit.

export interface Item { id: string; title: string; type: string; date: string; time?: string | null; status: string; taskClass?: string; routine?: string | null }
export interface Reminder { key: string; title: string; body: string; url: string }
export interface UserDocs {
  settings?: { config?: { reminders?: { intensity?: string; lead?: number; quietFrom?: string; quietTo?: string } } };
  week?: { items?: Item[] };
  habits?: { habits?: { id: string; name: string; active?: boolean; inactiveFrom?: string; perWeek?: number; kind?: string }[]; habitLog?: Record<string, string>; pauses?: { from: string; to: string; scope: string }[] };
}

const pad = (n: number) => String(n).padStart(2, '0');
export const toMin = (t?: string | null): number | null => { if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export const hm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const addDays = (d: string, n: number) => { const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
export const weekStart = (d: string) => { const wd = (new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7; return addDays(d, -wd); };

/** Kalendertag und Minute in Europe/Berlin. */
export function berlinNow(now: Date): { date: string; min: number } {
  const p: Record<string, string> = {};
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now).forEach(x => { p[x.type] = x.value; });
  return { date: `${p.year}-${p.month}-${p.day}`, min: (Number(p.hour) % 24) * 60 + Number(p.minute) };
}
/** Ruhezeit wie im Kern: über Mitternacht möglich, gleiche Zeiten bedeuten keine Ruhezeit. */
export function inQuiet(m: number, from?: string, to?: string): boolean {
  const f = toMin(from), t = toMin(to); if (f == null || t == null || f === t) return false;
  return f > t ? (m >= f || m < t) : (m >= f && m < t);
}

const TEXT: Record<string, (it: Item) => string> = {
  training: it => `Gleich: ${it.title} um ${it.time} Uhr.`,
  bewegung: it => `Zeit für ${it.title === 'Bewegungspause' ? 'eine kurze Bewegungspause' : it.title}, ${it.time} Uhr.`,
  messen: () => 'Optional: kurz das Gewicht eintragen.',
  rueckblick: () => 'Dein Wochen-Check-in ist bereit. Dauert etwa 3 bis 5 Minuten.',
};

/**
 * Fällige Erinnerungen im Zeitfenster [now, now + window).
 * Intensität: „sanft“ nur Training und Check-in, „ausgewogen“ zusätzlich Bewegung, Wiegen und abends offene Gewohnheiten,
 * „deutlich“ wie ausgewogen. Ruhezeiten werden immer eingehalten.
 */
export function dueReminders(docs: UserDocs, now: Date, windowMin = 15): Reminder[] {
  const { date, min } = berlinNow(now);
  const r = (docs.settings && docs.settings.config && docs.settings.config.reminders) || {};
  const intensity = r.intensity || 'ausgewogen';
  const lead = Number.isFinite(Number(r.lead)) ? Number(r.lead) : 15;
  const out: Reminder[] = [];
  const allowed = intensity === 'sanft' ? ['training', 'rueckblick'] : ['training', 'rueckblick', 'bewegung', 'messen'];
  const paused = (docs.habits?.pauses || []).some(p => p.scope === 'alle' && date >= p.from && date <= p.to);
  for (const it of (docs.week && docs.week.items) || []) {
    if (it.date !== date || it.status !== 'geplant' || it.taskClass === 'deadline' || !allowed.includes(it.type)) continue;
    const t = toMin(it.time); if (t == null) continue;
    const at = Math.max(0, t - lead);
    if (at < min || at >= min + windowMin || inQuiet(at, r.quietFrom, r.quietTo)) continue;
    out.push({ key: `${date}|${it.id}`, title: 'EvoVive', body: (TEXT[it.type] || (x => `${x.title} um ${x.time} Uhr.`))(it), url: '/' });
  }
  if (intensity !== 'sanft' && !paused && min <= 20 * 60 && 20 * 60 < min + windowMin && !inQuiet(20 * 60, r.quietFrom, r.quietTo)) {
    const hs = (docs.habits?.habits || []).filter(h => h.active !== false && h.kind !== 'limit' && !(h.inactiveFrom && date >= h.inactiveFrom));
    const log = docs.habits?.habitLog || {};
    const open = hs.filter(h => !log[`${h.id}|${date}`]).filter(h => {
      if (!h.perWeek) return true; let n = 0; for (let x = weekStart(date); x < date; x = addDays(x, 1)) if (log[`${h.id}|${x}`] === 'done') n++; return n < h.perWeek;
    }).length;
    if (open > 0) out.push({ key: `${date}|habits`, title: 'EvoVive', body: open === 1 ? 'Eine Gewohnheit ist heute noch offen. Ein Haken geht immer.' : `${open} Gewohnheiten sind heute noch offen. Ein Haken geht immer.`, url: '/' });
  }
  return out;
}
