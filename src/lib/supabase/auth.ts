import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";

import { isAuthRetryableFetchError } from "@supabase/supabase-js";
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
    error,
  } = await supabase.auth.getUser();

  // No session is an ordinary "logged out". A network or Auth server failure
  // is not, and must not be reported as one: the login pages sign the user out
  // on 401. Callers turn the throw into a 500.
  if (error && isAuthRetryableFetchError(error)) {
    throw error;
  }

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
 * va public.partner_users jadvalida o'z partneriga
 * bog'langan bo'lishi kerak.
 */
async function persistPartnerMembership(
  supabaseAdmin: any,
  userId: string,
  partnerId: string
) {
  const { error } = await supabaseAdmin
    .from("partner_users")
    .upsert(
      { user_id: userId, partner_id: partnerId },
      { onConflict: "user_id", ignoreDuplicates: true }
    );

  if (error) {
    console.error("Partner membership migration failed:", error);
    return false;
  }

  const { data: membership, error: lookupError } = await supabaseAdmin
    .from("partner_users")
    .select("partner_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (lookupError) {
    console.error("Partner membership verification failed:", lookupError);
    return false;
  }

  return membership?.partner_id === partnerId;
}

export async function getPartnerForUser(
  userId: string,
  email?: string,
  emailConfirmed = false
) {
  const supabaseAdmin: any = createAdminClient();

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("partner_users")
    .select("partner_id")
    .eq("user_id", userId)
    .maybeSingle();

  // Query errors throw instead of returning null: null means "not a partner",
  // and the partner login page signs the user out with "not linked" for that.
  // Every caller is inside a try/catch that answers 500.
  if (membershipError) {
    console.error(
      "Partner membership lookup failed:",
      membershipError
    );

    throw new Error("Partner membership lookup failed.");
  }

  if (membership) {
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from("partners")
      .select("*")
      .eq("id", membership.partner_id)
      .eq("active", true)
      .maybeSingle();

    if (partnerError) {
      console.error("Partner lookup failed:", partnerError);
      throw new Error("Partner lookup failed.");
    }

    return partner;
  }

  const { data: legacyPartner, error: legacyError } = await supabaseAdmin
    .from("partners")
    .select("*")
    .eq("auth_user_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (!legacyError && legacyPartner) {
    const linked = await persistPartnerMembership(
      supabaseAdmin,
      userId,
      legacyPartner.id
    );
    return linked ? legacyPartner : null;
  }

  // The auth_user_id column exists in no migration, so this lookup is expected
  // to fail with a "column does not exist" error; anything else is real.
  if (legacyError && !String(legacyError.message).includes("auth_user_id")) {
    console.error("Legacy partner lookup failed:", legacyError);
    throw new Error("Legacy partner lookup failed.");
  }

  if (!emailConfirmed || !email) return null;

  const { data: emailPartner, error: emailError } = await supabaseAdmin
    .from("partners")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .eq("active", true)
    .maybeSingle();

  if (emailError) {
    console.error("Verified partner email lookup failed:", emailError);
    throw new Error("Verified partner email lookup failed.");
  }

  if (!emailPartner) return null;

  const linked = await persistPartnerMembership(
    supabaseAdmin,
    userId,
    emailPartner.id
  );

  return linked ? emailPartner : null;
}

export async function getAuthenticatedPartner() {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const partner = await getPartnerForUser(
    user.id,
    user.email,
    Boolean(user.email_confirmed_at)
  );
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