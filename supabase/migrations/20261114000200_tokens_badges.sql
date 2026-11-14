-- Verified badges + developer API tokens.

alter table public.profiles add column if not exists verified boolean not null default false;
alter table public.comments add column if not exists author_verified boolean not null default false;

-- Keep the commenter snapshot in sync with the profile (admins always verified).
create or replace function public.comments_set_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select username, avatar_url, (verified or role = 'admin')
    into new.author_username, new.author_avatar_url, new.author_verified
  from public.profiles
  where id = new.user_id;
  if new.author_username is null then
    new.author_username := 'Anime fan';
  end if;
  new.author_verified := coalesce(new.author_verified, false);
  return new;
end;
$$;

update public.comments c
set author_verified = (p.verified or p.role = 'admin')
from public.profiles p
where p.id = c.user_id;

-- API tokens are only ever read/written with the service role.
create table if not exists public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'API token' check (char_length(name) between 1 and 50),
  prefix text not null,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists api_tokens_user_idx on public.api_tokens (user_id, created_at desc);

alter table public.api_tokens enable row level security;
revoke all on public.api_tokens from anon, authenticated;
