'use client';
// Geglätteter Gewichtstrend (W10): Messpunkte und Trendlinie der letzten 60 Tage, Veränderung nur mit genug Messungen.
import React from 'react';
import { addDays, fmtDM, fmtNum, signed, smoothWeights, trendChange } from '@healthos/domain';

export function WeightTrendCard({ ctx }) {
  const { data, today } = ctx;
  const pts = smoothWeights(data.weights.filter(w => w.date > addDays(today, -60) && w.date <= today));
  if (pts.length < 2) return null;
  const ch = trendChange(data.weights, today);
  const ys = pts.flatMap(p => [p.raw, p.trend]); const lo = Math.min(...ys) - 0.3, hi = Math.max(...ys) + 0.3;
  const W = 320, H = 90, x0 = Date.parse(`${addDays(today, -59)}T12:00:00Z`), span = 59 * 86400000;
  const X = d => ((Date.parse(`${d}T12:00:00Z`) - x0) / span) * (W - 8) + 4, Y = v => H - 6 - ((v - lo) / (hi - lo || 1)) * (H - 12);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.date).toFixed(1)} ${Y(p.trend).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return <section className="block tight" aria-labelledby="wt-h">
    <h3 className="h3 top0" id="wt-h">Gewichtstrend</h3>
    <div className="panel">
      <p className="top0"><b>{fmtNum(last.trend, 1)} kg</b> geglättet{ch ? <>, {signed(ch.delta)} kg in {ch.days} Tagen</> : <span className="muted">. Für eine Veränderung braucht es mindestens 3 Messungen am Anfang und am Ende von 2 Wochen.</span>}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="b-wt" role="img" aria-label={`Gewicht der letzten 60 Tage, ${pts.length} Messtage, Trend zuletzt ${fmtNum(last.trend, 1)} kg`}>
        {pts.map(p => <circle key={p.date} cx={X(p.date)} cy={Y(p.raw)} r="2.2" className="b-wt-raw" />)}
        <path d={line} className="b-wt-line" />
      </svg>
      <p className="hint">Punkte: Messungen. Linie: Durchschnitt der jeweils letzten 7 Tage, ab {fmtDM(pts[0].date)}.</p>
      <details><summary>Warum schwankt das Gewicht?</summary><p className="hint">Einzelwerte schwanken von Tag zu Tag, etwa durch Flüssigkeit, Mahlzeiten oder die Uhrzeit der Messung. Die geglättete Linie zeigt die Richtung über mehrere Tage besser als ein einzelner Wert. Fehlende Tage werden nicht aufgefüllt.</p></details>
    </div>
  </section>;
}
