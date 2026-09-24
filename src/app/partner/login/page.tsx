"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PartnerLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");

  async function handleLogin(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError(
        "Email va parolni kiriting."
      );
      return;
    }

    setLoading(true);

    try {
      // ==========================================
      // 1. SUPABASE AUTH LOGIN
      // ==========================================

      const {
        data,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        setError(
          "Email yoki parol noto‘g‘ri."
        );
        return;
      }

      if (!data.user) {
        setError(
          "Login amalga oshmadi."
        );
        return;
      }

      // ==========================================
      // 2. SERVER ORQALI PARTNERNI TEKSHIRISH
      // ==========================================
      //
      // Browser'dan partners jadvaliga
      // SELECT qilmaymiz.
      //
      // Server:
      // Auth user ID
      //      ↓
      // partners.auth_user_id
      //      ↓
      // Partner
      //

      const response = await fetch(
        "/api/partner/session",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      // ==========================================
      // 3. PARTNER EMAS
      // ==========================================

      if (!response.ok || !result.ok) {
        await supabase.auth.signOut();

        setError(
          result.error ||
            "Bu account Partner sifatida biriktirilmagan."
        );

        return;
      }

      // ==========================================
      // 4. LOGIN MUVAFFAQIYATLI
      // ==========================================

      router.replace("/partner");
      router.refresh();
    } catch (error) {
      console.error(
        "Partner login failed:",
        error
      );

      await supabase.auth.signOut();

      setError(
        "Login vaqtida xatolik yuz berdi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">

          {/* HEADER */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-slate-500">
              BagDrop Uzbekistan
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Partner Login
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Hamkor paneliga kirish uchun
              email va parolingizni kiriting.
            </p>
          </div>

          {/* LOGIN FORM */}
          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="partner@example.com"
                autoComplete="email"
                required
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* ERROR */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Kirilmoqda..."
                : "Login"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}