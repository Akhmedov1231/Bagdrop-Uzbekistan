import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateTotal } from "@/lib/pricing";

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

const ACTIVE_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "CHECKED_IN",
];

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
  const random = Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();

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

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as CreateBookingBody;

    const {
      locationId,
      dropoffDate,
      dropoffTime,
      pickupDate,
      pickupTime,
      bagCount,
      firstName,
      lastName,
      phone,
      email,
    } = body;

    // --------------------------------------------------
    // 1. Required fields
    // --------------------------------------------------

    if (
      !locationId ||
      !dropoffDate ||
      !dropoffTime ||
      !pickupDate ||
      !pickupTime ||
      !firstName?.trim() ||
      !lastName?.trim() ||
      !phone?.trim() ||
      !email?.trim()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Please fill in all required fields.",
        },
        { status: 400 }
      );
    }

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
        price_per_bag,
        capacity,
        opening_time,
        closing_time,
        active
      `
      )
      .eq("id", locationId)
      .eq("active", true)
      .single();

    if (locationError || !location) {
      console.error(
        "Location lookup error:",
        locationError
      );

      return NextResponse.json(
        {
          ok: false,
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
          error: `Selected time must be within opening hours ${openingTime}–${closingTime}.`,
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 8. Get active bookings for this location
    // --------------------------------------------------

    const {
      data: existingBookings,
      error: bookingsError,
    } = await supabase
      .from("bookings")
      .select(
        `
        id,
        bag_count,
        dropoff_date,
        dropoff_time,
        pickup_date,
        pickup_time,
        status
      `
      )
      .eq("location_id", location.id)
      .in("status", ACTIVE_STATUSES);

    if (bookingsError) {
      console.error(
        "Bookings lookup error:",
        bookingsError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not check availability.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 9. Calculate overlapping bags
    // --------------------------------------------------

    let reservedBags = 0;

    for (const existing of existingBookings ?? []) {
      const existingDropoff =
        toTimestamp(
          existing.dropoff_date,
          String(
            existing.dropoff_time
          ).slice(0, 5)
        );

      const existingPickup =
        toTimestamp(
          existing.pickup_date,
          String(
            existing.pickup_time
          ).slice(0, 5)
        );

      const overlaps =
        existingDropoff <
          pickupTimestamp &&
        existingPickup >
          dropoffTimestamp;

      if (overlaps) {
        reservedBags += Number(
          existing.bag_count
        );
      }
    }

    const capacity = Number(
      location.capacity
    );

    const availableBags =
      capacity - reservedBags;

    if (bagCount > availableBags) {
      return NextResponse.json(
        {
          ok: false,
          error: `Only ${Math.max(
            0,
            availableBags
          )} bag(s) are available for the selected time.`,
          availableBags: Math.max(
            0,
            availableBags
          ),
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // 10. Calculate price on server
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

    // BagDrop currently supports bookings up to 24 hours.
    if (priceInfo.hours > 24) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "BagDrop bookings can currently be made for up to 24 hours.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 11. Generate booking number
    // --------------------------------------------------

    const bookingNumber =
      makeBookingNumber();

    // --------------------------------------------------
    // 12. Create booking
    // --------------------------------------------------

    const {
      data: booking,
      error: bookingError,
    } = await supabase
      .from("bookings")
      .insert({
        booking_number:
          bookingNumber,

        customer_id: null,

        customer_name:
          `${firstName.trim()} ${lastName.trim()}`,

        customer_email:
          email.trim().toLowerCase(),

        customer_phone:
          phone.trim(),

        location_id:
          location.id,

        dropoff_date:
          dropoffDate,

        pickup_date:
          pickupDate,

        dropoff_time:
          dropoffTime,

        pickup_time:
          pickupTime,

        bag_count:
          bagCount,

        price_per_bag:
          priceInfo.pricePerBag,

        total_amount:
          priceInfo.total,

        currency:
          "UZS",

        status:
          "PENDING_PAYMENT",
      })
      .select(
        `
        id,
        booking_number,
        access_token,
        location_id,
        dropoff_date,
        pickup_date,
        dropoff_time,
        pickup_time,
        bag_count,
        price_per_bag,
        total_amount,
        currency,
        status,
        created_at
      `
      )
      .single();

    if (bookingError || !booking) {
      console.error(
        "Booking creation error:",
        bookingError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not create booking.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 13. Create bag records
    // --------------------------------------------------

    const bagTags = makeBagTags(
      booking.booking_number,
      bagCount
    );

    const bagRows = bagTags.map(
      (tagNumber: string) => ({
        booking_id:
          booking.id,

        tag_number:
          tagNumber,

        status:
          "PENDING",
      })
    );

    const {
      error: bagsError,
    } = await supabase
      .from("bags")
      .insert(bagRows);

    if (bagsError) {
      console.error(
        "Bag creation error:",
        bagsError
      );

      await supabase
        .from("bookings")
        .delete()
        .eq(
          "id",
          booking.id
        );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not create bag records.",
        },
        { status: 500 }
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
            booking.status,

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
        error:
          "Unexpected server error.",
      },
      {
        status: 500,
      }
    );
  }
}