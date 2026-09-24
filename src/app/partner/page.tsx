"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import StatusPill from "@/components/StatusPill";
import DemoBadge from "@/components/DemoBadge";
import { createClient } from "@/lib/supabase/client";

type Location = {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  price_per_bag: number;
  capacity: number;
  opening_time: string;
  closing_time: string;
  active: boolean;
};

type Bag = {
  id: string;
  tag_number: string;
  status: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
};

type Booking = {
  id: string;
  booking_number: string;
  access_token: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  location_id: string;
  dropoff_date: string;
  pickup_date: string;
  dropoff_time: string;
  pickup_time: string;
  bag_count: number;
  price_per_bag: number;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  bags: Bag[];
};

const STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "CHECKED_IN",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
];

function safeStatus(status: string) {
  return STATUSES.includes(status)
    ? status
    : "PENDING_PAYMENT";
}

function money(value: number, currency = "UZS") {
  return `${Number(value || 0).toLocaleString()} ${currency}`;
}

function date(value: string) {
  if (!value) return "—";

  const parts = value.split("-");

  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }

  return value;
}

function time(value: string) {
  return String(value || "").slice(0, 5);
}

export default function PartnerDashboardPage() {
  const supabase = createClient();

  // ==================================================
  // STATE
  // ==================================================

  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState("");
  const [loadingLocations, setLoadingLocations] =
    useState(true);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] =
    useState(false);

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);

  const [scanInput, setScanInput] = useState("");
  const [scanLoading, setScanLoading] =
    useState(false);
  const [scanError, setScanError] = useState("");

  const [scannerOpen, setScannerOpen] =
    useState(false);
  const [scannerLoading, setScannerLoading] =
    useState(false);
  const [scannerError, setScannerError] =
    useState("");

  const scannerRef = useRef<any>(null);
  const scanningRef = useRef(false);

  const [actionLoading, setActionLoading] =
    useState(false);
  const [actionError, setActionError] =
    useState("");
  const [actionMessage, setActionMessage] =
    useState("");

  // ==================================================
  // LOAD PARTNER LOCATIONS
  // ==================================================

  useEffect(() => {
    async function loadLocations() {
      try {
        setLoadingLocations(true);

        const response = await fetch(
          "/api/partner/locations"
        );

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(
            result.error ||
              "Could not load partner locations."
          );
        }

        const list =
          (result.locations ?? []) as Location[];

        setLocations(list);

        if (list.length > 0) {
          setLocationId(list[0].id);
        }
      } catch (error) {
        console.error(error);

        setLocations([]);
        setLocationId("");

        setScanError(
          error instanceof Error
            ? error.message
            : "Could not load partner locations."
        );
      } finally {
        setLoadingLocations(false);
      }
    }

    loadLocations();
  }, []);

  // ==================================================
  // LOAD BOOKINGS
  // ==================================================

  async function loadBookings(
    currentLocationId = locationId
  ) {
    if (!currentLocationId) {
      setBookings([]);
      return;
    }

    try {
      setLoadingBookings(true);

      const response = await fetch(
        `/api/partner/bookings?locationId=${encodeURIComponent(
          currentLocationId
        )}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error ||
            "Could not load bookings."
        );
      }

      const list =
        (result.bookings ?? []) as Booking[];

      setBookings(list);

      // Update opened booking after refresh.
      if (selectedBooking) {
        const fresh = list.find(
          (item) =>
            item.id === selectedBooking.id
        );

        if (fresh) {
          setSelectedBooking(fresh);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load bookings:",
        error
      );
    } finally {
      setLoadingBookings(false);
    }
  }

  useEffect(() => {
    if (locationId) {
      loadBookings(locationId);
    }
  }, [locationId]);

  // ==================================================
  // OPEN/CLOSE DETAIL
  // ==================================================

  function openBooking(booking: Booking) {
    setSelectedBooking(booking);
    setDetailOpen(true);

    setScanError("");
    setActionError("");
    setActionMessage("");
  }

  function closeBooking() {
    setDetailOpen(false);
    setSelectedBooking(null);
  }

  // ==================================================
  // QR / BOOKING LOOKUP
  // ==================================================

  async function lookupBooking(value: string) {
    const cleanValue = value.trim();

    if (!cleanValue) {
      setScanError(
        "QR code or booking number is empty."
      );
      return;
    }

    if (!locationId) {
      setScanError(
        "Partner location is not selected."
      );
      return;
    }

    try {
      setScanLoading(true);
      setScanError("");
      setActionError("");
      setActionMessage("");

      const response = await fetch(
        "/api/partner/lookup",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            locationId,
            value: cleanValue,
          }),
        }
      );

      const result = await response.json();

      console.log(
        "QR / BOOKING LOOKUP RESULT:",
        result
      );

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error ||
            "Booking was not found."
        );
      }

      if (!result.booking) {
        throw new Error(
          "Booking was found but no booking data was returned."
        );
      }

      const raw =
        result.booking as Booking;

      const booking: Booking = {
        ...raw,
        bag_count: Number(
          raw.bag_count
        ),
        price_per_bag: Number(
          raw.price_per_bag
        ),
        total_amount: Number(
          raw.total_amount
        ),
        bags: Array.isArray(raw.bags)
          ? raw.bags
          : [],
      };

      console.log(
        "BOOKING FOUND:",
        booking.booking_number,
        booking.status
      );

      // QR topilganda darhol detail ochiladi.
      setSelectedBooking(booking);
      setDetailOpen(true);

      // Scan inputda oxirgi QR/token turadi.
      setScanInput(cleanValue);

      // Ro'yxatni ham yangilab qo'yamiz.
      await loadBookings(locationId);
    } catch (error) {
      console.error(
        "Booking lookup failed:",
        error
      );

      setSelectedBooking(null);
      setDetailOpen(false);

      setScanError(
        error instanceof Error
          ? error.message
          : "Booking was not found."
      );
    } finally {
      setScanLoading(false);
    }
  }

  // ==================================================
  // START QR SCANNER
  // ==================================================

  async function startScanner() {
    if (
      scannerOpen ||
      scannerLoading ||
      scanningRef.current
    ) {
      return;
    }

    if (!locationId) {
      setScannerError(
        "Select a partner location first."
      );
      return;
    }

    setScannerError("");
    setScanError("");
    setScannerLoading(true);

    try {
      const { Html5Qrcode } =
        await import("html5-qrcode");

      // DOM element render bo'lishi uchun
      // scanner panelni ochamiz.
      setScannerOpen(true);

      // React render uchun ozgina vaqt.
      await new Promise((resolve) =>
        setTimeout(resolve, 150)
      );

      const element =
        document.getElementById(
          "bagdrop-qr-reader"
        );

      if (!element) {
        throw new Error(
          "QR scanner area was not created."
        );
      }

      const scanner = new Html5Qrcode(
        "bagdrop-qr-reader"
      );

      scannerRef.current = scanner;
      scanningRef.current = true;

      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
          aspectRatio: 1,
        },
        async (decodedText: string) => {
          if (!decodedText.trim()) {
            return;
          }

          // Bir QR'ni bir necha marta
          // parallel lookup qilmaslik.
          if (!scanningRef.current) {
            return;
          }

          scanningRef.current = false;

          const value =
            decodedText.trim();

          console.log(
            "QR SCANNED:",
            value
          );

          try {
            await scanner.stop();
          } catch (error) {
            console.error(
              "Scanner stop error:",
              error
            );
          }

          try {
            scanner.clear();
          } catch (error) {
            console.error(
              "Scanner clear error:",
              error
            );
          }

          scannerRef.current = null;
          setScannerOpen(false);
          setScannerLoading(false);

          // QR topilganidan keyin booking
          // avtomatik ochiladi.
          await lookupBooking(value);
        },
        () => {
          // QR topilmagan frame'lar.
        }
      );
    } catch (error) {
      console.error(
        "QR scanner failed:",
        error
      );

      scannerRef.current = null;
      scanningRef.current = false;

      setScannerOpen(false);
      setScannerLoading(false);

      setScannerError(
        error instanceof Error
          ? error.message
          : "Could not start QR camera."
      );
    }
  }

  // ==================================================
  // STOP QR SCANNER
  // ==================================================

  async function stopScanner() {
    const scanner =
      scannerRef.current;

    scanningRef.current = false;

    if (scanner) {
      try {
        await scanner.stop();
      } catch (error) {
        console.error(
          "Scanner stop error:",
          error
        );
      }

      try {
        scanner.clear();
      } catch (error) {
        console.error(
          "Scanner clear error:",
          error
        );
      }
    }

    scannerRef.current = null;
    setScannerOpen(false);
    setScannerLoading(false);
  }

  useEffect(() => {
    return () => {
      const scanner =
        scannerRef.current;

      scanningRef.current = false;

      if (scanner) {
        scanner.stop().catch(() => {});

        try {
          scanner.clear();
        } catch {}
      }
    };
  }, []);

  // ==================================================
  // MANUAL BOOKING NUMBER FALLBACK
  // ==================================================

  async function handleManualLookup(
    event: React.FormEvent
  ) {
    event.preventDefault();

    await lookupBooking(scanInput);
  }

  // ==================================================
  // CHECK-IN / CHECK-OUT
  // ==================================================

  async function transitionBooking(
    booking: Booking,
    nextStatus:
      | "CHECKED_IN"
      | "COMPLETED"
  ) {
    if (actionLoading) return;

    if (!locationId) {
      setActionError(
        "Partner location is not selected."
      );
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");
      setActionMessage("");

      const response = await fetch(
        "/api/partner/transition",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            locationId,
            bookingId: booking.id,
            status: nextStatus,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error ||
            "Could not update booking."
        );
      }

      const raw =
        result.booking as Booking;

      const updated: Booking = {
        ...raw,
        bag_count: Number(
          raw.bag_count
        ),
        price_per_bag: Number(
          raw.price_per_bag
        ),
        total_amount: Number(
          raw.total_amount
        ),
        bags: Array.isArray(raw.bags)
          ? raw.bags
          : [],
      };

      setSelectedBooking(updated);

      setActionMessage(
        nextStatus === "CHECKED_IN"
          ? "✓ Luggage checked in successfully."
          : "✓ Luggage checked out successfully."
      );

      await loadBookings(locationId);
    } catch (error) {
      console.error(
        "Transition error:",
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : "Could not update booking."
      );
    } finally {
      setActionLoading(false);
    }
  }

  // ==================================================
  // STATS
  // ==================================================

  const stats = useMemo(() => {
    const paid = bookings.filter(
      (booking) =>
        booking.status === "PAID"
    ).length;

    const checkedInBags =
      bookings
        .filter(
          (booking) =>
            booking.status ===
            "CHECKED_IN"
        )
        .reduce(
          (sum, booking) =>
            sum +
            Number(
              booking.bag_count
            ),
          0
        );

    const pickupExpected =
      bookings.filter(
        (booking) =>
          booking.status ===
          "CHECKED_IN"
      ).length;

    const revenue =
      bookings
        .filter(
          (booking) =>
            booking.status ===
              "CHECKED_IN" ||
            booking.status ===
              "COMPLETED"
        )
        .reduce(
          (sum, booking) =>
            sum +
            Number(
              booking.total_amount
            ),
          0
        );

    return {
      paid,
      checkedInBags,
      pickupExpected,
      revenue,
    };
  }, [bookings]);

  const selectedLocation =
    locations.find(
      (location) =>
        location.id === locationId
    );

  // ==================================================
  // LOGOUT
  // ==================================================

  async function logout() {
    await supabase.auth.signOut();
    window.location.href =
      "/partner/login";
  }

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* HEADER */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="font-slab font-bold text-2xl">
          Partner dashboard
        </h1>

        <DemoBadge label="Partner account" />

        <button
          type="button"
          onClick={logout}
          className="ml-auto border border-line rounded px-3 py-1.5 text-xs font-semibold hover:bg-sand"
        >
          Logout
        </button>
      </div>

      <p className="text-ink-soft text-sm mt-1 mb-6">
        {selectedLocation
          ? `BagDrop — ${selectedLocation.name}`
          : loadingLocations
          ? "Loading..."
          : "No location assigned."}
      </p>

      {/* LOCATION */}
      {locations.length > 0 && (
        <div className="bg-white border border-line rounded-lg p-4 mb-6">
          <label className="text-xs text-ink-soft block mb-1.5">
            Partner location
          </label>

          <select
            value={locationId}
            onChange={(event) => {
              setLocationId(
                event.target.value
              );

              closeBooking();
              setScanError("");
              setActionError("");
              setActionMessage("");
            }}
            className="input"
          >
            {locations.map(
              (location) => (
                <option
                  key={location.id}
                  value={location.id}
                >
                  {location.name} —{" "}
                  {location.city}
                </option>
              )
            )}
          </select>

          {selectedLocation && (
            <p className="text-xs text-ink-soft mt-2">
              {selectedLocation.address}
            </p>
          )}
        </div>
      )}

      {/* ==================================================
          MAIN QR AREA
      ================================================== */}

      <div className="bg-ink text-white rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-slab font-bold text-xl">
              📷 Scan customer QR
            </h2>

            <p className="text-[#cfd9e0] text-sm mt-1">
              Scan the customer's QR for
              check-in or check-out.
            </p>
          </div>

          <div className="text-3xl">
            QR
          </div>
        </div>

        <button
          type="button"
          onClick={
            scannerOpen
              ? stopScanner
              : startScanner
          }
          disabled={
            scannerLoading ||
            !locationId
          }
          className="w-full mt-5 bg-white text-ink rounded-lg px-4 py-3.5 text-sm font-bold hover:bg-sand disabled:opacity-50"
        >
          {scannerLoading
            ? "Opening camera..."
            : scannerOpen
            ? "Close scanner"
            : "📷 Scan QR code"}
        </button>

        {/* CAMERA */}
        {scannerOpen && (
          <div className="mt-4 bg-white rounded-lg p-3">
            <div
              id="bagdrop-qr-reader"
              className="overflow-hidden rounded"
            />

            <p className="text-ink-soft text-xs text-center mt-3">
              Point the camera at the
              customer's BagDrop QR code.
            </p>

            {scannerError && (
              <p className="text-red-600 text-xs mt-2">
                {scannerError}
              </p>
            )}

            <button
              type="button"
              onClick={stopScanner}
              className="w-full mt-3 border border-line text-ink rounded px-3 py-2 text-xs font-semibold"
            >
              Close camera
            </button>
          </div>
        )}

        {/* MANUAL FALLBACK */}
        <div className="border-t border-white/10 mt-5 pt-4">
          <p className="text-[#cfd9e0] text-xs mb-2">
            Manual fallback
          </p>

          <form
            onSubmit={
              handleManualLookup
            }
            className="flex gap-2"
          >
            <input
              value={scanInput}
              onChange={(event) =>
                setScanInput(
                  event.target.value
                )
              }
              placeholder="Booking number"
              className="flex-1 min-w-0 rounded-lg px-3 py-2.5 text-sm text-ink"
            />

            <button
              type="submit"
              disabled={
                scanLoading ||
                !locationId
              }
              className="bg-clay rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {scanLoading
                ? "..."
                : "Find"}
            </button>
          </form>
        </div>

        {scanError && (
          <div className="mt-3 bg-red-500/10 text-red-200 rounded-lg p-3 text-xs">
            {scanError}
          </div>
        )}
      </div>

      {/* ==================================================
          STATS
      ================================================== */}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat
          label="Paid"
          value={stats.paid}
        />

        <Stat
          label="Bags checked in"
          value={
            stats.checkedInBags
          }
        />

        <Stat
          label="Pickup expected"
          value={
            stats.pickupExpected
          }
        />

        <Stat
          label="Revenue"
          value={`${stats.revenue.toLocaleString()} UZS`}
        />
      </div>

      {/* ==================================================
          BOOKINGS
      ================================================== */}

      <div className="flex justify-between items-end mb-3">
        <div>
          <h2 className="font-slab font-bold text-lg">
            Bookings
          </h2>

          <p className="text-xs text-ink-soft">
            Tap a booking to view details.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadBookings(locationId)
          }
          disabled={loadingBookings}
          className="text-xs font-semibold text-teal-dark hover:underline"
        >
          {loadingBookings
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      <div className="space-y-2">
        {bookings.map((booking) => (
          <button
            key={booking.id}
            type="button"
            onClick={() =>
              openBooking(booking)
            }
            className="w-full text-left bg-white border border-line rounded-lg p-4 hover:border-teal hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <b className="font-slab">
                  #{booking.booking_number}
                </b>

                <p className="text-xs text-ink-soft mt-1 truncate">
                  {booking.customer_name}
                  {" · "}
                  {booking.bag_count} bag
                  {booking.bag_count > 1
                    ? "s"
                    : ""}
                  {" · "}
                  {date(
                    booking.dropoff_date
                  )}
                </p>
              </div>

              <div className="shrink-0">
                <StatusPill
                  status={
                    safeStatus(
                      booking.status
                    ) as any
                  }
                />
              </div>
            </div>
          </button>
        ))}

        {!loadingBookings &&
          bookings.length === 0 && (
            <div className="bg-white border border-line rounded-lg p-6 text-center">
              <p className="text-sm text-ink-soft">
                No bookings yet.
              </p>
            </div>
          )}
      </div>

      {/* ==================================================
          BOOKING DETAIL
      ================================================== */}

      {detailOpen &&
        selectedBooking && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center sm:p-5"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeBooking();
              }
            }}
          >
            <div className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl">
              {/* HEADER */}
              <div className="sticky top-0 z-10 bg-white border-b border-line px-5 py-4 flex justify-between items-start gap-4">
                <div>
                  <p className="text-xs text-ink-soft">
                    Booking
                  </p>

                  <h2 className="font-slab font-bold text-xl">
                    #
                    {
                      selectedBooking.booking_number
                    }
                  </h2>

                  <p className="text-sm text-ink-soft">
                    {
                      selectedBooking.customer_name
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeBooking
                  }
                  className="w-9 h-9 rounded-full border border-line text-lg"
                >
                  ×
                </button>
              </div>

              <div className="p-5">
                {/* STATUS + ACTION */}
                <div className="rounded-xl bg-sand p-4 mb-4">
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <span className="text-xs text-ink-soft block">
                        Current status
                      </span>

                      <div className="mt-1">
                        <StatusPill
                          status={
                            safeStatus(
                              selectedBooking.status
                            ) as any
                          }
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-ink-soft block">
                        Total
                      </span>

                      <b>
                        {money(
                          selectedBooking.total_amount,
                          selectedBooking.currency
                        )}
                      </b>
                    </div>
                  </div>

                  {/* PAID -> CHECK IN */}
                  {safeStatus(
                    selectedBooking.status
                  ) === "PAID" && (
                    <button
                      type="button"
                      disabled={
                        actionLoading
                      }
                      onClick={() =>
                        transitionBooking(
                          selectedBooking,
                          "CHECKED_IN"
                        )
                      }
                      className="w-full mt-4 bg-teal text-white rounded-lg px-4 py-3.5 font-bold text-sm disabled:opacity-50"
                    >
                      {actionLoading
                        ? "Checking in..."
                        : "✓ CHECK IN LUGGAGE"}
                    </button>
                  )}

                  {/* CHECKED_IN -> CHECK OUT */}
                  {safeStatus(
                    selectedBooking.status
                  ) ===
                    "CHECKED_IN" && (
                    <button
                      type="button"
                      disabled={
                        actionLoading
                      }
                      onClick={() =>
                        transitionBooking(
                          selectedBooking,
                          "COMPLETED"
                        )
                      }
                      className="w-full mt-4 bg-teal text-white rounded-lg px-4 py-3.5 font-bold text-sm disabled:opacity-50"
                    >
                      {actionLoading
                        ? "Processing..."
                        : "✓ CHECK OUT LUGGAGE"}
                    </button>
                  )}

                  {/* PAYMENT NOT DONE */}
                  {safeStatus(
                    selectedBooking.status
                  ) ===
                    "PENDING_PAYMENT" && (
                    <div className="mt-4 bg-yellow-100 text-yellow-800 rounded-lg p-3 text-xs font-semibold">
                      Payment is not verified
                      yet. Luggage cannot be
                      checked in until the
                      booking becomes PAID.
                    </div>
                  )}

                  {/* COMPLETED */}
                  {safeStatus(
                    selectedBooking.status
                  ) ===
                    "COMPLETED" && (
                    <div className="mt-4 bg-green-100 text-green-800 rounded-lg p-3 text-xs font-semibold">
                      ✓ This luggage has already
                      been checked out.
                    </div>
                  )}

                  {/* CANCELLED / EXPIRED */}
                  {(safeStatus(
                    selectedBooking.status
                  ) ===
                    "CANCELLED" ||
                    safeStatus(
                      selectedBooking.status
                    ) ===
                      "EXPIRED") && (
                    <div className="mt-4 bg-red-100 text-red-700 rounded-lg p-3 text-xs font-semibold">
                      This booking is no longer
                      active.
                    </div>
                  )}
                </div>

                {/* ACTION MESSAGE */}
                {actionMessage && (
                  <div className="bg-green-100 text-green-800 rounded-lg p-3 text-sm mb-4">
                    {actionMessage}
                  </div>
                )}

                {actionError && (
                  <div className="bg-red-100 text-red-700 rounded-lg p-3 text-sm mb-4">
                    {actionError}
                  </div>
                )}

                {/* CUSTOMER */}
                <section className="border border-line rounded-xl p-4 mb-4">
                  <h3 className="font-semibold text-sm mb-3">
                    Customer
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Info
                      label="Name"
                      value={
                        selectedBooking.customer_name
                      }
                    />

                    <Info
                      label="Phone"
                      value={
                        selectedBooking.customer_phone
                      }
                    />

                    <Info
                      label="Email"
                      value={
                        selectedBooking.customer_email
                      }
                    />

                    <Info
                      label="Bags"
                      value={String(
                        selectedBooking.bag_count
                      )}
                    />
                  </div>
                </section>

                {/* STORAGE */}
                <section className="border border-line rounded-xl p-4 mb-4">
                  <h3 className="font-semibold text-sm mb-3">
                    Storage
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-sand rounded-lg p-3">
                      <span className="text-xs text-ink-soft block">
                        Drop-off
                      </span>

                      <b className="text-sm">
                        {date(
                          selectedBooking.dropoff_date
                        )}
                      </b>

                      <p className="text-xs text-ink-soft">
                        {time(
                          selectedBooking.dropoff_time
                        )}
                      </p>
                    </div>

                    <div className="bg-sand rounded-lg p-3">
                      <span className="text-xs text-ink-soft block">
                        Pickup
                      </span>

                      <b className="text-sm">
                        {date(
                          selectedBooking.pickup_date
                        )}
                      </b>

                      <p className="text-xs text-ink-soft">
                        {time(
                          selectedBooking.pickup_time
                        )}
                      </p>
                    </div>
                  </div>
                </section>

                {/* BAGS */}
                <section className="border border-line rounded-xl p-4 mb-4">
                  <div className="flex justify-between mb-3">
                    <h3 className="font-semibold text-sm">
                      Bags & tags
                    </h3>

                    <span className="text-xs text-ink-soft">
                      {
                        selectedBooking.bags
                          ?.length
                      }{" "}
                      bags
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(
                      selectedBooking.bags ??
                      []
                    ).map((bag) => (
                      <div
                        key={bag.id}
                        className="bg-sand rounded-lg p-3 flex justify-between items-center"
                      >
                        <div>
                          <span className="text-[10px] text-ink-soft block">
                            Tag number
                          </span>

                          <b className="font-mono">
                            {bag.tag_number}
                          </b>
                        </div>

                        <span className="text-xs font-semibold">
                          {bag.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* PAYMENT */}
                <section className="border border-line rounded-xl p-4">
                  <h3 className="font-semibold text-sm mb-3">
                    Payment
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <Info
                      label="Price / bag"
                      value={money(
                        selectedBooking.price_per_bag,
                        selectedBooking.currency
                      )}
                    />

                    <Info
                      label="Total"
                      value={money(
                        selectedBooking.total_amount,
                        selectedBooking.currency
                      )}
                    />
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid
            rgba(27, 42, 58, 0.13);
          border-radius: 8px;
          padding: 11px 13px;
          font-size: 14px;
          background: white;
        }

        .input:focus {
          outline: none;
          border-color: #1f6f6b;
          box-shadow: 0 0 0 2px
            rgba(31, 111, 107, 0.12);
        }
      `}</style>
    </div>
  );
}

// ==================================================
// INFO
// ==================================================

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span className="text-xs text-ink-soft block">
        {label}
      </span>

      <span className="text-sm font-medium break-words">
        {value || "—"}
      </span>
    </div>
  );
}

// ==================================================
// STAT
// ==================================================

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white border border-line rounded-lg p-4">
      <span className="text-xs text-ink-soft block">
        {label}
      </span>

      <b className="font-slab text-xl">
        {value}
      </b>
    </div>
  );
}