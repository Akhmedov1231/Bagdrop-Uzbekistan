import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateTotal } from "@/lib/pricing";
import { BOOKING_CONFIG } from "@/lib/config";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import {
  sanitizeName,
  validateEmail,
  validatePhone,
  isValidUUID,
  safeParseBody,
} from "@/lib/security";

type CreateBookingBody = {
  locationId: string;
  dropoffDate: string;
  dropoffTime: string;
  pickupDate: string;
  pickupTime: string;
  bagCount: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

function toTimestamp(date: string, time: string) {
  return new Date(
    `${date}T${time}:00+05:00`
  ).getTime();
}

function toMinutes(time: string) {
  const [hours, minutes] = time
    .slice(0, 5)
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function makeBookingNumber() {
  const random = randomBytes(6).toString("hex").toUpperCase();

  return `BD-${new Date().getFullYear()}-${random}`;
}

function makeBagTags(
  bookingNumber: string,
  count: number
) {
  return Array.from(
    { length: count },
    (_, index) =>
      `${bookingNumber}-${String(index + 1).padStart(2, "0")}`
  );
}

/**
 * TEMPORARY test payments — see BOOKING_CONFIG.testPaymentsUntil.
 *
 * No payment provider is connected, so no booking can ever become PAID, and
 * without PAID there is no QR code to scan in the partner portal. Until the
 * cut-off, a booking made in a browser signed in as the admin, or as an active
 * partner booking one of its OWN locations, is marked PAID at once and gets a
 * "dev_simulator" payment row, which keeps test bookings distinguishable from
 * real ones. The partner restriction matters: a PAID booking never expires and
 * would otherwise be a free check-in at another partner's premises. Anonymous
 * customers never reach the update. Returns the updated booking, or null when
 * nothing changed.
 */
async function markTestPaidForStaff(
  supabase: any,
  booking: any,
  locationPartnerId: string,
  dropoffTimestamp: number
) {
  const cutoff = Date.parse(BOOKING_CONFIG.testPaymentsUntil);

  // Test bookings must also be used up within the window, not dated later.
  if (!(Date.now() < cutoff) || !(dropoffTimestamp < cutoff)) {
    return null;
  }

  try {
    // No network call for anonymous customers: without a session cookie
    // getUser() returns immediately.
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const isAdmin = Boolean(
      adminEmail && user.email?.trim().toLowerCase() === adminEmail
    );

    if (!isAdmin) {
      const { data: membership, error: membershipError } = await supabase
        .from("partner_users")
        .select("partner_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (
        membershipError ||
        !membership ||
        membership.partner_id !== locationPartnerId
      ) {
        return null;
      }

      const { data: activePartner, error: partnerError } = await supabase
        .from("partners")
        .select("id")
        .eq("id", membership.partner_id)
        .eq("active", true)
        .maybeSingle();

      if (partnerError || !activePartner) return null;
    }

    const { data: paidBooking, error: updateError } = await supabase
      .from("bookings")
      .update({ status: "PAID" })
      .eq("id", booking.id)
      .eq("status", "PENDING_PAYMENT")
      .select("*")
      .single();

    if (updateError || !paidBooking) {
      console.error("Test payment: could not mark booking PAID:", updateError);
      return null;
    }

    const { error: paymentError } = await supabase.from("payments").insert({
      booking_id: booking.id,
      provider: "dev_simulator",
      provider_transaction_id: `test-${booking.booking_number}`,
      amount: booking.total_amount,
      currency: booking.currency ?? "UZS",
      status: "paid",
    });

    if (paymentError) {
      console.error("Test payment: could not record the payment:", paymentError);
    }

    return paidBooking;
  } catch (error) {
    // A test helper must never break a real booking.
    console.error("Test payment failed:", error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = await checkRateLimit(clientIp, {
      maxRequests: 10,
      windowMs: 60 * 1000,
      prefix: "booking_create",
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          ok: false,
          code: "RATE_LIMITED",
          error: "Too many booking attempts. Please slow down and try again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimit.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    // --------------------------------------------------
    // 0. Safe body parsing with size limit (10KB)
    // --------------------------------------------------

    const parsed = await safeParseBody<CreateBookingBody>(request, 10_000);

    if (!parsed.ok) {
      return NextResponse.json(
        { ok: false, error: parsed.error },
        { status: 400 }
      );
    }

    const body = parsed.data;

    // --------------------------------------------------
    // 0.5 Sanitize all user inputs
    // --------------------------------------------------

    const locationId = (body.locationId || "").trim();
    const dropoffDate = (body.dropoffDate || "").trim();
    const dropoffTime = (body.dropoffTime || "").trim();
    const pickupDate = (body.pickupDate || "").trim();
    const pickupTime = (body.pickupTime || "").trim();
    const bagCount = body.bagCount;
    const firstName = sanitizeName(body.firstName);
    const lastName = sanitizeName(body.lastName);
    const emailResult = validateEmail(body.email);
    const phoneResult = validatePhone(body.phone);


    // --------------------------------------------------
    // 1. Required fields + UUID + email/phone format
    // --------------------------------------------------

    if (
      !locationId ||
      !dropoffDate ||
      !dropoffTime ||
      !pickupDate ||
      !pickupTime ||
      !firstName ||
      !lastName
    ) {
      return NextResponse.json(
        {
          ok: false,
          // Typed something, but sanitizeName() stripped it all ("123", emoji, "...").
          code:
            (!firstName && String(body.firstName ?? "").trim()) ||
            (!lastName && String(body.lastName ?? "").trim())
              ? "INVALID_NAME"
              : "MISSING_FIELDS",
          error:
            "Please fill in all required fields.",
        },
        { status: 400 }
      );
    }

    // Validate locationId is a proper UUID to prevent injection
    if (!isValidUUID(locationId)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid location ID format.",
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!emailResult.valid) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_EMAIL",
          error: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    // Validate phone format
    if (!phoneResult.valid) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_PHONE",
          error: "Please enter a valid phone number.",
        },
        { status: 400 }
      );
    }

    const email = emailResult.email;
    const phone = phoneResult.phone;


    // --------------------------------------------------
    // 2. Date/time validation
    // --------------------------------------------------

    if (
      !isValidDate(dropoffDate) ||
      !isValidDate(pickupDate)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid date format.",
        },
        { status: 400 }
      );
    }

    if (
      !isValidTime(dropoffTime) ||
      !isValidTime(pickupTime)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid time format.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. Bag validation
    // --------------------------------------------------

    if (
      !Number.isInteger(bagCount) ||
      bagCount < 1 ||
      bagCount > 8
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Bag count must be between 1 and 8.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. Pickup must be after drop-off
    // --------------------------------------------------

    const dropoffTimestamp = toTimestamp(
      dropoffDate,
      dropoffTime
    );

    const pickupTimestamp = toTimestamp(
      pickupDate,
      pickupTime
    );

    if (
      !Number.isFinite(dropoffTimestamp) ||
      !Number.isFinite(pickupTimestamp) ||
      pickupTimestamp <= dropoffTimestamp
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Pickup must be after drop-off.",
        },
        { status: 400 }
      );
    }

    if (dropoffTimestamp < Date.now()) {
      return NextResponse.json(
        {
          ok: false,
          code: "DROPOFF_IN_PAST",
          error: "The drop-off time has already passed. Please choose a later drop-off time.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 5. Supabase
    //
    // `any` here is intentional for this MVP because
    // the current project does not have generated
    // Supabase Database types yet.
    // --------------------------------------------------

    const supabase: any =
      createAdminClient();

    // --------------------------------------------------
    // 6. Get real location
    // --------------------------------------------------

    const {
      data: location,
      error: locationError,
    } = await supabase
      .from("locations")
      .select(
        `
        id,
        city,
        name,
        partner_id,
        price_per_bag,
        capacity,
        opening_time,
        closing_time,
        active
      `
      )
      .eq("id", locationId)
      .eq("active", true)
      .maybeSingle();

    // A failed query is not a missing location: telling the customer the
    // location does not exist during a brief database hiccup sends them away
    // from a booking that would work on the next try.
    if (locationError) {
      console.error(
        "Location lookup error:",
        locationError
      );

      return NextResponse.json(
        {
          ok: false,
          code: "TEMPORARILY_UNAVAILABLE",
          error:
            "Booking is temporarily unavailable. Please try again in a moment.",
        },
        { status: 503 }
      );
    }

    if (!location) {
      return NextResponse.json(
        {
          ok: false,
          code: "LOCATION_UNAVAILABLE",
          error:
            "Location not found or inactive.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 7. Opening hours
    // --------------------------------------------------

    const openingTime = String(
      location.opening_time
    ).slice(0, 5);

    const closingTime = String(
      location.closing_time
    ).slice(0, 5);

    const openingMinutes =
      toMinutes(openingTime);

    const closingMinutes =
      toMinutes(closingTime);

    const dropoffMinutes =
      toMinutes(dropoffTime);

    const pickupMinutes =
      toMinutes(pickupTime);

    if (
      dropoffMinutes < openingMinutes ||
      dropoffMinutes > closingMinutes ||
      pickupMinutes < openingMinutes ||
      pickupMinutes > closingMinutes
    ) {
      return NextResponse.json(
        {
          ok: false,
          code: "OUTSIDE_OPENING_HOURS",
          error: `Selected time must be within opening hours ${openingTime}–${closingTime}.`,
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 8. Calculate price on server
    // --------------------------------------------------

    const dropoffAt =
      `${dropoffDate}T${dropoffTime}:00+05:00`;

    const pickupAt =
      `${pickupDate}T${pickupTime}:00+05:00`;

    const priceInfo = calculateTotal(
      Number(location.price_per_bag),
      bagCount,
      dropoffAt,
      pickupAt
    );

    if (priceInfo.hours > BOOKING_CONFIG.maxBookingDays * 24) {
      return NextResponse.json(
        {
          ok: false,
          code: "BOOKING_LIMIT_EXCEEDED",
          error: `BagDrop bookings can be made for up to ${BOOKING_CONFIG.maxBookingDays} days.`,
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 9. Generate booking number
    // --------------------------------------------------

    const bookingNumber =
      makeBookingNumber();

    // --------------------------------------------------
    // 10. Atomically reserve capacity and create booking + bags
    // --------------------------------------------------

    const {
      data: booking,
      error: bookingError,
    } = await supabase
      .rpc("create_booking_with_capacity", {
        p_booking_number: bookingNumber,
        p_location_id: location.id,
        p_customer_name: `${firstName.trim()} ${lastName.trim()}`,
        p_customer_email: email,
        p_customer_phone: phone,
        p_dropoff_date: dropoffDate,
        p_dropoff_time: dropoffTime,
        p_pickup_date: pickupDate,
        p_pickup_time: pickupTime,
        p_bag_count: bagCount,
        p_price_per_bag: priceInfo.pricePerBag,
        p_total_amount: priceInfo.total,
        p_payment_window_minutes: BOOKING_CONFIG.paymentWindowMinutes,
      })
      .single();

    if (bookingError || !booking) {
      const errorMessage = bookingError?.message ?? "";

      if (errorMessage.startsWith("BOOKING_CAPACITY_EXCEEDED:")) {
        const availableBags = Number(errorMessage.split(":")[1]);
        return NextResponse.json(
          {
            ok: false,
            code: "CAPACITY_EXCEEDED",
            error: `Only ${availableBags} bag(s) are available for the selected time.`,
            availableBags,
          },
          { status: 409 }
        );
      }

      if (errorMessage.includes("LOCATION_UNAVAILABLE")) {
        return NextResponse.json(
          { ok: false, code: "LOCATION_UNAVAILABLE", error: "Location not found or inactive." },
          { status: 404 }
        );
      }

      // One specific, machine-readable answer per RPC rule instead of a
      // single generic message the customer cannot act on.
      const rpcErrors: Record<string, string> = {
        DROPOFF_IN_PAST: "The drop-off time has already passed. Please choose a later drop-off time.",
        INVALID_BOOKING_INTERVAL: "Pickup must be after drop-off.",
        BOOKING_LIMIT_EXCEEDED: `BagDrop bookings can be made for up to ${BOOKING_CONFIG.maxBookingDays} days.`,
        OUTSIDE_OPENING_HOURS: `Selected time must be within opening hours ${openingTime}–${closingTime}.`,
        INVALID_BOOKING_INPUT: "The booking details are invalid.",
      };
      const rpcCode = Object.keys(rpcErrors).find((code) => errorMessage.includes(code));
      if (rpcCode) {
        return NextResponse.json(
          { ok: false, code: rpcCode, error: rpcErrors[rpcCode] },
          { status: 400 }
        );
      }
      if (
        bookingError?.code === "22008" ||
        bookingError?.code === "22007" ||
        bookingError?.code === "22023"
      ) {
        return NextResponse.json(
          { ok: false, code: "INVALID_DATE_TIME", error: "The selected booking dates or times are invalid." },
          { status: 400 }
        );
      }

      console.error(
        "Booking creation error:",
        bookingError
      );

      return NextResponse.json(
        {
          ok: false,
          code: "BOOKING_FAILED",
          error:
            "Could not create booking.",
        },
        { status: 500 }
      );
    }

    const bagTags = makeBagTags(
      booking.booking_number,
      bagCount
    );

    // --------------------------------------------------
    // 13. TEMPORARY test payment for signed-in staff
    // --------------------------------------------------

    const testPaidBooking = await markTestPaidForStaff(
      supabase,
      booking,
      location.partner_id,
      dropoffTimestamp
    );

    // --------------------------------------------------
    // 13.5. Create notifications
    // --------------------------------------------------

    const notificationRows = [
      {
        recipient_type: "ADMIN",
        recipient_id: null,
        location_id: location.id,
        booking_id: booking.id,
        type: "NEW_BOOKING",
        title: "New booking",
        message: `New booking ${booking.booking_number} was created at ${location.name}.`,
      },
    ];

    if (location.partner_id) {
      notificationRows.push({
        recipient_type: "PARTNER",
        recipient_id: location.partner_id,
        location_id: location.id,
        booking_id: booking.id,
        type: "NEW_BOOKING",
        title: "New booking",
        message: `New booking ${booking.booking_number} was created at your location.`,
      });
    }

    const { error: notificationsError } = await supabase
      .from("notifications")
      .insert(notificationRows);

    if (notificationsError) {
      console.error(
        "Notification creation error:",
        notificationsError
      );
    }

    // --------------------------------------------------
    // 14. Return booking information
    // --------------------------------------------------

    return NextResponse.json(
      {
        ok: true,

        booking: {
          id:
            booking.id,

          bookingNumber:
            booking.booking_number,

          qrToken:
            booking.access_token,

          locationId:
            booking.location_id,

          dropoffDate:
            booking.dropoff_date,

          pickupDate:
            booking.pickup_date,

          dropoffTime:
            booking.dropoff_time,

          pickupTime:
            booking.pickup_time,

          bags:
            Number(
              booking.bag_count
            ),

          pricePerBag:
            Number(
              booking.price_per_bag
            ),

          totalPrice:
            Number(
              booking.total_amount
            ),

          currency:
            booking.currency,

          status:
            (testPaidBooking ?? booking).status,

          testPayment:
            Boolean(testPaidBooking),

          createdAt:
            booking.created_at,

          bagTags,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create booking API error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        error:
          "Unexpected server error.",
      },
      {
        status: 500,
      }
    );
  }
}