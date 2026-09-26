"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import MapSection from "@/components/MapSection";
import DemoBadge from "@/components/DemoBadge";
import { LocationCardSkeleton, MapSkeleton } from "@/components/Skeleton";
import { Location } from "@/lib/types";
import { LOCATIONS } from "@/lib/mockData";
import { useLanguage } from "@/lib/i18n";
import {
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
  Luggage,
  Sparkles,
  Compass,
  Building,
  CheckCircle2,
  RefreshCw,
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

function LocationsContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const CITY_OPTIONS = ["Samarkand", "Tashkent", "Bukhara", "Khiva"];

  const [selectedCity, setSelectedCity] = useState("Samarkand");
  const [searchFilter, setSearchFilter] = useState(initialQuery);

  const cityLabels: Record<string, string> = {
    Tashkent: t.locationsPage.tashkent,
    Samarkand: t.locationsPage.samarkand,
    Bukhara: t.locationsPage.bukhara,
    Khiva: t.locationsPage.khiva,
  };

  const [locations, setLocations] = useState<Location[]>(LOCATIONS);
  const [availability, setAvailability] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    LOCATIONS.forEach((l) => {
      initial[l.id] = l.availableBags;
    });
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [dropoffDate] = useState(getToday);
  const [pickupDate] = useState(getToday);
  const [dropoffTime] = useState("10:00");
  const [pickupTime] = useState("18:00");

  useEffect(() => {
    let cancelled = false;

    async function loadLocations() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/locations", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to load locations.");
        }

        if (cancelled) return;

        const apiLocations = (result.locations ?? []) as ApiLocation[];

        const mapped: Location[] = apiLocations
          .filter((location) => location.active)
          .map((location, index) => ({
            id: location.id,
            slug: location.slug,
            name: location.name,
            city: location.city,
            address: location.address,
            distanceLabel: "",
            description: location.description ?? "",
            pricePerBagPerDay: Number(location.price_per_bag),
            currency: "UZS",
            capacity: Number(location.capacity),
            availableBags: Number(location.capacity),
            maxBagsPerBooking: 8,
            hours: {
              open: formatTime(location.opening_time),
              close: formatTime(location.closing_time),
            },
            amenities: ["Verified partner", "Indoor storage"],
            lat: Number(location.latitude),
            lng: Number(location.longitude),
            googleMapsUrl: location.google_maps_url ?? "",
            yandexMapsUrl: location.yandex_maps_url ?? "",
            partnerName: "",
            color: ["#10b981", "#f97316", "#0ea5e9"][index % 3],
            isDemo: false,
            active: location.active,
          }));

        setLocations(mapped);
      } catch (loadError) {
        console.error("Locations loading error:", loadError);
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

  useEffect(() => {
    if (locations.length === 0) return;

    let cancelled = false;

    async function loadAvailability() {
      try {
        setLoadingAvailability(true);
        const nextAvailability: Record<string, number> = {};

        await Promise.all(
          locations.map(async (location) => {
            try {
              const params = new URLSearchParams({
                locationId: location.id,
                dropoffDate,
                dropoffTime,
                pickupDate,
                pickupTime,
              });

              const response = await fetch(
                `/api/locations/availability?${params.toString()}`,
                { cache: "no-store" }
              );

              const result = await response.json();

              if (response.ok && result.ok) {
                nextAvailability[location.id] = Number(result.availableBags);
              } else {
                nextAvailability[location.id] = Number(location.capacity);
              }
            } catch {
              nextAvailability[location.id] = Number(location.capacity);
            }
          })
        );

        if (!cancelled) {
          setAvailability(nextAvailability);
        }
      } catch (availabilityError) {
        console.error("Availability loading error:", availabilityError);
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
  }, [locations, dropoffDate, dropoffTime, pickupDate, pickupTime]);

  const locationsWithAvailability = useMemo(() => {
    return locations.map((location) => ({
      ...location,
      availableBags: availability[location.id] ?? location.availableBags,
    }));
  }, [locations, availability]);

  const cityLocations = useMemo(() => {
    return locationsWithAvailability.filter((location) => {
      const matchesCity =
        location.city.trim().toLowerCase() ===
        selectedCity.trim().toLowerCase();
      if (!searchFilter.trim()) return matchesCity;

      const q = searchFilter.toLowerCase();
      const matchesSearch =
        location.name.toLowerCase().includes(q) ||
        location.address.toLowerCase().includes(q) ||
        location.city.toLowerCase().includes(q);

      return matchesCity && matchesSearch;
    });
  }, [locationsWithAvailability, selectedCity, searchFilter]);

  const mapLocations = useMemo(() => {
    return cityLocations.map((location) => ({
      ...location,
      locationId: location.id,
      locationName: location.name,
      latitude: location.lat,
      longitude: location.lng,
      pricePerBag: location.pricePerBagPerDay,
      price_per_bag: location.pricePerBagPerDay,
      opening_time: location.hours.open,
      closing_time: location.hours.close,
      available_bags: location.availableBags,
      google_maps_url: location.googleMapsUrl,
      yandex_maps_url: location.yandexMapsUrl,
    }));
  }, [cityLocations]);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 space-y-3">
          <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-xl" />
          <div className="h-4 w-96 bg-slate-200/70 animate-pulse rounded-lg" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 grid grid-cols-1 gap-4">
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

  if (error) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-20">
        <div className="rounded-3xl border border-red-200 bg-red-50/80 p-8 text-center backdrop-blur-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-4">
            ⚠️
          </div>
          <h1 className="font-display font-bold text-2xl text-red-900">
            {t.locationsPage.loadErrorTitle}
          </h1>
          <p className="text-sm text-red-700 mt-2 max-w-md mx-auto">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-2xl shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            {t.common.tryAgain}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* PAGE HEADER */}
      <section className="relative bg-white border-b border-line overflow-hidden pt-10 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 border border-brand-200/60 px-3 py-1 rounded-full">
                <Compass className="w-3.5 h-3.5" />
                Luggage Storage Hub
              </span>
              <h1 className="font-display font-black text-3xl sm:text-5xl text-ink">
                {t.locationsPage.title}
              </h1>
              <p className="text-sm sm:text-base text-ink-soft max-w-2xl font-normal leading-relaxed">
                {t.locationsPage.description}
              </p>
            </div>

            <DemoBadge label={t.locationsPage.liveLocations} />
          </div>

          {/* CITY TABS WITH FRAMER MOTION INDICATOR */}
          <div className="mt-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CITY_OPTIONS.map((city) => {
                const cityCount = locationsWithAvailability.filter(
                  (location) =>
                    location.city.trim().toLowerCase() === city.toLowerCase()
                ).length;

                const active = selectedCity.toLowerCase() === city.toLowerCase();

                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    className={`relative px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center gap-3 shrink-0 ${
                      active
                        ? "text-white bg-slate-900 shadow-card-hover"
                        : "text-slate-600 bg-slate-100 hover:bg-slate-200/80 hover:text-slate-900"
                    }`}
                  >
                    <Building className="w-4 h-4 opacity-70" />
                    <span>{cityLabels[city]}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        active
                          ? "bg-brand-500 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {cityCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* LOCATIONS LIST + MAP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-ink">
              {cityLabels[selectedCity]} {t.locationsPage.locationsTitleSuffix}
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft mt-0.5">
              {cityLocations.length}{" "}
              {cityLocations.length === 1
                ? t.locationsPage.locationSingular
                : t.locationsPage.locationPlural}{" "}
              {t.locationsPage.found}
            </p>
          </div>

          {loadingAvailability && (
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full border border-brand-200">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{t.locationsPage.updatingAvailability}</span>
            </div>
          )}
        </div>

        {cityLocations.length === 0 ? (
          <div className="bg-white border border-line rounded-3xl p-12 text-center max-w-lg mx-auto shadow-card-modern">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-3xl mb-4">
              🏛️
            </div>
            <h3 className="font-display font-bold text-xl text-ink">
              {t.locationsPage.noLocations}
            </h3>
            <p className="text-sm text-ink-soft mt-2 leading-relaxed">
              {t.locationsPage.preparingLocations} {cityLabels[selectedCity]}.{" "}
              {t.locationsPage.checkBackSoon}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Location Cards List */}
            <div className="lg:col-span-7 space-y-4">
              <AnimatePresence>
                {cityLocations.map((location, idx) => {
                  const available = Number(location.availableBags);
                  const isAvailable = available > 0;

                  return (
                    <motion.div
                      key={location.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.35, delay: idx * 0.05 }}
                    >
                      <Link
                        href={`/locations/${location.slug}`}
                        className="group relative block bg-white border border-line hover:border-brand-500/40 rounded-3xl overflow-hidden shadow-card-modern hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isAvailable ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                                  }`}
                                />
                                <h3 className="font-display font-bold text-lg text-ink group-hover:text-brand-600 transition-colors">
                                  {location.name}
                                </h3>
                              </div>
                              <p className="flex items-center gap-1.5 text-xs text-ink-soft font-normal">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{location.address}</span>
                              </p>
                            </div>

                            <span
                              className={`shrink-0 inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${
                                isAvailable
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              <Luggage className="w-3 h-3" />
                              {isAvailable
                                ? `${available} ${t.locationsPage.free}`
                                : t.locationsPage.full}
                            </span>
                          </div>

                          {/* Info Chips */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                {t.locationsPage.price}
                              </span>
                              <span className="block font-display font-bold text-sm text-ink mt-0.5">
                                {formatMoney(PRICE_UP_TO_12_HOURS)}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                {t.locationsPage.upTo12Hours}
                              </span>
                            </div>

                            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                {t.locationsPage.hours}
                              </span>
                              <span className="block font-display font-bold text-sm text-ink mt-0.5">
                                {location.hours.open} – {location.hours.close}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                {t.locationsPage.daily}
                              </span>
                            </div>

                            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 col-span-2 sm:col-span-1">
                              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                {t.locationsPage.capacity}
                              </span>
                              <span className="block font-display font-bold text-sm text-ink mt-0.5">
                                {location.capacity} {t.locationsPage.bags}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                {t.locationsPage.totalStorage}
                              </span>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
                              <ShieldCheck className="w-4 h-4 text-teal-600" />
                              <span>Insured & Monitored</span>
                            </div>

                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 group-hover:translate-x-1 transition-transform">
                              <span>{t.locationsPage.viewDetails}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Sticky RealMap */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <div className="bg-white border border-line rounded-3xl p-2 shadow-card-modern">
                <div className="px-4 py-3 flex items-center justify-between border-b border-line mb-2">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-brand-500" />
                    <h3 className="font-display font-bold text-sm text-ink">
                      {t.locationsPage.mapTitle}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {cityLocations.length} on map
                  </span>
                </div>

                <MapSection locations={mapLocations as any} />
              </div>
            </div>

          </div>
        )}
      </section>
    </main>
  );
}

export default function LocationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <LocationsContent />
    </Suspense>
  );
}
