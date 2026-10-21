'use client';
// Push-Erinnerungen ein- und ausschalten. Inhalte und Zeitpunkte folgen den Einstellungen unter „Erinnerungen“ (Intensität, Vorlauf, Ruhezeiten).
import React, { useEffect, useState } from 'react';

const b64ToBytes = s => { const p = '='.repeat((4 - (s.length % 4)) % 4); const raw = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(raw, c => c.charCodeAt(0)); };
const standalone = () => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
const isIos = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);

export function PushSettings({ ctx }) {
  const account = ctx.account; const sb = account && account.supabase;
  const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const [state, setState] = useState('pruefen'); const [msg, setMsg] = useState('');
  useEffect(() => {
    if (!sb) return;
    if (!supported) { setState(isIos() && !standalone() ? 'ios-homescreen' : 'nicht-unterstuetzt'); return; }
    if (Notification.permission === 'denied') { setState('blockiert'); return; }
    navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription()).then(s => setState(s ? 'an' : 'aus')).catch(() => setState('aus'));
  }, [sb]);
  if (!sb) return null;
  const enable = async () => {
    setMsg('');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setState(perm === 'denied' ? 'blockiert' : 'aus'); return; }
      const { data: key, error } = await sb.rpc('push_public_key');
      if (error || !key) { setMsg('Erinnerungen sind auf dem Server noch nicht eingerichtet.'); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) });
      const j = sub.toJSON();
      const r = await sb.from('push_subscriptions').insert({ user_id: account.userId, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth });
      if (r.error && r.error.code !== '23505') { setMsg('Das Gerät konnte nicht angemeldet werden.'); return; }
      setState('an');
    } catch { setMsg('Erinnerungen konnten nicht eingeschaltet werden.'); }
  };
  const disable = async () => {
    try { const reg = await navigator.serviceWorker.ready; const s = await reg.pushManager.getSubscription(); if (s) { await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint); await s.unsubscribe(); } setState('aus'); }
    catch { setMsg('Ausschalten hat nicht geklappt.'); }
  };
  const test = async () => {
    setMsg('');
    const { data: { session } } = await sb.auth.getSession();
    const r = await sb.functions.invoke('push-tick', { body: { test: true }, headers: { Authorization: `Bearer ${session && session.access_token}` } });
    setMsg(r.error ? 'Testnachricht konnte nicht gesendet werden.' : 'Testnachricht ist unterwegs.');
  };
  return <section className="block" aria-labelledby="push-h">
    <h2 className="h2" id="push-h">Erinnerungen aufs Handy</h2>
    <div className="panel">
      {state === 'ios-homescreen' && <p className="hint top0">Auf dem iPhone gehen Erinnerungen nur, wenn EvoVive auf dem Home-Bildschirm liegt: im Safari-Menü „Zum Home-Bildschirm“, dann EvoVive von dort öffnen.</p>}
      {state === 'nicht-unterstuetzt' && <p className="hint top0">Dieser Browser unterstützt keine Push-Erinnerungen.</p>}
      {state === 'blockiert' && <p className="hint top0">Benachrichtigungen sind für EvoVive blockiert. Du kannst sie in den Einstellungen des Browsers oder Handys wieder erlauben.</p>}
      {(state === 'aus' || state === 'an') && <p className="hint top0">{state === 'an' ? 'Eingeschaltet auf diesem Gerät.' : 'Ausgeschaltet.'} Zeitpunkte und Umfang folgen deinen Einstellungen zu Erinnerungen und Ruhezeiten. Nachrichten nennen nur Plan und Uhrzeit, nie Messwerte.</p>}
      <div className="btn-row">
        {state === 'aus' && <button className="btn small primary" onClick={enable}>Einschalten</button>}
        {state === 'an' && <><button className="btn small" onClick={test}>Testnachricht</button><button className="btn small ghost" onClick={disable}>Ausschalten</button></>}
      </div>
      {msg && <p className="hint" role="status">{msg}</p>}
    </div>
  </section>;
}
