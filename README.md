# BagDrop — Luggage Storage Platform (Samarkand MVP)

A mobile-first luggage storage booking platform for tourists in Uzbekistan, built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and **Supabase (PostgreSQL + Auth)**.

## Current status: Phase 1 complete — Supabase connection + database schema

This is a real full-stack app, not a static prototype. Phase 1 wires up the database and auth infrastructure. **The public pages (`/`, `/locations`, etc.) still read from mock data in `src/lib/mockData.ts`** — replacing them with real Supabase queries is Phase 2, intentionally not done yet, so each phase stays reviewable on its own.

### What Phase 1 added

- Supabase client helpers for three contexts, each with a clear boundary:
  - `src/lib/supabase/client.ts` — browser ("use client" components), respects RLS
  - `src/lib/supabase/server.ts` — Server Components/Actions/Route Handlers, respects RLS, acts as the signed-in user
  - `src/lib/supabase/admin.ts` — **server-only**, bypasses RLS, guarded by the `server-only` package so it's a build error to import it from any client component
- `src/middleware.ts` — refreshes the Supabase auth session cookie on every request; fails _gracefully_ (logs a warning, doesn't crash pages) if Supabase isn't configured yet
- `src/lib/env.ts` — centralized env var access with clear error messages instead of confusing failures deep inside a Supabase call
- `supabase/migrations/0001_schema.sql` — full schema: `users`, `partners`, `partner_users`, `locations`, `bookings`, `bags`, `payments`, `audit_logs`, with enums, foreign keys, indexes, and `updated_at` triggers
- `supabase/migrations/0002_auth_trigger.sql` — auto-creates a `public.users` row (role defaults to `customer`) whenever someone signs up via Supabase Auth
- `supabase/migrations/0003_rls.sql` — **Row Level Security enabled on every table**, with baseline policies (public can read active locations; users read their own row/bookings; partner staff read their own partner's data; admins read everything). Booking _writes_ have no anon/authenticated policy at all on purpose — they'll go through server actions with the service-role client once Phase 3 implements the availability/pricing logic server-side, exactly as the spec requires ("never trust price/availability from the frontend").
- `supabase/migrations/0004_seed_demo_data.sql` — **optional**, inserts one demo partner + the 3 Samarkand locations so `/api/health` has something to count immediately
- `supabase/migrations/0005_backend_operations.sql` — required operational tables, private bag-photo storage, atomic booking/capacity RPC, shared production rate limiting, and payment schema extensions
- `src/app/api/health/route.ts` — a verification endpoint for this phase (see "How to test" below)
- `.env.example` — every environment variable this app needs, with no invented values
- Removed static export mode (`output: "export"`) from `next.config.js` — a real backend needs a real server (Vercel or any Node host), not a static file host

## How to connect your Supabase project

1. Create a project at https://supabase.com (free tier is fine for MVP).
2. In the Supabase dashboard: **SQL Editor** → run `0001_schema.sql`, `0002_auth_trigger.sql`, and `0003_rls.sql` in order. Run `0004_seed_demo_data.sql` if you want demo locations, then run `0005_backend_operations.sql` before deploying the current app.
3. In the Supabase dashboard: **Project Settings → API** → copy the "Project URL", "anon public" key, and "service_role" key (click "Reveal" — keep this one secret).
4. In this project: `cp .env.example .env.local`, then paste those three values in.

## Exact commands to run the app

```bash
npm install
npm run dev
```

Open http://localhost:3000

## How to test Phase 1

1. With `.env.local` filled in and migrations run, visit **http://localhost:3000/api/health**.
2. Expected response if the database schema and storage bucket are ready:
   ```json
   {
     "ok": true,
     "message": "Supabase connection is working.",
     "activeLocationCount": 3
   }
   ```
   (`activeLocationCount` will be `0` instead of `3` if you skipped the optional seed migration — that's fine, it still proves the connection works.)
3. If you see `"step": "env"` — `.env.local` is missing or has a typo; recheck step 4 above.
4. If you see `"step": "query"` or `"step": "schema"` — check that the migrations were run against this Supabase project. `"step": "storage"` means the private `bag-photos` bucket is missing.
5. Confirm the rest of the site still works exactly as before (it's still on mock data): `/`, `/locations`, `/locations/registan`, `/book`, `/booking`, `/partner`, `/admin`.

## Explicitly NOT built yet

- Real Click/Payme payment integration — the payment service fails closed with HTTP 503 until a provider adapter and verified callback are configured; no test/demo request can mark a booking paid
- Public location pages can show built-in demo fallback data when the database is unavailable or empty; demo locations cannot be booked

Partner/admin login, database-backed booking transitions, bag-photo checks, and notifications are implemented. Partner check-in requires a verified `PAID` booking and front/back photos for every bag.

## Project structure (additions from Phase 1)

```
supabase/migrations/
  0001_schema.sql          → tables, enums, indexes, triggers
  0002_auth_trigger.sql    → auto-provision public.users on signup
  0003_rls.sql              → Row Level Security policies
  0004_seed_demo_data.sql  → optional demo partner + 3 locations
  0005_backend_operations.sql → booking, photos, notifications, and rate-limit operations
src/
  middleware.ts             → Supabase session refresh (fails gracefully)
  lib/
    env.ts                  → validated env var access
    supabase/
      client.ts             → browser client (RLS-respecting)
      server.ts             → server client (RLS-respecting)
      admin.ts              → service-role client (server-only, bypasses RLS)
      types.ts              → hand-written DB types (regenerate once connected)
  app/api/health/route.ts   → Phase 1 verification endpoint
.env.example                → all required env vars, no invented values
```
