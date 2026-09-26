"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Store, Lock, Mail, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";

export default function PartnerLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email va parolni kiriting.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        setError("Email yoki parol noto‘g‘ri.");
        return;
      }

      if (!data.user) {
        setError("Login amalga oshmadi.");
        return;
      }

      const response = await fetch("/api/partner/session", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        await supabase.auth.signOut();
        setError(
          result.error || "Bu account Partner sifatida biriktirilmagan."
        );
        return;
      }

      router.replace("/partner");
      router.refresh();
    } catch (error) {
      console.error("Partner login failed:", error);
      await supabase.auth.signOut();
      setError("Login vaqtida xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-ink mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Bosh sahifaga qaytish</span>
        </Link>

        <div className="bg-white border border-line rounded-4xl shadow-card-modern p-8 sm:p-10 space-y-6">
          
          {/* Header */}
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center mb-4">
              <Store className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-600 block">
              BagDrop Partner Portal
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">
              Hamkor Kirish
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft">
              Yuk saqlash punktini boshqarish va QR kodlarni skanerlash uchun kiring.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email manzil
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@example.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                  className="admin-input pl-10 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Parol
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="admin-input pl-10 text-xs font-semibold"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold py-3.5 px-4 text-sm shadow-glow-brand transition-all disabled:opacity-50 active:scale-95"
            >
              <span>{loading ? "Kirilmoqda..." : "Kabinetga kirish"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Xavfsiz avtorizatsiya va maʼlumotlar himoyasi</span>
          </div>

        </div>
      </div>
    </main>
  );
}