import { NextResponse } from "next/server";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingId = String(body?.bookingId ?? "").trim();
    const qrToken = String(body?.qrToken ?? "").trim();

    if (!bookingId || !qrToken) {
      return NextResponse.json(
        { ok: false, error: "Booking id and QR token are required." },
        { status: 400 }
      );
    }

    const gmailUser = process.env.GMAIL_USER?.trim();
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim();

    if (!gmailUser || !gmailAppPassword) {
      return NextResponse.json(
        { ok: false, error: "Email service is not configured." },
        { status: 500 }
      );
    }

    const supabase: any = createAdminClient();

    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        id,
        booking_number,
        access_token,
        customer_name,
        customer_email,
        dropoff_date,
        pickup_date,
        dropoff_time,
        pickup_time,
        bag_count,
        total_amount,
        currency,
        status,
        location:locations(name, city, address)
      `)
      .eq("id", bookingId)
      .eq("access_token", qrToken)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { ok: false, error: "Booking not found." },
        { status: 404 }
      );
    }

    const recipient = String(booking.customer_email ?? "").trim();

    if (!recipient) {
      return NextResponse.json(
        { ok: false, error: "Customer email is missing." },
        { status: 400 }
      );
    }

    const qrBuffer = await QRCode.toBuffer(qrToken, {
      type: "png",
      width: 700,
      margin: 2,
      errorCorrectionLevel: "M",
    });

    const location = Array.isArray(booking.location)
      ? booking.location[0]
      : booking.location;

    const total = Number(booking.total_amount).toLocaleString();
    const bagCount = Number(booking.bag_count);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: `BagDrop Uzbekistan <${gmailUser}>`,
      to: recipient,
      subject: `BagDrop booking ${booking.booking_number}`,
      text: [
        `Hi ${booking.customer_name},`,
        "",
        "Your BagDrop booking has been created.",
        `Booking: ${booking.booking_number}`,
        `Location: ${location?.name ?? "BagDrop"}`,
        `Drop-off: ${booking.dropoff_date} ${String(booking.dropoff_time).slice(0, 5)}`,
        `Pickup: ${booking.pickup_date} ${String(booking.pickup_time).slice(0, 5)}`,
        `Bags: ${bagCount}`,
        `Total: ${total} ${booking.currency}`,
        `Status: ${booking.status}`,
        "",
        "Your QR code is attached. Please show it at drop-off and pickup.",
        "",
        "BagDrop Uzbekistan",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1b2a3a">
          <h2>BagDrop booking confirmed</h2>
          <p>Hi ${escapeHtml(String(booking.customer_name))},</p>
          <p>Your luggage-storage booking has been created.</p>
          <table cellpadding="7" cellspacing="0" style="width:100%;border-collapse:collapse">
            <tr><td><b>Booking</b></td><td>${escapeHtml(String(booking.booking_number))}</td></tr>
            <tr><td><b>Location</b></td><td>${escapeHtml(String(location?.name ?? "BagDrop"))}</td></tr>
            <tr><td><b>Drop-off</b></td><td>${escapeHtml(String(booking.dropoff_date))} ${escapeHtml(String(booking.dropoff_time).slice(0, 5))}</td></tr>
            <tr><td><b>Pickup</b></td><td>${escapeHtml(String(booking.pickup_date))} ${escapeHtml(String(booking.pickup_time).slice(0, 5))}</td></tr>
            <tr><td><b>Bags</b></td><td>${bagCount}</td></tr>
            <tr><td><b>Total</b></td><td>${total} ${escapeHtml(String(booking.currency))}</td></tr>
            <tr><td><b>Status</b></td><td>${escapeHtml(String(booking.status))}</td></tr>
          </table>
          <p style="margin-top:24px"><b>Your QR code</b></p>
          <p>Show this QR code at drop-off and pickup.</p>
          <img src="cid:bagdrop-qr" alt="BagDrop QR code" width="350" height="350" style="display:block" />
          <p style="margin-top:24px;color:#607080;font-size:13px">BagDrop Uzbekistan</p>
        </div>
      `,
      attachments: [
        {
          filename: `${booking.booking_number}-QR.png`,
          content: qrBuffer,
          contentType: "image/png",
          cid: "bagdrop-qr",
        },
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Booking email error:", error);
    return NextResponse.json(
      { ok: false, error: "Could not send booking email." },
      { status: 500 }
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
