"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import {
  MessageCircle,
  Mail,
  Phone,
  Send,
  Store,
  MapPin,
  ArrowRight,
  Headphones,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const CONTACT_EMAIL = "bagdropuz@gmail.com";
const CONTACT_PHONE = "+998 94 267 12 31";
const CONTACT_PHONE_LINK = "+998942671231";
const WHATSAPP_LINK = "https://wa.me/998942671231";
const TELEGRAM_LINK = "https://t.me/bagdropuz";

const CONTACT_TEXT = {
  uz: {
    label: "Bog‘lanish",
    title: "Biz bilan bog‘laning.",
    description:
      "BagDrop haqida savolingiz bormi, bron bo‘yicha yordam kerakmi yoki hamkor bo‘lishni xohlaysizmi? Bizga yozing.",
    supportTitle: "Tezkor Yordam (24/7)",
    supportText:
      "Savollaringiz bormi? Telegram yoki WhatsApp orqali bir zumda javob oling.",
    whatsapp: "WhatsApp Chat",
    telegram: "Telegram 24/7",
    email: "Email Murojaat",
    emailText: "Rasmiy xatlar va takliflar uchun.",
    phone: "Telefon Qo‘ng‘iroq",
    phoneText: "Operator bilan to‘g‘ridan-to‘g‘ri gaplashing.",
    partnerTitle: "BagDrop tarmog‘i hamkori bo‘ling",
    partnerText:
      "Do‘kon, mehmonxona, hostel yoki kafeingiz bormi? Bo‘sh joyingizdan qo‘shimcha daromad oling va sayyohlarni jalb qiling.",
    locationTitle: "Bizning Bosh Ofisimiz",
    locationText:
      "BagDrop hozirda Samarqand bo‘ylab faol xizmat ko‘rsatmoqda. Toshkent va Buxoro tez orada ochiladi.",
    locationsButton: "Joylarni ko‘rish",
    city: "Samarqand, O‘zbekiston",
  },
  ru: {
    label: "Контакты",
    title: "Свяжитесь с нами.",
    description:
      "Есть вопрос о BagDrop, нужна помощь с бронированием или хотите стать партнёром? Напишите нам.",
    supportTitle: "Поддержка (24/7)",
    supportText:
      "Нужна быстрая помощь? Свяжитесь с нами через WhatsApp или Telegram.",
    whatsapp: "WhatsApp Чат",
    telegram: "Telegram 24/7",
    email: "Email Поддержка",
    emailText: "Для официальных запросов и предложений.",
    phone: "Телефонная Связь",
    phoneText: "Позвоните нам для оперативной помощи.",
    partnerTitle: "Станьте партнёром BagDrop",
    partnerText:
      "У вас отель, кафе, магазин или хостел? Монетизируйте свободное место и привлекайте больше туристов.",
    locationTitle: "Локации сети",
    locationText:
      "Сейчас BagDrop работает в Самарканде. Новые города (Ташкент, Бухара) открываются скоро.",
    locationsButton: "Посмотреть пункты",
    city: "Самарканд, Узбекистан",
  },
  en: {
    label: "Contact & Support",
    title: "Get in touch with BagDrop.",
    description:
      "Have a question, need assistance with your luggage booking, or want to become a storage partner? We are here 24/7.",
    supportTitle: "Instant Support (24/7)",
    supportText:
      "Need prompt help? Reach out directly via Telegram or WhatsApp messaging.",
    whatsapp: "WhatsApp Chat",
    telegram: "Telegram 24/7",
    email: "Email Support",
    emailText: "Send inquiries, feedback, or partnership requests.",
    phone: "Direct Phone Call",
    phoneText: "Speak with our support team directly.",
    partnerTitle: "Become a BagDrop Luggage Partner",
    partnerText:
      "Own a cafe, shop, hotel, or hostel? Monetize your unused secure space and welcome international travelers.",
    locationTitle: "Active Headquarters & Operations",
    locationText:
      "BagDrop currently operates in Samarkand. Tashkent, Bukhara, and Khiva expanding soon.",
    locationsButton: "Explore Storage Points",
    city: "Samarkand, Uzbekistan",
  },
} as const;

export default function ContactPage() {
  const { language } = useLanguage();
  const text = CONTACT_TEXT[language] || CONTACT_TEXT.en;

  return (
    <main className="min-h-screen bg-cream">
      
      {/* HERO SECTION */}
      <section className="relative bg-ink-deep text-white overflow-hidden py-16 sm:py-24">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl space-y-4"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-400 bg-brand-500/20 border border-brand-400/30 px-3.5 py-1 rounded-full">
              <Headphones className="w-3.5 h-3.5" />
              {text.label}
            </span>

            <h1 className="font-display font-black text-4xl sm:text-6xl text-white tracking-tight">
              {text.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
              {text.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* CONTACT CARDS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Instant Messaging (Telegram / WhatsApp) */}
          <div className="bg-white border border-line rounded-3xl p-7 shadow-card-modern hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5">
                <MessageCircle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-display font-bold text-xl text-ink">
                {text.supportTitle}
              </h3>
              <p className="text-xs sm:text-sm text-ink-soft mt-2 leading-relaxed font-normal">
                {text.supportText}
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 mt-6">
              <a
                href={TELEGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{text.telegram}</span>
              </a>

              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-ink px-4 py-2.5 text-xs font-bold transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{text.whatsapp}</span>
              </a>
            </div>
          </div>

          {/* Email Support */}
          <div className="bg-white border border-line rounded-3xl p-7 shadow-card-modern hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
                <Mail className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-display font-bold text-xl text-ink">
                {text.email}
              </h3>
              <p className="text-xs sm:text-sm text-ink-soft mt-2 leading-relaxed font-normal">
                {text.emailText}
              </p>
            </div>

            <div className="mt-6">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 bg-brand-50 border border-brand-200/60 px-4 py-3 rounded-2xl transition-all"
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span>{CONTACT_EMAIL}</span>
              </a>
            </div>
          </div>

          {/* Phone Hotline */}
          <div className="bg-white border border-line rounded-3xl p-7 shadow-card-modern hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                <Phone className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-display font-bold text-xl text-ink">
                {text.phone}
              </h3>
              <p className="text-xs sm:text-sm text-ink-soft mt-2 leading-relaxed font-normal">
                {text.phoneText}
              </p>
            </div>

            <div className="mt-6">
              <a
                href={`tel:${CONTACT_PHONE_LINK}`}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-ink bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-3 rounded-2xl transition-all"
              >
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{CONTACT_PHONE}</span>
              </a>
            </div>
          </div>

        </div>

        {/* PARTNER BANNER */}
        <div className="mt-10 bg-white border border-line rounded-4xl p-8 sm:p-10 shadow-card-modern">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                <Store className="w-3.5 h-3.5" />
                <span>Partnership Opportunity</span>
              </div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">
                {text.partnerTitle}
              </h2>
              <p className="text-sm text-ink-soft leading-relaxed font-normal">
                {text.partnerText}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                href="/partner/login"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs sm:text-sm rounded-2xl px-6 py-3.5 shadow-glow-brand transition-all"
              >
                <Store className="w-4 h-4" />
                <span>Partner Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* LOCATION HUB BANNER */}
        <div className="mt-8 bg-white border border-line rounded-4xl p-8 sm:p-10 shadow-card-modern">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-500" />
                <h3 className="font-display font-bold text-xl text-ink">
                  {text.locationTitle}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-ink-soft font-normal">
                {text.locationText}
              </p>
              <p className="font-display font-bold text-sm text-ink pt-1">
                📍 {text.city}
              </p>
            </div>

            <Link
              href="/locations"
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-ink font-bold text-xs sm:text-sm rounded-2xl px-5 py-3 transition-colors shrink-0"
            >
              <span>{text.locationsButton}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}