// POST /api/rezepte: Rezeptideen. Nur angemeldet, nur mit Einwilligung „ki-2“, keine Körperwerte, keine Speicherung.
import { createClient } from '@supabase/supabase-js';
import { suggestRecipes, validRequest } from '../../../server/recipes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const hits = new Map<string, number[]>();
const limited = (id: string) => { const now = Date.now(); const l = (hits.get(id) || []).filter(t => now - t < 3600_000); l.push(now); hits.set(id, l); return l.length > 10; };
const out = (status: number, body: unknown) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY, url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!apiKey || !url || !anon) return out(503, { fehler: 'Rezeptideen sind noch nicht eingerichtet.' });
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  if (!token) return out(401, { fehler: 'Bitte anmelden.' });
  const sb = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: { user } } = await sb.auth.getUser(token);
  if (!user) return out(401, { fehler: 'Bitte erneut anmelden.' });
  const c = await sb.from('beta_consents').select('version').eq('version', 'ki-2').maybeSingle();
  if (!c.data) return out(403, { fehler: 'Für Rezeptideen fehlt deine Einwilligung.' });
  if (limited(user.id)) return out(429, { fehler: 'Zu viele Anfragen in kurzer Zeit. Bitte später erneut versuchen.' });
  const body = validRequest(await req.json().catch(() => null));
  if (!body) return out(400, { fehler: 'Ungültige Anfrage.' });
  try { return out(200, { rezepte: await suggestRecipes(body, { apiKey, model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5' }) }); }
  catch (e) { return out(422, { fehler: (e as Error).message || 'Rezeptideen sind gerade nicht möglich.' }); }
}
