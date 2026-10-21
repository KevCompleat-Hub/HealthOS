/** Geglätteter Gewichtstrend (W10). */
import { describe, expect, it } from 'vitest';
import { smoothWeights, trendChange } from '../src/index.js';

const w = (date: string, kg: number, time = '07:00') => ({ date, kg, time });
describe('Gewichtstrend', () => {
  it('gleitender Mittelwert über 7 Kalendertage, Lücken werden nicht aufgefüllt', () => {
    const p = smoothWeights([w('2026-10-01', 85), w('2026-10-03', 84), w('2026-10-09', 83)]);
    expect(p.map(x => [x.date, x.trend, x.n])).toEqual([['2026-10-01', 85, 1], ['2026-10-03', 84.5, 2], ['2026-10-09', 83.5, 2]]);
  });
  it('mehrere Messungen an einem Tag fließen einzeln ein, Rohwert ist ihr Mittel', () => {
    const p = smoothWeights([w('2026-10-01', 85, '07:00'), w('2026-10-01', 86, '20:00')]);
    expect(p).toEqual([{ date: '2026-10-01', raw: 85.5, trend: 85.5, n: 2 }]);
  });
  it('Veränderung nur mit genug Messungen am Anfang und am Ende', () => {
    const many = Array.from({ length: 21 }, (_, i) => w(`2026-10-${String(i + 1).padStart(2, '0')}`, 86 - i * 0.1));
    const c = trendChange(many, '2026-10-21');
    expect(c && c.delta).toBeLessThan(0);
    expect(c && c.days).toBe(14);
    expect(trendChange([w('2026-10-01', 85), w('2026-10-20', 84)], '2026-10-21')).toBeNull();
  });
  it('alte letzte Messung (über 7 Tage) ergibt keine Aussage', () => {
    const many = Array.from({ length: 20 }, (_, i) => w(`2026-09-${String(i + 1).padStart(2, '0')}`, 86));
    expect(trendChange(many, '2026-10-21')).toBeNull();
  });
});
