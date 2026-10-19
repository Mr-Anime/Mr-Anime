-- Name-style batch 4 — link-loaded Google display fonts (Black Ops One,
-- Eagle Lake, Isometra, New Rocker, Rubik Storm, Sancreek).
-- Styles live in globals.css (.shop-style-*); fonts load from the root
-- layout <link> tags (CSP already allows fonts.googleapis.com / fonts.gstatic.com).
-- Apply: supabase/migrations/0021_name_styles_batch4.sql

insert into public.shop_items (id, name, description, kind, price) values
  ('style-blackops', 'Black Ops One Name', 'Military stencil display font — battle-ready lettering.',
    'name_style', 300),
  ('style-eagle', 'Eagle Lake Name', 'Regal fantasy serif with a cool silver glow.',
    'name_style', 300),
  ('style-isometra', 'Isometra Name', 'Futuristic geometric typeface with a cyan-violet gradient.',
    'name_style', 350),
  ('style-rocker', 'New Rocker Name', 'Heavy-metal gothic lettering in blood red.',
    'name_style', 350),
  ('style-storm', 'Rubik Storm Name', 'Storm-charged display font with a flashing gradient loop.',
    'name_style', 400),
  ('style-creek', 'Sancreek Name', 'Vintage western woodtype in aged gold.',
    'name_style', 300)
on conflict (id) do nothing;
