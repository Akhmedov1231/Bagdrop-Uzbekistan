import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedPartner } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Login qilgan user Partner ekanini tekshiramiz
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

    // 2. Partner ID
    // Supabase type inference muammosini oldini olish uchun any
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

    // 3. Admin Supabase client
    const supabase = createAdminClient();

    // 4. FAQAT shu partnerga tegishli locationlarni olamiz
    const { data: locations, error } = await supabase
      .from("locations")
      .select(
        `
        id,
        partner_id,
        city,
        name,
        slug,
        address,
        latitude,
        longitude,
        price_per_bag,
        capacity,
        opening_time,
        closing_time,
        active,
        google_maps_url,
        yandex_maps_url
      `
      )
      .eq("partner_id", partnerId)
      .eq("active", true)
      .order("name", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Partner locations error:",
        error
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Could not load partner locations.",
        },
        {
          status: 500,
        }
      );
    }

    // 5. Natija
    return NextResponse.json({
      ok: true,
      locations: locations ?? [],
    });
  } catch (error) {
    console.error(
      "Partner locations API error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Could not load partner locations.",
      },
      {
        status: 500,
      }
    );
  }
}