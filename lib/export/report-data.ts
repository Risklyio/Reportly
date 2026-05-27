import {
  M365_FRAMEWORK_ID,
  getFrameworkById,
  getControlsForFramework,
  getDomainsForFramework,
  compareControls,
  formatControlRef,
} from "@/lib/controls/catalog";
import type { AssessmentControlState } from "@/lib/types";

export const OUTCOME_LABELS: Record<string, string> = {
  in_place: "In place",
  not_in_place: "Not in place",
  partially_in_place: "Partially in place",
  not_applicable: "Not applicable",
  pending: "Pending",
};

export type ExportControlRow = {
  ref: string;
  number: number;
  title: string;
  requirement: string;
  section: string;
  outcome: string;
  reason: string;
  correctiveAction: string;
  evidenceNotes: string;
  hardFail: string;
};

export type AssessmentExportData = {
  frameworkId: string;
  clientName: string;
  appName: string;
  assessmentDate: string;
  assessorName: string;
  scopeNotes: string;
  frameworkName: string;
  generatedAt: string;
  appControls: ExportControlRow[];
  opsControls: ExportControlRow[];
  dataControls: ExportControlRow[];
  domains: {
    id: string;
    label: string;
    controls: ExportControlRow[];
  }[];
  allControls: ExportControlRow[];
  summary: {
    total: number;
    reviewed: number;
    inPlace: number;
    notInPlace: number;
    partiallyInPlace: number;
    notApplicable: number;
    pending: number;
    notReviewed: number;
    hardFailTotal: number;
    hardFailGaps: number;
  };
};

function formatControlRow(
  control: ReturnType<typeof getControlsForFramework>[number],
  controlId: string,
  states: Map<string, AssessmentControlState>
): ExportControlRow {
  const s = states.get(controlId);
  return {
    ref: formatControlRef(control),
    number: control.number,
    title: control.title,
    requirement: control.intent ?? "",
    section: control.section ?? "",
    outcome: s?.outcome ? OUTCOME_LABELS[s.outcome] ?? s.outcome : "Not reviewed",
    reason: s?.notInPlaceReason ?? "",
    correctiveAction: s?.correctiveAction ?? "",
    evidenceNotes: s?.evidenceNotes ?? "",
    hardFail: control.hardFail ? "Yes" : "No",
  };
}

function computeSummary(rows: ExportControlRow[]) {
  const reviewed = rows.filter((r) => r.outcome !== "Not reviewed").length;
  return {
    total: rows.length,
    reviewed,
    inPlace: rows.filter((r) => r.outcome === "In place").length,
    notInPlace: rows.filter((r) => r.outcome === "Not in place").length,
    partiallyInPlace: rows.filter((r) => r.outcome === "Partially in place")
      .length,
    notApplicable: rows.filter((r) => r.outcome === "Not applicable").length,
    pending: rows.filter((r) => r.outcome === "Pending").length,
    notReviewed: rows.length - reviewed,
    hardFailTotal: rows.filter((r) => r.hardFail === "Yes").length,
    hardFailGaps: rows.filter(
      (r) =>
        r.hardFail === "Yes" &&
        (r.outcome === "Not in place" || r.outcome === "Partially in place")
    ).length,
  };
}

export function buildExportData(
  meta: {
    frameworkId?: string;
    clientName: string;
    appName: string;
    assessmentDate: string;
    assessorName: string;
    scopeNotes: string;
  },
  states: AssessmentControlState[]
): AssessmentExportData {
  const stateMap = new Map(states.map((s) => [s.controlId, s]));
  const frameworkId = meta.frameworkId ?? M365_FRAMEWORK_ID;
  const frameworkControls = getControlsForFramework(frameworkId);
  const frameworkDomains = getDomainsForFramework(frameworkId);

  const byDomain = (domain: string) =>
    frameworkControls.filter((c) => c.domain === domain)
      .sort(compareControls)
      .map((c) => formatControlRow(c, c.id, stateMap));

  const allControls = frameworkControls.map((c) =>
    formatControlRow(c, c.id, stateMap)
  );
  const domainRows = frameworkDomains.map((d) => ({
    id: d.id,
    label: d.label,
    controls: byDomain(d.id),
  }));

  return {
    frameworkId,
    clientName: meta.clientName,
    appName: meta.appName,
    assessmentDate: meta.assessmentDate,
    assessorName: meta.assessorName,
    scopeNotes: meta.scopeNotes,
    frameworkName: getFrameworkById(frameworkId).name,
    generatedAt: new Date().toISOString().slice(0, 10),
    appControls: byDomain("application_security"),
    opsControls: byDomain("operational_security"),
    dataControls: byDomain("data_handling"),
    domains: domainRows,
    allControls,
    summary: computeSummary(allControls),
  };
}

export function exportFilename(
  clientName: string,
  assessmentDate: string,
  ext: "docx" | "pdf" | "html"
): string {
  const safe = clientName.replace(/[^\w\-]+/g, "-").replace(/-+/g, "-");
  return `Reportly-${safe}-${assessmentDate}.${ext}`;
}

export function getDomainExportKeys(frameworkId = M365_FRAMEWORK_ID) {
  return getDomainsForFramework(frameworkId).map((d) => ({
    id: d.id,
    label: d.label,
    controls: d.id,
  }));
}
