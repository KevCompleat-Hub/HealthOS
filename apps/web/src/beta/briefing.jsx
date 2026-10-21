'use client';
// Morning Briefing (W10): höchstens drei Aussagen. Was heute ansteht, was zuletzt gut lief (nur mit Datengrundlage), eine Handlung.
// Regelbasiert, keine KI. Ohne ausreichende Daten wird keine persönliche Aussage erzeugt.
import React from 'react';
import { addDays, classOfItem, fmtNum, goalAt, habitAdherence, signed, toMin, trainingsInWeek, trendChange, weekCoverage, weekStart } from '@healthos/domain';
import { dayCounts, goalStreak, NextStep } from './today';

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

export function Briefing({ ctx }) {
  const lines = briefingLines(ctx.data, ctx.cfg, ctx.today, ctx.nowMin);
  return <section className="block b-next b-brief" aria-labelledby="brief-h">
    <p className="b-next-kicker" id="brief-h">Dein Tag</p>
    <ul className="b-brief-lines">{lines.map(l => <li key={l.kind} className={`b-brief-${l.kind}`}>{l.text}</li>)}</ul>
    <NextStep ctx={ctx} bare />
  </section>;
}
