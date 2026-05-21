import { NextResponse } from "next/server";
import {
  getAssessment,
  getAssessmentControlStates,
} from "@/lib/services/assessments";
import { buildExportData, exportFilename } from "@/lib/export/report-data";
import { renderAssessmentPdf } from "@/lib/export/pdf";

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

    const pdf = renderAssessmentPdf(data);
    const filename = exportFilename(
      assessment.clientName,
      assessment.assessmentDate,
      "pdf"
    );

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "PDF export failed" },
      { status: 500 }
    );
  }
}
