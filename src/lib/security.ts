/**
 * Input Sanitization & Validation Utilities
 *
 * Protects API routes against:
 * - SQL injection (via parameterized queries — Supabase handles this)
 * - XSS (via HTML entity encoding)
 * - NoSQL injection
 * - Prototype pollution
 * - Email/phone format validation
 * - Length overflow attacks
 */

// ============================================================
// HTML SANITIZATION — prevents stored XSS
// ============================================================

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

/**
 * Escape HTML special characters to prevent XSS
 * when user-provided data is rendered in the browser.
 */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"'`/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strip all HTML tags from input — more aggressive than escapeHtml.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

// ============================================================
// STRING SANITIZATION
// ============================================================

/**
 * Sanitize a general text input:
 * - Trim whitespace
 * - Strip HTML tags
 * - Enforce max length
 * - Remove null bytes (prevents injection in some databases)
 */
export function sanitizeText(
  input: unknown,
  maxLength: number = 500
): string {
  if (typeof input !== "string") return "";

  return stripHtml(input)
    .replace(/\0/g, "")       // Remove null bytes
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize a name field — only allows letters, spaces, hyphens, apostrophes.
 */
export function sanitizeName(
  input: unknown,
  maxLength: number = 100
): string {
  if (typeof input !== "string") return "";

  return input
    .replace(/\0/g, "")
    .replace(/[^\p{L}\p{M}\s'-]/gu, "")  // Unicode letters, marks, spaces, hyphens, apostrophes
    .trim()
    .slice(0, maxLength);
}

// ============================================================
// EMAIL VALIDATION
// ============================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate and normalize email address.
 */
export function validateEmail(input: unknown): {
  valid: boolean;
  email: string;
} {
  if (typeof input !== "string") return { valid: false, email: "" };

  const email = input.trim().toLowerCase().slice(0, 254); // RFC 5321 max

  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, email: "" };
  }

  return { valid: true, email };
}

// ============================================================
// PHONE VALIDATION
// ============================================================

const PHONE_REGEX = /^\+?[\d\s\-()]{7,20}$/;

/**
 * Validate phone number format.
 */
export function validatePhone(input: unknown): {
  valid: boolean;
  phone: string;
} {
  if (typeof input !== "string") return { valid: false, phone: "" };

  const phone = input.trim().slice(0, 20);

  if (!PHONE_REGEX.test(phone)) {
    return { valid: false, phone: "" };
  }

  return { valid: true, phone };
}

// ============================================================
// UUID VALIDATION
// ============================================================

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format — prevents injection via ID fields.
 */
export function isValidUUID(input: unknown): boolean {
  if (typeof input !== "string") return false;
  return UUID_REGEX.test(input.trim());
}

// ============================================================
// REQUEST BODY SANITIZATION
// ============================================================

/**
 * Safely parse a JSON request body with size limits.
 * Returns null if the body is too large or malformed.
 */
export async function safeParseBody<T = Record<string, unknown>>(
  request: Request,
  maxBodySizeBytes: number = 10_000 // 10KB default
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const contentLength = request.headers.get("content-length");

    if (contentLength && parseInt(contentLength, 10) > maxBodySizeBytes) {
      return { ok: false, error: "Request body too large." };
    }

    const text = await request.text();

    if (text.length > maxBodySizeBytes) {
      return { ok: false, error: "Request body too large." };
    }

    const data = JSON.parse(text) as T;

    // Prototype pollution protection
    if (data && typeof data === "object") {
      if ("__proto__" in data || "constructor" in data || "prototype" in data) {
        return { ok: false, error: "Invalid request body." };
      }
    }

    return { ok: true, data };
  } catch {
    return { ok: false, error: "Invalid JSON body." };
  }
}

// ============================================================
// CORS ORIGIN VALIDATION
// ============================================================

const ALLOWED_ORIGINS = [
  "https://bagdrop.uz",
  "https://www.bagdrop.uz",
  "http://localhost:3000",
  "http://localhost:3001",
];

/**
 * Validate request origin against allowed list.
 */
export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Same-origin requests don't send Origin header
  return ALLOWED_ORIGINS.includes(origin);
}
