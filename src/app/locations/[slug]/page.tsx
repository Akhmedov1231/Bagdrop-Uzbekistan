"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

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

  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  const [openHour, openMinute] = open
    .split(":")
    .map(Number);

  const [closeHour, closeMinute] = close
    .split(":")
    .map(Number);

  const openingMinutes =
    openHour * 60 + openMinute;

  const closingMinutes =
    closeHour * 60 + closeMinute;

  return (
    currentMinutes >= openingMinutes &&
    currentMinutes <= closingMinutes
  );
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

  const [location, setLocation] =
    useState<ApiLocation | null>(null);

  const [loadingLocation, setLoadingLocation] =
    useState(true);

  const [locationError, setLocationError] =
    useState("");

  const [dropoffDate, setDropoffDate] =
    useState(today);

  const [dropoffTime, setDropoffTime] =
    useState("10:00");

  const [pickupDate, setPickupDate] =
    useState(today);

  const [pickupTime, setPickupTime] =
    useState("18:00");

  const [availability, setAvailability] =
    useState<AvailabilityResult | null>(null);

  const [loadingAvailability, setLoadingAvailability] =
    useState(false);

  const [availabilityError, setAvailabilityError] =
    useState("");

  // --------------------------------------------------
  // LOAD LOCATION
  // --------------------------------------------------

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function loadLocation() {
      try {
        setLoadingLocation(true);
        setLocationError("");

        const response = await fetch(
          "/api/locations",
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(
            result.error ||
              "Failed to load locations."
          );
        }

        const locations =
          Array.isArray(result.locations)
            ? result.locations
            : [];

        const found = locations.find(
          (item: ApiLocation) =>
            item.slug === slug
        );

        if (!found) {
          throw new Error(
            "Location not found."
          );
        }

        if (!cancelled) {
          setLocation(found);
        }
      } catch (error) {
        console.error(
          "Location loading error:",
          error
        );

        if (!cancelled) {
          setLocationError(
            error instanceof Error
              ? error.message
              : t.locationDetail.loadError
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

  // --------------------------------------------------
  // REAL AVAILABILITY
  // --------------------------------------------------

  useEffect(() => {
    if (!location) return;

    const currentLocation = location;

    let cancelled = false;

    async function loadAvailability() {
      try {
        setLoadingAvailability(true);
        setAvailabilityError("");

        const query =
          new URLSearchParams({
            locationId: currentLocation.id,
            dropoffDate,
            dropoffTime,
            pickupDate,
            pickupTime,
          });

        const response = await fetch(
          `/api/locations/availability?${query.toString()}`,
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(
            result.error ||
              "Could not check availability."
          );
        }

        if (!cancelled) {
          setAvailability({
            capacity: Number(
              result.capacity
            ),
            reservedBags: Number(
              result.reservedBags
            ),
            availableBags: Math.max(
              0,
              Number(result.availableBags)
            ),
          });
        }
      } catch (error) {
        console.error(
          "Availability error:",
          error
        );

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
  }, [
    location,
    dropoffDate,
    dropoffTime,
    pickupDate,
    pickupTime,
  ]);

  // --------------------------------------------------
  // LOCATION DATA
  // --------------------------------------------------

  if (loadingLocation) {
    return (
      <main className="min-h-[70vh] bg-[#faf8f3] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-line border-t-teal animate-spin mx-auto" />

          <p className="mt-4 text-sm text-ink-soft">
            {t.locationDetail.loadingLocation}
          </p>
        </div>
      </main>
    );
  }

  if (!location || locationError) {
    return (
      <main className="min-h-[70vh] bg-[#faf8f3] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>

          <h1 className="font-slab font-bold text-2xl mt-4">
            {t.locationDetail.locationNotFound}
          </h1>

          <p className="text-sm text-ink-soft mt-2">
            {locationError ||
              t.locationDetail.locationNotFoundText}
          </p>

          <Link
            href="/locations"
            className="btn-primary inline-flex mt-6"
          >
            ← {t.locationDetail.backToLocations}
          </Link>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // DERIVED VALUES
  // --------------------------------------------------

  const openingTime = formatTime(
    location.opening_time
  );

  const closingTime = formatTime(
    location.closing_time
  );

  const locationOpen = isOpenNow(
    openingTime,
    closingTime
  );

  const dateTimeValid =
    Boolean(dropoffDate) &&
    Boolean(dropoffTime) &&
    Boolean(pickupDate) &&
    Boolean(pickupTime) &&
    new Date(
      `${pickupDate}T${pickupTime}`
    ).getTime() >
      new Date(
        `${dropoffDate}T${dropoffTime}`
      ).getTime();

  const storageHours = dateTimeValid
    ? (new Date(
        `${pickupDate}T${pickupTime}`
      ).getTime() -
        new Date(
          `${dropoffDate}T${dropoffTime}`
        ).getTime()) /
      (1000 * 60 * 60)
    : 0;

  const storagePrice =
    storageHours <= 12
      ? PRICE_UP_TO_12_HOURS
      : PRICE_UP_TO_24_HOURS;

  const storageTier =
    storageHours <= 12
      ? "12h"
      : "24h";

  const withinMaximumStoragePeriod =
    storageHours > 0 && storageHours <= 24;

  const timesWithinOpeningHours =
    isTimeInsideOpeningHours(
      dropoffTime,
      openingTime,
      closingTime
    ) &&
    isTimeInsideOpeningHours(
      pickupTime,
      openingTime,
      closingTime
    );

  const canBook =
    dateTimeValid &&
    withinMaximumStoragePeriod &&
    timesWithinOpeningHours &&
    availability !== null &&
    availability.availableBags > 0 &&
    !loadingAvailability;

  const reservedPercent =
    availability &&
    availability.capacity > 0
      ? Math.min(
          100,
          Math.round(
            (availability.reservedBags /
              availability.capacity) *
              100
          )
        )
      : 0;

  const bookingUrl = (() => {
    const query =
      new URLSearchParams({
        slug: location.slug,
        dropoffDate,
        dropoffTime,
        pickupDate,
        pickupTime,
      });

    return `/book?${query.toString()}`;
  })();

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-[#faf8f3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* BACK */}
        <Link
          href="/locations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-dark hover:underline mb-6"
        >
          ← {t.locationDetail.backToLocations}
        </Link>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-[1.45fr_0.75fr] gap-6 items-start">

          {/* ================================================= */}
          {/* LEFT */}
          {/* ================================================= */}

          <section>

            {/* HERO */}
            <div className="bg-white border border-line rounded-2xl overflow-hidden shadow-sm">

              {/* HERO VISUAL */}
              <div className="h-64 sm:h-80 bg-[#8e5b3d] relative overflow-hidden">

                {/* Decorative shapes */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute -left-24 -top-24 w-96 h-96 rounded-full border-[60px] border-white" />

                  <div className="absolute -right-32 -bottom-40 w-[520px] h-[520px] rounded-full border-[75px] border-white" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-6xl sm:text-7xl">
                      🧳
                    </div>

                    <div className="font-slab font-bold text-2xl mt-2">
                      BagDrop
                    </div>

                    <div className="text-sm opacity-90 mt-1">
                      {location.name}
                    </div>
                  </div>
                </div>

                {/* OPEN STATUS */}
                <div className="absolute left-4 top-4">
                  <span className="inline-flex items-center gap-2 bg-white rounded-full px-3 py-2 text-xs font-bold shadow-sm">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        locationOpen
                          ? "bg-teal"
                          : "bg-red-500"
                      }`}
                    />

                    <span
                      className={
                        locationOpen
                          ? "text-teal-dark"
                          : "text-red-600"
                      }
                    >
                      {locationOpen
                        ? t.locationDetail.openNow
                        : t.locationDetail.closedNow}
                    </span>
                  </span>
                </div>

                {/* VERIFIED */}
                <div className="absolute right-4 top-4">
                  <span className="inline-flex items-center gap-1.5 bg-white rounded-full px-3 py-2 text-xs font-semibold shadow-sm">
                    ✓ {t.locationDetail.verifiedPartner}
                  </span>
                </div>
              </div>

              {/* CONTENT */}
              <div className="p-5 sm:p-7">

                {/* TITLE ROW */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">

                  <div>
                    <div className="text-xs uppercase tracking-wider font-bold text-teal-dark">
                      {location.city}
                    </div>

                    <h1 className="font-slab font-bold text-2xl sm:text-3xl text-ink mt-1">
                      {location.name}
                    </h1>

                    <p className="text-sm text-ink-soft mt-2">
                      📍 {location.address}
                    </p>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <div className="text-xs text-ink-soft">
                      {t.locationDetail.from}
                    </div>

                    <div className="font-slab font-bold text-xl">
                      {formatMoney(
                        PRICE_UP_TO_12_HOURS
                      )}
                    </div>

                    <div className="text-xs text-ink-soft">
                      {t.locationDetail.upTo12Hours}
                    </div>

                    <div className="text-sm font-semibold text-ink mt-1">
                      {formatMoney(
                        PRICE_UP_TO_24_HOURS
                      )}{" "}
                      <span className="text-xs font-normal text-ink-soft">
                        / {t.locationDetail.hours24}
                      </span>
                    </div>
                  </div>

                </div>

                {/* DESCRIPTION */}
                <p className="text-sm leading-6 text-ink-soft mt-6 max-w-2xl">
                  {location.description ||
                    t.locationDetail.defaultDescription.replace(
                      "{name}",
                      location.name
                    )}
                </p>

                {/* QUICK STATS */}
                <div className="grid sm:grid-cols-3 gap-3 mt-6">

                  <InfoCard
                    icon="🕐"
                    label={t.locationDetail.openingHours}
                    value={`${openingTime}–${closingTime}`}
                  />

                  <InfoCard
                    icon="🧳"
                    label={t.locationDetail.totalCapacity}
                    value={`${location.capacity} ${t.locationDetail.bags}`}
                  />

                  <div className="border border-line rounded-xl p-4 bg-[#fffdfa]">
                    <div className="flex items-center gap-2">
                      <span className="text-base">💳</span>

                      <span className="text-[11px] text-ink-soft">
                        {t.locationDetail.price}
                      </span>
                    </div>

                    <div className="font-semibold text-sm mt-2">
                      {formatMoney(PRICE_UP_TO_12_HOURS)}
                      <span className="text-[11px] text-ink-soft font-normal">
                        {" "}· {t.locationDetail.upTo12HoursShort}
                      </span>
                    </div>

                    <div className="font-semibold text-sm mt-1">
                      {formatMoney(PRICE_UP_TO_24_HOURS)}
                      <span className="text-[11px] text-ink-soft font-normal">
                        {" "}· {t.locationDetail.upTo24HoursShort}
                      </span>
                    </div>
                  </div>

                </div>

                {/* MAP BUTTONS */}
                {(location.google_maps_url ||
                  location.yandex_maps_url) && (
                  <div className="mt-6 pt-5 border-t border-line">

                    <div className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">
                      {t.locationDetail.findUs}
                    </div>

                    <div className="flex flex-wrap gap-3">

                      {location.google_maps_url && (
                        <a
                          href={
                            location.google_maps_url
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal text-teal-dark text-sm font-bold hover:bg-teal/5 transition"
                        >
                          <span>📍</span>
                          Google Maps
                        </a>
                      )}

                      {location.yandex_maps_url && (
                        <a
                          href={
                            location.yandex_maps_url
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal text-teal-dark text-sm font-bold hover:bg-teal/5 transition"
                        >
                          <span>📍</span>
                          Yandex Maps
                        </a>
                      )}

                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* HOW IT WORKS */}
            <div className="mt-6">

              <h2 className="font-slab font-bold text-xl mb-4">
                {t.locationDetail.howItWorks}
              </h2>

              <div className="grid sm:grid-cols-3 gap-4">

                <FeatureCard
                  number="1"
                  icon="📱"
                  title={t.locationDetail.bookOnline}
                  text={t.locationDetail.bookOnlineText}
                />

                <FeatureCard
                  number="2"
                  icon="🧳"
                  title={t.locationDetail.dropBags}
                  text={t.locationDetail.dropBagsText}
                />

                <FeatureCard
                  number="3"
                  icon="🗺️"
                  title={t.locationDetail.exploreFreely}
                  text={t.locationDetail.exploreFreelyText}
                />

              </div>
            </div>

          </section>

          {/* ================================================= */}
          {/* RIGHT BOOKING CARD */}
          {/* ================================================= */}

          <aside className="lg:sticky lg:top-5">

            <div className="bg-white border border-line rounded-2xl shadow-md overflow-hidden">

              {/* HEADER */}
              <div className="p-5 border-b border-line">

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <h2 className="font-slab font-bold text-xl">
                      {t.locationDetail.bookThisLocation}
                    </h2>

                    <p className="text-xs text-ink-soft mt-1">
                      {t.locationDetail.selectStoragePeriod}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-slab font-bold text-lg">
                      {formatMoney(storagePrice)}
                    </div>

                    <div className="text-[10px] text-ink-soft">
                      {dateTimeValid
                        ? `per bag / ${storageTier}`
                        : t.locationDetail.perBag}
                    </div>

                    <div className="text-[10px] text-ink-soft mt-1">
                      {t.locationDetail.priceSummary}
                    </div>
                  </div>

                </div>

              </div>

              {/* FORM */}
              <div className="p-5">

                {/* DROP-OFF */}
                <div>
                  <div className="text-xs font-bold text-ink mb-2">
                    {t.locationDetail.dropOff}
                  </div>

                  <div className="grid grid-cols-2 gap-3">

                    <Field label={t.locationDetail.date}>
                      <input
                        type="date"
                        min={today}
                        value={dropoffDate}
                        onChange={(event) => {
                          const value =
                            event.target.value;

                          setDropoffDate(value);

                          if (
                            pickupDate < value
                          ) {
                            setPickupDate(value);
                          }
                        }}
                        className="input"
                      />
                    </Field>

                    <Field label={t.locationDetail.time}>
                      <input
                        type="time"
                        value={dropoffTime}
                        onChange={(event) =>
                          setDropoffTime(
                            event.target.value
                          )
                        }
                        className="input"
                      />
                    </Field>

                  </div>
                </div>

                {/* PICKUP */}
                <div className="mt-5">
                  <div className="text-xs font-bold text-ink mb-2">
                    {t.locationDetail.pickup}
                  </div>

                  <div className="grid grid-cols-2 gap-3">

                    <Field label={t.locationDetail.date}>
                      <input
                        type="date"
                        min={dropoffDate}
                        value={pickupDate}
                        onChange={(event) =>
                          setPickupDate(
                            event.target.value
                          )
                        }
                        className="input"
                      />
                    </Field>

                    <Field label={t.locationDetail.time}>
                      <input
                        type="time"
                        value={pickupTime}
                        onChange={(event) =>
                          setPickupTime(
                            event.target.value
                          )
                        }
                        className="input"
                      />
                    </Field>

                  </div>
                </div>

                {/* OPENING HOURS */}
                <div className="mt-4 rounded-xl bg-sand p-3.5">

                  <div className="flex items-center gap-2">
                    <span>🕐</span>

                    <div>
                      <div className="text-xs font-bold">
                        {t.locationDetail.openingHours}
                      </div>

                      <div className="text-xs text-ink-soft mt-0.5">
                        {openingTime}–{closingTime}
                      </div>
                    </div>
                  </div>

                </div>

                {/* AVAILABILITY */}
                <div className="mt-4 rounded-xl border border-line p-4">

                  <div className="flex items-center justify-between">

                    <div>
                      <div className="text-xs text-ink-soft">
                        {t.locationDetail.availableForYourTime}
                      </div>

                      <div className="font-slab font-bold text-2xl mt-1">
                        {loadingAvailability
                          ? t.locationDetail.checking
                          : availability
                          ? `${availability.availableBags} ${t.locationDetail.bags}`
                          : "—"}
                      </div>
                    </div>

                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                        loadingAvailability
                          ? "bg-sand"
                          : availability &&
                            availability.availableBags > 0
                          ? "bg-teal/10 text-teal-dark"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {loadingAvailability
                        ? "…"
                        : availability &&
                          availability.availableBags > 0
                        ? "✓"
                        : "!"}
                    </div>

                  </div>

                  {/* CAPACITY BAR */}
                  {availability && (
                    <div className="mt-4">

                      <div className="flex items-center justify-between text-[11px] text-ink-soft mb-2">
                        <span>
                          {availability.reservedBags} {t.locationDetail.reserved}
                        </span>

                        <span>
                          {availability.capacity} {t.locationDetail.total}
                        </span>
                      </div>

                      <div className="h-2.5 rounded-full bg-sand overflow-hidden">

                        <div
                          className="h-full rounded-full bg-teal transition-all duration-300"
                          style={{
                            width: `${reservedPercent}%`,
                          }}
                        />

                      </div>

                      <div className="text-[11px] text-ink-soft mt-2">
                        {availability.availableBags > 0
                          ? t.locationDetail.spacesAvailable
                          : t.locationDetail.noSpace}
                      </div>

                    </div>
                  )}

                  {availabilityError && (
                    <div className="mt-3 rounded-lg bg-red-50 text-red-600 text-xs p-3">
                      {availabilityError}
                    </div>
                  )}

                </div>

                {/* VALIDATION */}
                {!dateTimeValid && (
                  <div className="mt-4 rounded-lg bg-red-50 text-red-600 text-xs p-3">
                    {t.locationDetail.pickupAfterDropoff}
                  </div>
                )}

                {dateTimeValid &&
                  !withinMaximumStoragePeriod && (
                    <div className="mt-4 rounded-lg bg-red-50 text-red-600 text-xs p-3">
                      {t.locationDetail.max24Hours}
                    </div>
                )}

                {dateTimeValid &&
                  withinMaximumStoragePeriod &&
                  !timesWithinOpeningHours && (
                    <div className="mt-4 rounded-lg bg-red-50 text-red-600 text-xs p-3">
                      {t.locationDetail.withinOpeningHours}
                    </div>
                  )}

                {/* BOOK BUTTON */}
                <Link
                  href={canBook ? bookingUrl : "#"}
                  aria-disabled={!canBook}
                  className={`w-full mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-bold transition ${
                    canBook
                      ? "bg-teal text-white hover:bg-teal-dark shadow-sm"
                      : "bg-line text-ink-soft pointer-events-none"
                  }`}
                >
                  {t.locationDetail.bookThisLocation}
                  <span className="text-base">
                    →
                  </span>
                </Link>

                <p className="text-[11px] text-center text-ink-soft mt-3 leading-4">
                  {t.locationDetail.nextStep}
                </p>

              </div>
            </div>

            {/* TRUST BOX */}
            <div className="mt-4 bg-white border border-line rounded-2xl p-4">

              <div className="flex gap-3">

                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center text-teal-dark shrink-0">
                  ✓
                </div>

                <div>
                  <div className="font-bold text-sm">
                    {t.locationDetail.verifiedSimple}
                  </div>

                  <p className="text-xs text-ink-soft leading-5 mt-1">
                    {t.locationDetail.verifiedSimpleText}
                  </p>
                </div>

              </div>

            </div>

          </aside>
        </div>
      </div>
    </main>
  );
}

// ======================================================
// SMALL COMPONENTS
// ======================================================

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold text-ink-soft mb-1.5">
        {label}
      </span>

      {children}
    </label>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-line rounded-xl p-4 bg-[#fffdfa]">

      <div className="flex items-center gap-2">
        <span className="text-base">
          {icon}
        </span>

        <span className="text-[11px] text-ink-soft">
          {label}
        </span>
      </div>

      <div className="font-semibold text-sm mt-2">
        {value}
      </div>

    </div>
  );
}

function FeatureCard({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-white border border-line rounded-2xl p-5">

      <div className="flex items-center justify-between">

        <div className="w-10 h-10 rounded-xl bg-sand flex items-center justify-center text-lg">
          {icon}
        </div>

        <div className="text-xs font-bold text-ink-soft">
          0{number}
        </div>

      </div>

      <h3 className="font-slab font-bold mt-4">
        {title}
      </h3>

      <p className="text-sm text-ink-soft leading-5 mt-1.5">
        {text}
      </p>

    </div>
  );
}