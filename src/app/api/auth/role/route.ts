import { NextResponse } from "next/server";
import { getAuthenticatedRole } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getAuthenticatedRole();

    if (!result) {
      return NextResponse.json(
        {
          ok: false,
          role: null,
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      role: result.role,
    });
  } catch (error) {
    console.error(
      "Auth role API error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        role: null,
        error: "Could not determine user role.",
      },
      {
        status: 500,
      }
    );
  }
}