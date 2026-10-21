// Bundeslebensmittelschlüssel (BLS 4.0): Laden, Suche und Berechnung je Portion.
// Quelle: Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0. Karlsruhe. Daten je 100 g essbarer Anteil.
// Fehlende Werte (null) sind unbekannt und werden NICHT als 0 gezählt. „tr“ (Spuren, unter Nachweisgrenze) zählt als 0 und wird markiert.
export const BLS_SOURCE = 'Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0';
export const NUTRIENTS = ['kcal', 'p', 'c', 'f', 'fib', 'sugar', 'salt', 'satfat'];
let cache = null, microCache = null;

export async function loadBls(fetchImpl = fetch) {
  if (cache) return cache;
  const j = await (await fetchImpl('/bls/bls-core.json')).json();
  const idx = j.fields.reduce((m, f, i) => ({ ...m, [f]: i }), {});
  cache = j.rows.map(r => ({ code: r[idx.code], name: r[idx.name], norm: norm(r[idx.name]), compact: norm(r[idx.name]).replace(/ /g, ''), v: Object.fromEntries(NUTRIENTS.map(k => [k, r[idx[k]]])) }));
  return cache;
}
export async function loadMicro(fetchImpl = fetch) { if (!microCache) microCache = await (await fetchImpl('/bls/bls-micro.json')).json(); return microCache; }
export function setBlsForTests(rows) { cache = rows.map(r => ({ ...r, norm: norm(r.name), compact: norm(r.name).replace(/ /g, '') })); }

export const norm = s => String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Suche: jedes Suchwort muss im Namen vorkommen, mit oder ohne Leerzeichen („Haferflocken“ findet „Hafer Flocken“).
 * Rangfolge: genaue Übereinstimmung, Treffer am Namensanfang, kurze Namen und rohe Grundlebensmittel zuerst.
 */
export function searchBls(foods, q, limit = 20) {
  const nq = norm(q); const words = nq.split(' ').filter(Boolean); if (!words.length) return [];
  const cq = nq.replace(/ /g, ''); const hits = [];
  // Einzahl und Mehrzahl tolerieren: „Linsen“ findet „Linse“, „Äpfel“ bleibt über Umlaut-Normalisierung „aepfel“.
  const variants = w => (w.length > 4 ? [...new Set([w, w.replace(/n$/, ''), w.replace(/en$/, ''), w.replace(/e$/, ''), w.replace(/s$/, '')])] : [w]);
  const forms = words.map(variants); const cqv = variants(cq);
  for (const f of foods) {
    const compact = f.compact || f.norm.replace(/ /g, '');
    if (!forms.every(vs => vs.some(v => f.norm.includes(v) || compact.includes(v)))) continue;
    const first = f.norm.split(' ')[0];
    const head = compact.split(/[0-9]/)[0];
    let s = f.norm.length;
    if (cqv.includes(compact)) s -= 300;
    if (compact.startsWith(cq)) s -= 80; else if (cqv.some(v => compact.startsWith(v))) s -= 50;
    if (forms[0].includes(first)) s -= 90;
    if (f.norm.startsWith(words[0])) s -= 40;
    if (head.length <= cq.length + 2) s -= 20;
    if (/\b(roh|frisch|natur|gegart)\b/.test(f.norm)) s -= 10;
    // Gerichte und Gebäck nach hinten, solange die Suche nicht selbst danach fragt
    const DISH = /(plaetzchen|kuchen|torte|auflauf|riegel|gebaeck|keks|eintopf|suppe|bolognese|bratling|gericht|salat|sosse|sauce|pfanne|curry|brei|konserve)/;
    if (DISH.test(compact) && !DISH.test(cq)) s += 70;
    if (f.norm.includes(' mit ') && !nq.includes(' mit ')) s += 40;
    hits.push([s, f]);
  }
  return hits.sort((a, b) => a[0] - b[0]).slice(0, limit).map(x => x[1]);
}

/** Nährwerte für eine Menge in Gramm. gaps: Nährstoffe ohne Wert, trace: Nährstoffe nur in Spuren. */
export function portion(food, grams) {
  const k = grams / 100; const snap = {}, gaps = [], trace = [];
  for (const n of NUTRIENTS) {
    const v = food.v[n];
    if (v == null) { gaps.push(n); continue; }
    if (v === 'tr') { trace.push(n); snap[n] = 0; continue; }
    snap[n] = n === 'kcal' ? Math.round(v * k) : Math.round(v * k * 10) / 10;
  }
  return { snap, gaps, trace };
}

/** Tagessumme aus Mahlzeiten-Einträgen. Ein Nährstoff gilt als unvollständig, wenn ein Eintrag dafür keinen Wert hat. */
export function daySum(meals, date) {
  const list = meals.filter(m => m.date === date);
  const sum = Object.fromEntries(NUTRIENTS.map(n => [n, 0])); const incomplete = new Set();
  for (const m of list) for (const n of NUTRIENTS) {
    const v = m.snap ? m.snap[n] : undefined;
    if (typeof v === 'number') sum[n] += v; else if (m.source === 'bls' || n === 'fib' || n === 'sugar' || n === 'salt' || n === 'satfat') incomplete.add(n);
    if (m.gaps && m.gaps.includes(n)) incomplete.add(n);
  }
  for (const n of NUTRIENTS) sum[n] = n === 'kcal' ? Math.round(sum[n]) : Math.round(sum[n] * 10) / 10;
  return { count: list.length, sum, incomplete: [...incomplete] };
}
