import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * --------------------------------------------------
 * BASE AUTHENTICATED USER
 * --------------------------------------------------
 *
 * Login qilgan Supabase userni qaytaradi.
 *
 * Bu eski API'lar bilan compatibility uchun saqlanadi.
 */
export async function getAuthenticatedUser() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options: CookieOptions;
          }>
        ) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set({
                  name,
                  value,
                  ...options,
                });
              }
            );
          } catch {
            // Server Component yoki boshqa contextda
            // cookie yozish mumkin bo'lmasa, o'tkazib yuboramiz.
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * --------------------------------------------------
 * ADMIN AUTH
 * --------------------------------------------------
 *
 * Faqat ADMIN_EMAIL bilan kirgan user Admin hisoblanadi.
 */
export async function getAuthenticatedAdmin() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!adminEmail) {
    console.error("ADMIN_EMAIL is not configured.");
    return null;
  }

  const userEmail = user.email?.trim().toLowerCase();

  if (!userEmail || userEmail !== adminEmail) {
    return null;
  }

  return user;
}

/**
 * --------------------------------------------------
 * PARTNER AUTH
 * --------------------------------------------------
 *
 * Partner user Supabase Auth orqali login qilgan bo'lishi
 * va public.partners jadvalida auth_user_id orqali
 * o'z partner yozuviga ega bo'lishi kerak.
 */
export async function getAuthenticatedPartner() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  const supabaseAdmin = createAdminClient();

  const { data: partner, error } = await supabaseAdmin
    .from("partners")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Partner authentication lookup failed:",
      error
    );

    return null;
  }

  if (!partner) {
    return null;
  }

  return {
    user,
    partner,
  };
}

/**
 * --------------------------------------------------
 * AUTH ROLE
 * --------------------------------------------------
 *
 * Userning role'ini aniqlash uchun yordamchi funksiya.
 */
export async function getAuthenticatedRole() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = user.email?.trim().toLowerCase();

  if (
    adminEmail &&
    userEmail &&
    userEmail === adminEmail
  ) {
    return {
      role: "admin" as const,
      user,
    };
  }

  const partner = await getAuthenticatedPartner();

  if (partner) {
    return {
      role: "partner" as const,
      user: partner.user,
      partner: partner.partner,
    };
  }

  return {
    role: "user" as const,
    user,
  };
}