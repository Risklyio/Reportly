import { NextResponse } from "next/server";
import {
  listAssessments,
  createAssessment,
} from "@/lib/services/assessments";

export async function GET() {
  return NextResponse.json(listAssessments());
}

export async function POST(request: Request) {
  const body = await request.json();
  const created = createAssessment({
    clientName: body.clientName ?? "",
    appName: body.appName ?? "",
    assessmentDate: body.assessmentDate ?? new Date().toISOString().slice(0, 10),
    assessorName: body.assessorName,
    scopeNotes: body.scopeNotes,
  });
  return NextResponse.json(created, { status: 201 });
}
