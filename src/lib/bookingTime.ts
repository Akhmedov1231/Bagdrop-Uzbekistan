/**
 * Booking times are wall-clock times in Asia/Tashkent. Uzbekistan has used a
 * fixed UTC+05:00 offset with no DST since 1992, and the server already relies
 * on that: /api/bookings builds `${date}T${time}:00+05:00` and the RPC compares
 * against `now() at time zone 'Asia/Tashkent'`. The browser must do the same,
 * otherwise "today", "in the past" and durations depend on the visitor's own
 * timezone and DST rules.
 */
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const BOOKING_TZ_SUFFIX = "+05:00";

/** Absolute instant (ms) of a Tashkent wall-clock date + "HH:MM" time. NaN if invalid. */
export function bookingInstant(date: string, time: string): number {
  return new Date(`${date}T${time}:00${BOOKING_TZ_SUFFIX}`).getTime();
}

/** Tashkent wall-clock date ("YYYY-MM-DD") and time ("HH:MM") of an instant. */
export function tashkentParts(ms: number = Date.now()): { date: string; time: string } {
  const iso = new Date(ms + TASHKENT_OFFSET_MS).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

/** "HH:MM" strings compare correctly as strings; mirrors route.ts opening-hours check. */
export function isWithinHours(time: string, open: string, close: string): boolean {
  return Boolean(time) && time >= open && time <= close;
}

/** Mirrors the RPC's DROPOFF_IN_PAST rule (drop-off < now in Tashkent). */
export function isDropoffInPast(date: string, time: string, now: number = Date.now()): boolean {
  const ms = bookingInstant(date, time);
  return !Number.isFinite(ms) || ms < now;
}

/** The Tashkent calendar day after `date` ("YYYY-MM-DD"). */
function nextDate(date: string): string {
  return tashkentParts(bookingInstant(date, "12:00") + DAY_MS).date;
}

/**
 * Sensible defaults the server will accept: the next quarter hour at least 15
 * minutes from now (time to fill in the wizard), moved into opening hours —
 * tomorrow's opening time once less than an hour of today is left. Pickup is
 * 8 hours later (like the old 10:00 -> 18:00), or closing time when that falls
 * outside opening hours, or the same time tomorrow when that leaves under an
 * hour.
 */
export function defaultSchedule(open: string, close: string, now: number = Date.now()) {
  const SLOT_MS = 15 * 60 * 1000;
  const BUFFER_MS = 15 * 60 * 1000;

  const lastDropTime = tashkentParts(bookingInstant("2000-01-01", close) - HOUR_MS).time;
  const latestDrop = lastDropTime < open ? open : lastDropTime;

  let drop = tashkentParts(Math.ceil((now + BUFFER_MS) / SLOT_MS) * SLOT_MS);
  if (drop.time < open) {
    drop = { date: drop.date, time: open };
  } else if (drop.time > latestDrop) {
    drop = { date: nextDate(drop.date), time: open };
  }

  const dropMs = bookingInstant(drop.date, drop.time);
  let pick = tashkentParts(dropMs + 8 * HOUR_MS);
  if (!isWithinHours(pick.time, open, close)) {
    pick = { date: drop.date, time: close };
  }
  if (bookingInstant(pick.date, pick.time) - dropMs < HOUR_MS) {
    pick = tashkentParts(dropMs + DAY_MS);
  }

  return { dropDate: drop.date, dropTime: drop.time, pickDate: pick.date, pickTime: pick.time };
}
