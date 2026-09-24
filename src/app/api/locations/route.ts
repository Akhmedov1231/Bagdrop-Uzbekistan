import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("locations")
      .select(
        "id, partner_id, city, name, slug, address, latitude, longitude, description, price_per_bag, capacity, opening_time, closing_time, active, google_maps_url, yandex_maps_url"
      )
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to load locations:", error);

      return NextResponse.json(
        {
          ok: false,
          error: "Failed to load locations",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      locations: data ?? [],
    });
  } catch (error) {
    console.error("Locations API error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected server error",
      },
      { status: 500 }
    );
  }
}