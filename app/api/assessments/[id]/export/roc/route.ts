import { NextResponse } from "next/server";
import {
  getAssessment,
  getAssessmentControlStates,
} from "@/lib/services/assessments";
import { PCI_ROC_FRAMEWORK_ID } from "@/lib/controls/catalog";
import {
  officialRocFilename,
  renderOfficialRocPdf,
} from "@/lib/export/roc-official-pdf";

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
    if (assessment.frameworkId !== PCI_ROC_FRAMEWORK_ID) {
      return NextResponse.json(
        { error: "Official ROC export is only available for PCI DSS ROC assessments." },
        { status: 400 }
      );
    }

    const states = await getAssessmentControlStates(id);
    const pdf = await renderOfficialRocPdf({
      clientName: assessment.clientName,
      appName: assessment.appName,
      assessmentDate: assessment.assessmentDate,
      assessorName: assessment.assessorName,
      scopeNotes: assessment.scopeNotes,
      states,
    });

    const filename = officialRocFilename(
      assessment.clientName,
      assessment.assessmentDate
    );

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Official ROC export failed" },
      { status: 500 }
    );
  }
}
