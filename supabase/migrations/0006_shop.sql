-- Shop + Mr.Coin: watch anime to earn coins, spend them on profile cosmetics
-- (avatar frames, name styles, name animations) that show up in comments,
-- hover cards and profile pages.
-- Apply: supabase/migrations/0006_shop.sql (SQL editor or supabase db push).

-- 1. Wallets — separate table so coin balances stay private (profiles uses
--    column-level grants that do not include coins).
create table if not exists public.wallets (
  user_id           uuid primary key references public.profiles (id) on delete cascade,
  coins             integer not null default 0 check (coins >= 0),
  last_coin_drop_at timestamptz,
  created_at        timestamptz not null default now()
);

-- 2. Catalog + ownership + equipped loadout + ledger.
create table if not exists public.shop_items (
  id          text primary key,
  name        text not null check (char_length(name) between 1 and 60),
  description text not null default '',
  kind        text not null check (kind in ('frame', 'name_style', 'name_animation')),
  price       integer not null check (price >= 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.user_items (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  item_id    text not null references public.shop_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create index if not exists user_items_user_idx on public.user_items (user_id, created_at desc);

create table if not exists public.user_loadout (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  frame           text references public.shop_items (id) on delete set null,
  name_style      text references public.shop_items (id) on delete set null,
  name_animation  text references public.shop_items (id) on delete set null,
  updated_at      timestamptz not null default now()
);

create table if not exists public.coin_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  amount     integer not null,
  reason     text not null check (reason in ('watch_drop', 'purchase', 'welcome', 'admin_grant')),
  ref        text,
  created_at timestamptz not null default now()
);

create index if not exists coin_transactions_user_idx
  on public.coin_transactions (user_id, created_at desc);

-- 3. Grants — clients never write wallets/transactions/purchases directly;
--    money movement only happens inside SECURITY DEFINER functions below.
revoke all on public.wallets           from anon, authenticated;
revoke all on public.shop_items        from anon, authenticated;
revoke all on public.user_items        from anon, authenticated;
revoke all on public.user_loadout      from anon, authenticated;
revoke all on public.coin_transactions from anon, authenticated;

grant select on public.wallets           to authenticated;
grant select on public.shop_items        to anon, authenticated;
grant select on public.user_items        to authenticated;
grant select on public.user_loadout      to anon, authenticated;
grant select on public.coin_transactions to authenticated;

-- 4. Row Level Security.
alter table public.wallets           enable row level security;
alter table public.shop_items        enable row level security;
alter table public.user_items        enable row level security;
alter table public.user_loadout      enable row level security;
alter table public.coin_transactions enable row level security;

drop policy if exists wallets_select_own on public.wallets;
create policy wallets_select_own on public.wallets
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists shop_items_select_public on public.shop_items;
create policy shop_items_select_public on public.shop_items
  for select to anon, authenticated
  using (active);

drop policy if exists user_items_select_own on public.user_items;
create policy user_items_select_own on public.user_items
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Equipped loadouts are public (comments / hover cards / profiles show them).
drop policy if exists user_loadout_select_public on public.user_loadout;
create policy user_loadout_select_public on public.user_loadout
  for select to anon, authenticated
  using (true);

drop policy if exists coin_transactions_select_own on public.coin_transactions;
create policy coin_transactions_select_own on public.coin_transactions
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- 5. Welcome bonus — every new profile gets a wallet with starter coins.
create or replace function public.handle_new_wallet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wallets (user_id, coins)
  values (new.id, 100)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_create_wallet on public.profiles;
create trigger on_profile_create_wallet
  after insert on public.profiles
  for each row execute function public.handle_new_wallet();

-- Backfill wallets for profiles that already existed (same 100-coin bonus).
insert into public.wallets (user_id, coins)
select id, 100 from public.profiles
on conflict (user_id) do nothing;

-- 6. coin_drop() — random Mr.Coin for watching. Called from the watch page
--    with the viewer's session client; 10-minute cooldown, 15% jackpot ×3.
create or replace function public.coin_drop()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_amount integer;
begin
  if v_uid is null then
    return 0;
  end if;

  insert into public.wallets (user_id) values (v_uid)
  on conflict (user_id) do nothing;

  v_amount := 2 + floor(random() * 9)::integer;
  if random() < 0.15 then
    v_amount := v_amount * 3;
  end if;

  update public.wallets
     set coins = coins + v_amount,
         last_coin_drop_at = now()
   where user_id = v_uid
     and (last_coin_drop_at is null or last_coin_drop_at < now() - interval '10 minutes');
  if not found then
    return 0;
  end if;

  insert into public.coin_transactions (user_id, amount, reason)
  values (v_uid, v_amount, 'watch_drop');
  return v_amount;
end;
$$;

-- 7. shop_purchase(item) — atomic buy: deducts coins, records ownership and
--    the ledger row; returns {ok, coins, error}.
create or replace function public.shop_purchase(p_item_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_item  public.shop_items%rowtype;
  v_coins integer;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'auth');
  end if;

  select * into v_item from public.shop_items where id = p_item_id and active;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  insert into public.wallets (user_id) values (v_uid)
  on conflict (user_id) do nothing;

  update public.wallets
     set coins = coins - v_item.price
   where user_id = v_uid and coins >= v_item.price
  returning coins into v_coins;
  if v_coins is null then
    return jsonb_build_object('ok', false, 'error', 'insufficient');
  end if;

  insert into public.user_items (user_id, item_id)
  values (v_uid, v_item.id)
  on conflict (user_id, item_id) do nothing;
  if not found then
    raise exception 'already owned';
  end if;

  insert into public.coin_transactions (user_id, amount, reason, ref)
  values (v_uid, -v_item.price, 'purchase', v_item.id);

  return jsonb_build_object('ok', true, 'coins', v_coins, 'item', v_item.id);
end;
$$;

-- 8. shop_equip(slot, item) — equip/unequip one cosmetics slot after
--    verifying the item exists, matches the slot's kind and is owned.
create or replace function public.shop_equip(p_slot text, p_item_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_kind text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'auth');
  end if;
  if p_slot not in ('frame', 'name_style', 'name_animation') then
    return jsonb_build_object('ok', false, 'error', 'invalid_slot');
  end if;
  v_kind := p_slot;

  if p_item_id is not null then
    if not exists (
      select 1 from public.shop_items where id = p_item_id and kind = v_kind and active
    ) then
      return jsonb_build_object('ok', false, 'error', 'not_found');
    end if;
    if not exists (
      select 1 from public.user_items where user_id = v_uid and item_id = p_item_id
    ) then
      return jsonb_build_object('ok', false, 'error', 'not_owned');
    end if;
  end if;

  insert into public.user_loadout (user_id) values (v_uid)
  on conflict (user_id) do nothing;

  update public.user_loadout
     set frame          = case when p_slot = 'frame'          then p_item_id else frame end,
         name_style     = case when p_slot = 'name_style'     then p_item_id else name_style end,
         name_animation = case when p_slot = 'name_animation' then p_item_id else name_animation end,
         updated_at     = now()
   where user_id = v_uid;

  return jsonb_build_object('ok', true, 'slot', p_slot, 'item', to_jsonb(p_item_id));
end;
$$;

-- 9. Function grants.
revoke execute on function public.coin_drop()      from public;
revoke execute on function public.shop_purchase(text) from public;
revoke execute on function public.shop_equip(text, text) from public;
grant execute on function public.coin_drop()          to authenticated;
grant execute on function public.shop_purchase(text)  to authenticated;
grant execute on function public.shop_equip(text, text) to authenticated;

-- 10. Seed catalog — ids double as CSS class suffixes (shop-<id>).
insert into public.shop_items (id, name, description, kind, price) values
  ('frame-frost',    'Frost Frame',       'A cool icy blue glow around your avatar.',        'frame', 100),
  ('frame-neon-pink','Neon Pink Frame',   'Hot pink neon glow for your avatar.',             'frame', 200),
  ('frame-gold',     'Golden Frame',      'A luxurious golden aura.',                        'frame', 300),
  ('frame-rainbow',  'Rainbow Frame',     'Your avatar wears the whole spectrum.',           'frame', 500),
  ('frame-flame',    'Flame Frame',       'Burning orange fire around your avatar.',         'frame', 700),
  ('style-sky',      'Sky Name',          'Your name in calm sky blue.',                     'name_style', 50),
  ('style-emerald',  'Emerald Name',      'Your name in rich emerald green.',                'name_style', 50),
  ('style-gold',     'Gold Name',         'Your name in shining gold.',                      'name_style', 100),
  ('style-rose',     'Rose Name',         'Your name in soft rose pink.',                    'name_style', 100),
  ('style-sunset',   'Sunset Name',       'Orange-to-pink gradient on your name.',           'name_style', 250),
  ('style-aurora',   'Aurora Name',       'Northern-lights gradient on your name.',          'name_style', 400),
  ('anim-glow',      'Glow Pulse',        'Your name softly pulses with light.',             'name_animation', 150),
  ('anim-shimmer',   'Shimmer',           'A shining sweep across your name.',               'name_animation', 300),
  ('anim-rainbow',   'Rainbow Flow',      'A flowing rainbow gradient on your name.',        'name_animation', 600),
  ('anim-glitch',    'Glitch',            'Your name glitches like a broken screen.',        'name_animation', 800)
on conflict (id) do nothing;
