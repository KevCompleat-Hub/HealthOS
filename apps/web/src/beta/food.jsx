'use client';
// Ernährung: „Idee für heute“ auf Heute und ein Zutaten-Katalog passend zu Zielen, Training und Gewohnheiten.
// Allgemeine Lebensmittelauswahl nach den genannten Quellen. Keine Therapie, keine Nahrungsergänzung, keine Daten an Dritte.
import React, { useEffect, useRef, useState } from 'react';
import { GOALS, HABIT_LIBRARY, fmtNum } from '@healthos/domain';
import { FEATURES as BETA } from '../features';
import { FOODS_CATALOG, FOOD_GROUPS, FOOD_HABIT_IDEAS, FOOD_PRINCIPLES, FOOD_SOURCES } from './foodCatalog';

const dayNo = d => Math.floor(Date.parse(`${d}T12:00:00Z`) / 86400000);

/** Passende Zutaten für die Ziele, die erste Priorität zählt am meisten. Trainingstage bevorzugen Eiweißquellen. */
export function rankFoods(cfg, trainingToday) {
  const goals = (cfg.goals || []).filter(g => !BETA.hiddenGoals.includes(g));
  const score = f => goals.reduce((s, g, i) => s + (f.goals.includes(g) ? 6 - i : 0), 0) + (trainingToday && f.group === 'eiweiss' ? 4 : 0);
  return [...FOODS_CATALOG].map(f => ({ f, s: score(f) })).sort((a, b) => b.s - a.s).map(x => x.f);
}

function habitFor(key) {
  return [...BETA.habitIdeas, ...FOOD_HABIT_IDEAS].find(x => x.key === key) || (HABIT_LIBRARY[key] ? { key, name: HABIT_LIBRARY[key].name, lib: true } : null);
}
function hasHabit(data, h) { return data.habits.some(x => x.active !== false && (h.lib ? x.lib === h.key : x.name === h.name)); }
function addHabit(commit, h) {
  commit(d => {
    if (h.lib) {
      const ex = d.habits.find(x => x.lib === h.key);
      return { ...d, habits: ex ? d.habits.map(x => (x === ex ? { ...x, active: true, pinned: true, inactiveFrom: undefined } : x)) : [...d.habits, { id: `h-${h.key}`, lib: h.key, name: h.name, active: true, pinned: true }] };
    }
    const ex = d.habits.find(x => x.name === h.name);
    return { ...d, habits: ex ? d.habits.map(x => (x === ex ? { ...x, active: true, inactiveFrom: undefined } : x)) : [...d.habits, { id: `c-${h.key}`, name: h.name, custom: true, active: true, ...(h.perWeek ? { perWeek: h.perWeek } : {}) }] };
  }, `Gewohnheit hinzugefügt: ${h.name}`);
}

function Source({ k }) { const s = FOOD_SOURCES[k]; return s ? <a className="b-src" href={s.url} target="_blank" rel="noopener noreferrer">{s.publisher}</a> : <span className="b-src muted">allgemeine Lebensmittelauswahl</span>; }

function FoodItem({ f, ctx }) {
  const h = f.habit ? habitFor(f.habit) : null; const on = h && hasHabit(ctx.data, h);
  return <li className="b-food">
    <div className="b-food-head"><b>{f.name}</b><span className="b-food-group">{FOOD_GROUPS[f.group]}</span></div>
    <p>{f.why}</p>
    <p className="b-food-tip">{f.tip}</p>
    <div className="b-food-foot">
      <span className="b-food-goals">{f.goals.filter(g => !BETA.hiddenGoals.includes(g)).map(g => GOALS[g]).join(', ')}</span>
      <Source k={f.source} />
    </div>
    {h && <button className="btn small" disabled={on} onClick={() => addHabit(ctx.commit, h)}>{on ? 'Schon als Gewohnheit aktiv' : `Gewohnheit: ${h.name}`}</button>}
  </li>;
}

/** KI-Rezeptideen: nur Ziele, Trainingstage und Zutaten-Namen werden übertragen. Eigene Einwilligung „ki-2“. */
export function RecipeIdeas({ ctx, foods, post = (body, token) => fetch('/api/rezepte', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) }) }) {
  const { cfg, account } = ctx; const sb = account && account.supabase;
  const [consent, setConsent] = useState(null); const [state, setState] = useState('idle'); const [list, setList] = useState([]); const [wishes, setWishes] = useState(''); const [msg, setMsg] = useState('');
  useEffect(() => { if (sb) sb.from('beta_consents').select('version').eq('version', 'ki-2').maybeSingle().then(r => setConsent(!!(r && r.data))); }, [sb]);
  if (!BETA.aiRecipes || !sb) return null;
  const give = async () => { const r = await sb.from('beta_consents').insert({ user_id: account.userId, version: 'ki-2' }); if (r.error) setMsg('Die Einwilligung konnte nicht gespeichert werden.'); else setConsent(true); };
  const run = async () => {
    setState('laden'); setMsg('');
    try {
      const { data: { session } } = await sb.auth.getSession();
      const body = { goals: (cfg.goals || []).filter(g => !BETA.hiddenGoals.includes(g)).map(g => GOALS[g]), trainingDays: (cfg.training && cfg.training.perWeek) || 0, foods: foods.slice(0, 12).map(f => f.name), wishes };
      const r = await post(body, session && session.access_token); const j = await r.json().catch(() => ({}));
      if (!r.ok) { setState('idle'); return setMsg(j.fehler || 'Rezeptideen sind gerade nicht möglich.'); }
      setList(j.rezepte || []); setState('fertig');
    } catch { setState('idle'); setMsg('Rezeptideen sind gerade nicht möglich.'); }
  };
  return <section className="b-principles" aria-labelledby="rez-h">
    <h3 className="h3 top0" id="rez-h">Rezeptideen mit KI</h3>
    {consent === false ? <>
      <p className="hint">Für Rezeptideen werden deine Ziele, die Zahl deiner Trainingstage und die passenden Zutaten an den KI-Dienst Anthropic (Claude) übertragen. Keine Körperwerte, keine Namen. Die Vorschläge werden nicht gespeichert.</p>
      <button className="btn small" onClick={give}>Einwilligen</button>
    </> : consent === null ? null : <>
      <label className="b-field"><span>Wünsche (optional)</span><input className="input" placeholder="z. B. vegetarisch, schnell, mit Linsen" value={wishes} onChange={e => setWishes(e.target.value)} maxLength={200} /></label>
      <div className="btn-row"><button className="btn small primary" onClick={run} disabled={state === 'laden'}>{state === 'laden' ? 'Wird erstellt …' : state === 'fertig' ? 'Neue Ideen' : '3 Rezeptideen erstellen'}</button></div>
      {list.length > 0 && <ul className="b-foods">{list.map((r, i) => <li key={i} className="b-food">
        <div className="b-food-head"><b>{r.title}</b><span className="b-food-group">{r.minutes} Min.</span></div>
        <p className="b-food-tip">{r.fits}</p>
        <details><summary>Zutaten und Zubereitung</summary><ul>{r.ingredients.map((x, k) => <li key={k}>{x}</li>)}</ul><ol>{r.steps.map((x, k) => <li key={k}>{x}</li>)}</ol></details>
      </li>)}</ul>}
      {list.length > 0 && <p className="hint">KI-Vorschläge ohne Gewähr. Mengen und Zutaten bei Unverträglichkeiten selbst prüfen.</p>}
    </>}
    {msg && <p className="err" role="alert">{msg}</p>}
  </section>;
}

export function FoodCatalog({ ctx, close, trainingToday }) {
  const { cfg, data } = ctx;
  const [filter, setFilter] = useState('passend');
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.focus(); const esc = e => { if (e.key === 'Escape') close(); }; window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc); }, []);
  const ranked = rankFoods(cfg, trainingToday);
  const list = filter === 'passend' ? ranked.slice(0, 12) : filter === 'alle' ? FOODS_CATALOG : FOODS_CATALOG.filter(f => f.group === filter);
  const kg = [...data.weights].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''))).slice(-1)[0];
  const showProtein = (cfg.goals || []).includes('fitter') || trainingToday;
  return <div className="b-overlay" role="dialog" aria-modal="true" aria-labelledby="food-h">
    <div className="b-overlay-inner">
      <div className="h2-row"><h2 className="h2" id="food-h">Zutaten für deine Ziele</h2><button ref={ref} className="btn small" onClick={close}>Schließen</button></div>
      <details className="b-principles"><summary>Grundsätze und Quellen</summary>
        <ul>{FOOD_PRINCIPLES.filter(p => !p.protein || showProtein).map((p, i) => <li key={i}>{p.text} <Source k={p.source} /></li>)}</ul>
        {showProtein && kg && <p className="hint">Rechnerisch bei deinem letzten Gewicht von {fmtNum(kg.kg, 1)} kg: etwa {fmtNum(Math.round(kg.kg * 1.4))} bis {fmtNum(Math.round(kg.kg * 2))} g Eiweiß am Tag. Nur eine Orientierung, keine persönliche Ernährungsberatung.</p>}
      </details>
      <RecipeIdeas ctx={ctx} foods={ranked} />
      <div className="b-filter" role="group" aria-label="Auswahl">
        {[['passend', 'Passend zu mir'], ...Object.entries(FOOD_GROUPS), ['alle', 'Alle']].map(([k, l]) =>
          <button key={k} className={`chip${filter === k ? ' on' : ''}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      {filter === 'passend' && <p className="hint">Ausgewählt nach deinen Zielen{trainingToday ? ' und weil heute Training geplant ist' : ''}.</p>}
      <ul className="b-foods">{list.map(f => <FoodItem key={f.key} f={f} ctx={ctx} />)}</ul>
      <p className="hint">Allgemeine Lebensmittelauswahl, keine Therapie und keine Nahrungsergänzung. Bei Unverträglichkeiten, Allergien oder Vorerkrankungen gelten deine individuellen Vorgaben.</p>
    </div>
  </div>;
}

/** Karte auf Heute: eine Zutat für heute, passend zu Zielen und Training, mit Zugang zum Katalog. */
export function FoodTip({ ctx }) {
  const { cfg, data, today } = ctx;
  const [open, setOpen] = useState(false);
  if (!BETA.foodGuide) return null;
  const trainingToday = data.items.some(i => i.date === today && i.type === 'training' && !['verschoben', 'pausiert'].includes(i.status));
  // Nur zeigen, wenn es zu den Zielen oder zum Tag passt (Audit P2)
  if (!trainingToday && !(cfg.goals || []).some(g => ['ernaehrung', 'abnehmen'].includes(g))) return null;
  const pool = rankFoods(cfg, trainingToday).slice(0, 10);
  const f = pool[dayNo(today) % pool.length];
  const h = f.habit ? habitFor(f.habit) : null; const on = h && hasHabit(data, h);
  return <section className="block" aria-labelledby="food-tip-h">
    <div className="h2-row"><h2 className="h2" id="food-tip-h">Idee für heute</h2><button className="link" onClick={() => setOpen(true)}>Zutaten-Katalog</button></div>
    <div className="panel b-food-card">
      <p className="b-food-kicker">{trainingToday && f.group === 'eiweiss' ? 'Trainingstag: Eiweiß einplanen' : FOOD_GROUPS[f.group]}</p>
      <b>{f.name}</b>
      <p>{f.why}</p>
      <p className="b-food-tip">{f.tip}</p>
      {h && !on && <button className="btn small" onClick={() => addHabit(ctx.commit, h)}>Als Gewohnheit: {h.name}</button>}
    </div>
    {open && <FoodCatalog ctx={ctx} close={() => setOpen(false)} trainingToday={trainingToday} />}
  </section>;
}
