// Konto-Bereich mit Supabase-Attrappe: vollständiger Export, Kontolöschung mit Bestätigung, Push-Bereich ohne Browser-Unterstützung.
import { buildSync } from 'esbuild';
import { JSDOM } from 'jsdom';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';
const here = path.dirname(fileURLToPath(import.meta.url)); const web = path.resolve(here, '..');
mkdirSync(path.join(web, '.test'), { recursive: true });
writeFileSync(path.join(web, '.test/acc-entry.jsx'), "export { AccountExtras } from '../src/beta/account.jsx';\nexport { PushSettings } from '../src/beta/push.jsx';\n");
const out = path.join(web, '.test/account.cjs');
buildSync({ entryPoints: [path.join(web, '.test/acc-entry.jsx')], bundle: true, platform: 'node', format: 'cjs', outfile: out, jsx: 'automatic', loader: { '.js': 'jsx' }, external: ['react', 'react-dom'], define: { 'process.env.NEXT_PUBLIC_HEALTHOS_MODE': '"beta"', 'process.env.NEXT_PUBLIC_APP_VERSION': '"0.7.0-w9"' }, logLevel: 'error' });
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://h.test/' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node });
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
let downloaded = null; globalThis.URL.createObjectURL = b => { downloaded = b; return 'blob:t'; }; globalThis.URL.revokeObjectURL = () => {}; dom.window.HTMLAnchorElement.prototype.click = function () {};
const require = createRequire(import.meta.url); const React = require('react'); const { createRoot } = require('react-dom/client'); const { act } = React; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const M = require(out);
let n = 0, f = 0; const ok = (c, m) => { n++; if (!c) f++; console.log(`${c ? 'ok  ' : 'FEHL'} ${m}`); };
const calls = []; let signedOut = false;
const sb = {
  rpc: async name => { calls.push(['rpc', name]); return { data: { format: 'healthos-beta-export', consents: [{ version: 'beta-2' }], documents: [{ key: 'koerper', body: { weights: [{ kg: 84.6 }] } }, { key: 'settings', body: {} }] }, error: null }; },
  functions: { invoke: async (name, opt) => { calls.push(['fn', name, opt.body]); return { error: null }; } },
  auth: { getSession: async () => ({ data: { session: { access_token: 'tok' } } }) },
};
const ctx = { today: '2026-10-21', account: { supabase: sb, userId: 'u', email: 'x@y.z', signOut: async () => { signedOut = true; } } };
const root = createRoot(document.getElementById('root'));
const byText = t => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === t);
const click = async el => { await act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); await new Promise(r => setTimeout(r, 20)); }); };
await act(async () => root.render(React.createElement(React.Fragment, null, React.createElement(M.PushSettings, { ctx }), React.createElement(M.AccountExtras, { ctx }))));
await act(async () => { await new Promise(r => setTimeout(r, 50)); });
ok(/unterstützt keine Push-Erinnerungen|Home-Bildschirm/.test(document.body.textContent), 'Push-Bereich erklärt fehlende Unterstützung statt zu scheitern');
ok(/Version 0\.7\.0-w9/.test(document.body.textContent), 'Versionsstand sichtbar');
await click(byText('Alle Daten exportieren'));
const txt = downloaded ? await downloaded.text() : '';
ok(calls.some(c => c[1] === 'export_my_beta_data') && /"koerper"/.test(txt) && /"consents"/.test(txt) && /0\.7\.0-w9/.test(txt), 'Export enthält Dokumente, Körperwerte, Einwilligungen und Version');
await click(byText('Konto löschen'));
const del = byText('Endgültig löschen');
ok(del && del.disabled, 'Löschen erst nach Eingabe der Bestätigung');
const inp = document.querySelector('.b-delete input');
await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(inp, 'LÖSCHEN'); inp.dispatchEvent(new window.Event('input', { bubbles: true })); });
await click(byText('Endgültig löschen'));
const fn = calls.find(c => c[0] === 'fn');
ok(fn && fn[1] === 'account-delete' && fn[2].bestaetigung === 'LÖSCHEN', 'Kontolöschung ruft den Server mit Bestätigung auf');
ok(signedOut, 'Nach dem Löschen wird abgemeldet');
console.log(`\n${n - f} von ${n} Tests Konto und Push bestanden`);
process.exit(f ? 1 : 0);
