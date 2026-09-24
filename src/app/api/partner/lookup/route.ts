import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedPartner } from "@/lib/supabase/auth";

type LookupBody = {
  locationId: string;
  value: string;
};

function normalize(value: string) {
  return value
    .trim()
    .toUpperCase();
}

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

/**
 * QR ichidagi qiymatni tozalaydi.
 *
 * QR:
 * 1. oddiy booking number bo'lishi mumkin
 * 2. oddiy UUID access_token bo'lishi mumkin
 * 3. URL bo'lishi mumkin
 *
 * Biz bir nechta candidate qaytaramiz.
 */
function extractLookupValues(
  rawValue: string
): string[] {
  const values = new Set<string>();

  const raw =
    rawValue.trim();

  if (!raw) {
    return [];
  }

  // -----------------------------------------
  // 1. RAW VALUE
  // -----------------------------------------

  values.add(raw);

  // -----------------------------------------
  // 2. URL BO'LSA
  // -----------------------------------------

  try {
    const url = new URL(raw);

    const possibleParams = [
      "token",
      "qrToken",
      "qr_token",
      "access_token",
      "accessToken",
      "booking",
      "bookingNumber",
      "booking_number",
    ];

    for (const param of possibleParams) {
      const value =
        url.searchParams.get(param);

      if (value) {
        values.add(value.trim());
      }
    }

    // URL pathname ichida UUID bo'lsa
    const uuidMatch =
      url.pathname.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
      );

    if (uuidMatch?.[0]) {
      values.add(uuidMatch[0]);
    }

    // URL pathname ichida booking number bo'lishi mumkin
    const pathname =
      decodeURIComponent(
        url.pathname
      );

    if (pathname) {
      values.add(pathname);
    }
  } catch {
    // Oddiy text/UUID bo'lsa URL emas.
  }

  return Array.from(values)
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function POST(
  request: Request
) {
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
    // 2. PARTNER ID
    // ==================================================

    const partner =
      partnerAuth.partner as any;

    const partnerId =
      partner?.id;

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
      (await request.json()) as LookupBody;

    const locationId =
      body.locationId?.trim();

    const value =
      body.value?.trim();

    if (!locationId || !value) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Location and booking number are required.",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // 4. SUPABASE ADMIN CLIENT
    // ==================================================

    const supabase: any =
      createAdminClient();

    // ==================================================
    // 5. LOCATION OWNERSHIP
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
    // 6. EXTRACT QR VALUES
    // ==================================================

    const lookupValues =
      extractLookupValues(value);

    if (
      lookupValues.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "QR code does not contain a valid booking value.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "PARTNER LOOKUP:",
      {
        locationId,
        partnerId,
        rawValue: value,
        lookupValues,
      }
    );

    // ==================================================
    // 7. BOOKINGNI TOPISH
    //
    // To'g'ridan-to'g'ri DB query qilamiz.
    // Endi faqat oxirgi 100 ta bookingga bog'liq emasmiz.
    // ==================================================

    let booking: any = null;

    // -----------------------------------------
    // 7A. ACCESS TOKEN / UUID BO'YICHA
    // -----------------------------------------

    for (
      const lookupValue of lookupValues
    ) {
      if (!looksLikeUuid(lookupValue)) {
        continue;
      }

      const {
        data,
        error,
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
        .eq(
          "access_token",
          lookupValue
        )
        .eq(
          "location_id",
          locationId
        )
        .maybeSingle();

      if (error) {
        console.error(
          "Booking access token lookup error:",
          error
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              "Could not search booking.",
          },
          {
            status: 500,
          }
        );
      }

      if (data) {
        booking = data;
        break;
      }
    }

    // -----------------------------------------
    // 7B. BOOKING NUMBER BO'YICHA
    // -----------------------------------------

    if (!booking) {
      for (
        const lookupValue of lookupValues
      ) {
        const normalized =
          normalize(lookupValue);

        if (!normalized) {
          continue;
        }

        const {
          data,
          error,
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
          .eq(
            "location_id",
            locationId
          )
          .ilike(
            "booking_number",
            normalized
          )
          .maybeSingle();

        if (error) {
          console.error(
            "Booking number lookup error:",
            error
          );

          return NextResponse.json(
            {
              ok: false,
              error:
                "Could not search booking.",
            },
            {
              status: 500,
            }
          );
        }

        if (data) {
          booking = data;
          break;
        }
      }
    }

    // ==================================================
    // 8. BOOKING TOPILMADI
    // ==================================================

    if (!booking) {
      console.log(
        "BOOKING NOT FOUND:",
        {
          locationId,
          lookupValues,
        }
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Booking number or QR token was not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ==================================================
    // 9. LOCATION SECURITY
    // ==================================================

    if (
      booking.location_id !==
      locationId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This booking belongs to another BagDrop location.",
        },
        {
          status: 403,
        }
      );
    }

    // ==================================================
    // 10. PARTNER SECURITY
    // ==================================================

    if (
      location.partner_id !==
      partnerId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "You do not have access to this booking.",
        },
        {
          status: 403,
        }
      );
    }

    // ==================================================
    // 11. BAGS
    // ==================================================

    const {
      data: bags,
      error: bagsError,
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

    if (bagsError) {
      console.error(
        "Partner bags lookup error:",
        bagsError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not load luggage information.",
        },
        {
          status: 500,
        }
      );
    }

    // ==================================================
    // 12. SUCCESS
    // ==================================================

    return NextResponse.json({
      ok: true,

      booking: {
        ...booking,

        bag_count: Number(
          booking.bag_count
        ),

        price_per_bag: Number(
          booking.price_per_bag
        ),

        total_amount: Number(
          booking.total_amount
        ),

        bags: bags ?? [],
      },
    });
  } catch (error) {
    console.error(
      "Partner lookup API error:",
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