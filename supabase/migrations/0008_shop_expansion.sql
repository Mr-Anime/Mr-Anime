-- Shop expansion: 20 more name styles (text styles) + 10 themed profile
-- frames inspired by Discord Nitro profile decor.
-- Requires: 0006_shop.sql (creates shop_items) first.
-- Apply: supabase/migrations/0008_shop_expansion.sql

-- 20 new name styles — ids double as CSS classes (shop-style-*)
insert into public.shop_items (id, name, description, kind, price) values
  ('style-crimson',    'Crimson Text',   'Deep red for bold statements.',                    'name_style', 75),
  ('style-violet',     'Violet Text',    'Soft violet purple.',                             'name_style', 75),
  ('style-mono',       'Monochrome',     'Clean, stark white.',                             'name_style', 75),
  ('style-icy',        'Icy Text',       'Frozen blue-to-white gradient.',                  'name_style', 100),
  ('style-hand',       'Handwritten',    'Casual handwriting vibe.',                        'name_style', 120),
  ('style-candy',      'Candy',          'Pink-to-yellow sugar gradient.',                  'name_style', 150),
  ('style-ocean',      'Ocean',          'Deep blue-to-teal waves.',                        'name_style', 150),
  ('style-toxic',      'Toxic Glow',     'Radioactive green with a glow.',                  'name_style', 150),
  ('style-flame',      'Flame Text',     'Burning orange-red gradient.',                    'name_style', 150),
  ('style-poster',     'Poster',         'Tall condensed gold caps.',                       'name_style', 150),
  ('style-cyber',      'Cyberpunk',      'Retro glitch shadows on tech type.',              'name_style', 200),
  ('style-arcade',     'Arcade',         'Comic-book arcade letters.',                      'name_style', 200),
  ('style-outline',    'Outline',        'Hollow letters with a sharp stroke.',             'name_style', 250),
  ('style-lava',       'Lava',           'Slow-flowing molten gradient.',                   'name_style', 300),
  ('style-horror',     'Horror',         'Blood-curdling creepy type.',                    'name_style', 300),
  ('style-neon',       'Neon Glow',      'Electric cyan neon sign.',                        'name_style', 350),
  ('style-vaporwave',  'Vaporwave',      'Pink-purple-teal retro vibes.',                   'name_style', 400),
  ('style-galaxy',     'Galaxy',         'Deep-space shimmering gradient.',                 'name_style', 450),
  ('style-holo',       'Holographic',    'Shifting holographic gradient.',                  'name_style', 500),
  ('style-goldshine',  'Golden Sweep',   'Luxury gold with a light sweep.',                 'name_style', 550)
on conflict (id) do nothing;

-- 10 themed frames — animated borders + peeking emoji decor
insert into public.shop_items (id, name, description, kind, price) values
  ('frame-dust',     'Witch Dust',      'Sparkling magic-dust border.',          'frame', 500),
  ('frame-leaves',   'Autumn Leaf',     'Warm autumn border with a falling leaf.','frame', 500),
  ('frame-candles',  'Witchlight',      'Cyan glow with tiny candles on top.',   'frame', 550),
  ('frame-thorns',   'Crimson Thorns',  'Sharp blood-red thorn glow.',           'frame', 550),
  ('frame-eyes',     'Always Watching', 'Something peeks over your avatar.',     'frame', 600),
  ('frame-haunted',  'Haunted',         'Gray specter glow with a skull.',       'frame', 600),
  ('frame-crystal',  'Crystal',         'Icy crystal shimmer.',                  'frame', 650),
  ('frame-eclipse',  'Totality',        'Sun-corona glow in the dark.',          'frame', 700),
  ('frame-holo',     'Hologram',        'Shifting holographic ring.',            'frame', 750),
  ('frame-symbiote', 'Symbiote',        'Dark goo with pulsing violet veins.',   'frame', 800)
on conflict (id) do nothing;
