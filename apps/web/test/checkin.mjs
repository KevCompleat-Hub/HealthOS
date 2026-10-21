// Paket D (W14): Befinden und Tags ohne Oberfläche geprüft.
import { buildSync } from 'esbuild';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';
const here = path.dirname(fileURLToPath(import.meta.url)); const web = path.resolve(here, '..');
mkdirSync(path.join(web, '.test'), { recursive: true });
writeFileSync(path.join(web, '.test/ci-entry.jsx'), "export * from '../src/beta/checkin.jsx';\nexport { emptyState } from '../src/legacy/support.js';\nexport * as D from '@healthos/domain';\n");
const out = path.join(web, '.test/checkin.cjs');
buildSync({ entryPoints: [path.join(web, '.test/ci-entry.jsx')], bundle: true, platform: 'node', format: 'cjs', outfile: out, jsx: 'automatic', loader: { '.js': 'jsx' }, external: ['react', 'react-dom'], define: { 'process.env.NEXT_PUBLIC_HEALTHOS_MODE': '"beta"' }, logLevel: 'error' });
const C = createRequire(import.meta.url)(out); const { D } = C;
let n = 0, f = 0; const ok = (c, m) => { n++; if (!c) f++; console.log(`${c ? 'ok  ' : 'FEHL'} ${m}`); };
const today = '2026-10-21'; const cfg = D.normalizeConfig({ goals: ['fitter'], onboardingDone: true });
const e = C.emptyState(today, cfg);
const s1 = C.setCheckin(e, today, { mood: 4, energy: 9, stress: 2, tags: ['Krankheit', 'Unsinn'] });
ok(s1.checkins[today].mood === 4 && s1.checkins[today].energy === undefined && s1.checkins[today].tags.join() === 'Krankheit', 'Nur Werte 1 bis 5 und bekannte Tags werden gespeichert');
const s2 = C.setCheckin(s1, today, { sleep: 3 });
ok(s2.checkins[today].mood === 4 && s2.checkins[today].sleep === 3, 'Ergänzen behält bestehende Angaben');
ok(C.tagInsights(e, today).length === 0, 'Ohne Einträge keine Aussage');
// 6 Wochen Plan: an „Viel Arbeit“-Tagen nichts erledigt, sonst alles
let st = { ...e, items: [], habits: [], checkins: {} };
const items = []; for (let i = 1; i <= 35; i++) { const d = D.addDays(today, -i); const busy = i % 4 === 0; items.push({ id: `p${i}`, title: 'Bewegungspause', type: 'bewegung', date: d, time: '12:00', duration: 10, status: busy ? 'geplant' : 'erledigt', taskClass: 'same_day', priority: 'mittel', routine: 'r-pause' }); if (busy) st = C.setCheckin(st, d, { tags: ['Viel Arbeit'] }); }
st = { ...st, items, routines: e.routines };
const ins = C.tagInsights(st, today);
ok(ins.length === 1 && ins[0].tag === 'Viel Arbeit' && ins[0].withRate === 0 && ins[0].withoutRate === 1, `Zusammenhang „Viel Arbeit“ erkannt (${ins.map(x => `${x.tag} ${x.nWith}/${x.nWithout}`).join(', ')})`);
console.log(`\n${n - f} von ${n} Tests Befinden und Tags bestanden`);
process.exit(f ? 1 : 0);
