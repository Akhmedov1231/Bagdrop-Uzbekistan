import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const RESERVED_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "CHECKED_IN",
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const locationId =
      searchParams.get("locationId")?.trim() ?? "";

    const dropoffDate =
      searchParams.get("dropoffDate")?.trim() ?? "";

    const dropoffTime =
      searchParams.get("dropoffTime")?.trim() ?? "";

    const pickupDate =
      searchParams.get("pickupDate")?.trim() ?? "";

    const pickupTime =
      searchParams.get("pickupTime")?.trim() ?? "";

    if (
      !locationId ||
      !dropoffDate ||
      !dropoffTime ||
      !pickupDate ||
      !pickupTime
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Location and booking times are required.",
        },
        { status: 400 }
      );
    }

    const selectedDropoff =
      new Date(
        `${dropoffDate}T${dropoffTime}:00+05:00`
      );

    const selectedPickup =
      new Date(
        `${pickupDate}T${pickupTime}:00+05:00`
      );

    if (
      Number.isNaN(selectedDropoff.getTime()) ||
      Number.isNaN(selectedPickup.getTime())
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid date or time.",
        },
        { status: 400 }
      );
    }

    if (selectedPickup <= selectedDropoff) {
      return NextResponse.json(
        {
          ok: false,
          error: "Pickup must be after drop-off.",
        },
        { status: 400 }
      );
    }

    const supabase: any = createAdminClient();

    // Get location capacity
    const { data: location, error: locationError } =
      await supabase
        .from("locations")
        .select("id, capacity, active")
        .eq("id", locationId)
        .eq("active", true)
        .single();

    if (locationError || !location) {
      return NextResponse.json(
        {
          ok: false,
          error: "Location not found.",
        },
        { status: 404 }
      );
    }

    // Get active bookings for this location.
    const { data: bookings, error: bookingsError } =
      await supabase
        .from("bookings")
        .select(
          `
            id,
            dropoff_date,
            pickup_date,
            dropoff_time,
            pickup_time,
            bag_count,
            status
          `
        )
        .eq("location_id", locationId)
        .in("status", RESERVED_STATUSES);

    if (bookingsError) {
      console.error(
        "Availability booking lookup failed:",
        bookingsError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Could not calculate availability.",
        },
        { status: 500 }
      );
    }

    let reservedBags = 0;

    for (const booking of bookings ?? []) {
      const bookingDropoff =
        new Date(
          `${booking.dropoff_date}T${String(
            booking.dropoff_time
          ).slice(0, 5)}:00+05:00`
        );

      const bookingPickup =
        new Date(
          `${booking.pickup_date}T${String(
            booking.pickup_time
          ).slice(0, 5)}:00+05:00`
        );

      // Time intervals overlap when:
      // booking starts before selected pickup
      // AND booking ends after selected drop-off.
      const overlaps =
        bookingDropoff < selectedPickup &&
        bookingPickup > selectedDropoff;

      if (overlaps) {
        reservedBags += Number(
          booking.bag_count ?? 0
        );
      }
    }

    const capacity = Number(location.capacity);

    const availableBags = Math.max(
      0,
      capacity - reservedBags
    );

    return NextResponse.json({
      ok: true,
      locationId,
      capacity,
      reservedBags,
      availableBags,
      dropoffDate,
      dropoffTime,
      pickupDate,
      pickupTime,
    });
  } catch (error) {
    console.error(
      "Availability API error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not calculate availability.",
      },
      { status: 500 }
    );
  }
}