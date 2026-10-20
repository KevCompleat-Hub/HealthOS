# Entscheidungen (Stand 19.10.2026)

Getroffen von Kevin Gimpel nach externer Prüfung des Implementierungsplans HOS-007.

| Nr. | Entscheidung | Folgen für die Umsetzung |
| --- | --- | --- |
| E-1 | Vercel darf für die Entwicklung genutzt werden. Vor echten Gesundheitsdaten wird die gesamte Datenverarbeitung geprüft (Hosting, Unterauftragnehmer, Datenübertragungen). Für den Produktivbetrieb wird EU-Hosting bevorzugt. | Next.js-App ohne Vercel-spezifische Funktionen bauen, damit ein Wechsel zu einem EU-Anbieter ohne Umbau möglich ist. Prüfung als Freigabekriterium vor M7. |
| E-2 | Aus dem Artifact werden nur Einstellungen und Routinen übernommen, keine fiktive Demo-Historie. | Import übernimmt `user_preferences`, `routine_templates`, `routine_versions`, `routine_exceptions`. Plan-Einträge, Haken, Pausen und Reviews werden verworfen. |
| E-3 | Reflexionsantworten können künftig optional mit gesonderter Einwilligung dauerhaft gespeichert werden, damit langfristige Muster erkennbar sind. | Tabelle `review_answers` bleibt, Einwilligung „Reflexionen“ Pflicht. Auswertung über Zeit ist eine neue Funktion nach M7, nicht Teil der Migration. |
| E-4 | Laborbezogene Empfehlungsentscheidungen dürfen mit ausdrücklicher Einwilligung gespeichert werden. | `recommendation_states` mit `lab_related = true` nur mit Einwilligung „Laborwerte“, datenbankseitig erzwungen (Backlog A-1). |
| E-5 | Kontolöschung nach eindeutiger Bestätigung zeitnah ausführen. Verbleibende Sicherungen und Aufbewahrungsfristen transparent behandeln. | Keine 7-Tage-Wartezeit. Bestätigung per erneuter Anmeldung oder Eingabe, danach sofortige Löschung. Hinweis auf Sicherungsfristen in App und Datenschutzerklärung. |
| E-6 | Zwei-Faktor-Authentifizierung ist vor der ersten Speicherung echter Gesundheitsdaten Pflicht. | Einwilligungen für Gesundheitsdaten lassen sich erst nach eingerichtetem zweiten Faktor erteilen. Datenbankseitige Prüfung auf AAL2 in M2 klären. |
| E-7 | pnpm-Workspaces. | Umgesetzt in M1. |
| E-8 | Android-Technologie erst nach M7 festlegen. | Keine Arbeiten an der Begleit-App vor M7. |

## Nachtrag 20.10.2026

| Nr. | Entscheidung | Folgen für die Umsetzung |
| --- | --- | --- |
| E-9 | Das Supabase-Projekt bleibt vorerst in London (`eu-west-2`) und zieht nicht nach Frankfurt um. | Abweichung von der Vorgabe „EU-Hosting“. Zulässigkeit der Übermittlung nach Großbritannien (Angemessenheitsbeschluss) ist ungeprüft. Vor der ersten Verarbeitung echter Testerdaten erneut entscheiden, ob ein Umzug nach `eu-central-1` erfolgt. Ein Umzug erfordert ein neues Projekt, beide Migrationen und neue Umgebungsvariablen in Vercel. |
| E-10 | Anmeldung nur mit E-Mail und Passwort, kein zweiter Faktor. Ersetzt E-6. | Prüfung auf `aal2` aus Datenbank (Migration `20261020000003_ohne_zweiten_faktor.sql`) und App entfernt. Zeilenschutz, Einwilligung vor dem Speichern und das Abweisen von Gewichts-, Labor-, Mahlzeit-, Termin- und Dokumentdaten bleiben. Ausgleichend: Passwörter mindestens 12 Zeichen, Schutz vor geleakten Passwörtern in Supabase aktivieren, falls im Tarif verfügbar. Restrisiko: Wer das Passwort kennt, sieht die Daten des Kontos. |
