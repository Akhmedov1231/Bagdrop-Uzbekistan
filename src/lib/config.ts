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
  // Absolute fallback max, per-location maxBagsPerBooking can be lower.
  hardMaxBagsPerBooking: 10,
};
