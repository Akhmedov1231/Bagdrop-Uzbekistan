function randomDigits(n: number) {
  let out = "";
  for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 10);
  return out;
}

/** e.g. SAM-20260910-48291 */
export function generateBookingNumber(cityCode = "SAM"): string {
  const d = new Date();
  const datePart = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `${cityCode}-${datePart}-${randomDigits(5)}`;
}

/**
 * In production this would be a signed (HMAC) token so it can't be forged,
 * verified server-side on scan. For this mock build we generate an opaque
 * random token of the same shape so the QR/scan UI can be wired up now.
 */
export function generateQrToken(): string {
  return `qrt_${randomDigits(6)}${Math.random().toString(36).slice(2, 10)}`;
}

export function generateId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${randomDigits(6)}`;
}

export function generateBagTags(bookingNumber: string, count: number): string[] {
  const shortNum = bookingNumber.split("-").pop() ?? "0000";
  return Array.from({ length: count }, (_, i) => `${shortNum}-${String(i + 1).padStart(2, "0")}`);
}
