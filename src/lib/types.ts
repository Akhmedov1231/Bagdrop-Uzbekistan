export type BookingStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CHECKED_IN"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export interface LocationHours {
  open: string; // "08:00"
  close: string; // "22:00"
}

export interface Location {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  distanceLabel: string; // human label, e.g. "300m from Registan"
  description: string;
  pricePerBagPerDay: number;
  currency: string;
  capacity: number;
  availableBags: number; // demo-only static availability
  maxBagsPerBooking: number;
  hours: LocationHours;
  amenities: string[]; // only true, configured features
  lat: number;
  lng: number;
  googleMapsUrl: string;
  yandexMapsUrl: string;
  partnerName: string;
  color: string; // demo accent color used instead of a real photo
  isDemo: boolean; // all seed data is mock until real partners are added
  active: boolean;
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  telegram?: string;
}

export interface Booking {
  id: string;
  bookingNumber: string; // e.g. SAM-20260910-48291
  qrToken: string;
  locationId: string;
  locationName: string;
  locationSlug: string;
  dropoffAt: string; // ISO
  pickupAt: string; // ISO
  bags: number;
  pricePerBag: number;
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  customer: CustomerDetails;
  createdAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  bagTags?: string[];
}
