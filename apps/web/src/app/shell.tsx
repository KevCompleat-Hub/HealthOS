'use client';
import React, { useEffect, useState, type FormEvent } from 'react';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { App as LegacyApp } from '../legacy/HealthOSApp.jsx';
import { MODE } from '../features';
import { configureBackend } from '../storage/store';
import { browserBackend, supabaseBackend } from '../storage/backends';
import { supabase } from '../lib/supabase';

export const CONSENT_VERSION = 'beta-1';
// Die Oberfläche ist generiertes JavaScript aus der Referenz, ihre Eigenschaften werden hier typisiert.
const App = LegacyApp as unknown as React.ComponentType<{ account?: { email?: string; signOut: () => void } }>;

type Phase =
  | { k: 'laden' }
  | { k: 'anmelden'; err?: string; info?: string }
  | { k: 'passwort'; err?: string }
  | { k: 'faktor-einrichten'; factorId: string; qr: string; secret: string; err?: string }
  | { k: 'faktor-pruefen'; factorId: string; err?: string }
  | { k: 'einwilligung'; user: User; err?: string }
  | { k: 'bereit'; user: User }
  | { k: 'fehler'; msg: string };

export default function Shell() {
  const [demoReady, setDemoReady] = useState(false);
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') navigator.serviceWorker.register('/sw.js').catch(() => {});
    if (MODE === 'demo') { configureBackend(browserBackend()); setDemoReady(true); }
  }, []);
  if (MODE === 'demo') return demoReady ? <App /> : null;
  return <BetaGate />;
}

function BetaGate() {
  const [phase, setPhase] = useState<Phase>({ k: 'laden' });
  const [busy, setBusy] = useState(false);

  async function next(sb: SupabaseClient, linkType?: string | null) {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return setPhase({ k: 'anmelden' });
    // Einladung oder Passwort-Zurücksetzen: zuerst ein eigenes Passwort festlegen
    if (linkType === 'invite' || linkType === 'recovery') return setPhase({ k: 'passwort' });
    const aal = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal.error) return setPhase({ k: 'fehler', msg: aal.error.message });
    if (aal.data.currentLevel !== 'aal2') {
      const f = await sb.auth.mfa.listFactors();
      const totp = f.data?.totp?.find(x => x.status === 'verified');
      if (totp) return setPhase({ k: 'faktor-pruefen', factorId: totp.id });
      for (const old of f.data?.all?.filter(x => x.status === 'unverified') || []) await sb.auth.mfa.unenroll({ factorId: old.id });
      const e = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'HealthOS' });
      if (e.error) return setPhase({ k: 'fehler', msg: e.error.message });
      return setPhase({ k: 'faktor-einrichten', factorId: e.data.id, qr: e.data.totp.qr_code, secret: e.data.totp.secret });
    }
    const c = await sb.from('beta_consents').select('version').eq('version', CONSENT_VERSION).maybeSingle();
    if (c.error) return setPhase({ k: 'fehler', msg: c.error.message });
    if (!c.data) return setPhase({ k: 'einwilligung', user });
    configureBackend(supabaseBackend(sb, user.id));
    setPhase({ k: 'bereit', user });
  }
  useEffect(() => {
    // Art des Links aus der Adresse lesen, bevor der Client sie verarbeitet (Einladung, Passwort zurücksetzen)
    const linkType = new URLSearchParams(window.location.hash.slice(1)).get('type') || new URLSearchParams(window.location.search).get('type');
    let sb: SupabaseClient; try { sb = supabase(); } catch (e) { setPhase({ k: 'fehler', msg: (e as Error).message }); return; }
    sb.auth.getSession().then(() => next(sb, linkType));
  }, []);

  const run = async (fn: (sb: SupabaseClient) => Promise<void>) => { setBusy(true); try { await fn(supabase()); } finally { setBusy(false); } };
  const signIn = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget); run(async sb => {
    const r = await sb.auth.signInWithPassword({ email: String(f.get('email')), password: String(f.get('password')) });
    if (r.error) return setPhase({ k: 'anmelden', err: 'Anmeldung nicht möglich. Prüfe E-Mail und Passwort.' });
    await next(sb);
  }); };
  const verify = (factorId: string, base: Phase) => (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const code = String(new FormData(e.currentTarget).get('code')).replace(/\s/g, ''); run(async sb => {
    const r = await sb.auth.mfa.challengeAndVerify({ factorId, code });
    if (r.error) return setPhase({ ...base, err: 'Der Code stimmt nicht oder ist abgelaufen.' } as Phase);
    await next(sb);
  }); };
  const consent = (e: FormEvent<HTMLFormElement>, user: User) => { e.preventDefault(); run(async sb => {
    const r = await sb.from('beta_consents').insert({ user_id: user.id, version: CONSENT_VERSION });
    if (r.error) return setPhase({ k: 'einwilligung', user, err: 'Die Einwilligung konnte nicht gespeichert werden.' });
    await next(sb);
  }); };
  const setPassword = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget); const pw = String(f.get('pw')), pw2 = String(f.get('pw2')); run(async sb => {
    if (pw.length < 12) return setPhase({ k: 'passwort', err: 'Bitte mindestens 12 Zeichen verwenden.' });
    if (pw !== pw2) return setPhase({ k: 'passwort', err: 'Die beiden Eingaben stimmen nicht überein.' });
    const r = await sb.auth.updateUser({ password: pw });
    if (r.error) return setPhase({ k: 'passwort', err: 'Das Passwort konnte nicht gespeichert werden.' });
    window.history.replaceState(null, '', '/'); await next(sb);
  }); };
  const forgot = (form: HTMLFormElement | null) => { const email = form ? String(new FormData(form).get('email') || '') : ''; run(async sb => {
    if (!email) return setPhase({ k: 'anmelden', err: 'Bitte zuerst die E-Mail-Adresse eingeben.' });
    await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setPhase({ k: 'anmelden', info: 'Falls die Adresse eingeladen ist, kommt gleich eine E-Mail mit einem Link.' });
  }); };
  const signOut = () => run(async sb => { await sb.auth.signOut(); configureBackend(null); setPhase({ k: 'anmelden' }); });

  if (phase.k === 'bereit') return <App account={{ email: phase.user.email, signOut }} />;
  return <main className="gate"><div className="gate-card">
    <span className="brand"><span className="brand-mark" aria-hidden="true" /><span className="brand-text">HealthOS</span></span>
    {phase.k === 'laden' && <p role="status">Wird geladen …</p>}
    {phase.k === 'fehler' && <><h1>Nicht verfügbar</h1><p className="gate-err" role="alert">{phase.msg}</p></>}
    {phase.k === 'anmelden' && <form onSubmit={signIn}>
      <h1>Anmelden</h1>
      <p>Geschlossene Beta. Zugang nur mit Einladung.</p>
      <label htmlFor="email">E-Mail</label><input id="email" name="email" type="email" autoComplete="email" required />
      <label htmlFor="password">Passwort</label><input id="password" name="password" type="password" autoComplete="current-password" required />
      {phase.err && <p className="gate-err" role="alert">{phase.err}</p>}
      {phase.info && <p role="status">{phase.info}</p>}
      <button className="gate-btn" disabled={busy}>Anmelden</button>
      <button type="button" className="gate-link" onClick={e => forgot(e.currentTarget.form)}>Passwort vergessen</button>
    </form>}
    {phase.k === 'passwort' && <form onSubmit={setPassword}>
      <h1>Passwort festlegen</h1>
      <p>Mindestens 12 Zeichen. Danach richtest du den zweiten Faktor ein.</p>
      <label htmlFor="pw">Neues Passwort</label><input id="pw" name="pw" type="password" autoComplete="new-password" minLength={12} required />
      <label htmlFor="pw2">Wiederholen</label><input id="pw2" name="pw2" type="password" autoComplete="new-password" minLength={12} required />
      {phase.err && <p className="gate-err" role="alert">{phase.err}</p>}
      <button className="gate-btn" disabled={busy}>Speichern</button>
    </form>}
    {phase.k === 'faktor-einrichten' && <form onSubmit={verify(phase.factorId, phase)}>
      <h1>Zweiten Faktor einrichten</h1>
      <p>HealthOS verlangt vor dem ersten Speichern einen zweiten Faktor. Scanne den Code mit einer Authenticator-App und gib den sechsstelligen Code ein.</p>
      <img className="qr" src={phase.qr} alt="QR-Code für die Authenticator-App" />
      <p>Oder Schlüssel manuell eingeben:</p><p className="secret">{phase.secret}</p>
      <label htmlFor="code">Code aus der App</label><input id="code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" required />
      {phase.err && <p className="gate-err" role="alert">{phase.err}</p>}
      <button className="gate-btn" disabled={busy}>Bestätigen</button>
    </form>}
    {phase.k === 'faktor-pruefen' && <form onSubmit={verify(phase.factorId, phase)}>
      <h1>Bestätigen</h1>
      <p>Gib den Code aus deiner Authenticator-App ein.</p>
      <label htmlFor="code">Code</label><input id="code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" required />
      {phase.err && <p className="gate-err" role="alert">{phase.err}</p>}
      <button className="gate-btn" disabled={busy}>Bestätigen</button>
      <button type="button" className="gate-link" onClick={signOut}>Abmelden</button>
    </form>}
    {phase.k === 'einwilligung' && <form onSubmit={e => consent(e, phase.user)}>
      <h1>Bevor es losgeht</h1>
      <p>HealthOS speichert für dein Konto:</p>
      <ul><li>Ziele, Arbeitszeiten und Einstellungen</li><li>Routinen, Wochenplan, Gewohnheiten, Pausen ohne Grund</li><li>erledigte Trainingseinheiten und Schritte</li><li>Reviews mit gewählten Maßnahmen, ohne deine Antworten</li></ul>
      <p>Diese Angaben können Rückschlüsse auf deine Gesundheit zulassen. Gewicht, Mahlzeiten, Blutwerte, Termine und Dokumente sind in der Beta ausgeschaltet. Du kannst alle gespeicherten Daten jederzeit in den Einstellungen exportieren und löschen.</p>
      <label className="check"><input type="checkbox" required /> <span>Ich willige ein, dass HealthOS diese Angaben für mich speichert und verarbeitet. Die Einwilligung ist freiwillig und jederzeit widerrufbar.</span></label>
      {phase.err && <p className="gate-err" role="alert">{phase.err}</p>}
      <button className="gate-btn" disabled={busy}>Einwilligen und starten</button>
      <button type="button" className="gate-link" onClick={signOut}>Abmelden</button>
    </form>}
  </div></main>;
}
