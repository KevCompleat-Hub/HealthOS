# Architektur-Backlog nach externer Prüfung

Diese Punkte sind beauftragt, aber nicht Teil von M1. Sie werden vor oder in M2 umgesetzt.

| Nr. | Anforderung | Befund im Entwurf 0001 | Geplante Lösung | Phase |
| --- | --- | --- | --- | --- |
| A-1 | Einwilligungsprüfung in der Datenbank auch für laborbezogene Empfehlungs- und Review-Datensätze | `recommendation_states.lab_related` und `review_measures.lab_related` werden ohne Einwilligung angenommen | Einfüge- und Änderungsrichtlinien: `lab_related = false or has_consent('laborwerte')`. Tests für beide Tabellen ergänzen. | M2 |
| A-2 | Rechte und Datenverarbeitung nach Widerruf einer Einwilligung | Widerruf stoppt nur neue Einfügungen. Ändern bestehender Zeilen bleibt möglich, Lesen ebenfalls | Festlegen je Datenart: Lesen und Löschen bleiben möglich, Ändern und Einfügen nicht. Update-Richtlinien um Einwilligung ergänzen. Löschangebot je Kategorie beim Widerruf. Tests für Widerruf. | M2 |
| A-3 | Datenexport auf Vollständigkeit prüfen | `export_my_data()` enthält 29 von 38 nutzerbezogenen Tabellen, fehlend unter anderem `dismissed_hints`, `notifications`, `push_subscriptions`, `audit_events`, `data_export_jobs`, `account_deletion_requests`, `import_jobs`, `external_record_mappings` | Liste der Tabellen nicht mehr fest im Code, sondern aus dem Schema ableiten (alle Tabellen mit `user_id`), Ausnahmen begründet dokumentieren. Test: jede Tabelle mit `user_id` ist im Export oder auf der Ausnahmeliste. Befunddateien als Anhang. | M2 |
| A-4 | SQL-Tests müssen bei einem Fehler mit fehlerhaftem Exit-Status abbrechen | `9001_rls_tests.sql` sammelt Ergebnisse und endet immer mit Status 0 | Am Ende `do $$ … raise exception … $$` bei mindestens einem Fehlschlag. Ausführung mit `psql -v ON_ERROR_STOP=1`. In CI prüfen, dass ein absichtlich falscher Test den Lauf rot macht. | M2 |
| A-5 | Schriftarten und externe Ressourcen selbst hosten | Referenz lädt Schriften von Google Fonts und React von jsDelivr | Schriften mit `next/font/local` aus dem eigenen Build, keine Drittanbieter-Ressourcen zur Laufzeit. Content Security Policy ohne fremde Hosts. | M2 |

## Aus M1 hinzugekommen

Siehe Abschnitt „Befunde in der Referenz“ im M1-Abnahmebericht. Diese Befunde sind bewusst nicht korrigiert, weil M1 keine fachlichen Regeln ändern darf.
