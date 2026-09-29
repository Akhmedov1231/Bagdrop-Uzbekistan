import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

const partnerRequestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  business: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(40),
  city: z.string().trim().min(2).max(80),
  website: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const rateLimit = await checkRateLimit(getClientIp(request), {
      maxRequests: 3,
      windowMs: 15 * 60 * 1000,
      prefix: "partner_request",
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimit.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 8_000) {
      return NextResponse.json(
        { ok: false, error: "Request is too large." },
        { status: 413 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid request." },
        { status: 400 }
      );
    }

    const parsed = partnerRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Please check the required fields." },
        { status: 400 }
      );
    }

    if (parsed.data.website) {
      return NextResponse.json({ ok: true });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
    if (!botToken || !chatId) {
      console.error("Partner request Telegram delivery is not configured.");
      return NextResponse.json(
        { ok: false, error: "Request service is not configured." },
        { status: 503 }
      );
    }

    const cleanField = (value: string) => value.replace(/\s+/g, " ");
    const { name, business, phone, city } = parsed.data;
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: [
            "New BagDrop partner request",
            `Name: ${cleanField(name)}`,
            `Business: ${cleanField(business)}`,
            `Phone: ${cleanField(phone)}`,
            `City: ${cleanField(city)}`,
          ].join("\n"),
        }),
        cache: "no-store",
      }
    );

    if (!telegramResponse.ok) {
      console.error("Partner request Telegram delivery failed.", telegramResponse.status);
      return NextResponse.json(
        { ok: false, error: "Could not send request. Please try again later." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Partner request submission failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not send request. Please try again later." },
      { status: 500 }
    );
  }
}