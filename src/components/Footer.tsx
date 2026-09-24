"use client";

import { BRAND } from "@/lib/config";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-line bg-sand mt-10">
      <div className="max-w-[1100px] mx-auto px-6 py-8">

        <div className="flex flex-col md:flex-row justify-between gap-6">

          {/* BRAND */}
          <div>
            <div className="font-slab font-bold text-lg">
              {BRAND.name}
            </div>

            <p className="text-sm text-ink-soft mt-1 max-w-sm">
              {t.footerText}
            </p>
          </div>

          {/* LINKS */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link
              href="/"
              className="hover:text-ink"
            >
              {t.home}
            </Link>

            <Link
              href="/locations"
              className="hover:text-ink"
            >
              {t.locations}
            </Link>

            <Link
              href="/contact"
              className="hover:text-ink"
            >
              {t.contact}
            </Link>

            <Link
              href="/partner/login"
              className="hover:text-ink"
            >
              {t.partnerLogin}
            </Link>
          </div>

        </div>

        <div className="border-t border-line mt-6 pt-5 flex flex-col sm:flex-row justify-between gap-2 text-sm text-ink-soft">

          <span>
            © {new Date().getFullYear()}{" "}
            {BRAND.name}
          </span>

          <span>
            Uzbekistan
          </span>

          <a
            href="mailto:bagdropuz@gmail.com"
            className="hover:text-ink"
          >
            bagdropuz@gmail.com
          </a>

        </div>
      </div>
    </footer>
  );
}