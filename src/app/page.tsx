"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import MapSection from "@/components/MapSection";
import { MapSkeleton } from "@/components/Skeleton";
import { useLanguage } from "@/lib/i18n";
import { LOCATIONS } from "@/lib/mockData";

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

const initialApiLocations: ApiLocation[] = LOCATIONS.map((loc) => ({
  id: loc.id,
  partner_id: "demo-partner",
  city: loc.city,
  name: loc.name,
  slug: loc.slug,
  address: loc.address,
  latitude: loc.lat,
  longitude: loc.lng,
  description: loc.description,
  price_per_bag: loc.pricePerBagPerDay,
  capacity: loc.capacity,
  opening_time: loc.hours.open,
  closing_time: loc.hours.close,
  active: loc.active,
  google_maps_url: loc.googleMapsUrl,
  yandex_maps_url: loc.yandexMapsUrl,
}));

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [locations, setLocations] = useState<ApiLocation[]>(initialApiLocations);
  const [locationsLoading, setLocationsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLocations() {
      try {
        setLocationsLoading(true);
        const response = await fetch("/api/locations", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Failed to load locations.");
        }

        if (isMounted) {
          setLocations(Array.isArray(result.locations) ? result.locations : []);
        }
      } catch (error) {
        console.error("Failed to load homepage locations:", error);
        if (isMounted) {
          setLocations([]);
        }
      } finally {
        if (isMounted) {
          setLocationsLoading(false);
        }
      }
    }

    loadLocations();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(
      query ? `/locations?q=${encodeURIComponent(query)}` : "/locations"
    );
  }

  const activeLocations = locations.filter((loc) => loc.active);

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative bg-ink text-white overflow-hidden py-16 sm:py-24">
        {/* Subtle Geometric Background */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, #1b2a3a 1px)",
            backgroundSize: "28px 28px",
            backgroundPosition: "0 0, 14px 14px",
          }}
        />

        <div className="relative max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Heading and CTA */}
            <div className="lg:col-span-7">
              {/* Live Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium mb-6 backdrop-blur-sm transition-colors">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>📍 {t.homePage.liveNow}</span>
                <span className="font-bold text-clay ml-1">{t.homePage.samarkand}</span>
              </div>

              {/* Heading */}
              <h1 className="font-slab font-bold text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.08]">
                {t.homePage.heroTitle}
              </h1>

              {/* Subtitle */}
              <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
                {t.homePage.heroDescription}
              </p>

              {/* Actions & Trust Badges */}
              <div className="flex flex-wrap items-center gap-4 mt-8">
                <Link
                  href="/locations"
                  className="inline-flex items-center gap-2 bg-clay hover:bg-clay-dark text-white font-semibold rounded-xl px-7 py-3.5 text-base shadow-lg shadow-clay/20 hover:shadow-xl transition-all duration-200 active:scale-95 animate-pulse-glow"
                >
                  <span>🧳</span>
                  <span>{t.homePage.findStorage}</span>
                </Link>

                <a
                  href="#how"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-medium rounded-xl px-6 py-3.5 text-base backdrop-blur-xs transition-colors"
                >
                  <span>{t.homePage.howItWorks}</span>
                  <span>↓</span>
                </a>
              </div>
            </div>

            {/* Right Column: Animated Live Ticket Showcase */}
            <div className="lg:col-span-5 hidden lg:block">
              <div className="relative animate-float">
                {/* Glow backdrop */}
                <div className="absolute -inset-1 bg-gradient-to-r from-clay to-teal rounded-3xl blur-xl opacity-30 animate-pulse" />

                {/* Ticket Card */}
                <div className="relative bg-white/95 backdrop-blur-md border border-white/40 text-ink rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-line/60 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-clay/10 text-clay flex items-center justify-center font-bold text-base">
                        🧳
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-clay block">
                          BagDrop Instant Ticket
                        </span>
                        <span className="font-slab font-bold text-sm text-ink">
                          BD-2026-SAMARKAND
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 bg-ok-bg text-ok text-[11px] font-bold px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-ok animate-ping" />
                      Active
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-ink-soft">
                    <div className="flex justify-between py-1 border-b border-line/30">
                      <span>Location</span>
                      <b className="text-ink">Registan Square Central</b>
                    </div>
                    <div className="flex justify-between py-1 border-b border-line/30">
                      <span>Luggage Protected</span>
                      <b className="text-ink">2 Bags • $500 Guarantee</b>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Security Seal</span>
                      <b className="text-teal font-semibold">✓ Verified QR Pass</b>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t-2 border-dashed border-line/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-ink-soft">
                      <span>🕒</span> Open 08:00 - 22:00
                    </div>
                    <span className="font-slab font-bold text-base text-clay">
                      40,000 UZS <span className="text-[10px] font-sans font-normal text-ink-soft">/day</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/15 max-w-4xl">
            <div>
              <div className="font-slab font-bold text-2xl sm:text-3xl text-white">100%</div>
              <div className="text-xs sm:text-sm text-slate-400">Verified locations</div>
            </div>
            <div>
              <div className="font-slab font-bold text-2xl sm:text-3xl text-white">Instant</div>
              <div className="text-xs sm:text-sm text-slate-400">QR check-in & out</div>
            </div>
            <div>
              <div className="font-slab font-bold text-2xl sm:text-3xl text-white">Insured</div>
              <div className="text-xs sm:text-sm text-slate-400">Security guarantee</div>
            </div>
            <div>
              <div className="font-slab font-bold text-2xl sm:text-3xl text-white">24/7</div>
              <div className="text-xs sm:text-sm text-slate-400">Customer assistance</div>
            </div>
          </div>
        </div>
      </section>

      {/* FLOATING SEARCH BAR */}
      <section className="relative max-w-[1140px] mx-auto px-4 sm:px-6 -mt-8 z-10 w-full">
        <form
          onSubmit={handleSearch}
          className="bg-white rounded-2xl shadow-xl shadow-black/10 border border-line p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-center"
        >
          <div className="flex-1 flex items-center gap-3 w-full px-3 py-2 bg-cream/50 rounded-xl border border-line/50 focus-within:border-teal focus-within:bg-white transition-all">
            <span className="text-lg text-ink-soft">📍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder={t.homePage.searchPlaceholder}
              className="w-full bg-transparent text-sm sm:text-base text-ink placeholder:text-ink-soft/70 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl px-7 py-3 text-sm sm:text-base flex items-center justify-center gap-2 transition-colors duration-200 shrink-0"
          >
            <span>🔍</span>
            <span>{t.homePage.search}</span>
          </button>
        </form>
      </section>

      {/* INTERACTIVE MAP SECTION */}
      <section className="max-w-[1140px] mx-auto px-4 sm:px-6 py-16 sm:py-20 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-clay mb-1">
              Explore around you
            </div>
            <h2 className="font-slab font-bold text-2xl sm:text-3xl text-ink">
              {t.homePage.mapTitle}
            </h2>
            <p className="text-sm sm:text-base text-ink-soft mt-1.5 max-w-xl">
              {t.homePage.mapDescription}
            </p>
          </div>

          <Link
            href="/locations"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-teal hover:text-teal-dark transition-colors self-start sm:self-auto"
          >
            <span>View list ({activeLocations.length})</span>
            <span>→</span>
          </Link>
        </div>

        {locationsLoading ? (
          <MapSkeleton />
        ) : (
          <MapSection locations={locations} />
        )}
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how"
        className="bg-sand/40 border-y border-line py-16 sm:py-20"
      >
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-clay block mb-1">
              Easy & Convenient
            </span>
            <h2 className="font-slab font-bold text-2xl sm:text-4xl text-ink">
              {t.homePage.howItWorks}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              t.homePage.step1,
              t.homePage.step2,
              t.homePage.step3,
              t.homePage.step4,
              t.homePage.step5,
              t.homePage.step6,
            ].map((text, i) => (
              <div
                key={i}
                className="bg-white border border-line rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="w-8 h-8 rounded-full bg-clay/10 text-clay font-slab font-bold text-sm flex items-center justify-center mb-3">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <p className="text-sm font-medium text-ink-soft leading-snug">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY BAGDROP - VALUE PROPOSITIONS */}
      <section className="max-w-[1140px] mx-auto px-4 sm:px-6 py-16 sm:py-20 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-clay block mb-1">
            Safety & Reliability
          </span>
          <h2 className="font-slab font-bold text-2xl sm:text-3xl text-ink">
            {t.homePage.whyTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: "🛡️",
              title: t.homePage.verifiedPartners,
              body: t.homePage.verifiedPartnersText,
            },
            {
              icon: "📲",
              title: t.homePage.qrCheckin,
              body: t.homePage.qrCheckinText,
            },
            {
              icon: "🏷️",
              title: t.homePage.luggageTags,
              body: t.homePage.luggageTagsText,
            },
            {
              icon: "💳",
              title: t.homePage.securePayment,
              body: t.homePage.securePaymentText,
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white border border-line rounded-2xl p-6 shadow-xs hover:border-clay/40 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center text-2xl mb-4">
                {item.icon}
              </div>
              <h3 className="font-slab font-bold text-lg text-ink mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="bg-sand/30 border-t border-line py-16 sm:py-20">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-slab font-bold text-2xl sm:text-3xl text-ink">
              {t.homePage.faqTitle}
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { q: t.homePage.faq1q, a: t.homePage.faq1a },
              { q: t.homePage.faq2q, a: t.homePage.faq2a },
              { q: t.homePage.faq3q, a: t.homePage.faq3a },
              { q: t.homePage.faq4q, a: t.homePage.faq4a },
            ].map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={f.q}
                  className="bg-white border border-line rounded-2xl overflow-hidden transition-all shadow-xs"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full text-left px-5 py-4 flex justify-between items-center gap-4 font-semibold text-sm sm:text-base text-ink"
                  >
                    <span>{f.q}</span>
                    <span className="w-6 h-6 rounded-full bg-cream flex items-center justify-center text-sm font-mono shrink-0">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm text-ink-soft border-t border-line/40 leading-relaxed">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CITIES WE COVER */}
      <section className="max-w-[1140px] mx-auto px-4 sm:px-6 py-16 sm:py-20 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-slab font-bold text-2xl sm:text-3xl text-ink">
            {t.homePage.citiesTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/locations"
            className="group bg-white border-2 border-clay/50 rounded-2xl p-5 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🏛️</span>
              <span className="inline-flex items-center gap-1 text-[11px] bg-ok-bg text-ok font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse" />
                Live
              </span>
            </div>
            <h3 className="font-slab font-bold text-lg text-ink group-hover:text-clay transition-colors">
              {t.homePage.samarkand}
            </h3>
            <p className="text-xs text-ink-soft mt-1">
              {activeLocations.length} {t.homePage.locationsLive}
            </p>
          </Link>

          {[
            { name: t.homePage.tashkent, icon: "🏙️" },
            { name: t.homePage.bukhara, icon: "🕌" },
            { name: t.homePage.khiva, icon: "🏰" },
          ].map((city) => (
            <div
              key={city.name}
              className="bg-white/60 border border-line rounded-2xl p-5 opacity-75"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{city.icon}</span>
                <span className="text-[11px] bg-line/20 text-ink-soft font-semibold px-2 py-0.5 rounded-full">
                  {t.homePage.comingSoon}
                </span>
              </div>
              <h3 className="font-slab font-bold text-lg text-ink/80">
                {city.name}
              </h3>
              <p className="text-xs text-ink-soft mt-1">Opening soon</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}