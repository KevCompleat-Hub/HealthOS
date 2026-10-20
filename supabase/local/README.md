# Lokaler Datenbank-Prüfstand

Prüft die Beta-Datenbank ohne Supabase-Konto: PostgreSQL 16 mit nachgebildeten Supabase-Teilen (`00_supabase_stubs.sql`), dazu PostgREST 12.2.3,
die Datenschnittstelle, die Supabase selbst verwendet. Die App spricht über den echten Supabase-Client mit diesem Prüfstand.

Nicht enthalten ist Supabase Auth. Anmeldung, zweiter Faktor und Einladungen sind erst mit einem echten Supabase-Projekt testbar.
Tokens werden im Prüfstand wie bei Supabase signiert (HS256, Claims `sub`, `role`, `aal`).

```
createdb hosbeta
psql -v ON_ERROR_STOP=1 -d hosbeta -f supabase/local/00_supabase_stubs.sql -f supabase/migrations/20261020000001_beta_documents.sql
psql -v ON_ERROR_STOP=1 -d hosbeta -f supabase/tests/beta_rls.sql      # bricht bei Fehler mit Exit-Status ungleich 0 ab
psql -d hosbeta -c "insert into auth.users values ('11111111-1111-1111-1111-111111111111','a@test.local'),('22222222-2222-2222-2222-222222222222','b@test.local'),('33333333-3333-3333-3333-333333333333','c@test.local')"
cd apps/web && POSTGREST=/pfad/zu/postgrest HEALTHOS_DB_TEST=1 node test/run-all.mjs
```

`00_supabase_stubs.sql` darf in einem echten Supabase-Projekt **nicht** ausgeführt werden.
