"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import QrCode from "@/components/QrCode";
import StatusPill from "@/components/StatusPill";
import { BookingStatus } from "@/lib/types";

function ConfirmationInner() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  const id = searchParams.get("id") ?? "";
  const bookingNumber = searchParams.get("bookingNumber") ?? "";
  const qrToken = searchParams.get("qrToken") ?? "";
  const totalPrice = Number(searchParams.get("totalPrice") ?? "0");
  const status = (searchParams.get("status") ?? "PENDING_PAYMENT") as BookingStatus;
  const locationName = searchParams.get("locationName") ?? "BagDrop Location";
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
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-center text-2xl mx-auto mb-4">
          🧳
        </div>
        <h2 className="font-slab font-bold text-2xl text-ink mb-2">
          Booking details not found
        </h2>
        <p className="text-ink-soft mb-6 text-sm">
          We could not load your booking details from this link. Please check your email or return to locations.
        </p>
        <Link
          href="/locations"
          className="inline-flex items-center gap-2 bg-clay text-white font-semibold text-sm rounded-xl px-5 py-3 shadow-sm hover:bg-clay-dark transition-colors"
        >
          <span>Find a location</span>
          <span>→</span>
        </Link>
      </div>
    );
  }

  function handleCopyNumber() {
    navigator.clipboard.writeText(bookingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Top Success Banner */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-ok-bg text-ok flex items-center justify-center text-2xl mx-auto mb-3 shadow-xs">
          ✓
        </div>
        <h1 className="font-slab font-bold text-2xl sm:text-3xl text-ink">
          Booking Confirmed!
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Save this luggage ticket to show at drop-off and pickup.
        </p>
      </div>

      {/* Ticket / Voucher Card */}
      <div className="bg-white border border-line rounded-3xl overflow-hidden shadow-lg shadow-black/5">
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-ink via-[#24374b] to-ink text-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Booking Reference
              </span>
              <button
                onClick={handleCopyNumber}
                className="font-slab font-bold text-xl sm:text-2xl text-clay flex items-center gap-2 group hover:text-white transition-colors"
                title="Click to copy"
              >
                <span>{booking.bookingNumber}</span>
                <span className="text-xs bg-white/10 group-hover:bg-white/20 px-2 py-0.5 rounded font-sans font-normal text-slate-300">
                  {copied ? "Copied!" : "Copy"}
                </span>
              </button>
            </div>

            <StatusPill status={booking.status} />
          </div>

          <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Location</span>
              <span className="font-semibold text-white text-sm">{booking.locationName}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase">Luggage Count</span>
              <span className="font-semibold text-white text-sm">{booking.bags} bag(s)</span>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="p-8 text-center bg-cream/30 flex flex-col items-center justify-center">
          <div className="bg-white p-4 rounded-2xl border border-line shadow-xs">
            <QrCode value={booking.qrToken} size={220} />
          </div>

          <p className="text-xs font-semibold text-ink-soft mt-4 max-w-xs leading-relaxed">
            Scan this QR code with the partner staff upon arrival to check in your bags.
          </p>
        </div>

        {/* Perforated Divider */}
        <div className="relative flex items-center justify-between border-t-2 border-dashed border-line my-0">
          <div className="w-5 h-5 -ml-2.5 rounded-full bg-cream border-r border-line" />
          <div className="w-5 h-5 -mr-2.5 rounded-full bg-cream border-l border-line" />
        </div>

        {/* Booking Details List */}
        <div className="p-6 space-y-3 bg-white">
          <DetailRow
            icon="📅"
            label="Drop-off Date & Time"
            value={new Date(booking.dropoffAt).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
          <DetailRow
            icon="⏱️"
            label="Pickup Date & Time"
            value={new Date(booking.pickupAt).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
          <DetailRow
            icon="💳"
            label="Total Amount"
            value={`${booking.totalPrice.toLocaleString()} ${booking.currency}`}
            bold
          />
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 bg-white grid grid-cols-2 gap-3">
          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border border-line hover:border-ink/40 text-ink text-xs sm:text-sm font-semibold transition-colors"
          >
            <span>🖨️</span>
            <span>Print Ticket</span>
          </button>

          <Link
            href="/locations"
            className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-teal hover:bg-teal-dark text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            <span>🧳</span>
            <span>Book Another</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  bold = false,
}: {
  icon: string;
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs sm:text-sm py-1.5 border-b border-line/40 last:border-none">
      <span className="text-ink-soft flex items-center gap-2">
        <span>{icon}</span>
        <span>{label}</span>
      </span>
      <span className={bold ? "font-slab font-bold text-base text-ink" : "font-medium text-ink"}>
        {value}
      </span>
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