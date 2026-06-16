import type { ControlOutcome } from "@/lib/types";

/** Checkbox column order on the official ROC template. */
export const ROC_OUTCOME_COLUMN: Partial<Record<NonNullable<ControlOutcome>, number>> =
  {
    in_place: 0,
    not_applicable: 1,
    not_tested: 2,
    not_in_place: 3,
    in_place_compensating: 4,
    customized_approach: 5,
  };

export type RocPdfFieldEntry = {
  requirementRef: string;
  page: number;
  /** X centers for the six assessment-finding checkboxes on that row. */
  checkboxes: number[];
  /** Where to write “Describe why the assessment finding was selected”. */
  rationale: { x: number; y: number; maxWidth: number; maxLines?: number };
};

export type RocPdfFieldMap = {
  version: string;
  template: string;
  generatedAt: string;
  pageHeight: number;
  entries: RocPdfFieldEntry[];
};
