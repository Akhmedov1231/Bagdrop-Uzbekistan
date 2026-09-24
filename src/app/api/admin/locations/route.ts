import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedAdmin } from "@/lib/supabase/auth";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  try {
    // -----------------------------------------
    // ADMIN AUTHENTICATION
    // -----------------------------------------

    const user = await getAuthenticatedAdmin();

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    // -----------------------------------------
    // READ REQUEST BODY
    // -----------------------------------------

    const body = await request.json();

    const {
      id,
      name,
      address,
      pricePerBag,
      capacity,
      openingTime,
      closingTime,
      active,
      googleMapsUrl,
      yandexMapsUrl,
    } = body;

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Location ID is required.",
        },
        { status: 400 }
      );
    }

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Location name is required.",
        },
        { status: 400 }
      );
    }

    if (!address || !String(address).trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Address is required.",
        },
        { status: 400 }
      );
    }

    const numericPrice = Number(pricePerBag);
    const numericCapacity = Number(capacity);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Price must be greater than 0.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(numericCapacity) ||
      numericCapacity <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Capacity must be a positive whole number.",
        },
        { status: 400 }
      );
    }

    if (!openingTime || !closingTime) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Opening and closing times are required.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // SUPABASE ADMIN CLIENT
    // -----------------------------------------

    const supabase: any =
      createAdminClient();

    // -----------------------------------------
    // UPDATE LOCATION
    // -----------------------------------------

    const {
      data,
      error,
    } = await supabase
      .from("locations")
      .update({
        name: String(name).trim(),
        address: String(address).trim(),
        price_per_bag: numericPrice,
        capacity: numericCapacity,
        opening_time: openingTime,
        closing_time: closingTime,
        active: Boolean(active),
        google_maps_url:
          googleMapsUrl
            ? String(googleMapsUrl).trim()
            : null,
        yandex_maps_url:
          yandexMapsUrl
            ? String(yandexMapsUrl).trim()
            : null,
      })
      .eq("id", id)
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
        description,
        price_per_bag,
        capacity,
        opening_time,
        closing_time,
        active,
        google_maps_url,
        yandex_maps_url,
        created_at
        `
      )
      .single();

    // -----------------------------------------
    // DATABASE ERROR
    // -----------------------------------------

    if (error) {
      console.error(
        "Admin location update error:",
        error
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            error.message ||
            "Could not update location.",
        },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // LOCATION NOT FOUND
    // -----------------------------------------

    if (!data) {
      return NextResponse.json(
        {
          ok: false,
          error: "Location not found.",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------
    // SUCCESS
    // -----------------------------------------

    return NextResponse.json({
      ok: true,
      location: data,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/locations error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}