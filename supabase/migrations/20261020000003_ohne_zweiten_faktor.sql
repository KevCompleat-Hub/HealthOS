-- Entscheidung E-10 (20.10.2026): Anmeldung nur mit E-Mail und Passwort, kein zweiter Faktor.
-- Zeilenschutz (nur eigene Daten), Einwilligung und das Abweisen von Gesundheitsakten-Daten bleiben unverändert.
drop policy consents_select on public.beta_consents;
drop policy consents_insert on public.beta_consents;
drop policy consents_delete on public.beta_consents;
drop policy docs_select on public.app_documents;
drop policy docs_insert on public.app_documents;
drop policy docs_update on public.app_documents;
drop policy docs_delete on public.app_documents;

create policy consents_select on public.beta_consents for select to authenticated using (user_id = (select auth.uid()));
create policy consents_insert on public.beta_consents for insert to authenticated with check (user_id = (select auth.uid()));
create policy consents_delete on public.beta_consents for delete to authenticated using (user_id = (select auth.uid()));

create policy docs_select on public.app_documents for select to authenticated using (user_id = (select auth.uid()));
create policy docs_insert on public.app_documents for insert to authenticated with check (user_id = (select auth.uid()) and public.beta_consent_ok());
create policy docs_update on public.app_documents for update to authenticated using (user_id = (select auth.uid()) and public.beta_consent_ok()) with check (user_id = (select auth.uid()) and public.beta_consent_ok());
-- Löschen bleibt auch nach Widerruf der Einwilligung möglich
create policy docs_delete on public.app_documents for delete to authenticated using (user_id = (select auth.uid()));

drop function public.beta_mfa_ok();
