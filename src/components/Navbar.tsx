"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/config";
import { useLanguage, type Language } from "@/lib/i18n";

const LINKS = [
  { href: "/", label: "home" },
  { href: "/locations", label: "locations" },
  { href: "/contact", label: "contact" },
  { href: "/partner/login", label: "partnerLogin" },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { language, setLanguage, t } = useLanguage();

  const navLabels = {
    home: t.home,
    locations: t.locations,
    contact: t.contact,
    partnerLogin: t.partnerLogin,
  };

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "uz", label: "O'zbek", flag: "🇺🇿" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "en", label: "English", flag: "🇬🇧" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-line transition-all">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-slab font-bold text-xl tracking-tight text-ink hover:opacity-90 transition-opacity shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-clay-dark via-clay to-[#f3a45c] flex items-center justify-center shadow-sm">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-white"
              fill="currentColor"
            >
              <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-9-1a2 2 0 0 1 4 0v1h-4V6zm9 13H5V9h14v10z" />
            </svg>
          </div>
          <span>
            {BRAND.name}
            <span className="text-clay text-xs ml-1 font-sans font-semibold tracking-normal uppercase bg-clay/10 px-1.5 py-0.5 rounded">
              UZ
            </span>
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`py-1 relative font-medium transition-colors ${
                  active
                    ? "text-clay font-semibold"
                    : "text-ink/80 hover:text-ink"
                }`}
              >
                {navLabels[link.label]}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-clay rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT SIDE ACTIONS */}
        <div className="flex items-center gap-2.5">
          {/* LANGUAGE SELECTOR */}
          <div className="relative flex items-center bg-white/80 border border-line rounded-xl px-2 py-1 shadow-xs hover:border-line/80 transition-colors">
            <span className="text-xs mr-1.5">
              {languages.find((l) => l.code === language)?.flag || "🌐"}
            </span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              aria-label={t.language}
              className="bg-transparent border-none text-xs font-semibold text-ink cursor-pointer focus:outline-none uppercase pr-1"
            >
              <option value="uz">UZ</option>
              <option value="ru">RU</option>
              <option value="en">EN</option>
            </select>
          </div>

          {/* FIND STORAGE CTA */}
          <Link
            href="/locations"
            className="hidden sm:inline-flex items-center gap-1.5 bg-clay hover:bg-clay-dark text-white text-xs sm:text-sm font-semibold rounded-xl px-4 py-2.5 shadow-sm hover:shadow transition-all duration-200 active:scale-95"
          >
            <span>🔍</span>
            {t.findStorage}
          </Link>

          {/* MOBILE MENU TOGGLE BUTTON */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-line text-ink hover:bg-white/80 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-line bg-cream/98 px-6 py-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-3">
            {LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm py-2 px-3 rounded-lg font-medium transition-colors ${
                    active
                      ? "bg-clay/10 text-clay font-bold"
                      : "text-ink/80 hover:bg-black/5"
                  }`}
                >
                  {navLabels[link.label]}
                </Link>
              );
            })}

            <Link
              href="/locations"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 text-center bg-clay text-white text-sm font-semibold rounded-xl py-3 shadow-sm"
            >
              {t.findStorage}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}