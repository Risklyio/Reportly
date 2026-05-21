import { NextResponse } from "next/server";
import {
  getAssessment,
  getAssessmentControlStates,
} from "@/lib/services/assessments";
import {
  getDefaultTemplate,
  readTemplateBuffer,
} from "@/lib/services/templates";
import {
  buildExportData,
  renderDocx,
  ensureStarterTemplate,
} from "@/lib/export/docx";
import fs from "fs";

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

    let templateBuffer: Buffer;
    const tmpl = await getDefaultTemplate();
    if (tmpl) {
      try {
        templateBuffer = await readTemplateBuffer(tmpl);
      } catch {
        templateBuffer = fs.readFileSync(ensureStarterTemplate());
      }
    } else {
      templateBuffer = fs.readFileSync(ensureStarterTemplate());
    }

    const out = renderDocx(templateBuffer, data);
    const filename = `Reportly-${assessment.clientName.replace(/\s+/g, "-")}-${assessment.assessmentDate}.docx`;

    return new NextResponse(new Uint8Array(out), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
