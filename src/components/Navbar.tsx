"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BRAND } from "@/lib/config";
import { useLanguage, type Language } from "@/lib/i18n";
import {
  Luggage,
  Compass,
  MapPin,
  Headphones,
  Store,
  Globe,
  Menu,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const LINKS = [
  { href: "/", labelKey: "home", icon: Compass },
  { href: "/locations", labelKey: "locations", icon: MapPin },
  { href: "/contact", labelKey: "contact", icon: Headphones },
  { href: "/partner/login", labelKey: "partnerLogin", icon: Store },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const navLabels: Record<string, string> = {
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
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-cream/80 border-b border-line transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4 py-3.5">
        {/* LOGO */}
        <Link
          href="/"
          className="group flex items-center gap-3 font-display font-bold text-xl tracking-tight text-ink hover:opacity-95 transition-transform duration-200 active:scale-95 shrink-0"
        >
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-amber-400 flex items-center justify-center shadow-glow-brand group-hover:shadow-lg transition-all duration-300">
            <Luggage className="w-5 h-5 text-white stroke-[2.2] group-hover:rotate-6 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold bg-gradient-to-r from-ink via-ink-deep to-ink-soft bg-clip-text text-transparent">
              {BRAND.name}
            </span>
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-brand-500/10 text-brand-600 border border-brand-500/20 px-2 py-0.5 rounded-full">
              UZ
            </span>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center gap-1 bg-white/70 p-1.5 rounded-full border border-line shadow-xs">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(link.href);
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                  active
                    ? "text-brand-600 font-bold"
                    : "text-ink-soft hover:text-ink hover:bg-black/5"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 bg-brand-500/10 border border-brand-500/20 rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 ${active ? "text-brand-600" : "text-ink-muted"}`} />
                <span>{navLabels[link.labelKey]}</span>
              </Link>
            );
          })}
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-3">
          {/* LANGUAGE SELECTOR */}
          <div className="relative flex items-center bg-white/80 border border-line rounded-full px-3 py-1.5 shadow-xs hover:border-brand-500/30 transition-colors">
            <Globe className="w-3.5 h-3.5 text-ink-muted mr-1.5" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              aria-label={t.language}
              className="bg-transparent border-none text-xs font-bold text-ink cursor-pointer focus:outline-none uppercase pr-1 tracking-wider"
            >
              <option value="uz">🇺🇿 UZ</option>
              <option value="ru">🇷🇺 RU</option>
              <option value="en">🇬🇧 EN</option>
            </select>
          </div>

          {/* FIND STORAGE BUTTON */}
          <Link
            href="/locations"
            className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-glow-brand hover:shadow-lg transition-all duration-200 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.findStorage}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* MOBILE TOGGLE */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-2xl border border-line text-ink hover:bg-white/80 transition-colors active:scale-90"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-ink" />
            ) : (
              <Menu className="w-5 h-5 text-ink" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-line bg-cream/95 backdrop-blur-xl px-5 py-4"
          >
            <div className="flex flex-col gap-2">
              {LINKS.map((link) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname?.startsWith(link.href);
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? "bg-brand-500/10 text-brand-600 font-bold border border-brand-500/20"
                        : "text-ink hover:bg-white/70"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-brand-600" : "text-ink-muted"}`} />
                    <span>{navLabels[link.labelKey]}</span>
                  </Link>
                );
              })}

              <Link
                href="/locations"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold text-sm py-3.5 rounded-2xl shadow-glow-brand active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t.findStorage}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}