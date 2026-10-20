-- HealthOS geschlossene Beta: persönliche Dokumente je Nutzer.
-- Speichert dieselben Dokumente wie die Referenz (settings, plan, habits, week:…) plus activity (Training, Schritte).
-- Zugriff nur für den eigenen Nutzer, nur mit zweitem Faktor (aal2, Entscheidung E-6) und nur nach Einwilligung.
-- Gewicht, Mahlzeiten, Blutwerte, Termine und Dokumente werden datenbankseitig abgewiesen.

create table public.beta_consents (
  user_id    uuid not null references auth.users(id) on delete cascade,
  version    text not null check (version ~ '^beta-[0-9]+$'),
  granted_at timestamptz not null default now(),
  primary key (user_id, version)
);

create table public.app_documents (
  user_id    uuid not null references auth.users(id) on delete cascade,
  doc_key    text not null check (doc_key ~ '^(settings|plan|habits|activity|week:[0-9]{4}-[0-9]{2}-[0-9]{2})$'),
  body       jsonb not null check (jsonb_typeof(body) = 'object' and pg_column_size(body) <= 1048576),
  updated_at timestamptz not null default now(),
  primary key (user_id, doc_key),
  constraint keine_gesundheitsakte check (not (body ?| array['weights', 'labs', 'meals', 'appointments', 'documents']))
);

create function public.beta_touch() returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
create trigger app_documents_touch before update on public.app_documents for each row execute function public.beta_touch();

-- Zweiter Faktor: Supabase schreibt die Sicherheitsstufe der Sitzung als Claim „aal“ in das Zugriffstoken.
create function public.beta_mfa_ok() returns boolean language sql stable as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
$$;
create function public.beta_consent_ok() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.beta_consents c where c.user_id = (select auth.uid()) and c.version = 'beta-1')
$$;

alter table public.beta_consents enable row level security;
alter table public.beta_consents force row level security;
alter table public.app_documents enable row level security;
alter table public.app_documents force row level security;
revoke all on public.beta_consents, public.app_documents from anon;
grant select, insert, delete on public.beta_consents to authenticated;
grant select, insert, update, delete on public.app_documents to authenticated;
grant execute on function public.beta_mfa_ok(), public.beta_consent_ok() to authenticated;

create policy consents_select on public.beta_consents for select to authenticated using (user_id = (select auth.uid()) and public.beta_mfa_ok());
create policy consents_insert on public.beta_consents for insert to authenticated with check (user_id = (select auth.uid()) and public.beta_mfa_ok());
create policy consents_delete on public.beta_consents for delete to authenticated using (user_id = (select auth.uid()) and public.beta_mfa_ok());

create policy docs_select on public.app_documents for select to authenticated using (user_id = (select auth.uid()) and public.beta_mfa_ok());
create policy docs_insert on public.app_documents for insert to authenticated with check (user_id = (select auth.uid()) and public.beta_mfa_ok() and public.beta_consent_ok());
create policy docs_update on public.app_documents for update to authenticated using (user_id = (select auth.uid()) and public.beta_mfa_ok() and public.beta_consent_ok()) with check (user_id = (select auth.uid()) and public.beta_mfa_ok() and public.beta_consent_ok());
-- Löschen bleibt auch nach Widerruf der Einwilligung möglich
create policy docs_delete on public.app_documents for delete to authenticated using (user_id = (select auth.uid()) and public.beta_mfa_ok());

-- Datenexport aller eigenen Beta-Daten (Art. 20 DSGVO), über RLS abgesichert
create function public.export_my_beta_data() returns jsonb language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'format', 'healthos-beta-export', 'exported_at', now(),
    'consents', coalesce((select jsonb_agg(to_jsonb(c)) from public.beta_consents c), '[]'::jsonb),
    'documents', coalesce((select jsonb_agg(jsonb_build_object('key', d.doc_key, 'updated_at', d.updated_at, 'body', d.body) order by d.doc_key) from public.app_documents d), '[]'::jsonb))
$$;
grant execute on function public.export_my_beta_data() to authenticated;
