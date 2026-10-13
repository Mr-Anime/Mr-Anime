-- Site-wide feature toggles (service-role only: RLS on, no policies).
-- Apply: supabase/migrations/0014_site_settings.sql

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- Default: all ads OFF until enabled from /admin/ads.
insert into public.site_settings (key, value) values
  ('ads.banner', '{"enabled": false}'::jsonb),
  ('ads.social', '{"enabled": false}'::jsonb)
on conflict (key) do nothing;
