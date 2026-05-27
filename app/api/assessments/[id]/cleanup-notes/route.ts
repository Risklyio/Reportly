import { NextResponse } from "next/server";
import {
  cleanupAssessorNotesWithGroq,
  getAiProviderDiagnostics,
} from "@/lib/ai/generate-corrective";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params;
    const body = await request.json();
    const assessorNotes = String(body.assessorNotes ?? "");
    const text = await cleanupAssessorNotesWithGroq(assessorNotes);
    return NextResponse.json({ text });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Clean up failed";
    const status = message.includes("API key") || message.includes("GROQ_API_KEY") ? 503 : 500;
    return NextResponse.json(
      { error: message, ai: getAiProviderDiagnostics() },
      { status }
    );
  }
}
