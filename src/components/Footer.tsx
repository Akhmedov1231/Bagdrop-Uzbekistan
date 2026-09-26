"use client";

import { BRAND } from "@/lib/config";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { Luggage, MapPin, Mail, Phone, ShieldCheck, Heart, Sparkles, Send } from "lucide-react";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative bg-ink-deep text-white border-t border-line-dark overflow-hidden mt-20">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          
          {/* BRAND COLUMN */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-400 flex items-center justify-center shadow-glow-brand">
                <Luggage className="w-5 h-5 text-white stroke-[2.2]" />
              </div>
              <span className="font-display font-extrabold text-2xl tracking-tight text-white">
                {BRAND.name}
                <span className="text-brand-400 text-xs ml-1.5 font-sans font-bold uppercase tracking-wider bg-brand-500/20 px-2 py-0.5 rounded-full border border-brand-400/30">
                  UZ
                </span>
              </span>
            </Link>

            <p className="text-sm text-slate-300 max-w-md leading-relaxed">
              {t.footerText}
            </p>

            {/* Trust badge */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>100% Insured & Verified Luggage Points</span>
              </div>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-slate-300 hover:text-brand-400 transition-colors flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  {t.home}
                </Link>
              </li>
              <li>
                <Link href="/locations" className="text-slate-300 hover:text-brand-400 transition-colors flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  {t.locations}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-300 hover:text-brand-400 transition-colors">
                  {t.contact}
                </Link>
              </li>
              <li>
                <Link href="/partner/login" className="text-slate-300 hover:text-brand-400 transition-colors">
                  {t.partnerLogin}
                </Link>
              </li>
            </ul>
          </div>

          {/* CONTACT & SUPPORT */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Support & Inquiries
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <a
                  href="mailto:bagdropuz@gmail.com"
                  className="flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                    <Mail className="w-3.5 h-3.5 text-brand-400" />
                  </div>
                  <span>bagdropuz@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/bagdropuz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                    <Send className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                  <span>@bagdropuz (Telegram 24/7)</span>
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span>Samarkand & Tashkent, Uzbekistan 🇺🇿</span>
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Crafted for travelers in Uzbekistan <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
          </p>
        </div>
      </div>
    </footer>
  );
}