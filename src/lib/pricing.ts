/**
 * BagDrop pricing
 *
 * Up to 12 hours -> 40,000 UZS per bag.
 * Longer bookings -> 65,000 UZS per started 24-hour period and bag.
 *
 * The existing booking page still expects:
 * - calculateDays()
 * - calculateTotal(pricePerBagPerDay, bags, dropoffAt, pickupAt)
 *
 * Therefore this file keeps those function shapes compatible
 * while applying the new BagDrop pricing rules.
 */

export const PRICE_UP_TO_12_HOURS = 40000;
export const PRICE_UP_TO_24_HOURS = 65000;

/**
 * Calculate exact storage duration in hours.
 */
export function calculateHours(
  dropoffAt: string,
  pickupAt: string
): number {
  const drop = new Date(dropoffAt).getTime();
  const pick = new Date(pickupAt).getTime();

  if (isNaN(drop) || isNaN(pick) || pick <= drop) {
    return 0;
  }

  return (pick - drop) / (1000 * 60 * 60);
}

/**
 * Keep the old calculateDays() function because
 * the existing booking page still uses it.
 *
 * This is only a display/helper value.
 * Actual price is calculated by the short-stay or 24-hour block rate.
 */
export function calculateDays(
  dropoffAt: string,
  pickupAt: string
): number {
  const hours = calculateHours(dropoffAt, pickupAt);

  if (hours <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(hours / 24));
}

/**
 * Determine which BagDrop pricing tier applies.
 */
export function calculatePricingTier(
  dropoffAt: string,
  pickupAt: string
): {
  tier: 12 | 24;
  pricePerBag: number;
  hours: number;
} {
  const hours = calculateHours(dropoffAt, pickupAt);

  if (hours <= 12) {
    return {
      tier: 12,
      pricePerBag: PRICE_UP_TO_12_HOURS,
      hours,
    };
  }

  const billableDays = Math.ceil(hours / 24);

  return {
    tier: 24,
    pricePerBag: PRICE_UP_TO_24_HOURS * billableDays,
    hours,
  };
}

/**
 * Calculate total booking price.
 *
 * The first argument is kept for compatibility with the
 * existing booking code:
 *
 * calculateTotal(
 *   pricePerBagPerDay,
 *   bags,
 *   dropoffAt,
 *   pickupAt
 * )
 *
 * The old price argument is intentionally NOT used.
 * BagDrop now calculates the price from the actual duration.
 */
export function calculateTotal(
  _pricePerBagPerDay: number,
  bags: number,
  dropoffAt: string,
  pickupAt: string
) {
  const pricing = calculatePricingTier(
    dropoffAt,
    pickupAt
  );

  const days = calculateDays(
    dropoffAt,
    pickupAt
  );

  return {
    days,
    hours: pricing.hours,
    tier: pricing.tier,
    pricePerBag: pricing.pricePerBag,
    total: pricing.pricePerBag * bags,
  };
}