# Abnahmebericht Launch-Hardening (0.7.0-w9)

Grundlage: „HealthOS UX-/SaaS-Launch-Audit“ vom 20.10.2026. Jeder Befund wurde gegen Code und Live-System geprüft.
Legende: **bestätigter Fehler**, **UX-Verbesserung**, **Gate** (Entscheidung oder Prüfung außerhalb des Codes), **nicht bestätigt**.

## P0

| Nr. | Befund | Einordnung | Stand | Nachweis |
| --- | --- | --- | --- | --- |
| P0-01 | Rechtstexte mit Platzhaltern | Gate | offen: 7 markierte Stellen, Rechtsprüfung nötig | Code geprüft |
| P0-02 | Standort London, KI-Übermittlung an Anthropic | Gate | offen, Entscheidung E-9 | Supabase-Projekt `eu-west-2` |
| P0-03 | Nutzertrennung nicht live belegt | bestätigt (fehlender Nachweis) | **erledigt**: Zwei-Konten-Test in der echten Datenbank, 12 von 12, vollständig zurückgerollt | siehe unten |
| P0-03 | Export und Löschung unvollständig | bestätigter Fehler | **erledigt**: vollständiger Export, Konto selbst löschen | test/account.mjs 4 von 4, Live: Löschen ohne Anmeldung abgewiesen (401) |
| P0-03 | Zwei-Faktor entfernt | Gate | bewusste Entscheidung E-10, Neubewertung vor weiteren Testern | |
| P0-04 | Repository öffentlich | **nicht bestätigt** | GitHub liefert für Außenstehende 404 | Abruf ohne Anmeldung |
| P0-04 | Geheimnisse im Code | geprüft | kein Fund | Mustersuche über das ganze Repository |
| P0-04 | Testpasswort im Chat geteilt | Gate | Passwort des Testkontos ändern oder Konto löschen | |

Live-Zwei-Konten-Test (21.10.2026, Supabase, in einer Transaktion, danach zurückgerollt, keine Reste): ohne Einwilligung abgewiesen; A sieht eigene Dokumente; Blutwerte abgewiesen; Export vollständig; Push-Schlüssel gesperrt; B sieht, ändert, löscht nichts von A; B kann nicht für A schreiben; B sieht keine fremden Einwilligungen; ohne Anmeldung kein Zugriff; Kontolöschung entfernt alle Daten.

## P1

| Nr. | Befund | Einordnung | Stand |
| --- | --- | --- | --- |
| P1-01 | Erste Sitzung zu erklärungslastig | UX | teilweise: Zielerklärung ergänzt. Kürzeres Onboarding ist Sprint 2 |
| P1-02 | Begriffe Termin, Routine, Gewohnheit | UX | offen, Sprint 2 |
| P1-03 | Heute priorisiert Zähler | UX | **erledigt**: Handlung oben, Ring darunter, neutraler Text |
| P1-04 | Auslassen nur per Langdruck | bestätigt | **erledigt**: sichtbarer Knopf, tastaturbedienbar |
| P1-05 | Leere Kacheln ohne Einstieg | UX | **erledigt** für Gewicht, Schritte hatten bereits „tippen zum Eintragen“ |
| P1-06 | Reviews schwer erreichbar | UX-Hypothese | offen, Sprint 3 |
| P1-07 | Info widerspricht Funktionsumfang | bestätigter Fehler | **erledigt**: zentraler Funktionsstatus |
| P1-08 | Ernährungsumfang unklar | UX | **erledigt**: im Funktionsstatus benannt |
| P1-09 | Mobile Prüfung fehlt | Gate | offen, nur auf echten Geräten prüfbar |

## P2

Erledigt: Versionsstand sichtbar, Update-Hinweis, Release Notes. Offen: Ziel-Detailseiten, Mini-Tour, „Idee für heute“ nur bei Relevanz, Review-Vergleich vorher, jetzt, nächste Maßnahme.

## Eigene Funde in diesem Durchgang
- **Fehler aus 0.6.0:** Die Push-Testnachricht hätte im Browser nicht funktioniert (fehlende CORS-Kopfzeilen). Behoben und neu bereitgestellt.

## Tests dieses Stands
Typprüfung fehlerfrei; Screenshot-Auswertung 10/10; Rezeptideen 7/7; Erinnerungslogik 12/12; Konto 4/4; Klicktests Beta 23/23, Demo 21/21, W5 Beta 30/30, W5 Demo 32/32; Anbindung 13/13; gegen Datenbank 23/23; Datenbank lokal 19/19 und Push 9/9; Live-Zwei-Konten-Test 12/12.

## Freigabeempfehlung
**Weitere Tester: noch nicht.** Technisch ist die Nutzertrennung jetzt live belegt. Vor weiteren Testern müssen die Gates P0-01, P0-02, E-10 (Neubewertung zweiter Faktor) und P1-09 (echte Geräte) erledigt sein. Für dich als einzigen Nutzer mit eigenen Daten ist der Stand nutzbar.
