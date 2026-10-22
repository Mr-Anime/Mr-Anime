-- OAuth application logo shown on the consent/approve screen.
-- Apply: supabase/migrations/0026_oauth_logos.sql

alter table public.oauth_clients
  add column if not exists logo_url text;
