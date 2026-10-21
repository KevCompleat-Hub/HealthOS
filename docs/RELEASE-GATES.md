# Abnahmebericht Launch-Hardening 0.7.0-w9 (21.10.2026)

Grundlage: UX-/SaaS-Launch-Audit vom 20.10.2026. Jeder Befund wurde gegen den Code auf `main` (identisch mit Stand W8) geprüft.
Legende: **bestätigt** = im Code oder live nachgewiesen, **nicht bestätigt** = trifft so nicht zu, **offen** = nicht durch Code lösbar oder noch nicht erledigt.

## Prüfung der Audit-Befunde

| Nr. | Befund | Prüfung | Stand |
| --- | --- | --- | --- |
| P0-01 | Rechtstexte unvollständig | bestätigt, Platzhalter für Verantwortlichen, Anschrift, Kontakt, Fristen | **offen, Freigabe-Sperre.** Nur durch dich bzw. rechtliche Prüfung lösbar |
| P0-02 | Standort und Datentransfer ungeklärt | bestätigt: Supabase London (Entscheidung E-9), KI über Anthropic | **offen, Freigabe-Sperre.** Rechtliche Bewertung nötig |
| P0-03 | Nutzertrennung nicht live nachgewiesen | bestätigt als Lücke | **erledigt:** Live-Prüfung in Supabase, 16 von 16, vollständig zurückgerollt (`supabase/tests/live_rls_rollback.sql`). Zweiter Faktor bewusst entfernt (E-10), optional anbieten bleibt offen |
| P0-04 | Repository öffentlich, Passwort im Chat geteilt | **öffentlich bestätigt.** Geheimnis-Prüfung: keine Schlüssel im Code | **offen:** Repository auf privat stellen, Testpasswort ändern (nur durch dich) |
| P1-01 | Erste Sitzung erklärungslastig | teilweise bestätigt | Ziele werden jetzt erklärt. Kürzeres Onboarding offen |
| P1-02 | Begriffe Routine, Termin, Gewohnheit | bestätigt als UX-Thema | offen, Teil des Plans für Phase 1 |
| P1-03 | Heute priorisiert Zähler statt Handlung | bestätigt | **erledigt:** „Dein nächster Schritt“ mit einer Aktion oben, neutraler Text bei 0 |
| P1-04 | Auslassen nur per Langdruck | bestätigt | **erledigt:** Menü „⋯“ je Gewohnheit, auch per Tastatur und Bildschirmleser |
| P1-05 | Leere Kacheln ohne direkten Einstieg | teilweise: Schritte hatten schon „tippen zum Eintragen“ | **erledigt** für Gewicht |
| P1-06 | Reviews schwer erreichbar | nicht live geprüft | offen |
| P1-07 | Funktionsstand inkonsistent | bestätigt (Hinweistext leer seit W6, Demo-Text „keine Push“) | **erledigt:** zentraler Funktionsstand im Info-Dialog |
| P1-08 | Umfang der Ernährung unklar | bestätigt | **erledigt** im Funktionsstand: „keine Kalorien- oder Mahlzeitenerfassung“ |
| P1-09 | Mobile Prüfmatrix fehlt | bestätigt | **offen:** Geräte-Test nur durch dich möglich |
| P2 | Version, Update-Hinweis, Ziele erklären | bestätigt | **erledigt:** Version im Info-Dialog und in den Einstellungen, Update-Hinweis, Zielerklärung |

Zusätzlich gefunden und behoben: Testnachricht für Push scheiterte im Browser an fehlender CORS-Freigabe (seit W8). Export enthielt seit W6 kein Gewicht, jetzt vollständiger Export inklusive Einwilligungen. Konto löschen fehlte (E-5), jetzt mit Bestätigung.

## Release-Gates aus dem Audit

| Nr. | Gate | Stand |
| --- | --- | --- |
| 1 | Rechtstexte, Datenflüsse, Einwilligungen | **nicht bestanden** (P0-01, P0-02) |
| 2 | Nutzertrennung, Widerruf, Export, Löschung, Wiederherstellung | Nutzertrennung, Widerruf, Export, Löschen live oder automatisiert bestanden. **Wiederherstellung einer Sicherung nicht geprüft** |
| 3 | Passwort-Reset, Anmeldung, Einladung, Wiederanmeldung auf dem Handy | **nicht geprüft** (Gerätetest) |
| 4 | Onboarding abgeschlossen und übersprungen, Plan ohne Duplikate | automatisiert bestanden |
| 5 | Erledigen, Auslassen, Verschieben, Rückgängig, Tageswechsel, zwei Geräte | automatisiert bestanden, **zwei Geräte nicht geprüft** |
| 6 | Schritte, Gewicht, Training | automatisiert bestanden |
| 7 | Reviews kurz und lang, fällig, verschoben, Maßnahmen | automatisiert bestanden, Gerätetest offen |
| 8 | Viewports, Dark Mode, große Schrift, iOS und Android, PWA-Update | **nicht geprüft** (Gerätetest) |
| 9 | Fehler-, Lade-, Offline-Zustände, Support, Funktionsstand | Funktionsstand, Offline-Seite, Feedback-Link vorhanden. Feedback-Adresse muss in Vercel gesetzt werden |
| 10 | Weitere Tester nur per Einladung | technisch erfüllt (Selbstregistrierung aus) |

## Freigabeempfehlung

**Keine Freigabe für weitere Tester mit echten Daten.** Technische Sperren aus dem Audit sind weitgehend geschlossen. Es bleiben die Gates 1, 3 und 8 sowie das Wiederherstellen einer Sicherung. Gate 1 kann nur eine rechtliche Prüfung schließen. Für dich allein als Entwickler mit eigenen Daten ist der Stand nutzbar.
