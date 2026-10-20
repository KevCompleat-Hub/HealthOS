// Baut die eingefrorene Referenz v5 (und v2 für Migrationstests) als Node-Modul.
// Der Quelltext wird NICHT verändert: alle Top-Level-Namen werden nur zusätzlich über einen Footer exportiert.
import { readFileSync, mkdirSync, createHash } from './build-helpers.mjs';
import { transformSync } from 'esbuild';
import { writeFileSync } from 'node:fs';

const banner = "const React=require('react');const ReactDOM=require('react-dom/client');";
function build(src, out, expectedSha) {
  const code = readFileSync(new URL(src, import.meta.url), 'utf8');
  if (expectedSha) {
    const sha = createHash('sha256').update(code).digest('hex');
    if (sha !== expectedSha) { console.error(`Referenz ${src} wurde verändert (SHA-256 ${sha}). Abbruch.`); process.exit(1); }
  }
  const names = [...new Set([...code.matchAll(/^(?:function|const|let)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]))];
  const footer = `\nmodule.exports = Object.assign({}, module.exports, { ${names.join(', ')} });\n`;
  const res = transformSync(code, { loader: 'jsx', target: 'es2019', banner, footer });
  mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
  writeFileSync(new URL(out, import.meta.url), res.code);
  console.log(`${out}: ${names.length} exportierte Namen`);
}
const sums = Object.fromEntries(readFileSync(new URL('./PRUEFSUMMEN-v5.txt', import.meta.url), 'utf8').trim().split('\n').map(l => { const [h, f] = l.split(/\s+/); return [f, h]; }));
build('./v5/app.jsx', './dist/reference-v5.cjs', sums['referenz/app.jsx']);
build('./v2/app.v2.jsx', './dist/reference-v2.cjs', sums['referenz/v2/app.v2.jsx']);
