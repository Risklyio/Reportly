import { NextResponse } from "next/server";
import { updateAssessmentControl } from "@/lib/services/assessments";

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; controlId: string }> }
) {
  try {
    const { id, controlId } = await params;
    const body = await request.json();
    await updateAssessmentControl(id, controlId, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
