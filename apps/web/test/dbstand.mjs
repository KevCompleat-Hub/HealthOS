// Lokaler Prüfstand für die Datenbankanbindung: PostgreSQL + PostgREST (die Datenschnittstelle von Supabase)
// + ein kleiner Proxy, der wie Supabase unter /rest/v1 antwortet. Tokens werden wie bei Supabase signiert (HS256),
// inklusive Sicherheitsstufe „aal“. Supabase Auth selbst ist hier nicht enthalten.
import { spawn } from 'node:child_process';
import http from 'node:http';
import { createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const SECRET = 'lokaler-pruefstand-geheimnis-nur-fuer-tests-0123456789';
export const URL_ = 'http://127.0.0.1:54321';
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
export function token(sub, aal = 'aal2') {
  const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ sub, role: 'authenticated', aal, exp: Math.floor(Date.now() / 1000) + 3600 });
  return `${h}.${p}.${createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`;
}
export function client(sub, aal = 'aal2') {
  return createClient(URL_, 'oeffentlicher-test-schluessel', sub ? { accessToken: async () => token(sub, aal) } : {});
}
let pg, proxy;
export async function start(db = 'hosbeta') {
  pg = spawn(process.env.POSTGREST || '/tmp/postgrest', [], { env: { ...process.env, PGRST_DB_URI: `postgres://authenticator:lokal-nur-test@127.0.0.1:5432/${db}`, PGRST_DB_SCHEMAS: 'public', PGRST_DB_ANON_ROLE: 'anon', PGRST_JWT_SECRET: SECRET, PGRST_SERVER_PORT: '3001', PGRST_LOG_LEVEL: 'crit' }, stdio: 'ignore' });
  proxy = http.createServer((req, res) => {
    if (!req.url.startsWith('/rest/v1')) { res.writeHead(404); return res.end(); }
    const up = http.request({ host: '127.0.0.1', port: 3001, path: req.url.slice(8) || '/', method: req.method, headers: { ...req.headers, host: '127.0.0.1:3001' } }, r => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    up.on('error', () => { res.writeHead(502); res.end(); });
    req.pipe(up);
  }).listen(54321);
  for (let i = 0; i < 50; i++) { try { const r = await fetch('http://127.0.0.1:3001/'); if (r.ok) return; } catch { /* wartet */ } await new Promise(r => setTimeout(r, 200)); }
  throw new Error('PostgREST startet nicht');
}
export function stop() { try { pg && pg.kill(); } catch { /* */ } try { proxy && proxy.close(); } catch { /* */ } }
