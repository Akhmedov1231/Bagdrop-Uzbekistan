-- ============================================================
-- Auto-provision a public.users row for every new Supabase Auth user.
-- Role defaults to 'customer'; promote to 'partner'/'admin' explicitly
-- (e.g. via the admin dashboard in a later phase, or manually for now).
-- ============================================================

create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'customer')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
