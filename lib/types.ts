export type DomainId = string;

export type ControlOutcome =
  | "in_place"
  | "not_in_place"
  | "partially_in_place"
  | "not_applicable"
  | "not_tested"
  | "in_place_compensating"
  | "customized_approach"
  | "pending"
  | null;

/** Which outcome buttons and fields a framework uses in the assessment UI. */
export type OutcomeProfile = "microsoft" | "pci" | "roc";

/** ROC Part II testing procedure row (e.g. 1.2.4.a). */
export interface RocTestingProcedure {
  ref: string;
  procedure: string;
  reportingInstructions: string[];
}

/** Per-procedure assessor notes stored on assessment control state. */
export interface RocProcedureNote {
  testingNotes: string;
  reportingDetails: string[];
}

export type RocProcedureNotesMap = Record<string, RocProcedureNote>;

export interface ControlDefinition {
  id: string;
  domain: DomainId;
  number: number;
  /** Sub-control label within a theme, e.g. "A" for control 1A */
  subId?: string;
  /** Sort key (defaults to number × 10 + sub-letter offset) */
  sortOrder?: number;
  title: string;
  section: string;
  hardFail: boolean;
  intent: string;
  /** PCI SAQ expected testing methods — shown as assessor guidance in the UI. */
  expectedTesting?: string[];
  /** Full PCI DSS requirement reference for ROC (e.g. 1.2.4, A1.1.2). */
  requirementRef?: string;
  /** ROC Part II testing procedures with reporting instructions. */
  rocTestingProcedures?: RocTestingProcedure[];
  evidenceRequirements: string[];
  docUrl: string;
  defaultNotInPlaceReasons: string[];
  correctiveActionHints: string[];
}

export interface AssessmentMetadata {
  id: string;
  clientName: string;
  appName: string;
  assessmentDate: string;
  dueDate: string;
  assessorName: string;
  scopeNotes: string;
  frameworkId: string;
  status: "draft" | "in_progress" | "complete";
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentListItem extends AssessmentMetadata {
  reviewedCount: number;
  totalControls: number;
  progressPercent: number;
  /** True when every control has an outcome (not “Not reviewed”) */
  isFullyReviewed: boolean;
}

export interface AssessmentControlState {
  assessmentId: string;
  controlId: string;
  outcome: ControlOutcome;
  notInPlaceReason: string;
  /** Internal working notes; can be included in report exports when enabled */
  assessorNotes: string;
  correctiveAction: string;
  evidenceNotes: string;
  /**
   * PCI SAQ-A only:
   * Per expected-testing item checkboxes for tracking assessor completion.
   * Stored as arrays aligned by index to the control definition's expectedTesting list.
   */
  pciExpectedTestingDone: boolean[];
  /**
   * PCI SAQ-A only:
   * Per expected-testing item notes (free text), aligned by index to the control definition's expectedTesting list.
   */
  pciExpectedTestingComments: string[];
  /** ROC: JSON map of procedure ref → testing notes and Section 6 evidence refs. */
  rocProcedureNotes: RocProcedureNotesMap;
  updatedAt: string;
}

export interface CorrectiveOverride {
  id: string;
  controlId: string;
  reasonCode: string;
  actionText: string;
  links: string[];
}
