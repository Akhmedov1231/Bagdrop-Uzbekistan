import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "./types";

/**
 * Use this in Server Components, Server Actions, and Route Handlers.
 * It reads the user's session from cookies and is subject to Row Level
 * Security, exactly like the browser client — it just runs on the server.
 *
 * Do NOT use this for privileged operations that must bypass RLS
 * (see admin.ts for that, and use it sparingly and deliberately).
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Called from a Server Component render — safe to ignore if you
          // have middleware refreshing sessions (see middleware.ts).
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Same as above.
        }
      },
    },
  });
}
