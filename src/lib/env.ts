/**
 * Centralized, validated access to environment variables.
 * Throws a clear error immediately if something required is missing,
 * instead of failing confusingly deep inside a Supabase call.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.example to .env.local and fill it in ` +
        `(see README.md → "Connect Supabase").`
    );
  }
  return value;
}

export const env = {
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
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
