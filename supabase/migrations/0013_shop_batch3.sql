-- Shop batch 3: 2 image-based frames (caution ring + violet enchant ring).
-- Requires: 0006_shop.sql (creates shop_items) first.
-- Apply: supabase/migrations/0013_shop_batch3.sql

insert into public.shop_items (id, name, description, kind, price) values
  ('frame-caution', 'Caution Ring',   'Gray hazard ring with a grumpy cat and warning signs.', 'frame', 700),
  ('frame-violet',  'Violet Enchant', 'Ornate violet vines, butterflies and a tiny elf.',      'frame', 850)
on conflict (id) do update
  set name        = excluded.name,
      description = excluded.description,
      price       = excluded.price,
      active      = true;
