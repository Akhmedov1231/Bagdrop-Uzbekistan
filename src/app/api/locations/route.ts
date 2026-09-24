import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LOCATIONS } from "@/lib/mockData";

export const dynamic = "force-dynamic";

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

    if (!error && Array.isArray(data) && data.length > 0) {
      return NextResponse.json({
        ok: true,
        locations: data,
        source: "database",
      });
    }

    // Fallback to built-in locations if database is not connected or empty
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
  } catch (error) {
    console.error("Locations API fallback engaged:", error);

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
}