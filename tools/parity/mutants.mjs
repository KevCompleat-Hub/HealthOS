// Mutationstest: Prüft, dass die Differenztests absichtlich eingebaute Regelabweichungen tatsächlich erkennen.
// Jede Mutante ändert genau eine Geschäftsregel in einer Kopie des Kerns. Erwartung: mindestens eine Abweichung.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '../../packages/domain/src');
export const MUTANTS = [
  ['Tageswechsel: optionale Erfassung wird „verpasst“', 'plan/materialize.ts', "status: c === 'optional_logging' ? 'nicht_erfasst' : 'verpasst'", "status: 'verpasst'"],
  ['Empfehlungen: drei statt zwei neue pro Woche', 'intelligence.ts', 'Math.max(0, 2 - introduced)', 'Math.max(0, 3 - introduced)'],
  ['Check-in-Fenster einen Tag kürzer', 'review/schedule.ts', 'end: addDays(target, 9)', 'end: addDays(target, 8)'],
  ['Wochenziel ignoriert pausierte Routinen', 'review/coverage.ts', "if (rt.status === 'pausiert' && rt.pausedSince && d >= rt.pausedSince) return; ", ''],
  ['Alle zwei Wochen wird jede Woche', 'plan/routines.ts', 'if ((v.interval || 1) > 1 &&', 'if ((v.interval || 1) > 2 &&'],
  ['Laborwert gilt nur 12 statt 18 Monate', 'intelligence.ts', 'daysBetween(l.date, today) > 548', 'daysBetween(l.date, today) > 365'],
  ['Zeitzone London statt Berlin', 'util/date.ts', "timeZone: 'Europe/Berlin'", "timeZone: 'Europe/London'"],
  ['Einzeländerung wird von der Planung überschrieben', 'plan/materialize.ts', '!it.movedFrom && !it.override &&', '!it.movedFrom &&'],
  ['Training doppelt gezählt', 'status.ts', 'w.counts && !w.itemId && inWeek', 'w.counts && inWeek'],
  ['Pause aufheben stellt Plan nicht wieder her', 'plan/materialize.ts', "if (it.status === 'pausiert') { const { pauseId", "if (false) { const { pauseId"],
  ['Verpasster Check-in wird nicht nacherfasst', 'review/schedule.ts', "it.status === 'verpasst' ? A.lateLog(n, it.id) : ", ''],
  ['Coach blockiert drei statt zwei Reviews', 'review/coach.ts', 'recent: idx < 2', 'recent: idx < 3'],
];

if (process.argv.includes('--one')) {
  const { loadModules } = await import('./load.mjs');
  const { Checker } = await import('./canon.mjs');
  const B = await import('./suites-basic.mjs'); const S = await import('./suites-scenario.mjs');
  const { R, N } = loadModules(); const C = new Checker();
  try { B.catalogs(C, R, N); B.berlin(C, R, N); B.configs(C, R, N, 200); B.labs(C, R, N, 600); B.coachHistory(C, R, N, 300); S.scenarios(C, R, N, { configsN: 6, startsN: 12, days: 14 }); } catch (e) { C.failures.push({ area: 'Absturz', label: String(e) }); }
  console.log(JSON.stringify({ total: C.total, failures: C.failures.length, first: C.failures[0] && `${C.failures[0].area} | ${C.failures[0].label}` }));
  process.exit(0);
}
const results = [];
const pick = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7);
for (const [mi, [name, file, from, to]] of MUTANTS.entries()) {
  if (pick && !pick.split(',').map(Number).includes(mi)) continue;
  const dir = mkdtempSync(path.join(tmpdir(), 'mutant-'));
  cpSync(src, dir, { recursive: true });
  const f = path.join(dir, file); const code = readFileSync(f, 'utf8');
  if (!code.includes(from)) { results.push({ name, error: 'Stelle nicht gefunden' }); continue; }
  writeFileSync(f, code.replace(from, to));
  const res = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--one'], { env: { ...process.env, DOMAIN_SRC: dir, TZ: 'Europe/Berlin' }, encoding: 'utf8' });
  const out = JSON.parse(res.stdout.trim().split('\n').pop());
  results.push({ name, detected: out.failures > 0, ...out });
  console.log(`${out.failures > 0 ? 'erkannt   ' : 'NICHT ERKANNT'} ${name}  (${out.first || '-'})`);
}
mkdirSync(path.join(here, 'reports'), { recursive: true });
writeFileSync(path.join(here, 'reports', pick ? `mutants-only-${pick}.json` : 'mutants.json'), JSON.stringify(results, null, 2));
const missed = results.filter(r => !r.detected).length;
console.log(`${results.length - missed} von ${results.length} Mutanten erkannt`);
process.exit(missed ? 1 : 0);
