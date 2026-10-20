// Beta-Anpassungen rund um Reviews und Texte. Fachregeln des Kerns bleiben unverändert.
import { addDays, isoWeek, monthlyDescriptor, weekStart } from '@healthos/domain';

const hasPlan = (data, from, to) => data.items.some(i => i.routine && i.routine !== 'review' && i.date >= from && i.date <= to);

/**
 * Check-in nur anbieten, wenn der ausgewertete Zeitraum Plandaten hat.
 * Liegt die ausgewertete Woche vor der laufenden, heißt der Check-in „Rückblick auf letzte Woche“.
 */
export function usableOffer(offer, data, today) {
  if (!offer) return null;
  const ws = offer.weekPeriod;
  const weekOk = ws ? hasPlan(data, ws, addDays(ws, 6)) : false;
  const monthOk = offer.kind !== 'week' && hasPlan(data, `${offer.period}-01`, `${offer.period}-31`);
  const relabel = o => (o.kind === 'week' && ws < weekStart(today) ? { ...o, label: `Rückblick auf letzte Woche (KW ${isoWeek(ws)})` } : o);
  if (offer.kind === 'week') return weekOk ? relabel(offer) : null;
  if (offer.kind === 'month') return monthOk ? offer : null;
  if (weekOk && monthOk) return offer;
  if (monthOk) return monthlyDescriptor(offer.period);
  return null;
}

/** Kleine Textkorrekturen: Einzahl statt Mehrzahl bei 1, doppelte Punkte nach Datumsangaben. */
export function fixText(s) {
  if (typeof s !== 'string') return s;
  return s
    .replace(/\b1 Trainingseinheiten\b/g, '1 Trainingseinheit')
    .replace(/\b1 Einträge\b/g, '1 Eintrag')
    .replace(/\b1 Einheiten\b/g, '1 Einheit')
    .replace(/(\d{1,2}\.\d{1,2}\.)\./g, '$1');
}
