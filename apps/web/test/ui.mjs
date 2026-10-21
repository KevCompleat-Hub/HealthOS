// Klicktests der echten Web-Oberfläche (generierte Referenz-UI + M1-Kern + Beta-Schalter) in jsdom.
// Aufruf: node test/ui.mjs beta|demo. Bricht bei einem Fehler mit Exit-Status 1 ab.
import { buildSync } from 'esbuild';
import { JSDOM } from 'jsdom';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';

const mode = process.argv[2] || 'beta';
const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, '..');
mkdirSync(path.join(web, '.test'), { recursive: true });
const entry = path.join(web, '.test/entry.jsx');
writeFileSync(entry, `export { App } from '../src/legacy/HealthOSApp.jsx';\nexport { configureBackend } from '../src/storage/store.js';\nexport { browserBackend, supabaseBackend } from '../src/storage/backends.js';\nexport { FEATURES } from '../src/features.js';\n`);
const out = path.join(web, `.test/bundle-${mode}.cjs`);
buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, jsx: 'automatic', loader: { '.js': 'jsx' }, external: ['react', 'react-dom'], define: { 'process.env.NEXT_PUBLIC_HEALTHOS_MODE': JSON.stringify(mode === 'beta-db' ? 'beta' : mode) }, logLevel: 'error' });

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://healthos.test/', pretendToBeVisual: true });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, FileReader: dom.window.FileReader, localStorage: dom.window.localStorage });
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
window.scrollTo = () => {};
window.fetch = globalThis.fetch; window.Headers = globalThis.Headers; window.Request = globalThis.Request; window.Response = globalThis.Response;
const require = createRequire(import.meta.url);
const React = require('react'); const { createRoot } = require('react-dom/client'); const { act } = React;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const M = require(out);

let n = 0, fails = 0;
const ok = (c, msg) => { n++; if (!c) fails++; console.log(`${c ? 'ok  ' : 'FEHL'} ${msg}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const wait = async ms => { await act(async () => { await sleep(ms); }); };
const text = () => document.body.textContent;
const buttons = () => [...document.querySelectorAll('button')];
const byText = re => buttons().find(b => (typeof re === 'string' ? b.textContent.trim() === re : re.test(b.textContent.trim())));
const click = async el => { if (!el) throw new Error('Element fehlt'); await act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }); await wait(30); };
const setVal = async (el, v) => { const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); await act(async () => { el.dispatchEvent(new window.Event('input', { bubbles: true })); el.dispatchEvent(new window.Event('change', { bubbles: true })); }); };

// Speicher-Backend: im Beta-Test ein Speicher, der sich wie die Supabase-Tabelle verhält
const mem = new Map();
const memBackend = { kind: 'memory', async getAll() { if (process.env.DEBUG) console.log("  getAll", mem.size); return [...mem].map(([key, body]) => ({ key, body: JSON.parse(body) })); }, async put(k, b) { if (process.env.DEBUG) console.log("  put", k); mem.set(k, JSON.stringify(b)); }, async remove(k) { mem.delete(k); }, async removeAll() { mem.clear(); } };
let backend = mode === 'demo' ? M.browserBackend(window.localStorage) : memBackend;
let dbstand = null;
if (mode === 'beta-db') {
  dbstand = await import('./dbstand.mjs'); await dbstand.start();
  const C = '33333333-3333-3333-3333-333333333333'; const sb = dbstand.client(C);
  await sb.from('app_documents').delete().eq('user_id', C); await sb.from('beta_consents').delete().eq('user_id', C); const ins = await sb.from('beta_consents').insert({ user_id: C, version: 'beta-4' }); if (ins.error) throw new Error('Einwilligung im Testaufbau: ' + ins.error.message);
  backend = M.supabaseBackend(sb, C);
  if (process.env.DEBUG) { const put0 = backend.put; backend.put = async (k, b) => { const t0 = Date.now(); try { await put0(k, b); console.log('  put ok', k, Date.now() - t0, 'ms'); } catch (e) { console.log('  put FEHLER', k, e.message); throw e; } }; }
  process.on('exit', () => dbstand.stop());
}
const docsNow = async () => Object.fromEntries((await backend.getAll()).map(d => [d.key, d.body]));
const now = () => new Date('2026-10-20T07:30:00Z'); // Dienstag, 09:30 in Berlin
let signedOut = false;
let root;
const mount = async () => {
  if (root) await act(async () => root.unmount());
  document.body.innerHTML = '<div id="root"></div>';
  M.configureBackend(backend);
  root = createRoot(document.getElementById('root'));
  await act(async () => root.render(React.createElement(M.App, { getNow: now, account: mode !== 'demo' ? { email: 'tester@example.org', signOut: () => { signedOut = true; } } : null })));
  await wait(300);
};

console.log(`# Modus ${mode}`);
await mount();
ok(!!document.querySelector('.ob, [class*="onboard"]') || /Was möchtest du erreichen/.test(text()), 'Einrichtung startet beim ersten Öffnen');
ok(!/Blutwerte verbessern|Blutwerte/.test([...document.querySelectorAll('.chip, button')].map(b => b.textContent).join('|')), 'Ziel „Blutwerte“ in der Beta nicht wählbar');
for (let i = 0; i < 12; i++) { const w = byText('Weiter'); if (!w) break; await click(w); if (/Ernährung und Tracking/.test(text())) ok(!/Kalorien und Makros/.test(text()) && /Gewicht tracken/.test(text()), 'Einrichtung fragt Gewicht, aber keine Kalorien ab'); }
const finish = byText('Plan übernehmen');
ok(!!finish, `Abschluss der Einrichtung vorhanden (${finish && finish.textContent.trim()})`);
await click(finish); await wait(1200);
ok(/Als Nächstes/.test(text()), 'Heute-Ansicht nach der Einrichtung');
const tabs = [...document.querySelectorAll('.tabbar button')].map(b => b.textContent);
ok(tabs.length === 4 && !tabs.includes('Gesundheit'), `Navigation ohne Gesundheit (${tabs.join(', ')})`);
ok(!/Empfehlung für dich|Nächste Termine/.test(text()), 'Heute ohne Empfehlungen und Arzttermine');
ok([...document.querySelectorAll('.stat')].some(s => /Gewicht/.test(s.textContent)), 'Heute zeigt die Gewicht-Kachel');
const quick = [...document.querySelectorAll('.quick-btn')].map(b => b.textContent);
ok(quick.join() === 'Gewicht,Schritte,Training,Mahlzeit', `Schnell erfassen: Gewicht, Schritte, Training, Mahlzeit (${quick.join(', ')})`);
if (mode !== 'demo') ok(!/fiktiv/i.test(text()) && /Geschlossene Beta/.test(text()), 'Beta zeigt keine Demo-Daten');
if (mode === 'demo') ok(/Demo, fiktive Daten/.test(text()), 'Demo ist als fiktiv gekennzeichnet');
const keys = Object.keys(await docsNow());
await click(document.querySelector('button[aria-label="Einstellungen"]')); console.log('  Speicherstatus:', (document.querySelector('.store-ok, .err') || {}).textContent); await click([...document.querySelectorAll('.tabbar button')][0]);
ok(['settings', 'plan', 'habits', 'activity'].every(k => keys.includes(k)) && keys.some(k => k.startsWith('week:')), `Gespeichert: ${keys.sort().join(', ')}`);

// Training erfassen und dauerhaft speichern
await click(byText(/Erfassen$/) || [...document.querySelectorAll('.tabbar button')][2]);
const segs = [...document.querySelectorAll('.seg button, [role="radio"], [role="tab"]')].map(b => b.textContent.trim());
ok(segs.includes('Gewicht') && segs.includes('Mahlzeit'), `Erfassen mit Gewicht und Mahlzeit (${segs.join(', ')})`);
const dur = [...document.querySelectorAll('input')].find(i => (i.getAttribute('aria-label') || '').includes('Dauer') || (i.id && document.querySelector(`label[for="${i.id}"]`)?.textContent.includes('Dauer')));
if (dur) await setVal(dur, '35');
await click(byText('Training speichern')); await wait(1200);
const act1 = (await docsNow()).activity;
ok(act1 && act1.workouts.some(w => w.source === 'manuell'), `Trainingseinheit gespeichert (${act1 ? act1.workouts.length : 0} Einheiten)`);

// Gewicht erfassen und im Dokument „koerper“ speichern
await click([...document.querySelectorAll('.seg button, [role="radio"], [role="tab"]')].find(b => b.textContent.trim() === 'Gewicht'));
const kgLabel = [...document.querySelectorAll('label')].find(l => /Gewicht in kg/.test(l.textContent));
const kgIn = kgLabel && (kgLabel.querySelector('input') || (kgLabel.htmlFor && document.getElementById(kgLabel.htmlFor)));
ok(!!kgIn, 'Eingabefeld für Gewicht vorhanden');
if (kgIn) await setVal(kgIn, '84,6');
await click(byText('Gewicht speichern')); await wait(1200);
const kd = (await docsNow()).koerper;
ok(kd && kd.weights.some(w => w.kg === 84.6), `Gewicht gespeichert (${kd ? kd.weights.length : 0} Werte)`);
// Abhaken einer heutigen Aufgabe
await click([...document.querySelectorAll('.tabbar button')][0]);
const check = document.querySelector('.check, .tick, button[aria-pressed="false"]');
if (check) { await click(check); await wait(1200); }
const weekDoc = (await docsNow())['week:2026-10-19'] || { items: [] };
ok(!check || weekDoc.items.some(i => i.status === 'erledigt'), 'Abgehakter Eintrag ist gespeichert');

// Neu laden: alles kommt aus dem Speicher zurück
await mount(); await wait(500);
ok(/Als Nächstes/.test(text()) && !/Was möchtest du erreichen/.test(text()), 'Nach dem Neuladen keine erneute Einrichtung');
await click([...document.querySelectorAll('.tabbar button')][2]);
ok(/35 Min|Laufen|Krafttraining|Training/.test(text()), 'Erfasste Einheit nach dem Neuladen sichtbar');
const docs = JSON.stringify(await docsNow());
const all = await docsNow(); const bad = Object.entries(all).filter(([k, b]) => ['labs', 'appointments', 'documents'].some(x => x in b) || (k !== 'koerper' && ('weights' in b || 'meals' in b))).map(([k]) => k); ok(!bad.length, `Keine Labor- oder Termindaten, Gewicht und Mahlzeiten nur in „koerper“ ${bad.join(', ')}`);

// Einstellungen: Konto, Speicher, Löschen
await click(document.querySelector('button[aria-label="Einstellungen"]'));
if (mode !== 'demo') { ok(/Angemeldet als tester@example.org/.test(text()), 'Einstellungen zeigen das Konto'); await click(byText('Abmelden')); ok(signedOut, 'Abmelden wird ausgelöst'); }
ok(/Trainings?, Schritte/.test(text()) && /Gewicht/.test(text()) && /Frankfurt|nur in diesem Browser/.test(text()), 'Speicherhinweis nennt Training, Schritte, Gewicht und den Speicherort');
await click(byText('Gespeicherte Daten löschen')); await click(byText('Endgültig löschen')); await wait(500); console.log('  nach 0,5 s übrig:', Object.keys(await docsNow()).length, '| Meldung:', (document.querySelector('.toast') || {}).textContent, '| Fehler:', (document.querySelector('.err') || {}).textContent); await wait(2500);
const left = Object.keys(await docsNow()).length;
ok(left === 0, `Löschen entfernt alle gespeicherten Dokumente (${left} übrig)`);
await act(async () => root.unmount());
console.log(`\n${n - fails} von ${n} Klicktests bestanden (${mode})`);
process.exit(fails ? 1 : 0);
