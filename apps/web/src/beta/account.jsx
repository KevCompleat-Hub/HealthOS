'use client';
// Konto: vollständiger Datenexport (Art. 20 DSGVO), Konto löschen (Art. 17 DSGVO, Entscheidung E-5), Versionsstand.
import React, { useState } from 'react';
import { Store } from '../storage/store';
import { browserDownloads } from '../legacy/support';

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'Entwicklung';

/** Alle gespeicherten Daten als JSON: in der Beta über die Datenbankfunktion (inklusive Einwilligungen), sonst alle Dokumente. */
export async function exportAllData({ account, today }) {
  let payload;
  if (account && account.supabase) {
    const { data, error } = await account.supabase.rpc('export_my_beta_data');
    if (error) throw new Error('Export fehlgeschlagen');
    payload = { ...data, app_version: APP_VERSION };
  } else {
    const c = await Store.connect(); const docs = c ? await c.backend.getAll() : [];
    payload = { format: 'healthos-beta-export', exported_at: new Date().toISOString(), app_version: APP_VERSION, documents: docs.map(d => ({ key: d.key, body: d.body })) };
  }
  await browserDownloads.save({ filename: `healthos-alle-daten-${today}.json`, data: JSON.stringify(payload, null, 2) });
  return payload;
}

export function AccountExtras({ ctx }) {
  const { account, today } = ctx;
  const [step, setStep] = useState(0); const [word, setWord] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const doExport = async () => { setMsg(''); try { await exportAllData({ account, today }); setMsg('Export erstellt: alle gespeicherten Daten als Datei.'); } catch { setMsg('Export war nicht möglich. Bitte später erneut versuchen.'); } };
  const doDelete = async () => {
    setBusy(true); setMsg('');
    try {
      const sb = account.supabase; const { data: { session } } = await sb.auth.getSession();
      const r = await sb.functions.invoke('account-delete', { body: { bestaetigung: word }, headers: { Authorization: `Bearer ${session && session.access_token}` } });
      if (r.error) throw r.error;
      await account.signOut();
    } catch { setBusy(false); setMsg('Das Konto konnte nicht gelöscht werden. Bitte später erneut versuchen.'); }
  };
  return <div className="b-account">
    <div className="btn-row"><button className="btn small" onClick={doExport}>Alle Daten exportieren</button></div>
    {account && account.supabase && <>
      {step === 0 && <div className="btn-row"><button className="btn small ghost danger" onClick={() => setStep(1)}>Konto löschen</button></div>}
      {step === 1 && <div className="panel b-delete" role="group" aria-labelledby="del-h">
        <h3 className="h3 top0" id="del-h">Konto endgültig löschen</h3>
        <p className="hint top0">Gelöscht werden dein Konto, alle gespeicherten Daten, Einwilligungen und angemeldeten Geräte für Erinnerungen. Das lässt sich nicht rückgängig machen. In Datensicherungen des Dienstleisters können Daten bis zu deren Überschreiben noch enthalten sein. Exportiere vorher, was du behalten möchtest.</p>
        <label className="b-field"><span>Zur Bestätigung LÖSCHEN eingeben</span><input className="input" value={word} onChange={e => setWord(e.target.value)} autoComplete="off" /></label>
        <div className="btn-row"><button className="btn small danger" disabled={word !== 'LÖSCHEN' || busy} onClick={doDelete}>{busy ? 'Wird gelöscht …' : 'Endgültig löschen'}</button><button className="btn small ghost" onClick={() => { setStep(0); setWord(''); }}>Abbrechen</button></div>
      </div>}
    </>}
    <p className="hint">Version {APP_VERSION}</p>
    {msg && <p className="hint" role="status">{msg}</p>}
  </div>;
}
