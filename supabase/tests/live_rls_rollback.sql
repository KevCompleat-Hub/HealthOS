-- Live-Prüfung der Nutzertrennung in der echten Datenbank, ohne Spuren: zwei simulierte Konten in einer Transaktion,
-- die am Ende per Fehler vollständig zurückgerollt wird. Das Ergebnis steht in der Fehlermeldung „LIVE-RLS-ERGEBNIS“.
-- Lauf am 20.10.2026 gegen das Projekt HealthOS: 16 von 16 Prüfungen „t“, danach 0 Testkonten übrig.
do $$
declare
  a uuid := 'aaaaaaaa-0000-4000-8000-00000000000a'; b uuid := 'bbbbbbbb-0000-4000-8000-00000000000b';
  res text := ''; n int; ok boolean;
begin
  insert into auth.users (id, aud, role, email) values (a, 'authenticated', 'authenticated', 'rls-a@test.invalid'), (b, 'authenticated', 'authenticated', 'rls-b@test.invalid');
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  begin insert into public.app_documents (user_id, doc_key, body) values (a, 'settings', '{}'); ok := false; exception when others then ok := true; end;
  res := res || format('ohne Einwilligung kein Speichern: %s; ', ok);
  insert into public.beta_consents (user_id, version) values (a, 'beta-1');
  insert into public.app_documents (user_id, doc_key, body) values (a, 'settings', '{"x":1}');
  begin insert into public.app_documents (user_id, doc_key, body) values (a, 'koerper', '{"weights":[]}'); ok := false; exception when others then ok := true; end;
  res := res || format('Körperwerte ohne beta-2 abgewiesen: %s; ', ok);
  insert into public.beta_consents (user_id, version) values (a, 'beta-2');
  insert into public.app_documents (user_id, doc_key, body) values (a, 'koerper', '{"weights":[{"kg":80}]}');
  begin insert into public.app_documents (user_id, doc_key, body) values (a, 'activity', '{"labs":[]}'); ok := false; exception when others then ok := true; end;
  res := res || format('Blutwerte abgewiesen: %s; ', ok);
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values (a, 'https://push.invalid/a', 'k', 'x');
  select count(*) into n from public.app_documents; res := res || format('A sieht eigene Dokumente: %s; ', n = 2);
  begin perform private_key from public.push_config; ok := false; exception when others then ok := true; end;
  res := res || format('privater Push-Schlüssel gesperrt: %s; ', ok);
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.app_documents; res := res || format('B sieht nichts von A: %s; ', n = 0);
  select count(*) into n from public.beta_consents; res := res || format('B sieht keine Einwilligungen von A: %s; ', n = 0);
  select count(*) into n from public.push_subscriptions; res := res || format('B sieht keine Geräte von A: %s; ', n = 0);
  begin insert into public.app_documents (user_id, doc_key, body) values (a, 'plan', '{}'); ok := false; exception when others then ok := true; end;
  res := res || format('B kann nicht für A schreiben: %s; ', ok);
  update public.app_documents set body = '{"gekapert":1}' where user_id = a; get diagnostics n = row_count; res := res || format('B kann A nicht ändern: %s; ', n = 0);
  delete from public.app_documents where user_id = a; get diagnostics n = row_count; res := res || format('B kann A nicht löschen: %s; ', n = 0);
  select (public.export_my_beta_data() -> 'documents') = '[]'::jsonb into ok; res := res || format('Export von B enthält nichts von A: %s; ', ok);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  delete from public.beta_consents where user_id = a and version in ('beta-1', 'beta-2');
  begin update public.app_documents set body = '{"y":2}' where doc_key = 'settings'; get diagnostics n = row_count; ok := n = 0; exception when others then ok := true; end;
  res := res || format('nach Widerruf kein Ändern: %s; ', ok);
  delete from public.app_documents where user_id = a; get diagnostics n = row_count; res := res || format('nach Widerruf Löschen möglich: %s; ', n = 2);
  execute 'reset role';
  execute 'set local role anon';
  perform set_config('request.jwt.claims', '', true);
  begin perform 1 from public.app_documents limit 1; ok := false; exception when others then ok := true; end;
  res := res || format('ohne Anmeldung kein Zugriff: %s; ', ok);
  execute 'reset role';
  delete from auth.users where id = a;
  select count(*) into n from public.push_subscriptions where user_id = a; res := res || format('Kontolöschung entfernt Geräte: %s', n = 0);
  raise exception 'LIVE-RLS-ERGEBNIS (alles zurückgerollt): %', res;
end $$;
