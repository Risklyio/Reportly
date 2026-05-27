import { NextResponse } from "next/server";
import {
  listAssessments,
  createAssessment,
} from "@/lib/services/assessments";

export async function GET() {
  try {
    return NextResponse.json(await listAssessments());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = await createAssessment({
      clientName: body.clientName ?? "",
      appName: body.appName ?? "",
      assessmentDate:
        body.assessmentDate ?? new Date().toISOString().slice(0, 10),
      assessorName: body.assessorName,
      scopeNotes: body.scopeNotes,
      frameworkId: body.frameworkId,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
