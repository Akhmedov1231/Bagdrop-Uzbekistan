"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import MapSection from "@/components/MapSection";
import { MapSkeleton } from "@/components/Skeleton";
import { useLanguage } from "@/lib/i18n";
import { LOCATIONS } from "@/lib/mockData";
import {
  Luggage,
  Search,
  MapPin,
  ShieldCheck,
  QrCode,
  Tag,
  CreditCard,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Clock,
  Compass,
  CheckCircle2,
  Check,
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
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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

  const steps = [
    { title: t.homePage.step1, icon: Search },
    { title: t.homePage.step2, icon: CreditCard },
    { title: t.homePage.step3, icon: Luggage },
    { title: t.homePage.step4, icon: Compass },
    { title: t.homePage.step5, icon: QrCode },
    { title: t.homePage.step6, icon: CheckCircle2 },
  ];

  const valueProps = [
    {
      icon: ShieldCheck,
      color: "from-teal-500/20 to-emerald-500/20 text-teal-600",
      title: t.homePage.verifiedPartners,
      body: t.homePage.verifiedPartnersText,
    },
    {
      icon: QrCode,
      color: "from-brand-500/20 to-amber-500/20 text-brand-600",
      title: t.homePage.qrCheckin,
      body: t.homePage.qrCheckinText,
    },
    {
      icon: Tag,
      color: "from-purple-500/20 to-pink-500/20 text-purple-600",
      title: t.homePage.luggageTags,
      body: t.homePage.luggageTagsText,
    },
    {
      icon: CreditCard,
      color: "from-blue-500/20 to-cyan-500/20 text-blue-600",
      title: t.homePage.securePayment,
      body: t.homePage.securePaymentText,
    },
  ];

  const faqs = [
    { q: t.homePage.faq1q, a: t.homePage.faq1a },
    { q: t.homePage.faq2q, a: t.homePage.faq2a },
    { q: t.homePage.faq3q, a: t.homePage.faq3a },
    { q: t.homePage.faq4q, a: t.homePage.faq4a },
  ];

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative bg-ink-deep text-white overflow-hidden pt-12 pb-24 sm:pt-20 sm:pb-32">
        {/* Animated Glow Background Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-brand-500/10 blur-2xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Heading & Calls to Action */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="lg:col-span-7 space-y-6"
            >
              {/* Live Status Pill */}
              <div className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium backdrop-blur-md transition-all shadow-glow-brand">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-slate-200">📍 {t.homePage.liveNow}</span>
                <span className="font-bold text-brand-400 bg-brand-500/20 px-2 py-0.5 rounded-full">
                  {t.homePage.samarkand}
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.08] text-white">
                {t.homePage.heroTitle}
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-xl text-slate-300 max-w-2xl leading-relaxed font-normal">
                {t.homePage.heroDescription}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/locations"
                  className="inline-flex items-center gap-2.5 bg-gradient-to-r from-brand-500 via-brand-600 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold rounded-2xl px-8 py-4 text-base shadow-glow-brand hover:shadow-xl transition-all duration-300 active:scale-95"
                >
                  <Luggage className="w-5 h-5 stroke-[2.2]" />
                  <span>{t.homePage.findStorage}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <a
                  href="#how"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold rounded-2xl px-6 py-4 text-base backdrop-blur-md transition-all hover:border-white/40"
                >
                  <span>{t.homePage.howItWorks}</span>
                  <ChevronDown className="w-4 h-4 animate-bounce" />
                </a>
              </div>
            </motion.div>

            {/* Right Column: Interactive Digital Pass Showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="lg:col-span-5 hidden lg:block"
            >
              <div className="relative animate-float">
                {/* Glow backlight */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-brand-500 to-teal-400 rounded-4xl blur-2xl opacity-40 animate-pulse" />

                {/* Modern Digital Luggage Pass Card */}
                <div className="relative bg-white text-ink rounded-3xl p-7 shadow-ticket border border-white/80 overflow-hidden">
                  {/* Decorative Background Watermark */}
                  <div className="absolute -bottom-10 -right-10 text-slate-100 opacity-40 pointer-events-none">
                    <Luggage className="w-48 h-48" />
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-amber-400 flex items-center justify-center text-white shadow-sm">
                        <Luggage className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600 block">
                          BagDrop Digital Pass
                        </span>
                        <span className="font-display font-bold text-base text-ink">
                          BD-2026-SAMARKAND
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  </div>

                  {/* Pass Body Details */}
                  <div className="space-y-3 text-xs text-ink-soft">
                    <div className="flex justify-between items-center py-1.5 border-b border-line/50">
                      <span className="font-medium">Drop Location</span>
                      <b className="text-ink font-semibold">Registan Square Central</b>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-line/50">
                      <span className="font-medium">Luggage Cover</span>
                      <b className="text-ink font-semibold">2 Bags • $500 Guarantee</b>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="font-medium">Security Seal</span>
                      <b className="text-teal-600 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Verified QR Check-in
                      </b>
                    </div>
                  </div>

                  {/* Perforated Divider */}
                  <div className="relative my-4 flex items-center justify-between">
                    <div className="w-full border-t-2 border-dashed border-line/80" />
                  </div>

                  {/* Pass Footer */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs text-ink-soft">
                      <Clock className="w-4 h-4 text-brand-500" />
                      <span>08:00 – 22:00 Daily</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">Price</span>
                      <span className="font-display font-black text-lg text-brand-600">
                        40,000 <span className="text-xs font-sans font-semibold text-slate-500">UZS / day</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Key Metric Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-10 border-t border-white/15">
            {[
              { stat: "100%", label: "Verified Locations", desc: "Hand-picked storage partners" },
              { stat: "< 2 min", label: "Instant Booking", desc: "No paper, QR check-in & out" },
              { stat: "$500+", label: "Luggage Guarantee", desc: "Comprehensive item insurance" },
              { stat: "24/7", label: "Customer Care", desc: "Telegram & WhatsApp support" },
            ].map((m, idx) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * idx }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs"
              >
                <div className="font-display font-black text-2xl sm:text-3xl text-white">
                  {m.stat}
                </div>
                <div className="text-xs sm:text-sm font-bold text-brand-400 mt-0.5">{m.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{m.desc}</div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* FLOATING SEARCH BAR */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 -mt-8 z-20 w-full">
        <form
          onSubmit={handleSearch}
          className="glass-panel rounded-3xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-center shadow-2xl border border-line"
        >
          <div className="flex-1 flex items-center gap-3 w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200/70 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
            <MapPin className="w-5 h-5 text-brand-500 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder={t.homePage.searchPlaceholder}
              className="w-full bg-transparent text-sm sm:text-base text-ink placeholder:text-slate-400 focus:outline-none font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold rounded-2xl px-8 py-3.5 text-sm sm:text-base flex items-center justify-center gap-2 shadow-glow-brand transition-all duration-200 active:scale-95 shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>{t.homePage.search}</span>
          </button>
        </form>
      </section>

      {/* INTERACTIVE MAP SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200/60 mb-2">
              <Compass className="w-3.5 h-3.5" />
              Explore Storage Points
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-ink">
              {t.homePage.mapTitle}
            </h2>
            <p className="text-sm sm:text-base text-ink-soft mt-1.5 max-w-xl">
              {t.homePage.mapDescription}
            </p>
          </div>

          <Link
            href="/locations"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100/70 border border-brand-200 px-4 py-2.5 rounded-2xl transition-all self-start sm:self-auto"
          >
            <span>View All ({activeLocations.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {locationsLoading ? (
          <MapSkeleton />
        ) : (
          <MapSection locations={locations} />
        )}
      </section>

      {/* HOW IT WORKS SECTION */}
      <section
        id="how"
        className="relative bg-sand/30 border-y border-line py-20 sm:py-28 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-600 bg-white px-3 py-1 rounded-full border border-brand-200/60 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              Simple 6-Step Flow
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-ink">
              {t.homePage.howItWorks}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
            {steps.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={i}
                  className="group relative bg-white border border-line hover:border-brand-500/40 rounded-3xl p-6 shadow-card-modern hover:shadow-card-hover flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-display font-extrabold text-sm group-hover:bg-brand-500 group-hover:text-white transition-colors">
                        0{i + 1}
                      </div>
                      <StepIcon className="w-5 h-5 text-slate-400 group-hover:text-brand-500 transition-colors" />
                    </div>
                    <p className="text-sm font-semibold text-ink leading-relaxed">
                      {step.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BENTO GRID: WHY CHOOSE BAGDROP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/60 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            Safety & Reliability
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">
            {t.homePage.whyTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {valueProps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group relative bg-white border border-line hover:border-brand-500/40 rounded-3xl p-7 shadow-card-modern hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1.5"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${item.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-7 h-7 stroke-[2.2]" />
                </div>
                <h3 className="font-display font-bold text-lg text-ink mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed font-normal">
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ SECTION WITH FRAMER MOTION ACCORDION */}
      <section className="bg-sand/30 border-t border-line py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 bg-white px-3 py-1 rounded-full border border-brand-200/60 shadow-2xs">
              Got Questions?
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">
              {t.homePage.faqTitle}
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={f.q}
                  className="bg-white border border-line rounded-3xl overflow-hidden shadow-card-modern transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full text-left px-6 py-5 flex justify-between items-center gap-4 font-display font-bold text-base text-ink hover:text-brand-600 transition-colors"
                  >
                    <span>{f.q}</span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 shrink-0 ${
                        isOpen ? "bg-brand-500 text-white rotate-180" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 pt-1 text-sm text-ink-soft border-t border-slate-100 leading-relaxed font-normal">
                          {f.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CITIES COVERED SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">
            {t.homePage.citiesTitle}
          </h2>
          <p className="text-sm text-ink-soft">
            Discover secure left-luggage network expanding across the Silk Road.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Active: Samarkand */}
          <Link
            href="/locations"
            className="group relative bg-white border-2 border-brand-500 rounded-3xl p-6 shadow-card-modern hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1.5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">🏛️</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Now
              </span>
            </div>
            <h3 className="font-display font-extrabold text-xl text-ink group-hover:text-brand-600 transition-colors">
              {t.homePage.samarkand}
            </h3>
            <p className="text-xs text-ink-soft mt-1">
              {activeLocations.length} {t.homePage.locationsLive}
            </p>
          </Link>

          {/* Coming Soon Cities */}
          {[
            { name: t.homePage.tashkent, icon: "🏙️" },
            { name: t.homePage.bukhara, icon: "🕌" },
            { name: t.homePage.khiva, icon: "🏰" },
          ].map((city) => (
            <div
              key={city.name}
              className="bg-white/60 border border-line rounded-3xl p-6 opacity-75 backdrop-blur-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{city.icon}</span>
                <span className="text-[11px] font-bold uppercase bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
                  {t.homePage.comingSoon}
                </span>
              </div>
              <h3 className="font-display font-bold text-xl text-ink/80">
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