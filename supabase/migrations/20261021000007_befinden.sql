-- W14 (Paket D): Befinden und Tags im Dokument „checkins“, nur mit eigener Einwilligung beta-3 (Entscheidung E-17).
alter table public.app_documents drop constraint app_documents_doc_key_check;
alter table public.app_documents add constraint app_documents_doc_key_check
  check (doc_key ~ '^(settings|plan|habits|activity|koerper|checkins|week:[0-9]{4}-[0-9]{2}-[0-9]{2})$');
create function public.checkin_consent_ok() returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.beta_consents c where c.user_id = (select auth.uid()) and c.version = 'beta-3')
$$;
revoke execute on function public.checkin_consent_ok() from public, anon;
grant execute on function public.checkin_consent_ok() to authenticated;
drop policy docs_insert on public.app_documents;
drop policy docs_update on public.app_documents;
create policy docs_insert on public.app_documents for insert to authenticated
  with check (user_id = (select auth.uid()) and public.beta_consent_ok() and (doc_key <> 'koerper' or public.body_consent_ok()) and (doc_key <> 'checkins' or public.checkin_consent_ok()));
create policy docs_update on public.app_documents for update to authenticated
  using (user_id = (select auth.uid()) and public.beta_consent_ok() and (doc_key <> 'koerper' or public.body_consent_ok()) and (doc_key <> 'checkins' or public.checkin_consent_ok()))
  with check (user_id = (select auth.uid()) and public.beta_consent_ok() and (doc_key <> 'koerper' or public.body_consent_ok()) and (doc_key <> 'checkins' or public.checkin_consent_ok()));
