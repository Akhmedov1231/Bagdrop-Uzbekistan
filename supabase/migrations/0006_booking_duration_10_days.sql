-- Extend booking duration to 10 days. Run after 0005_backend_operations.sql.

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

  if p_pickup_date + p_pickup_time - (p_dropoff_date + p_dropoff_time) > interval '240 hours' then
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
