-- Operational schema and atomic server-side operations.

alter table public.payments
  add column if not exists payment_url text,
  add column if not exists idempotency_key text;

create unique index if not exists payments_idempotency_key_idx
  on public.payments (idempotency_key)
  where idempotency_key is not null;

create unique index if not exists payments_one_active_per_booking_idx
  on public.payments (booking_id)
  where status in ('pending', 'paid');

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_type text not null check (recipient_type in ('ADMIN', 'PARTNER')),
  recipient_id uuid references public.partners (id) on delete cascade,
  location_id uuid references public.locations (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete set null,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_recipient_check check (
    (recipient_type = 'ADMIN' and recipient_id is null)
    or (recipient_type = 'PARTNER' and recipient_id is not null)
  )
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_type, recipient_id, created_at desc);

alter table public.notifications enable row level security;
grant all on table public.notifications to service_role;

create table if not exists public.bag_photos (
  id uuid primary key default gen_random_uuid(),
  bag_id uuid not null references public.bags (id) on delete cascade,
  photo_type text not null check (photo_type in ('FRONT', 'BACK')),
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  unique (bag_id, photo_type)
);

create index if not exists bag_photos_bag_idx
  on public.bag_photos (bag_id);

alter table public.bag_photos enable row level security;
grant all on table public.bag_photos to service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'bag-photos',
  'bag-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.api_rate_limit_windows (
  rate_limit_key text primary key,
  request_count integer not null check (request_count > 0),
  reset_at timestamptz not null
);

create index if not exists api_rate_limit_windows_reset_idx
  on public.api_rate_limit_windows (reset_at);

alter table public.api_rate_limit_windows enable row level security;
grant all on table public.api_rate_limit_windows to service_role;

create or replace function public.consume_api_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  success boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
  v_reset_at timestamptz;
  v_now timestamptz := clock_timestamp();
begin
  if p_key is null or length(p_key) <> 64 or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit parameters.' using errcode = '22023';
  end if;

  insert into public.api_rate_limit_windows as current_window (
    rate_limit_key,
    request_count,
    reset_at
  )
  values (
    p_key,
    1,
    v_now + make_interval(secs => p_window_seconds)
  )
  on conflict (rate_limit_key) do update set
    request_count = case
      when current_window.reset_at <= v_now then 1
      else least(current_window.request_count + 1, p_limit + 1)
    end,
    reset_at = case
      when current_window.reset_at <= v_now
        then v_now + make_interval(secs => p_window_seconds)
      else current_window.reset_at
    end
  returning current_window.request_count, current_window.reset_at
  into v_count, v_reset_at;

  if random() < 0.01 then
    delete from public.api_rate_limit_windows
    where reset_at < v_now - interval '1 day';
  end if;

  return query
    select v_count <= p_limit, greatest(0, p_limit - v_count), v_reset_at;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer)
  to service_role;

create or replace function public.create_booking_with_capacity(
  p_booking_number text,
  p_location_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_dropoff_date date,
  p_dropoff_time time,
  p_pickup_date date,
  p_pickup_time time,
  p_bag_count integer,
  p_price_per_bag numeric,
  p_total_amount numeric,
  p_payment_window_minutes integer
)
returns setof public.bookings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_location public.locations%rowtype;
  v_booking public.bookings%rowtype;
  v_reserved_bags integer;
  v_available_bags integer;
begin
  if p_booking_number is null or length(trim(p_booking_number)) = 0
    or p_bag_count is null or p_bag_count < 1 or p_bag_count > 8
    or p_payment_window_minutes is null or p_payment_window_minutes < 1
    or p_price_per_bag is null or p_price_per_bag <= 0
    or p_total_amount is null or p_total_amount <= 0 then
    raise exception 'INVALID_BOOKING_INPUT' using errcode = '22023';
  end if;

  select *
  into v_location
  from public.locations
  where id = p_location_id
    and active = true
  for update;

  if not found then
    raise exception 'LOCATION_UNAVAILABLE' using errcode = 'P0001';
  end if;

  if p_dropoff_date + p_dropoff_time >= p_pickup_date + p_pickup_time then
    raise exception 'INVALID_BOOKING_INTERVAL' using errcode = 'P0001';
  end if;

  if p_dropoff_date + p_dropoff_time < (now() at time zone 'Asia/Tashkent') then
    raise exception 'DROPOFF_IN_PAST' using errcode = 'P0001';
  end if;

  if p_pickup_date + p_pickup_time - (p_dropoff_date + p_dropoff_time) > interval '24 hours' then
    raise exception 'BOOKING_LIMIT_EXCEEDED' using errcode = 'P0001';
  end if;

  if p_dropoff_time < v_location.opening_time
    or p_dropoff_time > v_location.closing_time
    or p_pickup_time < v_location.opening_time
    or p_pickup_time > v_location.closing_time then
    raise exception 'OUTSIDE_OPENING_HOURS' using errcode = 'P0001';
  end if;

  update public.bookings
  set status = 'EXPIRED'
  where location_id = p_location_id
    and status = 'PENDING_PAYMENT'
    and created_at <= now() - make_interval(mins => p_payment_window_minutes);

  select coalesce(sum(bag_count), 0)::integer
  into v_reserved_bags
  from public.bookings
  where location_id = p_location_id
    and (
      status in ('PAID', 'CHECKED_IN')
      or (
        status = 'PENDING_PAYMENT'
        and created_at > now() - make_interval(mins => p_payment_window_minutes)
      )
    )
    and dropoff_date + dropoff_time < p_pickup_date + p_pickup_time
    and pickup_date + pickup_time > p_dropoff_date + p_dropoff_time;

  v_available_bags := greatest(0, v_location.capacity - v_reserved_bags);

  if p_bag_count > v_available_bags then
    raise exception using
      errcode = 'P0001',
      message = 'BOOKING_CAPACITY_EXCEEDED:' || v_available_bags::text;
  end if;

  insert into public.bookings (
    booking_number,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    location_id,
    dropoff_date,
    pickup_date,
    dropoff_time,
    pickup_time,
    bag_count,
    price_per_bag,
    total_amount,
    currency,
    status
  )
  values (
    p_booking_number,
    null,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_location_id,
    p_dropoff_date,
    p_pickup_date,
    p_dropoff_time,
    p_pickup_time,
    p_bag_count,
    p_price_per_bag,
    p_total_amount,
    'UZS',
    'PENDING_PAYMENT'
  )
  returning * into v_booking;

  insert into public.bags (booking_id, tag_number, status)
  select
    v_booking.id,
    v_booking.booking_number || '-' || lpad(bag_number::text, 2, '0'),
    'PENDING'
  from generate_series(1, p_bag_count) as bag_numbers(bag_number);

  return next v_booking;
end;
$$;

revoke all on function public.create_booking_with_capacity(
  text, uuid, text, text, text, date, time, date, time, integer, numeric, numeric, integer
) from public, anon, authenticated;
grant execute on function public.create_booking_with_capacity(
  text, uuid, text, text, text, date, time, date, time, integer, numeric, numeric, integer
) to service_role;
