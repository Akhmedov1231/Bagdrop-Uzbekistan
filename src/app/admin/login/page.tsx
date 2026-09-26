"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email va parolni kiriting.");
      return;
    }

    setLoading(true);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (loginError) {
      setLoading(false);
      setError("Email yoki parol noto‘g‘ri.");
      return;
    }

    if (!data.user) {
      setLoading(false);
      setError("Login amalga oshmadi.");
      return;
    }

    const roleResponse = await fetch("/api/auth/role", {
      method: "GET",
      cache: "no-store",
    });

    let roleResult: { ok?: boolean; role?: string | null; error?: string } = {};

    try {
      roleResult = await roleResponse.json();
    } catch {
      roleResult = {};
    }

    if (!roleResponse.ok || !roleResult.ok || roleResult.role !== "admin") {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Bu hisob Administrator sifatida tasdiqlanmagan.");
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Subtle Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Homepage</span>
        </Link>

        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-4xl p-8 sm:p-10 shadow-2xl space-y-6">
          
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white mb-4 shadow-glow-brand">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400 block">
              BagDrop Control Center
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
              Administrator Access
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Sign in to manage partner accounts, luggage logs, and platform settings.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bagdrop.uz"
                  autoComplete="email"
                  required
                  disabled={loading}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 py-3.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 py-3.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-medium"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-400 font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold py-3.5 px-4 text-sm shadow-glow-brand transition-all disabled:opacity-50 active:scale-95"
            >
              <span>{loading ? "Authenticating..." : "Enter Admin Panel"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-slate-500">
            <Lock className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Encrypted administrative connection</span>
          </div>

        </div>
      </div>
    </main>
  );
}