'use client';
// Motivations-Bausteine für „Heute“ (Beta). Rechnen nur mit Funktionen des M1-Kerns, ändern keine Fachregeln.
import React, { useEffect, useRef, useState } from 'react';
import { A, addDays, classOfItem, goalAt, habitOn, nextActions, pausedAll, trainingsInWeek, weekCoverage, weekDays, weekStart, weeklyTarget, WD } from '@healthos/domain';
import { FEATURES as BETA } from '../features';

const vibrate = p => { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch { /* ohne Vibration */ } };
const hk = (h, d) => `${h.id}|${d}`;

/** Gewohnheiten, die an einem Tag gelten (aktiv, nicht pausiert). */
export function habitsOn(data, d) { return pausedAll(data, d) ? [] : data.habits.filter(h => habitOn(h, d)); }

/** Haken einer Gewohnheit in der Woche von d vor d. */
const doneBefore = (data, h, d) => { let n = 0; for (let x = weekStart(d); x < d; x = addDays(x, 1)) if (data.habitLog[hk(h, x)] === 'done') n++; return n; };
/** Zählt eine Gewohnheit an Tag d mit? Tägliche immer (außer ausgelassen), mit Wochenziel nur bis das Ziel erreicht ist. */
export const habitCountsOn = (data, h, d) => {
  const v = data.habitLog[hk(h, d)]; const t = weeklyTarget(h);
  if (!t) return v !== 'skip';
  return v === 'done' || doneBefore(data, h, d) < t;
};
/** Fortschritt einer Gewohnheit mit Wochenziel in der Woche von d (einschließlich d). */
export const weekProgress = (data, h, d) => { const t = weeklyTarget(h); if (!t) return null; let n = 0; for (let i = 0; i < 7; i++) { const x = addDays(weekStart(d), i); if (x <= d && data.habitLog[hk(h, x)] === 'done') n++; } return { done: n, target: t }; };

/** Zähler eines Tages: Plan-Einträge (ohne optionale Erfassung, ohne Check-in-Termin) plus Gewohnheiten. */
export function dayCounts(data, d) {
  const items = data.items.filter(i => i.date === d && i.routine !== 'review' && !['verschoben', 'pausiert', 'ausgelassen'].includes(i.status) && classOfItem(i) !== 'optional_logging');
  const hs = habitsOn(data, d).filter(h => habitCountsOn(data, h, d));
  const done = items.filter(i => i.status === 'erledigt').length + hs.filter(h => data.habitLog[hk(h, d)] === 'done').length;
  return { total: items.length + hs.length, done, paused: pausedAll(data, d) };
}

/** Wochen in Folge mit erreichtem Trainingsziel. Die laufende Woche zählt nur, wenn ihr Ziel schon erreicht ist. */
export function goalStreak(data, today) {
  let n = 0; const cur = weekStart(today);
  const hit = ws => { const g = goalAt(data, ws); return g > 0 && trainingsInWeek(data, ws) >= g; };
  if (hit(cur)) n++;
  for (let ws = addDays(cur, -7), k = 0; k < 52; ws = addDays(ws, -7), k++) {
    if (weekCoverage(data, ws, today) === 'pausiert') continue;
    if (!hit(ws)) break; n++;
  }
  return n;
}

function Ring({ done, total }) {
  const r = 34, c = 2 * Math.PI * r, p = total ? done / total : 0;
  return <svg className="b-ring" viewBox="0 0 84 84" aria-hidden="true">
    <circle cx="42" cy="42" r={r} className="b-ring-bg" />
    <circle cx="42" cy="42" r={r} className={`b-ring-fg${p >= 1 ? ' full' : ''}`} strokeDasharray={`${c * p} ${c}`} transform="rotate(-90 42 42)" />
    <text x="42" y="47" textAnchor="middle" className="b-ring-num">{total ? `${done}/${total}` : '–'}</text>
  </svg>;
}

/** Der nächste sinnvolle Schritt: erste offene Plan-Aufgabe (nach dem Kern), sonst erste offene Gewohnheit. Eine Aktion. */
export function NextStep({ ctx, bare = false }) {
  const { data, today, nowMin, commit, openSheet } = ctx;
  const plan = nextActions(data, today, nowMin).find(i => i.date === today && i.status === 'geplant' && classOfItem(i) !== 'optional_logging');
  const habit = habitsOn(data, today).find(h => !data.habitLog[hk(h, today)] && habitCountsOn(data, h, today));
  if (!plan && !habit) return null;
  const Wrap = bare ? ({ children }) => <div className="b-next-inner" aria-label="Dein nächster Schritt">{children}</div> : ({ children }) => <section className="block b-next" aria-labelledby="ns-h"><p className="b-next-kicker" id="ns-h">Dein nächster Schritt</p>{children}</section>;
  return <Wrap>
    {plan ? <div className="b-next-row">
      <button className="b-next-main" onClick={() => openSheet({ kind: 'item', id: plan.id })}><b>{plan.title}</b><span>{plan.time ? `${plan.time} Uhr` : 'heute'}{plan.duration ? `, ${plan.duration} Min.` : ''}</span></button>
      <button className="btn small primary" onClick={() => { vibrate(12); commit(d => A.toggleItem(d, plan.id, today), `Erledigt: ${plan.title}`); }}>Erledigt</button>
    </div> : <div className="b-next-row">
      <div className="b-next-main"><b>{habit.name}</b><span>Gewohnheit für heute</span></div>
      <button className="btn small primary" onClick={() => { vibrate(12); commit(d => ({ ...d, habitLog: { ...d.habitLog, [hk(habit, today)]: 'done' } }), `Geschafft: ${habit.name}`); }}>Abhaken</button>
    </div>}
  </Wrap>;
}

/** Tagesring, Wochenleiste und Trainingsserie oben auf „Heute“. */
export function TodayProgress({ ctx }) {
  const { data, today, cfg } = ctx;
  const t = dayCounts(data, today);
  const days = weekDays(today);
  const goal = goalAt(data, weekStart(today));
  const tw = trainingsInWeek(data, today);
  const streak = goalStreak(data, today);
  const open = t.total - t.done;
  const msg = !t.total ? 'Heute ist nichts geplant. Ein guter Tag für eine Runde nach Lust und Laune.'
    : open === 0 ? 'Alles erledigt für heute. Stark.'
      : t.done === 0 ? 'Der erste Haken ist der wichtigste. Oben steht, womit du anfangen kannst.'
        : `Noch ${open} ${open === 1 ? 'Punkt' : 'Punkte'}, du bist gut dabei.`;
  return <section className="block b-progress" aria-label="Fortschritt heute">
    <div className="b-prog-top">
      <Ring done={t.done} total={t.total} />
      <div>
        <p className="b-prog-title">{t.total ? `${t.done} von ${t.total} heute geschafft` : 'Freier Tag'}</p>
        <p className="b-prog-msg">{msg}</p>
      </div>
    </div>
    <ol className="b-week" aria-label="Diese Woche">
      {days.map((d, i) => {
        const c = dayCounts(data, d); const future = d > today;
        const state = c.paused ? 'pause' : future ? 'future' : !c.total ? 'free' : c.done >= c.total ? 'full' : c.done > 0 ? 'part' : 'none';
        const label = { pause: 'pausiert', future: 'kommt noch', free: 'nichts geplant', full: 'alles geschafft', part: `${c.done} von ${c.total}`, none: `0 von ${c.total}` }[state];
        return <li key={d} className={`b-day ${state}${d === today ? ' today' : ''}`} aria-label={`${WD[i]}: ${label}`}>
          <span className="b-dot" aria-hidden="true" /><span className="b-wd">{WD[i]}</span>
        </li>;
      })}
    </ol>
    <div className="b-chips">
      {goal > 0 && <span className={`b-chip${tw >= goal ? ' good' : ''}`}>{tw >= goal ? `Wochenziel erreicht: ${tw} Trainings` : `Training: ${tw} von ${goal}, noch ${goal - tw}`}</span>}
      {streak >= 2 && <span className="b-chip good">{streak} Wochen in Folge Ziel erreicht</span>}
    </div>
  </section>;
}

/** Gewohnheiten für heute: ein Tipp hakt ab oder öffnet wieder, langes Drücken markiert „bewusst ausgelassen“. */
export function HabitsToday({ ctx }) {
  const { data, today, commit, go } = ctx;
  const hs = habitsOn(data, today);
  const [ideas, setIdeas] = useState(false);
  const press = useRef(null);
  const set = (h, v, msg) => commit(d => { const log = { ...d.habitLog }; if (v) log[hk(h, today)] = v; else delete log[hk(h, today)]; return { ...d, habitLog: log }; }, msg);
  const tap = h => { const v = data.habitLog[hk(h, today)]; if (v === 'done' || v === 'skip') set(h, null, `Wieder offen: ${h.name}`); else { vibrate(12); set(h, 'done', `Geschafft: ${h.name}`); } };
  // Klick (Finger, Maus, Tastatur, Bildschirmleser) hakt ab. Langes Drücken setzt „bewusst ausgelassen“ und unterdrückt den folgenden Klick.
  const down = h => { clearTimeout(press.current); press.current = setTimeout(() => { press.current = 'lang'; vibrate([8, 40, 8]); set(h, 'skip', `Heute bewusst ausgelassen: ${h.name}`); }, 550); };
  const cancel = () => { if (press.current && press.current !== 'lang') { clearTimeout(press.current); press.current = null; } };
  const click = h => { if (press.current === 'lang') { press.current = null; return; } cancel(); tap(h); };
  const [menu, setMenu] = useState(null);
  const [manage, setManage] = useState(false);
  const active = data.habits.filter(h => h.active !== false);
  const ideaList = BETA.habitIdeas.filter(x => !data.habits.some(h => h.name === x.name && h.active !== false));
  const add = x => commit(d => {
    const ex = d.habits.find(h => h.name === x.name);
    return { ...d, habits: ex ? d.habits.map(h => (h === ex ? { ...h, active: true, inactiveFrom: undefined, perWeek: x.perWeek } : h)) : [...d.habits, { id: `c-${x.key}`, name: x.name, custom: true, active: true, ...(x.perWeek ? { perWeek: x.perWeek } : {}) }] };
  }, `Gewohnheit hinzugefügt: ${x.name}`);
  const setFreq = (h, v) => commit(d => ({ ...d, habits: d.habits.map(x => { if (x.id !== h.id) return x; const { perWeek, ...rest } = x; return v ? { ...rest, perWeek: v } : rest; }) }), `${h.name}: ${v ? `${v}× pro Woche` : 'täglich'}`);
  return <section className="block" aria-labelledby="hab-h">
    <div className="h2-row"><h2 className="h2" id="hab-h">Gewohnheiten heute</h2>
      <button className="link" onClick={() => go('woche')}>Woche</button></div>
    {hs.length ? <ul className="b-habits">
      {hs.map(h => { const v = data.habitLog[hk(h, today)]; return <li key={h.id} className="b-habit-row">
        <button className={`b-habit ${v || 'open'}`} aria-pressed={v === 'done'}
          aria-label={`${h.name}: ${v === 'done' ? 'geschafft, tippen zum Öffnen' : v === 'skip' ? 'bewusst ausgelassen, tippen zum Öffnen' : 'offen, tippen zum Abhaken, lange drücken zum Auslassen'}`}
          onPointerDown={() => down(h)} onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel} onContextMenu={e => e.preventDefault()} onClick={() => click(h)}>
          <span className="b-tick" aria-hidden="true">{v === 'done' ? '✓' : v === 'skip' ? '–' : ''}</span>
          <span className="b-habit-name">{h.name}{(() => { const p = weekProgress(data, h, today); return p ? <small className={`b-freq${p.done >= p.target ? ' good' : ''}`}>{p.done >= p.target ? `Wochenziel erreicht (${p.done} von ${p.target})` : `${p.done} von ${p.target} diese Woche`}</small> : null; })()}</span>
        </button>
        {v !== 'done' && <button className="b-skip" onClick={() => (v === 'skip' ? set(h, null, `Wieder offen: ${h.name}`) : set(h, 'skip', `Heute bewusst ausgelassen: ${h.name}`))} aria-label={v === 'skip' ? `${h.name}: Auslassen zurücknehmen` : `${h.name}: heute bewusst auslassen`}>{v === 'skip' ? 'Zurücknehmen' : 'Auslassen'}</button>}
      </li>; })}
    </ul> : <p className="hint top0">{active.length ? 'Heute ist pausiert.' : 'Noch keine Gewohnheit aktiv. Wähle unten eine, die in deinen Alltag passt.'}</p>}
    {hs.length > 0 && <p className="b-tip">Tippen hakt ab. „Auslassen“ heißt: heute bewusst nicht, zählt nicht gegen dich. Lange drücken geht auch.</p>}
    <div className="b-links"><button className="link" aria-expanded={ideas} onClick={() => setIdeas(!ideas)}>{ideas ? 'Ideen ausblenden' : 'Ideen für neue Gewohnheiten'}</button>
      {active.length > 0 && <button className="link" aria-expanded={manage} onClick={() => setManage(!manage)}>{manage ? 'Fertig' : 'Häufigkeit anpassen'}</button>}</div>
    {manage && <ul className="b-ideas">{active.map(h => <li key={h.id}><span><b>{h.name}</b></span>
      <select className="input b-sel" aria-label={`Häufigkeit für ${h.name}`} value={h.perWeek || 7} onChange={e => setFreq(h, Number(e.target.value) === 7 ? null : Number(e.target.value))}>
        {[7, 6, 5, 4, 3, 2, 1].map(v => <option key={v} value={v}>{v === 7 ? 'täglich' : `${v}× pro Woche`}</option>)}</select></li>)}</ul>}
    {ideas && <ul className="b-ideas">{ideaList.slice(0, 12).map(x => <li key={x.key}>
      <span><b>{x.name}</b><small>{x.when}{x.perWeek ? `, ${x.perWeek}× pro Woche` : ', täglich'}</small></span>
      <button className="btn small" onClick={() => add(x)} disabled={active.length >= 8}>Hinzufügen</button></li>)}
      {active.length >= 8 && <li className="hint">Höchstens 8 aktive Gewohnheiten. Weniger ist oft mehr.</li>}
    </ul>}
  </section>;
}

/** Erfolgsmoment: „Tag geschafft“ und „Wochenziel erreicht“, nur beim Übergang in dieser Sitzung. */
export function Celebrate({ ctx }) {
  const { data, today } = ctx;
  const t = dayCounts(data, today);
  const goal = goalAt(data, weekStart(today)); const tw = trainingsInWeek(data, today);
  const prev = useRef(null);
  const [show, setShow] = useState(null);
  useEffect(() => {
    const now = { day: t.total > 0 && t.done >= t.total, week: goal > 0 && tw >= goal };
    if (prev.current) {
      if (now.week && !prev.current.week) { setShow({ title: 'Wochenziel erreicht', text: `${tw} Trainings diese Woche. Richtig gut.` }); vibrate([20, 60, 20, 60, 40]); }
      else if (now.day && !prev.current.day) { setShow({ title: 'Tag geschafft', text: 'Alles erledigt, was heute anstand. Genieß den Rest des Tages.' }); vibrate([20, 60, 40]); }
    }
    prev.current = now;
  }, [t.done, t.total, tw, goal]);
  useEffect(() => { if (!show) return undefined; const id = setTimeout(() => setShow(null), 4500); return () => clearTimeout(id); }, [show]);
  if (!show) return null;
  return <div className="b-celebrate" role="status" onClick={() => setShow(null)}>
    <span className="b-burst" aria-hidden="true">★</span>
    <div><b>{show.title}</b><p>{show.text}</p></div>
  </div>;
}
