-- Shop batch 2: 4 themed frames + 4 name animations.
-- Requires: 0006_shop.sql (creates shop_items) first.
-- Apply: supabase/migrations/0011_shop_batch2.sql

insert into public.shop_items (id, name, description, kind, price) values
  ('frame-sakura',      'Sakura Bloom',    'Soft pink glow with a peeking blossom.',       'frame', 600),
  ('frame-moon',        'Moonlit Halo',    'Silvery moonlight around your avatar.',        'frame', 650),
  ('frame-star',        'Stardust',        'Purple starlight ring with a sparkle.',        'frame', 700),
  ('frame-lightning',   'Storm Charge',    'Electric yellow arcs crackling around you.',   'frame', 750),
  ('anim-frost',        'Frost Shift',     'Icy blue-to-white flowing gradient.',          'name_animation', 400),
  ('anim-sparkle',      'Star Sparkle',    'Your name twinkles like a star.',              'name_animation', 500),
  ('anim-neon',         'Neon Pulse',      'Cyan-to-magenta neon glow that breathes.',     'name_animation', 550),
  ('anim-aurora-wave',  'Aurora Wave',     'Northern-lights gradient drifting across.',    'name_animation', 650)
on conflict (id) do update
  set name        = excluded.name,
      description = excluded.description,
      price       = excluded.price,
      active      = true;
