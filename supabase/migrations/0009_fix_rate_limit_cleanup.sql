-- consume_api_rate_limit failed on about 1 call in 100 with
--
--     42702: column reference "reset_at" is ambiguous
--
-- Its RETURNS TABLE declares an output column named reset_at, which is also a
-- variable inside the function body, and the random() < 0.01 cleanup branch
-- used the bare name in its WHERE clause. PL/pgSQL refuses to guess, the whole
-- call errors, and the request it was guarding (/api/bookings,
-- /api/payments/create, /api/bookings/email, /api/partner-requests) answered
-- 500. The same error rolled the cleanup back every time, so expired windows
-- were never deleted either.
--
-- Identical to 0005_backend_operations.sql except that the DELETE qualifies
-- its column through a table alias.

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
    delete from public.api_rate_limit_windows as stale_window
    where stale_window.reset_at < v_now - interval '1 day';
  end if;

  return query
    select v_count <= p_limit, greatest(0, p_limit - v_count), v_reset_at;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer)
  to service_role;
