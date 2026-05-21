import { NextResponse } from "next/server";
import { runSupabaseSetup } from "@/lib/setup/run-supabase-setup";
import { isSupabaseConfigured } from "@/lib/db/env";

/**
 * One-time remote setup on Vercel:
 *   GET /api/setup?secret=YOUR_SETUP_SECRET
 *
 * Add to Vercel env:
 *   SETUP_SECRET=some-long-random-string
 *   DATABASE_URL=postgres://... (Supabase connection URI)
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
export async function GET(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  const expected = process.env.SETUP_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first, redeploy, then call this URL again.",
      },
      { status: 400 }
    );
  }

  try {
    const logs = await runSupabaseSetup();
    return NextResponse.json({
      ok: true,
      message: "Supabase setup complete. Remove SETUP_SECRET and redeploy.",
      logs,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Setup failed",
      },
      { status: 500 }
    );
  }
}
