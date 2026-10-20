# @healthos/web, geschlossene Beta

Next.js 16 (App Router), React 19, PWA. Oberfläche und Gestaltung stammen unverändert aus der Referenz v5,
die gesamte Fachlogik aus dem geprüften M1-Kern `@healthos/domain`.

- `src/legacy/HealthOSApp.jsx` wird von `tools/build-web-ui.mjs` erzeugt. Nicht von Hand ändern, sondern den Generator anpassen.
- `src/features.js` legt den Beta-Umfang fest. Ausgeschaltet: Gewicht, Mahlzeiten, Blutwerte, Termine, Dokumente, Empfehlungen, Ziel „Blutwerte“.
- `src/storage`: gleiche Speicherschnittstelle wie in der Referenz. Backends: Browser (nur Entwicklungs-Demo) und Supabase (Beta).
- `src/app/shell.tsx`: Anmeldung, zweiter Faktor, Einwilligung, danach die App.

## Modi

| `NEXT_PUBLIC_HEALTHOS_MODE` | Verhalten |
| --- | --- |
| `demo` (Standard) | fiktive Demo-Daten, Speicherung nur im Browser, keine Anmeldung. Nur zur Entwicklung. |
| `beta` | Anmeldung mit E-Mail und Passwort, zweiter Faktor Pflicht, Einwilligung, Speicherung in Supabase. Braucht `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |

## Befehle

```
pnpm --filter @healthos/domain build && node tools/build-web-ui.mjs   # aus dem Wurzelverzeichnis
cd apps/web && npx next build && npx next start
node test/run-all.mjs                                                  # Typprüfung und Klicktests
HEALTHOS_DB_TEST=1 node test/run-all.mjs                               # zusätzlich gegen den lokalen Datenbank-Prüfstand
```
