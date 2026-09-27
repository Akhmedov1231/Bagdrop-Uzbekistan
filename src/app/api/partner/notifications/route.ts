import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedPartner } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

// ==========================================
// GET — FAQAT SHU PARTNER NOTIFICATIONLARI
// ==========================================

export async function GET() {
  try {
    const partnerAuth =
      await getAuthenticatedPartner();

    if (!partnerAuth) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const partner =
      partnerAuth.partner as any;

    const partnerId = partner?.id;

    if (!partnerId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Partner ID not found.",
        },
        { status: 403 }
      );
    }

    const supabase =
      createAdminClient() as any;

    const {
      data: notifications,
      error,
    } = await supabase
      .from("notifications")
      .select(`
        id,
        recipient_type,
        recipient_id,
        location_id,
        booking_id,
        type,
        title,
        message,
        is_read,
        created_at
      `)
      .eq("recipient_type", "PARTNER")
      .eq("recipient_id", partnerId)
      .order("created_at", {
        ascending: false,
      })
      .limit(30);

    if (error) {
      console.error(
        "Partner notifications error:",
        error
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not load notifications.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      notifications:
        notifications ?? [],
    });
  } catch (error) {
    console.error(
      "Partner notifications GET error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Could not load notifications.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// PATCH — FAQAT O'Z NOTIFICATIONINI READ QILISH
// ==========================================

export async function PATCH(
  request: Request
) {
  try {
    const partnerAuth =
      await getAuthenticatedPartner();

    if (!partnerAuth) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const partner =
      partnerAuth.partner as any;

    const partnerId = partner?.id;

    if (!partnerId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Partner ID not found.",
        },
        { status: 403 }
      );
    }

    const body =
      await request.json();

    const id = String(
      body?.id || ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Notification id is required.",
        },
        { status: 400 }
      );
    }

    const supabase =
      createAdminClient() as any;

    // Faqat shu partnerga tegishli
    // notificationni READ qilamiz.
    const {
      data: updatedNotification,
      error: updateError,
    } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", id)
      .eq("recipient_type", "PARTNER")
      .eq("recipient_id", partnerId)
      .select("id, is_read")
      .maybeSingle();

    if (updateError) {
      console.error(
        "Partner notification update error:",
        updateError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            updateError.message ||
            "Could not mark notification as read.",
        },
        { status: 500 }
      );
    }

    if (!updatedNotification) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Notification was not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      notification:
        updatedNotification,
    });
  } catch (error) {
    console.error(
      "Partner notification PATCH error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not update notification.",
      },
      { status: 500 }
    );
  }
}