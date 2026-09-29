import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LOCATIONS } from "@/lib/mockData";

export const dynamic = "force-dynamic";

// Built-in demo locations, only for running the app without Supabase.
function fallbackResponse() {
  const fallbackLocations = LOCATIONS.map((loc) => ({
    id: loc.id,
    partner_id: "demo-partner",
    city: loc.city,
    name: loc.name,
    slug: loc.slug,
    address: loc.address,
    latitude: loc.lat,
    longitude: loc.lng,
    description: loc.description,
    price_per_bag: loc.pricePerBagPerDay,
    capacity: loc.capacity,
    opening_time: loc.hours.open,
    closing_time: loc.hours.close,
    active: loc.active,
    google_maps_url: loc.googleMapsUrl,
    yandex_maps_url: loc.yandexMapsUrl,
    available_bags: loc.availableBags,
  }));

  return NextResponse.json({
    ok: true,
    locations: fallbackLocations,
    source: "fallback",
  });
}

// With Supabase configured, a failed query must not be answered with demo
// data: the map would show locations that do not exist, and /book would tell
// the customer that "demo locations cannot accept bookings".
function unavailableResponse() {
  return NextResponse.json(
    { ok: false, error: "Locations are temporarily unavailable." },
    { status: 503 }
  );
}

export async function GET() {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );

  if (!supabaseConfigured) {
    return fallbackResponse();
  }

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
      console.error("Locations query failed:", error);
      return unavailableResponse();
    }

    return NextResponse.json({
      ok: true,
      locations: data ?? [],
      source: "database",
    });
  } catch (error) {
    console.error("Locations API error:", error);
    return unavailableResponse();
  }
}
