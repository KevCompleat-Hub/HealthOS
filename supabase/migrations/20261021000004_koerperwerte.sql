-- Entscheidung E-11 (21.10.2026): Gewicht und Körperwerte in der Beta, mit eigener Einwilligung (beta-2).
-- Dazu die Einwilligung für die KI-Auswertung von Waagen-Screenshots (ki-1). Blutwerte, Mahlzeiten, Termine, Dokumente bleiben gesperrt.
alter table public.beta_consents drop constraint beta_consents_version_check;
alter table public.beta_consents add constraint beta_consents_version_check check (version ~ '^(beta|ki)-[0-9]+$');

alter table public.app_documents drop constraint app_documents_doc_key_check;
alter table public.app_documents add constraint app_documents_doc_key_check
  check (doc_key ~ '^(settings|plan|habits|activity|koerper|week:[0-9]{4}-[0-9]{2}-[0-9]{2})$');
-- Körperwerte nur im Dokument „koerper“, alles andere aus der Gesundheitsakte bleibt abgewiesen
alter table public.app_documents drop constraint keine_gesundheitsakte;
alter table public.app_documents add constraint keine_gesundheitsakte
  check (not (body ?| array['labs', 'meals', 'appointments', 'documents']) and (doc_key = 'koerper' or not (body ? 'weights')));

-- Grundeinwilligung: beta-1 oder beta-2. Körperwerte: nur beta-2.
create or replace function public.beta_consent_ok() returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.beta_consents c where c.user_id = (select auth.uid()) and c.version in ('beta-1', 'beta-2'))
$$;
create function public.body_consent_ok() returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.beta_consents c where c.user_id = (select auth.uid()) and c.version = 'beta-2')
$$;
revoke execute on function public.body_consent_ok() from public, anon;
grant execute on function public.body_consent_ok() to authenticated;

drop policy docs_insert on public.app_documents;
drop policy docs_update on public.app_documents;
create policy docs_insert on public.app_documents for insert to authenticated
  with check (user_id = (select auth.uid()) and public.beta_consent_ok() and (doc_key <> 'koerper' or public.body_consent_ok()));
create policy docs_update on public.app_documents for update to authenticated
  using (user_id = (select auth.uid()) and public.beta_consent_ok() and (doc_key <> 'koerper' or public.body_consent_ok()))
  with check (user_id = (select auth.uid()) and public.beta_consent_ok() and (doc_key <> 'koerper' or public.body_consent_ok()));
