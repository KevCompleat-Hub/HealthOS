// Erzeugt apps/web/src/legacy/HealthOSApp.jsx aus der eingefrorenen Referenz v5.
// - Oberfläche und Gestaltung bleiben unverändert (Komponenten der Referenz).
// - Sämtliche Fachlogik kommt aus @healthos/domain (geprüfter M1-Kern). Die Logikblöcke der Referenz werden entfernt.
// - Beta-Schalter (src/features.js) blenden Gewicht, Mahlzeiten, Blutwerte, Termine, Dokumente und Empfehlungen aus.
// - Jede Änderung ist hier als Ersetzung mit Anker dokumentiert. Fehlt ein Anker, bricht der Generator ab.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(path.join(root, 'packages/reference/v5/app.jsx'), 'utf8');
const D = await import(path.join(root, 'packages/domain/dist/index.js'));
const domainNames = new Set(Object.keys(D));

// 1. Top-Level-Blöcke bestimmen und Logikblöcke entfernen
const lines = src.split('\n');
const starts = [];
lines.forEach((l, i) => { if (/^(function |const |let |\/\*|if \(typeof)/.test(l)) starts.push(i); });
const REMOVE_EXTRA = new Set(['Store', '_id', '_fmtBerlin']);
const keep = []; const removed = []; const used = new Set();
for (let s = 0; s < starts.length; s++) {
  const a = starts[s], b = s + 1 < starts.length ? starts[s + 1] : lines.length;
  const block = lines.slice(a, b);
  const m = block[0].match(/^(?:function|const|let)\s+([A-Za-z_$][\w$]*)/);
  if (block[0].startsWith('const { useState')) continue;
  if (block[0].startsWith('if (typeof')) continue; // Start-Code und module.exports der Referenz
  if (m && (domainNames.has(m[1]) || REMOVE_EXTRA.has(m[1]))) { removed.push(m[1]); continue; }
  keep.push(...block);
}
let ui = keep.join('\n');
for (const n of domainNames) if (new RegExp(`\\b${n}\\b`).test(ui)) used.add(n);

// 2. Beta-Anpassungen
const P = [];
const patch = (label, from, to, all = false) => P.push({ label, from, to, all });
// Startzustand: echte Konten beginnen leer, nur die Entwicklungs-Demo nutzt fiktive Daten
patch('Einstellungen auf Beta-Umfang beschränken (Start)', 'const [cfg, setCfg] = useState(() => normalizeConfig(initialConfig || DEFAULT_CONFIG));', 'const [cfg, setCfg] = useState(() => BETA.restrictConfig(normalizeConfig(initialConfig || DEFAULT_CONFIG)));');
patch('Startzustand ohne Demo-Daten', 'const [data, setData] = useState(() => seed(today, normalizeConfig(initialConfig || DEFAULT_CONFIG)));', 'const [data, setData] = useState(() => (BETA.demoData ? seed : emptyState)(today, BETA.restrictConfig(normalizeConfig(initialConfig || DEFAULT_CONFIG))));');
patch('Einstellungen beschränken (Übernehmen)', 'const applyConfig = (next, msg) => {\n    const n = normalizeConfig(next);', 'const applyConfig = (next, msg) => {\n    const n = BETA.restrictConfig(normalizeConfig(next));');
patch('Einstellungen beschränken (Laden)', '          setCfg(m.cfg);', '          setCfg(BETA.restrictConfig(m.cfg));');
patch('Einstellungen beschränken (Import)', 'const n = normalizeConfig({ ...st.cfg, onboardingDone: true });', 'const n = BETA.restrictConfig(normalizeConfig({ ...st.cfg, onboardingDone: true }));');
patch('Zurücksetzen nach Löschen ohne Demo-Daten', 'const fresh = normalizeConfig(DEFAULT_CONFIG);\n      setCfg(fresh); setData(seed(today, fresh));', 'const fresh = BETA.restrictConfig(normalizeConfig(DEFAULT_CONFIG));\n      setCfg(fresh); setData((BETA.demoData ? seed : emptyState)(today, fresh));');
patch('Erfassen startet mit Training', "initialCapture = 'gewicht'", "initialCapture = 'training'");
// Speicher: Aktivitäten zusätzlich speichern, Store aus dem Web-Adapter
patch('Aktivitäten speichern', 'const t = setTimeout(() => { const docs = snapshotDocs(cfg, data, theme);', 'const t = setTimeout(() => { const docs = { ...snapshotDocs(cfg, data, theme), ...(BETA.persistActivity ? { activity: { schema: SCHEMA, workouts: data.workouts, steps: data.steps } } : {}) };');
patch('Speicher-Abhängigkeiten', 'data.pauses, data.dismissed, theme, store.status]);', 'data.pauses, data.dismissed, data.workouts, data.steps, theme, store.status]);');
patch('Dokumentzuordnung Aktivitäten', "const ref = k === 'settings' ? r.settings : k === 'plan' ? r.plan : k === 'habits' ? r.habits : r.weeks.doc(k.slice(5));", "const ref = k === 'settings' ? r.settings : k === 'plan' ? r.plan : k === 'habits' ? r.habits : k === 'activity' ? r.activity : r.weeks.doc(k.slice(5));");
patch('Aktivitäten laden', 'pauses: m.pauses, dismissed: m.dismissed };', 'pauses: m.pauses, dismissed: m.dismissed, ...(saved.activity ? { workouts: saved.activity.workouts || [], steps: saved.activity.steps || [] } : {}) };');
patch('Laden: Speicherfehler mit Ursache', "} catch (e) { finish({ status: 'error', message: (e && e.code) || 'unbekannt' }); }", "} catch (e) { finish({ status: 'error', message: (e && (e.code || e.message)) || 'unbekannt' }); }");
// Export als Datei im Browser
patch('Export im Browser', "const dl = typeof window !== 'undefined' && window.claude && typeof window.claude.use === 'function' ? await window.claude.use('downloads') : null;", 'const dl = browserDownloads;');
patch('Exportzeitpunkt übergeben', "data: JSON.stringify(buildExport(cfg, data), null, 2)", "data: JSON.stringify(buildExport(cfg, data, new Date().toISOString()), null, 2)");
// Navigation und Erfassen
patch('Tabs der Beta', "const TABS = [['heute', 'Heute', 'sun'], ['woche', 'Woche', 'calendar'], ['erfassen', 'Erfassen', 'plus'], ['entwicklung', 'Entwicklung', 'trend'], ['gesundheit', 'Gesundheit', 'heart']];", "const TABS = [['heute', 'Heute', 'sun'], ['woche', 'Woche', 'calendar'], ['erfassen', 'Erfassen', 'plus'], ['entwicklung', 'Entwicklung', 'trend'], ['gesundheit', 'Gesundheit', 'heart']].filter(([k]) => k !== 'gesundheit' || BETA.healthTab);");
patch('Gesundheit nur mit Freigabe', "{tab === 'gesundheit' && <Health", "{BETA.healthTab && tab === 'gesundheit' && <Health");
patch('Schnell erfassen', "[['gewicht', 'Gewicht', 'scale'], ['schritte', 'Schritte', 'steps'], ['training', 'Training', 'dumbbell'], ['mahlzeit', 'Mahlzeit', 'utensils']].map(", "[['gewicht', 'Gewicht', 'scale'], ['schritte', 'Schritte', 'steps'], ['training', 'Training', 'dumbbell'], ['mahlzeit', 'Mahlzeit', 'utensils']].filter(([k]) => BETA.capture.includes(k)).map(");
patch('Erfassen-Bereiche', "options={[['gewicht', 'Gewicht'], ['schritte', 'Schritte'], ['training', 'Training'], ['mahlzeit', 'Mahlzeit']]} />", "options={[['gewicht', 'Gewicht'], ['schritte', 'Schritte'], ['training', 'Training'], ['mahlzeit', 'Mahlzeit']].filter(([k]) => BETA.capture.includes(k))} />");
patch('Gewicht-Formular', "{seg === 'gewicht' && <WeightForm ctx={ctx} />}", "{BETA.capture.includes('gewicht') && seg === 'gewicht' && <WeightForm ctx={ctx} />}");
patch('Mahlzeit-Formular', "{seg === 'mahlzeit' && <MealForm ctx={ctx} />}", "{BETA.capture.includes('mahlzeit') && seg === 'mahlzeit' && <MealForm ctx={ctx} />}");
patch('Hinweis Erfassen', '<p className="demo-note"><Icon name="info" size={16} /> Bitte nur fiktive Testwerte eingeben. Die Demo speichert nichts dauerhaft, nach dem Neuladen beginnt sie von vorn.</p>', '<p className="demo-note"><Icon name="info" size={16} /> {BETA.captureNote}</p>');
// Heute: Empfehlung, Gewicht, Termine
patch('Empfehlung markieren nur mit Freigabe', 'useEffect(() => { if (rv.primary && rv.primary.primaryOn !== today)', 'useEffect(() => { if (BETA.recs && rv.primary && rv.primary.primaryOn !== today)');
patch('Empfehlungskarte nur mit Freigabe', '{rv.primary && <section className="block" aria-labelledby="rec-h">', '{BETA.recs && rv.primary && <section className="block" aria-labelledby="rec-h">');
patch('Gewicht-Kachel', '<Stat icon="scale" label="Gewicht"', '{BETA.weight && <Stat icon="scale" label="Gewicht"');
patch('Gewicht-Kachel Ende', "sub={wt ? 'Ø 7 Tage ggü. Vorwoche' : 'je Woche 1 Wert nötig'} onClick={() => go('entwicklung')} />", "sub={wt ? 'Ø 7 Tage ggü. Vorwoche' : 'je Woche 1 Wert nötig'} onClick={() => go('entwicklung')} />}");
patch('Termine auf Heute', '<section className="block">\n      <div className="h2-row"><h2 className="h2">Nächste Termine</h2>', '{BETA.appointments && <section className="block">\n      <div className="h2-row"><h2 className="h2">Nächste Termine</h2>');
patch('Termine auf Heute Ende', '        : <Empty text="In den nächsten drei Wochen ist kein Termin vereinbart." />}\n    </section>', '        : <Empty text="In den nächsten drei Wochen ist kein Termin vereinbart." />}\n    </section>}');
// Entwicklung: Gewichtsverlauf
patch('Gewichtsverlauf', '<section className="block tight">\n      <div className="h2-row"><h3 className="h3 top0">Gewicht</h3>', '{BETA.weight && <section className="block tight">\n      <div className="h2-row"><h3 className="h3 top0">Gewicht</h3>');
patch('Gewichtsverlauf Ende', "action={<button className=\"btn small\" onClick={() => ctx.go('erfassen', 'gewicht')}>Ersten Wert erfassen</button>} />}\n      </div>\n    </section>", "action={<button className=\"btn small\" onClick={() => ctx.go('erfassen', 'gewicht')}>Ersten Wert erfassen</button>} />}\n      </div>\n    </section>}");
patch('Zielhinweis Gewicht', '<p className="hint">Gewichts- und Kalorienziel sind nicht festgelegt. Beides ist optional, HealthOS legt keine Zielwerte automatisch fest.</p>', '{BETA.weight && <p className="hint">{BETA.capture.includes(\'mahlzeit\') ? "Gewichts- und Kalorienziel sind nicht festgelegt. Beides ist optional, HealthOS legt keine Zielwerte automatisch fest." : "Ein Gewichtsziel ist nicht festgelegt. HealthOS legt keine Zielwerte automatisch fest."}</p>}');
// Einrichtung: keine Gewichts- oder Kalorienerfassung, kein Blutwerte-Ziel
patch('Kalorien-Schalter', '<Toggle checked={n.calories} onChange={v =>', '{BETA.capture.includes(\'mahlzeit\') && <Toggle checked={n.calories} onChange={v =>');
patch('Kalorien-Schalter Ende', '>Kalorien und Makros erfassen</Toggle>', '>Kalorien und Makros erfassen</Toggle>}');
patch('Gewicht-Schalter', "<Toggle checked={n.weight} onChange={set('weight')}>Gewicht tracken</Toggle>", "{BETA.weight && <Toggle checked={n.weight} onChange={set('weight')}>Gewicht tracken</Toggle>}");
patch('Zielauswahl', '<Chips multi options={Object.entries(GOALS)} value={cfg.goals}', '<Chips multi options={Object.entries(GOALS).filter(([k]) => !BETA.hiddenGoals.includes(k))} value={cfg.goals}');
patch('Ziel im Routinenformular', "{Object.entries(GOALS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}", "{Object.entries(GOALS).filter(([k]) => !BETA.hiddenGoals.includes(k) || k === f.goal).map(([k, l]) => <option key={k} value={k}>{l}</option>)}");
// Monatsreview: Schritt „Gesundheit und Empfehlungen“ nur mit Freigabe
patch('Review-Schritte', 'const steps = STEPS[review.kind][mode];', "const steps = STEPS[review.kind][mode].filter(([k]) => k !== 'gesundheit' || BETA.recs);");
// Rahmen, Texte, Konto
patch('Kennzeichnung oben', '<span className="demo-pill">Fiktive Demo-Daten</span>', '<span className="demo-pill">{BETA.pill}</span>');
patch('Info-Knopf', 'aria-label="Über diese Demo"', 'aria-label="Über HealthOS"');
patch('Speicher-Beschreibung', ui.split('\n').find(l => l.includes('Gespeichert werden Einstellungen, Routinen mit Versionen')), '    <p className="hint">{BETA.storageText}</p>');
patch('Titel Info', '<Sheet title="Über diese Demo"', '<Sheet title={BETA.demoData ? "Über diese Demo" : "Über HealthOS Beta"}');
patch('Abschnitt Darstellung', '<h2 className="h2">Darstellung und Demo</h2>', '<h2 className="h2">{BETA.demoData ? \'Darstellung und Demo\' : \'Darstellung\'}</h2>');
patch('Demo zurücksetzen nur in der Demo', '<button className="btn small" onClick={onResetDemo}>Demo-Daten zurücksetzen</button>', '{BETA.demoData && <button className="btn small" onClick={onResetDemo}>Demo-Daten zurücksetzen</button>}');
patch('Konto-Abschnitt', '    <section className="block">\n      <h2 className="h2">{BETA.demoData ?', '    {ctx.account && <section className="block">\n      <h2 className="h2">Konto</h2>\n      <div className="panel">\n        <p className="hint top0">Angemeldet als {ctx.account.email}.</p>\n        <div className="btn-row"><button className="btn small" onClick={ctx.account.signOut}>Abmelden</button></div>\n      </div>\n    </section>}\n    <section className="block">\n      <h2 className="h2">{BETA.demoData ?');
patch('Konto im Kontext', 'const ctx = { data, today, nowMin, commit, go, openSheet: setSheet, cfg, markRecs, ensureHorizon, startReview, snoozeReview, skipReview };', 'const ctx = { data, today, nowMin, commit, go, openSheet: setSheet, cfg, markRecs, ensureHorizon, startReview, snoozeReview, skipReview, account };');
patch('App-Eigenschaft Konto', "getNow = () => new Date() }) {", "getNow = () => new Date(), account = null }) {");
patch('Später einrichten', "'Demo-Plan aktiv. Die Einrichtung findest du in den Einstellungen.'", "BETA.demoData ? 'Demo-Plan aktiv. Die Einrichtung findest du in den Einstellungen.' : 'Standardplan aktiv. Die Einrichtung findest du in den Einstellungen.'");
patch('Hinweis Standardplan', '<p>Du nutzt noch den Demo-Plan. In etwa zwei Minuten entsteht dein persönlicher Wochenplan.</p>', '<p>Du nutzt noch den {BETA.demoData ? \'Demo-Plan\' : \'Standardplan\'}. In etwa zwei Minuten entsteht dein persönlicher Wochenplan.</p>');
patch('Einstellungen Standardplan', '{cfg.skipped && <p className="callout">Du nutzt noch den Demo-Plan.', '{cfg.skipped && <p className="callout">Du nutzt noch den {BETA.demoData ? \'Demo-Plan\' : \'Standardplan\'}.');

// Korrektur gegenüber der Referenz: Löschen darf nicht von einem gleichzeitig anstehenden Speichern überholt werden
patch('Löschsperre anlegen', '  const undoRef = useRef(null);\n  const conn = useRef(null)', '  const undoRef = useRef(null);\n  const deleting = useRef(false);\n  const conn = useRef(null)');
patch('Speichern während des Löschens unterbinden', 'const saveDocs = async docs => {\n    const c = conn.current; if (!c) return;', 'const saveDocs = async docs => {\n    const c = conn.current; if (!c || deleting.current) return;');
patch('Löschsperre setzen', 'await chain.current; await Store.deleteAll(c); lastSaved.current = {};', 'deleting.current = true; await chain.current; await Store.deleteAll(c); lastSaved.current = {}; setTimeout(() => { deleting.current = false; }, 1500);');
patch('Löschsperre bei Fehler lösen', "} catch (e) { say('Löschen war nicht möglich. Bitte später erneut versuchen.'); }", "} catch (e) { deleting.current = false; say('Löschen war nicht möglich. Bitte später erneut versuchen.'); }");
const infoLine = t => ui.split('\n').find(l => l.includes(t));
patch('Info: was funktioniert', infoLine('Einrichtung, automatischer Wochenplan, Routinen mit Versionen und Ausnahmen, Abhaken'), '      <p className="hint">{BETA.demoData ? ' + JSON.stringify(infoLine('Einrichtung, automatischer Wochenplan, Routinen mit Versionen und Ausnahmen, Abhaken').trim().replace(/^<p className="hint">|<\/p>$/g, '')) + ' : BETA.info.works}</p>');
patch('Info: was gespeichert wird', infoLine('Nur Einstellungen, Routinen, Wochenplan, Gewohnheiten und Pausen ohne Grund, privat für dein Konto. Messwerte'), '      <p className="hint">{BETA.demoData ? ' + JSON.stringify(infoLine('Nur Einstellungen, Routinen, Wochenplan, Gewohnheiten und Pausen ohne Grund, privat für dein Konto. Messwerte').trim().replace(/^<p className="hint">|<\/p>$/g, '')) + ' : BETA.info.stored}</p>');
patch('Info: was fehlt', infoLine('Keine Push-Benachrichtigungen, kein Datei-Upload'), '      <p className="hint">{BETA.demoData ? ' + JSON.stringify(infoLine('Keine Push-Benachrichtigungen, kein Datei-Upload').trim().replace(/^<p className="hint">|<\/p>$/g, '')) + ' : BETA.info.missing}</p>');
// ---------- W5: Motivation auf „Heute“ und Korrekturen aus dem Review vom 20.10.2026 ----------
patch('Heute: Gewohnheiten mitzählen', '  const next = nextActions(data, today, nowMin);', '  const next = nextActions(data, today, nowMin);\n  const habToday = habitsOn(data, today).filter(h => data.habitLog[`${h.id}|${today}`] !== \'skip\');\n  const habDone = habToday.filter(h => data.habitLog[`${h.id}|${today}`] === \'done\').length;');
patch('Heute: Fortschritt oben', '\n\n    <section className="block tight" aria-labelledby="next-h">', '\n\n    <TodayProgress ctx={ctx} />\n    <Celebrate ctx={ctx} />\n    <section className="block tight" aria-labelledby="next-h">');
patch('Heute: Zähler mit Gewohnheiten', "{counted.length ? `${done} von ${counted.length} heute erledigt` : ''}", "{counted.length + habToday.length ? `${done + habDone} von ${counted.length + habToday.length} heute erledigt` : ''}");
patch('Heute: Erfolg statt Bremse im leeren Zustand', "'Für heute ist nichts mehr offen. Verpasstes von gestern wird nicht nachgeholt.'", "(habDone < habToday.length ? 'Termine erledigt. Unten warten noch Gewohnheiten.' : 'Alles erledigt für heute. Stark.')");
patch('Heute: Gewohnheiten unter Als Nächstes, Check-in tiefer', '\n    <ReviewCard ctx={ctx} />\n', '\n    <HabitsToday ctx={ctx} />\n');
patch('Heute: Check-in unter dem Fortschritt', '      <CoachLine ctx={ctx} />\n    </section>\n', '      <CoachLine ctx={ctx} />\n    </section>\n\n    <ReviewCard ctx={ctx} />\n');
patch('Heute: Tagesbogen zunächst eingeklappt', 'const [arcOpen, setArcOpen] = useState(true);', 'const [arcOpen, setArcOpen] = useState(false);');
patch('Heute: Training positiv formuliert', "sub={goal ? 'Einheiten diese Woche' : 'kein Trainingsziel'}", "sub={!goal ? 'kein Trainingsziel' : tw >= goal ? 'Wochenziel erreicht' : `noch ${goal - tw} diese Woche`}");
patch('Heute: Pausen positiv formuliert', 'sub="werktags, diese Woche"', "sub={ps.eligible && ps.done >= ps.eligible ? 'alle geschafft' : ps.eligible ? `noch ${ps.eligible - ps.done} diese Woche` : 'werktags'}");
patch('Heute: Einzahl bei einem Eintrag', '<span className="muted">{todays.length} Einträge</span>', "<span className=\"muted\">{todays.length} {todays.length === 1 ? 'Eintrag' : 'Einträge'}</span>");
patch('Coach: Regel hinter „Warum“', '<p className="coach-text">{c.text}</p>\n      <p className="coach-why">{c.reason}</p>', '<p className="coach-text">{fixText(c.text)}</p>\n      <details><summary>Warum dieser Hinweis?</summary><p className="coach-why">{fixText(c.reason)}</p></details>');
patch('Check-in nur mit Plandaten', 'const offer = reviewOffer(data, cfg, today, nowMin);', 'const offer = usableOffer(reviewOffer(data, cfg, today, nowMin), data, today);');
patch('Check-in: keine Ernährungsfrage ohne Mahlzeiten', 'previousQuestionIds(data, review.kind, review.key)))', "previousQuestionIds(data, review.kind, review.key)).filter(q => BETA.recs || q.id !== 'ernaehrung'))");
patch('Check-in: keine Empfehlungs-Maßnahmen', 'review.keys, maxNew) : [])', "review.keys, maxNew).filter(x => BETA.recs || !x.id.startsWith('empfehlung-')) : [])");
patch('Check-in: „Später fortsetzen“ statt „Schließen“', 'onClick={close}>Schließen</button></div>', 'onClick={close}>Später fortsetzen</button></div>');
const lineWith = t => ui.split('\n').find(l => l.includes(t));
patch('Check-in: Gewicht ausblenden', lineWith('<MiniStat label="Gewicht" value={wDelta'), '      {BETA.weight && ' + lineWith('<MiniStat label="Gewicht" value={wDelta').trim() + '}');
patch('Check-in: Mahlzeiten ausblenden', lineWith('<MiniStat label="Mahlzeiten" value={`${m.nutDays}'), "      {BETA.capture.includes('mahlzeit') && " + lineWith('<MiniStat label="Mahlzeiten" value={`${m.nutDays}').trim() + '}');
patch('Monatsreview: Mahlzeiten-Zeile ausblenden', lineWith('<tr><th scope="row">Mahlzeiten erfasst</th>'), "      {BETA.capture.includes('mahlzeit') && " + lineWith('<tr><th scope="row">Mahlzeiten erfasst</th>').trim() + '}');
patch('Entwicklung: Text ohne Reviews', 'Noch keine Reviews. Der erste Check-in erscheint zum eingestellten Zeitpunkt auf Heute.', 'Noch keine Reviews. Dein erster Check-in erscheint auf Heute, sobald eine Woche mit Plan vorliegt.');
patch('Entwicklung: Verweis auf nicht vorhandenen Bereich', '<Empty text="Noch keine Empfehlung angenommen. Vorschläge findest du unter Gesundheit, Für dich." />', '<Empty text={BETA.recs ? "Noch keine Empfehlung angenommen. Vorschläge findest du unter Gesundheit, Für dich." : "Noch keine Maßnahme angenommen."} />');
patch('Entwicklung: Kalorienverlauf nur mit Mahlzeiten', '    <section className="block">\n      <h3 className="h3 top0">Kalorien, letzte 7 Tage</h3>', "    {BETA.capture.includes('mahlzeit') && <section className=\"block\">\n      <h3 className=\"h3 top0\">Kalorien, letzte 7 Tage</h3>");
patch('Entwicklung: Kalorienverlauf Ende', '<span className="lg-bar faint" /> unvollständig <span className="lg-missing" /> nicht erfasst</p></div>\n    </section>', '<span className="lg-bar faint" /> unvollständig <span className="lg-missing" /> nicht erfasst</p></div>\n    </section>}');
patch('Woche: Gewohnheiten als Anzahl', 'Math.round((hs.done / hs.eligible) * 100)} %', 'hs.done} von ${hs.eligible}');
patch('Entwicklung: Gewohnheiten als Anzahl', 'Math.round(hs.done / hs.eligible * 100)} %', 'hs.done} von ${hs.eligible}');
patch('Einstellungen: kein Kaloriensatz', 'Eigene Gewohnheiten legst du in der Woche an. Ein Kalorienziel wird nicht automatisch festgelegt.', 'Eigene Gewohnheiten legst du in der Woche oder über die Ideen auf Heute an.');
patch('Künftige Termine nicht abhakbar', 'onClick={() => run(x => A.toggleItem(x, it.id, today)', "disabled={it.date > today && st !== 'erledigt'} title={it.date > today ? 'Erst am Tag selbst abhakbar' : undefined} onClick={() => run(x => A.toggleItem(x, it.id, today)");
patch('Info: Impressum, Datenschutz, Feedback', 'BETA.info.missing}</p>', "BETA.info.missing}</p>\n      {!BETA.demoData && <p className=\"legal-links\"><a href=\"/impressum\">Impressum</a><a href=\"/datenschutz\">Datenschutz</a>{BETA.feedbackEmail && <a href={`mailto:${BETA.feedbackEmail}?subject=HealthOS%20Beta%20Feedback`}>Feedback senden</a>}</p>}");
patch('Einstellungen: Rechtliches und Feedback im Konto', '<div className="btn-row"><button className="btn small" onClick={ctx.account.signOut}>Abmelden</button></div>', "<div className=\"btn-row\"><button className=\"btn small\" onClick={ctx.account.signOut}>Abmelden</button></div>\n        <p className=\"legal-links\"><a href=\"/impressum\">Impressum</a><a href=\"/datenschutz\">Datenschutz</a>{BETA.feedbackEmail && <a href={`mailto:${BETA.feedbackEmail}?subject=HealthOS%20Beta%20Feedback`}>Feedback senden</a>}</p>");
// ---------- W6: Gewicht und Körperwerte, Waagen-Screenshot, Training in der Woche verrechnen, kleinere Korrekturen ----------
patch('Körperwerte speichern', '...(BETA.persistActivity ? { activity: { schema: SCHEMA, workouts: data.workouts, steps: data.steps } } : {}) };', '...(BETA.persistActivity ? { activity: { schema: SCHEMA, workouts: data.workouts, steps: data.steps } } : {}), ...(BETA.weight ? { koerper: { schema: SCHEMA, weights: data.weights } } : {}) };');
patch('Speicher-Abhängigkeit Körperwerte', 'data.workouts, data.steps, theme, store.status]);', 'data.workouts, data.steps, data.weights, theme, store.status]);');
patch('Dokumentzuordnung Körperwerte', "k === 'activity' ? r.activity :", "k === 'activity' ? r.activity : k === 'koerper' ? r.koerper :");
patch('Körperwerte laden', '...(saved.activity ? { workouts: saved.activity.workouts || [], steps: saved.activity.steps || [] } : {}) };', '...(saved.activity ? { workouts: saved.activity.workouts || [], steps: saved.activity.steps || [] } : {}), ...(saved.koerper ? { weights: saved.koerper.weights || [] } : {}) };');
patch('Check-in: Gewicht eintragen', "{k === 'woche' && <WeekSummary m={wm} />}", "{k === 'woche' && <><WeekSummary m={wm} />{BETA.weight && <WeightQuick ctx={ctx} />}</>}");
patch('Check-in kurz: Gewicht eintragen', "{k === 'wochekomplett' && <><WeekSummary m={wm} /><PosNeg m={wm} /></>}", "{k === 'wochekomplett' && <><WeekSummary m={wm} /><PosNeg m={wm} />{BETA.weight && <WeightQuick ctx={ctx} />}</>}");
patch('Erfassen: Waagen-Screenshot', "{BETA.capture.includes('gewicht') && seg === 'gewicht' && <WeightForm ctx={ctx} />}", "{BETA.capture.includes('gewicht') && seg === 'gewicht' && <><WeightForm ctx={ctx} /><ScaleImport ctx={ctx} /></>}");
patch('Training: geplante Einheit der Woche verrechnen', "  const planned = data.items.filter(i => i.type === 'training' && i.date === date && ['geplant', 'verpasst'].includes(i.status) && !i.replacedBy).sort(byTime)[0];", "  const openT = i => i.type === 'training' && ['geplant', 'verpasst'].includes(i.status) && !i.replacedBy;\n  const planned = data.items.filter(i => openT(i) && i.date === date).sort(byTime)[0] || data.items.filter(i => openT(i) && i.date >= weekStart(date) && i.date <= addDays(weekStart(date), 6)).sort(byTime)[0];");
patch('Training: zuletzt genutzte Art vorauswählen', "const [kind, setKind] = useState('Krafttraining');", "const [kind, setKind] = useState(() => (data.workouts.filter(w => w.source === 'manuell').slice(-1)[0] || {}).kind || 'Krafttraining');");
patch('Woche: Check-in zählt nicht als Tagesaufgabe', "const its = data.items.filter(i => i.date === d && i.status !== 'verschoben');", "const its = data.items.filter(i => i.date === d && i.status !== 'verschoben' && i.routine !== 'review');");
patch('Diagramm: ganzzahlige Skala bei kleinen Werten', '{[0, max / 2].map((t, i) =>', '{(max <= 6 ? Array.from({ length: Math.floor(max) + 1 }, (_, k) => k) : [0, max / 2]).map((t, i) =>');
patch('Diagramm: erreichtes Wochenziel voll eingefärbt', 'const weeks = trainingSeries(data, weekStart(today), 8, today);', 'const weeks = trainingSeries(data, weekStart(today), 8, today).map(x => (x.goal && x.value != null && x.value >= x.goal ? { ...x, faint: false } : x));');
patch('Heute: Ernährungs-Idee und Zutaten-Katalog', '\n    <HabitsToday ctx={ctx} />\n', '\n    <HabitsToday ctx={ctx} />\n    <FoodTip ctx={ctx} />\n');
const log = [];
for (const p of P) {
  const n = ui.split(p.from).length - 1;
  if (n !== 1) { console.error(`Anker für „${p.label}“ ${n === 0 ? 'nicht gefunden' : `${n}-mal gefunden`}. Abbruch.`); process.exit(1); }
  ui = ui.replace(p.from, () => p.to); log.push(p.label);
}

const header = `'use client';
/* eslint-disable */
// AUTOMATISCH ERZEUGT von tools/build-web-ui.mjs aus packages/reference/v5/app.jsx. Nicht von Hand ändern.
// Oberfläche: Referenz v5. Fachlogik: @healthos/domain (M1). Beta-Anpassungen: ${log.length}, siehe Generator.
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as D from '@healthos/domain';
import { FEATURES as BETA } from '../features';
import { Store } from '../storage/store';
import { emptyState, browserDownloads } from './support';
import { TodayProgress, HabitsToday, Celebrate, habitsOn } from '../beta/today';
import { usableOffer, fixText } from '../beta/review';
import { ScaleImport, WeightQuick } from '../beta/scale';
import { FoodTip } from '../beta/food';
const { ${[...used].sort().join(', ')} } = D;
`;
writeFileSync(path.join(root, 'apps/web/src/legacy/HealthOSApp.jsx'), header + ui + '\nexport { App, Onboarding, Settings, ReviewFlow };\n');
console.log(`HealthOSApp.jsx erzeugt: ${removed.length} Logikblöcke durch den M1-Kern ersetzt, ${used.size} Kernfunktionen genutzt, ${log.length} Beta-Anpassungen.`);
