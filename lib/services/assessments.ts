import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/lib/db";
import {
  assessments,
  assessmentControls,
  controls,
} from "@/lib/db/schema";
import { ALL_CONTROLS } from "@/lib/controls/catalog";
import type { AssessmentMetadata, AssessmentControlState, ControlOutcome } from "@/lib/types";

const FRAMEWORK_ID = "m365-app-compliance";

function now() {
  return new Date().toISOString();
}

export function listAssessments(): AssessmentMetadata[] {
  const db = getDb();
  const rows = db
    .select()
    .from(assessments)
    .orderBy(desc(assessments.updatedAt))
    .all();
  return rows.map(mapAssessment);
}

export function getAssessment(id: string): AssessmentMetadata | null {
  const db = getDb();
  const row = db.select().from(assessments).where(eq(assessments.id, id)).get();
  return row ? mapAssessment(row) : null;
}

function mapAssessment(row: typeof assessments.$inferSelect): AssessmentMetadata {
  return {
    id: row.id,
    clientName: row.clientName,
    appName: row.appName,
    assessmentDate: row.assessmentDate,
    assessorName: row.assessorName,
    scopeNotes: row.scopeNotes,
    frameworkId: row.frameworkId,
    status: row.status as AssessmentMetadata["status"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createAssessment(input: {
  clientName: string;
  appName: string;
  assessmentDate: string;
  assessorName?: string;
  scopeNotes?: string;
}): AssessmentMetadata {
  const db = getDb();
  const id = uuidv4();
  const ts = now();
  db.insert(assessments)
    .values({
      id,
      frameworkId: FRAMEWORK_ID,
      clientName: input.clientName,
      appName: input.appName,
      assessmentDate: input.assessmentDate,
      assessorName: input.assessorName ?? "",
      scopeNotes: input.scopeNotes ?? "",
      status: "draft",
      createdAt: ts,
      updatedAt: ts,
    })
    .run();

  const ts2 = now();
  for (const c of ALL_CONTROLS) {
    db.insert(assessmentControls)
      .values({
        assessmentId: id,
        controlId: c.id,
        outcome: null,
        notInPlaceReason: "",
        correctiveAction: "",
        evidenceNotes: "",
        updatedAt: ts2,
      })
      .run();
  }

  return getAssessment(id)!;
}

export function updateAssessment(
  id: string,
  patch: Partial<{
    clientName: string;
    appName: string;
    assessmentDate: string;
    assessorName: string;
    scopeNotes: string;
    status: AssessmentMetadata["status"];
  }>
): AssessmentMetadata | null {
  const db = getDb();
  const existing = getAssessment(id);
  if (!existing) return null;
  db.update(assessments)
    .set({ ...patch, updatedAt: now() })
    .where(eq(assessments.id, id))
    .run();
  return getAssessment(id);
}

export function getAssessmentControlStates(
  assessmentId: string
): AssessmentControlState[] {
  const db = getDb();
  const rows = db
    .select()
    .from(assessmentControls)
    .where(eq(assessmentControls.assessmentId, assessmentId))
    .all();
  return rows.map((r) => ({
    assessmentId: r.assessmentId,
    controlId: r.controlId,
    outcome: r.outcome as ControlOutcome,
    notInPlaceReason: r.notInPlaceReason,
    correctiveAction: r.correctiveAction,
    evidenceNotes: r.evidenceNotes,
    updatedAt: r.updatedAt,
  }));
}

export function updateAssessmentControl(
  assessmentId: string,
  controlId: string,
  patch: Partial<{
    outcome: ControlOutcome;
    notInPlaceReason: string;
    correctiveAction: string;
    evidenceNotes: string;
  }>
): void {
  const db = getDb();
  db.update(assessmentControls)
    .set({ ...patch, updatedAt: now() })
    .where(
      and(
        eq(assessmentControls.assessmentId, assessmentId),
        eq(assessmentControls.controlId, controlId)
      )
    )
    .run();
}

export function deleteAssessment(id: string): void {
  const db = getDb();
  db.delete(assessmentControls)
    .where(eq(assessmentControls.assessmentId, id))
    .run();
  db.delete(assessments).where(eq(assessments.id, id)).run();
}

export function getControlsFromDb() {
  const db = getDb();
  return db.select().from(controls).all();
}
