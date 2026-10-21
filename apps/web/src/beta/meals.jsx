'use client';
// Mahlzeiten mit dem Bundeslebensmittelschlüssel (W16). Erfassungsstil wählt der Nutzer: wiederkehrend (gespeicherte Mahlzeiten zuerst)
// oder abwechslungsreich (Suche zuerst). Tagesziele für Eiweiß und Ballaststoffe mit Quelle, Kalorien nur, wenn eingeschaltet.
import React, { useEffect, useMemo, useState } from 'react';
import { addDays, fmtNum, MEALS, uid, weekStart } from '@healthos/domain';
import { BLS_SOURCE, daySum, loadBls, loadMicro, portion, searchBls } from './bls';

export const MICRO_LABELS = [['ca', 'Calcium', 'mg'], ['fe', 'Eisen', 'mg'], ['mg', 'Magnesium', 'mg'], ['k', 'Kalium', 'mg'], ['vitc', 'Vitamin C', 'mg'], ['vitd', 'Vitamin D', 'µg'], ['b12', 'Vitamin B12', 'µg'], ['fol', 'Folat-Äquivalent', 'µg']];
const SRC_DGE_PROTEIN = 'DGE-Referenzwert: 0,8 g Eiweiß pro kg Körpergewicht und Tag für Erwachsene von 19 bis unter 65 Jahren';
const SRC_DGE_SPORT = 'DGE-Positionspapier Proteinzufuhr im Sport: etwa 1,2 bis 2,0 g pro kg und Tag, Sport ab etwa 5 Stunden pro Woche';
export const FIBER_GOAL = { min: 30, basis: 'DGE-Richtwert: mindestens 30 g Ballaststoffe pro Tag' };

/** Eiweißziel aus dem letzten Gewicht. Ab 300 Trainingsminuten pro Woche der Sportbereich der DGE. Ohne Gewicht kein Ziel. */
export function proteinGoal(data, today) {
  const w = [...data.weights].filter(x => x.date <= today).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''))).slice(-1)[0];
  if (!w) return { min: null, basis: 'Für ein Eiweißziel fehlt ein Gewichtswert.' };
  const ws = weekStart(today);
  const minutes = data.items.filter(i => i.type === 'training' && i.date >= ws && i.date <= addDays(ws, 6) && !['verschoben', 'pausiert', 'ausgelassen'].includes(i.status)).reduce((s, i) => s + (Number(i.duration) || 0), 0);
  if (minutes >= 300) return { min: Math.round(w.kg * 1.2), max: Math.round(w.kg * 2.0), basis: SRC_DGE_SPORT, kg: w.kg };
  return { min: Math.round(w.kg * 0.8), max: null, basis: SRC_DGE_PROTEIN, kg: w.kg, hint: 'Bei Sport ab etwa 5 Stunden pro Woche nennt die DGE 1,2 bis 2,0 g pro kg.' };
}

export const defaultSlot = nowMin => (nowMin < 630 ? 'Frühstück' : nowMin < 900 ? 'Mittagessen' : nowMin < 1050 ? 'Snack' : 'Abendessen');

/** Neuer Mahlzeiten-Eintrag, verträglich mit dem Modell der Referenz (snap mit kcal, p, c, f), erweitert um Ballaststoffe und Lücken. */
export function mealEntry(food, grams, date, slot) {
  const { snap, gaps, trace } = portion(food, grams);
  return { id: uid('m'), date, meal: slot, name: food.name, qty: grams, unit: 'g', snap, gaps, trace, source: 'bls', bls: food.code };
}

/** Häufig gegessene BLS-Lebensmittel mit der zuletzt genutzten Menge. */
export function frequentFoods(meals, n = 8) {
  const m = new Map();
  for (const x of [...meals].filter(x => x.source === 'bls').sort((a, b) => a.date.localeCompare(b.date))) { const e = m.get(x.bls) || { code: x.bls, name: x.name, count: 0 }; e.count++; e.grams = x.qty; m.set(x.bls, e); }
  return [...m.values()].sort((a, b) => b.count - a.count).slice(0, n);
}

export function DayNutrition({ ctx, date }) {
  const { data, cfg, today } = ctx; const d = date || today;
  const t = daySum(data.meals, d); const pg = proteinGoal(data, today);
  if (!t.count) return null;
  const row = (label, val, goal, unit, inc) => <div className="b-nut-row"><span>{label}</span><b>{inc ? 'mind. ' : ''}{fmtNum(val, 0)} {unit}{goal ? ` von ${goal}` : ''}</b>{goal && <i className="b-nut-bar"><s style={{ width: `${Math.min(100, (val / parseFloat(goal)) * 100)}%` }} /></i>}</div>;
  return <div className="panel b-nut">
    <h3 className="h3 top0">Heute gegessen</h3>
    {row('Eiweiß', t.sum.p, pg.min ? (pg.max ? `${pg.min} bis ${pg.max} g` : `${pg.min} g`) : null, 'g', t.incomplete.includes('p'))}
    {row('Ballaststoffe', t.sum.fib, `${FIBER_GOAL.min} g`, 'g', t.incomplete.includes('fib'))}
    {(data.mealPrefs || {}).showKcal && row('Energie', t.sum.kcal, null, 'kcal', t.incomplete.includes('kcal'))}
    <details><summary>Woher kommen die Ziele?</summary><p className="hint">{pg.basis}. {pg.hint || ''} {FIBER_GOAL.basis}. Richtwerte für gesunde Erwachsene, keine persönliche Ernährungsberatung. Bei Vorerkrankungen ärztlich abklären.</p></details>
    {t.incomplete.length > 0 && <p className="hint">„mind.“: Für manche Lebensmittel fehlt ein Wert im BLS, der wahre Wert ist dann höher.</p>}
    <p className="b-src-line">Nährwerte: {BLS_SOURCE}</p>
  </div>;
}

export function BlsMealForm({ ctx }) {
  const { data, today, nowMin, commit } = ctx;
  const [foods, setFoods] = useState(null); const [err, setErr] = useState('');
  const [q, setQ] = useState(''); const [sel, setSel] = useState(null); const [grams, setGrams] = useState('100');
  const [slot, setSlot] = useState(defaultSlot(nowMin)); const [micro, setMicro] = useState(null); const [presetName, setPresetName] = useState('');
  useEffect(() => { loadBls().then(setFoods).catch(() => setErr('Die Nährwert-Datenbank konnte nicht geladen werden. Bitte Verbindung prüfen.')); }, []);
  const style = (data.mealPrefs || {}).style || null;
  const setStyle = s => commit(d => ({ ...d, mealPrefs: { ...(d.mealPrefs || {}), style: s } }), s === 'wiederkehrend' ? 'Gespeicherte Mahlzeiten zuerst' : 'Suche zuerst');
  const results = useMemo(() => (foods && q.trim().length >= 2 ? searchBls(foods, q) : []), [foods, q]);
  const byCode = useMemo(() => (foods ? new Map(foods.map(f => [f.code, f])) : new Map()), [foods]);
  const freq = frequentFoods(data.meals);
  const presets = data.mealPresets || [];
  const todays = data.meals.filter(m => m.date === today);
  const g = Number(String(grams).replace(',', '.'));
  const add = (food, gr) => { commit(d => ({ ...d, meals: [...d.meals, mealEntry(food, gr, today, slot)] }), `${food.name}, ${gr} g gespeichert`); setSel(null); setQ(''); setMicro(null); };
  const remove = id => commit(d => ({ ...d, meals: d.meals.filter(m => m.id !== id) }), 'Eintrag entfernt');
  const usePreset = p => commit(d => ({ ...d, meals: [...d.meals, ...p.items.map(it => { const f = byCode.get(it.code); return f ? mealEntry(f, it.grams, today, slot) : null; }).filter(Boolean)] }), `${p.name} gespeichert`);
  const savePreset = () => { const items = todays.filter(m => m.meal === slot && m.source === 'bls').map(m => ({ code: m.bls, name: m.name, grams: m.qty })); if (!items.length || !presetName.trim()) return; commit(d => ({ ...d, mealPresets: [...(d.mealPresets || []), { id: uid('mp'), name: presetName.trim().slice(0, 40), items }] }), 'Mahlzeit gespeichert'); setPresetName(''); };
  const delPreset = id => commit(d => ({ ...d, mealPresets: (d.mealPresets || []).filter(p => p.id !== id) }), 'Gespeicherte Mahlzeit entfernt');
  const showMicro = async () => { try { const m = await loadMicro(); setMicro(m.rows[sel.code] || null); } catch { setMicro(null); } };

  const Saved = <section className="b-meal-sec" aria-label="Gespeicherte Mahlzeiten">
    <h3 className="h3 top0">Gespeicherte Mahlzeiten</h3>
    {presets.length ? <div className="b-repeat">{presets.map(p => <span key={p.id} className="b-preset"><button className="chip" onClick={() => usePreset(p)}>{p.name}</button><button className="b-x" aria-label={`${p.name} entfernen`} onClick={() => delPreset(p.id)}>×</button></span>)}</div> : <p className="hint top0">Noch keine. Erfasse eine Mahlzeit und speichere sie unten mit einem Namen.</p>}
    {freq.length > 0 && <><h3 className="h3">Häufig gegessen</h3><div className="b-repeat">{freq.map(f => <button key={f.code} className="chip" disabled={!byCode.get(f.code)} onClick={() => add(byCode.get(f.code), f.grams)}>{f.name.split(',')[0]}, {f.grams} g</button>)}</div></>}
  </section>;
  const Search = <section className="b-meal-sec" aria-label="Lebensmittel suchen">
    <label className="b-field"><span>Lebensmittel suchen</span><input className="input" value={q} onChange={e => { setQ(e.target.value); setSel(null); }} placeholder="z. B. Haferflocken, Linsen, Skyr" autoComplete="off" /></label>
    {!foods && !err && <p className="hint">Nährwert-Datenbank wird geladen …</p>}
    {err && <p className="err" role="alert">{err}</p>}
    {results.length > 0 && !sel && <ul className="b-results">{results.map(f => <li key={f.code}><button onClick={() => { setSel(f); setMicro(null); }}><b>{f.name}</b><span>{f.v.kcal ?? '–'} kcal · {f.v.p ?? '–'} g Eiweiß · {f.v.fib === 'tr' ? 'Spuren' : f.v.fib ?? '–'} g Ballaststoffe je 100 g</span></button></li>)}</ul>}
    {foods && q.trim().length >= 2 && !results.length && <p className="hint">Nichts gefunden. Versuch ein allgemeineres Wort.</p>}
  </section>;

  return <div className="form b-meal">
    <div className="b-filter" role="group" aria-label="Mahlzeit">{MEALS.map(m => <button key={m} className={`chip${slot === m ? ' on' : ''}`} aria-pressed={slot === m} onClick={() => setSlot(m)}>{m}</button>)}</div>
    {!style && <div className="panel"><p className="top0"><b>Wie isst du meistens?</b></p><div className="btn-row"><button className="btn small" onClick={() => setStyle('wiederkehrend')}>Oft dasselbe</button><button className="btn small" onClick={() => setStyle('abwechselnd')}>Abwechslungsreich</button></div><p className="hint">Danach zeigt EvoVive zuerst gespeicherte Mahlzeiten oder zuerst die Suche. Änderbar unten.</p></div>}
    {style === 'wiederkehrend' ? <>{Saved}{Search}</> : <>{Search}{Saved}</>}
    {sel && <div className="panel b-sel-food">
      <p className="top0"><b>{sel.name}</b></p>
      <div className="b-repeat">{[50, 100, 150, 200, 250].map(v => <button key={v} className={`chip${g === v ? ' on' : ''}`} onClick={() => setGrams(String(v))}>{v} g</button>)}</div>
      <label className="b-field"><span>Menge in Gramm</span><input className="input" inputMode="decimal" value={grams} onChange={e => setGrams(e.target.value)} /></label>
      {g > 0 && g <= 3000 && (() => { const p = portion(sel, g); return <p className="hint">{p.snap.p ?? '–'} g Eiweiß · {p.gaps.includes('fib') ? 'Ballaststoffe unbekannt' : `${p.snap.fib} g Ballaststoffe`} · {p.snap.kcal ?? '–'} kcal</p>; })()}
      <div className="btn-row"><button className="btn primary small" disabled={!(g > 0 && g <= 3000)} onClick={() => add(sel, Math.round(g))}>Zu {slot} hinzufügen</button><button className="btn small ghost" onClick={showMicro}>Mehr Nährstoffe</button><button className="btn small ghost" onClick={() => setSel(null)}>Zurück</button></div>
      {micro && <dl className="b-terms">{MICRO_LABELS.map(([k, l, u], i) => <div key={k}><dt>{l}</dt><dd>{micro[i] == null ? 'kein Wert' : micro[i] === 'tr' ? 'Spuren' : `${fmtNum(micro[i], 1)} ${u}`} je 100 g</dd></div>)}</dl>}
    </div>}
    {todays.length > 0 && <section className="b-meal-sec" aria-label="Heute erfasst">
      <h3 className="h3">Heute erfasst</h3>
      <ul className="b-today-meals">{todays.map(m => <li key={m.id}><span><b>{m.name}</b> <small>{m.meal}, {m.qty} g</small></span><button className="b-x" aria-label={`${m.name} entfernen`} onClick={() => remove(m.id)}>×</button></li>)}</ul>
      {todays.some(m => m.meal === slot && m.source === 'bls') && <div className="inline-add"><input className="input" placeholder={`${slot} speichern als …`} value={presetName} onChange={e => setPresetName(e.target.value)} maxLength={40} /><button className="btn small" disabled={!presetName.trim()} onClick={savePreset}>Speichern</button></div>}
    </section>}
    <DayNutrition ctx={ctx} />
    <div className="b-links">{style && <button className="link" onClick={() => setStyle(style === 'wiederkehrend' ? 'abwechselnd' : 'wiederkehrend')}>{style === 'wiederkehrend' ? 'Lieber zuerst suchen' : 'Lieber zuerst gespeicherte Mahlzeiten'}</button>}
      <button className="link" onClick={() => commit(d => ({ ...d, mealPrefs: { ...(d.mealPrefs || {}), showKcal: !(d.mealPrefs || {}).showKcal } }), (data.mealPrefs || {}).showKcal ? 'Kalorien ausgeblendet' : 'Kalorien eingeblendet')}>{(data.mealPrefs || {}).showKcal ? 'Kalorien ausblenden' : 'Kalorien anzeigen'}</button></div>
  </div>;
}

/** Unter Entwicklung: Durchschnitt der letzten 7 Tage mit Einträgen, ohne erfundene Werte für Tage ohne Einträge. */
export function NutritionWeek({ ctx }) {
  const { data, today } = ctx;
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, -6 + i)).map(d => ({ d, t: daySum(data.meals, d) })).filter(x => x.t.count);
  if (!days.length) return null;
  const avg = k => Math.round(days.reduce((s, x) => s + x.t.sum[k], 0) / days.length);
  const pg = proteinGoal(data, today);
  return <section className="block" aria-labelledby="nut-h">
    <h2 className="h2" id="nut-h">Ernährung</h2>
    <div className="panel">
      <p className="top0">Schnitt an {days.length} {days.length === 1 ? 'Tag' : 'Tagen'} mit Einträgen (letzte 7 Tage): Eiweiß {avg('p')} g{pg.min ? ` (Ziel ${pg.max ? `${pg.min} bis ${pg.max}` : pg.min} g)` : ''}, Ballaststoffe {avg('fib')} g (Richtwert mind. {FIBER_GOAL.min} g){(data.mealPrefs || {}).showKcal ? `, Energie ${avg('kcal')} kcal` : ''}.</p>
      <p className="hint">Tage ohne Einträge fließen nicht ein. Fehlen im BLS Werte, sind die Summen eher zu niedrig.</p>
      <p className="b-src-line">Nährwerte: {BLS_SOURCE}</p>
    </div>
  </section>;
}
