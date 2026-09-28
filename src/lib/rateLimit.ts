import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Shared production rate limits use Postgres so requests handled by
 * different application instances observe the same counter.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Clean expired records every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (record.resetAt <= now) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

export interface RateLimitOptions {
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Time window in milliseconds (e.g. 60_000 for 1 minute) */
  windowMs: number;
  /** Prefix for the identifier (e.g. 'booking_create', 'email_send') */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check if the given identifier (IP or token) has exceeded the rate limit.
 */
function checkInMemoryRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  ensureCleanup();

  const key = `${options.prefix ?? "default"}:${identifier || "anonymous"}`;
  const now = Date.now();

  const record = store.get(key);

  if (!record || record.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return {
      success: true,
      limit: options.maxRequests,
      remaining: options.maxRequests - 1,
      reset: now + options.windowMs,
    };
  }

  if (record.count >= options.maxRequests) {
    return {
      success: false,
      limit: options.maxRequests,
      remaining: 0,
      reset: record.resetAt,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit: options.maxRequests,
    remaining: options.maxRequests - record.count,
    reset: record.resetAt,
  };
}

export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  if (process.env.NODE_ENV !== "production") {
    return checkInMemoryRateLimit(identifier, options);
  }

  const key = createHash("sha256")
    .update(`${options.prefix ?? "default"}:${identifier || "anonymous"}`)
    .digest("hex");
  const supabase: any = createAdminClient();
  const { data, error } = await supabase
    .rpc("consume_api_rate_limit", {
      p_key: key,
      p_limit: options.maxRequests,
      p_window_seconds: Math.ceil(options.windowMs / 1000),
    })
    .single();

  if (error || !data) {
    throw new Error(
      `Could not enforce API rate limit: ${error?.message ?? "empty database response"}`
    );
  }

  const reset = Date.parse(data.reset_at);
  if (!Number.isFinite(reset)) {
    throw new Error("Rate limit service returned an invalid reset time.");
  }

  return {
    success: Boolean(data.success),
    limit: options.maxRequests,
    remaining: Number(data.remaining),
    reset,
  };
}

/**
 * Extract client IP from Next.js request headers.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
