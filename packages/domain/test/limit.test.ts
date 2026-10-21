/** W12: Gewohnheiten zum Begrenzen und Auslöser. Bestehende Gewohnheiten bleiben unverändert. */
import { describe, expect, it } from 'vitest';
import { buildExport, habitAdherence, habitStats, limitWeek, parseImport, seed, type Habit, type State } from '../src/index.js';
const base = (habits: Habit[], log: Record<string, 'done' | 'skip'>): State => ({ ...seed('2026-10-19'), habits, habitLog: log, pauses: [] });
const snack: Habit = { id: 'c-snack', name: 'Abends snacken', custom: true, active: true, kind: 'limit', limitPerWeek: 2, alternative: 'Tee kochen' };
const water: Habit = { id: 'h-wasser', lib: 'wasser', name: 'Wasser', active: true, trigger: 'nach dem Aufstehen', daytime: 'morgens' };
describe('Begrenzte Gewohnheiten', () => {
  it('zählt Vorkommen der Woche bis zum Tag und vergleicht mit dem Rahmen', () => {
    const log = { 'c-snack|2026-10-19': 'done', 'c-snack|2026-10-21': 'done', 'c-snack|2026-10-23': 'done' } as const;
    expect(limitWeek(base([snack], log), snack, '2026-10-21')).toEqual({ count: 2, max: 2, within: true });
    expect(limitWeek(base([snack], log), snack, '2026-10-23')).toEqual({ count: 3, max: 2, within: false });
    expect(limitWeek(base([snack], log), snack, '2026-10-26').count).toBe(0);
  });
  it('fließt nicht in Erledigungsquoten ein, andere Gewohnheiten bleiben gleich', () => {
    const log = { 'c-snack|2026-10-19': 'done', 'h-wasser|2026-10-19': 'done' } as const;
    const st = base([snack, water], log);
    expect(habitStats(st, '2026-10-19', '2026-10-25')).toEqual(habitStats(base([water], { 'h-wasser|2026-10-19': 'done' }), '2026-10-19', '2026-10-25'));
    expect(habitAdherence(st, '2026-10-19', '2026-10-25', '2026-10-26').per.some(p => p.id === 'c-snack')).toBe(false);
  });
  it('Export und Import erhalten Rahmen, Alternative, Auslöser und Tageszeit', () => {
    const r = parseImport(JSON.parse(JSON.stringify(buildExport(undefined, base([snack, water], {}), 'x'))));
    if ('error' in r) throw new Error(r.error);
    expect(r.state.habits.find(h => h.id === 'c-snack')).toMatchObject({ kind: 'limit', limitPerWeek: 2, alternative: 'Tee kochen' });
    expect(r.state.habits.find(h => h.id === 'h-wasser')).toMatchObject({ trigger: 'nach dem Aufstehen', daytime: 'morgens' });
  });
});
