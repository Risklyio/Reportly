import { NextResponse } from "next/server";
import { getAiProviderDiagnostics } from "@/lib/ai/generate-corrective";

export const dynamic = "force-dynamic";

/** Which AI provider Vercel will use (no secrets). Same data is on GET /api/controls under `ai`. */
export async function GET() {
  return NextResponse.json(getAiProviderDiagnostics());
}
