// Fasst alle Testberichte zu docs/TESTERGEBNISSE.md zusammen. Liest nur vorhandene Berichte, erfindet keine Zahlen.
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rep = f => { const p = path.join(root, 'tools/parity/reports', f); return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null; };
const ZONES = ['Europe/Berlin', 'UTC', 'America/New_York', 'Asia/Tokyo'];
const L = ['# Testergebnisse Phase M1', '', `Erzeugt am ${process.argv[2] || '(Datum fehlt)'} aus den Berichten in tools/parity/reports. Grundlage: Referenz v5.`, ''];
L.push('## Differenztests Referenz v5 gegen TypeScript-Kern', '', '| Zeitzone | Vergleiche | Abweichungen | Aktionen im Zustandsverlauf |', '| --- | --- | --- | --- |');
let allOk = true; const areas = {};
for (const tz of ZONES) {
  const r = rep(`parity-${tz.replace('/', '_')}.json`);
  if (!r) { L.push(`| ${tz} | kein Bericht | | |`); allOk = false; continue; }
  if (r.failures.length) allOk = false;
  L.push(`| ${tz} | ${r.total.toLocaleString('de-DE')} | ${r.failures.length} | ${r.steps.toLocaleString('de-DE')} |`);
  for (const [k, v] of Object.entries(r.counts)) areas[k] = (areas[k] || 0) + v;
}
L.push('', 'Ergänzungslauf Coach-Historie (nach dem ersten Mutationstest hinzugefügt, im Volllauf Asia/Tokyo bereits enthalten):', '', '| Zeitzone | Vergleiche | Abweichungen |', '| --- | --- | --- |');
for (const tz of ZONES) {
  const r = rep(`parity-${tz.replace('/', '_')}-coachHistory.json`);
  if (!r) { L.push(`| ${tz} | kein Bericht | |`); allOk = false; continue; }
  if (r.failures.length) allOk = false;
  L.push(`| ${tz} | ${r.total.toLocaleString('de-DE')} | ${r.failures.length} |`);
  for (const [k, v] of Object.entries(r.counts)) areas[k] = (areas[k] || 0) + v;
}
L.push('', 'Vergleiche je Bereich, Summe über alle Zeitzonen:', '', '| Bereich | Vergleiche |', '| --- | --- |', ...Object.entries(areas).map(([k, v]) => `| ${k} | ${v.toLocaleString('de-DE')} |`));
const m0 = rep('mutants.json'); const m11 = rep('mutants-only-11.json');
const m = m0 && m0.map(x => { const again = m11 && m11.find(y => y.name === x.name); return again && !x.detected ? { ...again, note: 'im ersten Lauf nicht erkannt, nach Ergänzung der Testreihe Coach-Historie erkannt' } : x; });
L.push('', '## Mutationstest', '', 'Jede Mutante ändert genau eine Geschäftsregel in einer Kopie des Kerns. Die Differenztests müssen jede erkennen.', '');
if (m) { L.push('| Eingebauter Fehler | Erkannt | Erste gemeldete Abweichung |', '| --- | --- | --- |', ...m.map(x => `| ${x.name} | ${x.detected ? (x.note ? `ja, ${x.note}` : 'ja') : 'NEIN'} | ${(x.first || x.error || '').replace(/\|/g, '/')} |`)); if (m.some(x => !x.detected)) allOk = false; } else { L.push('Kein Bericht.'); allOk = false; }
const s = rep('reference-suites.json');
L.push('', '## Originale Testreihen der Referenz', '');
if (s) {
  L.push(`Im Modus „ts-kern“ stammen ${s.fromCore} Fachfunktionen und Konstanten aus dem TypeScript-Kern. ${s.uiFromReference} Oberflächen-Komponenten kommen weiterhin aus der Referenz, weil M1 keine Oberfläche portiert.`, '', '| Testreihe | Referenz | TypeScript-Kern |', '| --- | --- | --- |');
  for (let i = 0; i < s.runs.referenz.length; i++) { const a = s.runs.referenz[i], b = s.runs['ts-kern'][i]; const f = x => `${x.ok ? '' : 'FEHLER: '}${x.result}${x.retried ? ` (wiederholt, 1. Lauf: ${x.retried})` : ''}`; L.push(`| ${a.suite} | ${f(a)} | ${f(b)} |`); if (!a.ok || !b.ok) allOk = false; }
} else { L.push('Kein Bericht.'); allOk = false; }
const u = rep('unit.json');
L.push('', '## Fachliche Unit-Tests (Vitest)', '', u ? `${u.numPassedTests} von ${u.numTotalTests} bestanden, ${u.numFailedTests} fehlgeschlagen.` : 'Kein Bericht.');
if (!u || u.numFailedTests) allOk = false;
L.push('', `**Gesamtergebnis: ${allOk ? 'alle Prüfungen bestanden' : 'NICHT alle Prüfungen bestanden'}**`);
writeFileSync(path.join(root, 'docs/TESTERGEBNISSE.md'), L.join('\n') + '\n');
console.log(L.slice(-1)[0]);
process.exit(allOk ? 0 : 1);
