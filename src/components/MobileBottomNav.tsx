"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import { Compass, MapPin, Headphones, Store } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const items = [
    {
      href: "/",
      label: t.home,
      icon: Compass,
    },
    {
      href: "/locations",
      label: t.locations,
      icon: MapPin,
    },
    {
      href: "/contact",
      label: t.contact,
      icon: Headphones,
    },
    {
      href: "/partner/login",
      label: t.partnerLogin,
      icon: Store,
    },
  ];

  return (
    <div className="sm:hidden fixed bottom-3 left-4 right-4 z-40">
      <nav className="glass-panel backdrop-blur-2xl bg-white/90 border border-line shadow-2xl rounded-3xl px-3 py-2 flex items-center justify-around">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center py-1 px-3 rounded-2xl transition-all"
            >
              {active && (
                <motion.div
                  layoutId="mobile-nav-glow"
                  className="absolute inset-0 bg-brand-500/15 rounded-2xl -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div
                className={`p-1.5 rounded-xl transition-transform ${
                  active ? "text-brand-600 scale-110" : "text-slate-500"
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span
                className={`text-[11px] tracking-tight font-medium ${
                  active ? "text-brand-600 font-bold" : "text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
