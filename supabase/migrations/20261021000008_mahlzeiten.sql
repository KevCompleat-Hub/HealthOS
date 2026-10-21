-- W16: Mahlzeiten im Dokument „koerper“, nur mit Einwilligung beta-4 (enthält Gewicht, Körperwerte und Mahlzeiten).
-- beta-4 ersetzt beta-2 als Grundeinwilligung, beta-2 bleibt für Gewicht gültig. Blutwerte, Termine und Dokumente bleiben gesperrt.
alter table public.app_documents drop constraint keine_gesundheitsakte;
alter table public.app_documents add constraint keine_gesundheitsakte
  check (not (body ?| array['labs', 'appointments', 'documents']) and (doc_key = 'koerper' or not (body ?| array['weights', 'meals'])));
create or replace function public.beta_consent_ok() returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.beta_consents c where c.user_id = (select auth.uid()) and c.version in ('beta-1', 'beta-2', 'beta-4'))
$$;
create or replace function public.body_consent_ok() returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.beta_consents c where c.user_id = (select auth.uid()) and c.version in ('beta-2', 'beta-4'))
$$;
create function public.meal_consent_ok() returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.beta_consents c where c.user_id = (select auth.uid()) and c.version = 'beta-4')
$$;
revoke execute on function public.meal_consent_ok() from public, anon;
grant execute on function public.meal_consent_ok() to authenticated;
drop policy docs_insert on public.app_documents;
drop policy docs_update on public.app_documents;
create policy docs_insert on public.app_documents for insert to authenticated
  with check (user_id = (select auth.uid()) and public.beta_consent_ok() and (doc_key <> 'koerper' or public.body_consent_ok()) and (doc_key <> 'checkins' or public.checkin_consent_ok()) and (not (body ? 'meals') or public.meal_consent_ok()));
create policy docs_update on public.app_documents for update to authenticated
  using (user_id = (select auth.uid()) and public.beta_consent_ok() and (doc_key <> 'koerper' or public.body_consent_ok()) and (doc_key <> 'checkins' or public.checkin_consent_ok()))
  with check (user_id = (select auth.uid()) and public.beta_consent_ok() and (doc_key <> 'koerper' or public.body_consent_ok()) and (doc_key <> 'checkins' or public.checkin_consent_ok()) and (not (body ? 'meals') or public.meal_consent_ok()));
