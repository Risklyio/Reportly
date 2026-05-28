import { NextResponse } from "next/server";
import {
  getAssessment,
  getAssessmentControlStates,
} from "@/lib/services/assessments";

type BackupPayload = {
  version: 1;
  exportedAt: string;
  assessment: {
    clientName: string;
    appName: string;
    assessmentDate: string;
    dueDate: string;
    assessorName: string;
    scopeNotes: string;
    frameworkId: string;
    status: "draft" | "in_progress" | "complete";
  };
  controls: Awaited<ReturnType<typeof getAssessmentControlStates>>;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessment = await getAssessment(id);
    if (!assessment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const controls = await getAssessmentControlStates(id);
    const payload: BackupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      assessment: {
        clientName: assessment.clientName,
        appName: assessment.appName,
        assessmentDate: assessment.assessmentDate,
        dueDate: assessment.dueDate ?? "",
        assessorName: assessment.assessorName,
        scopeNotes: assessment.scopeNotes,
        frameworkId: assessment.frameworkId,
        status: assessment.status,
      },
      controls,
    };

    const safeClient = assessment.clientName
      .replace(/[^\w\-]+/g, "-")
      .replace(/-+/g, "-");
    const filename = `Reportly-${safeClient}-${assessment.assessmentDate}.reportly`;
    const body = JSON.stringify(payload, null, 2);

    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/octet-stream; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Backup export failed" },
      { status: 500 }
    );
  }
}

