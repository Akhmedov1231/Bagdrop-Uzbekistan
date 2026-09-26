"use client";

import {
  useEffect,
  useMemo,
  useState,
  Suspense,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { calculateTotal } from "@/lib/pricing";
import { Location, CustomerDetails } from "@/lib/types";
import { useLanguage } from "@/lib/i18n";
import { BOOKING_CONFIG } from "@/lib/config";
import {
  Calendar,
  Clock,
  Luggage,
  User,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  QrCode,
  Sparkles,
  CreditCard,
  Mail,
  Phone,
  Send,
  Lock,
} from "lucide-react";

const TOTAL_STEPS = 5;
const USD_UZS_RATE = BOOKING_CONFIG.usdRate;

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

type CreatedBooking = {
  id: string;
  bookingNumber: string;
  qrToken: string;
  totalPrice: number;
  status: string;
  bagTags: string[];
};

function formatUZS(value: number) {
  return `${Math.round(value).toLocaleString()} UZS`;
}

function formatUSD(value: number) {
  const usd = value / USD_UZS_RATE;
  return `≈ $${usd.toFixed(2)}`;
}

function BookingWizardInner() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";

  const [location, setLocation] = useState<Location | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState("");

  const [availableBags, setAvailableBags] = useState<number | null>(null);
  const [reservedBags, setReservedBags] = useState(0);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [step, setStep] = useState(1);

  const today = new Date().toISOString().slice(0, 10);

  const initialDropDate = searchParams.get("dropoffDate") || today;
  const initialDropTime = searchParams.get("dropoffTime") || "10:00";
  const initialPickDate = searchParams.get("pickupDate") || today;
  const initialPickTime = searchParams.get("pickupTime") || "18:00";

  const [dropDate, setDropDate] = useState(initialDropDate);
  const [dropTime, setDropTime] = useState(initialDropTime);
  const [pickDate, setPickDate] = useState(initialPickDate);
  const [pickTime, setPickTime] = useState(initialPickTime);

  const [bags, setBags] = useState(1);

  const [customer, setCustomer] = useState<CustomerDetails>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    telegram: "",
  });

  const [creatingBooking, setCreatingBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [createdBooking, setCreatedBooking] = useState<CreatedBooking | null>(null);
  const [qrImage, setQrImage] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [personalItemsAcknowledged, setPersonalItemsAcknowledged] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  useEffect(() => {
    async function loadLocation() {
      try {
        setLoadingLocation(true);
        setLocationError("");

        const response = await fetch("/api/locations");
        if (!response.ok) throw new Error("Failed to load locations");

        const result = await response.json();
        if (!result.ok) throw new Error(result.error || "Failed to load locations");

        const apiLocation = (result.locations as ApiLocation[]).find(
          (item) => item.slug === slug
        );

        if (!apiLocation) {
          setLocationError(t.booking.locationNotFound);
          return;
        }

        const mappedLocation: Location = {
          id: apiLocation.id,
          slug: apiLocation.slug,
          name: apiLocation.name,
          city: apiLocation.city,
          address: apiLocation.address,
          distanceLabel: "",
          description: apiLocation.description ?? "",
          pricePerBagPerDay: Number(apiLocation.price_per_bag),
          currency: "UZS",
          capacity: Number(apiLocation.capacity),
          availableBags: Number(apiLocation.capacity),
          maxBagsPerBooking: 8,
          hours: {
            open: apiLocation.opening_time.slice(0, 5),
            close: apiLocation.closing_time.slice(0, 5),
          },
          amenities: ["Verified partner", "Indoor storage"],
          lat: Number(apiLocation.latitude),
          lng: Number(apiLocation.longitude),
          googleMapsUrl: apiLocation.google_maps_url ?? "",
          yandexMapsUrl: apiLocation.yandex_maps_url ?? "",
          partnerName: "",
          color: "#ea580c",
          isDemo: false,
          active: apiLocation.active,
        };

        setLocation(mappedLocation);
      } catch (error) {
        console.error("Failed to load location:", error);
        setLocationError(t.booking.loadLocationError);
      } finally {
        setLoadingLocation(false);
      }
    }

    if (slug) {
      loadLocation();
    } else {
      setLoadingLocation(false);
      setLocationError(t.booking.locationSlugMissing);
    }
  }, [slug]);

  useEffect(() => {
    if (!location) {
      setAvailableBags(null);
      return;
    }

    const currentLocation = location;
    let cancelled = false;

    async function loadAvailability() {
      try {
        setLoadingAvailability(true);

        const params = new URLSearchParams({
          locationId: currentLocation.id,
          dropoffDate: dropDate,
          dropoffTime: dropTime,
          pickupDate: pickDate,
          pickupTime: pickTime,
        });

        const response = await fetch(
          `/api/locations/availability?${params.toString()}`,
          { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.error || t.booking.availabilityError);
        }

        if (!cancelled) {
          setAvailableBags(Math.max(0, Number(result.availableBags)));
          setReservedBags(Math.max(0, Number(result.reservedBags)));
        }
      } catch (error) {
        console.error("Availability loading failed:", error);
        if (!cancelled) {
          setAvailableBags(null);
          setReservedBags(0);
        }
      } finally {
        if (!cancelled) {
          setLoadingAvailability(false);
        }
      }
    }

    loadAvailability();
    const interval = window.setInterval(loadAvailability, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [location, dropDate, dropTime, pickDate, pickTime]);

  useEffect(() => {
    if (!location) return;
    setBags((current) => {
      const maximum = Math.min(
        location.maxBagsPerBooking,
        availableBags ?? location.maxBagsPerBooking
      );
      return Math.max(1, Math.min(current, maximum));
    });
  }, [location, availableBags]);

  useEffect(() => {
    if (!createdBooking?.qrToken || createdBooking.status !== "PAID") {
      setQrImage("");
      return;
    }

    QRCode.toDataURL(createdBooking.qrToken, { width: 280, margin: 2 })
      .then((url) => setQrImage(url))
      .catch(() => setQrImage(""));
  }, [createdBooking]);

  // Trigger celebration confetti on step 5
  useEffect(() => {
    if (step === 5) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#ea580c", "#f97316", "#0d9488", "#10b981"],
        });
      } catch (err) {
        console.error("Confetti error:", err);
      }
    }
  }, [step]);

  const dropoffAt = `${dropDate}T${dropTime}:00`;
  const pickupAt = `${pickDate}T${pickTime}:00`;

  const priceInfo = useMemo(() => {
    if (!location) {
      return { days: 1, hours: 0, tier: 12 as const, pricePerBag: 0, total: 0 };
    }
    return calculateTotal(location.pricePerBagPerDay, bags, dropoffAt, pickupAt);
  }, [location, bags, dropoffAt, pickupAt]);

  const storageHours = priceInfo.hours;

  const canContinueStep1 =
    Boolean(dropDate) &&
    Boolean(dropTime) &&
    Boolean(pickDate) &&
    Boolean(pickTime) &&
    new Date(pickupAt) > new Date(dropoffAt) &&
    storageHours <= 24;

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim());

  const canContinueStep3 =
    Boolean(customer.firstName.trim()) &&
    Boolean(customer.lastName.trim()) &&
    Boolean(customer.phone.trim()) &&
    emailLooksValid;

  async function startPayment() {
    if (!createdBooking?.id || !createdBooking?.bookingNumber) {
      setPaymentMessage(t.booking.bookingDataMissing);
      return;
    }

    if (paymentLoading) return;
    setPaymentLoading(true);
    setPaymentMessage("");

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: createdBooking.id,
          bookingNumber: createdBooking.bookingNumber,
          provider: "demo",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || t.booking.paymentCreateError);
      }

      setPaymentMessage(
        `${t.booking.paymentTransactionCreated} ${data.payment?.status || "PENDING"}`
      );
    } catch (error) {
      console.error("Start payment error:", error);
      setPaymentMessage(
        error instanceof Error ? error.message : t.booking.paymentCreateError
      );
    } finally {
      setPaymentLoading(false);
    }
  }

  async function createBooking() {
    if (!location || creatingBooking) return;

    if (!personalItemsAcknowledged) {
      setBookingError(t.booking.safetyConfirmError);
      setStep(4);
      return;
    }

    if (priceInfo.hours > 24) {
      setBookingError(t.booking.max24HoursError);
      setStep(1);
      return;
    }

    if (!emailLooksValid) {
      setBookingError(t.booking.validEmailError);
      setStep(3);
      return;
    }

    if (availableBags !== null && bags > availableBags) {
      setBookingError(t.booking.notEnoughBagsError);
      setStep(2);
      return;
    }

    setCreatingBooking(true);
    setBookingError("");
    setEmailSent(false);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: location.id,
          dropoffDate: dropDate,
          dropoffTime: dropTime,
          pickupDate: pickDate,
          pickupTime: pickTime,
          bagCount: bags,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          email: customer.email,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || t.booking.createBookingError);
      }

      const booking: CreatedBooking = {
        id: result.booking.id,
        bookingNumber: result.booking.bookingNumber,
        qrToken: result.booking.qrToken,
        totalPrice: Number(result.booking.totalPrice),
        status: result.booking.status,
        bagTags: result.booking.bagTags ?? [],
      };

      setCreatedBooking(booking);
      setEmailSent(false);
      setStep(5);
    } catch (error) {
      console.error("Booking creation failed:", error);
      setBookingError(
        error instanceof Error ? error.message : t.booking.createBookingError
      );
    } finally {
      setCreatingBooking(false);
    }
  }

  if (loadingLocation) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-ink-soft">{t.booking.loadingLocation}</p>
      </div>
    );
  }

  if (locationError || !location) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="bg-white border border-line rounded-3xl p-8 shadow-card-modern">
          <p className="text-sm font-semibold text-ink-soft mb-4">{locationError || t.booking.locationNotFound}</p>
          <Link
            href="/locations"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold px-6 py-3 rounded-2xl shadow-glow-brand"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.booking.backToLocations}</span>
          </Link>
        </div>
      </div>
    );
  }

  const stepLabels = [
    { title: "Schedule", icon: Calendar },
    { title: "Luggage", icon: Luggage },
    { title: "Contact", icon: User },
    { title: "Review", icon: ShieldCheck },
    { title: "Ticket", icon: QrCode },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      
      {/* Back button */}
      <Link
        href={`/locations/${location.slug}`}
        className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700 bg-white px-3.5 py-1.5 rounded-full border border-line shadow-2xs mb-6 transition-all"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t.booking.backToLocation}</span>
      </Link>

      {/* Modern Multi-step progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          {stepLabels.map((s, idx) => {
            const StepIcon = s.icon;
            const isDone = idx + 1 < step;
            const isCurrent = idx + 1 === step;

            return (
              <div key={s.title} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? "bg-emerald-500 text-white shadow-sm"
                      : isCurrent
                      ? "bg-gradient-to-tr from-brand-500 to-amber-500 text-white shadow-glow-brand ring-4 ring-brand-500/20"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> : <StepIcon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block ${
                    isCurrent ? "text-brand-600" : isDone ? "text-emerald-700" : "text-slate-400"
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Continuous Bar */}
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-500 to-amber-400 rounded-full"
            initial={{ width: "20%" }}
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* STEP 1: DATE & TIME */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-card-modern space-y-6"
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-600 block mb-1">
                Step 01
              </span>
              <h2 className="font-display font-extrabold text-2xl text-ink">
                {t.booking.chooseDateTime}
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft mt-1">
                {t.booking.openingHoursFor} <b>{location.name}</b>:{" "}
                <span className="text-brand-600 font-bold">{location.hours.open} – {location.hours.close}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.booking.dropOffDate}>
                <input
                  type="date"
                  min={today}
                  value={dropDate}
                  onChange={(e) => setDropDate(e.target.value)}
                  className="admin-input font-medium text-xs"
                />
              </Field>

              <Field label={t.booking.dropOffTime}>
                <input
                  type="time"
                  value={dropTime}
                  onChange={(e) => setDropTime(e.target.value)}
                  className="admin-input font-medium text-xs"
                />
              </Field>

              <Field label={t.booking.pickupDate}>
                <input
                  type="date"
                  min={dropDate}
                  value={pickDate}
                  onChange={(e) => setPickDate(e.target.value)}
                  className="admin-input font-medium text-xs"
                />
              </Field>

              <Field label={t.booking.pickupTime}>
                <input
                  type="time"
                  value={pickTime}
                  onChange={(e) => setPickTime(e.target.value)}
                  className="admin-input font-medium text-xs"
                />
              </Field>
            </div>

            {/* Live slot counter */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-ink-soft">
                <Clock className="w-4 h-4 text-brand-500" />
                <span>{t.booking.bagsAvailableForTime}</span>
              </div>
              <span className="font-display font-bold text-sm text-ink">
                {loadingAvailability
                  ? t.booking.checking
                  : availableBags !== null
                  ? `${availableBags} / ${location.capacity} free`
                  : t.booking.notAvailable}
              </span>
            </div>

            {new Date(pickupAt) <= new Date(dropoffAt) && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t.booking.pickupAfterDropoff}</span>
              </div>
            )}

            {new Date(pickupAt) > new Date(dropoffAt) && storageHours > 24 && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t.booking.max24HoursMessage}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                disabled={!canContinueStep1}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold px-7 py-3.5 rounded-2xl shadow-glow-brand transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{t.booking.continueButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: BAGS */}
        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-card-modern space-y-6"
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-600 block mb-1">
                Step 02
              </span>
              <h2 className="font-display font-extrabold text-2xl text-ink">
                {t.booking.numberOfBags}
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft mt-1">
                {t.booking.chooseBags} {t.booking.maximum} <b>{location.maxBagsPerBooking}</b> {t.booking.bagsPerBooking}.
              </p>
            </div>

            {/* Stepper Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Select Bag Quantity
              </span>

              <div className="flex items-center gap-8 py-2">
                <button
                  type="button"
                  onClick={() => setBags((c) => Math.max(1, c - 1))}
                  disabled={bags <= 1}
                  className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-2xl font-bold text-ink shadow-2xs hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed active:scale-90 transition-all flex items-center justify-center"
                >
                  −
                </button>

                <div className="text-center">
                  <div className="font-display font-black text-6xl text-ink leading-none">
                    {bags}
                  </div>
                  <span className="text-xs font-bold text-brand-600 mt-1 block">
                    {bags === 1 ? t.booking.bagSingular : t.booking.bagPlural}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setBags((c) =>
                      Math.min(
                        location.maxBagsPerBooking,
                        availableBags ?? location.maxBagsPerBooking,
                        c + 1
                      )
                    )
                  }
                  disabled={
                    loadingAvailability ||
                    availableBags === 0 ||
                    (availableBags !== null && bags >= Math.min(location.maxBagsPerBooking, availableBags))
                  }
                  className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-2xl font-bold text-ink shadow-2xs hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed active:scale-90 transition-all flex items-center justify-center"
                >
                  +
                </button>
              </div>

              {availableBags !== null && availableBags > 0 && bags >= Math.min(location.maxBagsPerBooking, availableBags) && (
                <p className="text-xs text-amber-600 font-semibold">
                  {t.booking.availableLimitReached}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-ink px-4 py-3 rounded-2xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.common.back}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={availableBags === 0 || loadingAvailability}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold px-7 py-3.5 rounded-2xl shadow-glow-brand transition-all"
              >
                <span>{t.booking.continueButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: CUSTOMER DETAILS */}
        {step === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-card-modern space-y-6"
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-600 block mb-1">
                Step 03
              </span>
              <h2 className="font-display font-extrabold text-2xl text-ink">
                {t.booking.customerDetails}
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft mt-1">
                {t.booking.noAccountNeeded}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t.booking.firstName} required>
                <input
                  className="admin-input font-medium text-xs"
                  placeholder="e.g. John"
                  value={customer.firstName}
                  onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })}
                />
              </Field>

              <Field label={t.booking.lastName} required>
                <input
                  className="admin-input font-medium text-xs"
                  placeholder="e.g. Doe"
                  value={customer.lastName}
                  onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })}
                />
              </Field>
            </div>

            <Field label={t.booking.phone} required>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  className="admin-input pl-10 font-medium text-xs"
                  placeholder="+998 90 123 45 67"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                />
              </div>
            </Field>

            <Field label={t.booking.email} required>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@gmail.com"
                  className="admin-input pl-10 font-medium text-xs"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                />
              </div>
              {customer.email.trim() && !emailLooksValid && (
                <p className="text-xs text-rose-500 font-semibold mt-1">
                  {t.booking.validEmailError}
                </p>
              )}
            </Field>

            <Field label={t.booking.telegramOptional}>
              <div className="relative">
                <Send className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  className="admin-input pl-10 font-medium text-xs"
                  placeholder="@username"
                  value={customer.telegram}
                  onChange={(e) => setCustomer({ ...customer, telegram: e.target.value })}
                />
              </div>
            </Field>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-ink px-4 py-3 rounded-2xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.common.back}</span>
              </button>

              <button
                type="button"
                disabled={!canContinueStep3}
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold px-7 py-3.5 rounded-2xl shadow-glow-brand transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{t.booking.continueButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: REVIEW & SAFETY CONFIRMATION */}
        {step === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-card-modern space-y-6"
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-600 block mb-1">
                Step 04
              </span>
              <h2 className="font-display font-extrabold text-2xl text-ink">
                {t.booking.reviewPrice}
              </h2>
            </div>

            {/* Summary Ticket Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 space-y-2.5 text-xs text-ink-soft">
              <Row label={t.booking.location} value={location.name} />
              <Row label={t.booking.dropOff} value={`${dropDate} ${dropTime}`} />
              <Row label={t.booking.pickup} value={`${pickDate} ${pickTime}`} />
              <Row
                label={t.booking.duration}
                value={`${priceInfo.hours.toFixed(priceInfo.hours % 1 === 0 ? 0 : 1)} ${t.booking.hours}`}
              />
              <Row
                label={t.booking.rate}
                value={priceInfo.tier === 12 ? t.booking.rate12 : t.booking.rate24}
              />
              <Row
                label={t.booking.bags}
                value={`${bags} × ${formatUZS(priceInfo.pricePerBag)}`}
              />
              <Row label={t.booking.email} value={customer.email} />

              <div className="flex justify-between border-t border-slate-200 pt-3 mt-3 font-display font-extrabold text-base text-ink">
                <span>{t.booking.total}</span>
                <div className="text-right">
                  <span className="text-brand-600 text-lg block">{formatUZS(priceInfo.total)}</span>
                  <span className="text-xs text-slate-400 font-normal">{formatUSD(priceInfo.total)}</span>
                </div>
              </div>
            </div>

            {/* Safety Warning & Checkbox */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{t.booking.safetyTitle}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {t.booking.safetyIntro}
              </p>

              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                <span>🪪 {t.booking.passport}</span>
                <span>💵 {t.booking.cash}</span>
                <span>💳 {t.booking.bankCards}</span>
                <span>💎 {t.booking.jewelry}</span>
                <span>📱 {t.booking.electronics}</span>
                <span>🔑 {t.booking.keys}</span>
              </div>

              <label className="flex items-start gap-3 pt-2 cursor-pointer border-t border-amber-500/20">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 accent-brand-600 cursor-pointer"
                  checked={personalItemsAcknowledged}
                  onChange={(e) => setPersonalItemsAcknowledged(e.target.checked)}
                />
                <span className="text-xs font-bold text-ink leading-snug">
                  {t.booking.safetyAcknowledgement}
                </span>
              </label>
            </div>

            {bookingError && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={creatingBooking}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-ink px-4 py-3 rounded-2xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.common.back}</span>
              </button>

              <button
                type="button"
                onClick={createBooking}
                disabled={
                  creatingBooking ||
                  loadingAvailability ||
                  !personalItemsAcknowledged ||
                  availableBags === 0 ||
                  (availableBags !== null && bags > availableBags)
                }
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold px-8 py-4 rounded-2xl shadow-glow-brand transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>{creatingBooking ? t.booking.creatingBooking : t.booking.confirmBooking}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 5: CONFIRMATION & QR TICKET */}
        {step === 5 && (
          <motion.div
            key="step-5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-card-modern space-y-6 text-center"
          >
            {/* Header Success Badge */}
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">
                {t.booking.bookingConfirmed}
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft mt-1">
                {t.booking.bookingSaved}
              </p>
            </div>

            {createdBooking && (
              <div className="space-y-6 text-left">
                {/* Booking Info Card */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 space-y-2 text-xs">
                  <Row label={t.booking.bookingNumber} value={createdBooking.bookingNumber} />
                  <Row label={t.booking.location} value={location.name} />
                  <Row label={t.booking.dropOff} value={`${dropDate} ${dropTime}`} />
                  <Row label={t.booking.pickup} value={`${pickDate} ${pickTime}`} />
                  <Row label={t.booking.bags} value={String(bags)} />
                  <Row
                    label="Total"
                    value={`${formatUZS(createdBooking.totalPrice)} (${formatUSD(createdBooking.totalPrice)})`}
                  />
                  <Row label="Status" value={createdBooking.status} />
                </div>

                {/* QR Code Container */}
                <div className="border border-line rounded-3xl p-6 text-center bg-cream/30 space-y-4">
                  <h3 className="font-display font-bold text-lg text-ink">
                    {t.booking.yourQrCode}
                  </h3>
                  <p className="text-xs text-ink-soft">
                    {t.booking.showQr}
                  </p>

                  {createdBooking.status === "PAID" ? (
                    <div>
                      {qrImage ? (
                        <div className="flex justify-center p-3 bg-white rounded-2xl shadow-sm border border-slate-200 w-fit mx-auto">
                          <img src={qrImage} alt="QR Code" className="w-60 h-60" />
                        </div>
                      ) : (
                        <div className="w-60 h-60 mx-auto flex items-center justify-center bg-slate-100 rounded-2xl">
                          <span className="text-xs text-slate-400">{t.booking.loadingQr}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-64 h-64 mx-auto flex flex-col items-center justify-center bg-slate-100 rounded-2xl border border-slate-200 p-6 space-y-2">
                      <Lock className="w-8 h-8 text-slate-400" />
                      <p className="text-xs font-bold text-ink">{t.booking.qrWaitingPayment}</p>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        QR pass activates automatically after verified payment.
                      </p>
                    </div>
                  )}
                </div>

                {/* Bag Tags Section */}
                <div className="border border-line rounded-3xl p-5 space-y-3">
                  <h4 className="font-display font-bold text-sm text-ink">{t.booking.bagTags}</h4>
                  <p className="text-xs text-ink-soft">{t.booking.bagTagsDescription}</p>
                  <div className="flex flex-wrap gap-2">
                    {createdBooking.bagTags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-xs font-bold bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl text-slate-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Payment CTA */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={startPayment}
                    disabled={paymentLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-4 rounded-2xl shadow-glow-teal active:scale-95 transition-all text-sm"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{paymentLoading ? t.booking.preparingPayment : t.booking.continuePayment}</span>
                  </button>

                  {paymentMessage && (
                    <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                      {paymentMessage}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-700 block">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-ink text-right">{value}</span>
    </div>
  );
}

export default function BookingWizardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <BookingWizardInner />
    </Suspense>
  );
}