-- Mr. Anime Nitro — timed premium: buy with Mr.Coin on /shop (blue flame
-- profile border, flame hover card, NITRO badge). Admins can also grant the
-- permanent "nitro" badge from /admin/users (no migration needed for that).
-- Apply: supabase/migrations/0007_nitro.sql (SQL editor or supabase db push).

-- Paid Nitro expiry (public so everyone sees your flames).
alter table public.profiles
  add column if not exists nitro_until timestamptz;

grant select (nitro_until) on public.profiles to anon, authenticated;

-- buy_nitro() — spend Mr.Coin for NITRO_DAYS (30) of Nitro; stacks on any
-- unexpired period. Returns {ok, coins, nitro_until, error}.
create or replace function public.buy_nitro()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_price  integer := 1500;
  v_coins  integer;
  v_until  timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'auth');
  end if;

  insert into public.wallets (user_id) values (v_uid)
  on conflict (user_id) do nothing;

  update public.wallets
     set coins = coins - v_price
   where user_id = v_uid and coins >= v_price
  returning coins into v_coins;
  if v_coins is null then
    return jsonb_build_object('ok', false, 'error', 'insufficient');
  end if;

  update public.profiles
     set nitro_until = greatest(coalesce(nitro_until, now()), now()) + make_interval(days => 30)
   where id = v_uid
  returning nitro_until into v_until;

  insert into public.coin_transactions (user_id, amount, reason, ref)
  values (v_uid, -v_price, 'purchase', 'nitro-30d');

  return jsonb_build_object('ok', true, 'coins', v_coins, 'nitro_until', v_until);
end;
$$;

revoke execute on function public.buy_nitro() from public;
grant execute on function public.buy_nitro() to authenticated;
