import { ALL_CONTROLS } from "@/lib/controls/catalog";
import { controlRows } from "@/lib/db/seed-data";
import { assertDatabaseReady, isSupabaseConfigured } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** Upsert framework control definitions so assessment_controls FKs stay valid. */
export async function syncCatalogControls(): Promise<void> {
  await assertDatabaseReady();

  const rows = controlRows();

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    const batchSize = 25;
    for (let i = 0; i < rows.length; i += batchSize) {
      const { error } = await sb
        .from("controls")
        .upsert(rows.slice(i, i + batchSize), { onConflict: "id" });
      if (error) throw new Error(`Sync controls failed: ${error.message}`);
    }
    return;
  }

  const { getSqliteDb } = await import("@/lib/db/sqlite");
  const { controls } = await import("@/lib/db/schema");
  const db = await getSqliteDb();

  for (const c of rows) {
    db.insert(controls)
      .values({
        id: c.id,
        domainId: c.domain_id,
        number: c.number,
        title: c.title,
        section: c.section,
        hardFail: c.hard_fail,
        intent: c.intent,
        evidenceRequirements: c.evidence_requirements,
        docUrl: c.doc_url,
        defaultNotInPlaceReasons: c.default_not_in_place_reasons,
        correctiveActionHints: c.corrective_action_hints,
      })
      .onConflictDoUpdate({
        target: controls.id,
        set: {
          domainId: c.domain_id,
          number: c.number,
          title: c.title,
          section: c.section,
          hardFail: c.hard_fail,
          intent: c.intent,
          evidenceRequirements: c.evidence_requirements,
          docUrl: c.doc_url,
          defaultNotInPlaceReasons: c.default_not_in_place_reasons,
          correctiveActionHints: c.corrective_action_hints,
        },
      })
      .run();
  }
}

export async function ensureAssessmentControlRows(
  assessmentId: string,
  existingIds: Set<string>
): Promise<void> {
  const missing = ALL_CONTROLS.filter((c) => !existingIds.has(c.id));
  if (missing.length === 0) return;

  const ts = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    const inserts = missing.map((c) => ({
      assessment_id: assessmentId,
      control_id: c.id,
      outcome: null,
      not_in_place_reason: "",
      corrective_action: "",
      evidence_notes: "",
      updated_at: ts,
    }));
    for (let i = 0; i < inserts.length; i += 50) {
      const { error } = await sb
        .from("assessment_controls")
        .upsert(inserts.slice(i, i + 50), {
          onConflict: "assessment_id,control_id",
          ignoreDuplicates: true,
        });
      if (error) throw new Error(`Ensure control rows failed: ${error.message}`);
    }
    return;
  }

  const { getSqliteDb } = await import("@/lib/db/sqlite");
  const { assessmentControls } = await import("@/lib/db/schema");
  const db = await getSqliteDb();
  for (const c of missing) {
    db.insert(assessmentControls)
      .values({
        assessmentId,
        controlId: c.id,
        outcome: null,
        notInPlaceReason: "",
        correctiveAction: "",
        evidenceNotes: "",
        updatedAt: ts,
      })
      .onConflictDoNothing()
      .run();
  }
}
