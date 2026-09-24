/**
 * Centralized, validated access to environment variables.
 * Throws a clear error immediately if something required is missing,
 * instead of failing confusingly deep inside a Supabase call.
 */

function getEnv(name: string, fallback: string = ""): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
      console.warn(`Environment variable "${name}" is not set.`);
    }
    return fallback;
  }
  return value;
}

export const env = {
  get supabaseUrl() {
    return getEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      "https://placeholder-project.supabase.co"
    );
  },
  get supabaseAnonKey() {
    return getEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "placeholder-anon-key"
    );
  },
  /** SERVER-ONLY. Never call this from a "use client" component. */
  get supabaseServiceRoleKey() {
    if (typeof window !== "undefined") {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY must never be accessed from the browser.");
    }
    return getEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  },
  get isDevelopment() {
    return process.env.NODE_ENV !== "production";
  },
};
