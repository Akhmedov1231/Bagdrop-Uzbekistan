import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "./types";

/**
 * SERVER-ONLY. Bypasses Row Level Security entirely.
 *
 * The `import "server-only"` line above makes it a build error if any
 * client component ever imports this file, even indirectly.
 *
 * Use this only for operations that are genuinely privileged and have
 * already been authorized in application code — e.g. an admin server
 * action that has already checked `role === 'admin'`, or a webhook
 * handler verifying a payment provider's signature. Never use it as a
 * shortcut to skip writing a proper RLS policy.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
