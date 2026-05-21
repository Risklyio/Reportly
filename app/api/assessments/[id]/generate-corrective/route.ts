import { NextResponse } from "next/server";
import { generateCorrectiveFromAssessorNotes } from "@/lib/ai/generate-corrective";
import type { ControlOutcome } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params;
    const body = await request.json();
    const controlId = String(body.controlId ?? "");
    const assessorNotes = String(body.assessorNotes ?? "");
    const notInPlaceReason = String(body.notInPlaceReason ?? "");
    const outcome = body.outcome as ControlOutcome;

    if (!controlId) {
      return NextResponse.json({ error: "controlId is required" }, { status: 400 });
    }
    if (outcome !== "not_in_place" && outcome !== "partially_in_place") {
      return NextResponse.json(
        { error: "Generate is only for Not in place or Partially in place outcomes" },
        { status: 400 }
      );
    }

    const text = await generateCorrectiveFromAssessorNotes({
      controlId,
      outcome,
      notInPlaceReason,
      assessorNotes,
    });

    return NextResponse.json({ text });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Generation failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
