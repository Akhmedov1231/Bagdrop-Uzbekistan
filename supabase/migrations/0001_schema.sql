-- ============================================================
-- BagDrop — Phase 1 schema
-- Run this in the Supabase SQL editor, or via the Supabase CLI:
--   supabase db push
-- ============================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------
create type user_role as enum ('customer', 'partner', 'admin');

create type booking_status as enum (
  'PENDING_PAYMENT',
  'PAID',
  'CHECKED_IN',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
  'EXPIRED'
);

create type bag_status as enum ('PENDING', 'CHECKED_IN', 'CHECKED_OUT');

create type payment_provider as enum ('click', 'payme', 'dev_simulator');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create type commission_type as enum ('percent', 'fixed');

-- ------------------------------------------------------------
-- users
-- Mirrors auth.users (1:1). A row is created here via trigger
-- (see 0003_auth_trigger.sql) whenever someone signs up through
-- Supabase Auth, so app code has a normal queryable "users" table
-- with a `role` column instead of reaching into auth.users directly.
-- ------------------------------------------------------------
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create index idx_users_role on users (role);

-- ------------------------------------------------------------
-- partners
-- ------------------------------------------------------------
create table partners (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text not null,
  phone text,
  email text,
  commission_type commission_type not null default 'percent',
  commission_value numeric(10, 2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Links a Supabase Auth user to the partner business they work for.
-- One partner can have multiple staff users; a user belongs to one partner.
create table partner_users (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create index idx_partner_users_partner on partner_users (partner_id);

-- ------------------------------------------------------------
-- locations
-- ------------------------------------------------------------
create table locations (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners (id) on delete restrict,
  city text not null,
  name text not null,
  slug text not null unique,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  description text,
  price_per_bag numeric(12, 2) not null check (price_per_bag > 0),
  capacity integer not null check (capacity > 0),
  opening_time time not null default '08:00',
  closing_time time not null default '22:00',
  active boolean not null default true,
  google_maps_url text,
  yandex_maps_url text,
  created_at timestamptz not null default now()
);

create index idx_locations_partner on locations (partner_id);
create index idx_locations_city on locations (city);
create index idx_locations_active on locations (active);

-- ------------------------------------------------------------
-- bookings
-- ------------------------------------------------------------
create table bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique,
  -- Long random token for guest booking lookup (see spec section 14).
  -- Never expose booking_number + id alone as "proof of ownership" —
  -- always require this token too.
  access_token uuid not null default gen_random_uuid(),

  customer_id uuid references users (id) on delete set null, -- null = guest booking
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,

  location_id uuid not null references locations (id) on delete restrict,

  dropoff_date date not null,
  pickup_date date not null,
  dropoff_time time not null,
  pickup_time time not null,

  bag_count integer not null check (bag_count > 0),
  price_per_bag numeric(12, 2) not null,
  total_amount numeric(12, 2) not null,
  currency text not null default 'UZS',

  status booking_status not null default 'PENDING_PAYMENT',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pickup_after_dropoff check (
    (pickup_date > dropoff_date)
    or (pickup_date = dropoff_date and pickup_time > dropoff_time)
  )
);

create index idx_bookings_location on bookings (location_id);
create index idx_bookings_customer on bookings (customer_id);
create index idx_bookings_status on bookings (status);
create index idx_bookings_dates on bookings (location_id, dropoff_date, pickup_date);

-- ------------------------------------------------------------
-- bags
-- ------------------------------------------------------------
create table bags (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  tag_number text not null,
  status bag_status not null default 'PENDING',
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  created_at timestamptz not null default now(),
  unique (booking_id, tag_number)
);

create index idx_bags_booking on bags (booking_id);

-- ------------------------------------------------------------
-- payments
-- ------------------------------------------------------------
create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  provider payment_provider not null,
  provider_transaction_id text unique, -- unique guards against replayed webhooks
  amount numeric(12, 2) not null,
  currency text not null default 'UZS',
  status payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_booking on payments (booking_id);

-- ------------------------------------------------------------
-- audit_logs
-- ------------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_entity on audit_logs (entity_type, entity_id);

-- ------------------------------------------------------------
-- updated_at auto-touch trigger
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_bookings_updated_at
  before update on bookings
  for each row execute function set_updated_at();

create trigger trg_payments_updated_at
  before update on payments
  for each row execute function set_updated_at();
