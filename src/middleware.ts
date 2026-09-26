import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

export async function middleware(
  request: NextRequest
) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  // ==========================================
  // SUPABASE ENV CHECK
  // ==========================================

  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    return NextResponse.next();
  }

  // ==========================================
  // INITIAL RESPONSE
  // ==========================================

  let response =
    NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

  // ==========================================
  // PATH TRAVERSAL PROTECTION
  // ==========================================

  const pathname =
    request.nextUrl.pathname;

  if (
    pathname.includes("..") ||
    pathname.includes("\\") ||
    pathname.includes("%00") ||
    pathname.includes("%2e%2e")
  ) {
    return new NextResponse(
      "Forbidden",
      { status: 403 }
    );
  }

  // ==========================================
  // CSRF PROTECTION (API mutations)
  //
  // For POST/PUT/PATCH/DELETE requests to /api/*,
  // verify that the Origin header is from our
  // known domains. This prevents cross-site
  // request forgery attacks.
  // ==========================================

  const ALLOWED_ORIGINS = [
    "https://bagdrop.uz",
    "https://www.bagdrop.uz",
    "http://localhost:3000",
    "http://localhost:3001",
  ];

  const isApiMutation =
    pathname.startsWith("/api/") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(
      request.method
    );

  if (isApiMutation) {
    const origin = request.headers.get("origin");

    if (
      origin &&
      !ALLOWED_ORIGINS.includes(origin)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Forbidden: invalid origin.",
        },
        { status: 403 }
      );
    }
  }


  // ==========================================
  // SUPABASE SERVER CLIENT
  // ==========================================

  const supabase =
    createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options: CookieOptions;
            }[]
          ) {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                request.cookies.set({
                  name,
                  value,
                  ...options,
                });

                response.cookies.set({
                  name,
                  value,
                  ...options,
                });
              }
            );
          },
        },
      }
    );

  // ==========================================
  // CURRENT USER
  // ==========================================

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  // ==========================================
  // ROLE HELPERS
  // ==========================================

  const adminEmail =
    process.env.ADMIN_EMAIL
      ?.trim()
      .toLowerCase();

  const userEmail =
    user?.email
      ?.trim()
      .toLowerCase();

  const isAdmin =
    Boolean(
      user &&
        adminEmail &&
        userEmail === adminEmail
    );

  // ==========================================
  // CHECK PARTNER
  //
  // We use Supabase REST here instead of
  // createAdminClient because middleware
  // runs in the Edge runtime.
  // ==========================================

  let isPartner = false;

  if (
    user &&
    serviceRoleKey
  ) {
    try {
      const partnerUrl =
        new URL(
          "/rest/v1/partners",
          supabaseUrl
        );

      partnerUrl.searchParams.set(
        "select",
        "id"
      );

      partnerUrl.searchParams.set(
        "auth_user_id",
        `eq.${user.id}`
      );

      partnerUrl.searchParams.set(
        "limit",
        "1"
      );

      const partnerResponse =
        await fetch(
          partnerUrl.toString(),
          {
            method: "GET",

            headers: {
              apikey:
                serviceRoleKey,

              Authorization:
                `Bearer ${serviceRoleKey}`,
            },

            cache: "no-store",
          }
        );

      if (
        partnerResponse.ok
      ) {
        const partners =
          await partnerResponse.json();

        isPartner =
          Array.isArray(
            partners
          ) &&
          partners.length > 0;
      }
    } catch (error) {
      console.error(
        "Partner role check failed:",
        error
      );

      isPartner = false;
    }
  }

  // ==========================================
  // ADMIN LOGIN
  // ==========================================

  if (
    pathname === "/admin/login"
  ) {
    // Admin already logged in
    // -> go to admin dashboard.

    if (isAdmin) {
      const adminUrl =
        request.nextUrl.clone();

      adminUrl.pathname =
        "/admin";

      adminUrl.search = "";

      return NextResponse.redirect(
        adminUrl
      );
    }

    // Important:
    // Partner/customer users are NOT
    // automatically sent to /admin.
    return response;
  }

  // ==========================================
  // PROTECT ADMIN
  // ==========================================

  const isAdminPage =
    pathname === "/admin" ||
    pathname.startsWith(
      "/admin/"
    );

  if (isAdminPage) {
    // Not logged in
    if (!user) {
      const loginUrl =
        request.nextUrl.clone();

      loginUrl.pathname =
        "/admin/login";

      loginUrl.search = "";

      return NextResponse.redirect(
        loginUrl
      );
    }

    // Logged in, but NOT admin
    if (!isAdmin) {
      const homeUrl =
        request.nextUrl.clone();

      homeUrl.pathname = "/";

      homeUrl.search = "";

      return NextResponse.redirect(
        homeUrl
      );
    }

    return response;
  }

  // ==========================================
  // PARTNER LOGIN
  // ==========================================

  if (
    pathname === "/partner/login"
  ) {
    // Partner already logged in
    // -> go to partner dashboard.

    if (isPartner) {
      const partnerUrl =
        request.nextUrl.clone();

      partnerUrl.pathname =
        "/partner";

      partnerUrl.search = "";

      return NextResponse.redirect(
        partnerUrl
      );
    }

    // Admin/customer is allowed to see
    // partner login page.
    //
    // They will NOT be allowed into
    // /partner itself.
    return response;
  }

  // ==========================================
  // PROTECT PARTNER
  // ==========================================

  const isPartnerPage =
    pathname === "/partner" ||
    pathname.startsWith(
      "/partner/"
    );

  if (isPartnerPage) {
    // Not logged in
    if (!user) {
      const loginUrl =
        request.nextUrl.clone();

      loginUrl.pathname =
        "/partner/login";

      loginUrl.search = "";

      return NextResponse.redirect(
        loginUrl
      );
    }

    // Logged in, but not partner
    if (!isPartner) {
      const homeUrl =
        request.nextUrl.clone();

      homeUrl.pathname = "/";

      homeUrl.search = "";

      return NextResponse.redirect(
        homeUrl
      );
    }

    return response;
  }

  // ==========================================
  // PUBLIC PAGES
  // ==========================================

  return response;
}

// ==========================================
// MIDDLEWARE MATCHER
// ==========================================

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};