import { ALL_CONTROLS } from "@/lib/controls/catalog";
import type { AssessmentControlState } from "@/lib/types";

/** Pre-2025 ops controls that were split into sub-controls (e.g. ops-1 → ops-1a/ops-1b). */
const OPS_LEGACY_SPLIT: Record<string, string[]> = {
  "ops-1": ["ops-1a", "ops-1b"],
  "ops-2": ["ops-2a", "ops-2b"],
  "ops-3": ["ops-3a", "ops-3b"],
  "ops-9": ["ops-9a", "ops-9b"],
  "ops-12": ["ops-12a", "ops-12b"],
};

function migrateLegacyOpsStates(rows: AssessmentControlState[]): AssessmentControlState[] {
  const byId = new Map(rows.map((r) => [r.controlId, r]));
  for (const [legacyId, targetIds] of Object.entries(OPS_LEGACY_SPLIT)) {
    const legacy = byId.get(legacyId);
    if (!legacy) continue;
    for (const targetId of targetIds) {
      if (!byId.has(targetId)) {
        byId.set(targetId, { ...legacy, controlId: targetId });
      }
    }
    byId.delete(legacyId);
  }
  return Array.from(byId.values());
}

export function normalizeControlStates(
  assessmentId: string,
  rows: AssessmentControlState[]
): AssessmentControlState[] {
  const migrated = migrateLegacyOpsStates(rows);
  const byId = new Map(migrated.map((r) => [r.controlId, r]));
  const now = new Date().toISOString();

  return ALL_CONTROLS.map((c) => {
    const existing = byId.get(c.id);
    if (existing) return existing;
    return {
      assessmentId,
      controlId: c.id,
      outcome: null,
      notInPlaceReason: "",
      assessorNotes: "",
      correctiveAction: "",
      evidenceNotes: "",
      updatedAt: now,
    };
  });
}
