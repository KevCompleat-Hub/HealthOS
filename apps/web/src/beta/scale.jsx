'use client';
// Körperwerte: schnelle Gewichtseingabe (zum Beispiel im Wochen-Check-in) und Auslesen eines Waagen-Screenshots per KI.
// Das Bild wird nur zur Auswertung an den Server geschickt und nirgends gespeichert. Gespeichert wird erst, was du bestätigst.
import React, { useEffect, useState } from 'react';
import { fmtNum, hm, parseNum, uid, validateWeight, weekStart, addDays } from '@healthos/domain';
import { FEATURES as BETA } from '../features';

export const KI_CONSENT = 'ki-1';
const RANGES = { kg: [30, 300], fat: [2, 70], muscle: [10, 150], water: [20, 80] };
const LABELS = { kg: ['Gewicht', 'kg'], fat: ['Körperfett', '%'], muscle: ['Muskelmasse', 'kg'], water: ['Körperwasser', '%'] };

/** Neuer Körperwerte-Eintrag. Zusätzliche Werte stehen neben kg, der Kern nutzt nur kg. */
export function addBodyEntry(d, v, { today, nowMin, source }) {
  const extra = {}; const parts = [];
  for (const k of ['fat', 'muscle', 'water']) if (v[k] != null) { extra[k] = v[k]; parts.push(`${LABELS[k][0]} ${fmtNum(v[k], 1)} ${LABELS[k][1]}`); }
  return { ...d, weights: [...d.weights, { id: uid('wg'), date: v.date || today, time: hm(nowMin), kg: v.kg, note: parts.join(', '), source, ...extra }] };
}

/** Gewicht der laufenden oder ausgewerteten Woche schnell eintragen, ohne den Check-in zu verlassen. */
export function WeightQuick({ ctx, weekOf }) {
  const { data, today, nowMin, commit } = ctx;
  const ws = weekStart(weekOf || today);
  const inWeek = data.weights.filter(w => w.date >= ws && w.date <= addDays(ws, 6)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const [kg, setKg] = useState(''); const [err, setErr] = useState('');
  const save = () => {
    const e = validateWeight(kg); if (e || !kg.trim()) return setErr(e || 'Bitte ein Gewicht eingeben.');
    setErr(''); setKg('');
    commit(d => addBodyEntry(d, { kg: parseNum(kg) }, { today, nowMin, source: 'manuell' }), 'Gewicht gespeichert');
  };
  return <div className="panel b-weight-quick">
    <h3 className="h3 top0">Gewicht</h3>
    {inWeek.length ? <p className="hint top0">Diese Woche: {inWeek.map(w => `${fmtNum(w.kg, 1)} kg`).join(', ')}</p> : <p className="hint top0">Optional. Ein Wert pro Woche reicht für den Verlauf.</p>}
    <div className="inline-add">
      <input className="input" inputMode="decimal" placeholder="z. B. 84,6" aria-label="Gewicht in kg" value={kg} onChange={e => setKg(e.target.value)} />
      <button className="btn small" onClick={save}>Speichern</button>
    </div>
    {err && <p className="err" role="alert">{err}</p>}
  </div>;
}

async function shrink(file) {
  try {
    const bmp = await createImageBitmap(file); const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85)); if (blob) return blob;
  } catch { /* ohne Verkleinerung weiter */ }
  return file;
}
const toB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });

/** Screenshot der Waagen-App per KI auslesen. Erst nach eigener Einwilligung, Werte werden vor dem Speichern bestätigt. */
export function ScaleImport({ ctx, post = (body, token) => fetch('/api/waage', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) }) }) {
  const { today, nowMin, commit, account } = ctx;
  const sb = account && account.supabase;
  const [consent, setConsent] = useState(null); const [phase, setPhase] = useState('idle'); const [vals, setVals] = useState(null); const [msg, setMsg] = useState('');
  useEffect(() => { if (!sb) return; sb.from('beta_consents').select('version').eq('version', KI_CONSENT).maybeSingle().then(r => setConsent(!!(r && r.data))); }, [sb]);
  if (!BETA.scaleAi) return null;
  if (!sb) return <p className="hint">Waagen-Screenshots auslesen geht nur mit Anmeldung.</p>;
  const giveConsent = async () => { const r = await sb.from('beta_consents').insert({ user_id: account.userId, version: KI_CONSENT }); if (!r.error) setConsent(true); else setMsg('Die Einwilligung konnte nicht gespeichert werden.'); };
  const pick = async e => {
    const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
    setPhase('laden'); setMsg(''); setVals(null);
    try {
      const img = await shrink(f); const b64 = await toB64(img);
      const { data: { session } } = await sb.auth.getSession();
      const r = await post({ image: b64, mediaType: img.type || 'image/jpeg' }, session && session.access_token);
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setPhase('idle'); return setMsg(j.fehler || 'Die Auswertung ist gerade nicht möglich.'); }
      const v = j.werte || {};
      if (v.kg == null && v.fat == null && v.muscle == null && v.water == null) { setPhase('idle'); return setMsg('Auf dem Bild wurden keine eindeutigen Werte gefunden. Bitte manuell eintragen.'); }
      setVals({ kg: v.kg != null ? String(v.kg).replace('.', ',') : '', fat: v.fat != null ? String(v.fat).replace('.', ',') : '', muscle: v.muscle != null ? String(v.muscle).replace('.', ',') : '', water: v.water != null ? String(v.water).replace('.', ',') : '', date: v.date && v.date <= today ? v.date : today });
      setPhase('pruefen');
    } catch { setPhase('idle'); setMsg('Die Auswertung ist fehlgeschlagen. Bitte später erneut versuchen oder manuell eintragen.'); }
  };
  const save = () => {
    const out = { date: vals.date };
    for (const k of Object.keys(RANGES)) { const t = vals[k].trim(); if (!t) { out[k] = null; continue; } const n = parseNum(t); if (!(n >= RANGES[k][0] && n <= RANGES[k][1])) return setMsg(`${LABELS[k][0]}: bitte einen Wert zwischen ${RANGES[k][0]} und ${RANGES[k][1]} ${LABELS[k][1]} eingeben.`); out[k] = n; }
    if (out.kg == null) return setMsg('Bitte zumindest das Gewicht angeben.');
    commit(d => addBodyEntry(d, out, { today, nowMin, source: 'waage-screenshot' }), 'Körperwerte gespeichert');
    setPhase('idle'); setVals(null); setMsg('');
  };
  return <section className="panel b-scale" aria-labelledby="scale-h">
    <h3 className="h3 top0" id="scale-h">Screenshot der Waage auslesen</h3>
    {consent === false ? <>
      <p className="hint top0">Das Bild wird zur Auswertung an den KI-Dienst Anthropic (Claude) übertragen. EvoVive speichert das Bild nicht. Gespeichert werden nur die Werte, die du danach bestätigst. Wie Anthropic Anfragen verarbeitet, regeln dessen Bedingungen.</p>
      <button className="btn small" onClick={giveConsent}>Einwilligen und fortfahren</button>
    </> : consent === null ? <p className="hint top0">Wird geladen …</p> : <>
      <p className="hint top0">Screenshot aus deiner Waagen-App wählen. Erkannt werden Gewicht, Körperfett, Muskelmasse und Körperwasser.</p>
      {phase !== 'pruefen' && <label className="btn small b-file">{phase === 'laden' ? 'Wird ausgewertet …' : 'Screenshot wählen'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} disabled={phase === 'laden'} /></label>}
      {phase === 'pruefen' && vals && <div className="form">
        <p className="hint top0">Bitte prüfen. Gespeichert wird erst nach „Übernehmen“.</p>
        {Object.keys(RANGES).map(k => <label key={k} className="b-field"><span>{LABELS[k][0]} ({LABELS[k][1]})</span>
          <input className="input" inputMode="decimal" value={vals[k]} onChange={e => setVals({ ...vals, [k]: e.target.value })} /></label>)}
        <label className="b-field"><span>Datum</span><input className="input" type="date" max={today} value={vals.date} onChange={e => setVals({ ...vals, date: e.target.value })} /></label>
        <div className="btn-row"><button className="btn primary small" onClick={save}>Übernehmen</button><button className="btn small ghost" onClick={() => { setPhase('idle'); setVals(null); }}>Verwerfen</button></div>
      </div>}
    </>}
    {msg && <p className="err" role="alert">{msg}</p>}
  </section>;
}
