// W5-Klicktests (Motivation auf Heute, Review-Korrekturen) der echten Web-Oberfläche (generierte Referenz-UI + M1-Kern + Beta-Schalter) in jsdom.
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
  await sb.from('app_documents').delete().eq('user_id', C); await sb.from('beta_consents').delete().eq('user_id', C); const ins = await sb.from('beta_consents').insert({ user_id: C, version: 'beta-2' }); if (ins.error) throw new Error('Einwilligung im Testaufbau: ' + ins.error.message);
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


console.log(`# W5, Modus ${mode}`);
const tabsBtn = i => [...document.querySelectorAll('.tabbar button')][i];
await mount();
{
  if (mode !== 'demo') ok([...document.querySelectorAll('.chip, button')].some(b => /^Abnehmen$/.test(b.textContent.trim())), 'Ziel „Abnehmen“ wieder wählbar');
  for (let i = 0; i < 12; i++) { const w = byText('Weiter'); if (!w) break; await click(w); }
  await click(byText('Plan übernehmen')); await wait(1200);
}
ok(!!document.querySelector('.b-progress') && /heute geschafft|Freier Tag/.test(document.querySelector('.b-progress').textContent), 'Tagesring oben auf Heute');
ok(document.querySelectorAll('.b-week .b-day').length === 7, 'Wochenleiste mit 7 Tagen');
const order = [...document.querySelectorAll('main h2, main .b-progress')].map(e => e.classList.contains('b-progress') ? 'Ring' : e.textContent.trim());
ok(order.indexOf('Ring') < order.indexOf('Als Nächstes') && order.indexOf('Als Nächstes') < order.indexOf('Gewohnheiten heute'), `Reihenfolge Ring, Als Nächstes, Gewohnheiten (${order.slice(0, 5).join(' > ')})`);
let habitBtns = [...document.querySelectorAll('.b-habit')];
ok(habitBtns.length >= 1, `Gewohnheiten auf Heute abhakbar (${habitBtns.length})`);
const countText = () => (document.querySelector('#next-h') ? document.querySelector('#next-h').parentElement.textContent : '');
const before = countText();
await click(habitBtns[0]); await wait(1100);
const d1 = await docsNow();
const hid = Object.keys((d1.habits || {}).habitLog || {}).find(k => k.endsWith('|2026-10-20'));
ok(hid && d1.habits.habitLog[hid] === 'done', 'Ein Tipp hakt die Gewohnheit ab und speichert sie');
ok(countText() !== before, `Zähler „Als Nächstes“ zählt Gewohnheiten mit (${before.replace('Als Nächstes', '')} → ${countText().replace('Als Nächstes', '')})`);
await click(document.querySelectorAll('.b-habit')[0]); await wait(1100);
ok(!((await docsNow()).habits.habitLog || {})[hid], 'Zweiter Tipp öffnet sie wieder');
const lp = document.querySelectorAll('.b-habit')[1] || document.querySelectorAll('.b-habit')[0];
await act(async () => { lp.dispatchEvent(new window.Event('pointerdown', { bubbles: true })); await sleep(650); lp.dispatchEvent(new window.Event('pointerup', { bubbles: true })); lp.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }); await wait(1100);
ok(Object.values(((await docsNow()).habits.habitLog || {})).includes('skip'), 'Langes Drücken markiert „bewusst ausgelassen“');
await click(byText('Ideen für neue Gewohnheiten'));
const nIdeas = document.querySelectorAll('.b-ideas li').length;
ok(nIdeas >= 6, `Ideen für Gewohnheiten (${nIdeas})`);
await click(document.querySelector('.b-ideas button')); await wait(1100);
ok(((await docsNow()).habits.habits || []).some(h => h.custom && /Glas Wasser nach dem Aufstehen/.test(h.name)), 'Idee als eigene Gewohnheit angelegt und gespeichert');
// Alles für heute erledigen: Erfolgsmoment
for (let k = 0; k < 10; k++) { const c = [...document.querySelectorAll('.b-habit.open, .b-habit.skip')][0]; if (!c) break; await click(c); if (c.classList.contains('skip')) await click(c); }
for (let k = 0; k < 10; k++) { const c = [...document.querySelectorAll('main .check[aria-pressed="false"]:not([disabled])')].find(b => !/morgen|Morgen/.test(b.closest('li') ? b.closest('li').textContent : '')); if (!c) break; await click(c); }
await wait(200);
const cel = document.querySelector('.b-celebrate');
const ringTxt = document.querySelector('.b-progress').textContent;
ok(!!cel || /Alles erledigt für heute/.test(ringTxt), `Erfolgsmoment am Tagesende (${cel ? cel.textContent.slice(0, 40) : ringTxt.slice(0, 60)})`);
// Coach: Regel hinter „Warum“
ok(!!document.querySelector('.coach details summary'), 'Regel des Hinweises hinter „Warum dieser Hinweis?“');
// Check-in: in der Beta ohne Plan in der Vorwoche kein Angebot, in der Demo als Rückblick benannt
const rc = document.querySelector('.review-card');
if (mode !== 'demo') ok(!rc, 'Kein Check-in für eine Woche ohne Plandaten');
else {
  ok(rc && /Rückblick auf letzte Woche \(KW 42\)/.test(rc.textContent), `Check-in als Rückblick benannt (${rc ? rc.querySelector('h2').textContent : '-'})`);
  await click(byText('Starten')); await wait(300);
  let seen = '';
  for (let s = 0; s < 8; s++) { seen += document.querySelector('.review') ? document.querySelector('.review').textContent : ''; const opt = document.querySelector('.review .chip, .review [role="radio"]'); if (opt && /umfang|Umfang/.test(seen)) { /* Antworten optional */ } const w = byText('Weiter'); if (!w) break; await click(w); await wait(150); }
  const stepsSeen = [...new Set((seen.match(/Schritt \d von \d/g) || []))];
  ok(stepsSeen.length >= 4 && /Alles so fortführen|Alles andere so fortführen|anpassen|verlegen|pausieren/.test(seen), `Check-in bis zu den Maßnahmen durchlaufen (${stepsSeen.join(', ')})`);
  ok(/Gewicht/.test(seen) && !/Mahlzeiten/.test(seen), 'Check-in fragt Gewicht ab und zeigt keine Mahlzeiten');
  ok(!/Ernährungsänderung/.test(seen), 'Check-in fragt nicht nach Ernährung');
  ok(!/Haferflocken|Hülsenfrüchten|Health Intelligence/.test(seen), 'Check-in schlägt keine Empfehlungs-Maßnahmen vor');
  ok(!!byText('Später fortsetzen'), '„Später fortsetzen“ statt „Schließen“');
  await click(byText('Später fortsetzen')); await wait(200);
}
// Ernährung: Idee für heute und Zutaten-Katalog
await click(tabsBtn(0)); await wait(200);
ok(/Idee für heute/.test(document.querySelector('main').textContent), 'Heute zeigt eine Ernährungs-Idee');
await click(byText('Zutaten-Katalog')); await wait(150);
const dlg = document.querySelector('.b-overlay[role="dialog"]');
ok(!!dlg && document.querySelectorAll('.b-food').length >= 10, `Katalog „Passend zu mir“ (${document.querySelectorAll('.b-food').length} Zutaten)`);
ok([...document.querySelectorAll('.b-principles a')].some(a => /dge\.de/.test(a.href)), 'Grundsätze mit Quelle der DGE verlinkt');
await click([...document.querySelectorAll('.b-filter .chip')].find(b => b.textContent === 'Hülsenfrüchte')); await wait(100);
const hl = [...document.querySelectorAll('.b-food b')].map(b => b.textContent);
ok(hl.includes('Linsen') && hl.every(n => /Linsen|Kichererbsen|Bohnen|Erbsen|Hummus/.test(n)), `Filter Hülsenfrüchte (${hl.join(', ')})`);
await click([...document.querySelectorAll('.b-filter .chip')].find(b => b.textContent === 'Alle')); await wait(100);
ok(document.querySelectorAll('.b-food').length >= 30, `Gesamter Katalog (${document.querySelectorAll('.b-food').length} Zutaten)`);
await click([...document.querySelectorAll('.b-food')].find(li => /^Linsen/.test(li.querySelector('b').textContent)).querySelector('button')); await wait(1100);
ok(((await docsNow()).habits.habits || []).some(h => h.name === 'Ein Gericht mit Hülsenfrüchten' && h.perWeek === 1), 'Gewohnheit aus dem Katalog mit Häufigkeit 1× pro Woche gespeichert');
await click(byText('Schließen')); await wait(100);
ok(!document.querySelector('.b-overlay'), 'Katalog schließt');
// Entwicklung ohne Kalorien
await click(tabsBtn(3)); await wait(200);
ok(!/Kalorien/.test(document.querySelector('main').textContent), 'Entwicklung ohne Kalorienverlauf');
ok(!/Gesundheit, Für dich/.test(document.querySelector('main').textContent), 'Kein Verweis auf den ausgeblendeten Bereich „Für dich“');
// Woche: Gewohnheiten als Anzahl statt Prozent
await click(tabsBtn(1)); await wait(200);
const goalHead = [...document.querySelectorAll('.goal-head')].find(g => /Gewohnheiten/.test(g.textContent));
ok(goalHead && !/%/.test(goalHead.textContent), `Woche: Gewohnheiten als Anzahl (${goalHead ? goalHead.textContent : '-'})`);
// Info und Konto: Rechtliches
await click(document.querySelector('button[aria-label="Über HealthOS"]')); await wait(100);
const links = [...document.querySelectorAll('.legal-links a')].map(a => a.getAttribute('href'));
if (mode !== 'demo') ok(links.includes('/impressum') && links.includes('/datenschutz'), `Impressum und Datenschutz verlinkt (${links.join(', ')})`);
await act(async () => root.unmount());
console.log(`\n${n - fails} von ${n} Klicktests bestanden (W5 ${mode})`);
process.exit(fails ? 1 : 0);
