// Ordnet jeden Top-Level-Namen der Referenz v5 einem Modul des TypeScript-Kerns zu oder begründet, warum er nicht portiert ist.
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ref = readFileSync(path.join(root, 'packages/reference/v5/app.jsx'), 'utf8');
const names = [...new Set([...ref.matchAll(/^(?:function|const|let)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]))];
const files = []; const walk = d => readdirSync(d).forEach(f => { const p = path.join(d, f); statSync(p).isDirectory() ? walk(p) : f.endsWith('.ts') && files.push(p); });
walk(path.join(root, 'packages/domain/src'));
const where = {};
for (const f of files) { const s = readFileSync(f, 'utf8'); for (const m of s.matchAll(/^export (?:const|function|let)\s+([A-Za-z_$][\w$]*)/gm)) where[m[1]] = path.relative(path.join(root, 'packages/domain/src'), f); }
const INTERNAL = { _id: 'interner Zähler, jetzt in util/ids.ts (configureIds)', _fmtBerlin: 'interner Cache, jetzt modulintern in util/date.ts', clone: 'in util/ids.ts' };
const NOT_PORTED = {
  Store: 'Speicher-Adapter der Claude-Laufzeit (claude.use("db")). Wird in M2 durch Repositories auf Supabase ersetzt.',
  OB_STEPS: 'Ablauf der Einrichtungs-Oberfläche (UI, M3)', TABS: 'Navigation (UI)', TAB_OF: 'Navigation (UI)', SET_SECTIONS: 'Einstellungs-Oberfläche (UI)',
  ICONS: 'Symbole (UI)', SOURCE_LABEL: 'Anzeigetexte für Quellen (UI)', EMPTY_BODY: 'Formular-Vorbelegung (UI)', STEPS: 'Schrittfolge des Review-Ablaufs in der Oberfläche (UI, M3)', setSec: 'Setter für Einstellungsformulare (UI)', sectionSummary: 'Kurztext je Einstellungsbereich für die Oberfläche (UI, M3). Reine Anzeige, keine Geschäftsregel.',
};
const rows = names.map(n => {
  if (where[n]) return [n, 'portiert', where[n]];
  if (INTERNAL[n]) return [n, 'intern', INTERNAL[n]];
  if (NOT_PORTED[n]) return [n, 'bewusst nicht portiert', NOT_PORTED[n]];
  if (/^[A-Z][a-z]/.test(n) || /^use[A-Z]/.test(n)) return [n, 'Oberfläche (M3)', 'React-Komponente oder Hook'];
  return [n, 'OFFEN', 'nicht zugeordnet'];
});
const open = rows.filter(r => r[1] === 'OFFEN');
const md = ['# Funktionsabdeckung Referenz v5 → TypeScript-Kern', '', `Automatisch erzeugt von tools/coverage-map.mjs. ${names.length} Top-Level-Namen der Referenz.`, '',
  ...['portiert', 'intern', 'bewusst nicht portiert', 'Oberfläche (M3)', 'OFFEN'].map(k => `- ${k}: ${rows.filter(r => r[1] === k).length}`), '',
  '| Name in der Referenz | Zuordnung | Modul oder Begründung |', '| --- | --- | --- |', ...rows.map(r => `| \`${r[0]}\` | ${r[1]} | ${r[2]} |`)];
mkdirSync(path.join(root, 'docs'), { recursive: true });
writeFileSync(path.join(root, 'docs/FUNKTIONSABDECKUNG.md'), md.join('\n') + '\n');
console.log(md.slice(0, 9).join('\n'));
if (open.length) { console.log('Nicht zugeordnet:', open.map(r => r[0]).join(', ')); process.exit(1); }
