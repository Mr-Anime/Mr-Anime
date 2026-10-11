-- New shop frame: Cosmic Koi — image-based avatar frame
-- (transparent webp overlay at /frames/frame-koi.webp, class shop-frame-koi).
-- Apply: supabase/migrations/0009_shop_frame_koi.sql (SQL editor or supabase db push).

insert into public.shop_items (id, name, description, kind, price)
values (
  'frame-koi',
  'Cosmic Koi Frame',
  'Two celestial koi circle your avatar beneath a glowing constellation.',
  'frame',
  1000
)
on conflict (id) do update
  set name        = excluded.name,
      description = excluded.description,
      price       = excluded.price,
      active      = true;
