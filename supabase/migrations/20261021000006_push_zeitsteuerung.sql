-- Zeitsteuerung für Push-Erinnerungen: alle 15 Minuten ruft pg_cron die Edge Function „push-tick“ auf.
-- Das Cron-Geheimnis wird zur Laufzeit aus public.push_config gelesen und steht nirgends im Klartext.
-- Hinweis: Die Projektadresse ist fest eingetragen. Bei einem neuen Supabase-Projekt anpassen.
create extension if not exists pg_cron;
create schema if not exists extensions;
create extension if not exists pg_net with schema extensions;
select net.http_post(url := 'https://phhgatnxbmfdhppjxjbb.supabase.co/functions/v1/push-tick', headers := jsonb_build_object('Content-Type', 'application/json'), body := '{"setup": true}'::jsonb);
select cron.schedule('healthos-push-tick', '*/15 * * * *', $cron$
  select net.http_post(
    url := 'https://phhgatnxbmfdhppjxjbb.supabase.co/functions/v1/push-tick',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select cron_secret from public.push_config where id = 1)),
    body := '{}'::jsonb
  );
$cron$);
