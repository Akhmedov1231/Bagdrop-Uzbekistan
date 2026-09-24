"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import StatusPill from "@/components/StatusPill";

type Tab =
  | "bookings"
  | "locations"
  | "luggage";

type BookingStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CHECKED_IN"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

type Bag = {
  id: string;
  tag_number: string;
  status: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
};

type Booking = {
  id: string;
  bookingNumber: string;

  customerName: string;
  customerEmail: string;
  customerPhone: string;

  locationId: string;
  locationName: string;
  city: string;

  dropoffDate: string;
  pickupDate: string;
  dropoffTime: string;
  pickupTime: string;

  bags: number;
  pricePerBag: number;
  totalAmount: number;
  currency: string;

  status: BookingStatus;

  createdAt: string;
  updatedAt: string;

  bagsList: Bag[];
};

type Location = {
  id: string;
  partnerId: string;

  city: string;
  name: string;
  slug: string;
  address: string;

  latitude: number;
  longitude: number;

  pricePerBag: number;
  capacity: number;

  openingTime: string;
  closingTime: string;

  active: boolean;

  googleMapsUrl?: string | null;
  yandexMapsUrl?: string | null;

  partnerName: string;

  createdAt: string;
};

type LocationForm = {
  name: string;
  address: string;
  pricePerBag: string;
  capacity: string;
  openingTime: string;
  closingTime: string;
  active: boolean;
  googleMapsUrl: string;
  yandexMapsUrl: string;
};

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [tab, setTab] =
    useState<Tab>("bookings");

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  const [statusFilter, setStatusFilter] =
    useState<BookingStatus | "ALL">("ALL");

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [locations, setLocations] =
    useState<Location[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);

  const [selectedLocation, setSelectedLocation] =
    useState<Location | null>(null);

  const [locationForm, setLocationForm] =
    useState<LocationForm>({
      name: "",
      address: "",
      pricePerBag: "",
      capacity: "",
      openingTime: "08:00",
      closingTime: "22:00",
      active: true,
      googleMapsUrl: "",
      yandexMapsUrl: "",
    });

  const [savingLocation, setSavingLocation] =
    useState(false);

  const [locationSaveError, setLocationSaveError] =
    useState("");

  // ==========================================
  // LOAD ADMIN DATA
  // ==========================================

  async function loadAdminData() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/data",
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.ok
      ) {
        throw new Error(
          result.error ||
            "Could not load admin data."
        );
      }

      setBookings(
        result.bookings ?? []
      );

      setLocations(
        result.locations ?? []
      );
    } catch (error) {
      console.error(
        "Admin data loading error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Could not load admin data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  // ==========================================
  // TODAY
  // ==========================================

  const todayStr = new Date()
    .toISOString()
    .slice(0, 10);

  const todayBookings =
    bookings.filter(
      (booking) =>
        booking.createdAt.slice(
          0,
          10
        ) === todayStr
    );

  // ==========================================
  // STATS
  // ==========================================

  const stats = useMemo(() => {
    const revenue = bookings
      .filter(
        (booking) =>
          booking.status === "PAID" ||
          booking.status ===
            "CHECKED_IN" ||
          booking.status ===
            "COMPLETED"
      )
      .reduce(
        (sum, booking) =>
          sum +
          Number(
            booking.totalAmount
          ),
        0
      );

    const activeBags =
      bookings
        .filter(
          (booking) =>
            booking.status ===
            "CHECKED_IN"
        )
        .reduce(
          (sum, booking) =>
            sum +
            Number(booking.bags),
          0
        );

    const completed =
      bookings.filter(
        (booking) =>
          booking.status ===
          "COMPLETED"
      ).length;

    const cancelled =
      bookings.filter(
        (booking) =>
          booking.status ===
          "CANCELLED"
      ).length;

    const paid =
      bookings.filter(
        (booking) =>
          booking.status ===
          "PAID"
      ).length;

    const pendingPayment =
      bookings.filter(
        (booking) =>
          booking.status ===
          "PENDING_PAYMENT"
      ).length;

    const checkedIn =
      bookings.filter(
        (booking) =>
          booking.status ===
          "CHECKED_IN"
      ).length;

    return {
      revenue,
      activeBags,
      completed,
      cancelled,
      paid,
      pendingPayment,
      checkedIn,
    };
  }, [bookings]);

  // ==========================================
  // FILTERED BOOKINGS
  // ==========================================

  const filteredBookings =
    statusFilter === "ALL"
      ? bookings
      : bookings.filter(
          (booking) =>
            booking.status ===
            statusFilter
        );

  // ==========================================
  // ACTIVE LUGGAGE
  // ==========================================

  const activeLuggage =
    bookings.filter(
      (booking) =>
        booking.status ===
        "CHECKED_IN"
    );

  // ==========================================
  // MONEY
  // ==========================================

  function formatMoney(
    amount: number,
    currency = "UZS"
  ) {
    return `${Number(
      amount
    ).toLocaleString(
      "en-US"
    )} ${currency}`;
  }

  // ==========================================
  // OPEN LOCATION EDITOR
  // ==========================================

  function openLocationEditor(
    location: Location
  ) {
    setSelectedLocation(
      location
    );

    setLocationSaveError("");

    setLocationForm({
      name: location.name,
      address: location.address,
      pricePerBag: String(
        location.pricePerBag
      ),
      capacity: String(
        location.capacity
      ),
      openingTime:
        location.openingTime ||
        "08:00",
      closingTime:
        location.closingTime ||
        "22:00",
      active: location.active,
      googleMapsUrl:
        location.googleMapsUrl ||
        "",
      yandexMapsUrl:
        location.yandexMapsUrl ||
        "",
    });
  }

  // ==========================================
  // SAVE LOCATION
  // ==========================================

  async function saveLocation() {
    if (!selectedLocation) {
      return;
    }

    try {
      setSavingLocation(true);
      setLocationSaveError("");

      const response =
        await fetch(
          "/api/admin/locations",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id:
                selectedLocation.id,

              name:
                locationForm.name,

              address:
                locationForm.address,

              pricePerBag:
                Number(
                  locationForm.pricePerBag
                ),

              capacity:
                Number(
                  locationForm.capacity
                ),

              openingTime:
                locationForm.openingTime,

              closingTime:
                locationForm.closingTime,

              active:
                locationForm.active,

              googleMapsUrl:
                locationForm.googleMapsUrl,

              yandexMapsUrl:
                locationForm.yandexMapsUrl,
            }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.ok
      ) {
        throw new Error(
          result.error ||
            "Could not update location."
        );
      }

      await loadAdminData();

      setSelectedLocation(
        null
      );
    } catch (error) {
      console.error(
        "Location save error:",
        error
      );

      setLocationSaveError(
        error instanceof Error
          ? error.message
          : "Could not update location."
      );
    } finally {
      setSavingLocation(false);
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <p className="text-ink-soft">
          Loading admin dashboard...
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16">

        <div className="bg-white border border-line rounded-lg p-5">

          <h2 className="font-slab font-bold text-xl mb-2">
            Could not load admin data
          </h2>

          <p className="text-sm text-ink-soft mb-4">
            {error}
          </p>

          <button
            onClick={
              loadAdminData
            }
            className="bg-clay text-white rounded px-4 py-2 text-sm font-semibold"
          >
            Try again
          </button>

        </div>

      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <>
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* ====================================
            HEADER
        ==================================== */}

        <div className="flex items-center gap-3 flex-wrap mb-6">

          <h1 className="font-slab font-bold text-2xl">
            Admin dashboard
          </h1>

          <span className="inline-flex items-center rounded-full bg-[#fff1d6] px-2.5 py-1 text-[10px] font-semibold text-[#9a651d]">
            Live Supabase data
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={
                loadAdminData
              }
              className="border border-line rounded px-3 py-1.5 text-xs font-semibold hover:bg-sand transition-colors"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="border border-red-200 text-red-700 rounded px-3 py-1.5 text-xs font-semibold hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>

        </div>

        {/* ====================================
            MAIN STATS
        ==================================== */}

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-5">

          <Stat
            label="Bookings"
            value={
              bookings.length
            }
          />

          <Stat
            label="Bookings today"
            value={
              todayBookings.length
            }
          />

          <Stat
            label="Revenue"
            value={formatMoney(
              stats.revenue
            )}
          />

          <Stat
            label="Active luggage"
            value={
              stats.activeBags
            }
          />

          <Stat
            label="Completed"
            value={
              stats.completed
            }
          />

          <Stat
            label="Cancelled"
            value={
              stats.cancelled
            }
          />

        </div>

        {/* ====================================
            SECONDARY STATS
        ==================================== */}

        <div className="grid grid-cols-3 gap-2.5 mb-7">

          <MiniStat
            label="Pending payment"
            value={
              stats.pendingPayment
            }
          />

          <MiniStat
            label="Paid / waiting"
            value={
              stats.paid
            }
          />

          <MiniStat
            label="Checked in"
            value={
              stats.checkedIn
            }
          />

        </div>

        {/* ====================================
            TABS
        ==================================== */}

        <div className="flex gap-5 border-b border-line mb-5 text-sm font-semibold">

          <button
            onClick={() =>
              setTab("bookings")
            }
            className={`pb-2.5 ${
              tab === "bookings"
                ? "text-ink border-b-2 border-clay"
                : "text-ink-soft border-b-2 border-transparent"
            }`}
          >
            Bookings
          </button>

          <button
            onClick={() =>
              setTab("locations")
            }
            className={`pb-2.5 ${
              tab === "locations"
                ? "text-ink border-b-2 border-clay"
                : "text-ink-soft border-b-2 border-transparent"
            }`}
          >
            Locations
          </button>

          <button
            onClick={() =>
              setTab("luggage")
            }
            className={`pb-2.5 ${
              tab === "luggage"
                ? "text-ink border-b-2 border-clay"
                : "text-ink-soft border-b-2 border-transparent"
            }`}
          >
            Active luggage
          </button>

        </div>

        {/* ====================================
            BOOKINGS TAB
        ==================================== */}

        {tab === "bookings" && (
          <div>

            <div className="flex items-center justify-between gap-3 mb-3.5">

              <select
                value={
                  statusFilter
                }
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as
                      | BookingStatus
                      | "ALL"
                  )
                }
                className="border border-line rounded px-3 py-2 text-sm bg-white"
              >

                <option value="ALL">
                  All statuses
                </option>

                <option value="PENDING_PAYMENT">
                  PENDING PAYMENT
                </option>

                <option value="PAID">
                  PAID
                </option>

                <option value="CHECKED_IN">
                  CHECKED IN
                </option>

                <option value="COMPLETED">
                  COMPLETED
                </option>

                <option value="CANCELLED">
                  CANCELLED
                </option>

                <option value="EXPIRED">
                  EXPIRED
                </option>

              </select>

              <span className="text-xs text-ink-soft">
                {
                  filteredBookings.length
                }{" "}
                bookings
              </span>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-sm bg-white border border-line rounded overflow-hidden">

                <thead>

                  <tr className="bg-sand text-ink-soft text-[11.5px] uppercase">

                    <th className="text-left px-3.5 py-2.5">
                      Booking #
                    </th>

                    <th className="text-left px-3.5 py-2.5">
                      Customer
                    </th>

                    <th className="text-left px-3.5 py-2.5">
                      Location
                    </th>

                    <th className="text-left px-3.5 py-2.5">
                      Bags
                    </th>

                    <th className="text-left px-3.5 py-2.5">
                      Total
                    </th>

                    <th className="text-left px-3.5 py-2.5">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredBookings.map(
                    (booking) => (
                      <tr
                        key={
                          booking.id
                        }
                        onClick={() =>
                          setSelectedBooking(
                            booking
                          )
                        }
                        className="border-t border-line cursor-pointer hover:bg-sand/40 transition-colors"
                      >

                        <td className="px-3.5 py-2.5 font-medium whitespace-nowrap">
                          #
                          {
                            booking.bookingNumber
                          }
                        </td>

                        <td className="px-3.5 py-2.5">

                          <div className="font-medium">
                            {
                              booking.customerName
                            }
                          </div>

                          <div className="text-xs text-ink-soft">
                            {
                              booking.customerEmail
                            }
                          </div>

                        </td>

                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          {
                            booking.locationName
                          }
                        </td>

                        <td className="px-3.5 py-2.5">
                          {
                            booking.bags
                          }
                        </td>

                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          {formatMoney(
                            booking.totalAmount,
                            booking.currency
                          )}
                        </td>

                        <td className="px-3.5 py-2.5">

                          <StatusPill
                            status={
                              booking.status
                            }
                          />

                        </td>

                      </tr>
                    )
                  )}

                  {filteredBookings.length ===
                    0 && (
                    <tr>

                      <td
                        colSpan={6}
                        className="px-3.5 py-8 text-center text-ink-soft"
                      >
                        No bookings found.
                      </td>

                    </tr>
                  )}

                </tbody>

              </table>

            </div>

            <p className="text-[11px] text-ink-soft mt-2">
              Click a booking to view
              full details.
            </p>

          </div>
        )}

        {/* ====================================
            LOCATIONS TAB
        ==================================== */}

        {tab === "locations" && (
          <div>

            <div className="flex items-center justify-between mb-3.5">

              <div>
                <h2 className="font-slab font-bold text-lg">
                  Locations
                </h2>

                <p className="text-xs text-ink-soft mt-0.5">
                  Manage price, capacity,
                  hours and availability.
                </p>
              </div>

              <span className="text-xs text-ink-soft">
                {
                  locations.length
                }{" "}
                locations
              </span>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-sm bg-white border border-line rounded overflow-hidden">

                <thead>

                  <tr className="bg-sand text-ink-soft text-[11.5px] uppercase">

                    <th className="text-left px-3.5 py-2.5">
                      Location
                    </th>

                    <th className="text-left px-3.5 py-2.5">
                      Partner
                    </th>

                    <th className="text-left px-3.5 py-2.5">
                      Price/bag/day
                    </th>

                    <th className="text-left px-3.5 py-2.5">
                      Capacity
                    </th>

                    <th className="text-left px-3.5 py-2.5">
                      Hours
                    </th>

                    <th className="text-left px-3.5 py-2.5">
                      Status
                    </th>

                    <th className="text-right px-3.5 py-2.5">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {locations.map(
                    (location) => (
                      <tr
                        key={
                          location.id
                        }
                        className="border-t border-line hover:bg-sand/30"
                      >

                        <td className="px-3.5 py-2.5">

                          <div className="font-medium">
                            BagDrop —{" "}
                            {
                              location.name
                            }
                          </div>

                          <div className="text-xs text-ink-soft">
                            {
                              location.city
                            }
                          </div>

                          <div className="text-[11px] text-ink-soft mt-0.5">
                            {
                              location.address
                            }
                          </div>

                        </td>

                        <td className="px-3.5 py-2.5">
                          {
                            location.partnerName
                          }
                        </td>

                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          {formatMoney(
                            location.pricePerBag
                          )}
                        </td>

                        <td className="px-3.5 py-2.5">
                          {
                            location.capacity
                          }
                        </td>

                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          {
                            location.openingTime
                          }
                          {" — "}
                          {
                            location.closingTime
                          }
                        </td>

                        <td className="px-3.5 py-2.5">

                          <span
                            className={
                              location.active
                                ? "inline-flex items-center rounded-full bg-[#e6f6ee] px-2 py-1 text-[10px] font-semibold text-ok"
                                : "inline-flex items-center rounded-full bg-sand px-2 py-1 text-[10px] font-semibold text-ink-soft"
                            }
                          >
                            {
                              location.active
                                ? "Active"
                                : "Disabled"
                            }
                          </span>

                        </td>

                        <td className="px-3.5 py-2.5 text-right">

                          <button
                            type="button"
                            onClick={() =>
                              openLocationEditor(
                                location
                              )
                            }
                            className="border border-line rounded px-3 py-1.5 text-xs font-semibold hover:bg-sand transition-colors"
                          >
                            Edit
                          </button>

                        </td>

                      </tr>
                    )
                  )}

                  {locations.length ===
                    0 && (
                    <tr>

                      <td
                        colSpan={7}
                        className="px-3.5 py-8 text-center text-ink-soft"
                      >
                        No locations found.
                      </td>

                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}

        {/* ====================================
            ACTIVE LUGGAGE TAB
        ==================================== */}

        {tab === "luggage" && (
          <div className="overflow-x-auto">

            <table className="w-full text-sm bg-white border border-line rounded overflow-hidden">

              <thead>

                <tr className="bg-sand text-ink-soft text-[11.5px] uppercase">

                  <th className="text-left px-3.5 py-2.5">
                    Booking #
                  </th>

                  <th className="text-left px-3.5 py-2.5">
                    Customer
                  </th>

                  <th className="text-left px-3.5 py-2.5">
                    Location
                  </th>

                  <th className="text-left px-3.5 py-2.5">
                    Bags
                  </th>

                  <th className="text-left px-3.5 py-2.5">
                    Checked in
                  </th>

                </tr>

              </thead>

              <tbody>

                {activeLuggage.map(
                  (booking) => (
                    <tr
                      key={
                        booking.id
                      }
                      onClick={() =>
                        setSelectedBooking(
                          booking
                        )
                      }
                      className="border-t border-line cursor-pointer hover:bg-sand/40 transition-colors"
                    >

                      <td className="px-3.5 py-2.5 font-medium">
                        #
                        {
                          booking.bookingNumber
                        }
                      </td>

                      <td className="px-3.5 py-2.5">
                        {
                          booking.customerName
                        }
                      </td>

                      <td className="px-3.5 py-2.5">
                        {
                          booking.locationName
                        }
                      </td>

                      <td className="px-3.5 py-2.5">
                        {
                          booking.bags
                        }
                      </td>

                      <td className="px-3.5 py-2.5">
                        {getCheckedInTime(
                          booking
                        )}
                      </td>

                    </tr>
                  )
                )}

                {activeLuggage.length ===
                  0 && (
                  <tr>

                    <td
                      colSpan={5}
                      className="px-3.5 py-8 text-center text-ink-soft"
                    >
                      No luggage currently
                      checked in.
                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* ======================================
          BOOKING DETAIL MODAL
      ====================================== */}

      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center px-4 py-6"
          onClick={() =>
            setSelectedBooking(
              null
            )
          }
        >

          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-line rounded-lg shadow-xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="flex items-start justify-between gap-4 p-5 border-b border-line">

              <div>

                <p className="text-xs text-ink-soft mb-1">
                  Booking
                </p>

                <h2 className="font-slab font-bold text-xl">
                  #
                  {
                    selectedBooking.bookingNumber
                  }
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedBooking(
                    null
                  )
                }
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-sand text-ink-soft hover:text-ink text-xl"
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {/* STATUS */}

            <div className="px-5 pt-5">

              <StatusPill
                status={
                  selectedBooking.status
                }
              />

            </div>

            {/* CUSTOMER */}

            <div className="p-5">

              <SectionTitle>
                Customer
              </SectionTitle>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <DetailItem
                  label="Name"
                  value={
                    selectedBooking.customerName
                  }
                />

                <DetailItem
                  label="Phone"
                  value={
                    selectedBooking.customerPhone
                  }
                />

                <DetailItem
                  label="Email"
                  value={
                    selectedBooking.customerEmail
                  }
                />

              </div>

            </div>

            {/* STORAGE */}

            <div className="px-5 pb-5">

              <SectionTitle>
                Storage
              </SectionTitle>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <DetailItem
                  label="Location"
                  value={
                    selectedBooking.locationName
                  }
                />

                <DetailItem
                  label="City"
                  value={
                    selectedBooking.city
                  }
                />

                <DetailItem
                  label="Drop-off"
                  value={`${formatDate(
                    selectedBooking.dropoffDate
                  )} at ${
                    selectedBooking.dropoffTime
                  }`}
                />

                <DetailItem
                  label="Pickup"
                  value={`${formatDate(
                    selectedBooking.pickupDate
                  )} at ${
                    selectedBooking.pickupTime
                  }`}
                />

              </div>

            </div>

            {/* BOOKING DETAILS */}

            <div className="px-5 pb-5">

              <SectionTitle>
                Booking details
              </SectionTitle>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                <DetailItem
                  label="Bags"
                  value={String(
                    selectedBooking.bags
                  )}
                />

                <DetailItem
                  label="Price / bag"
                  value={formatMoney(
                    selectedBooking.pricePerBag,
                    selectedBooking.currency
                  )}
                />

                <DetailItem
                  label="Total"
                  value={formatMoney(
                    selectedBooking.totalAmount,
                    selectedBooking.currency
                  )}
                />

              </div>

            </div>

            {/* BAG TAGS */}

            <div className="px-5 pb-5">

              <SectionTitle>
                Bag tags
              </SectionTitle>

              {selectedBooking
                .bagsList.length >
              0 ? (
                <div className="space-y-2">

                  {selectedBooking.bagsList.map(
                    (bag) => (
                      <div
                        key={bag.id}
                        className="flex items-center justify-between gap-3 bg-sand rounded px-3 py-2.5"
                      >

                        <div>

                          <div className="font-mono text-sm font-medium">
                            {
                              bag.tag_number
                            }
                          </div>

                          {bag.checked_in_at && (
                            <div className="text-[11px] text-ink-soft mt-0.5">
                              Checked in:{" "}
                              {formatDateTime(
                                bag.checked_in_at
                              )}
                            </div>
                          )}

                          {bag.checked_out_at && (
                            <div className="text-[11px] text-ink-soft">
                              Checked out:{" "}
                              {formatDateTime(
                                bag.checked_out_at
                              )}
                            </div>
                          )}

                        </div>

                        <span className="text-xs text-ink-soft">
                          {
                            bag.status
                          }
                        </span>

                      </div>
                    )
                  )}

                </div>
              ) : (
                <p className="text-sm text-ink-soft">
                  No bag tags found.
                </p>
              )}

            </div>

            {/* SYSTEM INFO */}

            <div className="px-5 pb-5">

              <SectionTitle>
                System information
              </SectionTitle>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <DetailItem
                  label="Booking ID"
                  value={
                    selectedBooking.id
                  }
                />

                <DetailItem
                  label="Created"
                  value={formatDateTime(
                    selectedBooking.createdAt
                  )}
                />

                <DetailItem
                  label="Updated"
                  value={formatDateTime(
                    selectedBooking.updatedAt
                  )}
                />

              </div>

            </div>

            {/* FOOTER */}

            <div className="p-5 border-t border-line flex justify-end">

              <button
                type="button"
                onClick={() =>
                  setSelectedBooking(
                    null
                  )
                }
                className="bg-clay text-white rounded px-4 py-2 text-sm font-semibold hover:opacity-90"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ======================================
          LOCATION EDIT MODAL
      ====================================== */}

      {selectedLocation && (
        <div
          className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center px-4 py-6"
          onClick={() =>
            setSelectedLocation(
              null
            )
          }
        >

          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white border border-line rounded-lg shadow-xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* LOCATION HEADER */}

            <div className="flex items-start justify-between gap-4 p-5 border-b border-line">

              <div>

                <p className="text-xs text-ink-soft mb-1">
                  Edit location
                </p>

                <h2 className="font-slab font-bold text-xl">
                  BagDrop —{" "}
                  {
                    selectedLocation.name
                  }
                </h2>

                <p className="text-xs text-ink-soft mt-1">
                  {
                    selectedLocation.city
                  }
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedLocation(
                    null
                  )
                }
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-sand text-ink-soft hover:text-ink text-xl"
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {/* LOCATION FORM */}

            <div className="p-5 space-y-5">

              {/* NAME */}

              <FormField
                label="Location name"
              >
                <input
                  type="text"
                  value={
                    locationForm.name
                  }
                  onChange={(event) =>
                    setLocationForm(
                      (current) => ({
                        ...current,
                        name:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="admin-input"
                  placeholder="Registan"
                />
              </FormField>

              {/* ADDRESS */}

              <FormField
                label="Address"
              >
                <input
                  type="text"
                  value={
                    locationForm.address
                  }
                  onChange={(event) =>
                    setLocationForm(
                      (current) => ({
                        ...current,
                        address:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="admin-input"
                  placeholder="Location address"
                />
              </FormField>

              {/* PRICE + CAPACITY */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <FormField
                  label="Price / bag / day"
                >
                  <input
                    type="number"
                    min="1"
                    step="1000"
                    value={
                      locationForm.pricePerBag
                    }
                    onChange={(event) =>
                      setLocationForm(
                        (current) => ({
                          ...current,
                          pricePerBag:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="admin-input"
                  />
                </FormField>

                <FormField
                  label="Capacity"
                >
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      locationForm.capacity
                    }
                    onChange={(event) =>
                      setLocationForm(
                        (current) => ({
                          ...current,
                          capacity:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="admin-input"
                  />
                </FormField>

              </div>

              {/* HOURS */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <FormField
                  label="Opening time"
                >
                  <input
                    type="time"
                    value={
                      locationForm.openingTime
                    }
                    onChange={(event) =>
                      setLocationForm(
                        (current) => ({
                          ...current,
                          openingTime:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="admin-input"
                  />
                </FormField>

                <FormField
                  label="Closing time"
                >
                  <input
                    type="time"
                    value={
                      locationForm.closingTime
                    }
                    onChange={(event) =>
                      setLocationForm(
                        (current) => ({
                          ...current,
                          closingTime:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="admin-input"
                  />
                </FormField>

              </div>

              {/* ACTIVE */}

              <div className="border border-line rounded p-3.5">

                <label className="flex items-center justify-between gap-4 cursor-pointer">

                  <div>

                    <div className="text-sm font-semibold">
                      Location status
                    </div>

                    <div className="text-xs text-ink-soft mt-0.5">
                      Disabled locations
                      will not be
                      available for new
                      bookings.
                    </div>

                  </div>

                  <input
                    type="checkbox"
                    checked={
                      locationForm.active
                    }
                    onChange={(event) =>
                      setLocationForm(
                        (current) => ({
                          ...current,
                          active:
                            event.target
                              .checked,
                        })
                      )
                    }
                    className="w-4 h-4"
                  />

                </label>

              </div>

              {/* GOOGLE MAPS */}

              <FormField
                label="Google Maps URL"
              >
                <input
                  type="url"
                  value={
                    locationForm.googleMapsUrl
                  }
                  onChange={(event) =>
                    setLocationForm(
                      (current) => ({
                        ...current,
                        googleMapsUrl:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="admin-input"
                  placeholder="https://maps.google.com/..."
                />
              </FormField>

              {/* YANDEX MAPS */}

              <FormField
                label="Yandex Maps URL"
              >
                <input
                  type="url"
                  value={
                    locationForm.yandexMapsUrl
                  }
                  onChange={(event) =>
                    setLocationForm(
                      (current) => ({
                        ...current,
                        yandexMapsUrl:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="admin-input"
                  placeholder="https://yandex.com/maps/..."
                />
              </FormField>

              {/* ERROR */}

              {locationSaveError && (
                <div className="border border-red-200 bg-red-50 text-red-700 rounded p-3 text-sm">
                  {
                    locationSaveError
                  }
                </div>
              )}

            </div>

            {/* LOCATION FOOTER */}

            <div className="p-5 border-t border-line flex items-center justify-end gap-2">

              <button
                type="button"
                disabled={
                  savingLocation
                }
                onClick={() =>
                  setSelectedLocation(
                    null
                  )
                }
                className="border border-line rounded px-4 py-2 text-sm font-semibold hover:bg-sand disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  savingLocation
                }
                onClick={
                  saveLocation
                }
                className="bg-clay text-white rounded px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {savingLocation
                  ? "Saving..."
                  : "Save changes"}
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}

// ==========================================
// STAT
// ==========================================

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white border border-line rounded p-3.5">

      <span className="text-[11px] text-ink-soft block">
        {label}
      </span>

      <b className="font-slab text-xl">
        {value}
      </b>

    </div>
  );
}

// ==========================================
// MINI STAT
// ==========================================

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white border border-line rounded p-3">

      <span className="text-[10px] text-ink-soft block">
        {label}
      </span>

      <b className="font-slab text-lg">
        {value}
      </b>

    </div>
  );
}

// ==========================================
// SECTION TITLE
// ==========================================

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h3 className="font-semibold text-sm mb-3">
      {children}
    </h3>
  );
}

// ==========================================
// DETAIL ITEM
// ==========================================

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-line rounded p-3">

      <span className="block text-[10px] uppercase text-ink-soft mb-1">
        {label}
      </span>

      <span className="text-sm font-medium break-words">
        {value || "—"}
      </span>

    </div>
  );
}

// ==========================================
// FORM FIELD
// ==========================================

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">

      <span className="block text-xs font-semibold text-ink-soft mb-1.5">
        {label}
      </span>

      {children}

    </label>
  );
}

// ==========================================
// CHECKED-IN TIME
// ==========================================

function getCheckedInTime(
  booking: Booking
) {
  const checkedInBag =
    booking.bagsList.find(
      (bag) =>
        Boolean(
          bag.checked_in_at
        )
    );

  if (
    !checkedInBag?.checked_in_at
  ) {
    return "—";
  }

  return new Date(
    checkedInBag.checked_in_at
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ==========================================
// DATE
// ==========================================

function formatDate(
  value: string
) {
  if (!value) {
    return "—";
  }

  const date = new Date(
    `${value}T00:00:00+05:00`
  );

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

// ==========================================
// DATE + TIME
// ==========================================

function formatDateTime(
  value: string
) {
  if (!value) {
    return "—";
  }

  return new Date(
    value
  ).toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}