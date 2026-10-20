// Waagen-Screenshot auslesen. Reine Logik ohne Next.js, damit sie ohne Netz testbar ist.
// Es wird nichts gespeichert und nichts protokolliert. Rückgabe: nur sichtbare Werte, keine Bewertung.

export interface ScaleValues { kg: number | null; fat: number | null; muscle: number | null; water: number | null; date: string | null }

export const SCALE_PROMPT = [
  'Du liest einen Screenshot aus einer Waagen- oder Körperwerte-App.',
  'Gib ausschließlich die dort eindeutig sichtbaren Messwerte als JSON zurück, ohne Bewertung, ohne Schätzung, ohne Umrechnung:',
  '{"kg": Zahl oder null, "fat_pct": Zahl oder null, "muscle_kg": Zahl oder null, "water_pct": Zahl oder null, "date": "JJJJ-MM-TT" oder null}.',
  'Gewicht und Muskelmasse in Kilogramm, Körperfett und Körperwasser in Prozent.',
  'Steht ein Wert in einer anderen Einheit (zum Beispiel lb oder st) oder ist er nicht eindeutig lesbar, setze null.',
  'Kein Text außerhalb des JSON.',
].join(' ');

const RANGES: Record<'kg' | 'fat' | 'muscle' | 'water', [number, number]> = { kg: [30, 300], fat: [2, 70], muscle: [10, 150], water: [20, 80] };

/** Antwort des Modells streng prüfen. Unplausible oder fehlende Werte werden null, nie geraten. */
export function parseScaleJson(text: string, today: string): ScaleValues | null {
  const m = text.replace(/```json|```/g, '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  let o: Record<string, unknown>;
  try { o = JSON.parse(m[0]) as Record<string, unknown>; } catch { return null; }
  const num = (v: unknown, k: keyof typeof RANGES): number | null => {
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(',', '.')) : NaN;
    return Number.isFinite(n) && n >= RANGES[k][0] && n <= RANGES[k][1] ? Math.round(n * 10) / 10 : null;
  };
  const date = typeof o.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.date) && o.date <= today ? o.date : null;
  return { kg: num(o.kg, 'kg'), fat: num(o.fat_pct, 'fat'), muscle: num(o.muscle_kg, 'muscle'), water: num(o.water_pct, 'water'), date };
}

export const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_B64 = 6_000_000;

export interface AnalyzeDeps { apiKey: string; model: string; fetchImpl?: typeof fetch; today: string }
/** Bild an die Claude-API senden und die Werte auslesen. Wirft bei Fehlern eine Meldung ohne Bildinhalt. */
export async function analyzeScale(input: { image: string; mediaType: string }, deps: AnalyzeDeps): Promise<ScaleValues> {
  if (!MEDIA_TYPES.includes(input.mediaType)) throw new Error('Nur JPEG, PNG oder WebP.');
  if (!input.image || input.image.length > MAX_B64 || !/^[A-Za-z0-9+/=]+$/.test(input.image)) throw new Error('Bild fehlt oder ist zu groß.');
  const res = await (deps.fetchImpl || fetch)('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': deps.apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: deps.model, max_tokens: 300, system: SCALE_PROMPT,
      messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: input.mediaType, data: input.image } }, { type: 'text', text: 'Werte auslesen.' }] }],
    }),
  });
  if (!res.ok) throw new Error(`KI-Dienst antwortet mit Status ${res.status}.`);
  const j = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text || '').join('\n');
  const v = parseScaleJson(text, deps.today);
  if (!v) throw new Error('Die Antwort war nicht auswertbar.');
  return v;
}
