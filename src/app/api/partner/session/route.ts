import { NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  getPartnerForUser,
} from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

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

    stage = "partnerQuery";
    const partner = await getPartnerForUser(
      user.id,
      user.email,
      Boolean(user.email_confirmed_at)
    );

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
    // 5. SUCCESS
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