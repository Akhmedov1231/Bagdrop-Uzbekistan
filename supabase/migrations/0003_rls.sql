-- ============================================================
-- Row Level Security
--
-- Enabled on every table from Phase 1, per spec section 19/28.
-- Baseline policies below cover what's safe to open up now (public
-- read of active locations, users reading their own row/bookings).
-- Partner- and admin-specific write policies are intentionally
-- deferred to Phases 6/8 where partner_id/role checks are exercised
-- end-to-end — until then, privileged writes go through the
-- service-role admin client from trusted server code only (never
-- from the browser), which is a stated pattern in src/lib/supabase/admin.ts.
-- ============================================================

alter table users enable row level security;
alter table partners enable row level security;
alter table partner_users enable row level security;
alter table locations enable row level security;
alter table bookings enable row level security;
alter table bags enable row level security;
alter table payments enable row level security;
alter table audit_logs enable row level security;

-- ------------------------------------------------------------
-- Helper: is the current user an admin?
-- security definer + fixed search_path avoids recursive RLS checks
-- and search_path hijacking.
-- ------------------------------------------------------------
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from users where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer set search_path = public stable;

create or replace function partner_id_for_current_user()
returns uuid as $$
  select partner_id from partner_users where user_id = auth.uid() limit 1;
$$ language sql security definer set search_path = public stable;

-- ------------------------------------------------------------
-- users: a person can read/update their own row; admins can read all.
-- ------------------------------------------------------------
create policy "users_select_own_or_admin"
  on users for select
  using (id = auth.uid() or is_admin());

create policy "users_update_own"
  on users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ------------------------------------------------------------
-- partners: public has no access; admins full access; partner staff
-- can read their own partner record.
-- ------------------------------------------------------------
create policy "partners_select_admin_or_own"
  on partners for select
  using (is_admin() or id = partner_id_for_current_user());

create policy "partners_write_admin_only"
  on partners for all
  using (is_admin())
  with check (is_admin());

create policy "partner_users_select_admin_or_own"
  on partner_users for select
  using (is_admin() or user_id = auth.uid());

create policy "partner_users_write_admin_only"
  on partner_users for all
  using (is_admin())
  with check (is_admin());

-- ------------------------------------------------------------
-- locations: anyone (including anonymous visitors) can read active
-- locations — this is a public marketing site. Only admins write for
-- now; partner self-service editing of their own locations can be
-- added in a later phase once that flow is built.
-- ------------------------------------------------------------
create policy "locations_select_active_public"
  on locations for select
  using (active = true or is_admin() or partner_id = partner_id_for_current_user());

create policy "locations_write_admin_only"
  on locations for all
  using (is_admin())
  with check (is_admin());

-- ------------------------------------------------------------
-- bookings: a signed-in customer can see their own bookings; partner
-- staff can see bookings for their own locations; admins see all.
-- Guest (customer_id is null) bookings are NOT readable via this
-- anon-key path at all — guests must use the access_token lookup,
-- which goes through a server route using the service-role client
-- (see Phase 3), precisely so a guest's total_amount/status can't be
-- read or enumerated by anyone else via the public API.
-- ------------------------------------------------------------
create policy "bookings_select_own_or_partner_or_admin"
  on bookings for select
  using (
    customer_id = auth.uid()
    or is_admin()
    or location_id in (select id from locations where partner_id = partner_id_for_current_user())
  );

-- No direct insert/update policy for the anon/authenticated role:
-- booking creation and status transitions always go through server
-- actions that validate price/availability/state-machine rules
-- server-side (Phase 3+), using the service-role client deliberately.

-- ------------------------------------------------------------
-- bags: visible to the booking's owner, the relevant partner, or admin.
-- ------------------------------------------------------------
create policy "bags_select_via_booking"
  on bags for select
  using (
    booking_id in (
      select id from bookings
      where customer_id = auth.uid()
         or is_admin()
         or location_id in (select id from locations where partner_id = partner_id_for_current_user())
    )
  );

-- ------------------------------------------------------------
-- payments: visible to the booking's owner or admin. Partners do not
-- need to see payment records for their locations in the MVP.
-- ------------------------------------------------------------
create policy "payments_select_own_or_admin"
  on payments for select
  using (
    is_admin()
    or booking_id in (select id from bookings where customer_id = auth.uid())
  );

-- ------------------------------------------------------------
-- audit_logs: admin-only.
-- ------------------------------------------------------------
create policy "audit_logs_admin_only"
  on audit_logs for select
  using (is_admin());
