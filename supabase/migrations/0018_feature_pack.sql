-- Feature pack: daily streaks, watch progress, ratings, coin gifting,
-- leaderboard helper, seasonal event frames.
-- Apply: supabase/migrations/0018_feature_pack.sql

-- 1. Daily login streaks ----------------------------------------------------
create table if not exists public.streaks (
  user_id        uuid primary key references public.profiles (id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_claim_date date
);
alter table public.streaks enable row level security;
drop policy if exists streaks_select_own on public.streaks;
create policy streaks_select_own on public.streaks
  for select using (auth.uid() = user_id);

-- 2. Watch progress (continue watching + profile stats) ---------------------
create table if not exists public.watch_progress (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  anilist_id integer not null,
  episode    integer not null check (episode >= 1),
  updated_at timestamptz not null default now(),
  primary key (user_id, anilist_id)
);
create index if not exists watch_progress_user_idx
  on public.watch_progress (user_id, updated_at desc);
alter table public.watch_progress enable row level security;
drop policy if exists watch_progress_own on public.watch_progress;
create policy watch_progress_own on public.watch_progress
  for select using (auth.uid() = user_id);
drop policy if exists watch_progress_insert_own on public.watch_progress;
create policy watch_progress_insert_own on public.watch_progress
  for insert with check (auth.uid() = user_id);
drop policy if exists watch_progress_update_own on public.watch_progress;
create policy watch_progress_update_own on public.watch_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. Community ratings (1–5 stars, public averages) -------------------------
create table if not exists public.ratings (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  anilist_id integer not null,
  score      smallint not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, anilist_id)
);
create index if not exists ratings_anime_idx on public.ratings (anilist_id);
alter table public.ratings enable row level security;
drop policy if exists ratings_select_public on public.ratings;
create policy ratings_select_public on public.ratings
  for select using (true);
drop policy if exists ratings_insert_own on public.ratings;
create policy ratings_insert_own on public.ratings
  for insert with check (auth.uid() = user_id);
drop policy if exists ratings_update_own on public.ratings;
create policy ratings_update_own on public.ratings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists ratings_delete_own on public.ratings;
create policy ratings_delete_own on public.ratings
  for delete using (auth.uid() = user_id);

-- 4. Ledger reasons for streaks + gifts -------------------------------------
alter table public.coin_transactions
  drop constraint if exists coin_transactions_reason_check;
alter table public.coin_transactions
  add constraint coin_transactions_reason_check
  check (reason in ('watch_drop', 'purchase', 'welcome', 'admin_grant', 'donation', 'daily', 'gift'));

-- 5. claim_daily_reward() — one claim per UTC day, streak-based coins ------
create or replace function public.claim_daily_reward() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_streak public.streaks%rowtype;
  v_today date := (now() at time zone 'utc')::date;
  v_diff integer;
  v_new integer;
  v_reward integer;
  v_coins integer;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'auth');
  end if;

  insert into public.streaks (user_id) values (v_uid) on conflict (user_id) do nothing;
  select * into v_streak from public.streaks where user_id = v_uid for update;

  if v_streak.last_claim_date = v_today then
    return jsonb_build_object('ok', false, 'error', 'already_claimed',
                              'streak', v_streak.current_streak);
  end if;

  if v_streak.last_claim_date is null then
    v_new := 1;
  else
    v_diff := v_today - v_streak.last_claim_date;
    v_new := case when v_diff = 1 then v_streak.current_streak + 1 else 1 end;
  end if;

  v_reward := least(25 * v_new, 250);

  update public.streaks
     set current_streak = v_new,
         longest_streak = greatest(longest_streak, v_new),
         last_claim_date = v_today
   where user_id = v_uid;

  insert into public.wallets (user_id, coins) values (v_uid, v_reward)
  on conflict (user_id) do update set coins = wallets.coins + excluded.coins
  returning coins into v_coins;

  insert into public.coin_transactions (user_id, amount, reason, ref)
  values (v_uid, v_reward, 'daily', v_today::text);

  return jsonb_build_object('ok', true, 'reward', v_reward, 'coins', v_coins,
                            'streak', v_new, 'longest', greatest(v_streak.longest_streak, v_new));
end;
$$;

-- 6. gift_coins() — atomic wallet-to-wallet transfer ------------------------
create or replace function public.gift_coins(p_receiver uuid, p_amount integer) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_coins integer;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'auth');
  end if;
  if p_receiver is null or p_receiver = v_uid then
    return jsonb_build_object('ok', false, 'error', 'invalid_target');
  end if;
  if p_amount is null or p_amount < 1 or p_amount > 100000 then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;
  if not exists (select 1 from public.profiles where id = p_receiver) then
    return jsonb_build_object('ok', false, 'error', 'user_not_found');
  end if;

  update public.wallets
     set coins = coins - p_amount
   where user_id = v_uid and coins >= p_amount
   returning coins into v_coins;
  if v_coins is null then
    return jsonb_build_object('ok', false, 'error', 'insufficient');
  end if;

  insert into public.wallets (user_id, coins) values (p_receiver, p_amount)
  on conflict (user_id) do update set coins = wallets.coins + excluded.coins;

  insert into public.coin_transactions (user_id, amount, reason, ref) values
    (v_uid, -p_amount, 'gift', p_receiver::text),
    (p_receiver, p_amount, 'gift', v_uid::text);

  return jsonb_build_object('ok', true, 'coins', v_coins);
end;
$$;

-- 7. leaderboard_comments() — top commenters --------------------------------
create or replace function public.leaderboard_comments(p_limit integer default 20)
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  role text,
  is_verified boolean,
  badges text[],
  nitro_until timestamptz,
  value bigint
)
language sql security definer set search_path = public as $$
  select c.user_id, p.username, p.avatar_url, p.role, p.is_verified,
         p.badges, p.nitro_until, count(*)::bigint as value
    from public.comments c
    join public.profiles p on p.id = c.user_id
   group by c.user_id, p.username, p.avatar_url, p.role, p.is_verified, p.badges, p.nitro_until
   order by value desc, p.username asc
   limit least(coalesce(p_limit, 20), 50);
$$;

-- Function grants: only the right roles may execute.
revoke execute on function public.claim_daily_reward()    from public, anon;
revoke execute on function public.gift_coins(uuid, int)   from public, anon;
revoke execute on function public.leaderboard_comments(int) from public, anon, authenticated;
grant  execute on function public.claim_daily_reward()    to authenticated;
grant  execute on function public.gift_coins(uuid, int)   to authenticated;
grant  execute on function public.leaderboard_comments(int) to service_role;

-- 8. Seasonal event frames --------------------------------------------------
insert into public.shop_items (id, name, description, kind, price) values
  ('frame-halloween', 'Halloween Night', 'Limited seasonal frame — pumpkins and violet night glow.', 'frame', 450),
  ('frame-summer', 'Summer Solstice', 'Limited seasonal frame — golden sun and ocean cyan.', 'frame', 400)
on conflict (id) do nothing;
