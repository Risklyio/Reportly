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
import { generateExecutiveSummaryWithGroq } from "@/lib/ai/generate-corrective";
import { CEPLUS_FRAMEWORK_ID } from "@/lib/controls/catalog";

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
        frameworkId: assessment.frameworkId,
        clientName: assessment.clientName,
        appName: assessment.appName,
        assessmentDate: assessment.assessmentDate,
        assessorName: assessment.assessorName,
        scopeNotes: assessment.scopeNotes,
      },
      states
    );

    const domainFindings = data.domains
      .filter((d) => d.id !== "ce_sampling")
      .map((d) => ({
      domain: d.label,
      notInPlace: d.controls.filter((c) => c.outcome === "Not in place").length,
      partiallyInPlace: d.controls.filter((c) => c.outcome === "Partially in place").length,
      }));
    const totalFlagged = domainFindings.reduce(
      (sum, d) => sum + d.notInPlace + d.partiallyInPlace,
      0
    );

    let executiveSummary = "";
    try {
      executiveSummary = await generateExecutiveSummaryWithGroq({
        clientName: data.clientName,
        appName: data.frameworkId === CEPLUS_FRAMEWORK_ID ? undefined : data.appName,
        frameworkName: data.frameworkName,
        domainFindings,
        totalFlagged,
      });
    } catch {
      executiveSummary =
        totalFlagged > 0
          ? `This assessment identified ${totalFlagged} flagged controls across the reviewed domains. Priority should be given to controls marked as Not in place, followed by those marked as Partially in place, starting with domains showing the highest concentration of gaps.`
          : "No controls were flagged as Not in place or Partially in place in this assessment. Continue routine monitoring to maintain the current posture.";
    }

    const html = renderAssessmentHtml(data, { executiveSummary });
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
