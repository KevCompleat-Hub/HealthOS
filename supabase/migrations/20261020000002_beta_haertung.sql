-- Härtung nach dem Supabase-Sicherheitsberater (20.10.2026)
-- 1. Hilfsfunktionen nur für angemeldete Nutzer (PostgreSQL erlaubt Funktionen standardmäßig allen)
revoke execute on function public.beta_mfa_ok(), public.beta_consent_ok(), public.export_my_beta_data() from public, anon;
grant execute on function public.beta_mfa_ok(), public.beta_consent_ok(), public.export_my_beta_data() to authenticated;
revoke execute on function public.beta_touch() from public, anon, authenticated;
-- 2. Fester Suchpfad für alle Funktionen
alter function public.beta_touch() set search_path = '';
alter function public.beta_mfa_ok() set search_path = '';
-- 3. Einwilligungsprüfung ohne erhöhte Rechte: läuft mit den Rechten des Nutzers und unterliegt dessen Zeilenschutz
create or replace function public.beta_consent_ok() returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.beta_consents c where c.user_id = (select auth.uid()) and c.version = 'beta-1')
$$;
alter function public.export_my_beta_data() set search_path = '';
create or replace function public.export_my_beta_data() returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'format', 'healthos-beta-export', 'exported_at', now(),
    'consents', coalesce((select jsonb_agg(to_jsonb(c)) from public.beta_consents c), '[]'::jsonb),
    'documents', coalesce((select jsonb_agg(jsonb_build_object('key', d.doc_key, 'updated_at', d.updated_at, 'body', d.body) order by d.doc_key) from public.app_documents d), '[]'::jsonb))
$$;
