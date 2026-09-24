"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import MapSection from "@/components/MapSection";
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



export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [locations, setLocations] =
    useState<ApiLocation[]>([]);

  const [locationsLoading, setLocationsLoading] =
    useState(true);

  useEffect(() => {
    async function loadLocations() {
      try {
        setLocationsLoading(true);

        const response = await fetch(
          "/api/locations",
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        console.log(
          "HOMEPAGE LOCATIONS:",
          result
        );

        if (!response.ok || !result.ok) {
          throw new Error(
            result.error ||
              "Failed to load locations."
          );
        }

        setLocations(
          Array.isArray(result.locations)
            ? result.locations
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load homepage locations:",
          error
        );

        setLocations([]);
      } finally {
        setLocationsLoading(false);
      }
    }

    loadLocations();
  }, []);

  function handleSearch(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    router.push(
      query
        ? `/locations?q=${encodeURIComponent(query)}`
        : "/locations"
    );
  }

  const activeLocationCount =
    locations.filter(
      (location) => location.active
    ).length;

  return (
    <div>
      {/* HERO */}
      <div className="relative bg-ink text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.13] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent 0 38px, rgba(255,255,255,.5) 38px 40px), repeating-linear-gradient(-45deg, transparent 0 38px, rgba(255,255,255,.5) 38px 40px)",
          }}
        />

        <div className="relative max-w-[1100px] mx-auto px-6 pt-20 pb-16">
          <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/25 rounded-full px-3.5 py-1.5 text-[12.5px] mb-4">
            📍 {t.homePage.liveNow}{" "}
            <b className="text-clay">
              {t.homePage.samarkand}
            </b>
          </div>

          <h1 className="font-slab font-bold text-[32px] sm:text-[46px] leading-[1.06] max-w-[11em]">
            {t.homePage.heroTitle}
          </h1>

          <p className="mt-4 text-[17px] text-[#cfd9e0] max-w-[32em]">
            {t.homePage.heroDescription}
          </p>

          <div className="flex gap-3 mt-7 flex-wrap">
            <Link
              href="/locations"
              className="bg-clay hover:bg-clay-dark text-white font-semibold rounded px-6 py-3.5 text-[15px] transition-colors"
            >
              {t.homePage.findStorage}
            </Link>

            <a
              href="#how"
              className="border border-white/50 hover:bg-white/10 text-white font-semibold rounded px-6 py-3.5 text-[15px] transition-colors"
            >
              {t.homePage.howItWorks}
            </a>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="max-w-[1100px] mx-auto px-6">
        <form
          onSubmit={handleSearch}
          className="relative bg-white rounded shadow-[0_20px_44px_rgba(15,25,35,0.16)] p-5 -mt-9 flex gap-2.5"
        >
          <input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            type="text"
            placeholder={t.homePage.searchPlaceholder}
            className="flex-1 border border-line rounded px-3.5 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-teal"
          />

          <button
            type="submit"
            className="bg-teal hover:bg-teal-dark text-white font-semibold rounded px-5 py-3"
          >
            {t.homePage.search}
          </button>
        </form>
      </div>

      {/* REAL MAP */}
      <section className="max-w-[1100px] mx-auto px-6 py-16">
        <div className="mb-6">
          <h2 className="font-slab font-bold text-[26px]">
            {t.homePage.mapTitle}
          </h2>

          <p className="text-[14px] text-ink-soft mt-2">
            {t.homePage.mapDescription}
          </p>
        </div>

        {locationsLoading ? (
          <div className="h-[430px] rounded-xl bg-sand flex items-center justify-center text-sm text-ink-soft">
            {t.common.loading}
          </div>
        ) : (
          <MapSection locations={locations} />
        )}
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how"
        className="max-w-[1100px] mx-auto px-6 py-16"
      >
        <h2 className="font-slab font-bold text-[26px] mb-6">
          {t.homePage.howItWorks}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4 border-t border-line pt-6">
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
              className="text-[13px]"
            >
              <span className="font-slab font-bold text-clay text-[15px] block mb-2">
                {String(i + 1).padStart(2, "0")}
              </span>

              <p className="text-ink-soft">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY BAGDROP */}
      <section className="max-w-[1100px] mx-auto px-6 py-16">
        <h2 className="font-slab font-bold text-[26px] mb-6">
          {t.homePage.whyTitle}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ["✅", t.homePage.verifiedPartners, t.homePage.verifiedPartnersText],
            ["🎫", t.homePage.qrCheckin, t.homePage.qrCheckinText],
            ["🏷️", t.homePage.luggageTags, t.homePage.luggageTagsText],
            ["💳", t.homePage.securePayment, t.homePage.securePaymentText],
          ].map(
            ([icon, title, body]) => (
              <div
                key={title}
                className="bg-white border border-line rounded p-4.5"
              >
                <div className="text-xl mb-2.5">
                  {icon}
                </div>

                <h3 className="font-semibold text-[14.5px] mb-1">
                  {title}
                </h3>

                <p className="text-[12.5px] text-ink-soft">
                  {body}
                </p>
              </div>
            )
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-[1100px] mx-auto px-6 py-16">
        <h2 className="font-slab font-bold text-[26px] mb-6">
          {t.homePage.faqTitle}
        </h2>

        <div>
          {[
            { q: t.homePage.faq1q, a: t.homePage.faq1a },
            { q: t.homePage.faq2q, a: t.homePage.faq2a },
            { q: t.homePage.faq3q, a: t.homePage.faq3a },
            { q: t.homePage.faq4q, a: t.homePage.faq4a },
          ].map((f, i) => (
            <div
              key={f.q}
              className="border-b border-line py-4 cursor-pointer"
              onClick={() =>
                setOpenFaq(
                  openFaq === i ? null : i
                )
              }
            >
              <div className="flex justify-between font-semibold text-[14.5px]">
                <span>{f.q}</span>
                <span>
                  {openFaq === i ? "−" : "+"}
                </span>
              </div>

              {openFaq === i && (
                <p className="text-[13.5px] text-ink-soft mt-2 max-w-[44em]">
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CITIES */}
      <section className="max-w-[1100px] mx-auto px-6 pb-16">
        <h2 className="font-slab font-bold text-[26px] mb-6">
          {t.homePage.citiesTitle}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/locations"
            className="bg-white border border-line rounded p-4.5 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-[14.5px]">
              {t.homePage.samarkand}
            </h3>

            <p className="text-[12.5px] text-ink-soft">
              {activeLocationCount} {t.homePage.locationsLive}
            </p>
          </Link>

          {[
            t.homePage.tashkent,
            t.homePage.bukhara,
            t.homePage.khiva,
          ].map((city) => (
            <div
              key={city}
              className="bg-white border border-line rounded p-4.5 opacity-50"
            >
              <h3 className="font-semibold text-[14.5px]">
                {city}
              </h3>

              <p className="text-[12.5px] text-ink-soft">
                {t.homePage.comingSoon}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}