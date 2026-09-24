"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

const CONTACT_EMAIL =
  "bagdropuz@gmail.com";

const CONTACT_PHONE =
  "+998 94 267 12 31";

const CONTACT_PHONE_LINK =
  "+998942671231";

const WHATSAPP_LINK =
  "https://wa.me/998942671231";

const TELEGRAM_LINK =
  "https://t.me/+998942671231";

const CONTACT_TEXT = {
  uz: {
    label: "Bog‘lanish",
    title: "Biz bilan bog‘laning.",
    description:
      "BagDrop haqida savolingiz bormi, bron bo‘yicha yordam kerakmi yoki hamkor bo‘lishni xohlaysizmi? Bizga yozing.",

    supportTitle: "Qo‘llab-quvvatlash",
    supportText:
      "Tezkor yordam kerakmi? WhatsApp yoki Telegram orqali biz bilan bog‘laning.",

    whatsapp: "WhatsApp",
    telegram: "Telegram",

    email: "Email",
    emailText:
      "Savollaringizni email orqali yuboring.",

    phone: "Telefon",
    phoneText:
      "Biz bilan telefon orqali bog‘laning.",

    partnerTitle:
      "BagDrop hamkori bo‘ling",

    partnerText:
      "Do‘kon, hostel, mehmonxona, kafe yoki boshqa biznesingiz bo‘lsa, yuk saqlash nuqtasi sifatida tarmoqqa qo‘shiling. Hamkorlik bo‘yicha bizga email yoki telefon orqali murojaat qiling.",

    locationTitle:
      "Bizning joylashuvimiz",

    locationText:
      "BagDrop hozir Samarqandda ishlamoqda. Yangi shaharlar bosqichma-bosqich qo‘shiladi.",

    locationsButton:
      "Joylarni ko‘rish",

    city:
      "Samarqand, O‘zbekiston",
  },

  ru: {
    label: "Контакты",
    title: "Свяжитесь с нами.",
    description:
      "Есть вопрос о BagDrop, нужна помощь с бронированием или хотите стать партнёром? Напишите нам.",

    supportTitle: "Поддержка",
    supportText:
      "Нужна быстрая помощь? Свяжитесь с нами через WhatsApp или Telegram.",

    whatsapp: "WhatsApp",
    telegram: "Telegram",

    email: "Email",
    emailText:
      "Отправьте нам свой вопрос по электронной почте.",

    phone: "Телефон",
    phoneText:
      "Свяжитесь с нами по телефону.",

    partnerTitle:
      "Станьте партнёром BagDrop",

    partnerText:
      "Если у вас магазин, хостел, отель, кафе или другой бизнес, присоединитесь к сети как пункт хранения багажа. По вопросам партнёрства свяжитесь с нами по email или телефону.",

    locationTitle:
      "Наше расположение",

    locationText:
      "Сейчас BagDrop работает в Самарканде. Новые города будут добавляться постепенно.",

    locationsButton:
      "Посмотреть пункты",

    city:
      "Самарканд, Узбекистан",
  },

  en: {
    label: "Contact",
    title: "Get in touch.",
    description:
      "Have a question about BagDrop, need help with a booking, or want to become a partner? Send us a message.",

    supportTitle: "Support",
    supportText:
      "Need quick help? Contact us via WhatsApp or Telegram.",

    whatsapp: "WhatsApp",
    telegram: "Telegram",

    email: "Email",
    emailText:
      "Send us your question by email.",

    phone: "Phone",
    phoneText:
      "Call us if you need help.",

    partnerTitle:
      "Become a BagDrop partner",

    partnerText:
      "Have a shop, hostel, hotel, café, or another local business? Join our network as a luggage storage location. Contact us by email or phone to discuss partnership.",

    locationTitle:
      "Where we operate",

    locationText:
      "BagDrop currently operates in Samarkand. More cities will be added gradually.",

    locationsButton:
      "View locations",

    city:
      "Samarkand, Uzbekistan",
  },
} as const;

export default function ContactPage() {
  const { language } = useLanguage();

  const text =
    CONTACT_TEXT[language];

  return (
    <main className="min-h-screen bg-cream">

      {/* ============================================
          HERO
      ============================================ */}

      <section className="bg-ink text-white">
        <div className="max-w-[1100px] mx-auto px-6 py-16 md:py-20">

          <p className="text-xs uppercase tracking-[0.18em] text-[#cfd9e0]">
            {text.label}
          </p>

          <h1 className="font-slab font-bold text-4xl md:text-5xl mt-3 max-w-2xl">
            {text.title}
          </h1>

          <p className="text-[#d7e0e5] mt-5 max-w-2xl leading-7">
            {text.description}
          </p>

        </div>
      </section>

      {/* ============================================
          CONTACT CARDS
      ============================================ */}

      <section className="max-w-[1100px] mx-auto px-6 py-12 md:py-16">

        <div className="grid md:grid-cols-3 gap-5">

          {/* ========================================
              SUPPORT
          ======================================== */}

          <div className="bg-white border border-line rounded-xl p-6">

            <div className="w-10 h-10 rounded-lg bg-sand flex items-center justify-center text-xl">
              💬
            </div>

            <h2 className="font-slab font-bold text-xl mt-5">
              {text.supportTitle}
            </h2>

            <p className="text-sm text-ink-soft leading-6 mt-3">
              {text.supportText}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">

              {/* WHATSAPP */}

              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-sand px-4 py-2.5 text-sm font-semibold text-ink hover:bg-line transition-colors"
              >
                <span>💬</span>

                <span>
                  {text.whatsapp}
                </span>
              </a>

              {/* TELEGRAM */}

              <a
                href={TELEGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-sand px-4 py-2.5 text-sm font-semibold text-ink hover:bg-line transition-colors"
              >
                <span>✈️</span>

                <span>
                  {text.telegram}
                </span>
              </a>

            </div>

          </div>

          {/* ========================================
              EMAIL
          ======================================== */}

          <div className="bg-white border border-line rounded-xl p-6">

            <div className="w-10 h-10 rounded-lg bg-sand flex items-center justify-center text-xl">
              ✉️
            </div>

            <h2 className="font-slab font-bold text-xl mt-5">
              {text.email}
            </h2>

            <p className="text-sm text-ink-soft leading-6 mt-3">
              {text.emailText}
            </p>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-block mt-4 text-sm font-semibold text-clay hover:text-clay-dark break-all"
            >
              {CONTACT_EMAIL}
            </a>

          </div>

          {/* ========================================
              PHONE
          ======================================== */}

          <div className="bg-white border border-line rounded-xl p-6">

            <div className="w-10 h-10 rounded-lg bg-sand flex items-center justify-center text-xl">
              📞
            </div>

            <h2 className="font-slab font-bold text-xl mt-5">
              {text.phone}
            </h2>

            <p className="text-sm text-ink-soft leading-6 mt-3">
              {text.phoneText}
            </p>

            <a
              href={`tel:${CONTACT_PHONE_LINK}`}
              className="inline-block mt-4 text-sm font-semibold text-clay hover:text-clay-dark"
            >
              {CONTACT_PHONE}
            </a>

          </div>

        </div>

        {/* ============================================
            PARTNER
        ============================================ */}

        <div className="mt-8 bg-white border border-line rounded-xl p-7 md:p-9">

          <div className="max-w-3xl">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-lg bg-sand flex items-center justify-center text-xl">
                🤝
              </div>

              <h2 className="font-slab font-bold text-2xl">
                {text.partnerTitle}
              </h2>

            </div>

            <p className="text-sm text-ink-soft leading-6 mt-4">
              {text.partnerText}
            </p>

            {/* CONTACT DETAILS */}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">

              {/* EMAIL */}

              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 rounded-lg bg-sand px-4 py-3 text-sm font-semibold text-ink hover:bg-line transition-colors"
              >
                <span>✉️</span>

                <span>
                  {CONTACT_EMAIL}
                </span>
              </a>

              {/* PHONE */}

              <a
                href={`tel:${CONTACT_PHONE_LINK}`}
                className="inline-flex items-center gap-2 rounded-lg bg-sand px-4 py-3 text-sm font-semibold text-ink hover:bg-line transition-colors"
              >
                <span>📞</span>

                <span>
                  {CONTACT_PHONE}
                </span>
              </a>

              {/* TELEGRAM */}

              <a
                href={TELEGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-sand px-4 py-3 text-sm font-semibold text-ink hover:bg-line transition-colors"
              >
                <span>✈️</span>

                <span>
                  {text.telegram}
                </span>
              </a>

            </div>

          </div>

        </div>

        {/* ============================================
            LOCATIONS
        ============================================ */}

        <div className="mt-8 bg-white border border-line rounded-xl p-7 md:p-9">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div>

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-lg bg-sand flex items-center justify-center text-xl">
                  📍
                </div>

                <h2 className="font-slab font-bold text-2xl">
                  {text.locationTitle}
                </h2>

              </div>

              <p className="text-sm text-ink-soft leading-6 mt-4 max-w-2xl">
                {text.locationText}
              </p>

              <p className="text-sm font-semibold mt-3">
                {text.city}
              </p>

            </div>

            <Link
              href="/locations"
              className="btn-ghost shrink-0 text-center"
            >
              {text.locationsButton}
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}