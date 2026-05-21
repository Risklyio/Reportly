import { NextResponse } from "next/server";
import { ensureAssessorNotesColumn } from "@/lib/db/migrate-supabase";

/**
 * One-time fix for existing Supabase DBs missing assessor_notes.
 * Requires DATABASE_URL and SETUP_SECRET on Vercel.
 * GET /api/migrate-assessor-notes?secret=YOUR_SETUP_SECRET
 */
export async function GET(request: Request) {
  const secret = process.env.SETUP_SECRET?.trim();
  const provided = new URL(request.url).searchParams.get("secret");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      {
        error:
          "DATABASE_URL is required on Vercel (Supabase → Database → Connection string URI)",
      },
      { status: 503 }
    );
  }

  try {
    await ensureAssessorNotesColumn();
    return NextResponse.json({
      ok: true,
      message:
        "assessor_notes column added. Wait ~30s for Supabase schema cache to refresh, then retry.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Migration failed" },
      { status: 500 }
    );
  }
}
