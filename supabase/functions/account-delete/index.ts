// Supabase Edge Function „account-delete“: löscht das eigene Konto nach eindeutiger Bestätigung (Entscheidung E-5).
// Alle Tabellen hängen mit „on delete cascade“ am Konto, damit werden Dokumente, Einwilligungen, Geräte und Protokolle mitgelöscht.
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { fehler: 'Nur POST' });
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json(401, { fehler: 'Bitte anmelden' });
  const body = await req.json().catch(() => ({})) as { bestaetigung?: string };
  if (body.bestaetigung !== 'LÖSCHEN') return json(400, { fehler: 'Bestätigung fehlt' });
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return json(500, { fehler: 'Löschen fehlgeschlagen' });
  return json(200, { geloescht: true });
});
