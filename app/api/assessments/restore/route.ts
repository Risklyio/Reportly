import { NextResponse } from "next/server";
import {
  createAssessment,
  listAssessments,
  updateAssessment,
  updateAssessmentControl,
} from "@/lib/services/assessments";

type RestorePayload = {
  version: number;
  assessment: {
    clientName: string;
    appName: string;
    assessmentDate: string;
    dueDate?: string;
    assessorName?: string;
    scopeNotes?: string;
    frameworkId?: string;
    status?: "draft" | "in_progress" | "complete";
  };
  controls?: Array<{
    controlId: string;
    outcome:
      | "in_place"
      | "not_in_place"
      | "partially_in_place"
      | "not_applicable"
      | "not_tested"
      | "in_place_compensating"
      | "pending"
      | null;
    notInPlaceReason?: string;
    assessorNotes?: string;
    correctiveAction?: string;
    evidenceNotes?: string;
    pciExpectedTestingDone?: boolean[];
    pciExpectedTestingComments?: string[];
  }>;
};

function nextRestoredName(baseName: string, existingNames: string[]): string {
  const normalized = baseName.trim() || "Restored assessment";
  if (!existingNames.includes(normalized)) return `${normalized} (1)`;
  let n = 1;
  while (existingNames.includes(`${normalized} (${n})`)) n += 1;
  return `${normalized} (${n})`;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Backup file is required" }, { status: 400 });
    }

    const text = await file.text();
    let payload: RestorePayload;
    try {
      payload = JSON.parse(text) as RestorePayload;
    } catch {
      return NextResponse.json({ error: "Invalid backup file format" }, { status: 400 });
    }

    if (!payload?.assessment?.clientName || !payload?.assessment?.assessmentDate) {
      return NextResponse.json(
        { error: "Backup is missing required assessment fields" },
        { status: 400 }
      );
    }

    const existing = await listAssessments();
    const restoredClientName = nextRestoredName(
      payload.assessment.clientName,
      existing.map((a) => a.clientName)
    );

    const created = await createAssessment({
      clientName: restoredClientName,
      appName: payload.assessment.appName ?? "",
      assessmentDate: payload.assessment.assessmentDate,
      dueDate: payload.assessment.dueDate ?? "",
      assessorName: payload.assessment.assessorName ?? "",
      scopeNotes: payload.assessment.scopeNotes ?? "",
      frameworkId: payload.assessment.frameworkId,
    });

    for (const row of payload.controls ?? []) {
      await updateAssessmentControl(created.id, row.controlId, {
        outcome: row.outcome,
        notInPlaceReason: row.notInPlaceReason ?? "",
        assessorNotes: row.assessorNotes ?? "",
        correctiveAction: row.correctiveAction ?? "",
        evidenceNotes: row.evidenceNotes ?? "",
        pciExpectedTestingDone: row.pciExpectedTestingDone ?? [],
        pciExpectedTestingComments: row.pciExpectedTestingComments ?? [],
      });
    }

    if (payload.assessment.status) {
      await updateAssessment(created.id, { status: payload.assessment.status });
    }

    return NextResponse.json({
      ok: true,
      assessmentId: created.id,
      clientName: restoredClientName,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Restore failed" },
      { status: 500 }
    );
  }
}

