// Central place for brand + business configuration.
// Change these values to rebrand the whole app without touching components.

export const BRAND = {
  name: "BagDrop",
  tagline: "Leave your bags. Explore freely.",
  currency: "UZS",
  defaultCity: "samarkand",
  cityLabel: "Samarkand",
  supportEmail: "hello@bagdrop.uz",
  supportPhone: "+998 90 000 00 00",
  supportTelegram: "https://t.me/bagdrop_support",
  social: {
    instagram: "https://instagram.com/bagdrop.uz",
  },
};

export const BOOKING_CONFIG = {
  // How many minutes an unpaid booking holds its capacity before expiring.
  paymentWindowMinutes: 30,
  maxBookingDays: 10,
  // Absolute fallback max, per-location maxBagsPerBooking can be lower.
  hardMaxBagsPerBooking: 10,
  // Current USD to UZS rate reference for foreign tourists
  usdRate: 12850,
  // TEMPORARY, for end-to-end testing while no payment provider is connected.
  // Until this moment, a booking made in a browser that is signed in as the
  // admin or as a partner is marked PAID at once (with a "dev_simulator"
  // payment), so its QR code appears and can be scanned in the partner portal.
  // Customers are not affected. After this moment the code path does nothing;
  // remove it (api/bookings/route.ts, markTestPaidForStaff) once Click/Payme
  // is connected.
  testPaymentsUntil: "2026-10-01T00:00:00+05:00",
};

