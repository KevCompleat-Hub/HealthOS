-- Push-Erinnerungen (W8). Geräte-Anmeldungen je Nutzer, Versandprotokoll gegen Doppelungen,
-- Schlüssel und Cron-Geheimnis nur für die Service-Rolle lesbar (keine Richtlinien, RLS erzwungen).
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique check (endpoint ~ '^https://' and char_length(endpoint) <= 2000),
  p256dh     text not null check (char_length(p256dh) <= 200),
  auth       text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
alter table public.push_subscriptions force row level security;
revoke all on public.push_subscriptions from anon;
grant select, insert, delete on public.push_subscriptions to authenticated;
create policy push_sub_select on public.push_subscriptions for select to authenticated using (user_id = (select auth.uid()));
create policy push_sub_insert on public.push_subscriptions for insert to authenticated with check (user_id = (select auth.uid()));
create policy push_sub_delete on public.push_subscriptions for delete to authenticated using (user_id = (select auth.uid()));

create table public.push_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  key     text not null check (char_length(key) <= 120),
  sent_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.push_log enable row level security;
alter table public.push_log force row level security;
revoke all on public.push_log from anon, authenticated;

create table public.push_config (
  id          smallint primary key check (id = 1),
  public_key  text not null,
  private_key text not null,
  cron_secret text not null,
  subject     text not null
);
alter table public.push_config enable row level security;
alter table public.push_config force row level security;
revoke all on public.push_config from anon, authenticated;

-- Öffentlicher Schlüssel für die Anmeldung eines Geräts, nur für angemeldete Nutzer
create function public.push_public_key() returns text language sql stable security definer set search_path = '' as $$
  select public_key from public.push_config where id = 1
$$;
revoke execute on function public.push_public_key() from public, anon;
grant execute on function public.push_public_key() to authenticated;
