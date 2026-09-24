import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAuthenticatedAdmin,
} from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export async function GET() {
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
        {
          status: 401,
        }
      );
    }

    // -----------------------------
    // SUPABASE ADMIN CLIENT
    // -----------------------------

    const supabase: any =
      createAdminClient();

    // -----------------------------
    // BOOKINGS
    // -----------------------------

    const {
      data: bookings,
      error: bookingsError,
    } = await supabase
      .from("bookings")
      .select(`
        id,
        booking_number,
        access_token,
        customer_name,
        customer_email,
        customer_phone,
        location_id,
        dropoff_date,
        pickup_date,
        dropoff_time,
        pickup_time,
        bag_count,
        price_per_bag,
        total_amount,
        currency,
        status,
        created_at,
        updated_at,

        locations (
          id,
          name,
          city,
          address,
          partner_id
        ),

        bags (
          id,
          tag_number,
          status,
          checked_in_at,
          checked_out_at
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (bookingsError) {
      console.error(
        "Admin bookings error:",
        bookingsError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not load bookings.",
        },
        {
          status: 500,
        }
      );
    }

    // -----------------------------
    // LOCATIONS
    // -----------------------------

    const {
      data: locations,
      error: locationsError,
    } = await supabase
      .from("locations")
      .select(`
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
      `)
      .order("created_at", {
        ascending: true,
      });

    if (locationsError) {
      console.error(
        "Admin locations error:",
        locationsError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not load locations.",
        },
        {
          status: 500,
        }
      );
    }

    // -----------------------------
    // PARTNERS
    // -----------------------------

    const {
      data: partners,
      error: partnersError,
    } = await supabase
      .from("partners")
      .select(`
        id,
        name
      `);

    if (partnersError) {
      console.error(
        "Admin partners error:",
        partnersError
      );
    }

    const partnerMap =
      new Map(
        (partners ?? []).map(
          (partner: any) => [
            partner.id,
            partner.name,
          ]
        )
      );

    // -----------------------------
    // FORMAT BOOKINGS
    // -----------------------------

    const formattedBookings =
      (bookings ?? []).map(
        (booking: any) => {
          const location =
            Array.isArray(
              booking.locations
            )
              ? booking.locations[0]
              : booking.locations;

          return {
            id: booking.id,

            bookingNumber:
              booking.booking_number,

            accessToken:
              booking.access_token,

            customerName:
              booking.customer_name,

            customerEmail:
              booking.customer_email,

            customerPhone:
              booking.customer_phone,

            locationId:
              booking.location_id,

            locationName:
              location?.name ??
              "Unknown location",

            city:
              location?.city ?? "",

            dropoffDate:
              booking.dropoff_date,

            pickupDate:
              booking.pickup_date,

            dropoffTime:
              String(
                booking.dropoff_time ?? ""
              ).slice(0, 5),

            pickupTime:
              String(
                booking.pickup_time ?? ""
              ).slice(0, 5),

            bags:
              Number(
                booking.bag_count
              ),

            pricePerBag:
              Number(
                booking.price_per_bag
              ),

            totalAmount:
              Number(
                booking.total_amount
              ),

            currency:
              booking.currency,

            status:
              booking.status,

            createdAt:
              booking.created_at,

            updatedAt:
              booking.updated_at,

            bagsList:
              booking.bags ?? [],
          };
        }
      );

    // -----------------------------
    // FORMAT LOCATIONS
    // -----------------------------

    const formattedLocations =
      (locations ?? []).map(
        (location: any) => ({
          id: location.id,

          partnerId:
            location.partner_id,

          city:
            location.city,

          name:
            location.name,

          slug:
            location.slug,

          address:
            location.address,

          latitude:
            Number(
              location.latitude
            ),

          longitude:
            Number(
              location.longitude
            ),

          description:
            location.description,

          pricePerBag:
            Number(
              location.price_per_bag
            ),

          capacity:
            Number(
              location.capacity
            ),

          openingTime:
            String(
              location.opening_time ?? ""
            ).slice(0, 5),

          closingTime:
            String(
              location.closing_time ?? ""
            ).slice(0, 5),

          active:
            location.active,

          googleMapsUrl:
            location.google_maps_url,

          yandexMapsUrl:
            location.yandex_maps_url,

          partnerName:
            partnerMap.get(
              location.partner_id
            ) ??
            "Unknown partner",

          createdAt:
            location.created_at,
        })
      );

    // -----------------------------
    // RESPONSE
    // -----------------------------

    return NextResponse.json({
      ok: true,
      bookings:
        formattedBookings,
      locations:
        formattedLocations,
    });
  } catch (error) {
    console.error(
      "Admin data error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Internal server error.",
      },
      {
        status: 500,
      }
    );
  }
}