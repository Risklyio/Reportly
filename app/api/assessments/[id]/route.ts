import { NextResponse } from "next/server";
import {
  getAssessment,
  updateAssessment,
  deleteAssessment,
  getAssessmentControlStates,
} from "@/lib/services/assessments";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const assessment = getAssessment(id);
  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const controls = getAssessmentControlStates(id);
  return NextResponse.json({ assessment, controls });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const updated = updateAssessment(id, body);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteAssessment(id);
  return NextResponse.json({ ok: true });
}
