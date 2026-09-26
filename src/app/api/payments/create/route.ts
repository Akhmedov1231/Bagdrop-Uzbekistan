import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  paymentService,
  type PaymentProvider,
} from "@/lib/paymentService";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { safeParseBody, isValidUUID } from "@/lib/security";

const ALLOWED_PROVIDERS: PaymentProvider[] = [
  "atmos",
  "click",
  "payme",
  "demo",
];

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, {
      maxRequests: 10,
      windowMs: 60 * 1000,
      prefix: "payment_create",
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Too many payment creation requests. Please try again shortly.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimit.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    // Safe body parsing with size limit
    const parsed = await safeParseBody<{
      bookingId?: string;
      bookingNumber?: string;
      provider?: string;
    }>(request, 5_000);

    if (!parsed.ok) {
      return NextResponse.json(
        { ok: false, error: parsed.error },
        { status: 400 }
      );
    }

    const body = parsed.data;

    const bookingId =
      typeof body.bookingId === "string"
        ? body.bookingId.trim()
        : "";

    const bookingNumber =
      typeof body.bookingNumber === "string"
        ? body.bookingNumber.trim()
        : "";

    const provider =
      typeof body.provider === "string"
        ? body.provider.trim().toLowerCase()
        : "";

    if (!bookingId) {
      return NextResponse.json(
        {
          ok: false,
          error: "bookingId is required.",
        },
        { status: 400 }
      );
    }

    // Validate bookingId is a proper UUID
    if (!isValidUUID(bookingId)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid booking ID format.",
        },
        { status: 400 }
      );
    }


    if (!bookingNumber) {
      return NextResponse.json(
        {
          ok: false,
          error: "bookingNumber is required.",
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_PROVIDERS.includes(
        provider as PaymentProvider
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Unsupported payment provider.",
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    /**
     * Load booking from the server.
     *
     * We NEVER trust amount/currency
     * coming from the browser.
     */
    const {
      data: booking,
      error: bookingError,
    } = await (supabase as any)
      .from("bookings")
      .select(
        `
        id,
        booking_number,
        total_amount,
        currency,
        status
        `
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) {
      console.error(
        "Payment booking lookup error:",
        bookingError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not load booking.",
        },
        { status: 500 }
      );
    }

    if (!booking) {
      return NextResponse.json(
        {
          ok: false,
          error: "Booking not found.",
        },
        { status: 404 }
      );
    }

    /**
     * Make sure booking number matches
     * the booking ID.
     */
    if (
      booking.booking_number !==
      bookingNumber
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Booking number does not match.",
        },
        { status: 400 }
      );
    }

    /**
     * Payment is only allowed for
     * PENDING_PAYMENT bookings.
     */
    if (
      booking.status !==
      "PENDING_PAYMENT"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Booking is not awaiting payment. Current status: ${booking.status}`,
        },
        { status: 409 }
      );
    }

    /**
     * Amount comes ONLY from the database.
     */
    const amount = Number(
      booking.total_amount
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid booking amount.",
        },
        { status: 500 }
      );
    }

    /**
     * Currency also comes from the DB.
     */
    const currency =
      booking.currency || "UZS";

    /**
     * Create internal payment transaction.
     *
     * Provider API is NOT called yet.
     */
    const result =
      await paymentService.createPayment({
        bookingId: booking.id,
        bookingNumber:
          booking.booking_number,
        amount,
        currency,
        provider:
          provider as PaymentProvider,
      });

    return NextResponse.json({
      ok: true,
      payment: {
        id:
          result.paymentTransactionId,

        provider:
          result.provider,

        status:
          result.status,

        checkoutUrl:
          result.checkoutUrl ?? null,

        amount,

        currency,
      },
    });
  } catch (error) {
    console.error(
      "Create payment error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create payment.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}