import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getControlsForFramework } from "@/lib/controls/catalog";
import {
  getPentestControlIds,
  PENTEST_LEAD_CONTROL_ID,
  PENTEST_PENDING_CORRECTIVE_APP1,
  PENTEST_PENDING_CORRECTIVE_OTHER,
} from "@/lib/controls/pentest";
import type {
  AssessmentMetadata,
  AssessmentListItem,
  AssessmentControlState,
  ControlOutcome,
} from "@/lib/types";
import { assertDatabaseReady, isSupabaseConfigured } from "@/lib/db";
import {
  assessorNotesPatch,
  readAssessorNotes,
} from "@/lib/db/assessor-notes-storage";
import {
  ensureAssessmentControlRows,
  syncCatalogControls,
} from "@/lib/db/sync-catalog";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { FRAMEWORK_ID } from "@/lib/db/seed-data";
import { ensureDueDateColumn } from "@/lib/db/migrate-supabase";

function now() {
  return new Date().toISOString();
}

function mapAssessmentRow(row: {
  id: string;
  framework_id?: string;
  frameworkId?: string;
  client_name?: string;
  clientName?: string;
  app_name?: string;
  appName?: string;
  assessment_date?: string;
  assessmentDate?: string;
  due_date?: string;
  dueDate?: string;
  assessor_name?: string;
  assessorName?: string;
  scope_notes?: string;
  scopeNotes?: string;
  status: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}): AssessmentMetadata {
  return {
    id: row.id,
    clientName: row.client_name ?? row.clientName ?? "",
    appName: row.app_name ?? row.appName ?? "",
    assessmentDate: row.assessment_date ?? row.assessmentDate ?? "",
    dueDate: row.due_date ?? row.dueDate ?? "",
    assessorName: row.assessor_name ?? row.assessorName ?? "",
    scopeNotes: row.scope_notes ?? row.scopeNotes ?? "",
    frameworkId: row.framework_id ?? row.frameworkId ?? FRAMEWORK_ID,
    status: row.status as AssessmentMetadata["status"],
    createdAt: row.created_at ?? row.createdAt ?? "",
    updatedAt: row.updated_at ?? row.updatedAt ?? "",
  };
}

function isReviewedOutcome(outcome: string | null | undefined): boolean {
  return outcome != null && outcome !== "";
}

async function countReviewedControlsByAssessment(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("assessment_controls")
      .select("assessment_id, outcome");
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      if (!isReviewedOutcome(row.outcome)) continue;
      const id = row.assessment_id as string;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }

  const { getSqliteDb } = await import("@/lib/db/sqlite");
  const { assessmentControls } = await import("@/lib/db/schema");
  const rows = (await getSqliteDb()).select().from(assessmentControls).all();
  for (const row of rows) {
    if (!isReviewedOutcome(row.outcome)) continue;
    counts.set(row.assessmentId, (counts.get(row.assessmentId) ?? 0) + 1);
  }
  return counts;
}

export async function listAssessmentsWithProgress(): Promise<AssessmentListItem[]> {
  const assessments = await listAssessments();
  const reviewedByAssessment = await countReviewedControlsByAssessment();

  return assessments.map((a) => {
    const totalControls = getControlsForFramework(a.frameworkId).filter(
      (c) => c.domain !== "ce_sampling"
    ).length;
    const reviewedCount = Math.min(reviewedByAssessment.get(a.id) ?? 0, totalControls);
    const progressPercent = totalControls
      ? Math.round((reviewedCount / totalControls) * 100)
      : 0;
    const isFullyReviewed = reviewedCount >= totalControls;
    return {
      ...a,
      reviewedCount,
      totalControls,
      progressPercent,
      isFullyReviewed,
    };
  });
}

export async function listAssessments(): Promise<AssessmentMetadata[]> {
  await assertDatabaseReady();
  await ensureDueDateColumn();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("assessments")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapAssessmentRow);
  }
  const { getSqliteDb } = await import("@/lib/db/sqlite");
  const { assessments } = await import("@/lib/db/schema");
  const rows = (await getSqliteDb())
    .select()
    .from(assessments)
    .orderBy(desc(assessments.updatedAt))
    .all();
  return rows.map((r) =>
    mapAssessmentRow({
      id: r.id,
      frameworkId: r.frameworkId,
      clientName: r.clientName,
      appName: r.appName,
      assessmentDate: r.assessmentDate,
      dueDate: r.dueDate,
      assessorName: r.assessorName,
      scopeNotes: r.scopeNotes,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })
  );
}

export async function getAssessment(
  id: string
): Promise<AssessmentMetadata | null> {
  await assertDatabaseReady();
  await ensureDueDateColumn();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("assessments")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapAssessmentRow(data) : null;
  }
  const { getSqliteDb } = await import("@/lib/db/sqlite");
  const { assessments } = await import("@/lib/db/schema");
  const row = (await getSqliteDb())
    .select()
    .from(assessments)
    .where(eq(assessments.id, id))
    .get();
  return row
    ? mapAssessmentRow({
        id: row.id,
        frameworkId: row.frameworkId,
        clientName: row.clientName,
        appName: row.appName,
        assessmentDate: row.assessmentDate,
        dueDate: row.dueDate,
        assessorName: row.assessorName,
        scopeNotes: row.scopeNotes,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
    : null;
}

export async function createAssessment(input: {
  clientName: string;
  appName: string;
  assessmentDate: string;
  dueDate?: string;
  assessorName?: string;
  scopeNotes?: string;
  frameworkId?: string;
}): Promise<AssessmentMetadata> {
  await assertDatabaseReady();
  await ensureDueDateColumn();
  const id = uuidv4();
  const ts = now();

  const frameworkId = input.frameworkId ?? FRAMEWORK_ID;
  const frameworkControls = getControlsForFramework(frameworkId);

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    const { error: aErr } = await sb.from("assessments").insert({
      id,
      framework_id: frameworkId,
      client_name: input.clientName,
      app_name: input.appName,
      assessment_date: input.assessmentDate,
      due_date: input.dueDate ?? "",
      assessor_name: input.assessorName ?? "",
      scope_notes: input.scopeNotes ?? "",
      status: "draft",
      created_at: ts,
      updated_at: ts,
    });
    if (aErr) throw new Error(aErr.message);

    const controlRows = frameworkControls.map((c) => ({
      assessment_id: id,
      control_id: c.id,
      outcome: null,
      not_in_place_reason: "",
      corrective_action: "",
      evidence_notes: "",
      updated_at: ts,
    }));
    for (let i = 0; i < controlRows.length; i += 50) {
      const { error } = await sb
        .from("assessment_controls")
        .insert(controlRows.slice(i, i + 50));
      if (error) throw new Error(error.message);
    }
    return (await getAssessment(id))!;
  }

  const { getSqliteDb } = await import("@/lib/db/sqlite");
  const { assessments, assessmentControls } = await import("@/lib/db/schema");
  const db = await getSqliteDb();
  db.insert(assessments)
    .values({
      id,
      frameworkId,
      clientName: input.clientName,
      appName: input.appName,
      assessmentDate: input.assessmentDate,
      dueDate: input.dueDate ?? "",
      assessorName: input.assessorName ?? "",
      scopeNotes: input.scopeNotes ?? "",
      status: "draft",
      createdAt: ts,
      updatedAt: ts,
    })
    .run();
  const ts2 = now();
  for (const c of frameworkControls) {
    db.insert(assessmentControls)
      .values({
        assessmentId: id,
        controlId: c.id,
        outcome: null,
        notInPlaceReason: "",
        assessorNotes: "",
        correctiveAction: "",
        evidenceNotes: "",
        updatedAt: ts2,
      })
      .run();
  }
  return (await getAssessment(id))!;
}

export async function updateAssessment(
  id: string,
  patch: Partial<{
    clientName: string;
    appName: string;
    assessmentDate: string;
    dueDate: string;
    assessorName: string;
    scopeNotes: string;
    status: AssessmentMetadata["status"];
  }>
): Promise<AssessmentMetadata | null> {
  await assertDatabaseReady();
  await ensureDueDateColumn();
  const existing = await getAssessment(id);
  if (!existing) return null;

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    const row: Record<string, string> = { updated_at: now() };
    if (patch.clientName !== undefined) row.client_name = patch.clientName;
    if (patch.appName !== undefined) row.app_name = patch.appName;
    if (patch.assessmentDate !== undefined)
      row.assessment_date = patch.assessmentDate;
    if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
    if (patch.assessorName !== undefined) row.assessor_name = patch.assessorName;
    if (patch.scopeNotes !== undefined) row.scope_notes = patch.scopeNotes;
    if (patch.status !== undefined) row.status = patch.status;
    const { error } = await sb.from("assessments").update(row).eq("id", id);
    if (error) throw new Error(error.message);
    return getAssessment(id);
  }

  const { getSqliteDb } = await import("@/lib/db/sqlite");
  const { assessments } = await import("@/lib/db/schema");
  (await getSqliteDb())
    .update(assessments)
    .set({ ...patch, updatedAt: now() })
    .where(eq(assessments.id, id))
    .run();
  return getAssessment(id);
}

export async function getAssessmentControlStates(
  assessmentId: string
): Promise<AssessmentControlState[]> {
  await assertDatabaseReady();
  await syncCatalogControls();
  const assessment = await getAssessment(assessmentId);
  const frameworkControls = getControlsForFramework(
    assessment?.frameworkId ?? FRAMEWORK_ID
  );

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("assessment_controls")
      .select("*")
      .eq("assessment_id", assessmentId);
    if (error) throw new Error(error.message);
    const mapped = (data ?? []).map((r) => ({
      assessmentId: r.assessment_id,
      controlId: r.control_id,
      outcome: r.outcome as ControlOutcome,
      notInPlaceReason: r.not_in_place_reason ?? "",
      assessorNotes: readAssessorNotes(r),
      correctiveAction: r.corrective_action ?? "",
      evidenceNotes: isSupabaseConfigured() ? "" : (r.evidence_notes ?? ""),
      updatedAt: r.updated_at ?? "",
    }));
    await ensureAssessmentControlRows(
      assessmentId,
      new Set(mapped.map((r) => r.controlId)),
      frameworkControls
    );
    const { data: refreshed, error: refetchErr } = await sb
      .from("assessment_controls")
      .select("*")
      .eq("assessment_id", assessmentId);
    if (refetchErr) throw new Error(refetchErr.message);
    return (refreshed ?? []).map((r) => ({
      assessmentId: r.assessment_id,
      controlId: r.control_id,
      outcome: r.outcome as ControlOutcome,
      notInPlaceReason: r.not_in_place_reason ?? "",
      assessorNotes: readAssessorNotes(r),
      correctiveAction: r.corrective_action ?? "",
      evidenceNotes: isSupabaseConfigured() ? "" : (r.evidence_notes ?? ""),
      updatedAt: r.updated_at ?? "",
    }));
  }

  const { getSqliteDb } = await import("@/lib/db/sqlite");
  const { assessmentControls } = await import("@/lib/db/schema");
  const db = await getSqliteDb();
  let rows = db
    .select()
    .from(assessmentControls)
    .where(eq(assessmentControls.assessmentId, assessmentId))
    .all();
  await ensureAssessmentControlRows(
    assessmentId,
    new Set(rows.map((r) => r.controlId)),
    frameworkControls
  );
  rows = db
    .select()
    .from(assessmentControls)
    .where(eq(assessmentControls.assessmentId, assessmentId))
    .all();
  return rows.map((r) => ({
    assessmentId: r.assessmentId,
    controlId: r.controlId,
    outcome: r.outcome as ControlOutcome,
    notInPlaceReason: r.notInPlaceReason,
    assessorNotes: r.assessorNotes ?? "",
    correctiveAction: r.correctiveAction,
    evidenceNotes: r.evidenceNotes,
    updatedAt: r.updatedAt,
  }));
}

export async function updateAssessmentControl(
  assessmentId: string,
  controlId: string,
  patch: Partial<{
    outcome: ControlOutcome;
    notInPlaceReason: string;
    assessorNotes: string;
    correctiveAction: string;
    evidenceNotes: string;
  }>
): Promise<void> {
  await assertDatabaseReady();
  await syncCatalogControls();
  const ts = now();

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    const row: Record<string, string | null> = { updated_at: ts };
    if (patch.outcome !== undefined) row.outcome = patch.outcome;
    if (patch.notInPlaceReason !== undefined)
      row.not_in_place_reason = patch.notInPlaceReason;
    Object.assign(row, assessorNotesPatch(patch.assessorNotes));
    if (patch.correctiveAction !== undefined)
      row.corrective_action = patch.correctiveAction;
    if (patch.evidenceNotes !== undefined && !isSupabaseConfigured())
      row.evidence_notes = patch.evidenceNotes;

    const { data: existing } = await sb
      .from("assessment_controls")
      .select("control_id")
      .eq("assessment_id", assessmentId)
      .eq("control_id", controlId)
      .maybeSingle();

    if (existing) {
      const { error } = await sb
        .from("assessment_controls")
        .update(row)
        .eq("assessment_id", assessmentId)
        .eq("control_id", controlId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await sb.from("assessment_controls").insert({
        assessment_id: assessmentId,
        control_id: controlId,
        outcome: patch.outcome ?? null,
        not_in_place_reason: patch.notInPlaceReason ?? "",
        corrective_action: patch.correctiveAction ?? "",
        evidence_notes: patch.assessorNotes ?? "",
        updated_at: ts,
      });
      if (error) throw new Error(error.message);
    }
    return;
  }

  const { getSqliteDb } = await import("@/lib/db/sqlite");
  const { assessmentControls } = await import("@/lib/db/schema");
  const db = await getSqliteDb();
  const existing = db
    .select()
    .from(assessmentControls)
    .where(
      and(
        eq(assessmentControls.assessmentId, assessmentId),
        eq(assessmentControls.controlId, controlId)
      )
    )
    .get();

  if (existing) {
    db.update(assessmentControls)
      .set({ ...patch, updatedAt: ts })
      .where(
        and(
          eq(assessmentControls.assessmentId, assessmentId),
          eq(assessmentControls.controlId, controlId)
        )
      )
      .run();
  } else {
    db.insert(assessmentControls)
      .values({
        assessmentId,
        controlId,
        outcome: patch.outcome ?? null,
        notInPlaceReason: patch.notInPlaceReason ?? "",
        assessorNotes: patch.assessorNotes ?? "",
        correctiveAction: patch.correctiveAction ?? "",
        evidenceNotes: patch.evidenceNotes ?? "",
        updatedAt: ts,
      })
      .run();
  }
}

/** Mark all penetration testing controls (1–16) as Pending; control 1 gets report text. */
export async function applyPentestPendingToAssessment(
  assessmentId: string
): Promise<AssessmentControlState[]> {
  await assertDatabaseReady();
  await syncCatalogControls();
  const assessment = await getAssessment(assessmentId);
  const frameworkControls = getControlsForFramework(
    assessment?.frameworkId ?? FRAMEWORK_ID
  );
  await ensureAssessmentControlRows(
    assessmentId,
    new Set((await getAssessmentControlStates(assessmentId)).map((s) => s.controlId)),
    frameworkControls
  );

  const ids = getPentestControlIds();
  for (const controlId of ids) {
    await updateAssessmentControl(assessmentId, controlId, {
      outcome: "pending",
      correctiveAction:
        controlId === PENTEST_LEAD_CONTROL_ID
          ? PENTEST_PENDING_CORRECTIVE_APP1
          : PENTEST_PENDING_CORRECTIVE_OTHER,
    });
  }

  return getAssessmentControlStates(assessmentId);
}

export async function deleteAssessment(id: string): Promise<void> {
  await assertDatabaseReady();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    await sb.from("assessment_controls").delete().eq("assessment_id", id);
    await sb.from("assessments").delete().eq("id", id);
    return;
  }
  const { getSqliteDb } = await import("@/lib/db/sqlite");
  const { assessments, assessmentControls } = await import("@/lib/db/schema");
  const db = await getSqliteDb();
  db.delete(assessmentControls)
    .where(eq(assessmentControls.assessmentId, id))
    .run();
  db.delete(assessments).where(eq(assessments.id, id)).run();
}
