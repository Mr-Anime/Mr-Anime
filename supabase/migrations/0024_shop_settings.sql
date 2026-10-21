-- Master shop switch used by /admin/shop and enforced in the shop page/actions.
-- Apply: supabase/migrations/0024_shop_settings.sql

insert into public.site_settings (key, value) values
  ('shop.enabled', '{"enabled": true}'::jsonb)
on conflict (key) do nothing;
