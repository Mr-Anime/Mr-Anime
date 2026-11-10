-- Promote (or demote) an account by email.
--
-- Run manually in the Supabase SQL editor, e.g.
--   select public.promote_admin('you@example.com');
--   select public.promote_admin('someone@example.com', false);
--
-- Only callable with the service role (or from the SQL editor); regular
-- clients cannot self-promote because profiles.role is not writable by them.

create or replace function public.promote_admin(target_email text, make_admin boolean default true)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  previous text;
begin
  if auth.role() is not null and auth.role() <> 'service_role' and not public.is_admin() then
    raise exception 'Not allowed';
  end if;

  select id into target_id from auth.users where lower(email) = lower(target_email);
  if target_id is null then
    return 'no user with email ' || target_email;
  end if;

  select role into previous from public.profiles where id = target_id;
  update public.profiles set role = case when make_admin then 'admin' else 'user' end where id = target_id;
  return format('%s: %s -> %s', target_email, coalesce(previous, 'none'), case when make_admin then 'admin' else 'user' end);
end;
$$;

revoke all on function public.promote_admin(text, boolean) from public;
revoke all on function public.promote_admin(text, boolean) from anon;
revoke all on function public.promote_admin(text, boolean) from authenticated;
