// Paket C (W13): Zielkette, Experimente, Wochentagsmuster ohne Oberfläche geprüft.
import { buildSync } from 'esbuild';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';
const here = path.dirname(fileURLToPath(import.meta.url)); const web = path.resolve(here, '..');
mkdirSync(path.join(web, '.test'), { recursive: true });
writeFileSync(path.join(web, '.test/goals-entry.jsx'), "export * from '../src/beta/goals.jsx';\nexport { emptyState } from '../src/legacy/support.js';\nexport * as D from '@healthos/domain';\n");
const out = path.join(web, '.test/goals.cjs');
buildSync({ entryPoints: [path.join(web, '.test/goals-entry.jsx')], bundle: true, platform: 'node', format: 'cjs', outfile: out, jsx: 'automatic', loader: { '.js': 'jsx' }, external: ['react', 'react-dom'], define: { 'process.env.NEXT_PUBLIC_HEALTHOS_MODE': '"beta"' }, logLevel: 'error' });
const G = createRequire(import.meta.url)(out); const { D } = G;
let n = 0, f = 0; const ok = (c, m) => { n++; if (!c) f++; console.log(`${c ? 'ok  ' : 'FEHL'} ${m}`); };
const today = '2026-10-21'; const cfg = D.normalizeConfig({ goals: ['abnehmen', 'fitter'], onboardingDone: true });
const empty = G.emptyState(today, cfg);
const gc = G.goalChain(empty, cfg, today);
ok(gc.length === 2 && gc[0].key === 'abnehmen' && gc[0].prio === 1, 'Zielkette in der Reihenfolge der Prioritäten');
ok(gc[0].ind.some(x => x.value === 'noch zu wenige Messungen') && !gc[0].ind.some(x => /kg in/.test(x.value)), 'Ohne Messungen kein erfundener Gewichtsfortschritt');
ok(gc.some(g => g.routines.length > 0), `Maßnahmen aus Routinen mit Zielbezug (${gc.map(g => g.routines.length).join(', ')})`);
ok(gc[0].next && gc[0].next.label === 'Gewicht eintragen', 'Nächster Schritt passend zum Ziel');
// Experimente
const idea = { key: 'gehen-mittag', name: '10 Minuten gehen nach dem Mittagessen', trigger: 'nach dem Mittagessen', daytime: 'mittags' };
const e1 = G.startExperiment(empty, { idea, days: 14, today: '2026-10-08' });
const h = e1.habits.find(x => x.id === 'c-exp-gehen-mittag');
ok(h && h.experiment.days === 14 && h.experiment.minDays === 10 && h.trigger === 'nach dem Mittagessen', 'Experiment aus Idee: 14 Tage, Ziel 10 Tage, Auslöser übernommen');
const log = {}; for (let i = 0; i < 11; i++) log[`${h.id}|${D.addDays('2026-10-08', i)}`] = 'done';
const e2 = { ...e1, habitLog: { ...e1.habitLog, ...log } };
const s1 = G.expStatus(e2, h, '2026-10-15');
ok(s1.day === 8 && s1.done === 8 && !s1.ended, `Laufendes Experiment: Tag ${s1.day} von 14, ${s1.done} erledigt`);
const s2 = G.expStatus(e2, h, '2026-10-22'); ok(!G.expStatus(e2, h, today).ended, 'Am letzten Tag läuft das Experiment noch');
ok(s2.ended && s2.reached && s2.done === 11, 'Nach Ablauf: Ziel erreicht mit 11 von 14');
const keep = G.decideExperiment(e2, h.id, 'behalten', today).habits.find(x => x.id === h.id);
const stop = G.decideExperiment(e2, h.id, 'beendet', today).habits.find(x => x.id === h.id);
ok(keep.active !== false && keep.experiment.decision === 'behalten' && stop.active === false && stop.inactiveFrom === today, 'Behalten lässt die Gewohnheit aktiv, Beenden deaktiviert sie ab heute');
// Muster
ok(!G.weekdayPattern(empty, today).enough, 'Ohne genug Daten keine Musteraussage');
const items = []; for (let w = 1; w <= 6; w++) { const ws = D.addDays(D.weekStart(today), -7 * w); for (let k = 0; k < 7; k++) { const d = D.addDays(ws, k); items.push({ id: `x${w}${k}`, title: 'Bewegungspause', type: 'bewegung', date: d, time: '12:00', duration: 10, status: k === 1 ? 'erledigt' : k === 4 ? 'geplant' : (w % 2 ? 'erledigt' : 'geplant'), taskClass: 'same_day', priority: 'mittel' }); } }
const pat = G.weekdayPattern({ ...empty, items, habits: [] }, today);
ok(pat.enough && pat.clear && pat.best.wd === 1 && pat.worst.wd === 4, `Muster: bester Tag Dienstag, schwächster Freitag (${pat.best && pat.best.wd}, ${pat.worst && pat.worst.wd})`);
console.log(`\n${n - f} von ${n} Tests Paket C bestanden`);
process.exit(f ? 1 : 0);
