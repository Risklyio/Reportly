import type { RocProcedureNote, RocProcedureNotesMap } from "@/lib/types";

export function emptyRocProcedureNotes(): RocProcedureNotesMap {
  return {};
}

export function parseRocProcedureNotes(raw: string | null | undefined): RocProcedureNotesMap {
  if (!raw || raw === "{}") return {};
  try {
    const parsed = JSON.parse(raw) as RocProcedureNotesMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function stringifyRocProcedureNotes(notes: RocProcedureNotesMap): string {
  return JSON.stringify(notes ?? {});
}

export function ensureRocProcedureNote(
  map: RocProcedureNotesMap,
  procedureRef: string,
  reportingInstructionCount: number
): RocProcedureNote {
  const existing = map[procedureRef];
  if (existing) {
    const reportingDetails = [...existing.reportingDetails];
    while (reportingDetails.length < reportingInstructionCount) {
      reportingDetails.push("");
    }
    return {
      testingNotes: existing.testingNotes ?? "",
      reportingDetails: reportingDetails.slice(0, reportingInstructionCount),
    };
  }
  return {
    testingNotes: "",
    reportingDetails: Array.from({ length: reportingInstructionCount }, () => ""),
  };
}
