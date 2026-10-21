'use client';
/* eslint-disable */
// AUTOMATISCH ERZEUGT von tools/build-web-ui.mjs aus packages/reference/v5/app.jsx. Nicht von Hand ändern.
// Oberfläche: Referenz v5. Fachlogik: @healthos/domain (M1). Beta-Anpassungen: 118, siehe Generator.
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as D from '@healthos/domain';
import { FEATURES as BETA } from '../features';
import { Store } from '../storage/store';
import { emptyState, browserDownloads } from './support';
import { TodayProgress, HabitsToday, Celebrate, habitsOn } from '../beta/today';
import { usableOffer, fixText } from '../beta/review';
import { ScaleImport, WeightQuick } from '../beta/scale';
import { FoodTip } from '../beta/food';
import { PushSettings } from '../beta/push';
import { NextStep, pauseSub, ReviewEntry } from '../beta/today';
import { Briefing, AltCard } from '../beta/briefing';
import { QuickRepeat } from '../beta/logging';
import { WeightTrendCard } from '../beta/weight';
import { AccountExtras, exportAllData, APP_VERSION } from '../beta/account';
const { A, APPT_STATUS, COVERAGE_LABEL, DEFAULT_CONFIG, EVIDENCE, EVIDENCE_LEVELS, GOALS, HABIT_LIBRARY, IDEA_FOODS, INTENSITIES, INTENSITY, LAB_MARKERS, MEALS, PAUSE_KINDS, PLACES, PRIORITIES, REC_STATUS, REVIEW_STATUS, SCHEMA, SLOTS, STATUS_INFO, TASK_CLASSES, TONES, TYPES, WD, WD_LONG, WORKOUT_KINDS, addDays, adherence, allPauses, applyMeasureState, avg, berlinParts, buildExport, buildPlan, byTime, classOfItem, clone, coachHint, coachMeasures, completeReviewState, computeRecs, dayLabel, dayLabelLc, dayNutrition, daysBetween, effStatus, evalMeasure, findConflicts, fmtDM, fmtLong, fmtNum, fmtShort, fmtVal, fmtYm, gapText, goalAt, groupLabs, habitOn, habitStats, hints, hm, inWeek, isPause, isoWeek, labAssessment, markerOf, materialize, measureRecord, migrateSaved, missesInWeek, monthMetrics, monthlyDescriptor, monthlyTarget, nextActions, nextMonday, nextWeeklyDate, normalizeConfig, pad, parse, parseImport, parseNum, pauseStats, pausedAll, pct, pickQuestions, planDiff, planStart, previousQuestionIds, r15, recSourceList, recView, refPos, refText, reviewForDate, reviewOffer, runningMeasures, seed, signed, snap, snapshotDocs, specText, suggestHabits, syncHabits, syncPlanRoutines, toMin, trainingSeries, trainingsInWeek, uid, validateWeight, versionAt, wdIdx, weekCoverage, weekDays, weekMetrics, weekStart, weeklyDescriptor, weeklyWindow, weightTrend, workError, ymOf, yy } = D;
/* HealthOS – Demo-Prototyp. Alle Daten sind fiktiv und liegen nur im Arbeitsspeicher. */
/* ---------------- Datum & Format ---------------- */
/* Lokales Datum und Uhrzeit immer in Europe/Berlin, unabhängig von der Gerätezeitzone */
/* ---------------- Stammdaten der Demo ---------------- */
/* ---------------- Konfiguration & Planungs-Engine ---------------- */
/* Datenmodell für die spätere Migration (Supabase):
   config -> user_preferences, routines -> routine_templates + routine_versions + routine_exceptions,
   items -> agenda_items, habits/habitLog -> habits/habit_events, pauses -> schedule_exceptions. */
/* Bewusst ohne medizinische Gründe: nur Urlaub oder neutrale Auszeit */
/* ---------- Routinen: Vorlagen mit Versionen und Wochentags-Ausnahmen ---------- */
/* Wochenplan aus den Einstellungen in Routinen übertragen. Von dir angepasste Routinen bleiben unverändert. */
/* Nur unveränderte, zukünftige Routineninstanzen dürfen von der Planung angepasst werden */
/* Tageswechsel: Vergangene, nicht erledigte Einträge werden je nach Aufgabenklasse abgeschlossen.
   Tagesgebunden und wöchentlich -> verpasst, optional -> nicht erfasst, Frist -> bleibt offen. */
/* Erzeugt Instanzen ab heute bis Ende nächster Woche (oder bis horizon). Idempotent über feste IDs. */
/* ---------------- Export / Import ---------------- */
/* ---------------- Persönlicher Artifact-Speicher (claude.use("db")) ---------------- */
/* Gespeicherte Daten von Version 1 oder 2 in den aktuellen Stand überführen. Kein stiller Datenverlust. */
/* Gespeichert werden nur Konfiguration, Routinen und Plan. Messwerte, Laborwerte, Termine, Basisdaten,
   laborbezogene Empfehlungen und reine Sitzungseinträge nicht. */
/* Nährwerte je 100 g: grobe Demo-Werte, nicht geprüft */
/* ---------------- Fachlogik ---------------- */
/* Einheitlicher Status für Anzeige, Statistik und Export */
/* Abgeschlossene Trainings aus dem Plan plus frei erfasste Einheiten, die fürs Ziel zählen (ohne Doppelzählung) */
/* Verpasst zählt als nicht erledigt im Nenner. Bewusst ausgelassen, pausiert und verschoben fallen heraus. */
/* Heute als Nächstes: abgelaufene Fristen (höchstens eine), dann heutige offene Einträge.
   Kommende zuerst, früher am Tag verpasste Zeiten danach („noch heute möglich“), optionale Erfassungen zuletzt.
   Vergangene Tage erscheinen hier nie. */
/* Regelbasierter Hinweis: Fokus nach Ziel mit Priorität 1, Tonalität nach Einstellung */
/* In-App-Hinweise: nur Fristen und Termine. Tagesgebundene Aufgaben erzeugen nie Hinweise.
   Fristen erscheinen höchstens einmal pro Kalenderwoche (Ausblenden gilt für die Woche). */
/* ---------------- Health Intelligence (regelbasiert, nur Demo-Daten) ---------------- */
/* Kuratierte Quellen. Alle am 18.10.2026 per Websuche als existent geprüft. Inhalte werden nur verlinkt. */
/* Ein Laborwert löst nur dann eine Empfehlung aus, wenn Einheit, Referenz, Bestätigung und Aktualität eindeutig sind */
/* Laborbezogene Entscheidungen bleiben nur in der Sitzung, damit nichts Medizinisches im Speicher landet */
/* Höchstens zwei neue Vorschläge pro Woche, höchstens ein Primärvorschlag pro Tag */
/* ---------------- UI-Bausteine ---------------- */
const ICONS = {
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  calendar: <><rect x="3" y="4.5" width="18" height="16.5" rx="2.5" /><path d="M8 2.5v4M16 2.5v4M3 10h18" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  trend: <><path d="M3 20h18" /><path d="M5 16l4.5-5 3.5 3 6-7" /><path d="M15 7h4v4" /></>,
  heart: <path d="M12 20s-7.5-4.6-9-9.5C1.9 6.9 4.3 4 7.4 4c2 0 3.6 1.1 4.6 2.7C13 5.1 14.6 4 16.6 4c3.1 0 5.5 2.9 4.4 6.5-1.5 4.9-9 9.5-9 9.5z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  minus: <path d="M6.5 12h11" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  left: <path d="M15 5l-7 7 7 7" />,
  right: <path d="M9 5l7 7-7 7" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.6v.1" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></>,
  trash: <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />,
  star: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" />,
  bell: <><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" /><path d="M10 20.5h4" /></>,
  dumbbell: <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />,
  activity: <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />,
  utensils: <><path d="M7 3v18M4.5 3v5a2.5 2.5 0 0 0 5 0V3" /><path d="M17 21V3c-2.2 1.3-3 4-3 7 0 1.7 1.3 3 3 3" /></>,
  steth: <><path d="M6 3v6a5 5 0 0 0 10 0V3" /><path d="M11 14v2a4 4 0 0 0 8 0v-2" /><circle cx="19" cy="12" r="2" /></>,
  drop: <path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z" />,
  scale: <><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M8.5 10a5 5 0 0 1 7 0l-2.3 2.2" /></>,
  doc: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>,
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  move: <><path d="M4 12h14" /><path d="M13 7l5 5-5 5" /></>,
  repeat: <><path d="M17 3l3 3-3 3" /><path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H20" /><path d="M7 21l-3-3 3-3" /><path d="M20 13v1.5A3.5 3.5 0 0 1 16.5 18H4" /></>,
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" />,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  archive: <><rect x="3" y="4" width="18" height="5" rx="1.5" /><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4" /></>,
  book: <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19" />,
  up: <path d="M6 15l6-6 6 6" />,
  down: <path d="M6 9l6 6 6-6" />,
  pause: <path d="M9 5.5v13M15 5.5v13" />,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  steps: <><path d="M8 4.5c1.7 0 2.5 1.8 2.5 4.2S9.7 13 8 13s-2.5-1.9-2.5-4.3S6.3 4.5 8 4.5zM6 15.5h4l-.4 3a1.6 1.6 0 0 1-3.2 0z" /><path d="M16 7.5c1.7 0 2.5 1.8 2.5 4.2S17.7 16 16 16s-2.5-1.9-2.5-4.3.8-4.2 2.5-4.2zM14 18.5h4l-.2 1.2a1.8 1.8 0 0 1-3.6 0z" /></>,
};
function Icon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{ICONS[name]}</svg>;
}
function Segmented({ value, onChange, options, label }) {
  return <div className="seg" role="tablist" aria-label={label}>
    {options.map(([v, l]) => <button key={v} role="tab" aria-selected={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}
  </div>;
}
function Field({ label, children, hint }) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>;
}
function Sheet({ title, close, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const opener = document.activeElement;
    if (ref.current) ref.current.focus();
    return () => {
      window.removeEventListener('keydown', onKey); document.body.style.overflow = prev;
      /* Fokus nach dem Schließen zurück zum auslösenden Element */
      setTimeout(() => { if (opener && document.contains(opener) && typeof opener.focus === 'function') opener.focus(); }, 0);
    };
  }, []);
  return <div className="sheet-wrap" role="dialog" aria-modal="true" aria-label={title}>
    <div className="backdrop" onClick={close} />
    <div className="sheet" ref={ref} tabIndex={-1}>
      <div className="sheet-grip" aria-hidden="true" />
      <div className="sheet-head"><h2 className="h2">{title}</h2><button className="icon-btn" aria-label="Schließen" onClick={close}><Icon name="x" /></button></div>
      <div className="sheet-body">{children}</div>
    </div>
  </div>;
}
function Progress({ value, max, label }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return <div className="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}><span style={{ width: `${pct}%` }} /></div>;
}
function StatusTag({ it, today, always }) {
  const st = effStatus(it, today);
  const [l, ic, cls] = STATUS_INFO[st] || STATUS_INFO.geplant;
  if (st === 'geplant' && !always) {
    if (it.movedFrom) return <span className="tag"><Icon name="move" size={12} />Nachgeholt von {dayLabel(it.movedFrom, today)}</span>;
    if (it.replaces) return <span className="tag"><Icon name="move" size={12} />Ersatztermin</span>;
    return null;
  }
  if (st === 'erledigt' && !always) return it.lateLogged ? <span className="tag tag-ok"><Icon name="check" size={12} />nacherfasst</span> : null;
  const text = st === 'verschoben' ? `Verschoben auf ${dayLabel(it.movedTo, today)}` : st === 'faellig' ? `Frist seit ${dayLabel(it.date, today)}` : l;
  return <span className={`tag ${cls ? `tag-${cls}` : ''}`}><Icon name={ic} size={12} />{text}</span>;
}
function ItemRow({ it, ctx, showDay, next }) {
  const { today, commit, openSheet, nowMin } = ctx;
  const st = effStatus(it, today);
  const t = TYPES[it.type] || TYPES.sonstiges;
  const cls = classOfItem(it);
  const checkable = ['geplant', 'erledigt', 'faellig'].includes(st);
  const earlier = next && st === 'geplant' && it.date === today && it.time && toMin(it.time) + (it.duration || 0) < nowMin;
  return <li className={`row st-${st}`}>
    <button className="check" disabled={!checkable} aria-pressed={st === 'erledigt'}
      aria-label={st === 'erledigt' ? `${it.title}: wieder öffnen` : checkable ? `${it.title} als erledigt markieren` : `${it.title}: ${STATUS_INFO[st][0]}`}
      onClick={() => commit(d => (st === 'faellig' ? A.setStatus(d, it.id, 'erledigt') : A.toggleItem(d, it.id, today)), st === 'erledigt' ? `Wieder offen: ${it.title}` : `Erledigt: ${it.title}`)}>
      {st === 'erledigt' ? <Icon name="check" size={16} /> : st === 'verpasst' ? <Icon name="x" size={14} /> : ['ausgelassen', 'verschoben', 'pausiert', 'nicht_erfasst'].includes(st) ? <Icon name="minus" size={16} /> : null}
    </button>
    <button className="row-main" onClick={() => openSheet({ kind: 'item', id: it.id })} aria-label={`${it.title}, ${STATUS_INFO[st][0]}, Optionen öffnen`}>
      <span className="row-title">{it.title}</span>
      <span className="row-meta">
        {showDay && it.date !== today && <span>{cls === 'deadline' ? `Frist ${dayLabel(it.date, today)}` : dayLabel(it.date, today)}</span>}
        {it.time && <span>{it.time} Uhr</span>}
        {it.duration ? <span>{it.duration} Min.</span> : null}
        {earlier && <span className="tag tag-muted">noch heute möglich</span>}
        {cls === 'optional_logging' && st === 'geplant' && <span>optional</span>}
        <StatusTag it={it} today={today} />
      </span>
    </button>
    <span className="row-icon" title={t.label}><Icon name={t.icon} size={18} /></span>
  </li>;
}
function Empty({ text, action }) {
  return <div className="empty"><p>{text}</p>{action}</div>;
}

/* ---------------- Diagramme ---------------- */
function LineChart({ points, from, to, band, trend, height = 180, maxGap = 10, label, digits = 1 }) {
  const W = 340, H = height, pl = 40, pr = 12, pt = 12, pb = 26;
  if (!points.length) return null;
  const span = Math.max(1, daysBetween(from, to));
  const x = d => pl + (daysBetween(from, d) / span) * (W - pl - pr);
  const vals = points.map(p => p.value).concat(trend ? trend.map(p => p.value) : []);
  if (band && band.min != null) vals.push(band.min);
  if (band && band.max != null) vals.push(band.max);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const padv = (hi - lo) * 0.18 || Math.max(1, Math.abs(hi) * 0.05); lo -= padv; hi += padv;
  const y = v => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
  const segs = []; let cur = [];
  points.forEach((p, i) => { if (i && daysBetween(points[i - 1].date, p.date) > maxGap) { segs.push(cur); cur = []; } cur.push(p); });
  segs.push(cur);
  const path = arr => arr.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const ticks = [lo + (hi - lo) * 0.15, (lo + hi) / 2, hi - (hi - lo) * 0.15];
  const by = band ? [y(band.max != null ? band.max : hi), y(band.min != null ? band.min : lo)] : null;
  return <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={label}>
    {by && <rect x={pl} y={by[0]} width={W - pl - pr} height={Math.max(0, by[1] - by[0])} className="c-band" />}
    {ticks.map((t, i) => <g key={i}><line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} className="c-grid" /><text x={pl - 6} y={y(t) + 4} textAnchor="end" className="c-axis">{fmtNum(t, digits)}</text></g>)}
    {segs.map((s, i) => <path key={i} d={path(s)} className="c-line" />)}
    {trend && trend.length > 1 && <path d={path(trend)} className="c-trend" />}
    {points.map(p => <circle key={p.id || p.date + p.value} cx={x(p.date)} cy={y(p.value)} r={points.length > 60 ? 2.4 : 3.4} className="c-dot" />)}
    <text x={pl} y={H - 6} className="c-axis">{fmtShort(from)}</text>
    <text x={W - pr} y={H - 6} textAnchor="end" className="c-axis">{fmtShort(to)}</text>
  </svg>;
}
function BarChart({ data, goal, height = 160, label, fmt = v => fmtNum(v), table, goalLabel = 'Ziel', extraCol, coverageCol }) {
  const W = 340, H = height, pl = 40, pr = 8, pt = 12, pb = 24;
  const max = Math.max(goal || 0, ...data.map(d => d.value || 0)) * 1.15 || 1;
  const bw = (W - pl - pr) / data.length;
  const y = v => pt + (1 - v / max) * (H - pt - pb);
  const every = Math.ceil(data.length / 8);
  return <><svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={label}>
    {(max <= 6 ? Array.from({ length: Math.floor(max) + 1 }, (_, k) => k) : [0, max / 2]).map((t, i) => <g key={i}><line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} className="c-grid" /><text x={pl - 6} y={y(t) + 4} textAnchor="end" className="c-axis">{fmt(t)}</text></g>)}
    {data.map((d, i) => {
      const bx = pl + i * bw + bw * 0.18, w = bw * 0.64;
      return <g key={d.key}>
        {d.value == null
          ? <line x1={bx} x2={bx + w} y1={y(0) - 2} y2={y(0) - 2} className="c-missing" />
          : <rect x={bx} y={y(d.value)} width={w} height={Math.max(1, y(0) - y(d.value))} rx={Math.min(4, w / 3)} className={d.faint ? 'c-bar faint' : 'c-bar'} />}
        {((i % every === 0 && data.length - 1 - i >= Math.ceil(every / 2)) || i === data.length - 1) && <text x={bx + w / 2} y={H - 7} textAnchor="middle" className="c-axis">{d.label}</text>}
      </g>;
    })}
    {goal ? <g><line x1={pl} x2={W - pr} y1={y(goal)} y2={y(goal)} className="c-goal" /><text x={W - pr} y={y(goal) - 5} textAnchor="end" className="c-axis c-goal-t">{goalLabel} {fmt(goal)}</text></g> : null}
  </svg>
  {table && <details className="fold small"><summary>Werte als Tabelle</summary><div className="table-scroll"><table className="tbl"><thead><tr><th scope="col">Zeitraum</th><th scope="col">{table}</th>{extraCol && <th scope="col">{extraCol[0]}</th>}{coverageCol && <th scope="col">Datengrundlage</th>}</tr></thead><tbody>{data.map(d => <tr key={d.key}><td>{d.label}</td><td>{d.value == null ? (d.coverage ? 'Datenlücke' : 'nicht erfasst') : fmtNum(d.value)}{d.faint && !coverageCol ? ' (unvollständig)' : ''}</td>{extraCol && <td>{extraCol[1](d)}</td>}{coverageCol && <td>{COVERAGE_LABEL[d.coverage] || ''}</td>}</tr>)}</tbody></table></div></details>}
  </>;
}

/* ---------------- Heute ---------------- */
function DayArc({ items, nowMin, done, total, onPick }) {
  const W = 320, H = 186, cx = 160, cy = 160, r = 130;
  const pos = m => { const t = Math.min(1, Math.max(0, (m - 360) / 960)); const a = Math.PI * (1 - t); return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
  const [nx, ny] = pos(nowMin);
  const timed = items.filter(i => i.time);
  return <div className="arc-wrap">
    <svg viewBox={`0 0 ${W} ${H}`} className="arc" role="img" aria-label={`Tagesbogen von 6 bis 22 Uhr: ${done} von ${total} Einträgen erledigt`}>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} className="arc-track" />
      {nowMin > 360 && <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${nx.toFixed(1)} ${ny.toFixed(1)}`} className="arc-elapsed" />}
      {[720, 1080].map(m => { const [tx, ty] = pos(m); const [ix, iy] = [cx + (tx - cx) * 0.9, cy + (ty - cy) * 0.9]; return <text key={m} x={ix} y={iy + 4} textAnchor="middle" className="arc-axis">{m / 60}</text>; })}
      <g className="sun" aria-hidden="true"><circle cx={nx} cy={ny} r={15} className="sun-halo" /><circle cx={nx} cy={ny} r={7.5} className="sun-core" /></g>
      {timed.map(it => {
        const [x, y] = pos(toMin(it.time));
        return <g key={it.id} className={`arc-dot st-${it.status}`} role="button" tabIndex={0} aria-label={`${it.title} um ${it.time} Uhr, ${STATUS_INFO[it.status] ? STATUS_INFO[it.status][0] : ''}`}
          onClick={() => onPick(it.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(it.id); } }}>
          <circle cx={x} cy={y} r={16} className="dot-hit" />
          <circle cx={x} cy={y} r={8} className="dot" />
          {it.status === 'erledigt' && <path d={`M ${x - 3.4} ${y + 0.2} l 2.3 2.4 l 4.4 -4.8`} className="dot-check" />}
        </g>;
      })}
      <text x={cx} y={cy - 36} textAnchor="middle" className="arc-big">{total ? `${done} von ${total}` : 'Frei'}</text>
      <text x={cx} y={cy - 12} textAnchor="middle" className="arc-small">{total ? 'heute erledigt' : 'nichts geplant'}</text>
      <text x={cx - r} y={cy + 20} textAnchor="middle" className="arc-axis">6 Uhr</text>
      <text x={cx + r} y={cy + 20} textAnchor="middle" className="arc-axis">22 Uhr</text>
    </svg>
  </div>;
}
function Stat({ label, value, sub, onClick, missing, icon }) {
  const inner = <><span className="stat-top"><Icon name={icon} size={16} />{label}</span><span className={missing ? 'stat-val missing' : 'stat-val'}>{value}</span><span className="stat-sub">{sub}</span></>;
  return onClick ? <button className="stat" onClick={onClick}>{inner}</button> : <div className="stat">{inner}</div>;
}
function CoachLine({ ctx }) {
  const { data, today, commit, go, cfg, openSheet } = ctx;
  const c = coachHint(data, today, cfg);
  const act = () => {
    if (c.action.go) return go(...c.action.go);
    if (c.action.sheet) return openSheet(c.action.sheet);
    commit(d => A.addItem(d, { title: 'Home-Workout', type: 'training', kind: 'Home-Workout', date: c.action.date, time: '18:30', duration: 30, routine: null, taskClass: 'weekly_flexible', priority: 'hoch' }), 'Home-Workout eingeplant');
  };
  return <div className="coach" aria-label="Hinweis zur Woche">
    <div className="coach-icon"><Icon name="spark" size={18} /></div>
    <div>
      <p className="coach-text">{fixText(c.text)}</p>
      <details><summary>Warum dieser Hinweis?</summary><p className="coach-why">{fixText(c.reason)}</p></details>
      {c.action && <button className="btn small" onClick={act}>{c.action.label}</button>}
    </div>
  </div>;
}
function Today({ ctx, onSetup }) {
  const { data, today, nowMin, go, openSheet, commit, cfg, markRecs } = ctx;
  const goal = goalAt(data, weekStart(today));
  const todays = data.items.filter(i => i.date === today).sort(byTime);
  const active = todays.filter(i => i.status !== 'verschoben' && i.status !== 'pausiert');
  const pausedToday = todays.some(i => i.status === 'pausiert');
  const counted = active.filter(i => i.status !== 'ausgelassen' && classOfItem(i) !== 'optional_logging');
  const done = counted.filter(i => i.status === 'erledigt').length;
  const next = nextActions(data, today, nowMin);
  const habToday = habitsOn(data, today).filter(h => data.habitLog[`${h.id}|${today}`] !== 'skip');
  const habDone = habToday.filter(h => data.habitLog[`${h.id}|${today}`] === 'done').length;
  const h = Math.floor(nowMin / 60);
  const greet = h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
  const tw = trainingsInWeek(data, today);
  const ps = pauseStats(data, today);
  const stepsToday = data.steps.find(s => s.date === today);
  const wt = weightTrend(data, today);
  const appts = data.appointments.filter(a => a.status === 'vereinbart' && a.date >= today && a.date <= addDays(today, 21)).sort(byTime).slice(0, 3);
  const hr = hints(data, today, cfg);
  const hs = hr.list;
  const rv = recView(data, cfg, today);
  useEffect(() => { if (BETA.recs && rv.primary && rv.primary.primaryOn !== today) markRecs([rv.primary.id], true); }, [rv.primary && rv.primary.id, today]);
  const [arcOpen, setArcOpen] = useState(false);
  return <div className="screen">
    <header className="hero">
      <p className="greet">{greet}</p>
      <h1 className="h-date">{fmtLong(today)}</h1>
    </header>
    {cfg.skipped && <div className="setup-banner"><p>Du nutzt noch den {BETA.demoData ? 'Demo-Plan' : 'Standardplan'}. In etwa zwei Minuten entsteht dein persönlicher Wochenplan.</p><button className="btn small primary" onClick={onSetup}>Plan einrichten</button></div>}
    {pausedToday && <p className="callout pause-note"><Icon name="pause" size={16} /> Heute ist pausiert. Pausierte Einträge zählen nicht in deine Ziele.</p>}

    <Briefing ctx={ctx} />
    <AltCard ctx={ctx} />
    <TodayProgress ctx={ctx} />
    <Celebrate ctx={ctx} />
    <section className="block tight" aria-labelledby="next-h">
      <div className="h2-row"><h2 className="h2" id="next-h">Als Nächstes</h2><span className="muted small">{counted.length + habToday.length ? `${done + habDone} von ${counted.length + habToday.length} heute erledigt` : ''}</span></div>
      {next.length
        ? <ul className="list">{next.map(it => <ItemRow key={it.id} it={it} ctx={ctx} showDay next />)}</ul>
        : <Empty text={todays.length ? (habDone < habToday.length ? 'Termine erledigt. Unten warten noch Gewohnheiten.' : 'Alles erledigt für heute. Stark.') : 'Für heute ist nichts geplant.'} action={<button className="btn small" onClick={() => go('woche')}>Woche ansehen</button>} />}
    </section>

    <HabitsToday ctx={ctx} />
    <FoodTip ctx={ctx} />

    {BETA.recs && rv.primary && <section className="block" aria-labelledby="rec-h">
      <div className="h2-row"><h2 className="h2" id="rec-h">Empfehlung für dich</h2><button className="link" onClick={() => go('gesundheit', 'fuerdich')}>Alle Empfehlungen</button></div>
      <RecCard rec={rv.primary} ctx={ctx} compact />
    </section>}

    <section className="block" aria-labelledby="prog-h">
      <div className="h2-row"><h2 className="h2" id="prog-h">Fortschritt</h2>
        <button className="link" aria-expanded={arcOpen} onClick={() => setArcOpen(!arcOpen)}>{arcOpen ? 'Tagesbogen ausblenden' : 'Tagesbogen zeigen'}</button></div>
      {arcOpen && <DayArc items={active} nowMin={nowMin} done={done} total={counted.length} onPick={id => openSheet({ kind: 'item', id })} />}
      <div className="stats">
        <Stat icon="dumbbell" label="Training" value={goal ? `${tw} von ${goal}` : `${tw}`} sub={!goal ? 'kein Trainingsziel' : tw >= goal ? 'Wochenziel erreicht' : `noch ${goal - tw} diese Woche`} onClick={() => go('woche')} />
        <Stat icon="activity" label="Bewegungspausen" value={ps.eligible ? `${ps.done} von ${ps.eligible}` : 'keine geplant'} missing={!ps.eligible} sub={pauseSub(data, today, ps)} onClick={() => go('woche')} />
        <Stat icon="steps" label="Schritte heute" value={stepsToday ? fmtNum(stepsToday.count) : 'nicht erfasst'} missing={!stepsToday} sub={stepsToday ? 'manuell eingetragen' : 'optional, tippen zum Eintragen'} onClick={() => go('erfassen', 'schritte')} />
        {BETA.weight && <Stat icon="scale" label="Gewicht" value={wt ? `${signed(wt.delta)} kg` : 'Eintragen'} missing={!wt} sub={wt ? 'Ø 7 Tage ggü. Vorwoche' : 'tippen zum Eintragen'} onClick={() => (wt ? go('entwicklung') : go('erfassen', 'gewicht'))} />}
      </div>
      <CoachLine ctx={ctx} />
    </section>

    <ReviewCard ctx={ctx} />

    <section className="block">
      <h2 className="h2">Schnell erfassen</h2>
      <div className="quick">
        {[['gewicht', 'Gewicht', 'scale'], ['schritte', 'Schritte', 'steps'], ['training', 'Training', 'dumbbell'], ['mahlzeit', 'Mahlzeit', 'utensils']].filter(([k]) => BETA.capture.includes(k)).map(([k, l, ic]) =>
          <button key={k} className="quick-btn" onClick={() => go('erfassen', k)}><Icon name={ic} size={20} /><span>{l}</span></button>)}
      </div>
    </section>

    <section className="block">
      <details className="fold">
        <summary><span>Alle Einträge heute</span><span className="muted">{todays.length} {todays.length === 1 ? 'Eintrag' : 'Einträge'}, {next.length} davon oben</span></summary>
        {todays.length ? <ul className="list">{todays.map(it => <ItemRow key={it.id} it={it} ctx={ctx} />)}</ul> : <Empty text="Heute ist nichts geplant." />}
      </details>
    </section>

    {BETA.appointments && <section className="block">
      <div className="h2-row"><h2 className="h2">Nächste Termine</h2><button className="link" onClick={() => go('gesundheit', 'termine')}>Alle</button></div>
      {appts.length ? <ul className="list">{appts.map(a =>
        <li key={a.id} className="row"><span className="date-chip"><b>{parse(a.date).getDate()}</b><small>{parse(a.date).toLocaleDateString('de-DE', { month: 'short' })}</small></span>
          <button className="row-main" onClick={() => go('gesundheit', 'termine')}><span className="row-title">{a.title}</span><span className="row-meta"><span>{dayLabel(a.date, today)}</span>{a.time && <span>{a.time} Uhr</span>}<span>{a.practice}</span></span></button></li>)}</ul>
        : <Empty text="In den nächsten drei Wochen ist kein Termin vereinbart." />}
    </section>}

    <section className="block">
      <h2 className="h2">Hinweise</h2>
      {hs.length ? <ul className="hints">{hs.map(hh => <li key={hh.key} className="hint-row">
        <Icon name={hh.icon} size={18} />
        <p>{hh.text}</p>
        <div className="hint-actions">
          <button className="btn small" onClick={() => hh.action.sheet ? openSheet(hh.action.sheet) : go(...hh.action.go)}>{hh.action.label}</button>
          <button className="icon-btn sm" aria-label="Hinweis für diese Woche ausblenden" onClick={() => commit(d => ({ ...d, dismissed: [...d.dismissed, hh.key].slice(-200) }), 'Hinweis ausgeblendet')}><Icon name="x" size={16} /></button>
        </div>
      </li>)}</ul> : <Empty text="Keine offenen Fristen oder nahen Termine." />}
      {hr.hidden > 0 && <p className="hint">{hr.hidden} weitere {hr.hidden === 1 ? 'Hinweis ist' : 'Hinweise sind'} wegen deiner Einstellung „{INTENSITIES[hr.mode][0]}“ ausgeblendet.</p>}
      <p className="footnote"><Icon name="bell" size={14} /> Hinweise erscheinen nur hier in der App und nur für Fristen und Termine. Verpasste Tagesaufgaben erzeugen keine Hinweise. Push-Benachrichtigungen gibt es noch nicht.</p>
    </section>
  </div>;
}

/* ---------------- Woche ---------------- */
function HabitGrid({ ctx, days }) {
  const { data, today, commit } = ctx;
  const [name, setName] = useState(''); const [err, setErr] = useState('');
  const habits = data.habits.filter(h => days.some(d => habitOn(h, d)));
  const pausedHabits = data.habits.filter(h => h.active !== false && h.inactiveFrom && h.inactiveFrom <= addDays(today, 7));
  const add = () => {
    const n = name.trim();
    if (!n) return setErr('Bitte einen Namen eingeben.');
    if (n.length > 60) return setErr('Bitte höchstens 60 Zeichen.');
    if (habits.some(h => h.name.toLowerCase() === n.toLowerCase())) return setErr('Diese Gewohnheit gibt es schon.');
    setErr('');
    commit(d => ({ ...d, habits: [...d.habits, { id: uid('h'), name: n, active: true, custom: true }] }), `Gewohnheit angelegt: ${n}`); setName('');
  };
  return <div className="panel">
    {habits.length ? <div className="table-scroll"><table className="habits">
      <thead><tr><th scope="col"><span className="sr">Gewohnheit</span></th>{days.map(d => <th key={d} scope="col" className={d === today ? 'is-today' : ''}>{WD[wdIdx(d)]}</th>)}</tr></thead>
      <tbody>{habits.map(h => <tr key={h.id}><th scope="row">{h.name}</th>{days.map(d => {
        const v = data.habitLog[`${h.id}|${d}`]; const paused = pausedAll(data, d) || !habitOn(h, d);
        return <td key={d}><button className={`hcell ${v || ''} ${paused ? 'paused' : ''}`} disabled={d > today || paused}
          aria-label={`${h.name}, ${WD_LONG[wdIdx(d)]}: ${paused ? 'pausiert' : v === 'done' ? 'erledigt' : v === 'skip' ? 'bewusst ausgelassen' : 'offen'}`}
          onClick={() => commit(dd => A.cycleHabit(dd, h.id, d), null)}>{v === 'done' ? <Icon name="check" size={14} /> : v === 'skip' ? <Icon name="minus" size={14} /> : null}</button></td>;
      })}</tr>)}</tbody>
    </table></div> : <p className="hint">Keine aktiven Gewohnheiten. Lege unten eine an oder wähle Vorschläge in den Einstellungen.</p>}
    <p className="hint">Tippen wechselt zwischen erledigt, bewusst ausgelassen und offen. Zukünftige und pausierte Tage sind gesperrt.</p>
    {pausedHabits.length > 0 && <ul className="plain">{pausedHabits.map(h => <li key={h.id}>„{h.name}“ pausiert {h.inactiveFrom > today ? `ab ${fmtDM(h.inactiveFrom)}` : `seit ${fmtDM(h.inactiveFrom)}`}. <button className="link inline" onClick={() => commit(d => ({ ...d, habits: d.habits.map(x => (x.id === h.id ? { ...x, inactiveFrom: undefined } : x)) }), `„${h.name}“ wieder aktiv`)}>Wieder aktivieren</button></li>)}</ul>}
    <div className="inline-add">
      <input className="input" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(); }} placeholder="Neue Gewohnheit, z. B. Abends dehnen" aria-label="Neue Gewohnheit" />
      <button className="btn" onClick={add}>Anlegen</button>
    </div>
    {err && <p className="err" role="alert">{err}</p>}
  </div>;
}
function StatusLegend() {
  return <details className="fold small legend-fold"><summary>Was bedeuten die Status?</summary>
    <ul className="legend-list">{Object.entries(STATUS_INFO).map(([k, [l, ic, cls]]) => <li key={k}><span className={`tag ${cls ? `tag-${cls}` : ''}`}><Icon name={ic} size={12} />{l}</span><span>{{
      geplant: 'Steht noch an.', erledigt: 'Abgeschlossen, auch wenn nachträglich erfasst.', ausgelassen: 'Von dir bewusst nicht gemacht. Zählt nicht in die Quote.',
      verpasst: 'Tagesgebunden oder wöchentlich und nicht passiert. Wird nicht nachgeholt, zählt als nicht erledigt.', pausiert: 'Durch Urlaub, Auszeit oder pausierte Routine ausgesetzt.',
      verschoben: 'Auf einen anderen Tag gelegt, der neue Termin steht dort.', faellig: 'Aufgabe mit Frist, noch offen. Bleibt sichtbar, bis du sie erledigst oder verwirfst.',
      nicht_erfasst: 'Optionale Erfassung ohne Eintrag. Kein Wert 0 und keine Aufgabe.' }[k]}</span></li>)}</ul>
  </details>;
}
function Week({ ctx }) {
  const { data, today, openSheet, go, cfg, ensureHorizon } = ctx;
  const [off, setOff] = useState(0);
  const earliest = data.items.reduce((m, i) => (i.date < m ? i.date : m), today);
  const minOff = Math.max(-52, -Math.ceil(daysBetween(weekStart(earliest), weekStart(today)) / 7));
  const maxOff = 8;
  const anchor = addDays(today, off * 7);
  const days = weekDays(anchor);
  useEffect(() => { if (off > 1) ensureHorizon(days[6]); }, [off]);
  const [sel, setSel] = useState(today);
  const selDay = days.includes(sel) ? sel : days[0];
  const plan = useMemo(() => buildPlan(cfg), [cfg]);
  const tw = trainingsInWeek(data, anchor);
  const goal = goalAt(data, weekStart(anchor));
  const cov = weekCoverage(data, weekStart(anchor), today);
  const ps = pauseStats(data, anchor);
  const hs = habitStats(data, anchor, today);
  const ms = missesInWeek(data, anchor);
  const dayItems = data.items.filter(i => i.date === selDay).sort(byTime);
  const dayAppts = data.appointments.filter(a => a.date === selDay && a.status !== 'offen');
  const weekPauses = (data.pauses || []).filter(p => p.from <= days[6] && p.to >= days[0]);
  const isFree = wdIdx(selDay) === plan.freeDay;
  const go2 = n => { setOff(n); const d = addDays(today, n * 7); setSel(n === 0 ? today : weekDays(d)[0]); };
  return <div className="screen">
    <header className="page-head">
      <h1 className="h1">Woche</h1>
      <div className="week-nav">
        <button className="icon-btn" aria-label="Vorherige Woche" disabled={off <= minOff} onClick={() => go2(off - 1)}><Icon name="left" /></button>
        <div className="week-title"><b>KW {isoWeek(anchor)}</b><span>{fmtDM(days[0])} bis {fmtDM(days[6])}{off === 0 ? ', aktuell' : ''}</span></div>
        <button className="icon-btn" aria-label="Nächste Woche" disabled={off >= maxOff} onClick={() => go2(off + 1)}><Icon name="right" /></button>
      </div>
    </header>
    {off !== 0 && <button className="link" onClick={() => go2(0)}>Zur aktuellen Woche</button>}

    {weekPauses.map(p => <p key={p.id} className="callout pause-note"><Icon name="pause" size={16} /> {PAUSE_KINDS[p.kind]}: {fmtDM(p.from)} bis {fmtDM(p.to)}, {p.scope === 'alle' ? 'alle Routinen pausiert' : 'Training pausiert'}. Pausierte Einträge zählen nicht in die Ziele.</p>)}

    <div className="daystrip" role="tablist" aria-label="Tag wählen">
      {days.map(d => {
        const its = data.items.filter(i => i.date === d && i.status !== 'verschoben' && i.routine !== 'review');
        const dn = its.filter(i => i.status === 'erledigt').length;
        const due = its.some(i => effStatus(i, today) === 'faellig');
        const free = wdIdx(d) === plan.freeDay;
        return <button key={d} role="tab" aria-selected={d === selDay} className={`day ${d === selDay ? 'on' : ''} ${d === today ? 'is-today' : ''} ${free ? 'is-free' : ''}`} onClick={() => setSel(d)}>
          <span className="day-wd">{WD[wdIdx(d)]}</span><span className="day-n">{parse(d).getDate()}</span>
          <span className="day-dots" aria-hidden="true">{its.slice(0, 4).map((i, k) => { const s = effStatus(i, today); return <i key={k} className={s === 'erledigt' ? 'd-done' : s === 'faellig' ? 'd-warn' : ['ausgelassen', 'pausiert', 'verpasst', 'nicht_erfasst'].includes(s) ? 'd-skip' : ''} />; })}</span>
          <span className="sr">{dn} von {its.length} erledigt{due ? ', eine Frist ist abgelaufen' : ''}{free ? ', freier Tag' : ''}</span>
        </button>;
      })}
    </div>

    <section className="block">
      <div className="h2-row"><h2 className="h2">{fmtLong(selDay)}</h2>{isFree && <span className="tag tag-sun">Freier Tag</span>}</div>
      {isFree && <p className="hint top0">Kein Training geplant. Nutze den Tag zur Erholung oder flexibel.</p>}
      {dayItems.length || dayAppts.length ? <ul className="list">
        {dayItems.map(it => <ItemRow key={it.id} it={it} ctx={ctx} />)}
        {dayAppts.map(a => <li key={a.id} className={`row ${a.status === 'erledigt' ? 'st-erledigt' : ''}`}>
          <span className="check static"><Icon name="steth" size={16} /></span>
          <button className="row-main" onClick={() => go('gesundheit', 'termine')}><span className="row-title">{a.title}</span><span className="row-meta">{a.time && <span>{a.time} Uhr</span>}<span>{APPT_STATUS[a.status]}</span></span></button>
          <span className="row-icon"><Icon name="calendar" size={18} /></span>
        </li>)}
      </ul> : <Empty text={selDay > addDays(weekStart(today), 13) && !dayItems.length ? 'Noch keine Einträge. Zukünftige Wochen werden beim Öffnen geplant.' : 'Für diesen Tag ist nichts geplant.'} />}
      {selDay >= today && <div className="btn-row two">
        <button className="btn block-btn" onClick={() => openSheet({ kind: 'addItem', date: selDay })}><Icon name="plus" size={18} /> Eintrag planen</button>
        <button className="btn block-btn" onClick={() => openSheet({ kind: 'pause', from: selDay })}><Icon name="pause" size={18} /> Pause eintragen</button>
      </div>}
      <button className="link" onClick={() => go('routinen')}><Icon name="repeat" size={16} />&nbsp;Routinen verwalten</button>
    </section>

    <section className="panel goals">
      <div className="goal"><div className="goal-head"><span>Training</span><b>{goal ? `${tw} von ${goal}` : `${tw}, kein Ziel`}</b></div><Progress value={tw} max={goal || 1} label="Trainingseinheiten" /></div>
      <div className="goal"><div className="goal-head"><span>Bewegungspausen</span><b>{ps.eligible ? `${ps.done} von ${ps.eligible}` : 'keine geplant'}</b></div><Progress value={ps.done} max={ps.eligible} label="Bewegungspausen" /></div>
      <div className="goal"><div className="goal-head"><span>Gewohnheiten</span><b>{hs.eligible ? `${hs.done} von ${hs.eligible}` : 'noch keine Tage'}</b></div><Progress value={hs.done} max={hs.eligible} label="Gewohnheiten" /></div>
      {cov === 'keine' && <p className="callout gap top0">Für diese Woche liegen keine Plan-Daten vor. Das ist eine Datenlücke, keine fehlende Leistung.</p>}
      {off < 0 && goal !== goalAt(data, weekStart(today)) && cov !== 'keine' && <p className="hint top0">Wochenziel damals: {goal}. Aktuelles Ziel: {goalAt(data, weekStart(today))}.</p>}
      {ms.total > 0 && <p className="hint top0">Nicht stattgefunden: {[ms.training && `${ms.training} Training`, ms.bewegung && `${ms.bewegung} Bewegung`, ms.sonst && `${ms.sonst} Sonstiges`].filter(Boolean).join(', ')}. Wird nicht nachgeholt.</p>}
      <details className="b-more-info"><summary>Mehr dazu</summary><p className="hint top0">Verpasst zählt als nicht erledigt. Bewusst ausgelassene und pausierte Einträge fallen aus dem Nenner.</p></details>
      <StatusLegend />
    </section>

    <section className="block">
      <h2 className="h2">Gewohnheiten</h2>
      <HabitGrid ctx={ctx} days={days} />
    </section>
  </div>;
}

/* ---------------- Erfassen ---------------- */
function Recent({ title, rows, onDelete, empty }) {
  return <section className="block">
    <h2 className="h2">{title}</h2>
    {rows.length ? <ul className="list">{rows.map(r => <li key={r.id} className="row compact">
      <div className="row-main static"><span className="row-title">{r.main}</span><span className="row-meta">{r.sub.map((s, i) => <span key={i}>{s}</span>)}</span></div>
      {r.demo && <span className="tag tag-muted">Demo</span>}
      <button className="icon-btn sm" aria-label={`${r.main} löschen`} onClick={() => onDelete(r.id)}><Icon name="trash" size={16} /></button>
    </li>)}</ul> : <Empty text={empty} />}
  </section>;
}
function WeightForm({ ctx }) {
  const { data, today, commit } = ctx;
  const [date, setDate] = useState(today); const [time, setTime] = useState(''); const [kg, setKg] = useState(''); const [note, setNote] = useState(''); const [err, setErr] = useState('');
  const save = () => {
    const v = parseNum(kg);
    if (!(v >= 30 && v <= 300)) return setErr('Bitte ein Gewicht zwischen 30 und 300 kg eingeben.');
    if (!date || date > today) return setErr('Bitte ein Datum bis heute wählen.');
    setErr('');
    commit(d => ({ ...d, weights: [...d.weights, { id: uid('wg'), date, time, kg: Math.round(v * 10) / 10, note: note.trim(), source: 'manuell' }] }), `Gewicht gespeichert: ${fmtNum(v, 1)} kg`);
    setKg(''); setNote('');
  };
  const recent = [...data.weights].sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || ''))).slice(0, 6);
  return <>
    <div className="panel form">
      <Field label="Gewicht in kg"><input className="input big" inputMode="decimal" value={kg} onChange={e => setKg(e.target.value)} placeholder="z. B. 84,6" /></Field>
      <div className="grid2">
        <Field label="Datum"><input className="input" type="date" max={today} value={date} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="Uhrzeit (optional)"><input className="input" type="time" value={time} onChange={e => setTime(e.target.value)} /></Field>
      </div>
      <Field label="Notiz (optional)"><input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="z. B. nach dem Aufstehen" /></Field>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary wide" onClick={save}>Gewicht speichern</button>
    </div>
    <Recent title="Zuletzt erfasst" empty="Noch keine Messung erfasst." onDelete={id => commit(d => ({ ...d, weights: d.weights.filter(w => w.id !== id) }), 'Messung gelöscht')}
      rows={recent.map(w => ({ id: w.id, main: `${fmtNum(w.kg, 1)} kg`, sub: [dayLabel(w.date, today), w.time ? `${w.time} Uhr` : null, w.note || null].filter(Boolean), demo: w.source === 'demo' }))} />
  </>;
}
function StepsForm({ ctx }) {
  const { data, today, commit } = ctx;
  const [date, setDate] = useState(today); const [count, setCount] = useState(''); const [err, setErr] = useState('');
  const existing = data.steps.find(s => s.date === date);
  const save = () => {
    const v = parseNum(count.replace(/\./g, ''));
    if (!(Number.isInteger(v) && v >= 0 && v <= 100000)) return setErr('Bitte eine ganze Zahl zwischen 0 und 100.000 eingeben.');
    if (!date || date > today) return setErr('Bitte ein Datum bis heute wählen.');
    setErr('');
    commit(d => ({ ...d, steps: [...d.steps.filter(s => s.date !== date), { id: uid('st'), date, count: v, source: 'manuell' }] }), existing ? 'Schrittzahl ersetzt' : 'Schrittzahl gespeichert');
    setCount('');
  };
  const recent = [...data.steps].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  return <>
    <div className="panel form">
      <Field label="Schritte"><input className="input big" inputMode="numeric" value={count} onChange={e => setCount(e.target.value)} placeholder="z. B. 7.420" /></Field>
      <Field label="Datum" hint={existing ? `Für diesen Tag sind bereits ${fmtNum(existing.count)} Schritte eingetragen. Speichern ersetzt den Wert, statt zu addieren.` : 'Ein Wert pro Tag, manuell eingetragen.'}>
        <input className="input" type="date" max={today} value={date} onChange={e => setDate(e.target.value)} />
      </Field>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary wide" onClick={save}>{existing ? 'Schrittzahl ersetzen' : 'Schrittzahl speichern'}</button>
      <p className="hint">Automatischer Abgleich mit Health Connect oder Samsung Health ist noch nicht verfügbar.</p>
    </div>
    <Recent title="Zuletzt erfasst" empty="Noch keine Schritte erfasst." onDelete={id => commit(d => ({ ...d, steps: d.steps.filter(s => s.id !== id) }), 'Eintrag gelöscht')}
      rows={recent.map(s => ({ id: s.id, main: `${fmtNum(s.count)} Schritte`, sub: [dayLabel(s.date, today)], demo: s.source === 'demo' }))} />
  </>;
}
function TrainingForm({ ctx }) {
  const { data, today, commit } = ctx;
  const [kind, setKind] = useState(() => (data.workouts.filter(w => w.source === 'manuell').slice(-1)[0] || {}).kind || 'Krafttraining'); const [date, setDate] = useState(today); const [dur, setDur] = useState('45');
  const [intensity, setIntensity] = useState(1); const [counts, setCounts] = useState(true); const [note, setNote] = useState(''); const [link, setLink] = useState(true); const [err, setErr] = useState('');
  const openT = i => i.type === 'training' && ['geplant', 'verpasst'].includes(i.status) && !i.replacedBy;
  const planned = data.items.filter(i => openT(i) && i.date === date).sort(byTime)[0] || data.items.filter(i => openT(i) && i.date >= weekStart(date) && i.date <= addDays(weekStart(date), 6)).sort(byTime)[0];
  const save = () => {
    const v = parseNum(dur);
    if (!(Number.isInteger(v) && v >= 1 && v <= 600)) return setErr('Bitte eine Dauer zwischen 1 und 600 Minuten eingeben.');
    if (!date || date > today) return setErr('Bitte ein Datum bis heute wählen.');
    setErr('');
    commit(d => A.logWorkout(d, { date, kind, duration: v, intensity, counts, note: note.trim() }, planned && link ? planned.id : null), planned && link ? `${kind} gespeichert, geplante Einheit abgehakt` : `${kind} gespeichert`);
    setNote('');
  };
  const recent = [...data.workouts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  return <>
    <div className="panel form">
      <Field label="Art"><div className="chips">{WORKOUT_KINDS.map(k => <button key={k} className={`chip ${kind === k ? 'on' : ''}`} aria-pressed={kind === k} onClick={() => setKind(k)}>{k}</button>)}</div></Field>
      <div className="grid2">
        <Field label="Datum"><input className="input" type="date" max={today} value={date} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="Dauer in Minuten"><input className="input" inputMode="numeric" value={dur} onChange={e => setDur(e.target.value)} /></Field>
      </div>
      <Field label="Wie anstrengend war es?"><div className="chips">{INTENSITY.map((l, i) => <button key={l} className={`chip ${intensity === i ? 'on' : ''}`} aria-pressed={intensity === i} onClick={() => setIntensity(i)}>{l}</button>)}</div></Field>
      <label className="toggle"><input type="checkbox" checked={counts} onChange={e => setCounts(e.target.checked)} /><span>Zählt als Trainingseinheit für das Wochenziel</span></label>
      {planned && <label className="toggle"><input type="checkbox" checked={link} onChange={e => setLink(e.target.checked)} /><span>{planned.status === 'verpasst' ? 'Verpasste' : 'Geplante'} Einheit „{planned.title}“ am {planned.date === today ? 'heutigen Tag' : fmtDM(planned.date)} als erledigt {planned.status === 'verpasst' ? 'nacherfassen' : 'abhaken'}</span></label>}
      <Field label="Notiz (optional)"><input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="z. B. Beine und Rücken" /></Field>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary wide" onClick={save}>Training speichern</button>
    </div>
    <Recent title="Zuletzt erfasst" empty="Noch kein Training erfasst." onDelete={id => commit(d => {
      const w = d.workouts.find(x => x.id === id);
      const next = { ...d, workouts: d.workouts.filter(x => x.id !== id) };
      return w && w.itemId ? A.setItem(next, w.itemId, { status: 'geplant' }) : next;
    }, 'Training gelöscht')}
      rows={recent.map(w => ({ id: w.id, main: `${w.kind}, ${w.duration} Min.`, sub: [dayLabel(w.date, today), w.intensity != null ? INTENSITY[w.intensity] : null, w.counts ? 'zählt fürs Ziel' : 'zählt nicht'].filter(Boolean), demo: w.source === 'demo' }))} />
  </>;
}
function MealForm({ ctx }) {
  const { data, today, nowMin, commit, cfg } = ctx;
  const h = Math.floor(nowMin / 60);
  const showIdeas = normalizeConfig(cfg).goals.some(g => ['ernaehrung', 'werte', 'abnehmen'].includes(g));
  const [date, setDate] = useState(today);
  const [meal, setMeal] = useState(h < 11 ? 'Frühstück' : h < 15 ? 'Mittagessen' : h < 21 ? 'Abendessen' : 'Snack');
  const [q, setQ] = useState(''); const [foodId, setFoodId] = useState(null); const [qty, setQty] = useState('100'); const [err, setErr] = useState('');
  const [nf, setNf] = useState(null);
  const food = data.foods.find(f => f.id === foodId);
  const qn = parseNum(qty);
  const preview = food && qn > 0 ? snap(food, qn) : null;
  const list = data.foods.filter(f => f.name.toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) => (b.fav - a.fav) || a.name.localeCompare(b.name, 'de')).slice(0, 8);
  const add = () => {
    if (!food) return setErr('Bitte ein Lebensmittel wählen.');
    if (!(qn > 0 && qn <= 3000)) return setErr('Bitte eine Menge zwischen 1 und 3.000 g eingeben.');
    if (!date || date > today) return setErr('Bitte ein Datum bis heute wählen.');
    setErr('');
    commit(d => A.addMealItems(d, date, meal, [[food.id, qn]]), `${food.name} hinzugefügt`);
    setFoodId(null); setQty('100'); setQ('');
  };
  const favKcal = fm => fm.items.reduce((s, [fid, g]) => { const f = data.foods.find(x => x.id === fid); return s + (f ? snap(f, g).kcal : 0); }, 0);
  const nut = dayNutrition(data, date);
  const entries = data.meals.filter(m => m.date === date);
  const saveNew = () => {
    const vals = ['kcal', 'p', 'c', 'f'].map(k => parseNum(nf[k]));
    if (!nf.name.trim()) return setNf({ ...nf, err: 'Bitte einen Namen eingeben.' });
    if (vals.some(v => !(v >= 0)) || vals[0] > 950) return setNf({ ...nf, err: 'Bitte alle Nährwerte je 100 g als Zahl eingeben (kcal höchstens 950).' });
    const id = uid('food');
    commit(d => ({ ...d, foods: [...d.foods, { id, name: nf.name.trim(), kcal: vals[0], p: vals[1], c: vals[2], f: vals[3], fav: false, custom: true }] }), `Lebensmittel angelegt: ${nf.name.trim()}`);
    setFoodId(id); setNf(null);
  };
  return <>
    <div className="panel form">
      <div className="grid2">
        <Field label="Datum"><input className="input" type="date" max={today} value={date} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="Mahlzeit"><select className="input" value={meal} onChange={e => setMeal(e.target.value)}>{MEALS.map(m => <option key={m}>{m}</option>)}</select></Field>
      </div>
      <Field label="Favoriten mit einem Tipp hinzufügen">
        <div className="fav-list">{data.favMeals.map(fm => <button key={fm.id} className="fav" onClick={() => commit(d => A.addMealItems(d, date, meal, fm.items.filter(([fid]) => d.foods.some(f => f.id === fid))), `${fm.name} als ${meal} eingetragen`)}>
          <Icon name="star" size={16} /><span><b>{fm.name}</b><small>ca. {fmtNum(favKcal(fm))} kcal, {fm.items.length} Zutaten</small></span><Icon name="plus" size={18} />
        </button>)}</div>
      </Field>
      {showIdeas && <div className="ideas"><span className="field-label">Ideen passend zu deinen Zielen</span>
        <div className="chips">{IDEA_FOODS.map(fid => { const f = data.foods.find(x => x.id === fid); return f ? <button key={fid} className={`chip sm ${foodId === fid ? 'on' : ''}`} aria-pressed={foodId === fid} onClick={() => { setFoodId(fid); setQ(''); }}>{f.name}</button> : null; })}</div>
        <p className="hint top0">Beispiele für ballaststoffreiche und pflanzliche Lebensmittel. Keine Präparate, keine Kaufempfehlung.</p></div>}
      <Field label="Oder einzelnes Lebensmittel"><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Suchen, z. B. Reis" /></Field>
      <ul className="food-list">{list.map(f => <li key={f.id} className={foodId === f.id ? 'on' : ''}>
        <button className="food-pick" aria-pressed={foodId === f.id} onClick={() => setFoodId(f.id)}><span>{f.name}{f.custom && <em> eigenes</em>}</span><small>{fmtNum(f.kcal)} kcal je 100 g</small></button>
        <button className={`icon-btn sm star ${f.fav ? 'on' : ''}`} aria-pressed={f.fav} aria-label={f.fav ? `${f.name} aus Favoriten entfernen` : `${f.name} als Favorit markieren`}
          onClick={() => commit(d => ({ ...d, foods: d.foods.map(x => x.id === f.id ? { ...x, fav: !x.fav } : x) }), null)}><Icon name="star" size={16} /></button>
      </li>)}{!list.length && <li className="muted pad">Kein Treffer. Lege das Lebensmittel unten selbst an.</li>}</ul>
      {food && <div className="pick-detail">
        <Field label={`Menge von ${food.name} in g`}><input className="input" inputMode="decimal" value={qty} onChange={e => setQty(e.target.value)} /></Field>
        {preview && <p className="macro-line"><b>{fmtNum(preview.kcal)} kcal</b><span>E {fmtNum(preview.p, 1)} g</span><span>K {fmtNum(preview.c, 1)} g</span><span>F {fmtNum(preview.f, 1)} g</span></p>}
      </div>}
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary wide" onClick={add} disabled={!food}>Zu {meal} hinzufügen</button>
      {nf ? <div className="subform">
        <h3 className="h3">Eigenes Lebensmittel, Werte je 100 g</h3>
        <Field label="Name"><input className="input" value={nf.name} onChange={e => setNf({ ...nf, name: e.target.value })} /></Field>
        <div className="grid4">{[['kcal', 'kcal'], ['p', 'Eiweiß g'], ['c', 'Kohlenh. g'], ['f', 'Fett g']].map(([k, l]) => <Field key={k} label={l}><input className="input" inputMode="decimal" value={nf[k]} onChange={e => setNf({ ...nf, [k]: e.target.value })} /></Field>)}</div>
        {nf.err && <p className="err" role="alert">{nf.err}</p>}
        <div className="btn-row"><button className="btn primary" onClick={saveNew}>Lebensmittel anlegen</button><button className="btn ghost" onClick={() => setNf(null)}>Abbrechen</button></div>
      </div> : <button className="link" onClick={() => setNf({ name: q, kcal: '', p: '', c: '', f: '' })}>Eigenes Lebensmittel anlegen</button>}
      <p className="hint">Die Nährwerte der Demo-Lebensmittel sind grobe Beispielwerte und nicht geprüft. Gespeicherte Einträge behalten ihre Werte, auch wenn du ein Lebensmittel später änderst.</p>
    </div>

    <section className="block">
      <div className="h2-row"><h2 className="h2">{dayLabel(date, today)} gegessen</h2>{nut && !nut.complete && <span className="tag tag-warn">Unvollständig</span>}</div>
      {nut ? <div className="panel">
        <p className="macro-line big"><b>{fmtNum(nut.kcal)} kcal</b><span>E {fmtNum(nut.p)} g</span><span>K {fmtNum(nut.c)} g</span><span>F {fmtNum(nut.f)} g</span></p>
        {!nut.complete && <p className="hint">Noch nicht erfasst: {nut.missing.join(', ')}. Die Summe zeigt nur die eingetragenen Mahlzeiten.</p>}
        <p className="hint">Kein Kalorienziel festgelegt. Ein Ziel ist optional.</p>
        {MEALS.filter(m => entries.some(e => e.meal === m)).map(m => {
          const es = entries.filter(e => e.meal === m);
          return <div key={m} className="meal-group">
            <div className="h2-row"><h3 className="h3">{m}<span className="muted"> {fmtNum(es.reduce((s, e) => s + e.snap.kcal, 0))} kcal</span></h3>
              <button className="link" onClick={() => commit(d => {
                const items = es.map(e => [d.foods.find(f => f.name === e.name)?.id, e.qty]).filter(([fid]) => fid);
                return { ...d, favMeals: [...d.favMeals, { id: uid('fm'), name: `${m} vom ${fmtDM(date)}`, items }] };
              }, 'Als Favorit gespeichert')}>Als Favorit speichern</button></div>
            <ul className="list">{es.map(e => <li key={e.id} className="row compact"><div className="row-main static"><span className="row-title">{e.name}</span><span className="row-meta"><span>{fmtNum(e.qty)} g</span><span>{fmtNum(e.snap.kcal)} kcal</span></span></div>
              <button className="icon-btn sm" aria-label={`${e.name} entfernen`} onClick={() => commit(d => ({ ...d, meals: d.meals.filter(x => x.id !== e.id) }), 'Eintrag entfernt')}><Icon name="trash" size={16} /></button></li>)}</ul>
          </div>;
        })}
      </div> : <Empty text="Für diesen Tag ist noch nichts eingetragen." />}
    </section>
  </>;
}
function Capture({ ctx, seg, setSeg }) {
  return <div className="screen">
    <header className="page-head"><h1 className="h1">Erfassen</h1></header>
    <p className="demo-note"><Icon name="info" size={16} /> {BETA.captureNote}</p>
    <Segmented label="Was möchtest du erfassen?" value={seg} onChange={setSeg} options={[['gewicht', 'Gewicht'], ['schritte', 'Schritte'], ['training', 'Training'], ['mahlzeit', 'Mahlzeit']].filter(([k]) => BETA.capture.includes(k))} />
    {BETA.capture.includes('gewicht') && seg === 'gewicht' && <><WeightForm ctx={ctx} /><ScaleImport ctx={ctx} /></>}
    {seg === 'schritte' && <StepsForm ctx={ctx} />}
    {seg === 'training' && <><QuickRepeat ctx={ctx} /><TrainingForm ctx={ctx} /></>}
    {BETA.capture.includes('mahlzeit') && seg === 'mahlzeit' && <MealForm ctx={ctx} />}
  </div>;
}

/* ---------------- Entwicklung ---------------- */
function AcceptedMeasures({ ctx }) {
  const { data, today, cfg, commit } = ctx;
  const accepted = computeRecs(data, cfg, today).filter(r => r.status === 'angenommen');
  if (!accepted.length) return <Empty text={BETA.recs ? "Noch keine Empfehlung angenommen. Vorschläge findest du unter Gesundheit, Für dich." : "Noch keine Maßnahme angenommen."} />;
  const days = weekDays(today);
  return <ul className="list">{accepted.map(r => {
    const s = (data.recState || {})[r.id] || {};
    let prog = '';
    if (s.takeKind === 'routine') { const its = data.items.filter(i => i.routine === s.target && inWeek(i.date, today) && !['verschoben', 'pausiert', 'ausgelassen'].includes(i.status)); prog = `${its.filter(i => i.status === 'erledigt').length} von ${its.length} diese Woche`; }
    if (s.takeKind === 'habit') { const n = days.filter(d => d <= today && data.habitLog[`${s.target}|${d}`] === 'done').length; prog = `${n} Tage diese Woche abgehakt`; }
    if (s.takeKind === 'task') { const it = data.items.find(i => i.id === s.target); prog = it ? (it.status === 'erledigt' ? 'Aufgabe erledigt' : 'Aufgabe offen') : 'Aufgabe nicht mehr vorhanden'; }
    return <li key={r.id} className="row compact">
      <div className="row-main static"><span className="row-title">{r.title}</span><span className="row-meta"><span>{prog}</span>{s.reviewDate && <span>Überprüfen am {fmtDM(s.reviewDate)}</span>}</span></div>
      <button className="btn small ghost" onClick={() => commit(d => A.recState(d, r.id, { status: 'abgeschlossen', decidedAt: today }), 'Maßnahme abgeschlossen')}>Abschließen</button>
    </li>;
  })}</ul>;
}
function Development({ ctx }) {
  const { data, today, cfg } = ctx;
  const goal = goalAt(data, weekStart(today));
  const [range, setRange] = useState(30);
  const from = addDays(today, -(range - 1));
  const ws = [...data.weights].filter(w => w.date >= from && w.date <= today).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  const pts = ws.map(w => ({ id: w.id, date: w.date, value: w.kg }));
  const mDays = [...new Set(ws.map(w => w.date))];
  const trend = mDays.map(d => ({ date: d, value: avg(data.weights.filter(w => w.date > addDays(d, -7) && w.date <= d).map(w => w.kg)) }));
  const delta = pts.length > 1 ? pts[pts.length - 1].value - pts[0].value : null;
  const stepDays = Math.min(range, 30);
  const stepData = Array.from({ length: stepDays }, (_, i) => { const d = addDays(today, -(stepDays - 1 - i)); const s = data.steps.find(x => x.date === d); return { key: d, label: stepDays <= 7 ? WD[wdIdx(d)] : fmtDM(d), value: s ? s.count : null }; });
  const stepVals = stepData.filter(d => d.value != null).map(d => d.value);
  const weeks = trainingSeries(data, weekStart(today), 8, today).map(x => (x.goal && x.value != null && x.value >= x.goal ? { ...x, faint: false } : x));
  const kcal = Array.from({ length: 7 }, (_, i) => { const d = addDays(today, -6 + i); const n = dayNutrition(data, d); return { key: d, label: WD[wdIdx(d)], value: n ? n.kcal : null, faint: n && !n.complete }; });
  const tw = trainingsInWeek(data, today), ps = pauseStats(data, today), hs = habitStats(data, today, today), ms = missesInWeek(data, today);
  const lastWeek = addDays(today, -7);
  const twPrev = trainingsInWeek(data, lastWeek), psPrev = pauseStats(data, lastWeek);
  const suggestions = [];
  if (!goal) suggestions.push('Kein Trainingsziel gesetzt. Wenn du magst, plane in den Einstellungen eine Einheit pro Woche ein.');
  else if (tw < goal) suggestions.push(`Die ${goal} Trainingstermine der nächsten Woche bewusst freihalten oder einen davon auf einen ruhigeren Tag legen.`);
  else suggestions.push(`Den Rhythmus mit ${goal} ${goal === 1 ? 'Einheit' : 'Einheiten'} beibehalten.`);
  if (ps.eligible && ps.done / ps.eligible < 0.6) suggestions.push('Die Bewegungspause auf ein Zeitfenster legen, das an den meisten Tagen frei ist. Das geht unter Routinen verwalten.');
  else suggestions.push('Bewegungspausen laufen gut. Optional eine zweite kurze Pause am Nachmittag testen.');
  return <div className="screen">
    <header className="page-head"><h1 className="h1">Entwicklung</h1></header>
    <ReviewHistory ctx={ctx} />

    <section className="block">
      <h2 className="h2">Kurzüberblick dieser Woche</h2>
      <div className="panel review">
        <h3 className="h3">Was geklappt hat</h3>
        <p>{goal ? `${tw} von ${goal}` : tw} Trainingseinheiten (Vorwoche: {twPrev}). {ps.done} von {ps.eligible} Bewegungspausen (Vorwoche: {psPrev.done} von {psPrev.eligible}). {hs.done} Gewohnheiten erledigt.</p>
        <h3 className="h3">Was nicht stattgefunden hat</h3>
        <p>{ms.total ? `${ms.total} ${ms.total === 1 ? 'Eintrag' : 'Einträge'} (${[ms.training && `${ms.training} Training`, ms.bewegung && `${ms.bewegung} Bewegung`, ms.sonst && `${ms.sonst} Sonstiges`].filter(Boolean).join(', ')}). Das wird nicht nachgeholt. Wenn sich etwas wiederholt, lohnt sich ein anderer Zeitpunkt.` : 'Nichts verpasst bisher.'} {ps.skipped ? `${ps.skipped} bewusst ausgelassen.` : ''}</p>
        <h3 className="h3">Angenommene Maßnahmen</h3>
        <AcceptedMeasures ctx={ctx} />
        <details className="b-more-info"><summary>Mehr dazu</summary><p className="hint">Zur Reflexion: Was hat geholfen, was war schwierig? HealthOS behauptet keinen Zusammenhang zwischen einzelnen Maßnahmen und einzelnen Messwerten.</p></details>
        <h3 className="h3">Vorschläge für nächste Woche</h3>
        <ul className="plain">{suggestions.map(s => <li key={s}>{s}</li>)}</ul>
        <p className="hint">Der Rückblick folgt festen Regeln aus deinen Einträgen. Er ist keine medizinische Bewertung.</p>
      </div>
    </section>

    <section className="block">
      <h2 className="h2">Ziele</h2>
      <div className="panel goals">
        <div className="goal"><div className="goal-head"><span>{goal ? `${goal} Trainingseinheiten pro Woche` : 'Training, kein Wochenziel'}</span><b>{goal ? `${tw} von ${goal}` : tw}</b></div><Progress value={tw} max={goal || 1} label="Trainingsziel" /></div>
        <div className="goal"><div className="goal-head"><span>Bewegungspause an Werktagen</span><b>{ps.done} von {ps.eligible}</b></div><Progress value={ps.done} max={ps.eligible} label="Bewegungspausen" /></div>
        <div className="goal"><div className="goal-head"><span>Gewohnheiten</span><b>{hs.eligible ? `${hs.done} von ${hs.eligible}` : 'noch keine Tage'}</b></div><Progress value={hs.done} max={hs.eligible} label="Gewohnheiten" /></div>
        {BETA.weight && <p className="hint">{BETA.capture.includes('mahlzeit') ? "Gewichts- und Kalorienziel sind nicht festgelegt. Beides ist optional, HealthOS legt keine Zielwerte automatisch fest." : "Ein Gewichtsziel ist nicht festgelegt. HealthOS legt keine Zielwerte automatisch fest."}</p>}
      </div>
    </section>

    <h2 className="h2 block">Verläufe</h2>
    <Segmented label="Zeitraum" value={String(range)} onChange={v => setRange(Number(v))} options={[['7', '7 Tage'], ['30', '30 Tage'], ['90', '90 Tage'], ['365', '1 Jahr']]} />
    {BETA.weight && <section className="block tight">
      <div className="h2-row"><h3 className="h3 top0">Gewicht</h3><span className="muted small">{pts.length} Messungen</span></div>
      <div className="panel">
        {pts.length ? <>
          <p className="kpi">{delta != null ? <><b>{signed(delta)} kg</b><span>seit {fmtShort(pts[0].date)}, dem ersten Wert im Zeitraum</span></> : <span>Nur eine Messung im Zeitraum, noch keine Veränderung berechenbar.</span>}</p>
          <LineChart points={pts} from={from} to={today} trend={trend} label={`Gewichtsverlauf mit ${pts.length} Messungen`} maxGap={range <= 30 ? 6 : 10} />
          <p className="legend"><span className="lg-dot" /> Messung <span className="lg-dash" /> Ø der letzten 7 Tage <span className="lg-gap" /> Lücke bedeutet: keine Messung</p>
          <details className="fold small"><summary>Werte als Tabelle</summary>
            <div className="table-scroll"><table className="tbl"><thead><tr><th>Datum</th><th>Uhrzeit</th><th>kg</th></tr></thead><tbody>{[...ws].reverse().map(w => <tr key={w.id}><td>{fmtDM(w.date)}</td><td>{w.time || 'nicht erfasst'}</td><td>{fmtNum(w.kg, 1)}</td></tr>)}</tbody></table></div>
          </details>
        </> : <Empty text="In diesem Zeitraum gibt es keine Messung. Das ist kein Fehler, Gewicht ist optional." action={<button className="btn small" onClick={() => ctx.go('erfassen', 'gewicht')}>Ersten Wert erfassen</button>} />}
      </div>
    </section>}
    {BETA.weight && <WeightTrendCard ctx={ctx} />}
    <section className="block">
      <h3 className="h3 top0">Trainingseinheiten pro Woche</h3>
      <div className="panel"><BarChart data={weeks} goal={goal || null} goalLabel="Ziel aktuell" label="Trainingseinheiten der letzten acht Wochen" table="Einheiten" extraCol={['Ziel damals', d => (d.goal == null ? '–' : d.goal)]} coverageCol />
        <p className="legend"><span className="lg-bar" /> vollständig <span className="lg-bar faint" /> unvollständig <span className="lg-missing" /> Datenlücke</p>
        <CoverageNote text={gapText(weeks)} />
        <p className="hint">Gezählt werden abgeschlossene Einheiten, die für das Wochenziel zählen.</p></div>
    </section>
    <section className="block">
      <div className="h2-row"><h3 className="h3 top0">Schritte, letzte {stepDays} Tage</h3><span className="muted small">{stepVals.length} von {stepDays} Tagen erfasst</span></div>
      <div className="panel">
        {stepVals.length ? <p className="kpi"><b>{fmtNum(avg(stepVals))}</b><span>Ø an Tagen mit Eintrag</span></p> : null}
        <BarChart data={stepData} label="Schritte pro Tag" fmt={v => v >= 1000 ? `${fmtNum(v / 1000)}k` : fmtNum(v)} table="Schritte" />
        <p className="legend"><span className="lg-missing" /> nicht erfasst, wird nicht als 0 gezählt</p>
      </div>
    </section>
    {BETA.capture.includes('mahlzeit') && <section className="block">
      <h3 className="h3 top0">Kalorien, letzte 7 Tage</h3>
      <div className="panel"><BarChart data={kcal} label="Kalorien pro Tag" table="kcal" />
        <p className="legend"><span className="lg-bar" /> vollständig <span className="lg-bar faint" /> unvollständig <span className="lg-missing" /> nicht erfasst</p></div>
    </section>}
  </div>;
}

/* ---------------- Gesundheit ---------------- */
function EvidenceBadge({ level }) {
  const e = EVIDENCE_LEVELS[level] || EVIDENCE_LEVELS.unklar;
  return <span className={`tag ev-${level}`} title={e[1]}><Icon name="book" size={12} />{e[0]}</span>;
}
function RecCard({ rec, ctx, compact }) {
  const { commit, today, cfg, openSheet } = ctx;
  const decided = rec.status !== 'vorgeschlagen';
  return <article className={`rec ${compact ? 'compact' : ''}`}>
    <div className="rec-top"><EvidenceBadge level={rec.evidence_strength} />{rec.lab_marker_id && <span className="tag tag-note">Demo-Laborwert</span>}{decided && <span className="tag tag-muted">{REC_STATUS[rec.status]}</span>}</div>
    <h3 className="rec-title">{rec.title}</h3>
    <p className="rec-trigger">Anlass: {rec.trigger}</p>
    {!compact && <p className="rec-why">{rec.why}</p>}
    <p className="rec-action"><b>Vorschlag:</b> {rec.action}</p>
    {rec.lab_marker_id && <p className="rec-safety"><Icon name="info" size={14} /> {rec.safety_notes}</p>}
    <div className="btn-row">
      {!decided && <button className="btn small primary" onClick={() => commit(d => A.acceptRec(d, rec, cfg, today), rec.take.kind === 'routine' ? 'Als Routine übernommen' : rec.take.kind === 'habit' ? 'Als Gewohnheit übernommen' : 'Aufgabe angelegt')}>{rec.take.label}</button>}
      <button className="btn small" onClick={() => openSheet({ kind: 'rec', id: rec.id })}>Begründung und Quellen</button>
      {!decided && <button className="btn small ghost" onClick={() => commit(d => A.recState(d, rec.id, { remindAfter: addDays(today, 3) }), 'Erinnerung in 3 Tagen')}>Später</button>}
      {!decided && <button className="btn small ghost" onClick={() => commit(d => A.recState(d, rec.id, { status: 'abgelehnt', decidedAt: today }), 'Empfehlung abgelehnt, sie erscheint nicht wieder')}>Ablehnen</button>}
    </div>
  </article>;
}
function RecSheet({ id, ctx, close }) {
  const { data, cfg, today, commit } = ctx;
  const rec = computeRecs(data, cfg, today).find(r => r.id === id);
  if (!rec) return <Sheet title="Empfehlung" close={close}><p>Diese Empfehlung trifft gerade nicht zu, zum Beispiel weil sich Ziele oder Werte geändert haben.</p></Sheet>;
  const decided = rec.status !== 'vorgeschlagen';
  return <Sheet title={rec.title} close={close}>
    <div className="rec-detail">
      <div className="rec-top"><EvidenceBadge level={rec.evidence_strength} /><span className="tag tag-muted">{REC_STATUS[rec.status]}</span></div>
      <dl>
        <dt>Anlass</dt><dd>{rec.trigger}</dd>
        <dt>Warum</dt><dd>{rec.why}</dd>
        <dt>Vorschlag</dt><dd>{rec.action}</dd>
        <dt>Häufigkeit</dt><dd>{rec.frequency}</dd>
        <dt>Sicherheit</dt><dd>{rec.safety_notes}</dd>
        <dt>Wann nicht oder nur nach Rücksprache</dt><dd>{rec.contraindications}</dd>
        <dt>Evidenz</dt><dd>{EVIDENCE_LEVELS[rec.evidence_strength][0]}: {EVIDENCE_LEVELS[rec.evidence_strength][1]} Die Einordnung stammt aus dem HealthOS-Regelwerk auf Basis der Quellen, sie ist keine offizielle Evidenzstufe der Quelle.</dd>
        <dt>Quellen</dt><dd><ul className="plain">{recSourceList(rec).map(s => <li key={s.url}><a className="ext" href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a><br /><small>{s.publisher}, {s.date}. {s.note}</small></li>)}</ul></dd>
        {rec.reviewDate && <><dt>Überprüfen am</dt><dd>{fmtDM(rec.reviewDate)}{yy(rec.reviewDate)}</dd></>}
      </dl>
      <p className="hint">Regelbasierter Vorschlag ohne KI-Auswertung und ohne Diagnose. {rec.lab_marker_id ? 'Laborbezogene Entscheidungen werden nicht gespeichert.' : ''}</p>
      {!decided ? <div className="btn-row">
        <button className="btn primary" onClick={() => { commit(d => A.acceptRec(d, rec, cfg, today), 'Übernommen'); close(); }}>{rec.take.label}</button>
        <button className="btn ghost" onClick={() => { commit(d => A.recState(d, rec.id, { status: 'abgelehnt', decidedAt: today }), 'Empfehlung abgelehnt'); close(); }}>Ablehnen</button>
      </div> : rec.status === 'abgelehnt' ? <button className="btn wide" onClick={() => { commit(d => A.recState(d, rec.id, { status: 'vorgeschlagen', remindAfter: null }), 'Wieder vorgeschlagen'); close(); }}>Doch wieder vorschlagen</button> : null}
    </div>
  </Sheet>;
}
function RecsList({ ctx }) {
  const { data, cfg, today, markRecs, openSheet } = ctx;
  const rv = recView(data, cfg, today);
  const missing = rv.visible.filter(r => !r.firstShown).map(r => r.id).join(',');
  useEffect(() => { if (missing) markRecs(missing.split(','), false); }, [missing]);
  const snoozed = rv.visible.filter(r => r.remindAfter && r.remindAfter > today);
  const decided = rv.all.filter(r => r.status !== 'vorgeschlagen');
  return <>
    <p className="demo-note"><Icon name="info" size={16} /> Regelbasierte Vorschläge aus deinen Zielen, deinem Arbeitsalltag und fiktiven Demo-Laborwerten. Keine Diagnose, keine KI, keine Präparate-Empfehlungen.</p>
    {rv.ready.length ? <div className="recs">{rv.ready.map(r => <RecCard key={r.id} rec={r} ctx={ctx} />)}</div>
      : <Empty text={rv.all.length ? 'Gerade gibt es keinen neuen Vorschlag.' : 'Für deine Ziele gibt es aktuell keine hinterlegte Empfehlung.'} />}
    {rv.waiting > 0 && <p className="hint">{rv.waiting} weitere {rv.waiting === 1 ? 'Empfehlung folgt' : 'Empfehlungen folgen'} in den nächsten Wochen. HealthOS zeigt höchstens zwei neue pro Woche.</p>}
    {snoozed.length > 0 && <><h3 className="h3">Später</h3><ul className="list">{snoozed.map(r => <li key={r.id} className="row compact"><button className="row-main" onClick={() => openSheet({ kind: 'rec', id: r.id })}><span className="row-title">{r.title}</span><span className="row-meta"><span>wieder ab {fmtDM(r.remindAfter)}</span></span></button></li>)}</ul></>}
    {decided.length > 0 && <details className="fold small"><summary>Entschieden ({decided.length})</summary>
      <ul className="list">{decided.map(r => <li key={r.id} className="row compact"><button className="row-main" onClick={() => openSheet({ kind: 'rec', id: r.id })}><span className="row-title">{r.title}</span><span className="row-meta"><span>{REC_STATUS[r.status]}</span>{r.decidedAt && <span>am {fmtDM(r.decidedAt)}</span>}</span></button></li>)}</ul>
    </details>}
    <details className="fold small"><summary>Alle Quellen</summary>
      <ul className="plain sources">{Object.values(EVIDENCE).map(s => <li key={s.url}><a className="ext" href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a><br /><small>{s.publisher}, {s.date}. {s.note}</small></li>)}</ul>
    </details>
  </>;
}
function LabInfluence({ g, ctx }) {
  const { data, cfg, today } = ctx;
  const m = markerOf(g.name);
  if (!m) return <p className="hint">Für diesen Wert ist in HealthOS keine Alltagsempfehlung hinterlegt. Dafür gibt es hier keine belastbare direkte Empfehlung, bitte ärztlich einordnen lassen.</p>;
  const a = labAssessment(data.labs, m, today);
  if (a.state === 'unklar') return <p className="callout">Keine Empfehlung: {a.reason}</p>;
  if (a.state === 'unauffaellig') return <p className="hint">Der letzte Wert liegt innerhalb der Laborreferenz. Keine spezifische Empfehlung.</p>;
  const recs = computeRecs(data, cfg, today).filter(r => r.lab_marker_id === m);
  return recs.length ? <div className="recs">{recs.map(r => <RecCard key={r.id} rec={r} ctx={ctx} />)}</div> : <p className="hint">Keine passende Empfehlung.</p>;
}
function LabCard({ g, open, toggle, ctx }) {
  const l = g.latest; const pos = refPos(l);
  const from = g.same[0].date, to = l.date;
  return <li className={`lab ${open ? 'open' : ''}`}>
    <button className="lab-head" aria-expanded={open} onClick={toggle}>
      <span className="lab-name">{g.name}</span>
      <span className="lab-val"><b>{fmtVal(l.value)}</b> {l.unit}</span>
      <span className="lab-meta">{fmtShort(l.date)} {yy(l.date)}{pos && <span className={`tag ${pos === 'innerhalb' ? '' : 'tag-note'}`}>{pos} Laborreferenz</span>}{l.confirmed ? <span className="tag tag-muted">bestätigt</span> : <span className="tag tag-warn">nicht bestätigt</span>}</span>
    </button>
    {open && <div className="lab-body">
      <p className="hint">Referenz laut Befund: {refText(l)}. {pos && pos !== 'innerhalb' ? 'Das ist eine reine Einordnung gegenüber dem Labor, keine Bewertung und kein Nachweis eines Mangels. Fragen dazu klärst du ärztlich.' : ''}</p>
      {g.same.length > 1
        ? <LineChart points={g.same.map(x => ({ id: x.id, date: x.date, value: x.value }))} from={from} to={to} band={{ min: l.refMin, max: l.refMax }} maxGap={9999} label={`Verlauf ${g.name}`} digits={l.value % 1 ? 1 : 0} />
        : <p className="hint">Für einen Verlauf sind mindestens zwei Messungen in derselben Einheit nötig.</p>}
      {g.other.length > 0 && <p className="callout">{g.other.length} {g.other.length === 1 ? 'Messung liegt' : 'Messungen liegen'} in {[...new Set(g.other.map(o => o.unit))].join(', ')} vor und {g.other.length === 1 ? 'wird' : 'werden'} nicht im Verlauf verglichen, weil keine geprüfte Umrechnung hinterlegt ist.</p>}
      <div className="table-scroll"><table className="tbl"><thead><tr><th>Datum</th><th>Wert</th><th>Referenz</th></tr></thead>
        <tbody>{[...g.all].reverse().map(x => <tr key={x.id}><td>{fmtDM(x.date)}{yy(x.date)}</td><td>{fmtVal(x.value)} {x.unit}</td><td>{refText(x)}</td></tr>)}</tbody></table></div>
      <p className="hint">Quelle: {l.lab}{l.source === 'demo' ? ', fiktiver Demo-Wert' : ', manuell eingetragen'}</p>
      <h3 className="h3">Was kann ich im Alltag beeinflussen?</h3>
      <LabInfluence g={g} ctx={ctx} />
    </div>}
  </li>;
}
function Labs({ ctx }) {
  const { data, openSheet } = ctx;
  const [open, setOpen] = useState(null);
  const groups = groupLabs(data.labs);
  return <>
    <p className="demo-note"><Icon name="info" size={16} /> Fiktive Beispielwerte, nicht gespeichert. Die App stellt keine Diagnosen und bewertet keine Werte medizinisch.</p>
    {groups.length ? <ul className="labs">{groups.map(g => <LabCard key={g.name} g={g} ctx={ctx} open={open === g.name} toggle={() => setOpen(open === g.name ? null : g.name)} />)}</ul> : <Empty text="Noch keine Laborwerte." />}
    <button className="btn block-btn" onClick={() => openSheet({ kind: 'lab' })}><Icon name="plus" size={18} /> Laborwert eintragen</button>
    <div className="panel muted-panel">
      <Icon name="doc" size={20} />
      <div><b>Befunde als PDF oder Bild ablegen</b><p className="hint">Folgt mit sicherem, privatem Speicher und Anmeldung. In dieser Demo nicht verfügbar.</p></div>
    </div>
  </>;
}

function Appointments({ ctx }) {
  const { data, today, commit, openSheet } = ctx;
  const groups = [
    ['Vereinbart', data.appointments.filter(a => a.status === 'vereinbart').sort(byTime)],
    ['Noch zu vereinbaren', data.appointments.filter(a => a.status === 'offen' || a.status === 'aufgeschoben').sort(byTime)],
    ['Erledigt', data.appointments.filter(a => a.status === 'erledigt').sort(byTime).reverse()],
  ];
  return <>
    {groups.map(([title, list]) => <section key={title} className="block">
      <h2 className="h2">{title}</h2>
      {list.length ? <ul className="appts">{list.map(a => <li key={a.id} className="appt">
        <div className="appt-top">
          <span className="date-chip"><b>{parse(a.date).getDate()}</b><small>{parse(a.date).toLocaleDateString('de-DE', { month: 'short' })}</small></span>
          <div className="appt-main"><span className="row-title">{a.title}</span>
            <span className="row-meta"><span>{a.status === 'offen' ? `bis ${fmtDM(a.date)}` : dayLabel(a.date, today)}</span>{a.time && <span>{a.time} Uhr</span>}<span>{a.practice}</span></span>
            {a.note && <p className="hint">{a.note}</p>}
            {a.link && <a className="link" href={a.link} target="_blank" rel="noopener noreferrer">Buchungsseite öffnen (externer Link)</a>}
          </div>
        </div>
        <div className="chips" role="group" aria-label={`Status von ${a.title}`}>{Object.entries(APPT_STATUS).map(([k, l]) =>
          <button key={k} className={`chip sm ${a.status === k ? 'on' : ''}`} aria-pressed={a.status === k} onClick={() => commit(d => ({ ...d, appointments: d.appointments.map(x => x.id === a.id ? { ...x, status: k } : x) }), `${a.title}: ${l}`)}>{l}</button>)}</div>
        <div className="btn-row">
          <button className="btn small" onClick={() => openSheet({ kind: 'appt', id: a.id })}>Bearbeiten oder verschieben</button>
          {a.status === 'erledigt' && <button className="btn small" onClick={() => openSheet({ kind: 'appt', followOf: a.id })}>Folgetermin anlegen</button>}
        </div>
      </li>)}</ul> : <Empty text="Keine Einträge." />}
    </section>)}
    <button className="btn block-btn" onClick={() => openSheet({ kind: 'appt' })}><Icon name="plus" size={18} /> Termin oder Vorsorge anlegen</button>
    <p className="hint pad-x">Vorsorge-Intervalle legst du selbst fest, etwa nach ärztlicher Empfehlung. Die App schlägt keine medizinischen Intervalle vor und bucht keine Termine.</p>
  </>;
}
function Health({ ctx, seg, setSeg }) {
  return <div className="screen">
    <header className="page-head"><h1 className="h1">Gesundheit</h1></header>
    <Segmented label="Bereich" value={seg} onChange={setSeg} options={[['fuerdich', 'Für dich'], ['werte', 'Blutwerte'], ['termine', 'Termine']]} />
    {seg === 'fuerdich' ? <RecsList ctx={ctx} /> : seg === 'werte' ? <Labs ctx={ctx} /> : <Appointments ctx={ctx} />}
  </div>;
}

/* ---------------- Sheets ---------------- */
function ChangePreview({ diff, conflicts, empty, all }) {
  if (!diff) return null;
  const list = all ? diff.changes : diff.changes.slice(0, 6);
  return <div className="preview">
    <p className="preview-sum">{diff.added + diff.changed + diff.removed ? `Betroffen ab heute: ${diff.added} neu, ${diff.changed} geändert, ${diff.removed} entfallen.` : (empty || 'Keine zukünftigen Termine betroffen.')}</p>
    {list.length > 0 && <ul className="preview-list">{list.map((c, i) => <li key={i}><span className={`tag ${c.kind === 'entfällt' ? 'tag-muted' : c.kind === 'neu' ? '' : 'tag-note'}`}>{c.kind}</span> {WD[wdIdx(c.it.date)]}, {fmtDM(c.it.date)}: {c.it.title}{c.it.time ? `, ${c.kind === 'geändert' && c.old.time !== c.it.time ? `${c.old.time} → ` : ''}${c.it.time} Uhr` : ''}</li>)}{diff.changes.length > list.length && <li className="muted">und {diff.changes.length - list.length} weitere</li>}</ul>}
    <p className="hint top0">Erledigte, ausgelassene, verpasste, verschobene und einzeln geänderte Termine bleiben unverändert.</p>
    {conflicts && conflicts.length > 0 && <div className="callout warn"><b>Überschneidungen, bitte prüfen:</b><ul className="plain">{conflicts.slice(0, 4).map(c => <li key={c}>{c}</li>)}</ul>HealthOS verschiebt nichts automatisch.</div>}
  </div>;
}
function ItemSheet({ id, ctx, close }) {
  const { data, today, commit, openSheet } = ctx;
  const it = data.items.find(i => i.id === id);
  const [dl, setDl] = useState(it ? it.date : today);
  if (!it) return <Sheet title="Eintrag" close={close}><p>Dieser Eintrag existiert nicht mehr.</p></Sheet>;
  const st = effStatus(it, today);
  const cls = classOfItem(it);
  const rt = it.routine ? data.routines.find(r => r.id === it.routine) : null;
  const pause = it.status === 'pausiert' ? allPauses(data).find(p => p.id === it.pauseId) : null;
  const run = (fn, msg) => { commit(fn, msg); close(); };
  const moveOpts = Array.from({ length: 8 }, (_, i) => addDays(today, i)).filter(d => d !== it.date);
  const weekEnd = weekDays(today)[6];
  const replOpts = cls === 'weekly_flexible' && st === 'verpasst' && inWeek(it.date, today) && !it.replacedBy
    ? Array.from({ length: daysBetween(today, weekEnd) + 1 }, (_, i) => addDays(today, i)).filter(d => !data.items.some(x => x.date === d && x.type === 'training' && ['geplant', 'erledigt'].includes(x.status))) : [];
  return <Sheet title={it.title} close={close}>
    <p className="sheet-sub">{dayLabel(it.date, today)}{it.time ? `, ${it.time} Uhr` : ''}{it.duration ? `, ${it.duration} Min.` : ''}</p>
    <div className="chips static"><StatusTag it={it} today={today} always /><span className="tag tag-muted">{TASK_CLASSES[cls][0]}</span>{it.override && <span className="tag tag-muted">einzeln geändert</span>}{it.lateLogged && <span className="tag tag-muted">nacherfasst</span>}</div>
    {it.note && <p className="hint">{it.note}</p>}

    {st === 'pausiert' && <p className="callout">Pausiert{pause && pause.scope !== 'routine' ? `: ${PAUSE_KINDS[pause.kind]}, ${fmtDM(pause.from)} bis ${fmtDM(pause.to)}` : ', weil die Routine pausiert ist'}. Die Pause kannst du in den Einstellungen oder unter Routinen aufheben.</p>}
    {st === 'verschoben' && <p className="callout">Auf {dayLabel(it.movedTo, today)} verschoben. Den neuen Termin findest du dort.</p>}
    {st === 'nicht_erfasst' && <p className="callout">Optionale Erfassung ohne Eintrag. Das ist kein Rückstand.</p>}
    {st === 'verpasst' && <>
      <p className="callout">Hat nicht stattgefunden. {cls === 'weekly_flexible' ? 'Für das Wochenziel kannst du einen Ersatz in derselben Woche wählen. Danach entsteht kein Rückstand.' : 'Tagesgebundene Aufgaben werden nicht nachgeholt.'}</p>
      {it.replacedBy && <p className="hint">Ersatztermin ist bereits geplant.</p>}
      {replOpts.length > 0 && <><h3 className="h3">Ersatz in dieser Woche</h3><div className="chips">{replOpts.map(d => <button key={d} className="chip" onClick={() => run(x => A.replaceInWeek(x, it.id, d), `Ersatz am ${dayLabel(d, today)} geplant`)}>{dayLabel(d, today)}</button>)}</div></>}
      {cls === 'weekly_flexible' && inWeek(it.date, today) && !it.replacedBy && !replOpts.length && <p className="hint">In dieser Woche ist kein freier Tag mehr ohne Training.</p>}
      <button className="btn ghost wide" onClick={() => run(x => A.lateLog(x, it.id), 'Als erledigt nacherfasst')}>Doch erledigt, nacherfassen</button>
    </>}
    {st === 'faellig' && <>
      <button className="btn primary wide" onClick={() => run(x => A.setStatus(x, it.id, 'erledigt'), `Erledigt: ${it.title}`)}>Als erledigt markieren</button>
      <div className="inline-add"><input className="input" type="date" min={today} value={dl} onChange={e => setDl(e.target.value)} aria-label="Neue Frist" /><button className="btn" disabled={!dl || dl < today} onClick={() => run(x => A.setDeadline(x, it.id, dl), `Neue Frist: ${dayLabel(dl, today)}`)}>Neue Frist</button></div>
      <button className="btn ghost wide" onClick={() => run(x => A.setStatus(x, it.id, 'ausgelassen'), 'Verworfen')}>Nicht mehr nötig, verwerfen</button>
    </>}
    {(st === 'geplant' || st === 'erledigt') && <>
      <button className="btn primary wide" disabled={it.date > today && st !== 'erledigt'} title={it.date > today ? 'Erst am Tag selbst abhakbar' : undefined} onClick={() => run(x => A.toggleItem(x, it.id, today), st === 'erledigt' ? `Wieder offen: ${it.title}` : `Erledigt: ${it.title}`)}>{st === 'erledigt' ? 'Wieder öffnen' : 'Als erledigt markieren'}</button>
      {st === 'geplant' && <>
        <button className="btn wide" onClick={() => openSheet({ kind: 'edit', id: it.id })}><Icon name="edit" size={18} /> Uhrzeit oder Dauer ändern</button>
        <h3 className="h3">Verschieben auf</h3>
        <div className="chips">{moveOpts.map(d => <button key={d} className="chip" onClick={() => run(x => A.moveItem(x, it.id, d), `Verschoben auf ${dayLabel(d, today)}`)}>{dayLabel(d, today)}</button>)}</div>
        {it.routine && <p className="hint">Gilt nur für diesen Termin. Die Routine bleibt unverändert.</p>}
        {it.type === 'training' && moveOpts.some(d => d > addDays(weekStart(it.date), 6)) && <p className="hint">Tage ab dem nächsten Montag zählen nicht mehr für das Wochenziel dieser Woche.</p>}
        <button className="btn ghost wide" onClick={() => run(x => A.setStatus(x, it.id, 'ausgelassen'), 'Bewusst ausgelassen')}>Bewusst auslassen</button>
      </>}
    </>}
    {st === 'ausgelassen' && it.date >= today && <button className="btn wide" onClick={() => run(x => A.setStatus(x, it.id, 'geplant'), 'Wieder eingeplant')}>Wieder einplanen</button>}
    {!it.routine && !['erledigt'].includes(st) && <button className="btn danger wide" onClick={() => run(x => A.deleteItem(x, it.id), 'Eintrag gelöscht')}>Eintrag löschen</button>}
    {it.routine === 'review' && <button className="btn wide" onClick={() => { close(); ctx.startReview(reviewForDate(it.date, ctx.cfg)); }}><Icon name="spark" size={18} /> Check-in öffnen</button>}
    {rt && <button className="link" onClick={() => openSheet({ kind: 'routine', id: rt.id })}><Icon name="repeat" size={16} />&nbsp;Routine „{(versionAt(rt, today) || rt.versions[0]).title}“ bearbeiten</button>}
  </Sheet>;
}
function EditInstanceSheet({ id, ctx, close }) {
  const { data, today, commit } = ctx;
  const it = data.items.find(i => i.id === id);
  const [time, setTime] = useState(it ? it.time : '');
  const [dur, setDur] = useState(it ? String(it.duration || '') : '');
  const [title, setTitle] = useState(it ? it.title : '');
  const [scope, setScope] = useState('instance');
  const n = parseNum(dur);
  const err = !it ? 'x' : !time ? 'Bitte eine Uhrzeit angeben.' : !(Number.isInteger(n) && n > 0 && n <= 600) ? 'Bitte eine Dauer zwischen 1 und 600 Minuten eingeben.' : (scope !== 'weekday' && !title.trim()) ? 'Bitte einen Titel eingeben.' : '';
  const patch = scope === 'weekday' ? { time, duration: n } : { time, duration: n, title: title.trim() };
  const next = useMemo(() => (err ? null : A.editInstance(data, it.id, scope, patch, today)), [time, dur, title, scope, data, err]);
  if (!it) return <Sheet title="Termin ändern" close={close}><p>Dieser Eintrag existiert nicht mehr.</p></Sheet>;
  const diff = next ? planDiff(data.items, next.items, today) : null;
  if (diff && scope === 'instance') { const after = next.items.find(x => x.id === it.id); if (after && (after.time !== it.time || after.duration !== it.duration || after.title !== it.title)) diff.changes = [{ kind: 'geändert', it: after, old: it }, ...diff.changes]; diff.changed = diff.changes.filter(c => c.kind === 'geändert').length; }
  const dates = diff ? diff.changes.map(c => c.it.date) : [];
  const conflicts = next ? findConflicts(next.items, dates) : [];
  const wd = WD_LONG[wdIdx(it.date)];
  return <Sheet title="Termin ändern" close={close}>
    <div className="form">
      <p className="sheet-sub">{it.title}, {dayLabel(it.date, today)}</p>
      {scope !== 'weekday' && <Field label="Titel"><input className="input" value={title} onChange={e => setTitle(e.target.value)} /></Field>}
      <div className="grid2">
        <Field label="Uhrzeit"><input className="input" type="time" value={time} onChange={e => setTime(e.target.value)} /></Field>
        <Field label="Dauer in Minuten"><input className="input" inputMode="numeric" value={dur} onChange={e => setDur(e.target.value)} /></Field>
      </div>
      {it.routine && <fieldset className="scope"><legend className="field-label">Was soll sich ändern?</legend>
        {[['instance', 'Nur diesen Termin', `Nur ${dayLabelLc(it.date, today)}. Die Routine bleibt, wie sie ist.`],
          ['from', `Ganze Routine ab ${fmtDM(it.date)}`, 'Alle Wochentage dieser Routine ab diesem Datum. Frühere Termine bleiben unverändert.'],
          ['weekday', `Jeden ${wd} ab ${fmtDM(it.date)}`, `Dauerhafte Ausnahme nur für ${wd}e. Andere Tage bleiben wie bisher.`]].map(([k, l, h]) =>
          <label key={k} className={`radio ${scope === k ? 'on' : ''}`}><input type="radio" name="scope" checked={scope === k} onChange={() => setScope(k)} /><span><b>{l}</b><small>{h}</small></span></label>)}
      </fieldset>}
      {err ? <p className="err" role="alert">{err}</p> : <ChangePreview diff={diff} conflicts={conflicts} />}
      <button className="btn primary wide" disabled={!!err} onClick={() => { commit(() => next, scope === 'instance' ? 'Termin geändert' : scope === 'from' ? 'Routine ab Datum geändert' : `Ausnahme für ${wd} gespeichert`); close(); }}>Änderung übernehmen</button>
    </div>
  </Sheet>;
}
function AddItemSheet({ date, ctx, close }) {
  const { today, commit } = ctx;
  const [title, setTitle] = useState(''); const [type, setType] = useState('training'); const [cls, setCls] = useState('weekly_flexible');
  const [d, setD] = useState(date); const [time, setTime] = useState('18:00'); const [dur, setDur] = useState('30'); const [err, setErr] = useState('');
  const pickType = t => { setType(t); setCls(t === 'training' ? 'weekly_flexible' : 'same_day'); };
  const save = () => {
    const n = parseNum(dur);
    if (!title.trim()) return setErr('Bitte einen Titel eingeben.');
    if (!d || d < today) return setErr('Bitte ein Datum ab heute wählen.');
    if (cls !== 'deadline' && !time) return setErr('Bitte eine Uhrzeit angeben.');
    if (cls !== 'deadline' && !(Number.isInteger(n) && n > 0 && n <= 600)) return setErr('Bitte eine Dauer zwischen 1 und 600 Minuten eingeben.');
    commit(x => A.addItem(x, { title: title.trim(), type, kind: type === 'training' ? 'Sonstiges' : null, date: d, time: cls === 'deadline' ? '' : time, duration: cls === 'deadline' ? null : n, routine: null, taskClass: cls }), `Geplant: ${title.trim()}, ${dayLabel(d, today)}`);
    close();
  };
  return <Sheet title="Eintrag planen" close={close}>
    <div className="form">
      <Field label="Titel"><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="z. B. Laufen am Neckar" /></Field>
      <Field label="Art"><Chips options={[['training', 'Training'], ['bewegung', 'Bewegung'], ['sonstiges', 'Aufgabe']]} value={type} onChange={pickType} /></Field>
      <Field label="Verhalten, wenn es nicht klappt"><Chips options={Object.entries(TASK_CLASSES).filter(([k]) => k !== 'optional_logging').map(([k, v]) => [k, v[0]])} value={cls} onChange={setCls} small /></Field>
      <p className="hint top0">{TASK_CLASSES[cls][1]}</p>
      <div className="grid2">
        <Field label={cls === 'deadline' ? 'Erledigen bis' : 'Datum'}><input className="input" type="date" min={today} value={d} onChange={e => setD(e.target.value)} /></Field>
        {cls !== 'deadline' && <Field label="Uhrzeit"><input className="input" type="time" value={time} onChange={e => setTime(e.target.value)} /></Field>}
      </div>
      {cls !== 'deadline' && <Field label="Dauer in Minuten"><input className="input" inputMode="numeric" value={dur} onChange={e => setDur(e.target.value)} /></Field>}
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary wide" onClick={save}>Eintrag planen</button>
      <p className="hint">Für etwas Wiederkehrendes lege besser eine Routine an.</p>
    </div>
  </Sheet>;
}
function PauseSheet({ ctx, close, from: from0 }) {
  const { today, commit } = ctx;
  const [kind, setKind] = useState('urlaub');
  const [from, setFrom] = useState(from0 || today);
  const [to, setTo] = useState(addDays(from0 || today, 6));
  const [scope, setScope] = useState('alle');
  const [err, setErr] = useState('');
  const save = () => {
    if (!from || !to) return setErr('Bitte Beginn und Ende angeben.');
    if (to < from) return setErr('Das Ende darf nicht vor dem Beginn liegen.');
    if (to < today) return setErr('Die Pause muss mindestens bis heute reichen. Vergangene Einträge werden nicht verändert.');
    if (daysBetween(from, to) > 365) return setErr('Bitte höchstens ein Jahr am Stück.');
    commit(d => A.addPause(d, { kind, from, to, scope }, today), `Pausiert bis ${fmtDM(to)}`);
    close();
  };
  return <Sheet title="Pause eintragen" close={close}>
    <div className="form">
      <Field label="Art der Pause"><Chips options={Object.entries(PAUSE_KINDS)} value={kind} onChange={setKind} /></Field>
      <p className="hint top0">Gründe wie Krankheit werden bewusst nicht erfasst. „Auszeit ohne Grund“ passt für alles, was du nicht benennen möchtest.</p>
      <div className="grid2">
        <Field label="Von"><input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} /></Field>
        <Field label="Bis"><input className="input" type="date" min={from} value={to} onChange={e => setTo(e.target.value)} /></Field>
      </div>
      <Field label="Was pausieren?"><Chips options={[['alle', 'Alle Routinen'], ['training', 'Nur Training']]} value={scope} onChange={setScope} /></Field>
      <p className="hint">Wirkt ab heute auf geplante Routinen. Erledigte, ausgelassene, verschobene und vergangene Einträge bleiben unverändert. Pausierte Tage zählen nicht in die Ziele.</p>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary wide" onClick={save}>Pause speichern</button>
    </div>
  </Sheet>;
}
function InfoSheet({ close, onSettings }) {
  return <Sheet title={BETA.demoData ? "Über diese Demo" : "Über HealthOS Beta"} close={close}>
    <div className="form">
      <h3 className="h3">Was funktioniert</h3>
      <p className="hint">{BETA.demoData ? "Einrichtung, automatischer Wochenplan, Routinen mit Versionen und Ausnahmen, Abhaken, Verschieben, Ersatz in derselben Woche, Pausen, Erfassen von Gewicht, Schritten, Training und Mahlzeiten, Laborwerte, Termine und regelbasierte Empfehlungen mit Quellen." : BETA.info.works}</p>
      <h3 className="h3">Was gespeichert wird</h3>
      <p className="hint">{BETA.demoData ? "Nur Einstellungen, Routinen, Wochenplan, Gewohnheiten und Pausen ohne Grund, privat für dein Konto. Messwerte, Laborwerte, Termine, Gewicht und laborbezogene Empfehlungen bleiben Demo-Daten dieser Sitzung." : BETA.info.stored}</p>
      <h3 className="h3">Was bewusst fehlt</h3>
      <p className="hint">{BETA.demoData ? "Keine Push-Benachrichtigungen, kein Datei-Upload, keine Verbindung zu Health Connect, keine KI-Auswertung. Diese Datei ist noch keine installierbare App (PWA)." : BETA.info.missing}</p>
      {!BETA.demoData && <ul className="b-status">{BETA.status.map(([f, st]) => <li key={f}><span>{f}</span><b>{st}</b></li>)}</ul>}
      {!BETA.demoData && <><h3 className="h3">Begriffe</h3><dl className="b-terms">{BETA.terms.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl></>}
      <p className="hint">Version {APP_VERSION}</p>
      {!BETA.demoData && <p className="legal-links"><a href="/impressum">Impressum</a><a href="/datenschutz">Datenschutz</a>{BETA.feedbackEmail && <a href={`mailto:${BETA.feedbackEmail}?subject=HealthOS%20Beta%20Feedback`}>Feedback senden</a>}</p>}
      <button className="btn wide" onClick={() => { close(); onSettings(); }}>Zu den Einstellungen</button>
    </div>
  </Sheet>;
}

function LabSheet({ ctx, close }) {
  const { data, today, commit } = ctx;
  const names = [...new Set(data.labs.map(l => l.analyte))];
  const [f, setF] = useState({ analyte: '', value: '', unit: '', refMin: '', refMax: '', date: today, lab: '', confirmed: false });
  const [err, setErr] = useState('');
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const pickName = n => { const last = [...data.labs].filter(l => l.analyte === n).sort((a, b) => b.date.localeCompare(a.date))[0]; setF(s => ({ ...s, analyte: n, unit: last ? last.unit : s.unit })); };
  const save = () => {
    const v = parseNum(f.value), mn = f.refMin === '' ? null : parseNum(f.refMin), mx = f.refMax === '' ? null : parseNum(f.refMax);
    if (!f.analyte.trim()) return setErr('Bitte den Parameter benennen.');
    if (!Number.isFinite(v)) return setErr('Bitte den Wert als Zahl eingeben.');
    if (!f.unit.trim()) return setErr('Bitte die Einheit genau wie im Befund angeben.');
    if ((mn != null && !Number.isFinite(mn)) || (mx != null && !Number.isFinite(mx))) return setErr('Referenzwerte bitte als Zahl eingeben oder leer lassen.');
    if (!f.date || f.date > today) return setErr('Bitte ein Messdatum bis heute wählen.');
    commit(d => ({ ...d, labs: [...d.labs, { id: uid('lab'), analyte: f.analyte.trim(), value: v, unit: f.unit.trim(), refMin: mn, refMax: mx, date: f.date, lab: f.lab.trim() || 'nicht angegeben', source: 'manuell', confirmed: !!f.confirmed }] }), `${f.analyte.trim()} gespeichert`);
    close();
  };
  return <Sheet title="Laborwert eintragen" close={close}>
    <div className="form">
      <p className="demo-note"><Icon name="info" size={16} /> Bitte nur fiktive Testwerte verwenden. Nichts wird dauerhaft gespeichert.</p>
      <Field label="Parameter"><input className="input" value={f.analyte} onChange={e => set('analyte', e.target.value)} placeholder="Name wie im Befund" /></Field>
      <div className="chips">{names.map(n => <button key={n} className={`chip sm ${f.analyte === n ? 'on' : ''}`} onClick={() => pickName(n)}>{n}</button>)}</div>
      <div className="grid2">
        <Field label="Wert"><input className="input" inputMode="decimal" value={f.value} onChange={e => set('value', e.target.value)} /></Field>
        <Field label="Einheit wie im Befund"><input className="input" value={f.unit} onChange={e => set('unit', e.target.value)} placeholder="z. B. mg/dl" /></Field>
        <Field label="Referenz von (optional)"><input className="input" inputMode="decimal" value={f.refMin} onChange={e => set('refMin', e.target.value)} /></Field>
        <Field label="Referenz bis (optional)"><input className="input" inputMode="decimal" value={f.refMax} onChange={e => set('refMax', e.target.value)} /></Field>
        <Field label="Messdatum"><input className="input" type="date" max={today} value={f.date} onChange={e => set('date', e.target.value)} /></Field>
        <Field label="Labor (optional)"><input className="input" value={f.lab} onChange={e => set('lab', e.target.value)} /></Field>
      </div>
      <Toggle checked={f.confirmed} onChange={v => set('confirmed', v)}>Mit dem Originalbefund abgeglichen (bestätigt)</Toggle>
      <p className="hint">Werte in anderer Einheit werden als eigene Reihe geführt und nicht umgerechnet. Nur bestätigte Werte mit eindeutiger Einheit und Referenz können Empfehlungen auslösen. Laborwerte werden nicht gespeichert.</p>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary wide" onClick={save}>Laborwert speichern</button>
    </div>
  </Sheet>;
}
function ApptSheet({ id, followOf, ctx, close }) {
  const { data, today, commit } = ctx;
  const src = data.appointments.find(a => a.id === (id || followOf));
  const editing = !!id && !!src;
  const [f, setF] = useState(editing ? { ...src } : { title: src ? src.title : '', practice: src ? src.practice : '', date: '', time: '', status: 'offen', link: '', note: '' });
  const [err, setErr] = useState('');
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const save = () => {
    if (!f.title.trim()) return setErr('Bitte einen Titel eingeben.');
    if (!f.date) return setErr(f.status === 'offen' ? 'Bitte ein Datum angeben, bis wann der Termin vereinbart sein soll.' : 'Bitte ein Datum angeben.');
    if (f.link && !/^https:\/\//.test(f.link.trim())) return setErr('Der Link muss mit https:// beginnen.');
    const clean = { ...f, title: f.title.trim(), practice: f.practice.trim(), link: f.link.trim(), note: f.note.trim() };
    commit(d => ({ ...d, appointments: editing ? d.appointments.map(a => a.id === id ? clean : a) : [...d.appointments, { ...clean, id: uid('ap') }] }), editing ? 'Termin aktualisiert' : 'Termin angelegt');
    close();
  };
  return <Sheet title={editing ? 'Termin bearbeiten' : followOf ? 'Folgetermin anlegen' : 'Termin oder Vorsorge anlegen'} close={close}>
    <div className="form">
      <Field label="Titel"><input className="input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="z. B. Zahnärztliche Kontrolle" /></Field>
      <Field label="Praxis oder Kontakt (optional)"><input className="input" value={f.practice} onChange={e => set('practice', e.target.value)} /></Field>
      <Field label="Status"><div className="chips">{Object.entries(APPT_STATUS).map(([k, l]) => <button key={k} className={`chip sm ${f.status === k ? 'on' : ''}`} aria-pressed={f.status === k} onClick={() => set('status', k)}>{l}</button>)}</div></Field>
      <div className="grid2">
        <Field label={f.status === 'offen' ? 'Vereinbaren bis' : 'Datum'}><input className="input" type="date" value={f.date} onChange={e => set('date', e.target.value)} /></Field>
        <Field label="Uhrzeit (optional)"><input className="input" type="time" value={f.time} onChange={e => set('time', e.target.value)} /></Field>
      </div>
      <Field label="Buchungslink (optional)" hint="Nur ein Link zur Praxis. Die App bucht nichts."><input className="input" inputMode="url" value={f.link} onChange={e => set('link', e.target.value)} placeholder="https://" /></Field>
      <Field label="Notiz (optional)"><textarea className="input" rows={2} value={f.note} onChange={e => set('note', e.target.value)} placeholder="z. B. Kontrolle wie besprochen" /></Field>
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary wide" onClick={save}>{editing ? 'Änderungen speichern' : 'Termin anlegen'}</button>
      {editing && <button className="btn danger wide" onClick={() => { commit(d => ({ ...d, appointments: d.appointments.filter(a => a.id !== id) }), 'Termin gelöscht'); close(); }}>Termin löschen</button>}
    </div>
  </Sheet>;
}
/* ---------------- Routinen (HOS-004) ---------------- */
const SOURCE_LABEL = { plan: 'Wochenplan', eigene: 'Eigene', empfehlung: 'Empfehlung' };
function RoutinesScreen({ ctx }) {
  const { data, today, openSheet, go } = ctx;
  const groups = [['aktiv', 'Aktiv'], ['pausiert', 'Pausiert'], ['archiviert', 'Archiviert']];
  const sorted = [...data.routines].sort((a, b) => ((versionAt(a, today) || a.versions[0]).time || '').localeCompare((versionAt(b, today) || b.versions[0]).time || ''));
  return <div className="screen">
    <header className="page-head"><h1 className="h1">Routinen</h1><button className="btn small primary" onClick={() => openSheet({ kind: 'routine' })}><Icon name="plus" size={16} /> Neue Routine</button></header>
    <p className="hint top0">Routinen sind die Vorlagen hinter deinem Wochenplan. Änderungen gelten ab einem Datum, frühere Einträge bleiben unverändert.</p>
    {groups.map(([st, label]) => {
      const list = sorted.filter(r => r.status === st);
      if (!list.length && st !== 'aktiv') return null;
      const body = list.length ? <ul className="list">{list.map(r => {
        const v = versionAt(r, today) || r.versions[r.versions.length - 1];
        const next = data.items.filter(i => i.routine === r.id && i.date >= today && i.status === 'geplant').sort(byTime)[0];
        return <li key={r.id} className="row">
          <span className="row-icon lead"><Icon name={(TYPES[r.type] || TYPES.sonstiges).icon} size={18} /></span>
          <button className="row-main" onClick={() => openSheet({ kind: 'routine', id: r.id })}>
            <span className="row-title">{v.title}</span>
            <span className="row-meta"><span>{specText(v)}</span><span>{TASK_CLASSES[r.taskClass][0]}</span><span>{SOURCE_LABEL[r.source]}{r.customized && r.source === 'plan' ? ', angepasst' : ''}</span>{(r.exceptions || []).length > 0 && <span>{r.exceptions.length} Ausnahme{r.exceptions.length > 1 ? 'n' : ''}</span>}{st === 'aktiv' && next && <span>nächster: {dayLabel(next.date, today)}</span>}</span>
          </button>
        </li>;
      })}</ul> : <Empty text="Keine aktiven Routinen." action={<button className="btn small" onClick={() => openSheet({ kind: 'routine' })}>Routine anlegen</button>} />;
      return <section key={st} className="block">{st === 'archiviert' ? <details className="fold"><summary><span>{label}</span><span className="muted">{list.length}</span></summary>{body}</details> : <><h2 className="h2">{label} <span className="muted">{list.length}</span></h2>{body}</>}</section>;
    })}
    <button className="link" onClick={() => go('woche')}>Zurück zur Woche</button>
  </div>;
}
function RoutineSheet({ id, ctx, close }) {
  const { data, today, commit } = ctx;
  const rt = id ? data.routines.find(r => r.id === id) : null;
  const v0 = rt ? (versionAt(rt, today) || rt.versions[rt.versions.length - 1]) : null;
  const [f, setF] = useState(() => rt ? { title: v0.title, kind: v0.kind, type: rt.type, goal: rt.goal || '', taskClass: rt.taskClass, priority: rt.priority || 'normal', days: [...v0.days], interval: v0.interval || 1, time: v0.time, duration: String(v0.duration), note: v0.note || '', exceptions: clone(rt.exceptions || []) }
    : { title: '', kind: null, type: 'bewegung', goal: '', taskClass: 'same_day', priority: 'normal', days: [0, 2, 4], interval: 1, time: '12:30', duration: '15', note: '', exceptions: [] });
  const [from, setFrom] = useState(today);
  const [ex, setEx] = useState({ weekday: '', time: '', duration: '' });
  const [tab, setTab] = useState('bearbeiten');
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const n = parseNum(f.duration);
  const err = !f.title.trim() ? 'Bitte einen Titel eingeben.' : f.title.trim().length > 80 ? 'Bitte höchstens 80 Zeichen.' : !f.days.length ? 'Bitte mindestens einen Wochentag wählen.' : !f.time ? 'Bitte eine Uhrzeit angeben.' : !(Number.isInteger(n) && n > 0 && n <= 600) ? 'Bitte eine Dauer zwischen 1 und 600 Minuten eingeben.' : !from || from < today ? 'Änderungen gelten frühestens ab heute.' : '';
  const next = useMemo(() => (err ? null : A.saveRoutine(data, rt ? rt.id : null, { ...f, duration: n }, from, today)), [f, from, data, err]);
  const diff = next ? planDiff(data.items, next.items, today) : null;
  const conflicts = next && diff ? findConflicts(next.items, diff.changes.map(c => c.it.date)) : [];
  const addEx = () => {
    const wd = Number(ex.weekday);
    if (ex.weekday === '' || !f.days.includes(wd)) return;
    if (!ex.time && !ex.duration) return;
    set('exceptions', [...f.exceptions.filter(e => !(e.weekday === wd && e.validFrom === from)), { id: uid('ex'), weekday: wd, validFrom: from, time: ex.time || null, duration: ex.duration ? Number(ex.duration) : null }]);
    setEx({ weekday: '', time: '', duration: '' });
  };
  const status = (s, msg) => { commit(d => A.routineStatus(d, rt.id, s, today), msg); close(); };
  return <Sheet title={rt ? v0.title : 'Neue Routine'} close={close}>
    {rt && <Segmented label="Bereich" value={tab} onChange={setTab} options={[['bearbeiten', 'Bearbeiten'], ['verlauf', 'Verlauf']]} />}
    {tab === 'verlauf' && rt ? <div className="form">
      <h3 className="h3 top0">Versionen</h3>
      <ul className="list">{[...rt.versions].reverse().map(v => <li key={v.validFrom} className="row compact"><div className="row-main static"><span className="row-title">{v.validFrom <= '2000-01-01' ? 'Von Anfang an' : `Ab ${fmtDM(v.validFrom)}${yy(v.validFrom)}`}{v === v0 && <span className="tag">aktuell</span>}</span><span className="row-meta"><span>{v.title}</span><span>{specText(v)}</span></span></div></li>)}</ul>
      <h3 className="h3">Änderungsprotokoll</h3>
      <ul className="plain history">{[...(rt.history || [])].reverse().slice(0, 20).map((h, i) => <li key={i}><b>{h.at <= '2000-01-01' ? 'Anfang' : fmtDM(h.at)}</b> {h.text}</li>)}</ul>
    </div> : <div className="form">
      {rt && rt.source === 'plan' && !rt.customized && <p className="hint top0">Diese Routine stammt aus deinem Wochenplan. Nach einer Änderung hier bleibt sie bei späteren Planänderungen in den Einstellungen unverändert.</p>}
      <Field label="Titel"><input className="input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="z. B. Dehnen nach dem Aufstehen" /></Field>
      <Field label="Kategorie"><Chips small options={Object.entries(TYPES).map(([k, t]) => [k, t.label])} value={f.type} onChange={v => set('type', v)} /></Field>
      <Field label="Aufgabenklasse"><Chips small options={Object.entries(TASK_CLASSES).filter(([k]) => k !== 'deadline').map(([k, c]) => [k, c[0]])} value={f.taskClass} onChange={v => set('taskClass', v)} /></Field>
      <p className="hint top0">{TASK_CLASSES[f.taskClass][1]}</p>
      <Field label="Wochentage"><DayToggles label="Wochentage" value={f.days} onChange={v => set('days', v)} /></Field>
      <Field label="Wiederholung"><Chips small options={[[1, 'Jede Woche'], [2, 'Alle 2 Wochen']]} value={f.interval} onChange={v => set('interval', v)} /></Field>
      <div className="grid2">
        <Field label="Uhrzeit"><input className="input" type="time" value={f.time} onChange={e => set('time', e.target.value)} /></Field>
        <Field label="Dauer in Minuten"><input className="input" inputMode="numeric" value={f.duration} onChange={e => set('duration', e.target.value)} /></Field>
      </div>
      <div className="grid2">
        <Field label="Ziel"><select className="input" value={f.goal} onChange={e => set('goal', e.target.value)}><option value="">Kein Ziel</option>{Object.entries(GOALS).filter(([k]) => !BETA.hiddenGoals.includes(k) || k === f.goal).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Priorität"><select className="input" value={f.priority} onChange={e => set('priority', e.target.value)}>{Object.entries(PRIORITIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
      </div>
      <Field label="Notiz (optional)"><input className="input" value={f.note} onChange={e => set('note', e.target.value)} /></Field>
      <h3 className="h3">Ausnahmen für einzelne Wochentage</h3>
      {f.exceptions.length ? <ul className="list">{f.exceptions.map(e => <li key={e.id} className="row compact"><div className="row-main static"><span className="row-title">Jeden {WD_LONG[e.weekday]}</span><span className="row-meta">{e.time && <span>{e.time} Uhr</span>}{e.duration && <span>{e.duration} Min.</span>}<span>ab {fmtDM(e.validFrom)}</span></span></div>
        <button className="icon-btn sm" aria-label={`Ausnahme ${WD_LONG[e.weekday]} entfernen`} onClick={() => set('exceptions', f.exceptions.filter(x => x.id !== e.id))}><Icon name="trash" size={16} /></button></li>)}</ul> : <p className="hint top0">Keine Ausnahmen. Beispiel: jeden Dienstag eine Stunde später.</p>}
      <div className="ex-add">
        <select className="input" aria-label="Wochentag der Ausnahme" value={ex.weekday} onChange={e => setEx({ ...ex, weekday: e.target.value })}><option value="">Tag</option>{f.days.map(d => <option key={d} value={d}>{WD[d]}</option>)}</select>
        <input className="input" type="time" aria-label="Uhrzeit der Ausnahme" value={ex.time} onChange={e => setEx({ ...ex, time: e.target.value })} />
        <input className="input" inputMode="numeric" aria-label="Dauer der Ausnahme in Minuten" placeholder="Min." value={ex.duration} onChange={e => setEx({ ...ex, duration: e.target.value })} />
        <button className="btn" onClick={addEx} disabled={ex.weekday === '' || (!ex.time && !ex.duration)}>Hinzufügen</button>
      </div>
      <Field label="Gültig ab" hint="Termine vor diesem Datum bleiben unverändert."><input className="input" type="date" min={today} value={from} onChange={e => setFrom(e.target.value)} /></Field>
      {err ? <p className="err" role="alert">{err}</p> : <ChangePreview diff={diff} conflicts={conflicts} empty={rt ? 'Keine zukünftigen Termine betroffen.' : 'Noch keine Termine im geplanten Zeitraum.'} />}
      <button className="btn primary wide" disabled={!!err} onClick={() => { commit(() => next, rt ? 'Routine gespeichert' : 'Routine angelegt'); close(); }}>{rt ? 'Änderungen speichern' : 'Routine anlegen'}</button>
      {rt && <div className="btn-row">
        {rt.status === 'aktiv' && <button className="btn small" onClick={() => status('pausiert', 'Routine pausiert')}><Icon name="pause" size={16} /> Pausieren</button>}
        {rt.status !== 'aktiv' && <button className="btn small" onClick={() => status('aktiv', 'Routine wieder aktiv')}>Reaktivieren</button>}
        {rt.status !== 'archiviert' && <button className="btn small" onClick={() => status('archiviert', 'Routine archiviert')}><Icon name="archive" size={16} /> Archivieren</button>}
        <button className="btn small" onClick={() => { commit(d => A.duplicateRoutine(d, rt.id, today), 'Kopie angelegt, sie ist pausiert'); close(); }}><Icon name="copy" size={16} /> Duplizieren</button>
      </div>}
      {rt && <p className="hint">Pausieren setzt zukünftige Termine aus, Reaktivieren stellt sie wieder her. Archivieren entfernt zukünftige geplante Termine. Erledigtes bleibt immer erhalten.</p>}
    </div>}
  </Sheet>;
}

/* ---------------- HOS-006: Health Review & Adapt ---------------- */
/* Regelbasiert und nur mit vorhandenen Daten. Keine Gesamtbewertung, keine Diagnosen, keine Ursache-Wirkungs-Behauptungen.
   Gespeichert werden nur Status, Datum, gestellte Fragen (IDs) und beschlossene Plan-Maßnahmen. Antworten bleiben in der Sitzung. */
/* ---------- Datengrundlage: vollständig, unvollständig, keine Daten ---------- */
/* Eine Woche ist nur dann „vollständig“, wenn für alle Tage ein Plan existierte und die Woche vorbei ist.
   Nur dann bedeutet 0 Trainings nachweislich keine Aktivität. */
/* Damals geltendes Wochenziel: aus den Routinenversionen der Trainingsroutinen, nicht aus den heutigen Einstellungen */
/* Durchschnitt nur aus vollständig erfassten Wochen, mindestens zwei */
/* ---------- Zeitpunkte ---------- */
/* Analysierter Zeitraum (target) und Check-in-Termin (slot) sind getrennt */
/* Sind Woche und Monat gleichzeitig fällig, wird ein gemeinsamer Ablauf angeboten */
/* Der zugehörige Check-in-Termin im Plan. Folgt einer Verschiebung, nie ein Termin vor dem Check-in-Tag. */
/* ---------- Kennzahlen ---------- */
/* Gewohnheiten: Tage vor dem ersten Eintrag sind keine Daten, nicht „nicht erledigt“ */
/* ---------- Reflexionsfragen ---------- */
/* ---------- Adaptiver Coach ---------- */
/* Frühere Entscheidungen: übernommen in den letzten zwei Reviews oder „nicht jetzt“ ohne neuen Anlass werden nicht erneut vorgeschlagen */
/* Rein funktional, für Vorschau und Übernahme gleich. Standard: ab nächstem Montag. */
/* ---------- Oberfläche ---------- */
function MiniStat({ label, value, sub }) { return <div className="mini"><span className="mini-l">{label}</span><b>{value}</b>{sub && <small>{sub}</small>}</div>; }
function MeasureEvidence({ e }) {
  if (!e) return null;
  if (e.kind === 'plan') return <p className="hint top0"><Icon name="info" size={14} /> {e.text}</p>;
  return <div className="m-ev"><EvidenceBadge level={e.level} /><span>{e.text}</span>{(e.sources || []).map(k => EVIDENCE[k] && <a key={k} className="ext" href={EVIDENCE[k].url} target="_blank" rel="noopener noreferrer">{EVIDENCE[k].publisher.split(',')[0]}</a>)}</div>;
}
function MeasureCard({ m, n, decision, data, cfg, today, onDecide, onUndo, canUndo }) {
  const [confirm, setConfirm] = useState(false);
  const [from, setFrom] = useState(nextMonday(today));
  const prev = useMemo(() => (confirm ? applyMeasureState(data, cfg, m, today, from) : null), [confirm, from, data, cfg]);
  const diff = prev ? planDiff(data.items, prev.data.items, today) : null;
  const conflicts = prev && diff ? findConflicts(prev.data.items, diff.changes.map(x => x.it.date)) : [];
  const noChange = m.id === 'fortfuehren';
  const habitNote = prev && JSON.stringify(prev.data.habits) !== JSON.stringify(data.habits) ? 'Gewohnheiten: Änderung im Raster.' : '';
  const cfgNote = prev && prev.cfgChanged ? 'Einstellung wird angepasst.' : '';
  return <article className={`measure ${decision ? 'decided' : ''}`} aria-label={`Maßnahme ${n}: ${m.title}`}>
    <div className="m-head"><span className="m-n" aria-hidden="true">{n}</span><h3 className="m-title">{m.title}</h3></div>
    <dl className="m-dl"><dt>Warum</dt><dd>{m.why}</dd><dt>Was sich ändert</dt><dd>{m.change(from)}</dd><dt>So prüfst du den Erfolg</dt><dd>{m.check}</dd></dl>
    <MeasureEvidence e={m.evidence} />
    {decision ? <div className="m-decided-row"><p className="m-decided"><Icon name={decision === 'übernommen' ? 'check' : 'minus'} size={16} /> {decision === 'übernommen' ? (noChange ? 'Beschlossen' : 'Übernommen') : 'Nicht jetzt'}</p>
      {canUndo && <button className="btn small ghost" onClick={() => onUndo(m)}>Rückgängig machen</button>}</div>
      : confirm ? <div className="m-confirm">
        {m.canNow && <fieldset className="scope"><legend className="field-label">Ab wann?</legend>
          {[[nextMonday(today), `Ab nächstem Montag, ${fmtDM(nextMonday(today))}`, 'Empfohlen. Die laufende Woche bleibt unverändert.'], [today, 'Ab sofort', 'Termine ab heute werden angepasst. Erledigtes bleibt.']].map(([v, l, h]) =>
            <label key={v} className={`radio ${from === v ? 'on' : ''}`}><input type="radio" name={`ab-${m.id}`} checked={from === v} onChange={() => setFrom(v)} /><span><b>{l}</b><small>{h}</small></span></label>)}
        </fieldset>}
        {noChange ? <p className="top0">Es wird nichts geändert.</p> : <ChangePreview diff={diff} conflicts={conflicts} all empty={[cfgNote, habitNote].filter(Boolean).join(' ') || (m.immediate ? 'Keine Termine betroffen. Gilt sofort.' : 'Keine Termine im geplanten Zeitraum betroffen.')} />}
        {prev && prev.kept.length > 0 && <p className="hint">Von dir angepasst und daher unverändert: {prev.kept.map(r => (versionAt(r, today) || r.versions[0]).title).join(', ')}.</p>}
        <div className="btn-row"><button className="btn small primary" onClick={() => { onDecide(m, 'übernommen', from); setConfirm(false); }}>Bestätigen</button><button className="btn small ghost" onClick={() => setConfirm(false)}>Abbrechen</button></div>
      </div>
        : <div className="btn-row"><button className="btn small primary" onClick={() => setConfirm(true)}>{noChange ? 'Beschließen' : 'Vorschau und übernehmen'}</button><button className="btn small ghost" onClick={() => onDecide(m, 'nicht jetzt')}>Nicht jetzt</button></div>}
  </article>;
}
function Question({ q, value, onChange, note, onNote }) {
  return <fieldset className="q"><legend className="q-text">{q.text}</legend>
    <Chips options={q.options} value={value || ''} onChange={v => onChange(value === v ? undefined : v)} />
    {(value === 'anderes' || q.id === 'gut') && <input className="input" value={note || ''} onChange={e => onNote(e.target.value)} placeholder="Optional: in eigenen Worten" aria-label="Eigene Notiz, wird nicht gespeichert" />}
  </fieldset>;
}
function RunningMeasures({ list }) {
  if (!list.length) return null;
  return <section className="r-sec"><h3 className="h3 top0">Laufende Maßnahmen zuerst</h3>
    <ul className="plain">{list.map(x => <li key={x.id + x.decidedAt}><b>{x.title}</b><br /><small>Ziel: {x.check} Stand: {x.status || 'noch keine Auswertung möglich'}.</small></li>)}</ul></section>;
}
function CoverageNote({ text }) { return text ? <p className="callout gap"><Icon name="info" size={14} /> {text}</p> : null; }
function WeekSummary({ m }) {
  const wDelta = m.weight && m.weightPrev ? m.weight.avg - m.weightPrev.avg : null;
  const noPlan = m.coverage === 'keine';
  return <>
    {noPlan && <CoverageNote text="Für diese Woche liegen keine Plan-Daten vor. Es gibt daher nichts zu bewerten, das ist kein Rückstand." />}
    {m.coverage === 'teilweise' && <CoverageNote text="Die Planung beginnt mitten in dieser Woche. Werte vor dem Start fließen nicht ein." />}
    <div className="minis">
      <MiniStat label="Training" value={noPlan ? 'keine Daten' : m.goal ? `${m.trDone} von ${m.goal}` : `${m.trDone}`} sub={noPlan ? '' : m.goal ? (m.trDone >= m.goal ? 'Ziel dieser Woche erreicht' : m.trOpen ? `${m.trOpen} noch geplant` : `Ziel dieser Woche: ${m.goal}`) : 'kein Ziel in dieser Woche'} />
      <MiniStat label="Bewegungspausen" value={m.pauses.eligible ? `${m.pauses.done} von ${m.pauses.eligible}` : 'keine Daten'} sub={m.pauseMissed ? `${m.pauseMissed} verpasst, abgeschlossen` : m.pauses.eligible ? 'nichts verpasst' : ''} />
      <MiniStat label="Gewohnheiten" value={m.habits.eligible ? `${pct(m.habits.done, m.habits.eligible)} %` : 'keine Einträge'} sub={m.habits.eligible ? `${m.habits.done} von ${m.habits.eligible} Haken` : ''} />
      {BETA.weight && <MiniStat label="Gewicht" value={wDelta != null ? `${signed(wDelta)} kg` : m.weight ? `${m.weight.n} Messung${m.weight.n > 1 ? 'en' : ''}` : 'nicht erfasst'} sub={wDelta != null ? 'Ø ggü. Vorwoche' : m.weight ? 'kein Vergleich möglich' : 'optional'} />}
      <MiniStat label="Schritte" value={m.steps ? `Ø ${fmtNum(m.steps.avg)}` : 'nicht erfasst'} sub={m.steps ? `an ${m.steps.n} von 7 Tagen` : 'optional'} />
      {BETA.capture.includes('mahlzeit') && <MiniStat label="Mahlzeiten" value={`${m.nutDays} von ${m.nutDue}`} sub={m.nutFull ? `${m.nutFull} Tage vollständig` : 'Tage erfasst'} />}
    </div>
    {m.routines.length > 0 && <section className="r-sec"><h3 className="h3 top0">Routinen</h3><ul className="bars">{[...m.routines].sort((a, b) => b.rate - a.rate).map(r => <li key={r.id}><span>{r.title}</span><Progress value={r.done} max={r.eligible} label={r.title} /><small>{r.done} von {r.eligible}</small></li>)}</ul></section>}
    <p className="callout"><Icon name="info" size={14} /> Verpasste Tagesaufgaben wie Bewegungspausen sind abgeschlossen. Sie werden nicht nachgeholt und erzeugen keine neuen Aufgaben.</p>
  </>;
}
function PosNeg({ m }) {
  return <>
    <section className="r-sec"><h3 className="h3 top0">Was gut lief</h3>{m.positives.length ? <ul className="plain good">{m.positives.map(x => <li key={x}>{x}</li>)}</ul> : <p className="hint top0">{m.coverage === 'keine' ? 'Ohne Daten gibt es hier nichts auszuwerten.' : 'Diese Woche gab es keine besonderen Ausschläge. Das ist in Ordnung.'}</p>}</section>
    <section className="r-sec"><h3 className="h3 top0">Mögliche Hindernisse</h3>{m.obstacles.length ? <ul className="plain">{m.obstacles.map(x => <li key={x}>{x}</li>)}</ul> : <p className="hint top0">Keine auffälligen Hindernisse in deinen Einträgen.</p>}
      <p className="hint">Das sind Beobachtungen aus deinen Einträgen, keine Erklärungen. Warum etwas so war, weißt du am besten.</p></section>
  </>;
}
function MonthSummary({ m, showCurrent }) {
  const rate = (a, cov) => (a && a.eligible ? `${pct(a.done, a.eligible)} %${cov < 30 ? ` (Daten aus ${cov} von 30 Tagen)` : ''}` : 'keine Daten');
  const wc = x => (x && x.delta != null ? `${signed(x.delta)} kg (${x.n} Messungen)` : `zu wenige Messungen${x ? ` (${x.n})` : ''}`);
  const tr = a => (a.avg != null ? `Ø ${fmtNum(a.avg, 1)} bei Ziel Ø ${fmtNum(a.goal, 1)} (${a.n} Wochen)` : `zu wenige vollständige Wochen (${a.n})`);
  return <>
    <p className="hint top0">Zeitraum bis {fmtDM(m.end)}. {m.planStart ? `Plan-Daten seit ${fmtDM(m.planStart)}${yy(m.planStart)}.` : 'Noch keine Plan-Daten.'} Fehlende Daten werden nicht geschätzt und nicht als 0 gezählt. Bewusst ohne Gesamtscore.</p>
    <div className="table-scroll"><table className="tbl cmp"><caption className="sr">Vergleich der Zeiträume</caption><thead><tr><th scope="col">Bereich</th><th scope="col">Letzte 30 Tage</th><th scope="col">30 Tage davor</th><th scope="col">90 Tage oder länger</th></tr></thead><tbody>
      <tr><th scope="row">Training pro Woche</th><td>{tr(m.training.now)}</td><td>{tr(m.training.prev)}</td><td>12 Wochen: {tr(m.training.w12)}</td></tr>
      <tr><th scope="row">Bewegungspausen</th><td>{rate(m.pauses.now, m.cov30)}</td><td>{rate(m.pauses.prev, m.cov60)}</td><td>nicht genug Daten</td></tr>
      <tr><th scope="row">Gewohnheiten</th><td>{rate(m.habits.now, 30)}</td><td>{rate(m.habits.prev, 30)}</td><td>nicht genug Daten</td></tr>
      <tr><th scope="row">Gewicht</th><td>{wc(m.weight.wc30)}</td><td>–</td><td>90 Tage: {wc(m.weight.wc90)}{m.weight.wcAll ? `, gesamt seit ${fmtDM(m.weight.firstW)}: ${wc(m.weight.wcAll)}` : ''}</td></tr>
      <tr><th scope="row">Schritte</th><td>{m.steps.now ? `Ø ${fmtNum(m.steps.now.avg)} an ${m.steps.now.n} Tagen` : 'nicht erfasst'}</td><td>{m.steps.prev ? `Ø ${fmtNum(m.steps.prev.avg)} an ${m.steps.prev.n} Tagen` : 'nicht erfasst'}</td><td>–</td></tr>
      {BETA.capture.includes('mahlzeit') && <tr><th scope="row">Mahlzeiten erfasst</th><td>{m.nutDays ? `${m.nutDays} Tage` : 'nicht erfasst'}</td><td>–</td><td>–</td></tr>}
    </tbody></table></div>
    <div className="panel">
      <BarChart data={m.training.series} goal={m.training.goalNow || null} goalLabel="Ziel aktuell" label="Trainingseinheiten der letzten zwölf Wochen" table="Einheiten" extraCol={['Ziel damals', d => (d.goal == null ? '–' : d.goal)]} coverageCol />
      <p className="legend"><span className="lg-bar" /> vollständig <span className="lg-bar faint" /> unvollständig <span className="lg-missing" /> Datenlücke</p>
      <CoverageNote text={m.training.gaps} />
    </div>
  </>;
}
function MonthGoals({ m }) {
  return <>
    <section className="r-sec"><h3 className="h3 top0">Ziele und Trend</h3><ul className="list">{m.goals.map(x => <li key={x.g} className="row compact"><div className="row-main static"><span className="row-title">{GOALS[x.g]}</span><span className="row-meta"><span>{x.status}</span><span className="tag tag-muted">{x.trend}</span></span></div></li>)}</ul>
      <p className="hint">Trends vergleichen die letzten 30 Tage mit den 30 Tagen davor, nur wenn beide Zeiträume ausreichend erfasst sind. Trainingsziele werden mit dem damals geltenden Ziel verglichen. Gewicht wird nur beschrieben, nicht bewertet.</p></section>
    <section className="r-sec"><h3 className="h3 top0">Routinen in den letzten 4 Wochen</h3>
      {m.good.length > 0 && <><p className="sub-l">Funktioniert gut</p><ul className="bars">{m.good.map(r => <li key={r.id}><span>{r.title}</span><Progress value={r.done} max={r.eligible} label={r.title} /><small>{r.done} von {r.eligible}</small></li>)}</ul></>}
      {m.problem.length > 0 && <><p className="sub-l">Schwierig</p><ul className="bars">{m.problem.map(r => <li key={r.id}><span>{r.title}</span><Progress value={r.done} max={r.eligible} label={r.title} /><small>{r.done} von {r.eligible}</small></li>)}</ul></>}
      {!m.good.length && !m.problem.length && <p className="hint top0">Noch zu wenige Termine für eine Einordnung. Das ist kein Problem, nur eine Datenlücke.</p>}
    </section>
  </>;
}
function MonthHealth({ ctx }) {
  const { data, cfg, today } = ctx;
  const recs = computeRecs(data, cfg, today);
  const labs = Object.keys(LAB_MARKERS).map(k => ({ k, a: labAssessment(data.labs, k, today) }));
  return <>
    <section className="r-sec"><h3 className="h3 top0">Empfehlungen mit Evidenz</h3>
      {recs.length ? <ul className="list">{recs.map(r => <li key={r.id} className="row compact"><button className="row-main" onClick={() => ctx.openSheet({ kind: 'rec', id: r.id })}><span className="row-title">{r.title}</span><span className="row-meta"><EvidenceBadge level={r.evidence_strength} /><span>{REC_STATUS[r.status]}</span>{r.lab_marker_id && <span>Demo-Laborwert</span>}</span></button></li>)}</ul> : <p className="hint top0">Keine passenden Empfehlungen.</p>}</section>
    <section className="r-sec"><h3 className="h3 top0">Laborwerte (fiktive Demo)</h3><ul className="plain">{labs.map(({ k, a }) => <li key={k}><b>{LAB_MARKERS[k].label}:</b> {a.state === 'auffaellig' ? `letzter Wert ${a.latest.value} ${a.latest.unit} außerhalb der Laborreferenz` : a.state === 'unauffaellig' ? 'innerhalb der Laborreferenz' : a.state === 'fehlt' ? 'kein Wert' : `keine Auswertung, ${a.reason}`}</li>)}</ul>
      <p className="hint">Keine Diagnose. Laborbefunde gehören in ärztliche Einordnung. Laborbezogene Inhalte werden nicht gespeichert.</p></section>
  </>;
}
function ShortSummary({ wm, mm }) {
  const items = [];
  if (wm.coverage === 'keine') items.push('Für die Woche liegen keine Plan-Daten vor.');
  else {
    items.push(wm.goal ? `Training: ${wm.trDone} von ${wm.goal}.` : `Training: ${wm.trDone}.`);
    if (wm.positives[0]) items.push(wm.positives.find(p => !p.startsWith('Trainingsziel') && !p.includes('Trainingseinheit')) || wm.positives[0]);
    if (wm.obstacles[0]) items.push(wm.obstacles[0]);
  }
  if (mm) items.push(mm.training.now.avg != null ? `Monat: Ø ${fmtNum(mm.training.now.avg, 1)} Trainings pro Woche in ${mm.training.now.n} vollständigen Wochen.` : 'Monat: zu wenige vollständige Wochen für einen Durchschnitt.');
  return <ul className="plain short">{items.slice(0, 4).map(x => <li key={x}>{x}</li>)}</ul>;
}
const STEPS = {
  week: { voll: [['woche', 'Deine Woche'], ['muster', 'Gut gelaufen und Hindernisse'], ['fragen', 'Kurz nachgedacht'], ['massnahmen', 'Was passen wir an?'], ['fertig', 'Abschluss']], kurz: [['kurz', 'Das Wichtigste'], ['massnahmen', 'Eine Anpassung'], ['fertig', 'Abschluss']] },
  month: { voll: [['status', 'Dein Monat'], ['ziele', 'Ziele und Routinen'], ['gesundheit', 'Gesundheit und Empfehlungen'], ['woche', 'Letzte Woche im Detail'], ['fragen', 'Kurz nachgedacht'], ['massnahmen', 'Prioritäten für den nächsten Monat'], ['fertig', 'Abschluss']], kurz: [['kurz', 'Das Wichtigste'], ['massnahmen', 'Eine Anpassung'], ['fertig', 'Abschluss']] },
  combined: { voll: [['status', 'Dein Monat'], ['wochekomplett', 'Deine Woche'], ['ziele', 'Ziele und Routinen'], ['gesundheit', 'Gesundheit und Empfehlungen'], ['fragen', 'Kurz nachgedacht'], ['massnahmen', 'Was passen wir an?'], ['fertig', 'Abschluss']], kurz: [['kurz', 'Das Wichtigste'], ['massnahmen', 'Eine Anpassung'], ['fertig', 'Abschluss']] },
};
function ReviewFlow({ review, ctx, answers, setAnswers, onDecide, onUndo, undoable, onFinish, onSnooze, onSkip, close, startStep = 0 }) {
  const { data, cfg, today } = ctx;
  const mode = review.mode === 'kurz' ? 'kurz' : 'voll';
  const steps = STEPS[review.kind][mode].filter(([k]) => k !== 'gesundheit' || BETA.recs);
  const [i, setI] = useState(startStep);
  const [confirmBoth, setConfirmBoth] = useState(false);
  const ref = useRef(null), titleRef = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; if (titleRef.current) titleRef.current.focus(); }, [i]);
  useEffect(() => { const k = e => { if (e.key === 'Escape') close(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  const wPeriod = review.weekPeriod || weeklyWindow(today, cfg).target;
  const wm = useMemo(() => weekMetrics(data, wPeriod, today, cfg), [review.key]);
  const mm = useMemo(() => (review.kind !== 'week' ? monthMetrics(data, review.period, today, cfg) : null), [review.key]);
  const merged = review.kind === 'week' ? wm : { ...wm, ...mm, ws: wm.ws, goal: wm.goal };
  const questions = useMemo(() => (mode === 'kurz' ? [] : pickQuestions(review.kind, merged, cfg, previousQuestionIds(data, review.kind, review.key)).filter(q => BETA.recs || q.id !== 'ernaehrung')), [review.key, mode]);
  const k = steps[i][0];
  const maxNew = mode === 'kurz' ? 1 : 3;
  const ansKey = JSON.stringify(answers);
  /* Vorschläge werden bei geänderten Antworten neu berechnet. Bereits entschiedene bleiben unverändert. */
  const measures = useMemo(() => (k === 'massnahmen' ? coachMeasures(review.kind === 'week' ? 'week' : 'month', review.kind === 'week' ? wm : { ...mm, weakHabit: wm.weakHabit, pauseHist2: wm.pauseHist2 }, answers, data, cfg, today, review.keys, maxNew).filter(x => BETA.recs || !x.id.startsWith('empfehlung-')) : []), [k, ansKey, data, cfg]);
  const [lastAns, setLastAns] = useState(null);
  useEffect(() => { if (k === 'massnahmen') setLastAns(a => (a === null ? ansKey : a)); }, [k]);
  const recs = review.keys.map(x => (data.reviews || {})[x] || {});
  const decidedList = recs.flatMap(r => r.measures || []).filter((x, n, arr) => arr.findIndex(y => y.id === x.id) === n);
  const decisions = Object.fromEntries(decidedList.map(x => [x.id, x.decision]));
  const done = recs.every(r => r.status === 'abgeschlossen');
  const running = useMemo(() => runningMeasures(data, review.keys, today), [review.key]);
  const setA = (id, v) => setAnswers({ ...answers, [id]: v });
  const legacy = decidedList.filter(x => !measures.some(m => m.id === x.id));
  const newOnes = done ? [] : measures.filter(m => !decisions[m.id]).slice(0, Math.max(0, maxNew - decidedList.filter(x => x.id !== 'fortfuehren').length));
  const shownMeasures = measures.filter(m => decisions[m.id]).concat(newOnes);
  const cfgNow = normalizeConfig(cfg);
  return <div className="ob review" role="dialog" aria-modal="true" aria-labelledby="rv-title">
    <div className="ob-inner">
      <div className="ob-top">
        <div className="ob-progress" style={{ gridTemplateColumns: `repeat(${steps.length},1fr)` }} aria-hidden="true">{steps.map((_, n) => <span key={n} className={n <= i ? 'on' : ''} />)}</div>
        <div className="ob-meta"><span aria-live="polite">{review.label}{mode === 'kurz' ? ', Kurzfassung' : ''}, Schritt {i + 1} von {steps.length}</span><button className="link" onClick={close}>Später fortsetzen</button></div>
      </div>
      <div className="ob-body" ref={ref}>
        <h1 id="rv-title" className="ob-title" tabIndex={-1} ref={titleRef}>{steps[i][1]}</h1>
        {i === 0 && <p className="ob-lead">{review.kind === 'week' ? `Woche vom ${fmtDM(wPeriod)} bis ${fmtDM(addDays(wPeriod, 6))}.` : review.kind === 'combined' ? `${review.sub}. Ein gemeinsamer Ablauf, Kennzahlen und Fragen erscheinen nur einmal.` : `${fmtYm(review.period)}.`} Etwa {mode === 'kurz' ? '1 bis 2' : review.minutes} Minuten.{done ? ' Dieses Review ist bereits abgeschlossen, du siehst es noch einmal an.' : ''}</p>}
        {k === 'kurz' && <><ShortSummary wm={wm} mm={mm} /><RunningMeasures list={running} /><p className="hint">Verpasste Tagesaufgaben sind abgeschlossen und werden nicht nachgeholt.</p></>}
        {k === 'woche' && <><WeekSummary m={wm} />{BETA.weight && <WeightQuick ctx={ctx} />}</>}
        {k === 'wochekomplett' && <><WeekSummary m={wm} /><PosNeg m={wm} />{BETA.weight && <WeightQuick ctx={ctx} />}</>}
        {k === 'muster' && <PosNeg m={wm} />}
        {k === 'status' && <MonthSummary m={mm} />}
        {k === 'ziele' && <MonthGoals m={mm} />}
        {k === 'gesundheit' && <MonthHealth ctx={ctx} />}
        {k === 'fragen' && <>
          <p className="ob-lead">Tippen genügt, alles ist freiwillig. Antworten fließen nur in die Vorschläge dieses Reviews ein und werden nicht gespeichert. Du kannst sie jederzeit ändern, die Vorschläge passen sich an.</p>
          {questions.map(q => <Question key={q.id} q={q} value={answers[q.id]} onChange={v => setA(q.id, v)} note={answers[`${q.id}:notiz`]} onNote={v => setA(`${q.id}:notiz`, v)} />)}
        </>}
        {k === 'massnahmen' && <>
          <RunningMeasures list={mode === 'kurz' ? [] : running} />
          <p className="ob-lead">{mode === 'kurz' ? 'Höchstens eine Anpassung.' : 'Höchstens drei neue Vorschläge, nach Relevanz sortiert.'} Nichts ändert sich ohne deine Bestätigung. Planänderungen gelten standardmäßig ab {fmtDM(nextMonday(today))}.</p>
          {lastAns !== null && lastAns !== ansKey && <p className="callout" role="status">Die Vorschläge wurden nach deinen geänderten Antworten neu berechnet.</p>}
          <div className="measures">
            {legacy.map((x, n) => <article key={x.id} className="measure decided"><div className="m-head"><span className="m-n">{n + 1}</span><h3 className="m-title">{x.title}</h3></div><dl className="m-dl"><dt>So prüfst du den Erfolg</dt><dd>{x.check}</dd></dl>
              <div className="m-decided-row"><p className="m-decided"><Icon name={x.decision === 'übernommen' ? 'check' : 'minus'} size={16} /> {x.decision === 'übernommen' ? 'Übernommen' : 'Nicht jetzt'}{x.validFrom ? ` ab ${fmtDM(x.validFrom)}` : ''}</p>{undoable(review, x.id) && <button className="btn small ghost" onClick={() => onUndo(review, x)}>Rückgängig machen</button>}</div></article>)}
            {shownMeasures.map((m, n) => <MeasureCard key={m.id} m={m} n={n + 1 + legacy.length} decision={decisions[m.id]} data={data} cfg={cfg} today={today} onDecide={(mm2, dec, from) => onDecide(review, mm2, dec, from)} onUndo={mm2 => onUndo(review, mm2)} canUndo={undoable(review, m.id)} />)}
            {!legacy.length && !shownMeasures.length && <Empty text="Keine neuen Vorschläge. Es gibt keinen neuen Anlass für eine Änderung." />}
          </div>
        </>}
        {k === 'fertig' && <>
          <section className="r-sec"><h3 className="h3 top0">Beschlossen</h3>{decidedList.filter(x => x.decision === 'übernommen').length ? <ul className="plain">{decidedList.filter(x => x.decision === 'übernommen').map(x => <li key={x.id}><b>{x.title}</b>{x.validFrom ? ` (ab ${fmtDM(x.validFrom)})` : ''}<br /><small>{x.check}</small></li>)}</ul> : <p className="hint top0">Keine Änderung beschlossen. Auch das ist eine Entscheidung.</p>}</section>
          {review.kind === 'combined' && !done && <label className="toggle confirm-both"><input type="checkbox" checked={confirmBoth} onChange={e => setConfirmBoth(e.target.checked)} /><span>Wochen-Check-in KW {isoWeek(review.weekPeriod)} und Monatsreview {fmtYm(review.period)} gemeinsam abschließen</span></label>}
          <p className="hint">{review.kind !== 'month' ? `Nächster Check-in: ${WD_LONG[cfgNow.review.weeklyDay]}, ${cfgNow.review.weeklyTime} Uhr.` : 'Nächstes Monatsreview zum Monatsende.'} Vergangene Reviews findest du unter Entwicklung.</p>
          <p className="hint">Gespeichert werden nur Status, Datum und beschlossene Plan-Maßnahmen. Antworten und Notizen nicht.</p>
        </>}
      </div>
      <div className="ob-foot">
        {i > 0 ? <button className="btn ghost" onClick={() => setI(i - 1)}>Zurück</button> : <button className="link" onClick={onSnooze}>Morgen erinnern</button>}
        {i === 0 && !done ? <button className="link" onClick={onSkip}>Überspringen</button> : <span />}
        {k !== 'fertig' ? <button className="btn primary" onClick={() => setI(i + 1)}>Weiter</button>
          : <button className="btn primary" disabled={review.kind === 'combined' && !done && !confirmBoth} onClick={() => onFinish(review, questions.map(q => q.id), mode)}>{done ? 'Schließen' : review.kind === 'combined' ? 'Beide abschließen' : 'Abschließen'}</button>}
      </div>
    </div>
  </div>;
}
function ReviewCard({ ctx }) {
  const { data, cfg, today, nowMin, startReview, snoozeReview, skipReview } = ctx;
  const offer = usableOffer(reviewOffer(data, cfg, today, nowMin), data, today);
  if (offer) return <section className="block" aria-labelledby="rv-h">
    <div className="review-card">
      <div className="rc-icon" aria-hidden="true"><Icon name="spark" size={20} /></div>
      <div>
        <h2 className="h2 top0" id="rv-h">{offer.label}</h2>
        <p className="hint top0">{offer.sub ? `${offer.sub}, ` : ''}etwa {offer.minutes} Minuten. Kurz zurückschauen und gemeinsam anpassen, was nicht passt. Die Kurzfassung dauert 1 bis 2 Minuten.</p>
        <div className="btn-row"><button className="btn small primary" onClick={() => startReview(offer)}>Starten</button><button className="btn small" onClick={() => startReview({ ...offer, mode: 'kurz' })}>Kurzfassung</button><button className="btn small ghost" onClick={() => snoozeReview(offer)}>Morgen</button><button className="btn small ghost" onClick={() => skipReview(offer)}>Diesmal überspringen</button></div>
      </div>
    </div>
  </section>;
  const w = weeklyDescriptor(today, cfg); const r = (data.reviews || {})[w.key];
  const next = nextWeeklyDate(today, cfg, data);
  if (r && r.status === 'abgeschlossen' && r.at === today) return <p className="review-done"><Icon name="check" size={16} /> Check-in erledigt.{next ? ` Der nächste ist am ${dayLabel(next, today)}.` : ''}</p>;
  return null;
}
function ReviewHistory({ ctx }) {
  const { data, today, cfg, startReview } = ctx;
  const [showNow, setShowNow] = useState(false);
  const entries = Object.entries(data.reviews || {}).sort((a, b) => b[0].localeCompare(a[0]));
  const weekly = entries.filter(([, r]) => r.kind === 'week').slice(0, 8);
  const goalNow = goalAt(data, weekStart(today));
  const ym = monthlyTarget(today) || ymOf(today);
  return <section className="block first">
    <h2 className="h2">Reviews</h2>
    <div className="btn-row top0">
      <button className="btn small primary" onClick={() => startReview(weeklyDescriptor(today, cfg))}>Wochen-Check-in öffnen</button>
      <button className="btn small" onClick={() => startReview(monthlyDescriptor(ym))}>Monatsreview öffnen</button>
    </div>
    {weekly.length > 0 ? <>
      <label className="toggle"><input type="checkbox" checked={showNow} onChange={e => setShowNow(e.target.checked)} /><span>Aktuelles Ziel ({goalNow}) zum Vergleich zeigen</span></label>
      <div className="table-scroll"><table className="tbl cmp"><caption className="sr">Vergangene Wochen-Check-ins</caption><thead><tr><th scope="col">Woche</th><th scope="col">Status</th><th scope="col">Training (Ziel damals)</th>{showNow && <th scope="col">Ziel aktuell</th>}<th scope="col">Pausen</th><th scope="col">Maßnahmen</th></tr></thead><tbody>
        {weekly.map(([k, r]) => { const ws = k.slice(2); const cov = weekCoverage(data, ws, today); const pa = adherence(data.items, ws, addDays(ws, 6), today, isPause); const g = goalAt(data, ws); return <tr key={k}>
          <td>KW {isoWeek(ws)}{r.demo ? ' (Demo)' : ''}{r.combined ? ', mit Monat' : ''}{r.mode === 'kurz' ? ', kurz' : ''}</td><td>{REVIEW_STATUS[r.status]}</td>
          <td>{cov === 'keine' ? 'keine Daten' : `${trainingsInWeek(data, ws)} von ${g}`}</td>{showNow && <td>{goalNow}</td>}
          <td>{pa.eligible ? `${pa.done} von ${pa.eligible}` : 'keine Daten'}</td>
          <td>{(r.measures || []).filter(x => x.decision === 'übernommen').map(x => <span key={x.id} className="m-line">{x.title}{evalMeasure(x, data, today) ? `: ${evalMeasure(x, data, today)}` : ''}</span>)}{!(r.measures || []).some(x => x.decision === 'übernommen') && '–'}</td></tr>; })}
      </tbody></table></div></> : <Empty text="Noch keine Reviews." />}
      <ReviewEntry ctx={ctx} />
    {entries.filter(([, r]) => r.kind === 'month').length > 0 && <p className="hint">Monatsreviews: {entries.filter(([, r]) => r.kind === 'month').map(([k, r]) => `${fmtYm(k.slice(2))} ${REVIEW_STATUS[r.status].toLowerCase()}`).join(', ')}.</p>}
    <p className="hint">Werte werden aus dem Plan neu berechnet. Das Trainingsziel ist das damals geltende Ziel aus den Routinenversionen. Antworten aus Reviews werden nicht gespeichert.</p>
  </section>;
}
function StepReviews({ cfg, setCfg }) {
  const r = cfg.review; const set = (k, v) => setCfg(c => ({ ...c, review: { ...c.review, [k]: v } }));
  return <>
    <Field label="Wochen-Check-in am"><Chips small options={WD.map((w, i) => [i, w])} value={r.weeklyDay} onChange={v => set('weeklyDay', v)} /></Field>
    <Field label="Uhrzeit"><input className="input" type="time" value={r.weeklyTime} onChange={e => set('weeklyTime', e.target.value)} /></Field>
    <Toggle checked={r.monthly} onChange={v => set('monthly', v)}>Monatsreview zum Monatsende anbieten</Toggle>
    <p className="hint">{r.weeklyDay >= 4 ? `Am ${WD_LONG[r.weeklyDay]} blickst du auf die laufende Woche zurück, verfügbar bis Mittwoch der Folgewoche.` : `Am ${WD_LONG[r.weeklyDay]} blickst du auf die Vorwoche zurück, verfügbar für drei Tage.`} Fallen Wochen- und Monatsreview zusammen, gibt es einen gemeinsamen Ablauf.</p>
  </>;
}

/* ---------------- Einrichtung & Einstellungen ---------------- */
function Chips({ options, value, onChange, multi, small }) {
  const sel = multi ? value : [value];
  return <div className="chips">{options.map(([k, l]) => {
    const on = sel.includes(k);
    return <button key={String(k)} className={`chip ${small ? 'sm' : ''} ${on ? 'on' : ''}`} aria-pressed={on}
      onClick={() => onChange(multi ? (on ? value.filter(x => x !== k) : [...value, k]) : k)}>{l}</button>;
  })}</div>;
}
function DayToggles({ value, onChange, enabled, label }) {
  return <div className="daytoggles" role="group" aria-label={label}>{WD.map((w, i) => {
    const on = value.includes(i); const dis = enabled && !enabled.includes(i);
    return <button key={i} className={`dt ${on ? 'on' : ''}`} aria-pressed={on} disabled={dis} onClick={() => onChange(on ? value.filter(x => x !== i) : [...value, i].sort((a, b) => a - b))}>{w}</button>;
  })}</div>;
}
function Stepper({ value, min, max, onChange, label }) {
  return <div className="stepper" role="group" aria-label={label}>
    <button className="icon-btn" aria-label={`${label} verringern`} disabled={value <= min} onClick={() => onChange(value - 1)}><Icon name="minus" /></button>
    <output aria-live="polite">{value}</output>
    <button className="icon-btn" aria-label={`${label} erhöhen`} disabled={value >= max} onClick={() => onChange(value + 1)}><Icon name="plus" /></button>
  </div>;
}
function Toggle({ checked, onChange, children }) {
  return <label className="toggle"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /><span>{children}</span></label>;
}
const setSec = (setCfg, sec, key) => v => setCfg(c => ({ ...c, [sec]: { ...c[sec], [key]: v } }));

function StepWeight({ body, setBody }) {
  const err = validateWeight(body.weight);
  return <>
    <Field label="Aktuelles Gewicht in kg (optional)"><input className="input" inputMode="decimal" value={body.weight} onChange={e => setBody(b => ({ ...b, weight: e.target.value }))} placeholder="z. B. 84,6" /></Field>
    <p className="hint top0">Nur für diese Sitzung als erste Messung. Wird nicht gespeichert. In der Demo bitte nur fiktive Werte.</p>
    {err && <p className="err" role="alert">{err}</p>}
  </>;
}
function StepGoals({ cfg, setCfg }) {
  const move = (i, dir) => setCfg(c => { const g = [...c.goals]; const j = i + dir; if (j < 0 || j >= g.length) return c; [g[i], g[j]] = [g[j], g[i]]; return { ...c, goals: g }; });
  return <>
    <p className="hint">{BETA.goalHint}</p>
      <Chips multi options={Object.entries(GOALS).filter(([k]) => !BETA.hiddenGoals.includes(k))} value={cfg.goals} onChange={v => setCfg(c => ({ ...c, goals: v }))} />
    {cfg.goals.length > 1 && <>
      <h3 className="h3">Reihenfolge nach Wichtigkeit</h3>
      <ol className="rank">{cfg.goals.map((g, i) => <li key={g}>
        <span className="rank-n">{i + 1}</span><span className="rank-t">{GOALS[g]}</span>
        <button className="icon-btn sm" aria-label={`${GOALS[g]} wichtiger`} disabled={i === 0} onClick={() => move(i, -1)}><Icon name="up" size={18} /></button>
        <button className="icon-btn sm" aria-label={`${GOALS[g]} weniger wichtig`} disabled={i === cfg.goals.length - 1} onClick={() => move(i, 1)}><Icon name="down" size={18} /></button>
      </li>)}</ol>
    </>}
    <p className="hint">{cfg.goals.length ? 'Priorität 1 bestimmt, worauf sich der Hinweis auf „Heute“ konzentriert, und welche Gewohnheiten vorgeschlagen werden.' : 'Ohne Auswahl plant HealthOS ausgewogen mit Bewegung und Training.'}</p>
  </>;
}
function StepWork({ cfg, setCfg }) {
  const w = cfg.work; const set = k => v => setSec(setCfg, 'work', k)(v);
  const err = workError(cfg);
  const l = toMin(w.lunch), s = toMin(w.start), e = toMin(w.end);
  return <>
    <Field label="Arbeitstage"><DayToggles label="Arbeitstage" value={w.days} onChange={v => setCfg(c => ({ ...c, work: { ...c.work, days: v, home: c.work.home.filter(d => v.includes(d)) } }))} /></Field>
    <Field label="Davon im Homeoffice"><DayToggles label="Homeoffice-Tage" value={w.home} enabled={w.days} onChange={set('home')} /></Field>
    {w.days.length ? <>
      <div className="grid2">
        <Field label="Arbeitsbeginn"><input className="input" type="time" value={w.start} onChange={ev => set('start')(ev.target.value)} /></Field>
        <Field label="Arbeitsende"><input className="input" type="time" value={w.end} onChange={ev => set('end')(ev.target.value)} /></Field>
        <Field label="Mittagspause ab"><input className="input" type="time" value={w.lunch} onChange={ev => set('lunch')(ev.target.value)} /></Field>
        <Field label="Dauer"><select className="input" value={w.lunchDur} onChange={ev => set('lunchDur')(Number(ev.target.value))}>{[15, 30, 45, 60].map(m => <option key={m} value={m}>{m} Min.</option>)}</select></Field>
      </div>
      {!err && l != null && (l < s || l > e) && <p className="hint">Die Mittagspause liegt außerhalb der Arbeitszeit. Das ist möglich, bitte kurz prüfen.</p>}
    </> : <p className="hint">Ohne Arbeitstage plant HealthOS keine Bewegungspausen. Training liegt dann zu den Zeiten fürs Wochenende.</p>}
    {err && <p className="err" role="alert">{err}</p>}
  </>;
}
function StepBreaks({ cfg, setCfg }) {
  const b = cfg.breaks; const lunch = toMin(cfg.work.lunch), end = toMin(cfg.work.end);
  const pm = lunch != null && end != null ? hm(r15((lunch + (cfg.work.lunchDur || 30) + end) / 2)) : null;
  return <>
    <Field label="Bewegungspausen pro Arbeitstag"><Chips options={[[0, 'Keine'], [1, 'Eine'], [2, 'Zwei']]} value={b.perDay} onChange={setSec(setCfg, 'breaks', 'perDay')} /></Field>
    {b.perDay > 0 && <Field label="Dauer je Pause"><Chips options={[5, 10, 15, 20].map(m => [m, `${m} Min.`])} value={b.duration} onChange={setSec(setCfg, 'breaks', 'duration')} /></Field>}
    <p className="hint">{!cfg.work.days.length ? 'Ohne Arbeitstage werden keine Bewegungspausen geplant.' : b.perDay === 0 ? 'Es werden keine Pausen eingeplant.' : `Erste Pause zur Mittagszeit um ${cfg.work.lunch || '–'} Uhr${b.perDay === 2 && pm ? `, zweite am Nachmittag um ${pm} Uhr` : ''}. Im Homeoffice und im Büro mit passenden Ideen.`}</p>
  </>;
}
function StepTraining({ cfg, setCfg }) {
  const t = cfg.training; const set = k => setSec(setCfg, 'training', k);
  return <>
    <Field label="Wo kannst du trainieren oder dich bewegen?"><Chips multi options={Object.entries(PLACES).map(([k, p]) => [k, p.label])} value={t.places} onChange={set('places')} /></Field>
    <Field label="Trainingseinheiten pro Woche"><Stepper label="Trainingseinheiten pro Woche" value={t.perWeek} min={0} max={5} onChange={set('perWeek')} /></Field>
    {t.perWeek > 0 && <>
      <Field label="Bevorzugte Tage" hint={t.days.length < t.perWeek ? 'Fehlende Tage ergänzt die Planung automatisch mit möglichst viel Abstand.' : null}><DayToggles label="Bevorzugte Trainingstage" value={t.days} onChange={set('days')} /></Field>
      <Field label="Bevorzugte Tageszeit"><Chips options={Object.entries(SLOTS)} value={t.slot} onChange={set('slot')} /></Field>
      <Field label="Dauer je Einheit"><Chips options={[20, 30, 45, 60, 75, 90].map(m => [m, `${m} Min.`])} value={t.duration} onChange={set('duration')} /></Field>
    </>}
    <Toggle checked={t.freeDay} onChange={set('freeDay')}>Mindestens einen freien Tag ohne Training einplanen</Toggle>
    {!t.places.length && t.perWeek > 0 && <p className="hint">Ohne Auswahl heißt die Einheit „Training nach Wahl“.</p>}
  </>;
}
function StepNutrition({ cfg, setCfg, onTouch, body, setBody }) {
  const n = cfg.nutrition; const set = k => setSec(setCfg, 'nutrition', k);
  return <>
    {BETA.capture.includes('mahlzeit') && <Toggle checked={n.calories} onChange={v => setCfg(c => ({ ...c, nutrition: { ...c.nutrition, calories: v, habitsFirst: v ? false : c.nutrition.habitsFirst } }))}>Kalorien und Makros erfassen</Toggle>}
    <Toggle checked={n.habitsFirst} onChange={v => setCfg(c => ({ ...c, nutrition: { ...c.nutrition, habitsFirst: v, calories: v ? false : c.nutrition.calories } }))}>Zunächst nur Ernährungsgewohnheiten verbessern, ohne Kalorien</Toggle>
    {BETA.weight && <Toggle checked={n.weight} onChange={set('weight')}>Gewicht tracken</Toggle>}
    {n.weight && <Field label="Wie oft wiegen?"><Chips options={[[1, '1× pro Woche'], [2, '2×'], [3, '3×']]} value={n.weightPerWeek} onChange={set('weightPerWeek')} /></Field>}
    {n.weight && body && setBody && <StepWeight body={body} setBody={setBody} />}
    {n.weight && <p className="hint top0">Gewicht erfassen ist optional. Fehlt eine Messung, gilt sie als nicht erfasst, nicht als Rückstand.</p>}
    <h3 className="h3">Gewohnheiten</h3>
    <Chips multi options={Object.entries(HABIT_LIBRARY).filter(([k]) => k !== 'vielfalt').map(([k, h]) => [k, h.name])} value={cfg.habits} onChange={v => { onTouch && onTouch(); setCfg(c => ({ ...c, habits: v.slice(0, 5) })); }} />
    <div className="btn-row"><button className="btn small" onClick={() => { onTouch && onTouch(); setCfg(c => ({ ...c, habits: suggestHabits(c.goals) })); }}>Vorschlag passend zu meinen Zielen</button></div>
    <p className="hint">Höchstens fünf. Eigene Gewohnheiten legst du in der Woche oder über die Ideen auf Heute an.</p>
  </>;
}
function StepReminders({ cfg, setCfg }) {
  const r = cfg.reminders; const set = k => setSec(setCfg, 'reminders', k);
  return <>
    <Field label="Wie deutlich sollen Hinweise sein?"><Chips options={Object.entries(INTENSITIES).map(([k, v]) => [k, v[0]])} value={r.intensity} onChange={set('intensity')} /></Field>
    <p className="hint top0">{INTENSITIES[r.intensity][1]}</p>
    <Field label="Tonalität der Motivation"><Chips options={Object.entries(TONES).map(([k, v]) => [k, v[0]])} value={cfg.motivation} onChange={v => setCfg(c => ({ ...c, motivation: v }))} /></Field>
    <p className="example">Beispiel: {TONES[cfg.motivation][1]}</p>
    <div className="grid2">
      <Field label="Ruhezeit ab"><input className="input" type="time" value={r.quietFrom} onChange={e => set('quietFrom')(e.target.value)} /></Field>
      <Field label="Ruhezeit bis"><input className="input" type="time" value={r.quietTo} onChange={e => set('quietTo')(e.target.value)} /></Field>
    </div>
    <Field label="Vorlauf für Erinnerungen"><Chips options={[[0, 'Zur Zeit'], [10, '10 Min.'], [15, '15 Min.'], [30, '30 Min.']]} value={r.lead} onChange={set('lead')} /></Field>
    <p className="hint">In der Ruhezeit plant HealthOS nichts ein. Push-Benachrichtigungen gibt es noch nicht, Hinweise erscheinen nur in der App. Der Vorlauf wird gespeichert und greift, sobald Push verfügbar ist.</p>
  </>;
}
function PlanPreview({ cfg }) {
  const plan = useMemo(() => buildPlan(cfg), [cfg]);
  const s = plan.summary;
  return <div className="plan">
    <div className="plan-sum">
      <div><b>{s.trainings}</b><span>Trainings</span></div>
      <div><b>{s.pauses}</b><span>Bewegungspausen</span></div>
      <div><b>{fmtNum(s.activeMin / 60, 1)} h</b><span>Aktivität pro Woche</span></div>
    </div>
    <ul className="plan-days">{[0, 1, 2, 3, 4, 5, 6].map(d => {
      const rs = plan.routines.filter(r => r.days.includes(d)).sort((a, b) => a.time.localeCompare(b.time));
      return <li key={d} className={d === plan.freeDay ? 'free' : ''}>
        <span className="pd-wd">{WD[d]}</span>
        <div className="pd-items">
          {d === plan.freeDay && <span className="tag tag-sun">Freier Tag</span>}
          {rs.length ? rs.map(r => <span key={r.key} className={`pd-item t-${r.type}`}><Icon name={(TYPES[r.type] || TYPES.sonstiges).icon} size={14} /><b>{r.time}</b> {r.title}{r.duration > 5 ? `, ${r.duration} Min.` : ''}</span>) : <span className="muted">nichts geplant</span>}
        </div>
      </li>;
    })}</ul>
    {plan.warn.map(w => <p key={w} className="callout warn">{w}</p>)}
    {plan.notes.map(n => <p key={n} className="hint">{n}</p>)}
    {cfg.habits.length > 0 && <p className="hint">Gewohnheiten zum Abhaken: {cfg.habits.map(h => HABIT_LIBRARY[h].name).join(', ')}.</p>}
  </div>;
}
const OB_STEPS = [
  ['ziele', 'Was möchtest du erreichen?', 'Wähle aus und sortiere nach Wichtigkeit.'],
  ['arbeit', 'Dein Arbeitsalltag', 'Damit Pausen und Training in deinen Tag passen.'],
  ['pausen', 'Bewegung während der Arbeit', 'Kurze Pausen, die realistisch in den Alltag passen.'],
  ['training', 'Training', 'Wo, wie oft und wann du trainieren möchtest.'],
  ['ernaehrung', 'Ernährung und Tracking', 'Was du festhalten möchtest. Alles optional.'],
  ['erinnerungen', 'Hinweise und Motivation', 'Wie deutlich HealthOS dich erinnern soll.'],
  ['plan', 'Dein Wochenplan', 'Prüfe den Vorschlag. Termine haben eine Uhrzeit, Gewohnheiten nicht. Pausen, Gewicht und Erinnerungen stellst du später in den Einstellungen ein. In der Beta gibt es keine Mahlzeitenerfassung.'],
].filter(([k]) => !BETA.obSkip.includes(k));
function StepContent({ k, cfg, setCfg, body, setBody, onTouch }) {
  if (k === 'ziele') return <StepGoals cfg={cfg} setCfg={setCfg} />;
  if (k === 'arbeit') return <StepWork cfg={cfg} setCfg={setCfg} />;
  if (k === 'pausen') return <StepBreaks cfg={cfg} setCfg={setCfg} />;
  if (k === 'training') return <StepTraining cfg={cfg} setCfg={setCfg} />;
  if (k === 'ernaehrung') return <StepNutrition cfg={cfg} setCfg={setCfg} onTouch={onTouch} body={body} setBody={setBody} />;
  if (k === 'erinnerungen') return <StepReminders cfg={cfg} setCfg={setCfg} />;
  if (k === 'reviews') return <StepReviews cfg={cfg} setCfg={setCfg} />;
  return <PlanPreview cfg={cfg} />;
}
function Onboarding({ initial, initialBody, onDone, onLater, startStep = 0 }) {
  const [i, setI] = useState(startStep);
  const [cfg, setCfg] = useState(() => normalizeConfig(initial));
  const [body, setBody] = useState(initialBody || { weight: '' });
  const [err, setErr] = useState('');
  const [touched, setTouched] = useState(false);
  const ref = useRef(null);
  const [k, title, lead] = OB_STEPS[i];
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; setErr(''); if ((k === 'ernaehrung' || (k === 'plan' && BETA.obSkip.includes('ernaehrung'))) && !touched) setCfg(c => ({ ...c, habits: suggestHabits(c.goals) })); }, [i]);
  const check = () => (k === 'ernaehrung' ? (cfg.nutrition.weight ? validateWeight(body.weight) : '') : k === 'arbeit' ? workError(cfg) : '');
  const next = () => { const e = check(); if (e) return setErr(e); if (i < OB_STEPS.length - 1) setI(i + 1); else onDone(cfg, body); };
  const skip = () => {
    if (k === 'ernaehrung') setBody({ weight: '' });
    if (k === 'arbeit' && workError(cfg)) setCfg(c => ({ ...c, work: clone(DEFAULT_CONFIG.work) }));
    setI(i + 1);
  };
  return <div className="ob" role="dialog" aria-modal="true" aria-labelledby="ob-title">
    <div className="ob-inner">
      <div className="ob-top">
        <div className="ob-progress" aria-hidden="true">{OB_STEPS.map((_, n) => <span key={n} className={n <= i ? 'on' : ''} />)}</div>
        <div className="ob-meta"><span>Schritt {i + 1} von {OB_STEPS.length}</span><button className="link" onClick={onLater}>Später einrichten</button></div>
      </div>
      <div className="ob-body" ref={ref}>
        <h1 id="ob-title" className="ob-title">{title}</h1>
        <p className="ob-lead">{lead}</p>
        <div className="form"><StepContent k={k} cfg={cfg} setCfg={setCfg} body={body} setBody={setBody} onTouch={() => setTouched(true)} /></div>
        {err && <p className="err" role="alert">{err}</p>}
      </div>
      <div className="ob-foot">
        {i > 0 ? <button className="btn ghost" onClick={() => setI(i - 1)}>Zurück</button> : <span />}
        {k !== 'plan' ? <button className="link" onClick={skip}>Überspringen</button> : <span />}
        <button className="btn primary" onClick={next}>{k === 'plan' ? 'Plan übernehmen' : 'Weiter'}</button>
      </div>
    </div>
  </div>;
}
const SET_SECTIONS = [['ziele', 'Ziele und Priorität'], ['arbeit', 'Arbeitsalltag'], ['pausen', 'Bewegungspausen'], ['training', 'Training'], ['ernaehrung', 'Ernährung, Tracking und Gewohnheiten'], ['erinnerungen', 'Hinweise und Motivation'], ['reviews', 'Wochen-Check-in und Monatsreview']];
function sectionSummary(k, c) {
  if (k === 'reviews') return `${WD_LONG[c.review.weeklyDay]}, ${c.review.weeklyTime} Uhr${c.review.monthly ? ', Monatsreview an' : ', Monatsreview aus'}`;
  if (k === 'ziele') return c.goals.length ? c.goals.map(g => GOALS[g]).join(', ') : 'keine gewählt';
  if (k === 'arbeit') return c.work.days.length ? `${c.work.days.map(d => WD[d]).join(' ')}, ${c.work.start} bis ${c.work.end}` : 'keine Arbeitstage';
  if (k === 'pausen') return c.breaks.perDay ? `${c.breaks.perDay}× pro Arbeitstag, ${c.breaks.duration} Min.` : 'keine';
  if (k === 'training') return c.training.perWeek ? `${c.training.perWeek}× pro Woche, ${SLOTS[c.training.slot].toLowerCase()}, ${c.training.duration} Min.` : 'kein Training geplant';
  if (k === 'ernaehrung') return [c.nutrition.calories && 'Kalorien', c.nutrition.habitsFirst && 'Gewohnheiten zuerst', c.nutrition.weight && `Gewicht ${c.nutrition.weightPerWeek}×/Woche`].filter(Boolean).join(', ') || 'kein Tracking';
  return `${INTENSITIES[c.reminders.intensity][0]}, Ton ${TONES[c.motivation][0].toLowerCase()}, Ruhe ${c.reminders.quietFrom} bis ${c.reminders.quietTo}`;
}
function StorageInfo({ store }) {
  const t = store.savedAt ? new Date(store.savedAt).toLocaleString('de-DE', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
  if (store.status === 'pending') return <p className="hint">Speicher wird geprüft …</p>;
  if (store.status === 'ready') return <>
    <p className="store-ok"><Icon name="check" size={16} /> Persönlicher Speicher aktiv{t ? `, zuletzt gespeichert ${t} Uhr` : ''}.</p>
    <p className="hint">{BETA.storageText}</p>
    {store.migrated && <p className="hint">Gespeicherte Daten wurden von Version {store.migrated} auf Version {SCHEMA} übertragen.</p>}
    {store.error && <p className="err" role="alert">{store.error}</p>}
  </>;
  if (store.status === 'error') return <p className="err" role="alert">Der Speicher konnte nicht geladen werden ({store.message}). Änderungen gelten nur bis zum Neuladen.</p>;
  return <p className="hint">In dieser Ansicht ist kein persönlicher Speicher verfügbar, etwa wenn du abgemeldet bist oder die Seite außerhalb von Claude geöffnet ist. Alles gilt nur bis zum Neuladen.</p>;
}
function Settings({ ctx, cfg, applyConfig, store, theme, setTheme, onExport, onImport, onDeleteStored, onRestart, onResetDemo }) {
  const { data, today, commit, openSheet } = ctx;
  const [draft, setDraft] = useState(cfg);
  useEffect(() => setDraft(cfg), [cfg]);
  const [open, setOpen] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(cfg);
  const err = workError(draft);
  const preview = useMemo(() => { if (!dirty || err) return null; const sync = syncPlanRoutines(data.routines, draft, today); const m = materialize({ ...data, routines: sync.routines }, today); return { diff: planDiff(data.items, m.items, today), kept: sync.kept }; }, [draft, data, dirty, err]);
  const diff = preview && preview.diff;
  const fileRef = useRef(null);
  const [imp, setImp] = useState(null);
  const readFile = e => {
    const file = e.target.files && e.target.files[0]; e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setImp({ error: 'Die Datei ist größer als 5 MB.' });
    const fr = new FileReader();
    fr.onload = () => { try { setImp(parseImport(JSON.parse(String(fr.result)))); } catch (x) { setImp({ error: 'Die Datei ist kein gültiges JSON.' }); } };
    fr.onerror = () => setImp({ error: 'Die Datei konnte nicht gelesen werden.' });
    fr.readAsText(file);
  };
  const pauses = [...(data.pauses || [])].sort((a, b) => a.from.localeCompare(b.from));
  return <div className={`screen ${dirty ? 'has-apply' : ''}`}>
    <header className="page-head"><h1 className="h1">Einstellungen</h1></header>
    {cfg.skipped && <p className="callout">Du nutzt noch den {BETA.demoData ? 'Demo-Plan' : 'Standardplan'}. <button className="link inline" onClick={onRestart}>Einrichtung starten</button></p>}
    {store.status === 'ready' && store.offline && <p className="callout warn">Offline. Änderungen gelten vorerst nur in dieser Sitzung und werden gespeichert, sobald wieder eine Verbindung besteht und du etwas änderst.</p>}

    <section className="block first">
      <h2 className="h2">Deine Angaben</h2>
      <ul className="set-list">{SET_SECTIONS.map(([k, l]) => <li key={k} className={open === k ? 'open' : ''}>
        <button className="set-head" aria-expanded={open === k} onClick={() => setOpen(open === k ? null : k)}>
          <span><b>{l}</b><small>{sectionSummary(k, draft)}</small></span><Icon name={open === k ? 'up' : 'down'} size={18} />
        </button>
        {open === k && <div className="set-body form"><StepContent k={k} cfg={draft} setCfg={setDraft} /></div>}
      </li>)}
      </ul>
    </section>

    <section className="block">
      <div className="h2-row"><h2 className="h2">{dirty ? 'Neuer Wochenplan, Vorschau' : 'Dein Wochenplan'}</h2></div>
      <div className="panel"><PlanPreview cfg={draft} /></div>
    </section>

    <section className="block">
      <h2 className="h2">Routinen</h2>
      <button className="btn wide" onClick={() => ctx.go('routinen')}><Icon name="repeat" size={18} /> Routinen verwalten ({data.routines.filter(r => r.status === 'aktiv').length} aktiv)</button>
      <p className="hint">Einzelne Routinen bearbeiten, pausieren, archivieren oder duplizieren. Von dir angepasste Routinen bleiben bei Änderungen am Wochenplan unverändert.</p>
    </section>

    <section className="block">
      <h2 className="h2">Pausen und Ausnahmen</h2>
      {pauses.length ? <ul className="list">{pauses.map(p => <li key={p.id} className="row compact">
        <div className="row-main static"><span className="row-title">{PAUSE_KINDS[p.kind]}</span><span className="row-meta"><span>{fmtDM(p.from)} bis {fmtDM(p.to)}</span><span>{p.scope === 'alle' ? 'alle Routinen' : 'nur Training'}</span>{p.to < today && <span>abgelaufen</span>}</span></div>
        <button className="icon-btn sm" aria-label={`Pause ${PAUSE_KINDS[p.kind]} vom ${fmtDM(p.from)} entfernen`} onClick={() => commit(d => A.removePause(d, p.id, today), 'Pause entfernt')}><Icon name="trash" size={16} /></button>
      </li>)}</ul> : <Empty text="Keine Pause eingetragen." />}
      <button className="btn block-btn" onClick={() => openSheet({ kind: 'pause' })}><Icon name="pause" size={18} /> Pause eintragen</button>
    </section>

    <section className="block">
      <h2 className="h2">Speicherung</h2>
      <div className="panel">
        <StorageInfo store={store} />
        <div className="btn-row">
          <button className="btn small" onClick={onExport}>Plan als JSON exportieren</button>
          {store.status === 'ready' && (confirmDel
            ? <><button className="btn small danger-solid" onClick={() => { setConfirmDel(false); onDeleteStored(); }}>Endgültig löschen</button><button className="btn small ghost" onClick={() => setConfirmDel(false)}>Abbrechen</button></>
            : <button className="btn small" onClick={() => setConfirmDel(true)}>Gespeicherte Daten löschen</button>)}
        </div>
        <p className="hint">Der Export ist eine lokale Datei auf deinem Gerät mit Einstellungen, Routinen und Plan in einer Tabellenstruktur für die spätere Übernahme nach Supabase. Messwerte, Laborwerte und Termine sind nicht enthalten.</p>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr" onChange={readFile} aria-label="Exportdatei auswählen" />
        <button className="btn small" onClick={() => fileRef.current && fileRef.current.click()}>Export importieren</button>
        {imp && (imp.error ? <p className="err" role="alert">{imp.error}</p> : <div className="callout">
          <p className="top0">Gefunden: {imp.counts.routines} Routinen, {imp.counts.items} Einträge, {imp.counts.pauses} Pausen. Der Import ersetzt Einstellungen, Routinen, Plan, Gewohnheiten und Pausen.</p>
          <div className="btn-row"><button className="btn small primary" onClick={() => { onImport(imp.state); setImp(null); }}>Importieren</button><button className="btn small ghost" onClick={() => setImp(null)}>Abbrechen</button></div>
        </div>)}
      </div>
    </section>

    {ctx.account && <PushSettings ctx={ctx} />}
    {ctx.account && <section className="block">
      <h2 className="h2">Konto</h2>
      <div className="panel">
        <p className="hint top0">Angemeldet als {ctx.account.email}.</p>
        <div className="btn-row"><button className="btn small" onClick={ctx.account.signOut}>Abmelden</button></div>
        <p className="legal-links"><a href="/impressum">Impressum</a><a href="/datenschutz">Datenschutz</a>{BETA.feedbackEmail && <a href={`mailto:${BETA.feedbackEmail}?subject=HealthOS%20Beta%20Feedback`}>Feedback senden</a>}</p>
        <AccountExtras ctx={ctx} />
      </div>
    </section>}
    <section className="block">
      <h2 className="h2">{BETA.demoData ? 'Darstellung und Demo' : 'Darstellung'}</h2>
      <Segmented label="Farbschema" value={theme} onChange={setTheme} options={[['system', 'System'], ['light', 'Hell'], ['dark', 'Dunkel']]} />
      <div className="btn-row">
        <button className="btn small" onClick={onRestart}>Einrichtung erneut starten</button>
        {BETA.demoData && <button className="btn small" onClick={onResetDemo}>Demo-Daten zurücksetzen</button>}
      </div>
    </section>

    {dirty && <div className="apply-bar" role="region" aria-label="Änderungen übernehmen">
      <p>{err ? err : diff ? `Ab heute: ${diff.added} neu, ${diff.changed} geändert, ${diff.removed} entfallen. Vergangenes und Erledigtes bleibt unverändert.` : ''}{preview && preview.kept.length ? ` ${preview.kept.length} von dir angepasste ${preview.kept.length === 1 ? 'Routine bleibt' : 'Routinen bleiben'} unverändert.` : ''}</p>
      <div className="btn-row">
        <button className="btn small ghost" onClick={() => setDraft(cfg)}>Verwerfen</button>
        <button className="btn small primary" disabled={!!err} onClick={() => applyConfig({ ...draft, onboardingDone: true, skipped: false }, 'Wochenplan angepasst')}>Übernehmen</button>
      </div>
    </div>}
  </div>;
}

/* ---------------- App ---------------- */
const TABS = [['heute', 'Heute', 'sun'], ['woche', 'Woche', 'calendar'], ['erfassen', 'Erfassen', 'plus'], ['entwicklung', 'Entwicklung', 'trend'], ['gesundheit', 'Gesundheit', 'heart']].filter(([k]) => k !== 'gesundheit' || BETA.healthTab);
const EMPTY_BODY = { weight: '' };
const TAB_OF = { routinen: 'woche', einstellungen: null };
function App({ initialTab = 'heute', initialSheet = null, initialCapture = 'training', initialHealth = 'fuerdich', initialConfig = null, initialStore = null, initialOnboarding = false, getNow = () => new Date(), account = null }) {
  const [clock, setClock] = useState(() => berlinParts(getNow()));
  const today = clock.date, nowMin = clock.minutes;
  const [cfg, setCfg] = useState(() => BETA.restrictConfig(normalizeConfig(initialConfig || DEFAULT_CONFIG)));
  const [data, setData] = useState(() => (BETA.demoData ? seed : emptyState)(today, BETA.restrictConfig(normalizeConfig(initialConfig || DEFAULT_CONFIG))));
  const [body, setBody] = useState(EMPTY_BODY);
  const [tab, setTab] = useState(initialTab);
  const [captureSeg, setCaptureSeg] = useState(initialCapture);
  const [healthSeg, setHealthSeg] = useState(initialHealth);
  const [sheet, setSheet] = useState(initialSheet);
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState('system');
  const [store, setStore] = useState(initialStore || { status: 'pending' });
  const [showOb, setShowOb] = useState(initialOnboarding);
  const [review, setReview] = useState(null);
  const [answers, setAnswers] = useState({});
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  const undoRef = useRef(null);
  const deleting = useRef(false);
  const conn = useRef(null), lastSaved = useRef({}), chain = useRef(Promise.resolve()), settled = useRef(false), lastDay = useRef(today);
  const say = (msg, undo = false) => setToast({ msg, undo, k: Date.now() + Math.random() });

  /* Uhr und Tageswechsel in Europe/Berlin: Intervall, Rückkehr aus dem Hintergrund, Fokus */
  useEffect(() => {
    const tick = () => setClock(c => { const n = berlinParts(getNow()); return n.date !== c.date || n.minutes !== c.minutes ? n : c; });
    const t = setInterval(tick, 30000);
    const vis = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', vis); window.addEventListener('focus', tick); window.addEventListener('pageshow', tick);
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); window.removeEventListener('focus', tick); window.removeEventListener('pageshow', tick); window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  useEffect(() => { if (lastDay.current !== today) { lastDay.current = today; undoRef.current = null; setData(d => materialize(d, today)); } }, [today]);
  useEffect(() => { const el = document.documentElement; if (theme === 'system') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4500); return () => clearTimeout(t); }, [toast]);

  /* Laden aus dem persönlichen Artifact-Speicher inklusive Migration älterer Stände */
  useEffect(() => {
    if (initialStore) return;
    let cancelled = false;
    const finish = s => { if (settled.current || cancelled) return; settled.current = true; setStore(s); if (s.status !== 'ready' || !s.restored) setShowOb(true); };
    const timer = setTimeout(() => finish({ status: 'none' }), 8000);
    (async () => {
      try {
        const c = await Store.connect();
        if (!c) return finish({ status: 'none' });
        const saved = await Store.load(c);
        if (settled.current || cancelled) return;
        conn.current = c;
        if (saved) {
          const m = migrateSaved(saved);
          saved.weeks.forEach(w => { lastSaved.current[`week:${w.id}`] = '?'; });
          setCfg(BETA.restrictConfig(m.cfg));
          if (m.theme) setTheme(m.theme);
          setData(d => {
            const st = { ...d, routines: m.routines, recState: m.recState, reviews: m.reviews, items: m.items, habits: m.habits || d.habits, habitLog: m.habitLog, pauses: m.pauses, dismissed: m.dismissed, ...(saved.activity ? { workouts: saved.activity.workouts || [], steps: saved.activity.steps || [] } : {}), ...(saved.koerper ? { weights: saved.koerper.weights || [] } : {}) };
            const mat = materialize(st, today);
            return { ...mat, habits: syncHabits(mat.habits, m.cfg) };
          });
          finish({ status: 'ready', savedAt: saved.settings.savedAt || null, restored: !!m.cfg.onboardingDone, migrated: m.fromSchema < SCHEMA ? m.fromSchema : null });
        } else finish({ status: 'ready', savedAt: null, restored: false });
      } catch (e) { finish({ status: 'error', message: (e && (e.code || e.message)) || 'unbekannt' }); }
    })();
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  /* Speichern: nur geänderte Dokumente, nacheinander, nach kurzer Pause */
  const saveDocs = async docs => {
    const c = conn.current; if (!c || deleting.current) return;
    const r = Store.refs(c);
    Object.keys(lastSaved.current).forEach(k => { if (k.startsWith('week:') && !docs[k]) docs[k] = { schema: SCHEMA, weekStart: k.slice(5), items: [] }; });
    let wrote = false;
    try {
      for (const [k, b] of Object.entries(docs)) {
        const s = JSON.stringify(b);
        if (lastSaved.current[k] === s) continue;
        const ref = k === 'settings' ? r.settings : k === 'plan' ? r.plan : k === 'habits' ? r.habits : k === 'activity' ? r.activity : k === 'koerper' ? r.koerper : r.weeks.doc(k.slice(5));
        await Store.write(ref, { ...b, savedAt: new Date().toISOString() });
        lastSaved.current[k] = s; wrote = true;
      }
      if (wrote) setStore(st => ({ ...st, savedAt: new Date().toISOString(), error: null }));
    } catch (e) {
      const code = e && e.code;
      setStore(st => ({ ...st, error: code === 'quota_exceeded' ? 'Der Speicher ist voll. Lösche gespeicherte Daten oder setze die Demo zurück.' : code === 'revoked' ? 'Der Zugriff auf den Speicher wurde beendet. Änderungen gelten nur bis zum Neuladen.' : 'Speichern ist fehlgeschlagen. Änderungen gelten bis zum Neuladen, der nächste Versuch folgt bei der nächsten Änderung.' }));
    }
  };
  useEffect(() => {
    if (store.status !== 'ready' || !conn.current || !cfg.onboardingDone) return;
    const t = setTimeout(() => { const docs = { ...snapshotDocs(cfg, data, theme), ...(BETA.persistActivity ? { activity: { schema: SCHEMA, workouts: data.workouts, steps: data.steps } } : {}), ...(BETA.weight ? { koerper: { schema: SCHEMA, weights: data.weights } } : {}) }; chain.current = chain.current.then(() => saveDocs(docs)).catch(() => {}); }, 800);
    return () => clearTimeout(t);
  }, [cfg, data.items, data.routines, data.recState, data.reviews, data.habits, data.habitLog, data.pauses, data.dismissed, data.workouts, data.steps, data.weights, theme, store.status]);

  const commit = (fn, msg) => {
    setData(prev => { undoRef.current = prev; return fn(prev); });
    if (msg) say(msg, true);
  };
  const undo = () => { if (undoRef.current) { const p = undoRef.current; undoRef.current = null; setData(p); } say('Rückgängig gemacht'); };
  const go = (t, sub) => { setTab(t); if (t === 'erfassen' && sub) setCaptureSeg(sub); if (t === 'gesundheit' && sub) setHealthSeg(sub); setSheet(null); if (typeof window !== 'undefined') window.scrollTo({ top: 0 }); };
  const applyConfig = (next, msg) => {
    const n = BETA.restrictConfig(normalizeConfig(next));
    undoRef.current = null;
    setCfg(n);
    setData(d => { const sync = syncPlanRoutines(d.routines, n, today); const m = materialize({ ...d, routines: sync.routines }, today); return { ...m, habits: syncHabits(m.habits, n) }; });
    if (msg) say(msg);
  };
  const markRecs = (ids, primary) => setData(d => {
    const rs = { ...(d.recState || {}) }; let changed = false;
    ids.forEach(id => { const cur = rs[id] || {}; const patch = {}; if (!cur.firstShown) patch.firstShown = today; if (primary && cur.primaryOn !== today) patch.primaryOn = today; if (Object.keys(patch).length) { rs[id] = { ...cur, ...patch }; changed = true; } });
    return changed ? { ...d, recState: rs } : d;
  });
  const ensureHorizon = end => setData(d => (d.items.some(i => i.routine && i.date >= end) ? d : materialize(d, today, end)));
  const finishOnboarding = (c, b) => {
    applyConfig({ ...c, onboardingDone: true, skipped: false }, 'Dein Wochenplan ist aktiv');
    setBody(b);
    const kg = parseNum(b.weight);
    if (c.nutrition.weight && kg >= 30 && kg <= 300) setData(d => ({ ...d, weights: [...d.weights, { id: uid('wg'), date: today, time: '', kg: Math.round(kg * 10) / 10, note: 'aus der Einrichtung', source: 'manuell' }] }));
    setShowOb(false); go('heute');
  };
  const later = () => { applyConfig({ ...cfg, onboardingDone: true, skipped: true }, BETA.demoData ? 'Demo-Plan aktiv. Die Einrichtung findest du in den Einstellungen.' : 'Standardplan aktiv. Die Einrichtung findest du in den Einstellungen.'); setShowOb(false); };
  const exportPlan = async () => {
    try {
      const dl = browserDownloads;
      if (!dl) return say('Export ist in dieser Ansicht nicht verfügbar.');
      await exportAllData({ account, today });
      say('Export bereitgestellt');
    } catch (e) { say(e && e.code === 'declined' ? 'Export abgebrochen' : 'Export war nicht möglich.'); }
  };
  const importPlan = st => {
    undoRef.current = null;
    const n = BETA.restrictConfig(normalizeConfig({ ...st.cfg, onboardingDone: true }));
    setCfg(n);
    setData(d => { const m = materialize({ ...d, routines: st.routines, items: st.items, habits: st.habits.length ? st.habits : d.habits, habitLog: st.habitLog, pauses: st.pauses, recState: {}, reviews: st.reviews || {}, dismissed: [] }, today); return { ...m, habits: syncHabits(m.habits, n) }; });
    setShowOb(false);
    say('Import abgeschlossen');
  };
  const deleteStored = async () => {
    const c = conn.current; if (!c) return;
    try {
      deleting.current = true; await chain.current; await Store.deleteAll(c); lastSaved.current = {}; setTimeout(() => { deleting.current = false; }, 1500);
      const fresh = BETA.restrictConfig(normalizeConfig(DEFAULT_CONFIG));
      setCfg(fresh); setData((BETA.demoData ? seed : emptyState)(today, fresh)); setBody(EMPTY_BODY); setTheme('system');
      setStore(st => ({ ...st, savedAt: null, error: null, restored: false, migrated: null }));
      say('Gespeicherte Daten gelöscht'); setShowOb(true); go('heute');
    } catch (e) { deleting.current = false; say('Löschen war nicht möglich. Bitte später erneut versuchen.'); }
  };
  const resetDemo = () => { undoRef.current = null; setData(seed(today, cfg)); say('Demo-Daten zurückgesetzt'); };

  /* Reviews: verschieben, überspringen, Maßnahmen bestätigen und rückgängig machen, abschließen */
  const kindOf = k => (k.startsWith('W:') ? 'week' : 'month');
  const putKeys = (d, rv, patch) => rv.keys.reduce((acc, k) => { const cur = (acc.reviews || {})[k] || { kind: kindOf(k), status: 'offen', measures: [] }; return { ...acc, reviews: { ...(acc.reviews || {}), [k]: { ...cur, kind: kindOf(k), ...patch(cur) } } }; }, d);
  const undoMap = useRef({});
  const planSig = (d, c) => JSON.stringify([c, d.routines, d.habits, d.recState]);
  const startReview = rv => { setSheet(null); setReview(rv); };
  const snoozeReview = rv => { undoRef.current = null; setData(d => putKeys(d, rv, cur => (cur.status === 'abgeschlossen' ? {} : { status: 'verschoben', snoozedUntil: addDays(today, 1) }))); setReview(null); say('Kein Problem, morgen wieder.'); };
  const skipReview = rv => { undoRef.current = null; setData(d => putKeys(d, rv, cur => (cur.status === 'abgeschlossen' ? {} : { status: 'uebersprungen', at: today }))); setReview(null); say(rv.kind === 'month' ? 'Übersprungen. Nächsten Monat geht es weiter.' : 'Übersprungen. Nächste Woche geht es weiter.'); };
  const decideMeasure = (rv, m, decision, from) => {
    undoRef.current = null;
    const rec = measureRecord(m, decision, today, from);
    const addRec = cur => ({ measures: [...(cur.measures || []).filter(x => x.id !== m.id), rec] });
    if (decision === 'übernommen') {
      const r = applyMeasureState(data, cfg, m, today, from);
      const next = putKeys(r.data, rv, addRec);
      const c2 = r.cfgChanged ? r.cfg : cfg;
      undoMap.current[`${rv.key}|${m.id}`] = { cfg, routines: data.routines, habits: data.habits, recState: data.recState, itemIds: new Set(data.items.map(x => x.id)), after: planSig(next, c2) };
      if (r.cfgChanged) setCfg(r.cfg);
      setData(next);
      say(m.id === 'fortfuehren' ? 'Beschlossen' : `Übernommen, gilt ${r.from === today ? 'ab sofort' : `ab ${fmtDM(r.from)}`}`);
    } else { setData(d => putKeys(d, rv, addRec)); say('Vermerkt: nicht jetzt'); }
  };
  const undoable = (rv, id) => { const u = undoMap.current[`${rv.key}|${id}`]; return !!u && u.after === planSig(data, cfg); };
  const undoMeasure = (rv, m) => {
    const key = `${rv.key}|${m.id}`; const u = undoMap.current[key];
    if (!u || u.after !== planSig(data, cfg)) { say('Rückgängig ist nicht mehr möglich, weil sich der Plan inzwischen geändert hat. Passe ihn unter Routinen an.'); return; }
    setCfg(u.cfg);
    setData(d => {
      const items = d.items.filter(x => u.itemIds.has(x.id) || !['geplant', 'pausiert'].includes(x.status));
      const n = materialize({ ...d, routines: u.routines, habits: u.habits, recState: u.recState, items }, today);
      return putKeys(n, rv, cur => ({ measures: (cur.measures || []).filter(x => x.id !== m.id) }));
    });
    delete undoMap.current[key];
    say('Maßnahme rückgängig gemacht');
  };
  const finishReview = (rv, questionIds, mode) => {
    if (rv.keys.every(k => ((data.reviews || {})[k] || {}).status === 'abgeschlossen')) { setReview(null); return; }
    undoRef.current = null;
    setData(d => completeReviewState(d, rv, today, questionIds, mode));
    setReview(null); setAnswers(a => { const n = { ...a }; delete n[rv.key]; return n; });
    say(rv.kind === 'combined' ? 'Wochen- und Monatsreview abgeschlossen' : rv.kind === 'week' ? 'Check-in abgeschlossen' : 'Monatsreview abgeschlossen');
  };
  const ctx = { data, today, nowMin, commit, go, openSheet: setSheet, cfg, markRecs, ensureHorizon, startReview, snoozeReview, skipReview, account };
  const close = () => setSheet(null);
  const activeTab = TAB_OF[tab] !== undefined ? TAB_OF[tab] : tab;
  return <div className="app">
    <div className="topbar">
      <span className="brand"><span className="brand-mark" aria-hidden="true" /><span className="brand-text">HealthOS</span></span>
      <span className="demo-pill">{BETA.pill}</span>
      <button className={`icon-btn ${tab === 'einstellungen' ? 'on' : ''}`} aria-label="Einstellungen" onClick={() => go('einstellungen')}><Icon name="gear" /></button>
      <button className="icon-btn" aria-label="Über HealthOS" onClick={() => setSheet({ kind: 'info' })}><Icon name="info" /></button>
    </div>
    {!online && <p className="callout warn offline" role="status">Keine Verbindung. Du kannst weiterarbeiten, gespeichert wird erst wieder mit Verbindung.</p>}
    <main id="main">
      {tab === 'heute' && <Today ctx={ctx} onSetup={() => setShowOb(true)} />}
      {tab === 'woche' && <Week ctx={ctx} />}
      {tab === 'routinen' && <RoutinesScreen ctx={ctx} />}
      {tab === 'erfassen' && <Capture ctx={ctx} seg={captureSeg} setSeg={setCaptureSeg} />}
      {tab === 'entwicklung' && <Development ctx={ctx} />}
      {BETA.healthTab && tab === 'gesundheit' && <Health ctx={ctx} seg={healthSeg} setSeg={setHealthSeg} />}
      {tab === 'einstellungen' && <Settings ctx={ctx} cfg={cfg} applyConfig={applyConfig} store={{ ...store, offline: !online }} theme={theme} setTheme={setTheme}
        onExport={exportPlan} onImport={importPlan} onDeleteStored={deleteStored} onRestart={() => setShowOb(true)} onResetDemo={resetDemo} />}
    </main>
    <nav className="tabbar" aria-label="Hauptnavigation">
      {TABS.map(([k, l, ic]) => <button key={k} className={activeTab === k ? 'on' : ''} aria-current={activeTab === k ? 'page' : undefined} onClick={() => go(k)}><Icon name={ic} size={22} /><span>{l}</span></button>)}
    </nav>
    {toast && <div className="toast" role="status" key={toast.k}><span>{toast.msg}</span>{toast.undo && <button onClick={undo}>Rückgängig</button>}</div>}
    {sheet && sheet.kind === 'item' && <ItemSheet key={sheet.id} id={sheet.id} ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'edit' && <EditInstanceSheet id={sheet.id} ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'routine' && <RoutineSheet key={sheet.id || 'neu'} id={sheet.id} ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'rec' && <RecSheet id={sheet.id} ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'addItem' && <AddItemSheet date={sheet.date} ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'lab' && <LabSheet ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'appt' && <ApptSheet id={sheet.id} followOf={sheet.followOf} ctx={ctx} close={close} />}
    {sheet && sheet.kind === 'pause' && <PauseSheet ctx={ctx} close={close} from={sheet.from} />}
    {sheet && sheet.kind === 'info' && <InfoSheet close={close} onSettings={() => go('einstellungen')} />}
    {review && <ReviewFlow key={review.key + (review.mode || '')} review={review} ctx={ctx} answers={answers[review.key] || {}} setAnswers={a => setAnswers(s => ({ ...s, [review.key]: a }))} onDecide={decideMeasure} onUndo={undoMeasure} undoable={undoable} onFinish={finishReview} onSnooze={() => snoozeReview(review)} onSkip={() => skipReview(review)} close={() => setReview(null)} />}
    {showOb && store.status !== 'pending' && <Onboarding initial={cfg} initialBody={body} onDone={finishOnboarding} onLater={later} />}
    {store.status === 'pending' && !initialStore && <div className="splash" role="status"><span className="brand-mark big" aria-hidden="true" /><span>HealthOS wird geladen</span></div>}
  </div>;
}

export { App, Onboarding, Settings, ReviewFlow };
