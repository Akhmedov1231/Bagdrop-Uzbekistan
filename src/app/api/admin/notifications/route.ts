import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedAdmin } from "@/lib/supabase/auth";

export async function PATCH(
  request: Request
) {
  try {
    // -----------------------------
    // ADMIN AUTH CHECK
    // -----------------------------

    const user =
      await getAuthenticatedAdmin();

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    // -----------------------------
    // SUPABASE ADMIN CLIENT
    // -----------------------------

    const supabase =
      createAdminClient() as any;

    // -----------------------------
    // REQUEST BODY
    // -----------------------------

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

    // -----------------------------
    // MARK AS READ
    // -----------------------------

    const {
      data: updatedNotification,
      error: updateError,
    } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", id)
      .select("id, is_read")
      .maybeSingle();

    if (updateError) {
      console.error(
        "Notification update error:",
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
      "Admin notification PATCH error:",
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