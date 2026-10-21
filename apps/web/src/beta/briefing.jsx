'use client';
// Morning Briefing (W10): höchstens drei Aussagen. Was heute ansteht, was zuletzt gut lief (nur mit Datengrundlage), eine Handlung.
// Regelbasiert, keine KI. Ohne ausreichende Daten wird keine persönliche Aussage erzeugt.
import React, { useState } from 'react';
import { A, addDays, classOfItem, daysBetween, effStatus, fmtNum, goalAt, habitAdherence, isLimit, limitWeek, signed, toMin, trainingsInWeek, trendChange, versionAt, weekCoverage, weekStart, weeklyTarget } from '@healthos/domain';
import { dayCounts, goalStreak, habitsOn, NextStep } from './today';

/** Reine Funktion, testbar: liefert 1 bis 2 Textzeilen (die dritte Aussage ist die Handlung im Knopf). */
export function briefingLines(data, cfg, today, nowMin) {
  const out = [];
  const t = dayCounts(data, today);
  const items = data.items.filter(i => i.date === today && i.status === 'geplant' && i.routine !== 'review' && classOfItem(i) !== 'optional_logging');
  const upcoming = items.filter(i => i.time && toMin(i.time) >= nowMin).sort((a, b) => a.time.localeCompare(b.time))[0];
  if (!t.total) out.push({ kind: 'heute', text: 'Heute ist nichts fest geplant.' });
  else if (t.done >= t.total) out.push({ kind: 'heute', text: 'Für heute ist alles erledigt.' });
  else if (upcoming) { const rest = t.total - t.done - 1; out.push({ kind: 'heute', text: `Heute: ${upcoming.title} um ${upcoming.time} Uhr${rest > 0 ? `, dazu ${rest === 1 ? '1 weiterer Punkt' : `${rest} weitere Punkte`}` : ''}.` }); }
  else out.push({ kind: 'heute', text: `Heute ${t.total - t.done === 1 ? 'ist noch 1 Punkt' : `sind noch ${t.total - t.done} Punkte`} offen.` });

  const lastWs = addDays(weekStart(today), -7);
  const goal = goalAt(data, lastWs), tr = trainingsInWeek(data, lastWs);
  const streak = goalStreak(data, today);
  const h7 = habitAdherence(data, addDays(today, -7), addDays(today, -1), today), h14 = habitAdherence(data, addDays(today, -14), addDays(today, -8), today);
  const goals = (cfg && cfg.goals) || [];
  const wt = goals.includes('abnehmen') ? trendChange(data.weights, today) : null;
  if (streak >= 2) out.push({ kind: 'zuletzt', text: `${streak} Wochen in Folge Trainingsziel erreicht.` });
  else if (goal > 0 && tr >= goal && weekCoverage(data, lastWs, today) === 'vollstaendig') out.push({ kind: 'zuletzt', text: `Letzte Woche: Trainingsziel erreicht (${tr} von ${goal}).` });
  else if (wt && wt.delta <= -0.3) out.push({ kind: 'zuletzt', text: `Gewichtstrend: ${signed(wt.delta)} kg in ${wt.days} Tagen.` });
  else if (h7.eligible >= 7 && h14.eligible >= 7 && h7.rate - h14.rate >= 0.1) out.push({ kind: 'zuletzt', text: `Gewohnheiten: ${h7.done} von ${h7.eligible} in den letzten 7 Tagen, mehr als in der Woche davor.` });
  return out.slice(0, 2);
}

/**
 * Bis zu zwei Vorschläge mit Anlass, Begründung und Aktion (W12). Nur aus vorhandenen Daten, sonst keiner.
 * Reihenfolge: Gewicht bei Ziel „Abnehmen“, Trainingsziel in Gefahr, Gewohnheit mit Wochenziel im Rückstand, Rahmen einer begrenzten Gewohnheit erreicht.
 */
export function briefingSuggestions(data, cfg, today) {
  const out = []; const goals = (cfg && cfg.goals) || [];
  if (goals.includes('abnehmen')) {
    const last = [...data.weights].filter(w => w.date <= today).sort((a, b) => a.date.localeCompare(b.date)).slice(-1)[0];
    const age = last ? daysBetween(last.date, today) : null;
    if (!last || age >= 7) out.push({ key: 'gewicht', anlass: last ? `Letzter Gewichtswert vor ${age} Tagen` : 'Noch kein Gewichtswert', grund: 'Für den Trend braucht es regelmäßige Werte, etwa einmal pro Woche.', aktion: { label: 'Gewicht eintragen', go: ['erfassen', 'gewicht'] } });
  }
  const ws = weekStart(today), goal = goalAt(data, ws), tw = trainingsInWeek(data, today);
  const openPlanned = data.items.filter(i => i.type === 'training' && i.date >= today && i.date <= addDays(ws, 6) && i.status === 'geplant').length;
  if (goal > 0 && tw < goal && tw + openPlanned < goal) out.push({ key: 'training', anlass: `Training: ${tw} von ${goal} diese Woche`, grund: 'Mit den noch geplanten Terminen reicht es diese Woche nicht ganz. Ein kurzer Ersatz zählt auch.', aktion: { label: 'Woche ansehen', go: ['woche'] } });
  const elapsed = daysBetween(ws, today) + 1;
  for (const h of habitsOn(data, today)) {
    const t = weeklyTarget(h); if (!t || data.habitLog[`${h.id}|${today}`]) continue;
    let n = 0; for (let x = ws; x < today; x = addDays(x, 1)) if (data.habitLog[`${h.id}|${x}`] === 'done') n++;
    if (n < t && n < Math.round((t * elapsed) / 7)) { out.push({ key: `habit-${h.id}`, anlass: `${h.name}: ${n} von ${t} diese Woche`, grund: 'Liegt etwas hinter dem Wochenziel, heute wäre ein guter Tag.', aktion: { label: 'Heute abhaken', habit: h.id } }); break; }
  }
  for (const h of habitsOn(data, today).filter(isLimit)) {
    const l = limitWeek(data, h, today);
    if (l.max > 0 && l.count === l.max) { out.push({ key: `limit-${h.id}`, anlass: `${h.name}: Rahmen dieser Woche erreicht`, grund: h.alternative ? `Wenn es wieder lockt: ${h.alternative}.` : 'Für den Rest der Woche bewusst darauf achten.', aktion: null }); break; }
  }
  return out.slice(0, 2);
}

/** Routinen, deren letzte zwei Termine vor heute verpasst wurden (innerhalb von 21 Tagen). Ein einmaliger Ausfall löst nichts aus. */
export function missedTwice(data, today) {
  const res = [];
  for (const rt of data.routines || []) {
    if (rt.status === 'archiviert' || !['training', 'bewegung'].includes(rt.type)) continue;
    const past = data.items.filter(i => i.routine === rt.id && i.date < today && i.date >= addDays(today, -21) && !['verschoben', 'pausiert'].includes(i.status)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2);
    if (past.length === 2 && past.every(i => effStatus(i, today) === 'verpasst') && !(data.dismissed || []).includes(`alt:${rt.id}:${past[0].date}`)) res.push({ rt, last: past[0] });
  }
  return res;
}

/** Kürzere Dauer ab morgen als neue Routinenversion, Hinweis danach ausgeblendet. Vergangene Termine bleiben unverändert. */
export function applyShorter(d, m, today) {
  const v = versionAt(m.rt, today); const shorter = Math.max(10, Math.round((v.duration * 2) / 3 / 5) * 5);
  const nd = A.saveRoutine(d, m.rt.id, { title: v.title, kind: v.kind, days: v.days, time: v.time, duration: shorter, note: v.note, interval: v.interval, type: m.rt.type, goal: m.rt.goal, taskClass: m.rt.taskClass, priority: m.rt.priority, exceptions: m.rt.exceptions }, addDays(today, 1), today);
  return { ...nd, dismissed: [...(nd.dismissed || []), `alt:${m.rt.id}:${m.last.date}`] };
}

/** Vorschlag nach zwei verpassten Terminen: kürzere Dauer ab morgen (neue Routinenversion) oder bewusst so lassen. Nichts ohne Bestätigung. */
export function AltCard({ ctx }) {
  const { data, today, commit } = ctx;
  const [open, setOpen] = useState(false);
  const m = missedTwice(data, today)[0]; if (!m) return null;
  const v = versionAt(m.rt, today); if (!v) return null;
  const shorter = Math.max(10, Math.round((v.duration * 2) / 3 / 5) * 5);
  const dismiss = d => ({ ...d, dismissed: [...(d.dismissed || []), `alt:${m.rt.id}:${m.last.date}`] });
  const apply = () => commit(d => applyShorter(d, m, today), `${v.title}: ab morgen ${shorter} Min.`);
  return <section className="block panel b-alt" aria-labelledby="alt-h">
    <p className="b-next-kicker" id="alt-h">Einfacher machen?</p>
    <p className="top0">„{v.title}“ hat zuletzt zweimal nicht geklappt. Das passiert. Eine kürzere Einheit ist oft leichter umzusetzen.</p>
    {!open ? <div className="btn-row"><button className="btn small primary" onClick={() => setOpen(true)}>Vorschlag ansehen</button><button className="btn small ghost" onClick={() => commit(dismiss, 'Alles bleibt wie geplant')}>Passt so</button></div>
      : <><p className="hint">Ab morgen {shorter} statt {v.duration} Minuten, gleiche Tage und Uhrzeit. Vergangene Termine bleiben unverändert. Rückgängig über „Rückgängig“ oder in der Routine.</p>
        <div className="btn-row"><button className="btn small primary" onClick={apply}>Übernehmen</button><button className="btn small ghost" onClick={() => setOpen(false)}>Abbrechen</button></div></>}
  </section>;
}

export function Briefing({ ctx }) {
  const lines = briefingLines(ctx.data, ctx.cfg, ctx.today, ctx.nowMin);
  const sugg = briefingSuggestions(ctx.data, ctx.cfg, ctx.today);
  return <section className="block b-next b-brief" aria-labelledby="brief-h">
    <p className="b-next-kicker" id="brief-h">Dein Tag</p>
    <ul className="b-brief-lines">{lines.map(l => <li key={l.kind} className={`b-brief-${l.kind}`}>{l.text}</li>)}</ul>
    {sugg.length > 0 && <ul className="b-sugg" aria-label="Vorschläge">{sugg.map(x => <li key={x.key}><div><b>{x.anlass}</b><span>{x.grund}</span></div>
      {x.aktion && <button className="btn small" onClick={() => x.aktion.go ? ctx.go(...x.aktion.go) : ctx.commit(d => ({ ...d, habitLog: { ...d.habitLog, [`${x.aktion.habit}|${ctx.today}`]: 'done' } }), 'Abgehakt')}>{x.aktion.label}</button>}</li>)}</ul>}
    <NextStep ctx={ctx} bare />
  </section>;
}
