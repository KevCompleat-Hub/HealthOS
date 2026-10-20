// Führt alle originalen Testreihen der Referenz v5 zweimal aus:
//  1. „referenz“: unverändert gegen die eingefrorene Referenz (Kontrollmessung)
//  2. „ts-kern“: alle Fachfunktionen, die der TypeScript-Kern bereitstellt, ersetzen die der Referenz.
//     Oberflächen-Komponenten (App, Screens) kommen weiter aus der Referenz, denn M1 portiert keine Oberfläche.
// Bricht mit Exit-Status 1 ab, sobald eine Reihe nicht vollständig besteht.
import { cpSync, mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { buildSync } from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require = createRequire(import.meta.url);
const SUITES = ['smoke', 'test4', 'test5', 'test6', 'e2e2', 'e2e3', 'e2e4', 'a11y'];
const refPath = path.join(root, 'packages/reference/dist/reference-v5.cjs');
const v2Path = path.join(root, 'packages/reference/dist/reference-v2.cjs');
const corePath = path.join(root, 'tools/parity/.cache/domain.cjs');
mkdirSync(path.dirname(corePath), { recursive: true });
buildSync({ entryPoints: [path.join(root, 'packages/domain/src/index.ts')], bundle: true, platform: 'node', format: 'cjs', target: 'node20', outfile: corePath, logLevel: 'error' });

const R = require(refPath), N = require(corePath);
const fromCore = Object.keys(N).filter(k => k in R);
const uiOnly = Object.keys(R).filter(k => /^[A-Z][a-z]/.test(k) && typeof R[k] === 'function' && !(k in N));

function run(mode) {
  const dir = mkdtempSync(path.join(tmpdir(), `suites-${mode}-`));
  cpSync(path.join(root, 'packages/reference/suites'), dir, { recursive: true });
  const nm = path.join(root, 'node_modules');
  writeFileSync(path.join(dir, 'app.v2.test.js'), `module.exports = require(${JSON.stringify(v2Path)});\n`);
  writeFileSync(path.join(dir, 'app.test.js'), mode === 'referenz'
    ? `module.exports = require(${JSON.stringify(refPath)});\n`
    : `const R = require(${JSON.stringify(refPath)}); const N = require(${JSON.stringify(corePath)});
const H = Object.assign({}, R);
for (const k of ${JSON.stringify(fromCore)}) H[k] = N[k];
// Signatur-Adapter: der Kern liest keine Uhr, die Referenz-Tests rufen ohne Zeitpunkt auf
H.berlinParts = (d = new Date()) => N.berlinParts(d);
H.buildExport = (cfg, data) => N.buildExport(cfg, data, new Date().toISOString());
module.exports = H;\n`);
  const out = [];
  const once = s => {
    const res = spawnSync(process.execPath, [path.join(dir, `${s}.js`)], { cwd: dir, encoding: 'utf8', env: { ...process.env, NODE_PATH: nm }, timeout: 240000 });
    const lines = `${res.stdout}${res.stderr}`.split('\n').filter(l => l.trim() && !/Warning|deprecated/i.test(l));
    const last = lines[lines.length - 1] || '';
    const m = last.match(/(\d+) von (\d+)/);
    const ok = res.status === 0 && !!m && m[1] === m[2] || (res.status === 0 && /alle Screens rendern|0 Probleme/.test(last));
    return { ok, status: res.status, result: last.trim() };
  };
  for (const s of SUITES) {
    let r = once(s), retried = false;
    // Die Klicktests der Referenz arbeiten mit festen Wartezeiten. Unter hoher Rechnerlast wird ein Fehlschlag einmal wiederholt
    // und im Bericht als Wiederholung ausgewiesen.
    if (!r.ok && s.startsWith('e2e')) { const first = r.result; r = once(s); retried = first; }
    out.push({ suite: s, ...r, retried });
  }
  return out;
}
const result = { fromCore: fromCore.length, uiFromReference: uiOnly.length, runs: { referenz: run('referenz'), 'ts-kern': run('ts-kern') } };
mkdirSync(path.join(here, 'parity/reports'), { recursive: true });
writeFileSync(path.join(here, 'parity/reports/reference-suites.json'), JSON.stringify(result, null, 2));
for (const [mode, rows] of Object.entries(result.runs)) { console.log(`\n${mode}`); for (const r of rows) console.log(`  ${r.ok ? 'ok  ' : 'FEHL'} ${r.suite.padEnd(6)} ${r.result}${r.retried ? `  (1. Lauf: ${r.retried})` : ''}`); }
console.log(`\n${fromCore.length} Fachfunktionen und Konstanten aus dem TypeScript-Kern, ${uiOnly.length} Oberflächen-Komponenten aus der Referenz`);
const bad = Object.values(result.runs).flat().filter(r => !r.ok);
process.exit(bad.length ? 1 : 0);
