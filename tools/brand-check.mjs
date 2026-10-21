// Markenprüfung: Im Produktions-Build darf für Nutzer kein „HealthOS“ mehr sichtbar sein.
// Geprüft werden ausgelieferte Seiten, Skripte, Manifest, Service Worker und Offline-Seite. Exit-Status 1 bei Fund.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
const web = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../apps/web');
const roots = [path.join(web, '.next/static'), path.join(web, '.next/server/app'), path.join(web, 'public')];
const hits = [];
const walk = d => { if (!existsSync(d)) return; for (const f of readdirSync(d)) { const p = path.join(d, f); const s = statSync(p);
  if (s.isDirectory()) { walk(p); continue; } if (!/\.(js|html|json|webmanifest|txt|rsc|body)$/.test(f)) continue;
  const t = readFileSync(p, 'utf8'); const re = /HealthOS(?![A-Za-z])/g; let m;
  while ((m = re.exec(t))) { const ctx = t.slice(Math.max(0, m.index - 40), m.index + 48).replace(/\s+/g, ' '); if (/healthos-(beta-)?export/.test(ctx)) continue;
    // Ausnahme: Meldung aus dem Fachkern (Parität zur Referenz), wird in der Oberfläche beim Anzeigen auf „EvoVive“ umgeschrieben.
    if (/keine HealthOS-Exportdatei\."\};if\(!\[1,2\]/.test(ctx)) continue; hits.push(`${path.relative(web, p)}: …${ctx}…`); if (hits.length > 30) break; } } };
roots.forEach(walk);
if (!existsSync(path.join(web, '.next/static'))) { console.log('Kein Produktions-Build gefunden. Erst „next build“ ausführen.'); process.exit(1); }
console.log(hits.length ? `Sichtbares „HealthOS“ gefunden:\n${hits.join('\n')}` : 'Markenprüfung: kein sichtbares „HealthOS“ im Produktions-Build.');
process.exit(hits.length ? 1 : 0);
