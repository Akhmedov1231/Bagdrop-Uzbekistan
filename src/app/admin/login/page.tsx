"use client";

import { FormEvent, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
);

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError(
        "Email va passwordni kiriting."
      );
      return;
    }

    setLoading(true);

    // 1. Supabase Auth login
    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (loginError) {
      setLoading(false);
      setError(
        "Email yoki password noto‘g‘ri."
      );
      return;
    }

    // 2. User mavjudligini tekshirish
    if (!data.user) {
      setLoading(false);
      setError(
        "Login amalga oshmadi."
      );
      return;
    }

    // 3. Admin rolini SERVER orqali tekshirish
    const roleResponse = await fetch(
      "/api/auth/role",
      {
        method: "GET",
        cache: "no-store",
      }
    );

    let roleResult: {
      ok?: boolean;
      role?: string | null;
      error?: string;
    } = {};

    try {
      roleResult =
        await roleResponse.json();
    } catch {
      roleResult = {};
    }

    // 4. Admin bo'lmasa logout qilamiz
    if (
      !roleResponse.ok ||
      !roleResult.ok ||
      roleResult.role !== "admin"
    ) {
      await supabase.auth.signOut();

      setLoading(false);

      setError(
        "Bu account Admin sifatida biriktirilmagan."
      );

      return;
    }

    // 5. Haqiqiy Admin
    window.location.href = "/admin";
  }

  return (
    <main className="min-h-screen bg-sand flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="bg-white border border-line rounded-xl p-7 shadow-sm">

          {/* Header */}
          <div className="mb-7">
            <p className="text-xs font-semibold tracking-wider uppercase text-ink-soft">
              BagDrop Uzbekistan
            </p>

            <h1 className="font-slab font-bold text-2xl mt-2">
              Admin login
            </h1>

            <p className="text-sm text-ink-soft mt-2">
              Sign in to manage bookings and
              locations.
            </p>
          </div>

          {/* Login form */}
          <form
            onSubmit={handleLogin}
            className="space-y-4"
          >

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="admin@example.com"
                autoComplete="email"
                required
                disabled={loading}
                className="input w-full"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={loading}
                className="input w-full"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading
                ? "Signing in..."
                : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}