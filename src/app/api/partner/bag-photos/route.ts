import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedPartner } from "@/lib/supabase/auth";

const BUCKET = "bag-photos";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type PhotoType = "FRONT" | "BACK";

function isPhotoType(value: string): value is PhotoType {
  return value === "FRONT" || value === "BACK";
}

function hasValidImageSignature(bytes: Uint8Array, contentType: string) {
  if (contentType === "image/jpeg") {
    return bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff;
  }

  if (contentType === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
      .every((byte, index) => bytes[index] === byte);
  }

  if (contentType === "image/webp") {
    return bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }

  return false;
}

export async function GET(request: Request) {
  try {
    const partnerAuth = await getAuthenticatedPartner();

    if (!partnerAuth) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId")?.trim();

    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: "Booking ID is required." },
        { status: 400 }
      );
    }

    const supabase: any = createAdminClient();
    const partnerId = (partnerAuth.partner as any)?.id;

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, location_id")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json(
        { ok: false, error: "Booking not found." },
        { status: 404 }
      );
    }

    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("id")
      .eq("id", booking.location_id)
      .eq("partner_id", partnerId)
      .eq("active", true)
      .maybeSingle();

    if (locationError || !location) {
      return NextResponse.json(
        { ok: false, error: "You do not have access to this booking." },
        { status: 403 }
      );
    }

    const { data: bags, error: bagsError } = await supabase
      .from("bags")
      .select("id")
      .eq("booking_id", bookingId);

    if (bagsError) {
      return NextResponse.json(
        { ok: false, error: "Could not load bags." },
        { status: 500 }
      );
    }

    const bagIds = (bags ?? []).map((bag: { id: string }) => bag.id);

    if (bagIds.length === 0) {
      return NextResponse.json({ ok: true, photos: {} });
    }

    const { data: photos, error: photosError } = await supabase
      .from("bag_photos")
      .select("bag_id, photo_type")
      .in("bag_id", bagIds);

    if (photosError) {
      return NextResponse.json(
        { ok: false, error: "Could not load bag photos." },
        { status: 500 }
      );
    }

    const result: Record<
      string,
      { FRONT: boolean; BACK: boolean }
    > = {};

    for (const bagId of bagIds) {
      result[bagId] = {
        FRONT: (photos ?? []).some(
          (photo: { bag_id: string; photo_type: string }) =>
            photo.bag_id === bagId && photo.photo_type === "FRONT"
        ),
        BACK: (photos ?? []).some(
          (photo: { bag_id: string; photo_type: string }) =>
            photo.bag_id === bagId && photo.photo_type === "BACK"
        ),
      };
    }

    return NextResponse.json({ ok: true, photos: result });
  } catch (error) {
    console.error("Bag photo GET error:", error);

    return NextResponse.json(
      { ok: false, error: "Unexpected server error." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const partnerAuth = await getAuthenticatedPartner();

    if (!partnerAuth) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const bookingId = String(formData.get("bookingId") ?? "").trim();
    const locationId = String(formData.get("locationId") ?? "").trim();
    const bagId = String(formData.get("bagId") ?? "").trim();
    const photoTypeValue = String(
      formData.get("photoType") ?? ""
    ).trim();
    const file = formData.get("file");

    if (
      !bookingId ||
      !locationId ||
      !bagId ||
      !isPhotoType(photoTypeValue) ||
      !(file instanceof File)
    ) {
      return NextResponse.json(
        { ok: false, error: "Booking, location, bag, photo type and file are required." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Only JPG, PNG and WEBP images are allowed.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: "Image must be 10 MB or smaller." },
        { status: 400 }
      );
    }

    const supabase: any = createAdminClient();
    const partnerId = (partnerAuth.partner as any)?.id;

    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("id")
      .eq("id", locationId)
      .eq("partner_id", partnerId)
      .eq("active", true)
      .maybeSingle();

    if (locationError || !location) {
      return NextResponse.json(
        { ok: false, error: "You do not have access to this location." },
        { status: 403 }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, location_id")
      .eq("id", bookingId)
      .eq("location_id", locationId)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json(
        { ok: false, error: "Booking not found for this location." },
        { status: 404 }
      );
    }

    const { data: bag, error: bagError } = await supabase
      .from("bags")
      .select("id, booking_id")
      .eq("id", bagId)
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (bagError || !bag) {
      return NextResponse.json(
        { ok: false, error: "Bag not found for this booking." },
        { status: 404 }
      );
    }

    const extension =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : "jpg";

    const storagePath =
      `${bookingId}/${bagId}/${photoTypeValue.toLowerCase()}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    if (!hasValidImageSignature(buffer, file.type)) {
      return NextResponse.json(
        { ok: false, error: "File contents do not match the selected image type." },
        { status: 400 }
      );
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Bag photo storage upload error:", uploadError);

      return NextResponse.json(
        { ok: false, error: "Could not upload image to storage." },
        { status: 500 }
      );
    }

    const { error: photoError } = await supabase
      .from("bag_photos")
      .upsert(
        {
          bag_id: bagId,
          photo_type: photoTypeValue,
          storage_path: storagePath,
        },
        {
          onConflict: "bag_id,photo_type",
        }
      );

    if (photoError) {
      console.error("Bag photo database error:", photoError);

      return NextResponse.json(
        { ok: false, error: "Image uploaded but could not save photo record." },
        { status: 500 }
      );
    }

    const { data: photos } = await supabase
      .from("bag_photos")
      .select("bag_id, photo_type")
      .in("bag_id", [bagId]);

    return NextResponse.json({
      ok: true,
      storagePath,
      photos: {
        [bagId]: {
          FRONT: (photos ?? []).some(
            (photo: { photo_type: string }) =>
              photo.photo_type === "FRONT"
          ),
          BACK: (photos ?? []).some(
            (photo: { photo_type: string }) =>
              photo.photo_type === "BACK"
          ),
        },
      },
    });
  } catch (error) {
    console.error("Bag photo POST error:", error);

    return NextResponse.json(
      { ok: false, error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
