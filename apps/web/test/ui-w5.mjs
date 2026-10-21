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
let downloaded = null; globalThis.URL.createObjectURL = window.URL.createObjectURL = b => { downloaded = b; return 'blob:test'; }; globalThis.URL.revokeObjectURL = window.URL.revokeObjectURL = () => {}; window.HTMLAnchorElement.prototype.click = function () {};
{ const realFetch = globalThis.fetch; const { readFileSync } = await import('node:fs'); const pathMod = await import('node:path');
  globalThis.fetch = async (u, o) => (typeof u === 'string' && u.startsWith('/bls/') ? { ok: true, json: async () => JSON.parse(readFileSync(pathMod.join(process.cwd(), 'public', u), 'utf8')) } : realFetch(u, o)); }
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
  await sb.from('app_documents').delete().eq('user_id', C); await sb.from('beta_consents').delete().eq('user_id', C); const ins = await sb.from('beta_consents').insert({ user_id: C, version: 'beta-4' }); await sb.from('beta_consents').insert({ user_id: C, version: 'beta-3' }); if (ins.error) throw new Error('Einwilligung im Testaufbau: ' + ins.error.message);
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
  ok(/Schritt 1 von 4/.test(document.body.textContent), 'Onboarding hat 4 Schritte');
  for (let i = 0; i < 12; i++) { const w = byText('Weiter'); if (!w) break; await click(w); }
  ok(/Termine haben eine Uhrzeit, Gewohnheiten nicht/.test(document.body.textContent), 'Plan-Schritt erklärt Begriffe und Beta-Umfang');
  await click(byText('Plan übernehmen')); await wait(1200);
}
ok(!!document.querySelector('.b-progress') && /heute geschafft|Freier Tag/.test(document.querySelector('.b-progress').textContent), 'Tagesring oben auf Heute');
ok(document.querySelectorAll('.b-week .b-day').length === 7, 'Wochenleiste mit 7 Tagen');
const order = [...document.querySelectorAll('main h2, main .b-progress')].map(e => e.classList.contains('b-progress') ? 'Ring' : e.textContent.trim());
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
const skipBtn = document.querySelector('.b-skip');
ok(!!skipBtn && skipBtn.textContent === 'Auslassen', 'Sichtbarer Knopf „Auslassen“ je Gewohnheit');
const before2 = Object.values(((await docsNow()).habits.habitLog || {})).filter(v => v === 'skip').length;
await click(skipBtn); await wait(1100);
ok(Object.values(((await docsNow()).habits.habitLog || {})).filter(v => v === 'skip').length === before2 + 1, 'Auslassen per Knopf gespeichert');
await click(byText('Zurücknehmen')); await wait(1100);
ok(Object.values(((await docsNow()).habits.habitLog || {})).filter(v => v === 'skip').length === before2, 'Auslassen per Knopf zurückgenommen');
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
  ok(/Gewicht/.test(seen), 'Check-in fragt Gewicht ab');
  ok(!/Ernährungsänderung/.test(seen), 'Check-in fragt nicht nach Ernährung');
  ok(!/Haferflocken|Hülsenfrüchten|Health Intelligence/.test(seen), 'Check-in schlägt keine Empfehlungs-Maßnahmen vor');
  ok(!!byText('Später fortsetzen'), '„Später fortsetzen“ statt „Schließen“');
  await click(byText('Später fortsetzen')); await wait(200);
}
// W9: nächster Schritt, Auslassen über Menü
await click(tabsBtn(0)); await wait(200);
const secs = [...document.querySelectorAll('main section')].map(x => x.classList.contains('b-next') ? 'Next' : x.classList.contains('b-progress') ? 'Ring' : (x.querySelector('h2') || {}).textContent);
ok(secs.indexOf('Ring') >= 0 && secs.indexOf('Ring') < secs.indexOf('Als Nächstes') && (secs.indexOf('Next') === -1 || secs.indexOf('Next') < secs.indexOf('Ring')), `Reihenfolge nächster Schritt, Fortschritt, Als Nächstes (${secs.slice(0, 4).join(' > ')})`);
const more = document.querySelector('.b-more');
if (more) {
  await click(more);
  const skipBtn = byText('Heute auslassen') || byText('Wieder öffnen');
  ok(!!skipBtn, 'Menü „⋯“ bietet Auslassen oder Wieder öffnen');
  if (byText('Heute auslassen')) { await click(byText('Heute auslassen')); await wait(1100); ok(Object.values(((await docsNow()).habits.habitLog || {})).includes('skip'), 'Auslassen über das Menü gespeichert'); }
}
// W12: Gewohnheit auf „Begrenzen“ umstellen
await click(tabsBtn(0)); await wait(150);
const ringBefore = document.querySelector('.b-ring-num').textContent;
await click(byText('Gewohnheiten bearbeiten')); await wait(100);
const artSel = [...document.querySelectorAll('.b-manage select')][0];
await act(async () => { artSel.value = 'limit'; artSel.dispatchEvent(new window.Event('change', { bubbles: true })); }); await wait(1100);
const lim = ((await docsNow()).habits.habits || []).find(h => h.kind === 'limit');
ok(lim && lim.limitPerWeek === 2, `Gewohnheit als „Begrenzen“ gespeichert, Rahmen 2 (${lim ? lim.name : '-'})`);
await click(byText('Fertig')); await wait(100);
ok([...document.querySelectorAll('.b-habit.limit')].length === 1 && /höchstens 2/.test(document.querySelector('.b-habit.limit').textContent), 'Begrenzte Gewohnheit zeigt den Rahmen');
const ringAfter = document.querySelector('.b-ring-num').textContent;
ok(ringBefore !== ringAfter, `Begrenzte Gewohnheit zählt nicht im Tagesring (${ringBefore} → ${ringAfter})`);
// W14: Befinden und Tags (ohne Supabase-Konto direkt nutzbar, mit Konto erst nach Einwilligung)
await click(tabsBtn(0)); await wait(150);
const ci = document.querySelector('.b-checkin');
ok(!!ci && /Wie geht's dir heute/.test(ci.textContent), 'Heute zeigt den Befinden-Check-in');
await click(ci.querySelector('button[aria-label="Stimmung: gut"]')); await wait(50);
await click([...document.querySelectorAll('.b-checkin .chip')].find(b => b.textContent === 'Krankheit')); await wait(1100);
const cd = (await docsNow()).checkins;
ok(cd && cd.entries && Object.values(cd.entries).some(x => x.mood === 4 && x.tags.includes('Krankheit')), 'Stimmung und Tag „Krankheit“ gespeichert');
ok(!!document.querySelector('.b-checkin .chip') && !!byText('Fertig'), 'Karte bleibt offen, bis „Fertig“ getippt wird');
await click(byText('Fertig')); await wait(50);
ok(/Stimmung: gut/.test(document.querySelector('.b-checkin').textContent) && /Krankheit/.test(document.querySelector('.b-checkin').textContent), 'Nach „Fertig“ kurze Zusammenfassung');
// W16: Mahlzeit mit BLS erfassen
await click(tabsBtn(2)); await wait(150);
await click([...document.querySelectorAll('.seg button, [role="radio"], [role="tab"]')].find(b => b.textContent.trim() === 'Mahlzeit')); await wait(150);
ok(/Wie isst du meistens/.test(document.querySelector('main').textContent), 'Erfassungsstil wird beim ersten Mal abgefragt');
await click(byText('Oft dasselbe')); await wait(1100);
ok(((await docsNow()).koerper || {}).mealPrefs && (await docsNow()).koerper.mealPrefs.style === 'wiederkehrend', 'Erfassungsstil „wiederkehrend“ gespeichert');
const secs2 = [...document.querySelectorAll('.b-meal-sec')].map(x => x.getAttribute('aria-label'));
ok(secs2[0] === 'Gespeicherte Mahlzeiten', `Bei „wiederkehrend“ stehen gespeicherte Mahlzeiten oben (${secs2.join(' > ')})`);
const qIn = [...document.querySelectorAll('.b-meal input')].find(i => /Haferflocken/.test(i.placeholder || ''));
await setVal(qIn, 'haferflocken'); for (let i = 0; i < 20 && !document.querySelector('.b-results button'); i++) await wait(150);
const firstRes = document.querySelector('.b-results button');
ok(firstRes && /^Hafer Flocken/.test(firstRes.textContent), `Suche zeigt Haferflocken aus dem BLS (${firstRes ? firstRes.textContent.slice(0, 40) : '-'})`);
await click(firstRes); await wait(100);
await click([...document.querySelectorAll('.b-sel-food .chip')].find(b => b.textContent === '50 g')); await wait(50);
await click([...document.querySelectorAll('.b-sel-food button')].find(b => b.textContent.startsWith('Zu '))); await wait(1100);
const kd2 = (await docsNow()).koerper;
ok(kd2 && kd2.meals.some(m => m.bls === 'C133000' && m.qty === 50 && m.snap.p === 6.6), 'Mahlzeit mit BLS-Werten gespeichert (50 g Haferflocken, 6,6 g Eiweiß)');
ok(/Heute gegessen/.test(document.querySelector('main').textContent) && /Bundeslebensmittelschlüssel/.test(document.querySelector('main').textContent), 'Tageswerte mit Quellenangabe BLS');
const pIn = [...document.querySelectorAll('.b-meal input')].find(i => /speichern als/.test(i.placeholder || ''));
await setVal(pIn, 'Mein Frühstück'); await click([...document.querySelectorAll('.b-meal button')].find(b => b.textContent === 'Speichern')); await wait(1100);
ok(((await docsNow()).koerper.mealPresets || []).some(p => p.name === 'Mein Frühstück' && p.items[0].code === 'C133000'), 'Mahlzeit unter eigenem Namen gespeichert');
ok(!/Energie/.test(document.querySelector('.b-nut').textContent) && !!byText('Kalorien anzeigen'), 'Kalorien standardmäßig aus, als Opt-in anbietbar');
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
ok(!!document.querySelector('.b-brief') && /Dein Tag/.test(document.querySelector('.b-brief').textContent), 'Morning Briefing oben auf Heute');
// Entwicklung ohne Kalorien
await click(tabsBtn(3)); await wait(200);
ok(!/Kalorien/.test(document.querySelector('main').textContent), 'Entwicklung ohne Kalorien, solange Kalorien ausgeschaltet sind');
if (mode === 'demo') ok(/Gewichtstrend/.test(document.querySelector('main').textContent) && !!document.querySelector('.b-wt-line'), 'Entwicklung zeigt geglätteten Gewichtstrend');
ok(!/Gesundheit, Für dich/.test(document.querySelector('main').textContent), 'Kein Verweis auf den ausgeblendeten Bereich „Für dich“');
ok(!!document.querySelector('.b-review-entry'), 'Entwicklung hat einen festen Einstieg in den Check-in');
ok(/Deine Ziele im Zusammenhang/.test(document.querySelector('main').textContent) && document.querySelectorAll('.b-chain-goal').length >= 1, 'Entwicklung zeigt die Zielkette');
ok(/Muster/.test(document.querySelector('main').textContent), 'Entwicklung zeigt den Bereich Muster');
await click(byText('Experiment starten')); await wait(100);
const expSel = document.querySelector('#exp-h').parentElement.querySelector('select');
await act(async () => { expSel.value = expSel.options[1].value; expSel.dispatchEvent(new window.Event('change', { bubbles: true })); });
await click(byText('Starten')); await wait(1100);
ok(((await docsNow()).habits.habits || []).some(h => h.experiment && h.experiment.days === 14 && h.experiment.minDays === 10), 'Experiment über die Oberfläche gestartet und gespeichert');
ok(/Tag 1 von 14/.test(document.querySelector('#exp-h').parentElement.textContent), 'Laufendes Experiment wird angezeigt');
// Woche: Gewohnheiten als Anzahl statt Prozent
await click(tabsBtn(1)); await wait(200);
const goalHead = [...document.querySelectorAll('.goal-head')].find(g => /Gewohnheiten/.test(g.textContent));
ok(goalHead && !/%/.test(goalHead.textContent), `Woche: Gewohnheiten als Anzahl (${goalHead ? goalHead.textContent : '-'})`);
// Info und Konto: Rechtliches
await click(document.querySelector('button[aria-label="Über EvoVive"]')); await wait(100);
const infoTxt = document.body.textContent;
if (mode !== 'demo') ok(!/Keine Push-Benachrichtigungen/.test(infoTxt) && /Push-Erinnerungen: verfügbar/.test(infoTxt), 'Info nennt den tatsächlichen Funktionsstatus');
ok(/Version /.test(infoTxt), 'Versionsstand sichtbar');
const links = [...document.querySelectorAll('.legal-links a')].map(a => a.getAttribute('href'));
if (mode !== 'demo') { ok(document.querySelectorAll('.b-status li').length >= 5 && /Push-Erinnerungen/.test(document.querySelector('.b-status').textContent), 'Info zeigt den zentralen Funktionsstand'); ok(/Version /.test(text()), 'Info zeigt die Version'); ok(document.querySelectorAll('.b-terms dt').length === 4, 'Info erklärt Termin, Routine, Gewohnheit, Messung'); }
if (mode !== 'demo') ok(links.includes('/impressum') && links.includes('/datenschutz'), `Impressum und Datenschutz verlinkt (${links.join(', ')})`);
await click([...document.querySelectorAll('button')].find(b => /Schließen|Fertig/.test(b.textContent)) || document.body); await wait(100);
// Einstellungen: vollständiger Export, Konto löschen
await click(document.querySelector('button[aria-label="Einstellungen"]')); await wait(150);
const exp = byText('Alle Daten exportieren');
if (mode !== 'demo') {
  ok(!!exp, 'Einstellungen: „Alle Daten exportieren“');
  await click(exp); await wait(300);
  const txt = downloaded ? await downloaded.text() : '';
  ok(/"documents"/.test(txt) && /"koerper"|"settings"/.test(txt), `Export enthält alle gespeicherten Dokumente (${(txt.match(/"key"/g) || []).length} Dokumente)`);
}
// W15: Rebranding EvoVive in allen Hauptansichten
const seenOld = [];
for (let t = 0; t < 4; t++) { await click(tabsBtn(t)); await wait(150); if (/HealthOS/.test(document.body.textContent)) seenOld.push(`Tab ${t}`); }
await click(document.querySelector('button[aria-label="Einstellungen"]')); await wait(150); if (/HealthOS/.test(document.body.textContent)) seenOld.push('Einstellungen');
const infoBtn = document.querySelector('button[aria-label="Über EvoVive"]');
if (infoBtn) { await click(infoBtn); await wait(100); if (/HealthOS/.test(document.body.textContent)) seenOld.push('Info'); }
ok(!seenOld.length, `Kein „HealthOS“ in Heute, Woche, Erfassen, Entwicklung, Einstellungen, Info ${seenOld.join(', ')}`);
ok(!!infoBtn, 'Info-Knopf heißt „Über EvoVive“');
const bt = document.querySelector('.brand-text');
ok(!bt || (bt.textContent === 'EvoVive' && bt.querySelector('b') && bt.querySelector('b').textContent === 'Vive'), 'Wortmarke „Evo“ und „Vive“ zweifarbig');
await act(async () => root.unmount());
console.log(`\n${n - fails} von ${n} Klicktests bestanden (W5 ${mode})`);
process.exit(fails ? 1 : 0);
