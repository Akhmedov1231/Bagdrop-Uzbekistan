"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Booking, BookingStatus } from "./types";
import { canTransition } from "./bookingStateMachine";
import { generateBagTags } from "./ids";

const STORAGE_KEY = "bagdrop_demo_bookings_v1";

function seedBookings(): Booking[] {
  const now = Date.now();
  const iso = (offsetHours: number) => new Date(now + offsetHours * 3600_000).toISOString();
  return [
    {
      id: "seed_1",
      bookingNumber: "SAM-20260908-48287",
      qrToken: "qrt_seed1",
      locationId: "loc_1",
      locationName: "BagDrop — Registan",
      locationSlug: "registan",
      dropoffAt: iso(-3),
      pickupAt: iso(4),
      bags: 2,
      pricePerBag: 30000,
      totalPrice: 60000,
      currency: "UZS",
      status: "CHECKED_IN",
      customer: { firstName: "Elena", lastName: "Novak", phone: "+380 63 000 0001", email: "elena@example.com" },
      createdAt: iso(-4),
      checkedInAt: iso(-3),
      bagTags: generateBagTags("SAM-20260908-48287", 2),
    },
    {
      id: "seed_2",
      bookingNumber: "SAM-20260908-48288",
      qrToken: "qrt_seed2",
      locationId: "loc_1",
      locationName: "BagDrop — Registan",
      locationSlug: "registan",
      dropoffAt: iso(1),
      pickupAt: iso(6),
      bags: 1,
      pricePerBag: 30000,
      totalPrice: 30000,
      currency: "UZS",
      status: "PAID",
      customer: { firstName: "Marco", lastName: "Rossi", phone: "+39 320 000 0002", email: "marco@example.com" },
      createdAt: iso(-1),
    },
    {
      id: "seed_3",
      bookingNumber: "SAM-20260907-48279",
      qrToken: "qrt_seed3",
      locationId: "loc_1",
      locationName: "BagDrop — Registan",
      locationSlug: "registan",
      dropoffAt: iso(-20),
      pickupAt: iso(-12),
      bags: 1,
      pricePerBag: 30000,
      totalPrice: 30000,
      currency: "UZS",
      status: "COMPLETED",
      customer: { firstName: "Aidos", lastName: "Serik", phone: "+7 700 000 0003", email: "aidos@example.com" },
      createdAt: iso(-21),
      checkedInAt: iso(-20),
      checkedOutAt: iso(-12),
      bagTags: generateBagTags("SAM-20260907-48279", 1),
    },
    {
      id: "seed_4",
      bookingNumber: "SAM-20260908-48281",
      qrToken: "qrt_seed4",
      locationId: "loc_2",
      locationName: "BagDrop — Railway Station",
      locationSlug: "railway-station",
      dropoffAt: iso(-5),
      pickupAt: iso(3),
      bags: 3,
      pricePerBag: 25000,
      totalPrice: 75000,
      currency: "UZS",
      status: "CHECKED_IN",
      customer: { firstName: "Yuki", lastName: "Tanaka", phone: "+81 90 0000 0004", email: "yuki@example.com" },
      createdAt: iso(-6),
      checkedInAt: iso(-5),
      bagTags: generateBagTags("SAM-20260908-48281", 3),
    },
  ];
}

interface AppDataContextValue {
  bookings: Booking[];
  addBooking: (b: Booking) => void;
  updateBookingStatus: (bookingId: string, to: BookingStatus) => { ok: boolean; error?: string };
  findByBookingNumber: (num: string) => Booking | undefined;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setBookings(raw ? (JSON.parse(raw) as Booking[]) : seedBookings());
    } catch {
      setBookings(seedBookings());
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }, [bookings, loaded]);

  const addBooking = useCallback((b: Booking) => {
    setBookings((prev) => [b, ...prev]);
  }, []);

  const updateBookingStatus = useCallback(
    (bookingId: string, to: BookingStatus) => {
      let result: { ok: boolean; error?: string } = { ok: false };
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== bookingId) return b;
          if (!canTransition(b.status, to)) {
            result = { ok: false, error: `Cannot move booking from ${b.status} to ${to}.` };
            return b;
          }
          result = { ok: true };
          const patch: Partial<Booking> = { status: to };
          if (to === "CHECKED_IN") {
            patch.checkedInAt = new Date().toISOString();
            patch.bagTags = generateBagTags(b.bookingNumber, b.bags);
          }
          if (to === "COMPLETED") {
            patch.checkedOutAt = new Date().toISOString();
          }
          return { ...b, ...patch };
        })
      );
      return result;
    },
    []
  );

  const findByBookingNumber = useCallback(
    (num: string) => bookings.find((b) => b.bookingNumber.toLowerCase() === num.trim().toLowerCase()),
    [bookings]
  );

  return (
    <AppDataContext.Provider value={{ bookings, addBooking, updateBookingStatus, findByBookingNumber }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
