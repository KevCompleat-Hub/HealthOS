# Release Notes HealthOS Beta

## 0.11.0-w13 (21.10.2026), Paket C: Priorität 2 ohne neue Datenarten
- Goal-to-Action: unter Entwicklung „Deine Ziele im Zusammenhang“ je Ziel in Prioritätsreihenfolge mit Maßnahmen im Plan, Fortschritt (nur mit Daten), nächstem Check-in und einem nächsten Schritt. Erweitert den bestehenden Bereich „Ziele“.
- Experimente: eine Gewohnheit 7, 14, 21 oder 30 Tage ausprobieren, Ziel 70 Prozent der Tage, am Ende „Als Gewohnheit behalten“ oder „Beenden“. Gespeichert an der Gewohnheit, kein neuer Speicher.
- Muster: Umsetzung nach Wochentagen über 8 Wochen. Aussage erst mit genug Daten, ausdrücklich als Zusammenhang, nicht als Ursache.

## 0.10.0-w12 (21.10.2026), Paket B: Priorität 1 vervollständigt
- Briefing: bis zu zwei Vorschläge mit Anlass, Begründung und Aktion (Gewicht bei Ziel „Abnehmen“, Trainingsziel in Gefahr, Gewohnheit im Rückstand, Rahmen einer begrenzten Gewohnheit erreicht). Ohne Datengrundlage kein Vorschlag.
- Habit Stacking: Auslöser („nach dem Mittagessen“) und Tageszeit je Gewohnheit, Sortierung auf Heute nach Tageszeit.
- Bad Habits: Gewohnheiten zum Begrenzen mit „höchstens n pro Woche“ und optionaler Alternative. Positive Darstellung, jede Woche zählt neu. Drei Ideen zum Begrenzen.
- Smart Logging: letzte Trainings mit einem Tipp wiederholen, verrechnet mit der offenen geplanten Einheit der Woche.
- Adaptive Alternativen: nach zwei verpassten Terminen derselben Routine Vorschlag „ab morgen kürzer“, nur nach Bestätigung, vergangene Termine bleiben.
- Push: begrenzte Gewohnheiten lösen keine Erinnerung „noch offen“ aus.

## 0.9.0-w11 (21.10.2026), Paket A: Beta stabilisieren, Umzug nach Frankfurt
- Datenbank und Dienste laufen in Frankfurt (eu-central-1). Datenschutzerklärung und Entscheidungen angepasst (E-15).
- Onboarding auf 4 Schritte: Ziele, Arbeitsalltag, Training, Plan mit Vorschau. Pausen, Ernährung und Erinnerungen mit Voreinstellungen, änderbar in den Einstellungen. Gewohnheiten werden weiter passend zu den Zielen vorgeschlagen.
- Begriffe Termin, Routine, Gewohnheit und Messung im Info-Dialog und im Plan-Schritt erklärt.
- Heute: „Alle Einträge heute“ zeigt, wie viele davon schon oben stehen. Pausen-Kachel erklärt „ab Planstart“ in der ersten Woche. „Idee für heute“ nur bei passenden Zielen oder an Trainingstagen.
- Entwicklung: fester Einstieg in den Wochen-Check-in, mit „Jetzt starten“ oder dem nächsten Termin.
- Verschieben: Hinweis, wenn ein Training aus dem Wochenziel fallen würde.
- Lange Absicherungstexte hinter „Mehr dazu“, Speicherhinweis in Alltagssprache, überlappende Diagrammbeschriftungen behoben.

## 0.8.0-w10 (21.10.2026), Morning Briefing und Gewichtstrend
- Heute: „Dein Tag“ mit höchstens drei Aussagen. Was heute ansteht, was zuletzt gut lief (nur mit Datengrundlage: Trainingsserie, Trainingsziel der Vorwoche, sinkender Gewichtstrend bei Ziel „Abnehmen“, mehr erledigte Gewohnheiten) und eine Handlung mit Knopf.
- Entwicklung: geglätteter Gewichtstrend (Durchschnitt der letzten 7 Kalendertage je Messtag, Lücken werden nicht aufgefüllt). Veränderung nur mit mindestens 3 Messungen am Anfang und am Ende von 2 Wochen.
- Einstellungen: „Daten aus Export übernehmen“, zum Beispiel für den Umzug in ein anderes Supabase-Projekt. Nur zulässige Dokumente, Gesundheitsakte wird verworfen.

## 0.7.0-w9 (21.10.2026), Launch-Hardening nach Audit
- Heute: „Dein nächster Schritt“ mit einer Aktion ganz oben, danach Fortschritt. Neutraler Text bei 0 Fortschritt.
- Gewohnheiten: sichtbares Menü „⋯“ mit Erledigt, Heute auslassen, Wieder öffnen, Häufigkeit. Langes Drücken bleibt als Abkürzung.
- Einstellungen: „Alle Daten exportieren“ (alle gespeicherten Dokumente und Einwilligungen), „Konto löschen“ mit Bestätigung.
- Info: zentraler Funktionsstand und Versionsnummer. Leerer Hinweistext aus W6 behoben.
- Hinweis „Neue Version verfügbar, neu laden“ nach einem Update.
- Gewicht-Kachel führt bei fehlenden Werten direkt zum Eintragen. Ziele im Onboarding kurz erklärt.
- Behoben: Testnachricht für Push scheiterte im Browser an fehlender CORS-Freigabe (Fehler aus W8).
- Sicherheit: Geheimnis-Prüfung als fester Test, Live-Prüfung der Nutzertrennung in Supabase (16 von 16).

## 0.6.0-w8 (20.10.2026)
Push-Erinnerungen, KI-Rezeptideen.

## 0.5.0-w7 (20.10.2026)
Ernährungs-Idee und Zutaten-Katalog.

## 0.4.0-w6 (20.10.2026)
Gewicht und Körperwerte mit eigener Einwilligung, Waagen-Screenshot per KI, Häufigkeit für Gewohnheiten.
