// Speicher-Fassade mit derselben Schnittstelle wie der Artifact-Speicher der Referenz.
// Dahinter steckt ein austauschbares Backend: Browser (Entwicklungs-Demo) oder Supabase (Beta).
let backend = null;
export function configureBackend(b) { backend = b; }

const ref = (c, key) => ({ key, set: body => c.backend.put(key, body), delete: () => c.backend.remove(key) });
export const Store = {
  async connect() { return backend ? { backend } : null; },
  refs(c) { return { settings: ref(c, 'settings'), plan: ref(c, 'plan'), habits: ref(c, 'habits'), activity: ref(c, 'activity'), koerper: ref(c, 'koerper'), weeks: { doc: id => ref(c, `week:${id}`) } }; },
  async load(c) {
    const docs = await c.backend.getAll();
    const m = Object.fromEntries(docs.map(d => [d.key, d.body]));
    if (!m.settings) return null;
    return { settings: m.settings, plan: m.plan || null, habits: m.habits || null, activity: m.activity || null, koerper: m.koerper || null, weeks: docs.filter(d => d.key.startsWith('week:')).map(d => ({ id: d.key.slice(5), ...d.body })) };
  },
  async write(r, body) { await r.set(body); },
  async deleteAll(c) { await c.backend.removeAll(); },
};
