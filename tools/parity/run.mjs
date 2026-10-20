// Differenztests Referenz v5 gegen TypeScript-Kern.
// Aufruf ohne Argumente: läuft in vier Zeitzonen als eigene Prozesse und bricht bei jeder Abweichung mit Exit-Status 1 ab.
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadModules } from './load.mjs';
import { Checker } from './canon.mjs';
import { catalogs, dates, berlin, configs, labs, imports, coachHistory } from './suites-basic.mjs';
import { scenarios } from './suites-scenario.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ZONES = ['Europe/Berlin', 'UTC', 'America/New_York', 'Asia/Tokyo'];
const quick = process.argv.includes('--quick');

if (!process.argv.includes('--child')) {
  mkdirSync(path.join(here, 'reports'), { recursive: true });
  let failed = false; const summary = [];
  for (const tz of ZONES) {
    const t0 = Date.now();
    const res = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--child', ...(quick ? ['--quick'] : [])], { env: { ...process.env, TZ: tz }, stdio: 'inherit' });
    const rep = JSON.parse(readFileSync(path.join(here, 'reports', `parity-${tz.replace('/', '_')}.json`), 'utf8'));
    summary.push({ tz, total: rep.total, failures: rep.failures.length, steps: rep.steps, seconds: Math.round((Date.now() - t0) / 1000) });
    if (res.status !== 0) failed = true;
  }
  writeFileSync(path.join(here, 'reports', 'parity-summary.json'), JSON.stringify({ when: new Date().toISOString(), quick, zones: summary }, null, 2));
  console.log('\nZusammenfassung');
  for (const s of summary) console.log(`  ${s.tz.padEnd(18)} ${String(s.total).padStart(8)} Vergleiche, ${s.failures} Abweichungen, ${s.steps} Aktionen, ${s.seconds} s`);
  process.exit(failed ? 1 : 0);
}

mkdirSync(path.join(here, 'reports'), { recursive: true });
const { R, N } = loadModules();
const C = new Checker();
const tz = process.env.TZ;
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7);
if (only === 'coachHistory') {
  coachHistory(C, R, N, 1500);
  const rep = { tz, total: C.total, counts: C.counts, steps: 0, failures: C.failures };
  writeFileSync(path.join(here, 'reports', `parity-${tz.replace('/', '_')}-coachHistory.json`), JSON.stringify(rep, null, 2));
  console.log(`[${tz}] Coach-Historie: ${C.total} Vergleiche, ${C.failures.length} Abweichungen`);
  for (const f of C.failures.slice(0, 3)) console.log(`  ABWEICHUNG ${f.label}\n    Referenz: …${f.ref}…\n    Neu:      …${f.neu}…`);
  process.exit(C.failures.length ? 1 : 0);
}
catalogs(C, R, N);
dates(C, R, N);
berlin(C, R, N);
configs(C, R, N, quick ? 300 : 3000);
labs(C, R, N, quick ? 500 : 5000);
imports(C, R, N, quick ? 150 : 1500);
coachHistory(C, R, N, quick ? 300 : 1500);
const steps = scenarios(C, R, N, quick ? { configsN: 6, startsN: 12, days: 14 } : { configsN: 12, startsN: 24, days: 21 });
const rep = { tz, total: C.total, counts: C.counts, steps, failures: C.failures };
writeFileSync(path.join(here, 'reports', `parity-${tz.replace('/', '_')}.json`), JSON.stringify(rep, null, 2));
console.log(`[${tz}] ${C.total} Vergleiche, ${C.failures.length} Abweichungen, ${steps} Aktionen`);
for (const f of C.failures.slice(0, 5)) console.log(`  ABWEICHUNG ${f.area} | ${f.label}\n    Referenz: …${f.ref}…\n    Neu:      …${f.neu}…`);
process.exit(C.failures.length ? 1 : 0);
