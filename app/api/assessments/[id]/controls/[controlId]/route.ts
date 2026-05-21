import { NextResponse } from "next/server";
import { updateAssessmentControl } from "@/lib/services/assessments";

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; controlId: string }> }
) {
  const { id, controlId } = await params;
  const body = await request.json();
  updateAssessmentControl(id, controlId, body);
  return NextResponse.json({ ok: true });
}
