# Testergebnisse Phase M1

Erzeugt am 19.10.2026 aus den Berichten in tools/parity/reports. Grundlage: Referenz v5.

## Differenztests Referenz v5 gegen TypeScript-Kern

| Zeitzone | Vergleiche | Abweichungen | Aktionen im Zustandsverlauf |
| --- | --- | --- | --- |
| Europe/Berlin | 271.375 | 0 | 12.093 |
| UTC | 271.375 | 0 | 12.093 |
| America/New_York | 271.375 | 0 | 12.093 |
| Asia/Tokyo | 277.375 | 0 | 12.093 |

Ergänzungslauf Coach-Historie (nach dem ersten Mutationstest hinzugefügt, im Volllauf Asia/Tokyo bereits enthalten):

| Zeitzone | Vergleiche | Abweichungen |
| --- | --- | --- |
| Europe/Berlin | 6.000 | 0 |
| UTC | 6.000 | 0 |
| America/New_York | 6.000 | 0 |
| Asia/Tokyo | 6.000 | 0 |

Vergleiche je Bereich, Summe über alle Zeitzonen:

| Bereich | Vergleiche |
| --- | --- |
| Kataloge | 232 |
| Datum | 7.364 |
| Format | 8.000 |
| Europe/Berlin | 77.800 |
| Konfiguration | 36.000 |
| Wochenplan | 38.044 |
| Routinen | 24.000 |
| Ruhezeiten | 7.680 |
| Laborprüfung | 40.000 |
| Empfehlungen | 84.192 |
| Laboranzeige | 20.000 |
| Import | 13.200 |
| Speicher | 30.192 |
| Migration | 6.000 |
| Demo-Daten | 1.152 |
| Zustand | 24.192 |
| Status | 24.192 |
| Als Nächstes | 193.536 |
| Coach-Hinweis | 24.192 |
| Hinweise | 72.576 |
| Wochenkennzahlen | 24.192 |
| Konflikte | 24.192 |
| Review-Zeitpunkte | 120.960 |
| Datengrundlage | 24.192 |
| Export | 24.192 |
| Reviews | 24.192 |
| Wochenreview | 10.408 |
| Monatsreview | 10.408 |
| Fragen | 10.408 |
| Coach | 31.440 |
| Aktionen | 48.372 |
| Coach-Historie | 30.000 |

## Mutationstest

Jede Mutante ändert genau eine Geschäftsregel in einer Kopie des Kerns. Die Differenztests müssen jede erkennen.

| Eingebauter Fehler | Erkannt | Erste gemeldete Abweichung |
| --- | --- | --- |
| Tageswechsel: optionale Erfassung wird „verpasst“ | ja | Zustand / K0/S2026-10-19 Tag 1 (2026-10-20) state |
| Empfehlungen: drei statt zwei neue pro Woche | ja | Empfehlungen / recView #0 |
| Check-in-Fenster einen Tag kürzer | ja | Review-Zeitpunkte / K0/S2026-10-19 Tag 0 (2026-10-19) reviewOffer 0 |
| Wochenziel ignoriert pausierte Routinen | ja | Datengrundlage / K0/S2026-10-24 Tag 4 (2026-10-28) coverage |
| Alle zwei Wochen wird jede Woche | ja | Aktionen / K0/S2026-10-19 Tag 4 (2026-10-23) nach saveNew |
| Laborwert gilt nur 12 statt 18 Monate | ja | Laborprüfung / zink #0 |
| Zeitzone London statt Berlin | ja | Europe/Berlin / 2025-03-29T00:00:00.000Z |
| Einzeländerung wird von der Planung überschrieben | ja | Aktionen / K0/S2026-10-24 Tag 4 (2026-10-28) nach editInstance |
| Training doppelt gezählt | ja | Datengrundlage / K0/S2026-10-19 Tag 0 (2026-10-19) coverage |
| Pause aufheben stellt Plan nicht wieder her | ja | Aktionen / K0/S2026-12-28 Tag 8 (2027-01-07) nach unpause |
| Verpasster Check-in wird nicht nacherfasst | ja | Aktionen / K0/S2026-10-25 Tag 12 (2026-11-09) nach review |
| Coach blockiert drei statt zwei Reviews | ja, im ersten Lauf nicht erkannt, nach Ergänzung der Testreihe Coach-Historie erkannt | Coach-Historie / priorDecisions #5 |

## Originale Testreihen der Referenz

Im Modus „ts-kern“ stammen 167 Fachfunktionen und Konstanten aus dem TypeScript-Kern. 77 Oberflächen-Komponenten kommen weiterhin aus der Referenz, weil M1 keine Oberfläche portiert.

| Testreihe | Referenz | TypeScript-Kern |
| --- | --- | --- |
| smoke | alle Screens rendern | alle Screens rendern |
| test4 | 87 von 87 Tests bestanden | 87 von 87 Tests bestanden |
| test5 | 54 von 54 Review-Tests bestanden | 54 von 54 Review-Tests bestanden |
| test6 | 59 von 59 Korrekturtests bestanden | 59 von 59 Korrekturtests bestanden |
| e2e2 | 32 von 32 Klicktests bestanden | 32 von 32 Klicktests bestanden |
| e2e3 | 39 von 39 Klicktests bestanden | 39 von 39 Klicktests bestanden |
| e2e4 | 31 von 31 Klicktests bestanden | 31 von 31 Klicktests bestanden |
| a11y | 14 Ansichten geprüft, 0 Probleme | 14 Ansichten geprüft, 0 Probleme |

## Fachliche Unit-Tests (Vitest)

23 von 23 bestanden, 0 fehlgeschlagen.

**Gesamtergebnis: alle Prüfungen bestanden**
