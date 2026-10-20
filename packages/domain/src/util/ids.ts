/**
 * IDs und Zufall. Format der IDs wie Referenz v5: <präfix>_<zähler>_<4 Zeichen>.
 * Die Zufallsquelle ist austauschbar, damit Tests deterministisch laufen können.
 */
let counter = 0;
let random: () => number = Math.random;

export function uid(p: string): string { return `${p}_${++counter}_${random().toString(36).slice(2, 6)}`; }
/** Nur für Tests und Migration: eigene Zufallsquelle und Zählerstand setzen. */
export function configureIds(opts: { random?: () => number; counter?: number }): void {
  if (opts.random) random = opts.random;
  if (typeof opts.counter === 'number') counter = opts.counter;
}
/** Deterministischer Pseudozufall (mulberry32) wie Referenz, für Demo-Daten. */
export function rng(a: number): () => number {
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T;
