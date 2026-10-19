-- Redeem codes + coin-reward shop (Supporter/Nebula badges with Mr.Coin).
-- Apply: supabase/migrations/0020_redeem_codes.sql

-- 1. Redeem codes (admin-generated, one or many use) -------------------------
create table if not exists public.redeem_codes (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  coins      integer not null default 0 check (coins between 0 and 100000),
  badge      text,
  max_uses   integer not null default 1 check (max_uses >= 1),
  uses       integer not null default 0 check (uses >= 0),
  expires_at timestamptz,
  active     boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.redeem_codes enable row level security;
drop policy if exists redeem_codes_admin on public.redeem_codes;
create policy redeem_codes_admin on public.redeem_codes
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- 2. Claim history (one claim per user per code) -----------------------------
create table if not exists public.redeem_claims (
  id         uuid primary key default gen_random_uuid(),
  code_id    uuid not null references public.redeem_codes (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  coins      integer not null,
  badge      text,
  created_at timestamptz not null default now(),
  unique (code_id, user_id)
);
create index if not exists redeem_claims_user_idx
  on public.redeem_claims (user_id, created_at desc);
alter table public.redeem_claims enable row level security;
drop policy if exists redeem_claims_own on public.redeem_claims;
create policy redeem_claims_own on public.redeem_claims
  for select using (auth.uid() = user_id);

-- 3. Ledger reason ------------------------------------------------------------
alter table public.coin_transactions
  drop constraint if exists coin_transactions_reason_check;
alter table public.coin_transactions
  add constraint coin_transactions_reason_check
  check (reason in ('watch_drop', 'purchase', 'welcome', 'admin_grant', 'donation', 'daily', 'gift', 'redeem'));

-- 4. redeem_code(p_code) — atomic claim: validate, record, credit, badge -----
create or replace function public.redeem_code(p_code text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_norm   text := upper(trim(coalesce(p_code, '')));
  v_code   public.redeem_codes%rowtype;
  v_coins  integer;
  v_claim  boolean := false;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'auth');
  end if;
  if v_norm = '' or length(v_norm) > 64 then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  select * into v_code
    from public.redeem_codes
   where code = v_norm
     and active
     and (expires_at is null or expires_at > now())
     and uses < max_uses
     for update;

  if not found then
    if exists (
      select 1 from public.redeem_claims c
      join public.redeem_codes rc on rc.id = c.code_id
      where c.user_id = v_uid and rc.code = v_norm
    ) then
      return jsonb_build_object('ok', false, 'error', 'already_claimed');
    end if;
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  begin
    insert into public.redeem_claims (code_id, user_id, coins, badge)
    values (v_code.id, v_uid, v_code.coins, v_code.badge);
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'already_claimed');
  exception when others then
    return jsonb_build_object('ok', false, 'error', 'failed');
  end;

  update public.redeem_codes set uses = uses + 1 where id = v_code.id;

  if v_code.coins > 0 then
    insert into public.wallets (user_id, coins) values (v_uid, v_code.coins)
    on conflict (user_id) do update set coins = wallets.coins + excluded.coins
    returning coins into v_coins;

    insert into public.coin_transactions (user_id, amount, reason, ref)
    values (v_uid, v_code.coins, 'redeem', v_norm);
  else
    select coins into v_coins from public.wallets where user_id = v_uid;
    v_coins := coalesce(v_coins, 0);
  end if;

  if v_code.badge is not null and v_code.badge <> '' then
    update public.profiles
       set badges = array_append(coalesce(badges, '{}'::text[]), v_code.badge)
     where id = v_uid
       and not (coalesce(badges, '{}'::text[]) @> array[v_code.badge]);
  end if;

  return jsonb_build_object(
    'ok', true,
    'coins_earned', v_code.coins,
    'coins', coalesce(v_coins, 0),
    'badge', v_code.badge
  );
end;
$$;

-- 5. buy_reward(p_key) — spend Mr.Coin for a permanent badge reward ----------
create or replace function public.buy_reward(p_key text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_price  integer;
  v_badge  text;
  v_badges text[];
  v_coins  integer;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'auth');
  end if;

  v_price := case p_key when 'supporter' then 250 when 'nebula' then 1200 end;
  v_badge := case p_key when 'supporter' then 'supporter' when 'nebula' then 'nebula' end;
  if v_price is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  select coalesce(badges, '{}'::text[]) into v_badges
    from public.profiles where id = v_uid;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'auth');
  end if;
  if v_badges @> array[v_badge] then
    return jsonb_build_object('ok', false, 'error', 'already_owned');
  end if;

  update public.wallets
     set coins = coins - v_price
   where user_id = v_uid and coins >= v_price
   returning coins into v_coins;
  if v_coins is null then
    return jsonb_build_object('ok', false, 'error', 'insufficient');
  end if;

  insert into public.coin_transactions (user_id, amount, reason, ref)
  values (v_uid, -v_price, 'purchase', 'reward:' || p_key);

  update public.profiles
     set badges = array_append(v_badges, v_badge)
   where id = v_uid;

  return jsonb_build_object('ok', true, 'coins', v_coins, 'badge', v_badge);
end;
$$;

-- 6. Grants: signed-in users only --------------------------------------------
revoke execute on function public.redeem_code(text) from public, anon;
revoke execute on function public.buy_reward(text)  from public, anon;
grant  execute on function public.redeem_code(text) to authenticated;
grant  execute on function public.buy_reward(text)  to authenticated;
