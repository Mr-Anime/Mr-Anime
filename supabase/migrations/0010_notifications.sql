-- Admin → user notifications: fan-out rows per user, service role inserts,
-- users read/mark their own rows. Apply:
-- supabase/migrations/0010_notifications.sql (SQL editor or supabase db push).

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 80),
  body       text not null default '' check (char_length(body) <= 300),
  created_at timestamptz not null default now(),
  read_at    timestamptz
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

revoke all on public.notifications from anon;
grant select, update on public.notifications to authenticated;

-- Users only ever see their own notifications.
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- No insert/delete policies: clients can never create or destroy
-- notifications — only admin server actions (service role) write them.

-- Column protection: a session may only toggle read_at on its own rows.
create or replace function public.protect_notification_columns()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    return new; -- service role (admin server action)
  end if;
  if new.id         is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.title   is distinct from old.title
     or new.body    is distinct from old.body
     or new.created_at is distinct from old.created_at then
    raise exception 'You can only mark notifications as read';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_notification_columns on public.notifications;
create trigger protect_notification_columns
  before update on public.notifications
  for each row execute function public.protect_notification_columns();
