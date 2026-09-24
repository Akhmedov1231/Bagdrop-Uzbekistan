import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Phase 1 verification endpoint.
 * Visit /api/health after setting up .env.local and running the
 * migrations — it should report the schema is reachable and how many
 * active locations exist (0 if you skipped the optional seed data).
 */
export async function GET() {
  try {
    const supabase = createClient();

    const { count, error } = await supabase
      .from("locations")
      .select("*", { count: "exact", head: true })
      .eq("active", true);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          step: "query",
          error: error.message,
          hint: "Check that migrations 0001–0003 have been run against this Supabase project.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Supabase connection is working.",
      activeLocationCount: count ?? 0,
      hint:
        count === 0
          ? "No locations yet — run supabase/migrations/0004_seed_demo_data.sql (optional) or create one via SQL/admin dashboard."
          : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        step: "env",
        error: err instanceof Error ? err.message : String(err),
        hint: "Check that .env.local exists and has NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY set.",
      },
      { status: 500 }
    );
  }
}
