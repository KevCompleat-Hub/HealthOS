// Supabase Edge Function „push-tick“: alle 15 Minuten über pg_cron aufgerufen, sendet fällige Erinnerungen per Web-Push.
// Einrichtung: erzeugt beim ersten Aufruf mit {"setup": true} die VAPID-Schlüssel und ein Cron-Geheimnis in public.push_config
// (nur mit Service-Rolle lesbar). Test: {"test": true} mit Nutzer-Token sendet eine Probe an die eigenen Geräte.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { dueReminders, weekStart, berlinNow, type UserDocs } from './logic.ts';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
// CORS: Die Testnachricht wird aus dem Browser aufgerufen (Fehler aus W8, im Audit-Durchgang gefunden)
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

async function config() {
  const { data } = await admin.from('push_config').select('*').eq('id', 1).maybeSingle();
  return data as { public_key: string; private_key: string; cron_secret: string; subject: string } | null;
}

async function send(cfg: { public_key: string; private_key: string; subject: string }, subs: { id: string; endpoint: string; p256dh: string; auth: string }[], payload: unknown) {
  webpush.setVapidDetails(cfg.subject, cfg.public_key, cfg.private_key);
  let ok = 0;
  for (const s of subs) {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 3600 }); ok++; }
    catch (e) { const code = (e as { statusCode?: number }).statusCode; if (code === 404 || code === 410) await admin.from('push_subscriptions').delete().eq('id', s.id); }
  }
  return ok;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { fehler: 'Nur POST' });
  const body = await req.json().catch(() => ({})) as { setup?: boolean; test?: boolean };
  let cfg = await config();
  if (body.setup) {
    if (cfg) return json(200, { ok: true, vorhanden: true });
    const k = webpush.generateVAPIDKeys();
    const secret = crypto.randomUUID() + crypto.randomUUID();
    const { error } = await admin.from('push_config').insert({ id: 1, public_key: k.publicKey, private_key: k.privateKey, cron_secret: secret, subject: 'mailto:noreply@healthos.invalid' });
    return error ? json(500, { fehler: 'Einrichtung fehlgeschlagen' }) : json(200, { ok: true, angelegt: true });
  }
  if (!cfg) return json(503, { fehler: 'Noch nicht eingerichtet' });
  if (body.test) {
    const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json(401, { fehler: 'Bitte anmelden' });
    const { data: subs } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', user.id);
    const n = await send(cfg, subs || [], { title: 'EvoVive', body: 'Erinnerungen sind eingerichtet. So sieht eine Nachricht aus.', url: '/' });
    return json(200, { gesendet: n });
  }
  if (req.headers.get('x-cron-secret') !== cfg.cron_secret) return json(401, { fehler: 'Nicht berechtigt' });
  const now = new Date(); const { date } = berlinNow(now);
  const { data: subs } = await admin.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth');
  const byUser = new Map<string, typeof subs>();
  for (const s of subs || []) byUser.set(s.user_id, [...(byUser.get(s.user_id) || []), s]);
  let sent = 0;
  for (const [userId, list] of byUser) {
    const { data: docs } = await admin.from('app_documents').select('doc_key, body').eq('user_id', userId).in('doc_key', ['settings', 'habits', `week:${weekStart(date)}`]);
    const d: UserDocs = {};
    for (const x of docs || []) { if (x.doc_key === 'settings') d.settings = x.body; else if (x.doc_key === 'habits') d.habits = x.body; else d.week = x.body; }
    for (const rem of dueReminders(d, now)) {
      const { data: fresh } = await admin.from('push_log').insert({ user_id: userId, key: rem.key }).select('key');
      if (!fresh || !fresh.length) continue; // schon gesendet
      sent += await send(cfg, list || [], { title: rem.title, body: rem.body, url: rem.url, tag: rem.key });
    }
  }
  await admin.from('push_log').delete().lt('sent_at', new Date(Date.now() - 14 * 86400000).toISOString());
  return json(200, { gesendet: sent });
});
