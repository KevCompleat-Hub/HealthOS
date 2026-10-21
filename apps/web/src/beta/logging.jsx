'use client';
// Smart Logging (W12): die letzten Trainings mit einem Tipp wiederholen, inklusive Verknüpfung mit einer offenen geplanten Einheit der Woche.
import React from 'react';
import { A, addDays, byTime, weekStart } from '@healthos/domain';

/** Bis zu drei zuletzt genutzte, verschiedene Trainings (Art, Dauer, Intensität), die neuesten zuerst. */
export function recentWorkouts(data) {
  const seen = new Set(); const out = [];
  for (const w of [...data.workouts].filter(w => w.source === 'manuell').sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')))) {
    const k = `${w.kind}|${w.duration}|${w.intensity}`; if (seen.has(k)) continue; seen.add(k); out.push(w); if (out.length === 3) break;
  }
  return out;
}

export function QuickRepeat({ ctx }) {
  const { data, today, commit } = ctx;
  const list = recentWorkouts(data); if (!list.length) return null;
  const ws = weekStart(today);
  const openT = i => i.type === 'training' && ['geplant', 'verpasst'].includes(i.status) && !i.replacedBy;
  const planned = data.items.filter(i => openT(i) && i.date === today).sort(byTime)[0] || data.items.filter(i => openT(i) && i.date >= ws && i.date <= addDays(ws, 6)).sort(byTime)[0];
  const log = w => commit(d => A.logWorkout(d, { date: today, kind: w.kind, duration: w.duration, intensity: w.intensity, counts: w.counts !== false, note: '' }, planned ? planned.id : null), planned ? `${w.kind} gespeichert, geplante Einheit abgehakt` : `${w.kind} gespeichert`);
  return <div className="b-repeat-wrap">
    <p className="hint top0">Mit einem Tipp wiederholen{planned ? `, zählt für „${planned.title}“` : ''}:</p>
    <div className="b-repeat">{list.map(w => <button key={w.id} className="chip" onClick={() => log(w)}>{w.kind}, {w.duration} Min.</button>)}</div>
  </div>;
}
