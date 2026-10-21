// Speicher-Backends. Beide speichern dieselben Dokumente: settings, plan, habits, activity, koerper, week:JJJJ-MM-TT.
export const DOC_KEY = /^(settings|plan|habits|activity|koerper|checkins|week:\d{4}-\d{2}-\d{2})$/;

/** Entwicklungs-Demo: nur im Browser dieses Geräts, nie für echte Daten. */
export function browserBackend(storage = globalThis.localStorage, prefix = 'healthos-demo:') {
  const keys = () => Object.keys(storage).filter(k => k.startsWith(prefix));
  return {
    kind: 'browser',
    async getAll() { return keys().map(k => ({ key: k.slice(prefix.length), body: JSON.parse(storage.getItem(k)) })); },
    async put(key, body) { if (!DOC_KEY.test(key)) throw new Error(`Ungültiger Schlüssel ${key}`); storage.setItem(prefix + key, JSON.stringify(body)); },
    async remove(key) { storage.removeItem(prefix + key); },
    async removeAll() { keys().forEach(k => storage.removeItem(k)); },
  };
}

/** Beta: Tabelle public.app_documents in Supabase, geschützt durch RLS (eigener Nutzer, zweiter Faktor, Einwilligung). */
export function supabaseBackend(client, userId) {
  const t = () => client.from('app_documents');
  const fail = (error, what) => { const e = new Error(`${what}: ${error.message}`); e.code = error.code === '42501' ? 'revoked' : error.code || 'unbekannt'; throw e; };
  return {
    kind: 'supabase',
    async getAll() { const { data, error } = await t().select('doc_key, body'); if (error) fail(error, 'Laden'); return (data || []).map(r => ({ key: r.doc_key, body: r.body })); },
    async put(key, body) {
      if (!DOC_KEY.test(key)) throw new Error(`Ungültiger Schlüssel ${key}`);
      const { error } = await t().upsert({ user_id: userId, doc_key: key, body }, { onConflict: 'user_id,doc_key' });
      if (error) fail(error, 'Speichern');
    },
    async remove(key) { const { error } = await t().delete().eq('doc_key', key); if (error) fail(error, 'Löschen'); },
    async removeAll() { const { error } = await t().delete().eq('user_id', userId); if (error) fail(error, 'Löschen'); },
  };
}
