// Kanonische Darstellung für den Vergleich: Gleichheit im JSON-Sinn (so, wie Daten gespeichert und exportiert werden).
// Schlüssel werden sortiert. Erzeugte IDs (<präfix>_<zähler>_<zufall>) werden in Reihenfolge ihres ersten Auftretens
// durch Platzhalter ersetzt, weil Zähler und Zufallsanteil zwischen zwei Modulen naturgemäß verschieden sind.
// Funktionen werden als Markierung verglichen, ihr Verhalten wird separat geprüft.
const ID_RE = /(?<![A-Za-z0-9])([a-z]+)_(\d+)_([0-9a-z]{0,4})(?![0-9a-z])/g;

export function canon(v) {
  const map = new Map(); let n = 0;
  const sid = s => s.replace(ID_RE, (m, p) => { if (!map.has(m)) map.set(m, `<${p}#${++n}>`); return map.get(m); });
  const walk = x => {
    if (x === undefined) return undefined;
    if (x === null) return null;
    if (typeof x === 'function') return '[Funktion]';
    if (typeof x === 'string') return sid(x);
    if (typeof x === 'number') return Number.isFinite(x) ? (Object.is(x, -0) ? 0 : x) : `#${x}`;
    if (typeof x === 'boolean') return x;
    if (Array.isArray(x)) return x.map(e => { const w = walk(e); return w === undefined ? null : w; });
    if (x instanceof Map) return { '#map': walk([...x.entries()]) };
    if (x instanceof Set) return { '#set': walk([...x]) };
    if (x instanceof Date) return `#date:${x.toISOString()}`;
    const o = {};
    for (const k of Object.keys(x).sort()) { const w = walk(x[k]); if (w !== undefined) o[sid(k)] = w; }
    return o;
  };
  return JSON.stringify(walk(v));
}

export function firstDiff(a, b) {
  let i = 0; while (i < a.length && a[i] === b[i]) i++;
  return { at: i, ref: a.slice(Math.max(0, i - 80), i + 120), neu: b.slice(Math.max(0, i - 80), i + 120) };
}

export function prng(seed) {
  let a = seed >>> 0;
  const r = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  r.pick = arr => arr[Math.floor(r() * arr.length)];
  r.bool = (p = 0.5) => r() < p;
  r.subset = (arr, p = 0.5) => arr.filter(() => r() < p);
  r.shuffle = arr => { const a2 = [...arr]; for (let i = a2.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a2[i], a2[j]] = [a2[j], a2[i]]; } return a2; };
  return r;
}

export class Checker {
  constructor() { this.counts = {}; this.failures = []; this.total = 0; }
  eq(area, label, a, b) {
    this.total++; this.counts[area] = (this.counts[area] || 0) + 1;
    const ca = canon(a), cb = canon(b);
    if (ca !== cb) { if (this.failures.length < 30) this.failures.push({ area, label, ...firstDiff(ca, cb) }); return false; }
    return true;
  }
  /** Ruft dieselbe Funktion in beiden Modulen auf und vergleicht Ergebnis oder geworfenen Fehler. */
  call(area, label, fr, fn) {
    let a, b;
    try { a = { ok: fr() }; } catch (e) { a = { err: String(e && e.message) }; }
    try { b = { ok: fn() }; } catch (e) { b = { err: String(e && e.message) }; }
    return this.eq(area, label, a, b);
  }
}
