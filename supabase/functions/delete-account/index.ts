// Supabase Edge Function „delete-account“: löscht das Konto des angemeldeten Nutzers (Entscheidung E-5).
// Alle Daten hängen mit „on delete cascade“ am Konto. Nur der Nutzer selbst kann sein Konto löschen, mit ausdrücklicher Bestätigung.
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { fehler: 'Nur POST' });
  const body = await req.json().catch(() => ({})) as { confirm?: string };
  if (body.confirm !== 'LÖSCHEN') return json(400, { fehler: 'Bestätigung fehlt' });
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json(401, { fehler: 'Bitte anmelden' });
  const { error } = await admin.auth.admin.deleteUser(user.id);
  return error ? json(500, { fehler: 'Löschen fehlgeschlagen' }) : json(200, { geloescht: true });
});
