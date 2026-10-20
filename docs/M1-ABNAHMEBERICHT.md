# Abnahmebericht Phase M1: Domänenkern und Differenztests

Version `0.1.0-m1` · Stand 19.10.2026 · Grundlage: eingefrorene Referenz v5 · Entscheidung über die Freigabe: Kevin Gimpel

## Ergebnis

Alle Abnahmekriterien von M1 sind erfüllt. Die Freigabe steht noch aus.

- **Differenztests:** 1.109.500 Vergleiche in vier Zeitzonen, **0 Abweichungen** zwischen Referenz v5 und TypeScript-Kern.
- **Mutationstest:** 12 von 12 absichtlich eingebauten Regelfehlern erkannt. Einer davon wurde erst nach einer Ergänzung erkannt, siehe M1-2.
- **Originale Testreihen:** alle 200 Logikprüfungen sowie Klick-, Render- und Barrierefreiheitstests der Referenz bestehen mit dem neuen Kern, ohne Wiederholung.
- **Unit-Tests und Typprüfung:** 23 von 23 fachliche Unit-Tests bestanden, Typprüfung im strengen Modus fehlerfrei.

Einzelheiten stehen in `docs/TESTERGEBNISSE.md`.

## Lieferumfang

- TypeScript-Kern `packages/domain` mit 18 Modulen und 1.849 Zeilen. Er deckt HOS-001 bis HOS-006 ab: Datum und Europe/Berlin, Konfiguration, Wochenplan, Routinenversionen und Ausnahmen, Pausen, Aufgabenklassen und Tageswechsel, „Als Nächstes“, Hinweise, Health Intelligence, Reviews, Coach, Import, Export, Migration und fiktive Demo-Daten.
- Eingefrorene Referenz v5 und v2 mit Prüfsummenkontrolle beim Bauen.
- Differenztests, Mutationstest, originale Testreihen, fachliche Unit-Tests, Berichtsgenerator.
- Dokumente: Testergebnisse, Testmethodik, Funktionsabdeckung, Entscheidungen E-1 bis E-8, Architektur-Backlog.

## Abnahmekriterien M1

| Nr. | Kriterium | Nachweis | Erfüllt |
| --- | --- | --- | --- |
| M1-1 | Differenztests ohne Abweichung | `docs/TESTERGEBNISSE.md`: Volllauf in Europe/Berlin, UTC, America/New_York, Asia/Tokyo | ja: 1.109.500 Vergleiche, 0 Abweichungen |
| M1-2 | Die Differenztests erkennen echte Regelfehler | Mutationstest mit 12 absichtlich eingebauten Fehlern | ja, mit Einschränkung: Im ersten Lauf wurden 11 von 12 erkannt. Nicht erkannt wurde ein Coach, der übernommene Maßnahmen drei statt zwei Reviews sperrt. Ich habe daraufhin die Testreihe „Coach-Historie“ ergänzt (6.000 Vergleiche je Zeitzone, 0 Abweichungen). Die Gegenprobe erkennt diese Mutante jetzt. Die übrigen 11 Mutanten wurden mit der erweiterten Testreihe nicht erneut geprüft. Da die Ergänzung nur zusätzliche Fälle prüft, bleiben sie erkannt. |
| M1-3 | Alle vorhandenen Referenztests bleiben erhalten und laufen gegen den neuen Kern | 200 Logikprüfungen (87 + 54 + 59) mit dem TypeScript-Kern bestanden, Klicktests, Rendertest und Barrierefreiheit grün, ohne Wiederholung | ja |
| M1-4 | Streng typisiert | `tsc` mit `strict`, `noImplicitReturns` und `noUnusedLocals` ohne Fehler | ja |
| M1-5 | Jede Funktion der Referenz zugeordnet | `docs/FUNKTIONSABDECKUNG.md`: 167 portiert, 2 intern, 11 begründet nicht portiert, 77 Oberfläche für M3, 0 offen | ja |
| M1-6 | Referenz unverändert | Prüfsummen v5 und v2 werden bei jedem Build geprüft, Artifact nicht verändert | ja |
| M1-7 | Keine stillschweigenden Regeländerungen | Nur zwei Signaturen geändert (siehe unten), drei Befunde der Referenz dokumentiert und bewusst nicht korrigiert | ja |
| M1-8 | Keine Oberfläche, keine Gesundheitsdienste, keine echten Gesundheitsdaten | Kern ohne React, ohne Netzwerk, nur fiktive Demo-Werte | ja |
| M1-9 | Fachliche Regeln einzeln belegt | 23 von 23 Unit-Tests | ja |

## Abweichungen gegenüber der Referenz

Nur Signaturen, kein Verhalten:

1. `berlinParts(d)`: Der Zeitpunkt ist Pflichtparameter. In der Referenz war `new Date()` der Standardwert.
2. `buildExport(cfg, data, exportedAt)`: Der Exportzeitpunkt wird übergeben.
3. Die ID-Erzeugung ist für Tests austauschbar (`configureIds`). Format und Standardverhalten sind unverändert.

Damit liest der Kern keine Uhr. Die originalen Testreihen nutzen einen kleinen Adapter, der diese beiden Funktionen wie bisher aufruft.

## Befunde in der Referenz, unverändert übernommen

Diese Punkte verhalten sich in Referenz und neuem Kern nachweislich gleich. Sie werden nicht still korrigiert, sondern zur Entscheidung vorgelegt.

| Nr. | Befund | Auswirkung | Vorschlag für M2 |
| --- | --- | --- | --- |
| B-01 | Eine nicht lesbare Check-in-Zeit wie „abends“ wird nicht durch 18:00 ersetzt, weil nur auf leere Werte geprüft wird | Der Check-in landet auf 07:15, mit einem irreführenden Ruhezeit-Hinweis. Über die Oberfläche nicht erreichbar, nur über Import oder gespeicherte Daten | Uhrzeiten beim Import und in `normalizeConfig` streng prüfen |
| B-02 | `parseImport` akzeptiert einen Export ohne gültige Tabellen und liefert stillschweigend einen Standardplan mit 6 Routinen | Eine kaputte Datei sieht wie ein erfolgreicher Import aus | Serverseitige Schema-Prüfung, Fehler statt Standardplan |
| B-03 | `normalizeConfig` übernimmt unbekannte Felder aus der Eingabe | Fremde Felder könnten gespeichert werden | Unbekannte Felder in M2 verwerfen |
| B-04 | Export schreibt Entscheidungen als „übernommen“ und „nicht jetzt“, das Datenbankschema erwartet `uebernommen` und `nicht_jetzt` | Ohne Abbildung schlägt der Import in die Datenbank fehl | Abbildung im Import festlegen und testen |
| B-05 | IDs werden mit `Math.random` erzeugt | Für ein lokales Artifact ausreichend, für eine Datenbank nicht | In M2 UUIDs aus der Datenbank, `instance_key` behält das bisherige Format |

## Grenzen der Aussage

- Die Differenztests belegen Gleichheit für die erzeugten Fälle, nicht für jede denkbare Eingabe. Der Mutationstest zeigt, dass typische Regelfehler auffallen.
- Gleichheit gilt im JSON-Sinn. Ein Feld mit Wert `undefined` gilt wie ein fehlendes Feld, weil beides gleich gespeichert wird.
- `noUncheckedIndexedAccess` ist nicht aktiv. Der Kern nutzt 101 Typumwandlungen mit `as`, meist an Stellen, an denen die Referenz lose Daten verarbeitet.
- Getestet mit Node.js 22. Node.js 20 ist als Mindestversion angegeben, aber nicht eigens geprüft.
- Ein Volllauf der Differenztests dauert auf einem Prozessorkern rund 15 Minuten je Zeitzone.

## Offene Punkte für M2

1. Architektur-Backlog A-1 bis A-5 umsetzen. Dazu gehören:
   - Einwilligung für laborbezogene Empfehlungs- und Review-Datensätze
   - Rechte nach Widerruf einer Einwilligung
   - vollständiger Export
   - SQL-Tests mit Fehler-Exit
   - selbst gehostete Schriften
2. Über die Befunde B-01 bis B-05 entscheiden.
3. Das SQL-Schema gegen eine echte Supabase-Instanz in Frankfurt ausführen und die Datenbanktests dort wiederholen.
4. Repositories für jede Tabelle mit Rundlauftests. Domänenobjekt speichern und laden muss dasselbe Objekt ergeben.
5. Rückgängig über Änderungssätze (`plan_changesets`) statt Sitzungs-Schnappschuss.
6. Import aus dem Artifact nur für Einstellungen und Routinen (E-2), mit Prüfsumme gegen Doppelimport.
7. Zweiter Faktor vor der ersten Einwilligung für Gesundheitsdaten (E-6). Klären, ob die Datenbank die Sicherheitsstufe der Sitzung prüfen kann.
8. Reflexionsantworten mit gesonderter Einwilligung speichern können (E-3). Die Auswertung über Zeit ist eine neue Funktion nach M7.
9. Für Repository und CI wird GitHub benötigt. Vorschlag: In jeder Prüfung läuft der Schnelltest, der Volllauf in vier Zeitzonen jede Nacht.
10. Prüfung von Hosting, Unterauftragnehmern und Datenübertragungen vor echten Gesundheitsdaten, mit EU-Hosting als bevorzugtem Ziel (E-1). Keine Vercel-spezifischen Funktionen einbauen.
