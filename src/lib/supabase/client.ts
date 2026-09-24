"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "./types";

/**
 * Use this client in "use client" components only.
 * It carries the current user's session (via cookies) and is subject to
 * Row Level Security — it can never see more than the signed-in user
 * (or anonymous public policies) are allowed to see.
 */
export function createClient() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
