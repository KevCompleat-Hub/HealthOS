'use client';
// Paket C (W13): Zielkette, Experimente und Wochentagsmuster unter „Entwicklung“.
// Regelbasiert aus vorhandenen Daten. Keine erfundenen Fortschritte, Muster nur mit genug Daten und als Zusammenhang, nicht als Ursache.
import React, { useState } from 'react';
import { addDays, classOfItem, daysBetween, effStatus, fmtDM, fmtNum, GOALS, goalAt, HABIT_LIBRARY, habitAdherence, isLimit, nextWeeklyDate, dayLabel, pauseStats, planStart, signed, trainingsInWeek, trendChange, versionAt, WD, wdIdx, weekStart, weeklyTarget } from '@healthos/domain';
import { FEATURES as BETA } from '../features';

const WDL = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

/* ---------- Zielkette: Ziel, Maßnahmen, Fortschritt, nächster Schritt ---------- */
export function goalChain(data, cfg, today) {
  const goals = (cfg.goals || []).filter(g => !BETA.hiddenGoals.includes(g) && GOALS[g]);
  const ws = weekStart(today);
  return goals.map((g, prio) => {
    const routines = (data.routines || []).filter(r => r.goal === g && r.status !== 'archiviert').map(r => { const v = versionAt(r, today); return v ? `${v.title} (${v.days.map(d => WD[d]).join(', ')})` : null; }).filter(Boolean);
    const habits = data.habits.filter(h => h.active !== false && !isLimit(h) && h.lib && HABIT_LIBRARY[h.lib] && HABIT_LIBRARY[h.lib].goals.includes(g)).map(h => h.name);
    const ind = [];
    const goalT = goalAt(data, ws), tw = trainingsInWeek(data, today);
    if (['fitter', 'abnehmen'].includes(g) && goalT > 0) ind.push({ label: 'Training diese Woche', value: `${tw} von ${goalT}` });
    if (g === 'abnehmen') { const t = trendChange(data.weights, today); ind.push(t ? { label: 'Gewichtstrend', value: `${signed(t.delta)} kg in ${t.days} Tagen` } : { label: 'Gewichtstrend', value: 'noch zu wenige Messungen' }); }
    if (g === 'bewegung') { const ps = pauseStats(data, today); if (ps.eligible) ind.push({ label: 'Bewegungspausen diese Woche', value: `${ps.done} von ${ps.eligible}` }); const st = data.steps.filter(s => s.date > addDays(today, -7) && s.date <= today); if (st.length) ind.push({ label: 'Schritte, Schnitt der erfassten Tage', value: fmtNum(Math.round(st.reduce((a, s) => a + s.count, 0) / st.length)) }); }
    if (['ernaehrung', 'routinen', 'abnehmen'].includes(g) && habits.length) { const a = habitAdherence({ ...data, habits: data.habits.filter(h => habits.includes(h.name)) }, addDays(today, -7), addDays(today, -1), today); if (a.eligible) ind.push({ label: 'Passende Gewohnheiten, letzte 7 Tage', value: `${a.done} von ${a.eligible}` }); }
    let next = null;
    if (!routines.length && !habits.length) next = { label: 'Passende Gewohnheit wählen', go: ['heute'] };
    else if (g === 'abnehmen' && !data.weights.some(w => w.date > addDays(today, -7))) next = { label: 'Gewicht eintragen', go: ['erfassen', 'gewicht'] };
    else if (['fitter', 'abnehmen'].includes(g) && goalT > 0 && tw < goalT) next = { label: 'Training der Woche ansehen', go: ['woche'] };
    return { key: g, label: GOALS[g], prio: prio + 1, routines, habits, ind, next };
  });
}

export function GoalChain({ ctx }) {
  const list = goalChain(ctx.data, ctx.cfg, ctx.today);
  if (!list.length) return null;
  const nextRv = nextWeeklyDate(ctx.today, ctx.cfg, ctx.data);
  return <div className="b-chain">
    <h3 className="h3">Deine Ziele im Zusammenhang</h3>
    {list.map((g, i) => <details key={g.key} className="panel b-chain-goal" open={i === 0}>
      <summary><b>{g.prio}. {g.label}</b></summary>
      <dl className="b-terms">
        <div><dt>Maßnahmen im Plan</dt><dd>{[...g.routines, ...g.habits].join(' · ') || 'Noch keine Routine oder Gewohnheit für dieses Ziel.'}</dd></div>
        <div><dt>Fortschritt</dt><dd>{g.ind.length ? g.ind.map(x => `${x.label}: ${x.value}`).join(' · ') : 'Noch keine Daten für eine Aussage.'}</dd></div>
        <div><dt>Review</dt><dd>{nextRv ? `Nächster Wochen-Check-in ${dayLabel(nextRv, ctx.today)}` : 'Check-in erscheint, sobald eine Woche mit Plan vorliegt.'}</dd></div>
      </dl>
      {g.next && <button className="btn small" onClick={() => ctx.go(...g.next.go)}>{g.next.label}</button>}
    </details>)}
  </div>;
}

/* ---------- Experimente: Gewohnheit mit Laufzeit, Kriterium und Abschluss ---------- */
export function expStatus(data, h, today) {
  const e = h.experiment; if (!e) return null;
  const end = addDays(e.from, e.days - 1); const last = today < end ? today : end;
  let done = 0; for (let d = e.from; d <= last; d = addDays(d, 1)) if (data.habitLog[`${h.id}|${d}`] === 'done') done++;
  const day = Math.min(e.days, Math.max(0, daysBetween(e.from, today) + 1));
  return { day, days: e.days, done, minDays: e.minDays, end, ended: today > end, reached: done >= e.minDays, decision: e.decision || null };
}

export function startExperiment(d, { habitId, idea, days, today }) {
  const minDays = Math.ceil(days * 0.7);
  const experiment = { from: today, days, minDays };
  if (habitId) return { ...d, habits: d.habits.map(h => (h.id === habitId ? { ...h, active: true, inactiveFrom: undefined, experiment } : h)) };
  return { ...d, habits: [...d.habits, { id: `c-exp-${idea.key}`, name: idea.name, custom: true, active: true, ...(idea.trigger ? { trigger: idea.trigger } : {}), ...(idea.daytime ? { daytime: idea.daytime } : {}), experiment }] };
}

export function decideExperiment(d, habitId, decision, today) {
  return { ...d, habits: d.habits.map(h => {
    if (h.id !== habitId || !h.experiment) return h;
    const n = { ...h, experiment: { ...h.experiment, decision, decidedAt: today } };
    return decision === 'beendet' ? { ...n, active: false, inactiveFrom: today } : n;
  }) };
}

export function Experiments({ ctx }) {
  const { data, today, commit } = ctx;
  const [form, setForm] = useState(false); const [pick, setPick] = useState(''); const [days, setDays] = useState(14);
  const exps = data.habits.filter(h => h.experiment && !h.experiment.decision).map(h => ({ h, s: expStatus(data, h, today) }));
  const done = data.habits.filter(h => h.experiment && h.experiment.decision).slice(-3);
  const candidates = data.habits.filter(h => h.active !== false && !isLimit(h) && !weeklyTarget(h) && !h.experiment);
  const ideas = BETA.habitIdeas.filter(x => x.limit == null && !x.perWeek && !data.habits.some(h => h.name === x.name));
  const start = () => { if (!pick) return; const [kind, id] = pick.split(':'); commit(d => startExperiment(d, kind === 'h' ? { habitId: id, days, today } : { idea: ideas.find(x => x.key === id), days, today }), `Experiment gestartet: ${days} Tage`); setForm(false); setPick(''); };
  return <section className="block" aria-labelledby="exp-h">
    <h2 className="h2" id="exp-h">Experimente</h2>
    <div className="panel">
      <p className="hint top0">Eine Gewohnheit für eine feste Zeit ausprobieren und am Ende entscheiden, ob sie bleibt. Ein Experiment zeigt, was dir im Alltag gelingt, nicht, was es bewirkt.</p>
      {exps.map(({ h, s }) => <div key={h.id} className="b-exp">
        <b>{h.name}</b>
        {!s.ended ? <p className="top0">Tag {s.day} von {s.days}: {s.done} erledigt, Ziel {s.minDays} Tage.</p>
          : <><p className="top0">{s.reached ? `Geschafft: ${s.done} von ${s.days} Tagen.` : `${s.done} von ${s.days} Tagen, Ziel waren ${s.minDays}.`} Wie geht es weiter?</p>
            <div className="btn-row"><button className="btn small primary" onClick={() => commit(d => decideExperiment(d, h.id, 'behalten', today), `${h.name} bleibt als Gewohnheit`)}>Als Gewohnheit behalten</button>
              <button className="btn small ghost" onClick={() => commit(d => decideExperiment(d, h.id, 'beendet', today), `Experiment beendet: ${h.name}`)}>Beenden</button></div></>}
      </div>)}
      {!exps.length && !form && <p className="top0">Gerade läuft kein Experiment.</p>}
      {!form ? <div className="btn-row"><button className="btn small" onClick={() => setForm(true)}>Experiment starten</button></div> : <div className="form">
        <label className="b-field"><span>Was möchtest du ausprobieren?</span><select className="input" value={pick} onChange={e => setPick(e.target.value)}>
          <option value="">Bitte wählen</option>
          {candidates.length > 0 && <optgroup label="Deine Gewohnheiten">{candidates.map(h => <option key={h.id} value={`h:${h.id}`}>{h.name}</option>)}</optgroup>}
          {ideas.length > 0 && <optgroup label="Neue Idee">{ideas.map(x => <option key={x.key} value={`i:${x.key}`}>{x.name}</option>)}</optgroup>}
        </select></label>
        <label className="b-field"><span>Dauer</span><select className="input b-sel" value={days} onChange={e => setDays(Number(e.target.value))}>{[7, 14, 21, 30].map(v => <option key={v} value={v}>{v} Tage</option>)}</select></label>
        <p className="hint">Ziel: an mindestens {Math.ceil(days * 0.7)} von {days} Tagen. Die Gewohnheit erscheint täglich auf Heute.</p>
        <div className="btn-row"><button className="btn small primary" disabled={!pick} onClick={start}>Starten</button><button className="btn small ghost" onClick={() => setForm(false)}>Abbrechen</button></div>
      </div>}
      {done.length > 0 && <p className="hint">Zuletzt: {done.map(h => `${h.name} (${h.experiment.decision === 'behalten' ? 'behalten' : 'beendet'})`).join(', ')}</p>}
    </div>
  </section>;
}

/* ---------- Muster: Umsetzung nach Wochentagen ---------- */
/**
 * Erledigungsquote je Wochentag über die letzten n Wochen vor heute: geplante Trainings und Bewegung plus tägliche Gewohnheiten.
 * Ein Wochentag zählt erst ab 4 Gelegenheiten. Aussage nur bei mindestens 4 auswertbaren Tagen und 25 Prozentpunkten Abstand.
 */
export function weekdayPattern(data, today, weeks = 8) {
  const from = addDays(weekStart(today), -7 * weeks);
  const agg = Array.from({ length: 7 }, () => ({ done: 0, total: 0 }));
  for (const i of data.items) {
    if (i.date < from || i.date >= today || !['training', 'bewegung'].includes(i.type) || ['verschoben', 'pausiert', 'ausgelassen'].includes(i.status) || classOfItem(i) === 'optional_logging') continue;
    const a = agg[wdIdx(i.date)]; a.total++; if (effStatus(i, today) === 'erledigt') a.done++;
  }
  const daily = data.habits.filter(h => !isLimit(h) && !weeklyTarget(h));
  const ps0 = planStart(data) || from;
  for (let d = from > ps0 ? from : ps0; d < today; d = addDays(d, 1)) for (const h of daily) {
    const v = data.habitLog[`${h.id}|${d}`]; if (v === 'skip' || (h.inactiveFrom && d >= h.inactiveFrom)) continue;
    const a = agg[wdIdx(d)]; a.total++; if (v === 'done') a.done++;
  }
  const rated = agg.map((a, i) => ({ wd: i, ...a, rate: a.total >= 4 ? a.done / a.total : null })).filter(a => a.rate != null);
  if (rated.length < 4) return { enough: false, days: rated.length };
  const best = rated.reduce((x, y) => (y.rate > x.rate ? y : x)), worst = rated.reduce((x, y) => (y.rate < x.rate ? y : x));
  return { enough: true, best, worst, clear: best.rate - worst.rate >= 0.25, rows: rated };
}

export function Patterns({ ctx }) {
  const p = weekdayPattern(ctx.data, ctx.today);
  return <section className="block" aria-labelledby="pat-h">
    <h2 className="h2" id="pat-h">Muster</h2>
    <div className="panel">
      {!p.enough ? <p className="top0 muted">Noch zu wenige Daten. Muster nach Wochentagen erscheinen, sobald für mindestens 4 Wochentage je 4 Gelegenheiten vorliegen, meist nach etwa 4 Wochen.</p>
        : p.clear ? <p className="top0">Am <b>{WDL[p.best.wd]}</b> klappt die Umsetzung am häufigsten ({p.best.done} von {p.best.total}), am <b>{WDL[p.worst.wd]}</b> am seltensten ({p.worst.done} von {p.worst.total}).</p>
          : <p className="top0">Die Umsetzung ist über die Wochentage recht gleichmäßig.</p>}
      {p.enough && <p className="hint">Grundlage: geplante Trainings, Bewegung und tägliche Gewohnheiten der letzten 8 Wochen. Das ist ein Zusammenhang mit dem Wochentag, keine Ursache.</p>}
    </div>
  </section>;
}
