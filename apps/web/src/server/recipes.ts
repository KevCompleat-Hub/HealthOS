// Rezeptideen per KI. Übertragen werden nur Ziele, Zahl der Trainingstage, bevorzugte Zutaten und Wünsche, keine Körperwerte.
export interface RecipeRequest { goals: string[]; trainingDays: number; foods: string[]; wishes?: string }
export interface Recipe { title: string; minutes: number; ingredients: string[]; steps: string[]; fits: string }

export const RECIPE_PROMPT = [
  'Du schlägst alltagstaugliche Rezepte auf Deutsch vor, passend zu den genannten Zielen und Zutaten.',
  'Antworte nur mit JSON: {"recipes":[{"title":"…","minutes":Zahl,"ingredients":["Menge und Zutat"],"steps":["…"],"fits":"ein Satz, warum es zu den Zielen passt"}]}.',
  'Genau 3 Rezepte, je höchstens 30 Minuten, höchstens 8 Zutaten, höchstens 6 Schritte, mindestens 2 Zutaten aus der Liste.',
  'Keine Kalorien- oder Nährwertangaben, keine Gesundheits- oder Heilversprechen, keine Nahrungsergänzungsmittel.',
  'Wünsche des Nutzers (zum Beispiel vegetarisch) beachten. Kein Text außerhalb des JSON.',
].join(' ');

const clip = (s: unknown, n: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

export function parseRecipes(text: string): Recipe[] | null {
  const m = text.replace(/```json|```/g, '').match(/\{[\s\S]*\}/); if (!m) return null;
  let o: { recipes?: unknown[] }; try { o = JSON.parse(m[0]); } catch { return null; }
  if (!Array.isArray(o.recipes)) return null;
  const out = o.recipes.slice(0, 3).map(r => r as Record<string, unknown>).filter(r => r && r.title && Array.isArray(r.ingredients) && Array.isArray(r.steps)).map(r => ({
    title: clip(r.title, 80), minutes: Math.max(1, Math.min(120, Math.round(Number(r.minutes) || 20))),
    ingredients: (r.ingredients as unknown[]).slice(0, 10).map(x => clip(x, 80)).filter(Boolean),
    steps: (r.steps as unknown[]).slice(0, 8).map(x => clip(x, 240)).filter(Boolean),
    fits: clip(r.fits, 200),
  })).filter(r => !/\b\d+\s*(kcal|kalorien)\b/i.test(JSON.stringify(r)));
  return out.length ? out : null;
}

export function validRequest(b: unknown): RecipeRequest | null {
  const x = b as Record<string, unknown>; if (!x || !Array.isArray(x.goals) || !Array.isArray(x.foods)) return null;
  const goals = (x.goals as unknown[]).map(g => clip(g, 40)).filter(Boolean).slice(0, 6);
  const foods = (x.foods as unknown[]).map(f => clip(f, 60)).filter(Boolean).slice(0, 15);
  const trainingDays = Math.max(0, Math.min(7, Math.round(Number(x.trainingDays) || 0)));
  return foods.length ? { goals, foods, trainingDays, wishes: clip(x.wishes, 200) } : null;
}

export async function suggestRecipes(req: RecipeRequest, deps: { apiKey: string; model: string; fetchImpl?: typeof fetch }): Promise<Recipe[]> {
  const user = `Ziele: ${req.goals.join(', ') || 'keine Angabe'}. Trainingstage pro Woche: ${req.trainingDays}. Bevorzugte Zutaten: ${req.foods.join(', ')}.${req.wishes ? ` Wünsche: ${req.wishes}.` : ''}`;
  const res = await (deps.fetchImpl || fetch)('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': deps.apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: deps.model, max_tokens: 1500, system: RECIPE_PROMPT, messages: [{ role: 'user', content: user }] }),
  });
  if (!res.ok) throw new Error(`KI-Dienst antwortet mit Status ${res.status}.`);
  const j = (await res.json()) as { content?: { type: string; text?: string }[] };
  const r = parseRecipes((j.content || []).filter(c => c.type === 'text').map(c => c.text || '').join('\n'));
  if (!r) throw new Error('Die Antwort war nicht auswertbar.');
  return r;
}
