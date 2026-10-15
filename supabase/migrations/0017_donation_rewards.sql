-- Donation rewards: Mr.Coins (200 per $1) + permanent "supporter" badge,
-- granted exactly once per paid donation (webhook-safe against retries).
-- Apply: supabase/migrations/0017_donation_rewards.sql

-- 1. Ledger reason for donation rewards.
alter table public.coin_transactions
  drop constraint if exists coin_transactions_reason_check;
alter table public.coin_transactions
  add constraint coin_transactions_reason_check
  check (reason in ('watch_drop', 'purchase', 'welcome', 'admin_grant', 'donation'));

-- 2. Reward bookkeeping on the donation row.
alter table public.donations
  add column if not exists rewarded boolean not null default false;
alter table public.donations
  add column if not exists reward_coins integer;

-- 3. Atomic IPN handler — status update + one-time reward.
--    SECURITY DEFINER: called via the service role from the webhook route.
create or replace function public.apply_donation_ipn(
  p_track_id text,
  p_status text,
  p_raw jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_donation public.donations%rowtype;
  v_coins integer;
begin
  update public.donations
     set status  = p_status,
         raw     = p_raw,
         paid_at = case when p_status = 'Paid'
                         then coalesce(paid_at, now())
                        else paid_at end
   where track_id = p_track_id
   returning * into v_donation;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'unknown_track');
  end if;

  if p_status = 'Paid'
     and v_donation.user_id is not null
     and not v_donation.rewarded
  then
    v_coins := floor(v_donation.amount * 200)::int;

    update public.donations
       set rewarded = true, reward_coins = v_coins
     where id = v_donation.id;

    insert into public.wallets (user_id, coins)
    values (v_donation.user_id, v_coins)
    on conflict (user_id) do update set coins = wallets.coins + excluded.coins;

    insert into public.coin_transactions (user_id, amount, reason, ref)
    values (v_donation.user_id, v_coins, 'donation', v_donation.order_id);

    update public.profiles
       set badges = case
             when badges @> array['supporter'] then badges
             else array_append(coalesce(badges, '{}'::text[]), 'supporter')
           end
     where id = v_donation.user_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'rewarded', v_donation.rewarded
      or (p_status = 'Paid' and v_donation.user_id is not null)
  );
end;
$$;

revoke execute on function public.apply_donation_ipn(text, text, jsonb)
  from public, anon, authenticated;
grant  execute on function public.apply_donation_ipn(text, text, jsonb)
  to service_role;
