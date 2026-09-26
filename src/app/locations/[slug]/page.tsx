"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import {
  Luggage,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Info,
} from "lucide-react";

type ApiLocation = {
  id: string;
  partner_id: string;
  city: string;
  name: string;
  slug: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string | null;
  price_per_bag: number;
  capacity: number;
  opening_time: string;
  closing_time: string;
  active: boolean;
  google_maps_url: string | null;
  yandex_maps_url: string | null;
};

type AvailabilityResult = {
  capacity: number;
  reservedBags: number;
  availableBags: number;
};

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString()} UZS`;
}

const PRICE_UP_TO_12_HOURS = 40000;
const PRICE_UP_TO_24_HOURS = 65000;

function formatTime(value: string) {
  return String(value ?? "").slice(0, 5);
}

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isOpenNow(open: string, close: string) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openHour, openMinute] = open.split(":").map(Number);
  const [closeHour, closeMinute] = close.split(":").map(Number);

  const openingMinutes = openHour * 60 + openMinute;
  const closingMinutes = closeHour * 60 + closeMinute;

  return currentMinutes >= openingMinutes && currentMinutes <= closingMinutes;
}

function isTimeInsideOpeningHours(
  time: string,
  opening: string,
  closing: string
) {
  if (!time) return false;
  const value = Number(time.replace(":", ""));
  const open = Number(opening.replace(":", ""));
  const close = Number(closing.replace(":", ""));
  return value >= open && value <= close;
}

export default function LocationDetailPage() {
  const params = useParams();
  const { t } = useLanguage();

  const slug = String(params.slug ?? "");
  const today = useMemo(() => getToday(), []);

  const [location, setLocation] = useState<ApiLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState("");

  const [dropoffDate, setDropoffDate] = useState(today);
  const [dropoffTime, setDropoffTime] = useState("10:00");
  const [pickupDate, setPickupDate] = useState(today);
  const [pickupTime, setPickupTime] = useState("18:00");

  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  // Load location details
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function loadLocation() {
      try {
        setLoadingLocation(true);
        setLocationError("");

        const response = await fetch("/api/locations", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to load locations.");
        }

        const locations = Array.isArray(result.locations) ? result.locations : [];
        const found = locations.find((item: ApiLocation) => item.slug === slug);

        if (!found) {
          throw new Error("Location not found.");
        }

        if (!cancelled) {
          setLocation(found);
        }
      } catch (error) {
        console.error("Location loading error:", error);
        if (!cancelled) {
          setLocationError(
            error instanceof Error ? error.message : t.locationDetail.loadError
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingLocation(false);
        }
      }
    }

    loadLocation();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Load availability
  useEffect(() => {
    if (!location) return;
    const currentLocation = location;
    let cancelled = false;

    async function loadAvailability() {
      try {
        setLoadingAvailability(true);
        setAvailabilityError("");

        const query = new URLSearchParams({
          locationId: currentLocation.id,
          dropoffDate,
          dropoffTime,
          pickupDate,
          pickupTime,
        });

        const response = await fetch(
          `/api/locations/availability?${query.toString()}`,
          { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Could not check availability.");
        }

        if (!cancelled) {
          setAvailability({
            capacity: Number(result.capacity),
            reservedBags: Number(result.reservedBags),
            availableBags: Math.max(0, Number(result.availableBags)),
          });
        }
      } catch (error) {
        console.error("Availability error:", error);
        if (!cancelled) {
          setAvailability(null);
          setAvailabilityError(
            error instanceof Error
              ? error.message
              : t.locationDetail.availabilityError
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingAvailability(false);
        }
      }
    }

    loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [location, dropoffDate, dropoffTime, pickupDate, pickupTime]);

  if (loadingLocation) {
    return (
      <main className="min-h-[70vh] bg-cream flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border-2 border-brand-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-semibold text-ink-soft">
            {t.locationDetail.loadingLocation}
          </p>
        </div>
      </main>
    );
  }

  if (!location || locationError) {
    return (
      <main className="min-h-[70vh] bg-cream flex items-center justify-center px-6">
        <div className="text-center max-w-md bg-white border border-line rounded-3xl p-8 shadow-card-modern">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl mb-4">
            ⚠️
          </div>
          <h1 className="font-display font-bold text-2xl text-ink">
            {t.locationDetail.locationNotFound}
          </h1>
          <p className="text-sm text-ink-soft mt-2">
            {locationError || t.locationDetail.locationNotFoundText}
          </p>
          <Link
            href="/locations"
            className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold px-6 py-3 rounded-2xl shadow-glow-brand"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.locationDetail.backToLocations}</span>
          </Link>
        </div>
      </main>
    );
  }

  const openingTime = formatTime(location.opening_time);
  const closingTime = formatTime(location.closing_time);
  const locationOpen = isOpenNow(openingTime, closingTime);

  const dateTimeValid =
    Boolean(dropoffDate) &&
    Boolean(dropoffTime) &&
    Boolean(pickupDate) &&
    Boolean(pickupTime) &&
    new Date(`${pickupDate}T${pickupTime}`).getTime() >
      new Date(`${dropoffDate}T${dropoffTime}`).getTime();

  const storageHours = dateTimeValid
    ? (new Date(`${pickupDate}T${pickupTime}`).getTime() -
        new Date(`${dropoffDate}T${dropoffTime}`).getTime()) /
      (1000 * 60 * 60)
    : 0;

  const storagePrice =
    storageHours <= 12 ? PRICE_UP_TO_12_HOURS : PRICE_UP_TO_24_HOURS;

  const storageTier = storageHours <= 12 ? "12h" : "24h";
  const withinMaximumStoragePeriod = storageHours > 0 && storageHours <= 24;

  const timesWithinOpeningHours =
    isTimeInsideOpeningHours(dropoffTime, openingTime, closingTime) &&
    isTimeInsideOpeningHours(pickupTime, openingTime, closingTime);

  const canBook =
    dateTimeValid &&
    withinMaximumStoragePeriod &&
    timesWithinOpeningHours &&
    availability !== null &&
    availability.availableBags > 0 &&
    !loadingAvailability;

  const reservedPercent =
    availability && availability.capacity > 0
      ? Math.min(
          100,
          Math.round((availability.reservedBags / availability.capacity) * 100)
        )
      : 0;

  const bookingUrl = (() => {
    const query = new URLSearchParams({
      slug: location.slug,
      dropoffDate,
      dropoffTime,
      pickupDate,
      pickupTime,
    });
    return `/book?${query.toString()}`;
  })();

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Back Link Breadcrumb */}
        <Link
          href="/locations"
          className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3.5 py-1.5 rounded-full border border-brand-200/60 mb-6 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.locationDetail.backToLocations}</span>
        </Link>

        {/* MAIN LAYOUT */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: LOCATION INFO */}
          <section className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-line rounded-3xl overflow-hidden shadow-card-modern">
              
              {/* Visual Banner */}
              <div className="h-64 sm:h-80 bg-gradient-to-tr from-brand-700 via-brand-600 to-amber-500 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-radial-gradient from-white/20 to-transparent pointer-events-none" />
                
                <div className="relative text-center text-white z-10 space-y-2">
                  <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mx-auto shadow-2xl">
                    <Luggage className="w-10 h-10 text-white stroke-[2.2]" />
                  </div>
                  <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                    {location.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-brand-100 font-medium">
                    Verified Safe Left-Luggage Point • {location.city}
                  </p>
                </div>

                {/* Open Status Badge */}
                <div className="absolute left-5 top-5 z-20">
                  <span className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-full px-3.5 py-1.5 text-xs font-bold shadow-sm">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        locationOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                      }`}
                    />
                    <span className={locationOpen ? "text-emerald-700" : "text-rose-600"}>
                      {locationOpen ? t.locationDetail.openNow : t.locationDetail.closedNow}
                    </span>
                  </span>
                </div>

                {/* Verified Badge */}
                <div className="absolute right-5 top-5 z-20">
                  <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md rounded-full px-3.5 py-1.5 text-xs font-bold shadow-sm text-ink">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>{t.locationDetail.verifiedPartner}</span>
                  </span>
                </div>
              </div>

              {/* Detail Content */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-line">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-600 block">
                      {location.city}, Uzbekistan
                    </span>
                    <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-1">
                      {location.name}
                    </h1>
                    <p className="flex items-center gap-1.5 text-xs sm:text-sm text-ink-soft mt-2 font-medium">
                      <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                      <span>{location.address}</span>
                    </p>
                  </div>

                  <div className="sm:text-right shrink-0 bg-brand-50/70 border border-brand-200/60 rounded-2xl p-4">
                    <span className="text-[10px] uppercase font-bold text-brand-700 tracking-wider block">
                      {t.locationDetail.from}
                    </span>
                    <div className="font-display font-extrabold text-2xl text-ink">
                      {formatMoney(PRICE_UP_TO_12_HOURS)}
                    </div>
                    <span className="text-xs text-ink-soft font-medium">
                      {t.locationDetail.upTo12Hours}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-display font-bold text-base text-ink mb-2">
                    About this luggage point
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    {location.description ||
                      t.locationDetail.defaultDescription.replace(
                        "{name}",
                        location.name
                      )}
                  </p>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-brand-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase">{t.locationDetail.openingHours}</span>
                    </div>
                    <span className="font-display font-bold text-sm text-ink">
                      {openingTime} – {closingTime}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-teal-600 mb-1">
                      <Luggage className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase">{t.locationDetail.totalCapacity}</span>
                    </div>
                    <span className="font-display font-bold text-sm text-ink">
                      {location.capacity} {t.locationDetail.bags}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase">Insurance</span>
                    </div>
                    <span className="font-display font-bold text-sm text-ink">
                      $500 Guarantee
                    </span>
                  </div>
                </div>

                {/* Map Directions Links */}
                {(location.google_maps_url || location.yandex_maps_url) && (
                  <div className="pt-4 border-t border-line">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                      {t.locationDetail.findUs}
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {location.google_maps_url && (
                        <a
                          href={location.google_maps_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-brand-500 text-ink text-xs font-bold shadow-2xs hover:shadow-sm transition-all"
                        >
                          <MapPin className="w-4 h-4 text-brand-500" />
                          <span>Google Maps</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </a>
                      )}
                      {location.yandex_maps_url && (
                        <a
                          href={location.yandex_maps_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-brand-500 text-ink text-xs font-bold shadow-2xs hover:shadow-sm transition-all"
                        >
                          <MapPin className="w-4 h-4 text-amber-500" />
                          <span>Yandex Maps</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* How it works cards */}
            <div className="space-y-4">
              <h3 className="font-display font-extrabold text-xl text-ink">
                {t.locationDetail.howItWorks}
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { num: "01", icon: Calendar, title: t.locationDetail.bookOnline, text: t.locationDetail.bookOnlineText },
                  { num: "02", icon: Luggage, title: t.locationDetail.dropBags, text: t.locationDetail.dropBagsText },
                  { num: "03", icon: Sparkles, title: t.locationDetail.exploreFreely, text: t.locationDetail.exploreFreelyText },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.num} className="bg-white border border-line rounded-3xl p-5 shadow-card-modern">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-display font-bold text-xs text-slate-400">{s.num}</span>
                      </div>
                      <h4 className="font-display font-bold text-sm text-ink">{s.title}</h4>
                      <p className="text-xs text-ink-soft mt-1 leading-relaxed">{s.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* RIGHT: STICKY BOOKING CALCULATOR WIDGET */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white border border-line rounded-3xl shadow-card-modern overflow-hidden">
              
              {/* Header */}
              <div className="p-6 border-b border-line bg-slate-50/60 flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-ink">
                    {t.locationDetail.bookThisLocation}
                  </h3>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {t.locationDetail.selectStoragePeriod}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-display font-black text-xl text-brand-600">
                    {formatMoney(storagePrice)}
                  </span>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    per bag / {storageTier}
                  </span>
                </div>
              </div>

              {/* Interactive Date/Time Form */}
              <div className="p-6 space-y-5">
                {/* Drop-off Date & Time */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-2">
                    {t.locationDetail.dropOff}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      min={today}
                      value={dropoffDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDropoffDate(val);
                        if (pickupDate < val) setPickupDate(val);
                      }}
                      className="admin-input text-xs font-semibold"
                    />
                    <input
                      type="time"
                      value={dropoffTime}
                      onChange={(e) => setDropoffTime(e.target.value)}
                      className="admin-input text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Pickup Date & Time */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-2">
                    {t.locationDetail.pickup}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      min={dropoffDate}
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="admin-input text-xs font-semibold"
                    />
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="admin-input text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Live Availability Gauge */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-medium">
                        {t.locationDetail.availableForYourTime}
                      </span>
                      <div className="font-display font-extrabold text-xl text-ink mt-0.5">
                        {loadingAvailability
                          ? t.locationDetail.checking
                          : availability
                          ? `${availability.availableBags} ${t.locationDetail.bags}`
                          : "—"}
                      </div>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                        loadingAvailability
                          ? "bg-slate-200"
                          : availability && availability.availableBags > 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {loadingAvailability ? "…" : availability && availability.availableBags > 0 ? "✓" : "!"}
                    </div>
                  </div>

                  {availability && (
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span>{availability.reservedBags} {t.locationDetail.reserved}</span>
                        <span>{availability.capacity} {t.locationDetail.total}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${reservedPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {availabilityError && (
                    <div className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{availabilityError}</span>
                    </div>
                  )}
                </div>

                {/* Validation warnings */}
                {!dateTimeValid && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{t.locationDetail.pickupAfterDropoff}</span>
                  </div>
                )}

                {dateTimeValid && !withinMaximumStoragePeriod && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{t.locationDetail.max24Hours}</span>
                  </div>
                )}

                {dateTimeValid && withinMaximumStoragePeriod && !timesWithinOpeningHours && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{t.locationDetail.withinOpeningHours}</span>
                  </div>
                )}

                {/* CTA Button */}
                <Link
                  href={canBook ? bookingUrl : "#"}
                  aria-disabled={!canBook}
                  className={`w-full flex items-center justify-center gap-2 font-bold py-4 px-6 rounded-2xl text-sm transition-all duration-200 ${
                    canBook
                      ? "bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-glow-brand active:scale-95"
                      : "bg-slate-200 text-slate-400 pointer-events-none"
                  }`}
                >
                  <span>{t.locationDetail.bookThisLocation}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <p className="text-[11px] text-center text-slate-400">
                  {t.locationDetail.nextStep}
                </p>
              </div>
            </div>

            {/* Trust box */}
            <div className="bg-white border border-line rounded-3xl p-5 flex items-center gap-3.5 shadow-card-modern">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-ink">
                  {t.locationDetail.verifiedSimple}
                </h4>
                <p className="text-[11px] text-ink-soft leading-snug mt-0.5">
                  {t.locationDetail.verifiedSimpleText}
                </p>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}