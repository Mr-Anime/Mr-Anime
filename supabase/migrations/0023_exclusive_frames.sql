-- Admin-granted exclusive avatar frames.
-- The frame is seeded inactive so nobody can buy or equip it themselves;
-- admins assign it from /admin/users and it is written straight to the
-- target user's collection + loadout by the service role.
-- Apply: supabase/migrations/0023_exclusive_frames.sql

insert into public.shop_items (id, name, description, kind, price, active)
values (
  'frame-exclusive-crimson',
  'Crimson Ring',
  'Admin-granted exclusive frame — dark crimson blades circling your avatar.',
  'frame',
  0,
  false
)
on conflict (id) do update
  set name        = excluded.name,
      description = excluded.description,
      kind        = excluded.kind,
      price       = excluded.price,
      active      = false;
