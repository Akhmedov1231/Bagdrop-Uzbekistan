/**
 * Centralized, validated access to environment variables.
 * Throws a clear error immediately if something required is missing,
 * instead of failing confusingly deep inside a Supabase call.
 */

function required(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(
      `Missing required environment variable "${name}". NEXT_PUBLIC_* values are ` +
        "inlined at build time, so they must be set where `next build` runs."
    );
  }
  return trimmed;
}

export const env = {
  // These MUST stay literal `process.env.NEXT_PUBLIC_...` member expressions.
  // Next.js inlines only those into the browser bundle; a dynamic lookup such
  // as `process.env[name]` is undefined in the browser. That is what broke
  // admin and partner login: the browser Supabase client silently fell back
  // to a placeholder URL that does not exist, so every sign-in failed and was
  // reported as a wrong password. A missing value now fails the build
  // (prerender of /admin/login and /partner/login) instead of shipping that.
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseAnonKey() {
    return required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  },
  /** SERVER-ONLY. Never call this from a "use client" component. */
  get supabaseServiceRoleKey() {
    if (typeof window !== "undefined") {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY must never be accessed from the browser.");
    }
    return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  },
  get isDevelopment() {
    return process.env.NODE_ENV !== "production";
  },
};
