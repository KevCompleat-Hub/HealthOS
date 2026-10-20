-- NUR FÜR DEN LOKALEN PRÜFSTAND. Bildet die Teile nach, die Supabase bereitstellt. In Supabase NICHT ausführen.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then create role authenticator login password 'lokal-nur-test' noinherit; end if;
end $$;
grant anon, authenticated, service_role to authenticator;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text);
-- wie Supabase: Claims aus dem Token, das PostgREST in request.jwt.claims ablegt
create or replace function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(coalesce(current_setting('request.jwt.claim.sub', true), auth.jwt() ->> 'sub'), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.jwt(), auth.uid() to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
