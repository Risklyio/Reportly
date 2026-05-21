export type DomainId =
  | "application_security"
  | "operational_security"
  | "data_handling";

export type ControlOutcome =
  | "in_place"
  | "not_in_place"
  | "partially_in_place"
  | "not_applicable"
  | null;

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
  assessorName: string;
  scopeNotes: string;
  frameworkId: string;
  status: "draft" | "in_progress" | "complete";
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentControlState {
  assessmentId: string;
  controlId: string;
  outcome: ControlOutcome;
  notInPlaceReason: string;
  /** Internal working notes; not included in PDF/DOCX exports */
  assessorNotes: string;
  correctiveAction: string;
  evidenceNotes: string;
  updatedAt: string;
}

export interface CorrectiveOverride {
  id: string;
  controlId: string;
  reasonCode: string;
  actionText: string;
  links: string[];
}
