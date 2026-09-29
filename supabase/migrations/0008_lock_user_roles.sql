-- Nobody may choose or change their own role.
--
-- Until now the browser bundle carried no usable anon key: src/lib/env.ts read
-- process.env[name], which Next.js never inlines, so the browser Supabase
-- client pointed at a placeholder host. Fixing admin/partner login puts the
-- anon key into public JavaScript for the first time, and two holes become
-- reachable by anyone who can sign up:
--
-- 1. handle_new_auth_user() copied `role` from raw_user_meta_data, which the
--    caller controls: signUp({ options: { data: { role: 'admin' } } }).
-- 2. The users_update_own policy, backed by Supabase's default table grants,
--    let a user UPDATE every column of their own row, `role` included.
--
-- is_admin() trusts users.role, and it unlocks every booking (customer names,
-- emails, phone numbers), bags, payments and audit logs, plus writes to
-- partners, partner_users and locations. Writing partner_users is enough to
-- link yourself to any partner, which the app then honours as a partner login.
--
-- This migration must be applied before the build that inlines the anon key
-- goes live.
--
-- Nothing in the app writes public.users with a user's session: rows are
-- inserted by the SECURITY DEFINER trigger below, and roles are assigned by an
-- operator with the service role. Users keep the ability to edit their own
-- name and phone, which is what users_update_own was written for.

create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    'customer'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

revoke insert, update, delete on table public.users from anon, authenticated;
grant update (name, phone) on table public.users to authenticated;

-- REVOKE only warns, and changes nothing, when the migration role is not the
-- grantor of those privileges; CREATE OR REPLACE would likewise leave the old
-- function in place if the trigger called a different one. Either would let
-- this migration "succeed" with both holes still open, so check the outcome
-- and fail loudly instead.
do $$
begin
  if has_table_privilege('anon', 'public.users', 'INSERT')
    or has_table_privilege('authenticated', 'public.users', 'INSERT')
    or has_column_privilege('anon', 'public.users', 'role', 'UPDATE')
    or has_column_privilege('authenticated', 'public.users', 'role', 'UPDATE')
    or has_column_privilege('authenticated', 'public.users', 'email', 'UPDATE')
  then
    raise exception 'public.users is still writable by anon/authenticated; check the table owner and who granted those privileges.';
  end if;

  if not exists (
    select 1
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    join pg_namespace n on n.oid = p.pronamespace
    where t.tgrelid = 'auth.users'::regclass
      and not t.tgisinternal
      and n.nspname = 'public'
      and p.proname = 'handle_new_auth_user'
  ) then
    raise exception 'No trigger on auth.users calls public.handle_new_auth_user(); the replaced function would not be used.';
  end if;
end;
$$;
