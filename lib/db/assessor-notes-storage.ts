import { isSupabaseConfigured } from "@/lib/db/env";

/**
 * Supabase projects created before assessor_notes may not have that column
 * (or PostgREST schema cache has not refreshed). Until migrated, we store
 * internal assessor notes in evidence_notes — that field is not shown in the UI
 * or exported to PDF/DOCX.
 */
export function readAssessorNotes(row: {
  assessor_notes?: string | null;
  evidence_notes?: string | null;
}): string {
  if (isSupabaseConfigured()) {
    return row.evidence_notes ?? "";
  }
  return row.assessor_notes ?? row.evidence_notes ?? "";
}

export function assessorNotesPatch(
  assessorNotes: string | undefined
): Record<string, string> {
  if (assessorNotes === undefined) return {};
  if (isSupabaseConfigured()) {
    return { evidence_notes: assessorNotes };
  }
  return { assessor_notes: assessorNotes };
}

export function defaultAssessorNotesInsert(): Record<string, string> {
  if (isSupabaseConfigured()) {
    return { evidence_notes: "" };
  }
  return { assessor_notes: "" };
}
