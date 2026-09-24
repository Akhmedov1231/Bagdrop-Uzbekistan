"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import MapSection from "@/components/MapSection";
import DemoBadge from "@/components/DemoBadge";
import { LocationCardSkeleton, MapSkeleton, Skeleton } from "@/components/Skeleton";
import { Location } from "@/lib/types";
import { LOCATIONS } from "@/lib/mockData";
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
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function LocationsInner() {
  const { t } = useLanguage();

  const CITY_OPTIONS = [
    "Samarkand",
    "Tashkent",
    "Bukhara",
    "Khiva",
  ];

  const [selectedCity, setSelectedCity] =
    useState("Samarkand");

  const cityLabels: Record<string, string> = {
    Tashkent: t.locationsPage.tashkent,
    Samarkand: t.locationsPage.samarkand,
    Bukhara: t.locationsPage.bukhara,
    Khiva: t.locationsPage.khiva,
  };

  const [locations, setLocations] =
    useState<Location[]>(LOCATIONS);

  const [availability, setAvailability] =
    useState<Record<string, number>>(() => {
      const initial: Record<string, number> = {};
      LOCATIONS.forEach((l) => {
        initial[l.id] = l.availableBags;
      });
      return initial;
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loadingAvailability, setLoadingAvailability] =
    useState(false);

  const [dropoffDate] =
    useState(getToday);

  const [pickupDate] =
    useState(getToday);

  const [dropoffTime] =
    useState("10:00");

  const [pickupTime] =
    useState("18:00");

  // ==================================================
  // LOAD LOCATIONS
  // ==================================================

  useEffect(() => {
    let cancelled = false;

    async function loadLocations() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/locations",
          {
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.ok
        ) {
          throw new Error(
            result.error ||
              "Failed to load locations."
          );
        }

        if (cancelled) {
          return;
        }

        const apiLocations =
          (result.locations ??
            []) as ApiLocation[];

        const mapped: Location[] =
          apiLocations
            .filter(
              (location) =>
                location.active
            )
            .map(
              (
                location,
                index
              ) => ({
                id: location.id,

                slug: location.slug,

                name: location.name,

                city: location.city,

                address:
                  location.address,

                distanceLabel: "",

                description:
                  location.description ??
                  "",

                pricePerBagPerDay:
                  Number(
                    location.price_per_bag
                  ),

                currency: "UZS",

                capacity:
                  Number(
                    location.capacity
                  ),

                availableBags:
                  Number(
                    location.capacity
                  ),

                maxBagsPerBooking: 8,

                hours: {
                  open: formatTime(
                    location.opening_time
                  ),
                  close: formatTime(
                    location.closing_time
                  ),
                },

                amenities: [
                  "Verified partner",
                  "Indoor storage",
                ],

                lat: Number(
                  location.latitude
                ),

                lng: Number(
                  location.longitude
                ),

                googleMapsUrl:
                  location.google_maps_url ??
                  "",

                yandexMapsUrl:
                  location.yandex_maps_url ??
                  "",

                partnerName: "",

                color: [
                  "#1f6f6b",
                  "#e0883c",
                  "#8a5a3b",
                ][index % 3],

                isDemo: false,

                active:
                  location.active,
              })
            );

        setLocations(mapped);
      } catch (loadError) {
        console.error(
          "Locations loading error:",
          loadError
        );

        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load locations."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadLocations();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==================================================
  // LOAD AVAILABILITY
  // ==================================================

  useEffect(() => {
    if (locations.length === 0) {
      return;
    }

    let cancelled = false;

    async function loadAvailability() {
      try {
        setLoadingAvailability(true);

        const nextAvailability: Record<
          string,
          number
        > = {};

        await Promise.all(
          locations.map(
            async (location) => {
              try {
                const params =
                  new URLSearchParams({
                    locationId:
                      location.id,

                    dropoffDate,
                    dropoffTime,

                    pickupDate,
                    pickupTime,
                  });

                const response =
                  await fetch(
                    `/api/locations/availability?${params.toString()}`,
                    {
                      cache: "no-store",
                    }
                  );

                const result =
                  await response.json();

                if (
                  response.ok &&
                  result.ok
                ) {
                  nextAvailability[
                    location.id
                  ] = Number(
                    result.availableBags
                  );
                } else {
                  nextAvailability[
                    location.id
                  ] = Number(
                    location.capacity
                  );
                }
              } catch {
                nextAvailability[
                  location.id
                ] = Number(
                  location.capacity
                );
              }
            }
          )
        );

        if (!cancelled) {
          setAvailability(
            nextAvailability
          );
        }
      } catch (availabilityError) {
        console.error(
          "Availability loading error:",
          availabilityError
        );
      } finally {
        if (!cancelled) {
          setLoadingAvailability(
            false
          );
        }
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [
    locations,
    dropoffDate,
    dropoffTime,
    pickupDate,
    pickupTime,
  ]);

  // ==================================================
  // LOCATIONS WITH AVAILABILITY
  // ==================================================

  const locationsWithAvailability =
    useMemo(() => {
      return locations.map(
        (location) => ({
          ...location,

          availableBags:
            availability[
              location.id
            ] ??
            location.availableBags,
        })
      );
    }, [
      locations,
      availability,
    ]);

  // ==================================================
  // CITY FILTER
  // ==================================================

  const cityLocations = useMemo(() => {
    return locationsWithAvailability.filter(
      (location) =>
        location.city.trim().toLowerCase() ===
        selectedCity.trim().toLowerCase()
    );
  }, [
    locationsWithAvailability,
    selectedCity,
  ]);

  // ==================================================
  // MAP DATA
  //
  // MapSection expects its own MapLocation[]
  // structure. Keep this adapter here so the
  // customer Location type and map type stay separate.
  // ==================================================

  const mapLocations =
    useMemo(() => {
      return cityLocations.map(
        (location) => ({
          ...location,

          locationId:
            location.id,

          locationName:
            location.name,

          latitude:
            location.lat,

          longitude:
            location.lng,

          pricePerBag:
            location.pricePerBagPerDay,

          price_per_bag:
            location.pricePerBagPerDay,

          opening_time:
            location.hours.open,

          closing_time:
            location.hours.close,

          available_bags:
            location.availableBags,

          google_maps_url:
            location.googleMapsUrl,

          yandex_maps_url:
            location.yandexMapsUrl,
        })
      );
    }, [cityLocations]);

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main className="max-w-[1140px] mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-3 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <LocationCardSkeleton key={i} />
            ))}
          </div>

          <div className="lg:col-span-5 sticky top-24">
            <MapSkeleton />
          </div>
        </div>
      </main>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (error) {
    return (
      <main className="max-w-[1100px] mx-auto px-6 py-16">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h1 className="font-slab font-bold text-xl text-red-800">
            {t.locationsPage.loadErrorTitle}
          </h1>

          <p className="text-sm text-red-700 mt-2">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="btn-primary mt-5"
          >
            {t.common.tryAgain}
          </button>
        </div>
      </main>
    );
  }

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <main className="min-h-screen bg-cream">

      {/* ============================================
          PAGE HEADER
      ============================================ */}

      <section className="border-b border-line bg-cream">
        <div className="max-w-[1100px] mx-auto px-6 pt-10 pb-7">

          <div className="flex items-start justify-between gap-4 flex-wrap">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay mb-2">
                BagDrop Uzbekistan
              </p>

              <h1 className="font-slab font-bold text-3xl sm:text-4xl text-ink">
                {t.locationsPage.title}
              </h1>

              <p className="text-sm sm:text-base text-ink-soft mt-3 max-w-2xl leading-6">
                {t.locationsPage.description}
              </p>
            </div>

            <DemoBadge
              label={t.locationsPage.liveLocations}
            />

          </div>

          {/* CITY SELECTOR */}

          <div className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft mb-2.5">
              {t.locationsPage.chooseCity}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CITY_OPTIONS.map((city) => {
                const cityCount =
                  locationsWithAvailability.filter(
                    (location) =>
                      location.city.trim().toLowerCase() ===
                      city.toLowerCase()
                  ).length;

                const active =
                  selectedCity.toLowerCase() ===
                  city.toLowerCase();

                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() =>
                      setSelectedCity(city)
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition text-left ${
                      active
                        ? "border-teal bg-teal text-white shadow-sm"
                        : "border-line bg-white text-ink hover:border-teal/50 hover:bg-sand"
                    }`}
                  >
                    <span className="block">
                      {cityLabels[city]}
                    </span>

                    <span
                      className={`block mt-0.5 text-[10px] font-medium ${
                        active
                          ? "text-white/75"
                          : "text-ink-soft"
                      }`}
                    >
                      {cityCount}{" "}
                      {cityCount === 1
                        ? t.locationsPage.locationSingular
                        : t.locationsPage.locationPlural}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ============================================
          CONTENT
      ============================================ */}

      <section className="max-w-[1100px] mx-auto px-6 py-7">

        {/* RESULT BAR */}

        <div className="flex items-center justify-between gap-4 mb-4">

          <div>
            <h2 className="font-slab font-bold text-xl">
              {cityLabels[selectedCity]} {t.locationsPage.locationsTitleSuffix}
            </h2>

            <p className="text-xs text-ink-soft mt-1">
              {cityLocations.length}{" "}
              {cityLocations.length === 1
                ? t.locationsPage.locationSingular
                : t.locationsPage.locationPlural}{" "}
              {t.locationsPage.found}
            </p>
          </div>

          {loadingAvailability && (
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <span className="w-3 h-3 border-2 border-line border-t-teal rounded-full animate-spin" />
              {t.locationsPage.updatingAvailability}
            </div>
          )}

        </div>

        {/* EMPTY */}

        {cityLocations.length === 0 && (
          <div className="bg-white border border-line rounded-2xl px-6 py-14 text-center">

            <div className="w-12 h-12 mx-auto rounded-full bg-sand flex items-center justify-center mb-4">
              <svg
                className="w-5 h-5 text-ink-soft"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z" />
                <circle cx="12" cy="9" r="2.2" />
              </svg>
            </div>

            <h3 className="font-semibold text-base">
              {t.locationsPage.noLocations}
            </h3>

            <p className="text-sm text-ink-soft mt-1">
              {t.locationsPage.preparingLocations}{" "}
              {cityLabels[selectedCity]}. {t.locationsPage.checkBackSoon}
            </p>

          </div>
        )}

        {/* LOCATIONS + MAP */}

        {cityLocations.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start">

            {/* ======================================
                LOCATION LIST
            ====================================== */}

            <div className="space-y-3">

              {cityLocations.map(
                (location) => {
                  const available =
                    Number(
                      location.availableBags
                    );

                  const isAvailable =
                    available > 0;

                  return (
                    <Link
                      key={location.id}
                      href={`/locations/${location.slug}`}
                      className="group block bg-white border border-line rounded-2xl overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
                    >

                      <div className="flex">

                        {/* COLOR STRIPE */}

                        <div
                          className="w-1.5 shrink-0"
                          style={{
                            background:
                              location.color,
                          }}
                        />

                        <div className="p-4 sm:p-5 flex-1 min-w-0">

                          {/* TITLE */}

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <div className="flex items-center gap-2">

                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    isAvailable
                                      ? "bg-ok"
                                      : "bg-red-500"
                                  }`}
                                />

                                <h3 className="font-semibold text-[15px] truncate">
                                  {
                                    location.name
                                  }
                                </h3>

                              </div>

                              <p className="text-xs text-ink-soft mt-1">
                                {
                                  location.city
                                }
                              </p>

                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                isAvailable
                                  ? "bg-[#e6f6ee] text-ok"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {isAvailable
                                ? `${available} ${t.locationsPage.free}`
                                : t.locationsPage.full}
                            </span>

                          </div>

                          {/* ADDRESS */}

                          <p className="text-xs text-ink-soft mt-2 leading-5">
                            {
                              location.address
                            }
                          </p>

                          {/* INFO */}

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">

                            <div className="rounded-lg bg-sand px-3 py-2.5">

                              <span className="block text-[10px] uppercase tracking-wide text-ink-soft">
                                {t.locationsPage.price}
                              </span>

                              <span className="block mt-0.5 text-sm font-semibold">
                                {formatMoney(
                                  PRICE_UP_TO_12_HOURS
                                )}
                              </span>

                              <span className="block text-[10px] text-ink-soft">
                                {t.locationsPage.upTo12Hours}
                              </span>

                              <span className="block mt-1 text-[11px] font-semibold text-ink">
                                {formatMoney(
                                  PRICE_UP_TO_24_HOURS
                                )}{" "}
                                <span className="font-normal text-ink-soft">
                                  {t.locationsPage.per24Hours}
                                </span>
                              </span>

                            </div>

                            <div className="rounded-lg bg-sand px-3 py-2.5">

                              <span className="block text-[10px] uppercase tracking-wide text-ink-soft">
                                {t.locationsPage.hours}
                              </span>

                              <span className="block mt-0.5 text-sm font-semibold">
                                {
                                  location.hours
                                    .open
                                }
                                {" – "}
                                {
                                  location.hours
                                    .close
                                }
                              </span>

                              <span className="block text-[10px] text-ink-soft">
                                {t.locationsPage.daily}
                              </span>

                            </div>

                            <div className="rounded-lg bg-sand px-3 py-2.5 col-span-2 sm:col-span-1">

                              <span className="block text-[10px] uppercase tracking-wide text-ink-soft">
                                {t.locationsPage.capacity}
                              </span>

                              <span className="block mt-0.5 text-sm font-semibold">
                                {
                                  location.capacity
                                }{" "}
                                {t.locationsPage.bags}
                              </span>

                              <span className="block text-[10px] text-ink-soft">
                                {t.locationsPage.totalStorage}
                              </span>

                            </div>

                          </div>

                          {/* FOOTER */}

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-line">

                            <div className="flex items-center gap-2 text-xs font-semibold">

                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isAvailable
                                    ? "bg-ok"
                                    : "bg-red-500"
                                }`}
                              />

                              <span
                                className={
                                  isAvailable
                                    ? "text-ok"
                                    : "text-red-600"
                                }
                              >
                                {isAvailable
                                  ? t.locationsPage.available
                                  : t.locationsPage.currentlyFull}
                              </span>

                            </div>

                            <span className="text-xs text-ink-soft group-hover:text-teal transition-colors">
                              {t.locationsPage.viewDetails}
                            </span>

                          </div>

                        </div>

                      </div>

                    </Link>
                  );
                }
              )}

            </div>

            {/* ======================================
                REAL MAP
            ====================================== */}

            <div className="lg:sticky lg:top-24">

              <div className="bg-white border border-line rounded-2xl overflow-hidden shadow-sm">

                <div className="px-4 py-3 border-b border-line">

                  <div className="flex items-center justify-between gap-3">

                    <div>
                      <h3 className="font-semibold text-sm">
                        {t.locationsPage.mapTitle}
                      </h3>

                      <p className="text-xs text-ink-soft mt-0.5">
                        {cityLocations.length}{" "}
                        {t.locationsPage.locationsOnMap}
                      </p>
                    </div>

                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-ok">
                      <span className="w-2 h-2 rounded-full bg-ok" />
                      {t.locationsPage.live}
                    </span>

                  </div>

                </div>

                <MapSection
                  locations={
                    mapLocations as any
                  }
                />

              </div>

            </div>

          </div>
        )}

      </section>
    </main>
  );
}

export default function LocationsPage() {
  return <LocationsInner />;
}
