/** Erweiterung nach M1 (W6): Gewohnheiten mit Wochenziel. Ohne Wochenziel bleibt alles wie in der Referenz. */
import { describe, expect, it } from 'vitest';
import { buildExport, habitAdherence, habitStats, parseImport, seed, weeklyHabitCounts, type Habit, type State } from '../src/index.js';

const base = (habits: Habit[], log: Record<string, 'done' | 'skip'>): State => ({ ...seed('2026-10-19'), habits, habitLog: log, pauses: [] });
const h3: Habit = { id: 'c-alk', name: 'Alkoholfreier Abend', custom: true, active: true, perWeek: 3 };

describe('Gewohnheiten mit Wochenziel', () => {
  it('volle Woche: Ziel 3, erledigt höchstens 3, mehr Haken zählen nicht zusätzlich', () => {
    const log = { 'c-alk|2026-10-12': 'done', 'c-alk|2026-10-13': 'done', 'c-alk|2026-10-14': 'done', 'c-alk|2026-10-15': 'done' } as const;
    expect(weeklyHabitCounts(base([h3], log), h3, '2026-10-12', '2026-10-18', '2026-10-25')).toEqual({ done: 3, eligible: 3 });
  });
  it('laufende Woche: Erwartung anteilig, Dienstag bei 3× pro Woche = 1', () => {
    expect(weeklyHabitCounts(base([h3], {}), h3, '2026-10-19', '2026-10-25', '2026-10-20')).toEqual({ done: 0, eligible: 1 });
  });
  it('mehr erledigt als bisher erwartet senkt die Quote nicht unter 100 %', () => {
    const log = { 'c-alk|2026-10-19': 'done', 'c-alk|2026-10-20': 'done' } as const;
    expect(weeklyHabitCounts(base([h3], log), h3, '2026-10-19', '2026-10-25', '2026-10-20')).toEqual({ done: 2, eligible: 2 });
  });
  it('„bewusst ausgelassen“ verändert das Wochenziel nicht', () => {
    const log = { 'c-alk|2026-10-12': 'skip', 'c-alk|2026-10-13': 'done' } as const;
    expect(weeklyHabitCounts(base([h3], log), h3, '2026-10-12', '2026-10-18', '2026-10-25')).toEqual({ done: 1, eligible: 3 });
  });
  it('pausierte Tage verringern die Erwartung anteilig', () => {
    const st = { ...base([h3], {}), pauses: [{ id: 'p', kind: 'urlaub' as const, from: '2026-10-12', to: '2026-10-15', scope: 'alle' as const }] };
    expect(weeklyHabitCounts(st, h3, '2026-10-12', '2026-10-18', '2026-10-25').eligible).toBe(Math.round(3 * 3 / 7));
  });
  it('habitStats und habitAdherence nutzen das Wochenziel, tägliche Gewohnheiten bleiben gleich', () => {
    const daily: Habit = { id: 'h-wasser', lib: 'wasser', name: 'Wasser', active: true };
    const log = { 'c-alk|2026-10-12': 'done', 'h-wasser|2026-10-12': 'done' } as const;
    const st = base([h3, daily], log);
    expect(habitStats(st, '2026-10-12', '2026-10-25')).toEqual({ done: 2, eligible: 3 + 7, skipped: 0 });
    const a = habitAdherence(st, '2026-10-12', '2026-10-18', '2026-10-25');
    expect(a.per.find(p => p.id === 'c-alk')).toMatchObject({ done: 1, eligible: 3 });
    expect(a.per.find(p => p.id === 'h-wasser')).toMatchObject({ done: 1, eligible: 7 });
  });
  it('Export und Import erhalten das Wochenziel', () => {
    const st = base([h3], {});
    const r = parseImport(JSON.parse(JSON.stringify(buildExport(undefined, st, 'x'))));
    if ('error' in r) throw new Error(r.error);
    expect(r.state.habits[0]!.perWeek).toBe(3);
  });
});
