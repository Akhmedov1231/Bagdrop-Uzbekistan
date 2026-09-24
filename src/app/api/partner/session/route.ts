import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/auth";

export async function GET() {
  let stage = "start";

  try {
    // ==========================================
    // 1. AUTH USER
    // ==========================================

    stage = "getAuthenticatedUser";

    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          stage,
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    console.log(
      "PARTNER SESSION - AUTH USER:",
      user.id,
      user.email
    );

    // ==========================================
    // 2. ADMIN CLIENT
    // ==========================================

    stage = "createAdminClient";

    const supabase: any =
      createAdminClient();

    // ==========================================
    // 3. PARTNER QUERY
    // ==========================================

    stage = "partnerQuery";

    const {
      data: partner,
      error: partnerError,
    } = await supabase
      .from("partners")
      .select(`
        id,
        business_name,
        contact_name,
        email,
        phone,
        commission_type,
        commission_value,
        active,
        auth_user_id
      `)
      .eq("auth_user_id", user.id)
      .eq("active", true)
      .maybeSingle();

    if (partnerError) {
      console.error(
        "PARTNER SESSION - DATABASE ERROR:",
        partnerError
      );

      return NextResponse.json(
        {
          ok: false,
          stage,
          error:
            "Partner database query failed.",
          details:
            process.env.NODE_ENV !==
            "production"
              ? partnerError.message
              : undefined,
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // 4. PARTNER TOPILMADI
    // ==========================================

    if (!partner) {
      console.log(
        "PARTNER SESSION - NO PARTNER FOUND FOR:",
        user.id
      );

      return NextResponse.json(
        {
          ok: false,
          stage,
          error:
            "Bu account Partner sifatida biriktirilmagan.",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // 5. AUTH USER ID MATCH
    // ==========================================

    stage = "verifyPartner";

    if (
      partner.auth_user_id !==
      user.id
    ) {
      return NextResponse.json(
        {
          ok: false,
          stage,
          error:
            "Partner account verification failed.",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // 6. SUCCESS
    // ==========================================

    console.log(
      "PARTNER SESSION - SUCCESS:",
      partner.id,
      partner.business_name
    );

    return NextResponse.json({
      ok: true,
      partner: {
        id: partner.id,
        business_name:
          partner.business_name,
        contact_name:
          partner.contact_name,
      },
    });
  } catch (error) {
    console.error(
      "PARTNER SESSION - UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        stage,
        error:
          "Partner session failed.",
        details:
          process.env.NODE_ENV !==
          "production"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}