-- Sitewide maintenance warning banner toggle, managed from /admin/site.
-- Apply: supabase/migrations/0025_maintenance_banner.sql

insert into public.site_settings (key, value) values
  ('maintenance.enabled', '{"enabled": true}'::jsonb)
on conflict (key) do nothing;
