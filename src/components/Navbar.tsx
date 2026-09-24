"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/config";
import {
  useLanguage,
  type Language,
} from "@/lib/i18n";

const LINKS = [
  {
    href: "/",
    label: "home",
  },
  {
    href: "/locations",
    label: "locations",
  },
  {
    href: "/contact",
    label: "contact",
  },
  {
    href: "/partner/login",
    label: "partnerLogin",
  },
  {
    href: "/admin/login",
    label: "admin",
  },
] as const;

export default function Navbar() {
  const pathname = usePathname();

  const {
    language,
    setLanguage,
    t,
  } = useLanguage();

  const navLabels = {
    home: t.home,
    locations: t.locations,
    contact: t.contact,
    partnerLogin: t.partnerLogin,
    admin: t.admin,
  };

  return (
    <header className="sticky top-0 z-50 bg-cream border-b border-line">
      <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between gap-4">

        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center gap-2 font-slab font-bold text-xl shrink-0"
        >
          <svg
            viewBox="0 0 26 26"
            className="w-6 h-6"
            fill="none"
          >
            <rect
              x="4"
              y="8"
              width="18"
              height="15"
              rx="2"
              fill="#e0883c"
            />

            <rect
              x="9"
              y="3"
              width="8"
              height="6"
              rx="1.4"
              stroke="#1b2a3a"
              strokeWidth="1.8"
              fill="none"
            />

            <rect
              x="4"
              y="8"
              width="18"
              height="15"
              rx="2"
              stroke="#1b2a3a"
              strokeWidth="1.3"
              fill="none"
            />
          </svg>

          {BRAND.name}
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`pb-1 border-b-2 transition-colors ${
                  active
                    ? "border-clay"
                    : "border-transparent hover:border-ink/30"
                }`}
              >
                {navLabels[link.label]}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2">

          {/* LANGUAGE */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) =>
                setLanguage(
                  e.target.value as Language
                )
              }
              aria-label={t.language}
              className="appearance-none bg-transparent border border-line rounded px-3 py-2 pr-7 text-xs font-semibold text-ink cursor-pointer hover:bg-white transition-colors"
            >
              <option value="uz">
                UZ
              </option>

              <option value="ru">
                RU
              </option>

              <option value="en">
                EN
              </option>
            </select>

            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs">
              ▾
            </span>
          </div>

          {/* FIND STORAGE */}
          <Link
            href="/locations"
            className="hidden sm:inline-flex bg-clay hover:bg-clay-dark text-white text-sm font-semibold rounded px-4 py-2.5 transition-colors"
          >
            {t.findStorage}
          </Link>
        </div>
      </div>

      {/* MOBILE NAVIGATION */}
      <div className="lg:hidden border-t border-line bg-cream">
        <nav className="max-w-[1100px] mx-auto px-6 py-3 flex items-center gap-5 overflow-x-auto text-xs font-medium">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap pb-1 border-b-2 ${
                  active
                    ? "border-clay"
                    : "border-transparent"
                }`}
              >
                {navLabels[link.label]}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}