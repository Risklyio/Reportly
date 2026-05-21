import { ALL_CONTROLS } from "@/lib/controls/catalog";
import type { AssessmentControlState } from "@/lib/types";

export function normalizeControlStates(
  assessmentId: string,
  rows: AssessmentControlState[]
): AssessmentControlState[] {
  const byId = new Map(rows.map((r) => [r.controlId, r]));
  const now = new Date().toISOString();

  return ALL_CONTROLS.map((c) => {
    const existing = byId.get(c.id);
    if (existing) return existing;
    return {
      assessmentId,
      controlId: c.id,
      outcome: null,
      notInPlaceReason: "",
      correctiveAction: "",
      evidenceNotes: "",
      updatedAt: now,
    };
  });
}
