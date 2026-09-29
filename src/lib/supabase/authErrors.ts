import { isAuthRetryableFetchError, type AuthError } from "@supabase/supabase-js";

/**
 * Message for a failed signInWithPassword on the admin and partner login
 * pages. Only a real invalid-credentials answer may say "wrong email or
 * password": reporting every failure that way is what hid, for days, that the
 * browser was talking to a Supabase URL that does not exist.
 */
export function signInErrorMessage(error: AuthError): string {
  // auth-js reports both a failed request (status 0) and a 5xx answer from the
  // Auth server as AuthRetryableFetchError; only the first is a connection
  // problem on the user's side.
  if (error.status === 0) {
    return "Autentifikatsiya serveriga ulanib bo‘lmadi. Internet aloqasini tekshirib, qayta urinib ko‘ring.";
  }

  if (isAuthRetryableFetchError(error) || (error.status ?? 0) >= 500) {
    return `Autentifikatsiya serverida xatolik (HTTP ${error.status}). Birozdan so‘ng qayta urinib ko‘ring.`;
  }

  if (error.code === "invalid_credentials" || /invalid login credentials/i.test(error.message)) {
    return "Email yoki parol noto‘g‘ri.";
  }

  switch (error.code) {
    case "email_not_confirmed":
      return "Email manzil hali tasdiqlanmagan. Pochtadagi tasdiqlash havolasini oching yoki administratorga murojaat qiling.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Juda ko‘p urinish bo‘ldi. Birozdan so‘ng qayta urinib ko‘ring.";
    case "user_banned":
      return "Bu hisob bloklangan.";
    default:
      return `Kirish amalga oshmadi: ${error.message}`;
  }
}

export const SERVER_UNAVAILABLE_MESSAGE =
  "Server vaqtincha javob bermayapti. Birozdan so‘ng qayta urinib ko‘ring.";
