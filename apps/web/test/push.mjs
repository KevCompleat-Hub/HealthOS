// Tests der Erinnerungslogik (ohne Netz). Zeiten in Europe/Berlin, Oktober 2026 = MESZ (UTC+2).
import { buildSync } from 'esbuild';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '../.test/push.cjs');
buildSync({ entryPoints: [path.join(here, '../../../supabase/functions/push-tick/logic.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error' });
const P = createRequire(import.meta.url)(out);
let n = 0, f = 0; const ok = (c, m) => { n++; if (!c) f++; console.log(`${c ? 'ok  ' : 'FEHL'} ${m}`); };
const at = (hhmm, day = '2026-10-21') => new Date(`${day}T${hhmm}:00+02:00`);
const items = [
  { id: 'r:train-2:2026-10-21', title: 'Krafttraining', type: 'training', date: '2026-10-21', time: '18:30', status: 'geplant', taskClass: 'weekly_flexible' },
  { id: 'r:pause1-ho:2026-10-21', title: 'Bewegungspause', type: 'bewegung', date: '2026-10-21', time: '12:30', status: 'geplant', taskClass: 'same_day' },
  { id: 'r:weigh:2026-10-21', title: 'Gewicht erfassen', type: 'messen', date: '2026-10-21', time: '07:00', status: 'geplant', taskClass: 'optional_logging' },
  { id: 'r:x:2026-10-21', title: 'Erledigt', type: 'training', date: '2026-10-21', time: '18:30', status: 'erledigt' },
  { id: 'frist', title: 'Frist', type: 'sonstiges', date: '2026-10-21', time: '', status: 'geplant', taskClass: 'deadline' },
];
const docs = (rem = {}, extra = {}) => ({ settings: { config: { reminders: { intensity: 'ausgewogen', lead: 30, quietFrom: '22:00', quietTo: '07:00', ...rem } } }, week: { items }, habits: { habits: [{ id: 'h-wasser', name: 'Wasser', active: true }, { id: 'c-alk', name: 'Alkoholfrei', active: true, perWeek: 1 }], habitLog: { 'c-alk|2026-10-19': 'done' }, pauses: [] }, ...extra });
ok(JSON.stringify(P.berlinNow(at('18:00'))) === JSON.stringify({ date: '2026-10-21', min: 1080 }), 'Berliner Zeit wird korrekt bestimmt');
const r1 = P.dueReminders(docs(), at('18:00'));
ok(r1.length === 1 && r1[0].body === 'Gleich: Krafttraining um 18:30 Uhr.', `Training 30 Minuten vorher (${r1.map(x => x.body).join(' / ')})`);
ok(P.dueReminders(docs(), at('18:15')).length === 0, 'außerhalb des Zeitfensters keine Erinnerung');
ok(P.dueReminders(docs({ intensity: 'sanft' }), at('12:00')).length === 0, '„sanft“: keine Bewegungspause');
ok(P.dueReminders(docs(), at('12:00')).some(x => /Bewegungspause/.test(x.body)), '„ausgewogen“: Bewegungspause');
ok(P.dueReminders(docs(), at('06:30')).length === 0, 'Ruhezeit bis 07:00 wird eingehalten (Wiegen um 06:30 Erinnerung fällt aus)');
ok(P.dueReminders(docs({ lead: 0 }), at('07:00')).some(x => /Gewicht/.test(x.body)), 'Wiegen ohne Vorlauf um 07:00');
const ev = P.dueReminders(docs(), at('20:00'));
ok(ev.some(x => x.key === '2026-10-21|habits' && /Eine Gewohnheit/.test(x.body)), `abends offene Gewohnheiten, Wochenziel erreicht zählt nicht (${ev.map(x => x.body).join(' / ')})`);
ok(!P.dueReminders(docs(), at('20:00')).some(x => /Erledigt/.test(x.body)), 'Erledigtes und Fristen erzeugen keine Erinnerung');
ok(P.dueReminders(docs({ quietFrom: '19:00', quietTo: '07:00' }), at('20:00')).length === 0, 'Gewohnheiten-Erinnerung respektiert Ruhezeit');
ok(P.dueReminders(docs({}, { habits: { habits: [{ id: 'h', name: 'x', active: true }], habitLog: {}, pauses: [{ from: '2026-10-20', to: '2026-10-22', scope: 'alle' }] } }), at('20:00')).length === 0, 'keine Gewohnheiten-Erinnerung in einer Pause');
ok(JSON.stringify(P.dueReminders(docs(), at('18:00'))).match(/kg|Gewicht \d/) === null, 'keine Messwerte in Nachrichten');
const dl = docs({}, { habits: { habits: [{ id: 'c-snack', name: 'Snacken', active: true, kind: 'limit' }], habitLog: {}, pauses: [] } });
ok(P.dueReminders(dl, at('20:00')).length === 0, 'Begrenzte Gewohnheiten lösen keine Erinnerung aus');
console.log(`\n${n - f} von ${n} Tests der Erinnerungslogik bestanden`);
process.exit(f ? 1 : 0);
