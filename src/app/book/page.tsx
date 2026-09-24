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
import { calculateTotal } from "@/lib/pricing";
import { Location, CustomerDetails } from "@/lib/types";
import { useLanguage } from "@/lib/i18n";

const TOTAL_STEPS = 5;
const USD_UZS_RATE = 11765.21;

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

  // If the location page sends booking date/time in the URL,
  // use those values automatically. Otherwise use sensible defaults.
  const initialDropDate =
    searchParams.get("dropoffDate") || today;

  const initialDropTime =
    searchParams.get("dropoffTime") || "10:00";

  const initialPickDate =
    searchParams.get("pickupDate") || today;

  const initialPickTime =
    searchParams.get("pickupTime") || "18:00";

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

  const [createdBooking, setCreatedBooking] =
    useState<CreatedBooking | null>(null);

  const [qrImage, setQrImage] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // Required safety acknowledgement before booking confirmation/payment.
  const [personalItemsAcknowledged, setPersonalItemsAcknowledged] =
    useState(false);

  // Payment preparation state.
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  useEffect(() => {
    async function loadLocation() {
      try {
        setLoadingLocation(true);
        setLocationError("");

        const response = await fetch("/api/locations");

        if (!response.ok) {
          throw new Error("Failed to load locations");
        }

        const result = await response.json();

        if (!result.ok) {
          throw new Error(
            result.error || "Failed to load locations"
          );
        }

        const apiLocation = (
          result.locations as ApiLocation[]
        ).find((item) => item.slug === slug);

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
          pricePerBagPerDay: Number(
            apiLocation.price_per_bag
          ),
          currency: "UZS",
          capacity: Number(apiLocation.capacity),
          availableBags: Number(apiLocation.capacity),
          maxBagsPerBooking: 8,
          hours: {
            open: apiLocation.opening_time.slice(0, 5),
            close: apiLocation.closing_time.slice(0, 5),
          },
          amenities: [
            "Verified partner",
            "Indoor storage",
          ],
          lat: Number(apiLocation.latitude),
          lng: Number(apiLocation.longitude),
          googleMapsUrl:
            apiLocation.google_maps_url ?? "",
          yandexMapsUrl:
            apiLocation.yandex_maps_url ?? "",
          partnerName: "",
          color: "#1f6f6b",
          isDemo: false,
          active: apiLocation.active,
        };

        setLocation(mappedLocation);
      } catch (error) {
        console.error(
          "Failed to load location:",
          error
        );

        setLocationError(
          t.booking.loadLocationError
        );
      } finally {
        setLoadingLocation(false);
      }
    }

    if (slug) {
      loadLocation();
    } else {
      setLoadingLocation(false);
      setLocationError(
        t.booking.locationSlugMissing
      );
    }
  }, [slug]);

  // --------------------------------------------------
  // LOAD REAL-TIME AVAILABILITY
  // --------------------------------------------------

  useEffect(() => {
    if (!location) {
      setAvailableBags(null);
      return;
    }

    // Save the current location in a non-null variable.
    // This prevents TypeScript from treating location
    // as possibly null inside the async function.
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
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(
            result.error ||
              t.booking.availabilityError
          );
        }

        if (!cancelled) {
          setAvailableBags(
            Math.max(
              0,
              Number(result.availableBags)
            )
          );

          setReservedBags(
            Math.max(
              0,
              Number(result.reservedBags)
            )
          );
        }
      } catch (error) {
        console.error(
          "Availability loading failed:",
          error
        );

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

    // Refresh every 15 seconds so capacity changes
    // from other customers appear automatically.
    const interval = window.setInterval(
      loadAvailability,
      15000
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [
    location,
    dropDate,
    dropTime,
    pickDate,
    pickTime,
  ]);

  useEffect(() => {
    if (!location) return;

    setBags((current) => {
      const maximum = Math.min(
        location.maxBagsPerBooking,
        availableBags ?? location.maxBagsPerBooking
      );

      return Math.max(
        1,
        Math.min(current, maximum)
      );
    });
  }, [location, availableBags]);

  useEffect(() => {
    if (
      !createdBooking?.qrToken ||
      createdBooking.status !== "PAID"
    ) {
      setQrImage("");
      return;
    }

    QRCode.toDataURL(
      createdBooking.qrToken,
      {
        width: 280,
        margin: 2,
      }
    )
      .then((url) => {
        setQrImage(url);
      })
      .catch((error) => {
        console.error(
          "QR generation failed:",
          error
        );
        setQrImage("");
      });
  }, [createdBooking]);

  const dropoffAt =
    `${dropDate}T${dropTime}:00`;

  const pickupAt =
    `${pickDate}T${pickTime}:00`;

  const priceInfo = useMemo(() => {
    if (!location) {
      return {
        days: 1,
        hours: 0,
        tier: 12 as const,
        pricePerBag: 0,
        total: 0,
      };
    }

    return calculateTotal(
      location.pricePerBagPerDay,
      bags,
      dropoffAt,
      pickupAt
    );
  }, [
    location,
    bags,
    dropoffAt,
    pickupAt,
  ]);

  const storageHours = priceInfo.hours;

  const canContinueStep1 =
    Boolean(dropDate) &&
    Boolean(dropTime) &&
    Boolean(pickDate) &&
    Boolean(pickTime) &&
    new Date(pickupAt) >
      new Date(dropoffAt) &&
    storageHours <= 24;

  const emailLooksValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      customer.email.trim()
    );

  const canContinueStep3 =
    Boolean(customer.firstName.trim()) &&
    Boolean(customer.lastName.trim()) &&
    Boolean(customer.phone.trim()) &&
    emailLooksValid;

  async function startPayment() {
    if (!createdBooking?.id || !createdBooking?.bookingNumber) {
      setPaymentMessage(
        t.booking.bookingDataMissing
      );
      return;
    }

    if (paymentLoading) return;

    setPaymentLoading(true);
    setPaymentMessage("");

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: createdBooking.id,
          bookingNumber: createdBooking.bookingNumber,
          provider: "demo",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error || t.booking.paymentCreateError
        );
      }

      setPaymentMessage(
        `${t.booking.paymentTransactionCreated} ${data.payment?.status || "PENDING"}`
      );
    } catch (error) {
      console.error("Start payment error:", error);

      setPaymentMessage(
        error instanceof Error
          ? error.message
          : t.booking.paymentCreateError
      );
    } finally {
      setPaymentLoading(false);
    }
  }

  async function createBooking() {
    if (!location) return;
    if (creatingBooking) return;

    if (!personalItemsAcknowledged) {
      setBookingError(
        t.booking.safetyConfirmError
      );
      setStep(4);
      return;
    }

    if (priceInfo.hours > 24) {
      setBookingError(
        t.booking.max24HoursError
      );
      setStep(1);
      return;
    }

    if (!emailLooksValid) {
      setBookingError(
        t.booking.validEmailError
      );
      setStep(3);
      return;
    }

    if (
      availableBags !== null &&
      bags > availableBags
    ) {
      setBookingError(
        t.booking.notEnoughBagsError
      );
      setStep(2);
      return;
    }

    setCreatingBooking(true);
    setBookingError("");
    setEmailSent(false);

    try {
      const response = await fetch(
        "/api/bookings",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
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
        }
      );

      const result = await response.json();

      if (
        !response.ok ||
        !result.ok
      ) {
        throw new Error(
          result.error ||
            t.booking.createBookingError
        );
      }

      const booking: CreatedBooking = {
        id: result.booking.id,
        bookingNumber:
          result.booking.bookingNumber,
        qrToken:
          result.booking.qrToken,
        totalPrice: Number(
          result.booking.totalPrice
        ),
        status:
          result.booking.status,
        bagTags:
          result.booking.bagTags ?? [],
      };

      setCreatedBooking(booking);
      setEmailSent(false);

      // QR/email are intentionally NOT activated here.
      // They become available only after the payment provider
      // verifies the payment and the booking reaches PAID.
      setStep(5);
    } catch (error) {
      console.error(
        "Booking creation failed:",
        error
      );

      setBookingError(
        error instanceof Error
          ? error.message
          : t.booking.createBookingError
      );
    } finally {
      setCreatingBooking(false);
    }
  }

  if (loadingLocation) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <p className="text-ink-soft">
          {t.booking.loadingLocation}
        </p>
      </div>
    );
  }

  if (
    locationError ||
    !location
  ) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <p className="text-ink-soft mb-4">
          {locationError ||
            t.booking.locationNotFound}
        </p>

        <Link
          href="/locations"
          className="text-teal-dark font-semibold"
        >
          {t.booking.backToLocations}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-8">

      <Link
        href={`/locations/${location.slug}`}
        className="inline-flex gap-1.5 text-sm font-semibold text-teal-dark mb-5"
      >
        ← {t.booking.backToLocation}
      </Link>

      <div className="flex gap-1.5 mb-6">
        {Array.from({
          length: TOTAL_STEPS,
        }).map((_, index) => (
          <i
            key={index}
            className={`flex-1 h-1 rounded-full ${
              index < step
                ? "bg-teal"
                : "bg-line"
            }`}
          />
        ))}
      </div>

      {/* STEP 1 */}

      {step === 1 && (
        <div className="bg-white border border-line rounded p-6">

          <h2 className="font-slab font-bold text-xl">
            {t.booking.chooseDateTime}
          </h2>

          <p className="text-sm text-ink-soft mb-5">
            {t.booking.openingHoursFor}{" "}
            {location.name}:{" "}
            <b>
              {location.hours.open}–
              {location.hours.close}
            </b>
          </p>

          <div className="grid grid-cols-2 gap-3">

            <Field label={t.booking.dropOffDate}>
              <input
                type="date"
                min={today}
                value={dropDate}
                onChange={(event) =>
                  setDropDate(
                    event.target.value
                  )
                }
                className="input"
              />
            </Field>

            <Field label={t.booking.dropOffTime}>
              <input
                type="time"
                value={dropTime}
                onChange={(event) =>
                  setDropTime(
                    event.target.value
                  )
                }
                className="input"
              />
            </Field>

            <Field label={t.booking.pickupDate}>
              <input
                type="date"
                min={dropDate}
                value={pickDate}
                onChange={(event) =>
                  setPickDate(
                    event.target.value
                  )
                }
                className="input"
              />
            </Field>

            <Field label={t.booking.pickupTime}>
              <input
                type="time"
                value={pickTime}
                onChange={(event) =>
                  setPickTime(
                    event.target.value
                  )
                }
                className="input"
              />
            </Field>

          </div>

          <p className="text-xs text-ink-soft mt-2">
            {t.booking.arriveWithinOpeningHours}
            {" "}
            ({location.hours.open}–
            {location.hours.close}).
          </p>

          <div className="mt-4 rounded-xl border border-line bg-sand px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-ink-soft">
                {t.booking.bagsAvailableForTime}
              </span>

              <span
                className={`text-sm font-bold ${
                  availableBags === 0
                    ? "text-red-600"
                    : availableBags !== null &&
                      availableBags <= 3
                    ? "text-orange-600"
                    : "text-teal-dark"
                }`}
              >
                {loadingAvailability
                  ? t.booking.checking
                  : availableBags !== null
                  ? `${availableBags} / ${location.capacity}`
                  : t.booking.notAvailable}
              </span>
            </div>
          </div>

          {new Date(pickupAt) <= new Date(dropoffAt) && (
            <p className="text-xs text-red-600 mt-1">
              {t.booking.pickupAfterDropoff}
            </p>
          )}

          {new Date(pickupAt) > new Date(dropoffAt) &&
            storageHours > 24 && (
              <p className="text-xs text-red-600 mt-1">
                {t.booking.max24HoursMessage}
              </p>
            )}

          <div className="flex justify-end mt-5">

            <button
              disabled={!canContinueStep1}
              onClick={() =>
                setStep(2)
              }
              className="btn-primary"
            >
              {t.booking.continueButton}
            </button>

          </div>
        </div>
      )}

      {/* STEP 2 */}

      {step === 2 && (
        <div className="bg-white border border-line rounded p-6">

          <h2 className="font-slab font-bold text-xl">
            {t.booking.numberOfBags}
          </h2>

          <p className="text-sm text-ink-soft mb-5">
            {t.booking.chooseBags}{" "}
            {t.booking.maximum}{" "}
            <b>{location.maxBagsPerBooking}</b>{" "}
            {t.booking.bagsPerBooking}.
          </p>

          <div className="rounded-xl border border-line bg-sand p-4 mb-5">

            <div className="flex items-center justify-between gap-4">

              <div>
                <p className="text-xs text-ink-soft">
                  {t.booking.availabilityForTime}
                </p>

                <p className="font-slab font-bold text-2xl mt-1">
                  {loadingAvailability
                    ? t.booking.checking
                    : availableBags !== null
                    ? `${availableBags} ${
                        availableBags === 1
                          ? t.booking.bagSingular
                          : t.booking.bagPlural
                      }`
                    : t.booking.notAvailable}
                </p>
              </div>

              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center font-bold ${
                  availableBags === 0
                    ? "bg-red-100 text-red-600"
                    : availableBags !== null &&
                      availableBags <= 3
                    ? "bg-orange-100 text-orange-600"
                    : "bg-teal/10 text-teal-dark"
                }`}
              >
                {loadingAvailability
                  ? "…"
                  : availableBags === 0
                  ? "!"
                  : "✓"}
              </div>

            </div>

            {availableBags !== null && (
              <p className="text-xs text-ink-soft mt-2">
                {reservedBags} {t.booking.reserved} ·{" "}
                {location.capacity} {t.booking.totalCapacity}
              </p>
            )}

            <p className="text-[11px] text-ink-soft mt-2">
              {t.booking.availabilityAutoUpdate}
            </p>

          </div>

          <div className="rounded-xl border border-line bg-white p-5">

            <p className="text-center text-xs font-semibold text-ink-soft">
              {t.booking.numberOfBags}
            </p>

            <div className="flex items-center justify-center gap-6 py-4">

              <button
                onClick={() =>
                  setBags((current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                  )
                }
                disabled={bags <= 1}
                className="w-11 h-11 rounded-full border border-line bg-sand hover:bg-line text-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={t.booking.decreaseBags}
              >
                −
              </button>

              <div className="text-center">
                <div className="font-slab font-bold text-4xl leading-none">
                  {bags}
                </div>

                <div className="text-xs text-ink-soft mt-1">
                  {bags === 1 ? t.booking.bagSingular : t.booking.bagPlural}
                </div>
              </div>

              <button
                onClick={() =>
                  setBags((current) =>
                    Math.min(
                      location.maxBagsPerBooking,
                      availableBags ??
                        location.maxBagsPerBooking,
                      current + 1
                    )
                  )
                }
                disabled={
                  loadingAvailability ||
                  availableBags === 0 ||
                  (availableBags !== null &&
                    bags >=
                      Math.min(
                        location.maxBagsPerBooking,
                        availableBags
                      ))
                }
                className="w-11 h-11 rounded-full border border-line bg-sand hover:bg-line text-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={t.booking.increaseBags}
              >
                +
              </button>

            </div>

            {availableBags !== null &&
              availableBags > 0 &&
              bags >=
                Math.min(
                  location.maxBagsPerBooking,
                  availableBags
                ) && (
                <p className="text-xs text-center text-ink-soft">
                  {t.booking.availableLimitReached}
                </p>
              )}

          </div>

          {availableBags === 0 && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-4 mt-4 text-center">
              <strong>{t.booking.noBagsAvailable}</strong>
              <br />
              {t.booking.chooseAnotherTime}
            </div>
          )}

          <div className="flex justify-between mt-5">

            <button
              onClick={() =>
                setStep(1)
              }
              className="btn-ghost"
            >
              {t.common.back}
            </button>

            <button
              onClick={() =>
                setStep(3)
              }
              disabled={
                availableBags === 0 ||
                loadingAvailability
              }
              className="btn-primary"
            >
              {t.booking.continueButton}
            </button>

          </div>

        </div>
      )}

      {/* STEP 3 */}

      {step === 3 && (
        <div className="bg-white border border-line rounded p-6">

          <h2 className="font-slab font-bold text-xl">
            {t.booking.customerDetails}
          </h2>

          <p className="text-sm text-ink-soft mb-5">
            {t.booking.noAccountNeeded}
          </p>

          <div className="grid grid-cols-2 gap-3">

            <Field label={t.booking.firstName}>
              <input
                className="input"
                value={
                  customer.firstName
                }
                onChange={(event) =>
                  setCustomer({
                    ...customer,
                    firstName:
                      event.target.value,
                  })
                }
              />
            </Field>

            <Field label={t.booking.lastName}>
              <input
                className="input"
                value={
                  customer.lastName
                }
                onChange={(event) =>
                  setCustomer({
                    ...customer,
                    lastName:
                      event.target.value,
                  })
                }
              />
            </Field>

          </div>

          <Field label={t.booking.phone}>
            <input
              className="input"
              placeholder="+998 90 123 45 67"
              value={
                customer.phone
              }
              onChange={(event) =>
                setCustomer({
                  ...customer,
                  phone:
                    event.target.value,
                })
              }
            />
          </Field>

          <Field
            label={t.booking.email}
            required
          >
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@gmail.com"
              className="input"
              value={
                customer.email
              }
              onChange={(event) =>
                setCustomer({
                  ...customer,
                  email:
                    event.target.value,
                })
              }
            />

            {!customer.email.trim() && (
              <p className="text-xs text-red-500 mt-1">
                {t.booking.emailRequired}
              </p>
            )}

            {customer.email.trim() &&
              !emailLooksValid && (
                <p className="text-xs text-red-500 mt-1">
                  {t.booking.validEmailError}
                </p>
              )}
          </Field>

          <Field label={t.booking.telegramOptional}>
            <input
              className="input"
              placeholder="@username"
              value={
                customer.telegram
              }
              onChange={(event) =>
                setCustomer({
                  ...customer,
                  telegram:
                    event.target.value,
                })
              }
            />
          </Field>

          <div className="flex justify-between mt-2">

            <button
              onClick={() =>
                setStep(2)
              }
              className="btn-ghost"
            >
              {t.common.back}
            </button>

            <button
              disabled={
                !canContinueStep3
              }
              onClick={() =>
                setStep(4)
              }
              className="btn-primary"
            >
              {t.booking.continueButton}
            </button>

          </div>

        </div>
      )}

      {/* STEP 4 */}

      {step === 4 && (
        <div className="bg-white border border-line rounded p-6">

          <h2 className="font-slab font-bold text-xl">
            {t.booking.reviewPrice}
          </h2>

          <div className="bg-sand rounded p-4 mt-4 text-sm">

            <Row
              label={t.booking.location}
              value={location.name}
            />

            <Row
              label={t.booking.dropOff}
              value={`${dropDate} ${dropTime}`}
            />

            <Row
              label={t.booking.pickup}
              value={`${pickDate} ${pickTime}`}
            />

            <Row
              label={t.booking.duration}
              value={`${priceInfo.hours.toFixed(
                priceInfo.hours % 1 === 0 ? 0 : 1
              )} ${t.booking.hours}`}
            />

            <Row
              label={t.booking.rate}
              value={
                priceInfo.tier === 12
                  ? t.booking.rate12
                  : t.booking.rate24
              }
            />

            <Row
              label={t.booking.bags}
              value={`${bags} × ${formatUZS(
                priceInfo.pricePerBag
              )}`}
            />

            <Row
              label={t.booking.email}
              value={customer.email}
            />

            <div className="flex justify-between border-t border-line mt-2.5 pt-2.5 font-bold text-[15px]">

              <span>{t.booking.total}</span>

              <div className="text-right">

                <div>
                  {formatUZS(
                    priceInfo.total
                  )}
                </div>

                <div className="text-sm text-ink-soft font-normal mt-0.5">
                  {formatUSD(
                    priceInfo.total
                  )}
                </div>

              </div>

            </div>

          </div>

          <p className="text-xs text-ink-soft mt-3">
            {t.booking.usdApprox}
          </p>

          {/* PERSONAL ITEMS SAFETY WARNING */}

          <div className="bg-warn-bg border border-warn rounded-xl p-4 mt-4">

            <p className="font-semibold text-sm text-warn">
              ⚠️ {t.booking.safetyTitle}
            </p>

            <p className="text-xs text-ink-soft mt-2">
              {t.booking.safetyIntro}
            </p>

            <ul className="text-xs text-ink-soft mt-2 space-y-1">
              <li>🪪 {t.booking.passport}</li>
              <li>💵 {t.booking.cash}</li>
              <li>💳 {t.booking.bankCards}</li>
              <li>💎 {t.booking.jewelry}</li>
              <li>📱 {t.booking.electronics}</li>
              <li>💊 {t.booking.medicines}</li>
              <li>📄 {t.booking.documents}</li>
              <li>🔑 {t.booking.keys}</li>
            </ul>

            <p className="text-xs text-ink-soft mt-3">
              {t.booking.safetyRecommendation}
            </p>

            <label className="flex items-start gap-3 mt-4 cursor-pointer">

              <input
                type="checkbox"
                className="mt-0.5 w-5 h-5 shrink-0 accent-teal cursor-pointer"
                checked={
                  personalItemsAcknowledged
                }
                onChange={(event) =>
                  setPersonalItemsAcknowledged(
                    event.target.checked
                  )
                }
              />

              <span className="text-xs font-semibold text-ink leading-5">
                {t.booking.safetyAcknowledgement}
              </span>

            </label>

          </div>

          {availableBags !== null &&
            bags > availableBags && (
              <div className="bg-red-50 text-red-600 text-sm rounded p-3 mt-4">
                {availableBags}{" "}
                {availableBags === 1
                  ? t.booking.bagIs
                  : t.booking.bagsAre}{" "}
                {t.booking.availableForSelectedTime}
              </div>
            )}

          {bookingError && (
            <div className="bg-red-50 text-red-600 text-sm rounded p-3 mt-4">
              {bookingError}
            </div>
          )}

          <div className="flex justify-between mt-5">

            <button
              onClick={() =>
                setStep(3)
              }
              className="btn-ghost"
              disabled={
                creatingBooking
              }
            >
              {t.common.back}
            </button>

            <button
              onClick={createBooking}
              disabled={
                creatingBooking ||
                loadingAvailability ||
                !personalItemsAcknowledged ||
                availableBags === 0 ||
                (availableBags !== null &&
                  bags > availableBags)
              }
              className="btn-primary"
            >
              {creatingBooking
                ? t.booking.creatingBooking
                : t.booking.confirmBooking}
            </button>

          </div>

        </div>
      )}

      {/* STEP 5 */}

      {step === 5 && (
        <div className="bg-white border border-line rounded p-6">

          <div className="text-center">

            <div className="w-14 h-14 rounded-full bg-teal/10 text-teal mx-auto flex items-center justify-center text-2xl mb-3">
              ✓
            </div>

            <h2 className="font-slab font-bold text-xl">
              {t.booking.bookingConfirmed}
            </h2>

            <p className="text-sm text-ink-soft mt-1">
              {t.booking.bookingSaved}
            </p>

          </div>

          {createdBooking && (
            <>

              <div className="bg-sand rounded p-4 mt-5 text-sm">

                <h3 className="font-semibold mb-3">
                  {t.booking.bookingInformation}
                </h3>

                <Row
                  label={t.booking.bookingNumber}
                  value={
                    createdBooking.bookingNumber
                  }
                />

                <Row
                  label={t.booking.location}
                  value={
                    location.name
                  }
                />

                <Row
                  label={t.booking.dropOff}
                  value={`${dropDate} ${dropTime}`}
                />

                <Row
                  label={t.booking.pickup}
                  value={`${pickDate} ${pickTime}`}
                />

                <Row
                  label={t.booking.bags}
                  value={String(bags)}
                />

                <Row
                  label="Total"
                  value={`${formatUZS(
                    createdBooking.totalPrice
                  )} ${formatUSD(
                    createdBooking.totalPrice
                  )}`}
                />

                <Row
                  label="Status"
                  value={
                    createdBooking.status
                  }
                />

              </div>

              <div className="border border-line rounded p-5 mt-4 text-center">

                <h3 className="font-slab font-bold text-lg">
                  {t.booking.yourQrCode}
                </h3>

                <p className="text-sm text-ink-soft mt-1">
                  {t.booking.showQr}
                </p>

                {createdBooking.status === "PAID" ? (
                  <>
                    {qrImage ? (
                      <div className="mt-4 flex justify-center">
                        <img
                          src={qrImage}
                          alt={t.booking.qrAlt}
                          className="w-64 h-64"
                        />
                      </div>
                    ) : (
                      <div className="w-64 h-64 mx-auto mt-4 flex items-center justify-center bg-sand rounded">
                        <span className="text-sm text-ink-soft">
                          {t.booking.loadingQr}
                        </span>
                      </div>
                    )}

                    {emailSent ? (
                      <>
                        <p className="text-sm font-semibold text-teal-dark mt-4">
                          {t.booking.qrSentEmail}
                        </p>

                        <p className="text-xs text-ink-soft mt-1">
                          {t.booking.qrEmailSentTo}
                        </p>

                        <p className="text-sm font-semibold mt-1 break-all">
                          {customer.email}
                        </p>

                        <div className="bg-sand rounded p-3 mt-4 text-left">
                          <p className="text-xs font-semibold">
                            {t.booking.didntReceiveEmail}
                          </p>

                          <p className="text-xs text-ink-soft mt-1">
                            {t.booking.checkSpam}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-teal-dark mt-4">
                        {t.booking.yourQrCode} is active.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-64 h-64 mx-auto mt-4 flex items-center justify-center bg-sand rounded border border-line">
                      <div className="text-center px-6">
                        <div className="text-3xl mb-2">🔒</div>
                        <p className="text-sm font-semibold text-ink">
                          {t.booking.qrWaitingPayment}
                        </p>
                        <p className="text-xs text-ink-soft mt-2">
                          {t.booking.yourQrCode} will appear here after
                          the payment is successfully verified.
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-ink-soft mt-4">
                      {t.booking.qrEmailAfterPayment}{" "}<strong>{customer.email}</strong>
                    </p>
                  </>
                )}

              </div>

              <div className="border border-line rounded p-4 mt-4">

                <h3 className="font-semibold mb-2">
                  {t.booking.bagTags}
                </h3>

                <p className="text-xs text-ink-soft mb-3">
                  {t.booking.bagTagsDescription}
                </p>

                <div className="space-y-2">

                  {createdBooking.bagTags.map(
                    (tag) => (
                      <div
                        key={tag}
                        className="bg-sand rounded px-3 py-2 font-mono text-sm"
                      >
                        {tag}
                      </div>
                    )
                  )}

                </div>

              </div>

              <div className="bg-warn-bg text-warn text-xs font-semibold rounded p-3 mt-4">
                {t.booking.paymentRequiredNotice}
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={startPayment}
                  disabled={paymentLoading}
                  className="btn-primary w-full"
                >
                  {paymentLoading
                    ? "{t.booking.preparingPayment}"
                    : "{t.booking.continuePayment}"}
                </button>

                {paymentMessage && (
                  <div className="mt-3 rounded-xl border border-line bg-sand p-3">
                    <p className="text-sm text-ink-soft">
                      {paymentMessage}
                    </p>
                  </div>
                )}
              </div>

            </>
          )}

          <div className="flex justify-start mt-4">

            <button
              onClick={() =>
                setStep(4)
              }
              className="btn-ghost"
            >
              {t.common.back}
            </button>

          </div>

        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid rgba(27, 42, 58, 0.13);
          border-radius: 6px;
          padding: 11px 13px;
          font-size: 14px;
          background: white;
        }

        .input:focus {
          outline: none;
          border-color: #1f6f6b;
          box-shadow: 0 0 0 2px rgba(31, 111, 107, 0.12);
        }

        .input:invalid:focus {
          border-color: #ef4444;
        }

        .btn-primary {
          background: #1f6f6b;
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          border-radius: 6px;
          padding: 11px 22px;
          transition: background 0.15s ease;
        }

        .btn-primary:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .btn-primary:not(:disabled):hover {
          background: #144f4c;
        }

        .btn-ghost {
          color: #144f4c;
          font-weight: 600;
          font-size: 14px;
          padding: 11px 10px;
        }

        .btn-ghost:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>

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
    <div className="mb-3.5">

      <label className="text-xs font-semibold text-ink-soft block mb-1.5">

        {label}

        {required && (
          <span
            className="text-red-500 ml-1"
            aria-label="required"
          >
            *
          </span>
        )}

      </label>

      {children}

    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4 py-1">

      <span className="text-ink-soft">
        {label}
      </span>

      <span className="text-right">
        {value}
      </span>

    </div>
  );
}

export default function BookingWizardPage() {
  return (
    <Suspense>
      <BookingWizardInner />
    </Suspense>
  );
}