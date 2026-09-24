import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedPartner } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // ==================================================
    // 1. PARTNER LOGININI TEKSHIRISH
    // ==================================================

    const partnerAuth = await getAuthenticatedPartner();

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
    // 2. PARTNER ID
    // ==================================================

    const partner = partnerAuth.partner as any;
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
    // 3. LOCATION ID NI OLISH
    // ==================================================

    const locationId =
      request.nextUrl.searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Location ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 4. SUPABASE ADMIN CLIENT
    // ==================================================

    // Supabase TypeScript inference muammosi sabab any
    const supabase: any = createAdminClient();

    // ==================================================
    // 5. LOCATION PARTNERGA TEGISHLIMI?
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
        name
      `
      )
      .eq("id", locationId)
      .eq("partner_id", partnerId)
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
    // 6. BOSHQA PARTNER LOCATIONIGA KIRISHNI BLOKLASH
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
    // 7. FAQAT SHU LOCATION BOOKINGLARINI OLISH
    // ==================================================

    const {
      data: bookings,
      error: bookingsError,
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
        created_at,
        bags (
          id,
          tag_number,
          status,
          checked_in_at,
          checked_out_at
        )
      `
      )
      .eq("location_id", locationId)
      .order("created_at", {
        ascending: false,
      });

    if (bookingsError) {
      console.error(
        "Partner bookings query failed:",
        bookingsError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not load partner bookings.",
        },
        {
          status: 500,
        }
      );
    }

    // ==================================================
    // 8. NATIJANI QAYTARISH
    // ==================================================

    return NextResponse.json({
      ok: true,

      location: {
        id: location.id,
        name: location.name,
      },

      bookings: bookings ?? [],
    });
  } catch (error) {
    console.error(
      "Partner bookings API error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected server error.",
      },
      {
        status: 500,
      }
    );
  }
}