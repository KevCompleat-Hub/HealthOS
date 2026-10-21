'use client';
// Paket D (W14): Befinden in wenigen Sekunden (Stimmung, Energie, Stress, optional Schlaf) und Tags wie Krankheit oder Reise.
// Eigene, freiwillige Einwilligung „beta-3“. Keine Diagnosen, keine Bewertungen. Auswertung nur als Zusammenhang, nicht als Ursache.
import React, { useEffect, useState } from 'react';
import { addDays, planStart } from '@healthos/domain';
import { Store } from '../storage/store';
import { dayCounts } from './today';

export const CHECKIN_CONSENT = 'beta-3';
export const SCALES = [
  ['mood', 'Stimmung', ['sehr gedrückt', 'gedrückt', 'mittel', 'gut', 'sehr gut']],
  ['energy', 'Energie', ['sehr müde', 'müde', 'mittel', 'wach', 'sehr wach']],
  ['stress', 'Stress', ['sehr entspannt', 'entspannt', 'mittel', 'angespannt', 'sehr angespannt']],
  ['sleep', 'Schlaf (optional)', ['sehr schlecht', 'schlecht', 'mittel', 'gut', 'sehr gut']],
];
export const TAGS = ['Viel Arbeit', 'Stress', 'Schlecht geschlafen', 'Krankheit', 'Reise', 'Ungewöhnlich aktiv', 'Späte Mahlzeit'];

/** Eintrag eines Tages setzen oder ergänzen. Werte 1 bis 5, Tags nur aus der Liste. */
export function setCheckin(d, date, patch) {
  const cur = (d.checkins || {})[date] || {};
  const n = { ...cur, ...patch };
  for (const [k] of SCALES) if (n[k] != null && !(Number.isInteger(n[k]) && n[k] >= 1 && n[k] <= 5)) delete n[k];
  n.tags = (n.tags || []).filter(t => TAGS.includes(t));
  return { ...d, checkins: { ...(d.checkins || {}), [date]: n } };
}

/**
 * Tags im Zusammenhang mit der Umsetzung: Anteil erledigter Punkte an Tagen mit Tag gegenüber Tagen ohne.
 * Nur Tage ab Planstart in den letzten 8 Wochen mit geplanten Punkten. Aussage ab 3 Tagen mit und 5 ohne Tag und 20 Prozentpunkten Abstand.
 */
export function tagInsights(data, today, weeks = 8) {
  const ps0 = planStart(data) || addDays(today, -7 * weeks);
  const from = addDays(today, -7 * weeks) > ps0 ? addDays(today, -7 * weeks) : ps0;
  const days = []; for (let d = from; d < today; d = addDays(d, 1)) { const c = dayCounts(data, d); if (c.total && !c.paused) days.push({ d, rate: c.done / c.total, tags: ((data.checkins || {})[d] || {}).tags || [] }); }
  const out = [];
  for (const t of TAGS) {
    const w = days.filter(x => x.tags.includes(t)), wo = days.filter(x => !x.tags.includes(t));
    if (w.length < 3 || wo.length < 5) continue;
    const a = w.reduce((s, x) => s + x.rate, 0) / w.length, b = wo.reduce((s, x) => s + x.rate, 0) / wo.length;
    if (Math.abs(a - b) >= 0.2) out.push({ tag: t, withRate: a, withoutRate: b, nWith: w.length, nWithout: wo.length });
  }
  return out;
}

function Scale({ k, label, words, value, onPick }) {
  return <div className="b-scale-row" role="group" aria-label={label}>
    <span className="b-scale-label">{label}</span>
    <div className="b-scale-btns">{[1, 2, 3, 4, 5].map(v => <button key={v} className={`b-dotbtn${value === v ? ' on' : ''}`} aria-pressed={value === v} aria-label={`${label}: ${words[v - 1]}`} title={words[v - 1]} onClick={() => onPick(k, value === v ? null : v)}>{v}</button>)}</div>
    <span className="b-scale-word">{value ? words[value - 1] : ''}</span>
  </div>;
}

/** Karte auf Heute. Ohne Einwilligung nur ein kurzer Hinweis zum Einschalten. In der Demo ohne Konto lokal nutzbar. */
export function CheckinCard({ ctx }) {
  const { data, today, commit, account } = ctx;
  const sb = account && account.supabase;
  const [consent, setConsent] = useState(sb ? null : true);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { if (sb) sb.from('beta_consents').select('version').eq('version', CHECKIN_CONSENT).maybeSingle().then(r => setConsent(!!(r && r.data))); }, [sb]);
  const entry = (data.checkins || {})[today] || {};
  const filled = SCALES.some(([k]) => entry[k]) || (entry.tags || []).length > 0;
  const give = async () => { const r = await sb.from('beta_consents').insert({ user_id: account.userId, version: CHECKIN_CONSENT }); if (r.error) setMsg('Die Einwilligung konnte nicht gespeichert werden.'); else { setConsent(true); setOpen(true); } };
  const off = async () => {
    commit(d => ({ ...d, checkins: {} }), 'Befinden ausgeschaltet, Einträge gelöscht');
    try { const c = await Store.connect(); if (c) await c.backend.remove('checkins'); } catch { /* bereits leer */ }
    if (sb) await sb.from('beta_consents').delete().eq('version', CHECKIN_CONSENT);
    setConsent(false); setOpen(false);
  };
  if (consent === null) return null;
  if (!consent) return <section className="block panel b-checkin" aria-labelledby="ci-h">
    <p className="b-next-kicker" id="ci-h">Wie geht's dir heute?</p>
    {!open ? <><p className="top0">Optional: Stimmung, Energie und Stress in wenigen Sekunden, dazu Tags wie Reise oder Krankheit. So siehst du später, was die Umsetzung beeinflusst.</p>
      <div className="btn-row"><button className="btn small" onClick={() => setOpen(true)}>Mehr erfahren</button></div></>
      : <><p className="hint top0">Diese Angaben sind Gesundheitsdaten. Gespeichert werden sie nur für dein Konto und nur mit deiner ausdrücklichen Einwilligung. EvoVive stellt daraus keine Diagnosen und bewertet nichts. Du kannst das jederzeit ausschalten, dann werden alle Einträge gelöscht.</p>
        <div className="btn-row"><button className="btn small primary" onClick={give}>Einwilligen und einschalten</button><button className="btn small ghost" onClick={() => setOpen(false)}>Nicht jetzt</button></div></>}
    {msg && <p className="err" role="alert">{msg}</p>}
  </section>;
  const pick = (k, v) => { setOpen(true); commit(d => setCheckin(d, today, { [k]: v }), 'Befinden gespeichert'); };
  const tag = t => { setOpen(true); commit(d => setCheckin(d, today, { tags: (entry.tags || []).includes(t) ? entry.tags.filter(x => x !== t) : [...(entry.tags || []), t] }), 'Tag gespeichert'); };
  return <section className="block panel b-checkin" aria-labelledby="ci-h">
    <div className="h2-row"><p className="b-next-kicker" id="ci-h">Wie geht's dir heute?</p>{filled && !open && <button className="link" onClick={() => setOpen(true)}>Ändern</button>}</div>
    {filled && !open ? <p className="top0">{SCALES.filter(([k]) => entry[k]).map(([k, l, w]) => `${l.replace(' (optional)', '')}: ${w[entry[k] - 1]}`).join(' · ')}{(entry.tags || []).length ? ` · ${entry.tags.join(', ')}` : ''}</p> : <>
      {SCALES.map(([k, l, w]) => <Scale key={k} k={k} label={l} words={w} value={entry[k]} onPick={pick} />)}
      <div className="b-tags" role="group" aria-label="Tags für heute">{TAGS.map(t => <button key={t} className={`chip${(entry.tags || []).includes(t) ? ' on' : ''}`} aria-pressed={(entry.tags || []).includes(t)} onClick={() => tag(t)}>{t}</button>)}</div>
      <div className="btn-row">{filled && <button className="btn small" onClick={() => setOpen(false)}>Fertig</button>}<button className="link" onClick={off}>Ausschalten und Einträge löschen</button></div>
    </>}
  </section>;
}

/** Unter Entwicklung: Verlauf der letzten 14 Tage und Zusammenhänge der Tags mit der Umsetzung. */
export function ContextInsights({ ctx }) {
  const { data, today } = ctx;
  const ci = data.checkins || {};
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, -13 + i));
  if (!days.some(d => ci[d])) return null;
  const ins = tagInsights(data, today);
  const avg = k => { const v = days.map(d => ci[d] && ci[d][k]).filter(Boolean); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1).replace('.', ',') : null; };
  return <section className="block" aria-labelledby="ctx-h">
    <h2 className="h2" id="ctx-h">Befinden und Kontext</h2>
    <div className="panel">
      <p className="top0">Letzte 14 Tage, Schnitt auf der Skala 1 bis 5: {SCALES.slice(0, 3).map(([k, l]) => `${l} ${avg(k) || 'k. A.'}`).join(' · ')}</p>
      <div className="b-ci-grid" aria-hidden="true">{days.map(d => <span key={d} className={`b-ci-day${ci[d] ? '' : ' empty'}`} title={d}><i style={{ height: `${((ci[d] && ci[d].mood) || 0) * 6}px` }} /></span>)}</div>
      {ins.length ? <ul className="plain">{ins.map(x => <li key={x.tag}>An Tagen mit „{x.tag}“ hast du im Schnitt {Math.round(x.withRate * 100)} Prozent deiner Punkte geschafft, an anderen Tagen {Math.round(x.withoutRate * 100)} Prozent ({x.nWith} gegen {x.nWithout} Tage).</li>)}</ul>
        : <p className="hint">Zusammenhänge mit Tags erscheinen ab 3 Tagen mit und 5 Tagen ohne den jeweiligen Tag.</p>}
      <p className="hint">Das sind Zusammenhänge, keine Ursachen. EvoVive bewertet dein Befinden nicht und stellt keine Diagnosen.</p>
    </div>
  </section>;
}
