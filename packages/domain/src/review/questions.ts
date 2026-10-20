/** Reflexionsfragen (HOS-006). 1:1 aus Referenz v5. Antworten werden im Kern nie gespeichert. */
import { GOALS } from '../catalog.js';
import { normalizeConfig } from '../config.js';
import type { Config, State } from '../types.js';

/** Kennzahlen, auf die sich Fragen beziehen (Woche, Monat oder beides zusammengeführt). */
export interface QuestionContext { trMissed?: unknown[]; pauseMissed?: number; weakHabit?: { name: string } | null; positives?: string[] }
export interface Question { id: string; prio: number; monthly?: boolean; when: (m: QuestionContext, c: Config) => boolean; text: (m: QuestionContext, c: Config) => string; options: (m: QuestionContext, c: Config) => [string, string][] }
export const QUESTIONS: Question[] = [
  { id: 'training-hindernis', prio: 9, when: m => !!(m.trMissed && m.trMissed.length > 0), text: () => 'Was hat das Training am ehesten verhindert?', options: () => [['termine', 'Termine oder Arbeit'], ['energie', 'Wenig Energie'], ['uhrzeit', 'Die Uhrzeit passt nicht'], ['anderes', 'Etwas anderes']] },
  { id: 'pausen-hindernis', prio: 8, when: m => (m.pauseMissed as number) >= 2, text: () => 'Was hat die Bewegungspausen am ehesten verhindert?', options: () => [['meetings', 'Meetings oder Termine'], ['vergessen', 'Vergessen'], ['uhrzeit', 'Die Uhrzeit passt nicht'], ['anderes', 'Etwas anderes']] },
  { id: 'gewohnheit', prio: 7, when: m => !!m.weakHabit, text: m => `Passt „${m.weakHabit!.name}“ gerade in deinen Alltag?`, options: () => [['ja', 'Ja, weiter so'], ['kleiner', 'Zu groß, vereinfachen'], ['pause', 'Gerade nicht wichtig']] },
  { id: 'umfang', prio: 6, when: () => true, text: () => 'Wie hat sich der Umfang deines Plans angefühlt?', options: () => [['zuviel', 'Zu viel'], ['passend', 'Passend'], ['mehr', 'Es dürfte mehr sein']] },
  { id: 'gut', prio: 5, when: m => !!(m.positives && m.positives.length > 0), text: () => 'Was hat gut funktioniert und soll so bleiben?', options: () => [['zeiten', 'Feste Uhrzeiten'], ['kurz', 'Kurze Einheiten'], ['planung', 'Vorausplanen'], ['anderes', 'Etwas anderes']] },
  { id: 'ernaehrung', prio: 4, when: (m, c) => c.goals.some(g => ['ernaehrung', 'werte', 'abnehmen'].includes(g)), text: () => 'Welche kleine Ernährungsänderung wäre für dich realistisch?', options: () => [['hafer', 'Haferflocken zum Frühstück'], ['huelsen', 'Öfter Hülsenfrüchte'], ['gemuese', 'Mehr Obst und Gemüse'], ['keine', 'Gerade keine']] },
  { id: 'monat-huerde', monthly: true, prio: 9, when: () => true, text: () => 'Was war im letzten Monat die größte Hürde?', options: () => [['zeit', 'Zeit'], ['planung', 'Planung'], ['energie', 'Energie'], ['keine', 'Keine besondere']] },
  { id: 'fokus', monthly: true, prio: 10, when: (m, c) => c.goals.length > 1, text: () => 'Worauf möchtest du dich im nächsten Monat konzentrieren?', options: (m, c) => c.goals.map(g => [g, GOALS[g]] as [string, string]) },
];
export interface PickedQuestion { id: string; text: string; options: [string, string][] }
/** Höchstens 3 Fragen pro Woche und 5 pro Monat, Fragen vom letzten Mal werden möglichst nicht wiederholt. */
export function pickQuestions(kind: 'week' | 'month' | 'combined', m: QuestionContext, cfg: unknown, previousIds: string[]): PickedQuestion[] {
  const c = normalizeConfig(cfg); const monthly = kind !== 'week'; const max = monthly ? 5 : 3;
  const pool = QUESTIONS.filter(q => (monthly || !q.monthly) && q.when(m, c)).sort((a, b) => b.prio - a.prio);
  const fresh = pool.filter(q => !previousIds.includes(q.id)), seen = pool.filter(q => previousIds.includes(q.id));
  const minN = Math.min(monthly ? 3 : 1, pool.length);
  const out = fresh.slice(0, max);
  for (const q of seen) { if (out.length >= minN) break; out.push(q); }
  return out.map(q => ({ id: q.id, text: q.text(m, c), options: q.options(m, c) }));
}
export function previousQuestionIds(data: Pick<State, 'reviews'>, kind: 'week' | 'month' | 'combined', key: string): string[] {
  const prev = Object.entries(data.reviews || {}).filter(([k, r]) => (kind === 'combined' || r.kind === kind) && k !== key && r.status === 'abgeschlossen').sort((a, b) => (b[1].at || '').localeCompare(a[1].at || ''))[0];
  return prev ? prev[1].questionIds || [] : [];
}
