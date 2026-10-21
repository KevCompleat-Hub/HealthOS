# HealthOS

Persönliche Wochenplanung für Training, Bewegung, Gewohnheiten und Körperwerte. Geschlossene Beta, Version siehe `package.json` und `docs/RELEASE-NOTES.md`.

- App: Next.js-PWA in `apps/web`, Fachkern in `packages/domain`, Datenbank und Dienste in `supabase/`.
- Freigabestand und offene Sperren: `docs/RELEASE-GATES.md`. Entscheidungen: `docs/ENTSCHEIDUNGEN.md`.
- Tests: `cd apps/web && node test/run-all.mjs` (mit lokalem Datenbank-Prüfstand: `HEALTHOS_DB_TEST=1`).

Die folgenden Abschnitte beschreiben die Grundlage aus Phase M1.

## Inhalt

| Pfad | Inhalt |
| --- | --- |
| `packages/domain/src` | TypeScript-Kern: Datum und Zeitzone, Konfiguration, Wochenplan, Routinen, Statuslogik, Health Intelligence, Reviews und Coach, Import und Export, Demo-Daten |
| `packages/domain/test` | fachliche Unit-Tests (Vitest), je Test eine Geschäftsregel |
| `packages/reference` | eingefrorene Referenz v5 und v2, originale Testreihen, Build mit Prüfsummenkontrolle |
| `tools/parity` | Differenztests Referenz gegen neuen Kern, Mutationstest, Berichte |
| `tools/run-reference-suites.mjs` | originale Testreihen der Referenz mit dem TypeScript-Kern |
| `tools/coverage-map.mjs` | ordnet jeden Namen der Referenz einem Modul zu oder begründet, warum er nicht portiert ist |
| `tools/extract-catalog.py` | erzeugt die Kataloge unverändert aus der Referenz |
| `docs/` | Abnahmebericht M1, Funktionsabdeckung, Entscheidungen, Architektur-Backlog |
| `PRUEFSUMMEN.txt` | SHA-256 aller Dateien dieses Pakets |

## Voraussetzungen

Node.js 20 oder neuer und pnpm 9 (`npm install -g pnpm@9`).

## Befehle

```
pnpm install
pnpm test                    # alles: Typprüfung, Referenz bauen, Unit-, Paritäts- und Referenztests
pnpm typecheck               # TypeScript im strengen Modus
pnpm test:unit               # fachliche Unit-Tests
pnpm test:parity             # Differenztests in vier Zeitzonen (Laufzeit je nach Rechner 10 bis 40 Minuten)
node tools/parity/run.mjs --quick   # verkürzter Differenztest
node tools/parity/mutants.mjs       # prüft, dass die Differenztests absichtlich eingebaute Fehler erkennen
pnpm test:reference-suites   # originale Testreihen gegen Referenz und gegen den TypeScript-Kern
```

Jeder Befehl endet bei einem Fehler mit Exit-Status ungleich 0.

## Regeln für diese Phase

1. Die Referenz v5 ist verbindlich. `packages/reference/build.mjs` bricht ab, wenn sich ihr Quelltext ändert.
2. Keine fachliche Änderung im Kern, solange die Parität nicht bestätigt ist. Gefundene Auffälligkeiten der Referenz werden dokumentiert, nicht still korrigiert.
3. Der Kern liest keine Uhr. Datum und Uhrzeit werden immer übergeben.
4. Keine echten personenbezogenen Gesundheitsdaten, nur fiktive Demo-Werte.

## Ohne GitHub weiterarbeiten

Lade das ZIP dieser Phase in die Projektdateien des Claude-Projekts „Health OS“. Für M2 wird es in ein privates Repository übernommen.
