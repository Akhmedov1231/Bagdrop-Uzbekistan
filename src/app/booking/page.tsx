"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import QrCode from "@/components/QrCode";
import StatusPill from "@/components/StatusPill";
import { BookingStatus } from "@/lib/types";

function ConfirmationInner() {
  const searchParams = useSearchParams();

  const id = searchParams.get("id") ?? "";
  const bookingNumber = searchParams.get("bookingNumber") ?? "";
  const qrToken = searchParams.get("qrToken") ?? "";
  const totalPrice = Number(searchParams.get("totalPrice") ?? "0");
  const status = (searchParams.get("status") ??
    "PENDING_PAYMENT") as BookingStatus;
  const locationName = searchParams.get("locationName") ?? "";
  const dropoffAt = searchParams.get("dropoffAt") ?? "";
  const pickupAt = searchParams.get("pickupAt") ?? "";
  const bags = Number(searchParams.get("bags") ?? "1");
  const currency = searchParams.get("currency") ?? "UZS";

  const booking =
    id && bookingNumber && qrToken
      ? {
          id,
          bookingNumber,
          qrToken,
          totalPrice,
          status,
          locationName,
          dropoffAt,
          pickupAt,
          bags,
          currency,
        }
      : null;

  if (!booking) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <p className="text-ink-soft">
          Booking not found. Please return and create a new booking.
        </p>
        <Link
          href="/locations"
          className="text-teal-dark font-semibold"
        >
          Find a location
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-10 text-center">
      <div
        className="rounded-full bg-ok-bg text-ok flex items-center justify-center text-2xl mx-auto mb-3.5"
        style={{ width: 52, height: 52 }}
      >
        ✓
      </div>

      <h1 className="font-slab font-bold text-xl">
        Booking confirmed
      </h1>

      <p className="font-slab font-bold text-teal-dark text-lg mt-1">
        {booking.bookingNumber}
      </p>

      <div className="bg-white border border-line rounded p-6 my-5">
        <QrCode value={booking.qrToken} size={220} />

        <p className="text-xs text-ink-soft mt-3.5">
          Show this QR code at drop-off and pickup.
        </p>
      </div>

      <div className="bg-white border border-line rounded px-4">
        <DetailRow
          label="Location"
          value={booking.locationName}
        />

        <DetailRow
          label="Drop-off"
          value={new Date(booking.dropoffAt).toLocaleString()}
        />

        <DetailRow
          label="Pickup"
          value={new Date(booking.pickupAt).toLocaleString()}
        />

        <DetailRow
          label="Bags"
          value={String(booking.bags)}
        />

        <DetailRow
          label="Total"
          value={`${booking.totalPrice.toLocaleString()} ${booking.currency}`}
        />

        <div className="flex justify-between py-2.5 text-sm">
          <span className="text-ink-soft">Status</span>
          <StatusPill status={booking.status} />
        </div>
      </div>

      <div className="flex justify-center mt-5">
        <Link
          href="/locations"
          className="border border-teal text-teal-dark font-semibold text-sm rounded px-4 py-2.5 hover:bg-teal-light transition-colors"
        >
          Book another
        </Link>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between py-2.5 border-b border-line last:border-none text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationInner />
    </Suspense>
  );
}