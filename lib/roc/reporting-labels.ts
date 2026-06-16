export type ReportingDetailKind = "documents" | "interviews" | "generic";

export function getReportingDetailKind(
  instruction: string
): ReportingDetailKind {
  const lower = instruction.toLowerCase();
  if (/\binterview/.test(lower)) return "interviews";
  if (/\bexamin/.test(lower)) return "documents";
  return "generic";
}

export function getReportingDetailLabel(instruction: string): string {
  switch (getReportingDetailKind(instruction)) {
    case "interviews":
      return "Person(s) interviewed";
    case "documents":
      return "Documents reviewed";
    default:
      return "Section 6 evidence reference(s)";
  }
}

export function getReportingDetailPlaceholder(instruction: string): string {
  switch (getReportingDetailKind(instruction)) {
    case "interviews":
      return "e.g. Jane Doe (Security Manager), John Smith (Network Admin)";
    case "documents":
      return "e.g. Doc-1, Policy-2, Config-Standard-3";
    default:
      return "e.g. Doc-1, Int-02, Evidence-3";
  }
}
