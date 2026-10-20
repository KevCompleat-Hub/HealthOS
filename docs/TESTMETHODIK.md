# Testmethodik Phase M1

## Ziel

Der TypeScript-Kern muss für dieselben Eingaben dieselben Ergebnisse liefern wie die eingefrorene Referenz v5. Das prüfen vier Testarten.

| Testart | Frage | Ort |
| --- | --- | --- |
| Differenztests | Liefern alter und neuer Kern bei Tausenden erzeugter Fälle dasselbe? | `tools/parity` |
| Mutationstest | Würden die Differenztests einen echten Regelfehler bemerken? | `tools/parity/mutants.mjs` |
| Originale Testreihen | Bestehen alle bisherigen Tests der Referenz auch mit dem neuen Kern? | `tools/run-reference-suites.mjs` |
| Fachliche Unit-Tests | Ist jede zentrale Geschäftsregel einzeln belegt? | `packages/domain/test` |

## Differenztests

Beide Kerne werden als Node-Module geladen und mit identischen Eingaben aufgerufen. Bereiche:

- **Kataloge:** alle Stammdaten, Fragen, Labormarker, Routinenvorlagen.
- **Datum:** jeder Tag vom 25.12.2023 bis 07.01.2029 mit 20 Datumsfunktionen.
- **Europe/Berlin:** jede Viertelstunde 24 Stunden vor und nach jeder Zeitumstellung 2025 bis 2028, Jahreswechsel, jede Stunde 2026 und 2027.
- **Konfiguration und Wochenplan:** 3.000 zufällige, teils absichtlich ungültige Konfigurationen, Planwechsel auf bestehende, angepasste und archivierte Routinen, Ruhezeiten in 15-Minuten-Schritten.
- **Labor und Empfehlungen:** 5.000 zufällige Laborlisten mit abweichenden Schreibweisen, Einheiten, fehlenden Referenzen, Bestätigungen und Altersstufen, dazu zufällige Entscheidungsstände.
- **Import, Speicher, Migration:** 1.500 echte und beschädigte Exporte, Exporte der Vorversion (Schema 1), gespeicherte Stände mit alten Pausengründen.
- **Zustandsverläufe:** 12 Konfigurationen mal 24 Startdaten (darunter 19.10.2026, beide Zeitumstellungen, 01.11.2026, Jahreswechsel) mal 21 Tage. Beide Kerne erhalten jeden Tag dieselben 0 bis 4 zufälligen Aktionen: abhaken, nacherfassen, auslassen, verschieben, Ersatztermin, löschen, Aufgabe anlegen, Training erfassen, Mahlzeit erfassen, Gewohnheit, Pause setzen und aufheben, Routine anlegen und ändern, Status, Duplizieren, Einzeltermin, ab Datum, Wochentagsausnahme, Empfehlung annehmen und ablehnen, Hinweis ausblenden, Review mit Fragen und Maßnahme, Review verschieben, Einstellungen ändern. Nach jeder Aktion wird der gesamte Zustand verglichen, an jedem Tag zusätzlich alle abgeleiteten Ergebnisse (Status, Als Nächstes zu acht Uhrzeiten, Coach-Hinweis, Hinweise in drei Intensitäten, Wochenkennzahlen, Empfehlungen, Konflikte, Review-Zeitpunkte, Datengrundlage, Export, Speicher), an jedem dritten Tag und am Check-in-Tag auch Wochen- und Monatskennzahlen, Fragen und Coach mit sechs Antwortkombinationen samt Wirkung jeder Maßnahme.
- **Zeitzonen:** Der komplette Lauf wiederholt sich in Europe/Berlin, UTC, America/New_York und Asia/Tokyo, weil die Referenz Kalendertage über lokale Date-Objekte rechnet.

### Was „gleich“ bedeutet

- Gleichheit im JSON-Sinn, so wie Daten gespeichert und exportiert werden. Schlüsselreihenfolge spielt keine Rolle. Ein Feld mit Wert `undefined` gilt wie ein fehlendes Feld.
- Erzeugte IDs (`<präfix>_<zähler>_<zufall>`) werden in Reihenfolge ihres ersten Auftretens durch Platzhalter ersetzt, weil Zähler und Zufallsteil zwischen zwei Modulen naturgemäß verschieden sind. Struktur, Präfix und Verweise zwischen Objekten werden weiterhin verglichen.
- Funktionen in Ergebnissen (etwa der Änderungstext einer Coach-Maßnahme) werden über ihr Verhalten geprüft: Text für beide Startdaten und tatsächliche Wirkung auf Plan und Einstellungen.
- Wirft eine Funktion einen Fehler, muss die andere denselben Fehler werfen.

### Grenzen

- Die Differenztests belegen Gleichheit für die erzeugten Fälle, nicht für alle denkbaren Eingaben.
- Die Oberfläche ist nicht Teil von M1. Klicktests prüfen weiterhin die Oberfläche der Referenz.
- Die Klicktests der Referenz nutzen feste Wartezeiten. Unter hoher Rechnerlast wird ein Fehlschlag einmal wiederholt und im Bericht ausgewiesen.
