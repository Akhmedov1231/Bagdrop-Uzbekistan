"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import QrCode from "@/components/QrCode";
import StatusPill from "@/components/StatusPill";
import { BookingStatus } from "@/lib/types";
import {
  Luggage,
  Calendar,
  Clock,
  CreditCard,
  Printer,
  Copy,
  Check,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MapPin,
} from "lucide-react";

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
        <div className="w-16 h-16 rounded-3xl bg-sand flex items-center justify-center mx-auto mb-4 text-brand-600">
          <Luggage className="w-8 h-8" />
        </div>
        <h2 className="font-display font-extrabold text-2xl text-ink mb-2">
          Booking details not found
        </h2>
        <p className="text-ink-soft mb-6 text-sm">
          We could not load your booking details from this link. Please check your email or return to storage directory.
        </p>
        <Link
          href="/locations"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold text-sm rounded-2xl px-6 py-3.5 shadow-glow-brand hover:shadow-lg transition-all"
        >
          <span>Find storage location</span>
          <ArrowRight className="w-4 h-4" />
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
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      
      {/* Top Success Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8 space-y-2"
      >
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-ink">
          Booking Confirmed!
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft max-w-sm mx-auto">
          Save this digital luggage pass to present upon arrival at the partner spot.
        </p>
      </motion.div>

      {/* Modern Digital Luggage Pass Ticket */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative bg-white border border-line rounded-4xl overflow-hidden shadow-ticket"
      >
        {/* Pass Top Header */}
        <div className="bg-gradient-to-tr from-ink-deep via-ink to-slate-900 text-white p-6 sm:p-7 relative">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-1">
                Digital Boarding Pass
              </span>
              <button
                onClick={handleCopyNumber}
                className="group flex items-center gap-2 text-left"
                title="Click to copy booking reference"
              >
                <span className="font-display font-black text-xl sm:text-2xl text-brand-400 group-hover:text-brand-300 transition-colors">
                  {booking.bookingNumber}
                </span>
                <span className="flex items-center gap-1 text-[11px] bg-white/10 group-hover:bg-white/20 px-2.5 py-1 rounded-full text-slate-300 transition-colors">
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </span>
              </button>
            </div>

            <StatusPill status={booking.status} />
          </div>

          <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
              <span className="font-bold text-white text-sm">{booking.locationName}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Luggage Count</span>
              <span className="font-bold text-white text-sm">{booking.bags} bag(s)</span>
            </div>
          </div>
        </div>

        {/* QR Pass Body */}
        <div className="p-8 text-center bg-cream/40 flex flex-col items-center justify-center space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-line shadow-card-modern">
            <QrCode value={booking.qrToken} size={220} />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-ink">
              Scan with Storage Partner
            </p>
            <p className="text-[11px] text-ink-soft max-w-xs leading-relaxed">
              Show this QR code upon drop-off and pickup to verify your bag tags.
            </p>
          </div>
        </div>

        {/* Perforated Divider with Notches */}
        <div className="relative flex items-center justify-between border-t-2 border-dashed border-line/80 my-0">
          <div className="w-6 h-6 -ml-3 rounded-full bg-cream border-r border-line shadow-inner" />
          <div className="w-6 h-6 -mr-3 rounded-full bg-cream border-l border-line shadow-inner" />
        </div>

        {/* Pass Details List */}
        <div className="p-6 sm:p-7 space-y-3 bg-white">
          <DetailRow
            icon={Calendar}
            label="Drop-off Time"
            value={new Date(booking.dropoffAt).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
          <DetailRow
            icon={Clock}
            label="Pickup Time"
            value={new Date(booking.pickupAt).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
          <DetailRow
            icon={CreditCard}
            label="Total Amount"
            value={`${booking.totalPrice.toLocaleString()} ${booking.currency}`}
            bold
          />
        </div>

        {/* Action Buttons */}
        <div className="p-6 sm:p-7 pt-0 bg-white grid grid-cols-2 gap-3">
          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border border-slate-200 hover:border-ink/40 text-ink text-xs sm:text-sm font-bold shadow-2xs hover:bg-slate-50 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Pass</span>
          </button>

          <Link
            href="/locations"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs sm:text-sm font-bold shadow-glow-brand transition-all active:scale-95"
          >
            <Luggage className="w-4 h-4" />
            <span>Book Another</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  bold = false,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs sm:text-sm py-2 border-b border-slate-100 last:border-none">
      <span className="text-slate-500 flex items-center gap-2 font-medium">
        <Icon className="w-4 h-4 text-brand-500 shrink-0" />
        <span>{label}</span>
      </span>
      <span className={bold ? "font-display font-extrabold text-base text-brand-600" : "font-semibold text-ink"}>
        {value}
      </span>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <ConfirmationInner />
    </Suspense>
  );
}