# @healthos/reference

Eingefrorene Referenzversion v5 des Claude-Artifacts (Stand 19.10.2026). Grundlage aller Paritätstests in Phase M1.

- `v5/app.jsx`, `v5/template.html`, `v5/healthos-v5.html`: unverändert aus dem Referenzpaket v5.
- `v2/app.v2.jsx`: Vorversion, nur für Migrationstests.
- `suites/`: die originalen Testreihen der Referenz.
- `build.mjs` prüft vor dem Bauen die SHA-256-Prüfsummen aus `PRUEFSUMMEN-v5.txt` und bricht ab, wenn die Referenz verändert wurde.
