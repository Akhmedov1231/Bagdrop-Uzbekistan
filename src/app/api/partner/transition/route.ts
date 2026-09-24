import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedPartner } from "@/lib/supabase/auth";

type TransitionBody = {
  locationId: string;
  bookingId: string;
  status: "CHECKED_IN" | "COMPLETED";
};

const ALLOWED_TRANSITIONS = {
  PAID: "CHECKED_IN",
  CHECKED_IN: "COMPLETED",
} as const;

export async function POST(request: Request) {
  try {
    // ==================================================
    // 1. PARTNER LOGININI TEKSHIRISH
    // ==================================================

    const partnerAuth =
      await getAuthenticatedPartner();

    if (!partnerAuth) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    // ==================================================
    // 2. LOGIN QILGAN PARTNER ID
    // ==================================================

    const partner =
      partnerAuth.partner as any;

    const partnerId = partner.id;

    if (!partnerId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Partner ID not found.",
        },
        {
          status: 403,
        }
      );
    }

    // ==================================================
    // 3. REQUEST BODY
    // ==================================================

    const body =
      (await request.json()) as TransitionBody;

    const locationId =
      body.locationId?.trim();

    const bookingId =
      body.bookingId?.trim();

    const nextStatus =
      body.status;

    if (
      !locationId ||
      !bookingId ||
      !nextStatus
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Location, booking and status are required.",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 4. STATUSNI TEKSHIRISH
    // ==================================================

    if (
      nextStatus !== "CHECKED_IN" &&
      nextStatus !== "COMPLETED"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid booking transition.",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 5. SUPABASE ADMIN CLIENT
    // ==================================================

    const supabase: any =
      createAdminClient();

    // ==================================================
    // 6. LOCATION + PARTNER OWNERSHIP
    //
    // Bu location aynan login qilgan
    // partnerga tegishli bo'lishi shart.
    // ==================================================

    const {
      data: location,
      error: locationError,
    } = await supabase
      .from("locations")
      .select(
        `
        id,
        partner_id,
        name,
        city,
        active
      `
      )
      .eq("id", locationId)
      .eq("partner_id", partnerId)
      .eq("active", true)
      .maybeSingle();

    if (locationError) {
      console.error(
        "Partner location ownership check failed:",
        locationError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not verify location ownership.",
        },
        {
          status: 500,
        }
      );
    }

    // ==================================================
    // 7. BOSHQA PARTNER LOCATIONINI BLOKLASH
    // ==================================================

    if (!location) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "You do not have access to this location.",
        },
        {
          status: 403,
        }
      );
    }

    // ==================================================
    // 8. BOOKINGNI OLISH
    //
    // Booking:
    // - shu bookingId bo'lishi kerak
    // - shu locationId ga tegishli bo'lishi kerak
    // ==================================================

    const {
      data: booking,
      error: bookingError,
    } = await supabase
      .from("bookings")
      .select(
        `
        id,
        booking_number,
        access_token,
        customer_name,
        customer_email,
        customer_phone,
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
      .eq("id", bookingId)
      .eq("location_id", locationId)
      .maybeSingle();

    if (bookingError) {
      console.error(
        "Partner booking lookup error:",
        bookingError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not load booking.",
        },
        {
          status: 500,
        }
      );
    }

    if (!booking) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Booking not found for this location.",
        },
        {
          status: 404,
        }
      );
    }

    // ==================================================
    // 9. QO'SHIMCHA BOOKING SECURITY
    // ==================================================

    if (
      booking.location_id !==
      location.id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This booking belongs to another location.",
        },
        {
          status: 403,
        }
      );
    }

    // ==================================================
    // 10. STATUS TRANSITION
    //
    // PAID -> CHECKED_IN
    // CHECKED_IN -> COMPLETED
    // ==================================================

    const currentStatus =
      booking.status as keyof typeof ALLOWED_TRANSITIONS;

    const expectedNextStatus =
      ALLOWED_TRANSITIONS[currentStatus];

    if (
      expectedNextStatus !==
      nextStatus
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Cannot change booking from ${booking.status} to ${nextStatus}.`,
        },
        {
          status: 409,
        }
      );
    }

    // ==================================================
    // 11. BOOKING STATUSINI UPDATE QILISH
    //
    // WHERE status = current status
    // bo'lishi race conditionni kamaytiradi.
    // ==================================================

    const {
      data: updatedBooking,
      error: updateError,
    } = await supabase
      .from("bookings")
      .update({
        status: nextStatus,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", booking.id)
      .eq("location_id", locationId)
      .eq("status", booking.status)
      .select(
        `
        id,
        booking_number,
        access_token,
        customer_name,
        customer_email,
        customer_phone,
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
      .maybeSingle();

    if (updateError) {
      console.error(
        "Booking transition error:",
        updateError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not update booking status.",
        },
        {
          status: 500,
        }
      );
    }

    // Agar boshqa request oldin statusni o'zgartirgan bo'lsa,
    // update hech narsa qaytarmaydi.
    if (!updatedBooking) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Booking status has already changed. Please scan the booking again.",
        },
        {
          status: 409,
        }
      );
    }

    // ==================================================
    // 12. CHECK-IN
    // ==================================================

    if (
      nextStatus === "CHECKED_IN"
    ) {
      const now =
        new Date().toISOString();

      const {
        error: bagsError,
      } = await supabase
        .from("bags")
        .update({
          status: "CHECKED_IN",
          checked_in_at: now,
        })
        .eq(
          "booking_id",
          booking.id
        );

      if (bagsError) {
        console.error(
          "Bag check-in error:",
          bagsError
        );

        // Bookingni oldingi holatiga qaytaramiz.
        await supabase
          .from("bookings")
          .update({
            status: "PAID",
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            booking.id
          )
          .eq(
            "status",
            "CHECKED_IN"
          );

        return NextResponse.json(
          {
            ok: false,
            error:
              "Could not check in luggage.",
          },
          {
            status: 500,
          }
        );
      }
    }

    // ==================================================
    // 13. CHECK-OUT
    // ==================================================

    if (
      nextStatus === "COMPLETED"
    ) {
      const now =
        new Date().toISOString();

      const {
        error: bagsError,
      } = await supabase
        .from("bags")
        .update({
          status: "CHECKED_OUT",
          checked_out_at: now,
        })
        .eq(
          "booking_id",
          booking.id
        );

      if (bagsError) {
        console.error(
          "Bag check-out error:",
          bagsError
        );

        // Bookingni oldingi holatiga qaytaramiz.
        await supabase
          .from("bookings")
          .update({
            status: "CHECKED_IN",
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            booking.id
          )
          .eq(
            "status",
            "COMPLETED"
          );

        return NextResponse.json(
          {
            ok: false,
            error:
              "Could not check out luggage.",
          },
          {
            status: 500,
          }
        );
      }
    }

    // ==================================================
    // 14. YANGI BAG HOLATLARINI OLISH
    // ==================================================

    const {
      data: bags,
      error: bagsLoadError,
    } = await supabase
      .from("bags")
      .select(
        `
        id,
        tag_number,
        status,
        checked_in_at,
        checked_out_at
      `
      )
      .eq(
        "booking_id",
        booking.id
      )
      .order("created_at", {
        ascending: true,
      });

    if (bagsLoadError) {
      console.error(
        "Could not reload bags:",
        bagsLoadError
      );
    }

    // ==================================================
    // 15. NATIJA
    // ==================================================

    return NextResponse.json({
      ok: true,

      booking: {
        ...updatedBooking,
        bags: bags ?? [],
      },
    });
  } catch (error) {
    console.error(
      "Partner transition API error:",
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