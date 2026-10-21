// Alle Tests der Web-App. Bricht beim ersten Fehler mit Exit-Status 1 ab.
// Der Datenbank-Prüfstand braucht ein lokales PostgreSQL (siehe supabase/local/README.md) und PostgREST.
import { spawnSync } from 'node:child_process';
const steps = [
  ['Typprüfung', 'npx', ['tsc', '--noEmit']],
  ['Geheimnis-Prüfung', 'node', ['../../tools/secrets-scan.mjs']],
  ['Screenshot-Auswertung (ohne Netz)', 'node', ['test/scale.mjs']],
  ['Rezeptideen (ohne Netz)', 'node', ['test/recipes.mjs']],
  ['Erinnerungslogik Push (ohne Netz)', 'node', ['test/push.mjs']],
  ['Konto: Export und Löschung', 'node', ['test/account.mjs']],
  ['Morning Briefing', 'node', ['test/briefing.mjs']],
  ['Oberfläche Beta (Speicher wie Supabase)', 'node', ['test/ui.mjs', 'beta']],
  ['Oberfläche Entwicklungs-Demo', 'node', ['test/ui.mjs', 'demo']],
  ['Motivation und Review-Korrekturen (Beta)', 'node', ['test/ui-w5.mjs', 'beta']],
  ['Motivation und Review-Korrekturen (Demo)', 'node', ['test/ui-w5.mjs', 'demo']],
];
if (process.env.HEALTHOS_DB_TEST) steps.push(['Anbindung über Supabase-Client', 'node', ['test/db.mjs']], ['Oberfläche gegen Datenbank', 'node', ['test/ui.mjs', 'beta-db']]);
for (const [name, cmd, args] of steps) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', env: { ...process.env, TZ: process.env.TZ || 'UTC' } });
  const last = `${r.stdout}${r.stderr}`.trim().split('\n').filter(l => !/Warning|act\(/.test(l)).pop() || '';
  console.log(`${r.status === 0 ? 'ok  ' : 'FEHL'} ${name}: ${r.status === 0 && cmd === 'npx' ? 'fehlerfrei' : last}`);
  if (r.status !== 0) process.exit(1);
}
