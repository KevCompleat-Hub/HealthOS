// Anbindungstest: Speicherschicht der App (supabaseBackend + Store) über den echten Supabase-Client gegen den Prüfstand.
import { buildSync } from 'esbuild';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { start, stop, client } from './dbstand.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '../.test/storage.cjs');
buildSync({ entryPoints: [path.join(here, '../src/storage/index-test.js')], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error' });
const { supabaseBackend, Store, configureBackend } = createRequire(import.meta.url)(out);
const A = '11111111-1111-1111-1111-111111111111', B = '22222222-2222-2222-2222-222222222222';
let n = 0, f = 0; const ok = (c, m) => { n++; if (!c) f++; console.log(`${c ? 'ok  ' : 'FEHL'} ${m}`); };
const fails = async p => { try { await p; return false; } catch { return true; } };

await start();
try {
  const a1 = client(A, 'aal1'), a2 = client(A), b2 = client(B), anon = client(null);
  // Ausgangszustand herstellen: eigene Daten und Einwilligungen der Testkonten entfernen (Löschen ist ohne Einwilligung erlaubt)
  for (const [cl, id] of [[a2, A], [b2, B]]) { await cl.from('app_documents').delete().eq('user_id', id); await cl.from('beta_consents').delete().eq('user_id', id); }
  ok(await fails(supabaseBackend(a2, A).put('settings', { schema: 2 })), 'ohne Einwilligung wird nichts gespeichert');
  ok((await a1.from('beta_consents').insert({ user_id: A, version: 'beta-1' })).error != null, 'Einwilligung erst nach zweitem Faktor');
  ok((await a2.from('beta_consents').insert({ user_id: A, version: 'beta-1' })).error == null, 'Einwilligung mit zweitem Faktor gespeichert');
  const be = supabaseBackend(a2, A);
  await be.put('settings', { schema: 2, config: { onboardingDone: true } });
  await be.put('plan', { schema: 2, routines: [] });
  await be.put('week:2026-10-19', { schema: 2, weekStart: '2026-10-19', items: [{ id: 'r:pause1-ho:2026-10-20', status: 'erledigt' }] });
  await be.put('settings', { schema: 2, config: { onboardingDone: true, goals: ['fitter'] } });
  const all = await be.getAll();
  ok(all.length === 3 && all.find(d => d.key === 'settings').body.config.goals[0] === 'fitter', `Speichern, Überschreiben und Laden (${all.map(d => d.key).join(', ')})`);
  configureBackend(be); const c = await Store.connect(); const loaded = await Store.load(c);
  ok(loaded && loaded.weeks[0].id === '2026-10-19' && loaded.weeks[0].items[0].status === 'erledigt', 'Store lädt den Wochenplan wie die Referenz');
  ok(await fails(be.put('labs', {})), 'unbekannter Dokumentschlüssel wird in der App abgewiesen');
  ok((await a2.from('app_documents').upsert({ user_id: A, doc_key: 'activity', body: { weights: [] } })).error != null, 'Gewicht wird von der Datenbank abgewiesen');
  ok((await supabaseBackend(a1, A).getAll()).length === 0, 'mit nur einem Faktor unsichtbar');
  await b2.from('beta_consents').insert({ user_id: B, version: 'beta-1' });
  const beB = supabaseBackend(b2, B);
  ok((await beB.getAll()).length === 0, 'anderer Nutzer sieht keine fremden Dokumente');
  ok((await b2.from('app_documents').upsert({ user_id: A, doc_key: 'plan', body: {} })).error != null, 'anderer Nutzer kann nicht für fremde Konten schreiben');
  await beB.removeAll();
  ok((await be.getAll()).length === 3, 'Löschen des anderen Nutzers betrifft fremde Daten nicht');
  const anonRes = await anon.from('app_documents').select('*');
  ok(anonRes.error != null || (anonRes.data || []).length === 0, 'ohne Anmeldung kein Zugriff');
  const exp = await a2.rpc('export_my_beta_data');
  ok(!exp.error && exp.data.documents.length === 3 && exp.data.consents.length === 1, 'Export aller eigenen Beta-Daten');
  await be.remove('plan'); await be.removeAll();
  ok((await be.getAll()).length === 0, 'Löschen aller eigenen Dokumente');
} finally { stop(); }
console.log(`\n${n - f} von ${n} Anbindungstests bestanden`);
process.exit(f ? 1 : 0);
