'use client';
// Konto: vollständiger Datenexport (Art. 20 DSGVO), Konto löschen (Art. 17 DSGVO, Entscheidung E-5), Versionsstand.
import React, { useState } from 'react';
import { Store } from '../storage/store';
import { browserDownloads } from '../legacy/support';
import { DOC_KEY } from '../storage/backends';

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
  await browserDownloads.save({ filename: `evovive-alle-daten-${today}.json`, data: JSON.stringify(payload, null, 2) });
  return payload;
}

/** Export-Datei prüfen: nur bekannte Dokumentschlüssel, nur Objekte, keine Gesundheitsakte. Liefert die übernehmbaren Dokumente. */
export function parseBetaExport(text) {
  let o; try { o = JSON.parse(text); } catch { return { fehler: 'Die Datei ist kein gültiges JSON.' }; }
  if (!o || o.format !== 'healthos-beta-export' || !Array.isArray(o.documents)) return { fehler: 'Das ist keine EvoVive-Exportdatei.' };
  const BLOCK = ['labs', 'meals', 'appointments', 'documents'];
  const docs = o.documents.filter(d => d && typeof d.key === 'string' && DOC_KEY.test(d.key) && d.body && typeof d.body === 'object' && !Array.isArray(d.body) && !BLOCK.some(k => k in d.body) && (d.key === 'koerper' || !('weights' in d.body)));
  if (!docs.some(d => d.key === 'settings')) return { fehler: 'In der Datei fehlen die Einstellungen.' };
  return { docs: docs.map(d => ({ key: d.key, body: d.body })), verworfen: o.documents.length - docs.length };
}

/** Dokumente in den aktuellen Speicher schreiben (überschreibt gleichnamige), danach neu laden. */
export async function importDocs(docs) {
  const c = await Store.connect(); if (!c) throw new Error('Kein Speicher');
  for (const d of docs) await c.backend.put(d.key, d.body);
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
  const [imp, setImp] = useState(null);
  const pickImport = async e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return; setMsg(''); const r = parseBetaExport(await f.text()); if (r.fehler) { setImp(null); setMsg(r.fehler); } else setImp(r); };
  const doImport = async () => { try { await importDocs(imp.docs); setMsg(`${imp.docs.length} Dokumente übernommen. Die App lädt neu.`); setTimeout(() => window.location.reload(), 600); } catch { setMsg('Übernahme fehlgeschlagen. Ist die Einwilligung erteilt?'); } };
  return <div className="b-account">
    <div className="btn-row"><button className="btn small" onClick={doExport}>Alle Daten exportieren</button>
      <label className="btn small ghost b-file">Daten aus Export übernehmen<input type="file" accept="application/json,.json" onChange={pickImport} /></label></div>
    {imp && <div className="panel"><p className="hint top0">{imp.docs.length} Dokumente gefunden{imp.verworfen ? `, ${imp.verworfen} nicht übernehmbar` : ''}. Gleichnamige Daten in diesem Konto werden überschrieben.</p>
      <div className="btn-row"><button className="btn small primary" onClick={doImport}>Übernehmen</button><button className="btn small ghost" onClick={() => setImp(null)}>Abbrechen</button></div></div>}
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
