import { NextResponse } from "next/server";
import {
  getAssessment,
  getAssessmentControlStates,
} from "@/lib/services/assessments";
import {
  buildExportData,
  exportFilename,
} from "@/lib/export/report-data";
import { renderAssessmentHtml } from "@/lib/export/html-report";

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

    const states = await getAssessmentControlStates(id);
    const data = buildExportData(
      {
        clientName: assessment.clientName,
        appName: assessment.appName,
        assessmentDate: assessment.assessmentDate,
        assessorName: assessment.assessorName,
        scopeNotes: assessment.scopeNotes,
      },
      states
    );

    const html = renderAssessmentHtml(data);
    const filename = exportFilename(
      assessment.clientName,
      assessment.assessmentDate,
      "html"
    );

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "HTML export failed" },
      { status: 500 }
    );
  }
}
