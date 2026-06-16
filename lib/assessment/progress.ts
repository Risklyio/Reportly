import type { AssessmentControlState, ControlDefinition } from "@/lib/types";

export type DomainProgress = {
  domainId: string;
  label: string;
  shortLabel: string;
  total: number;
  reviewed: number;
  percent: number;
};

function stateMap(
  states: Map<string, AssessmentControlState> | AssessmentControlState[]
): Map<string, AssessmentControlState> {
  if (states instanceof Map) return states;
  return new Map(states.map((s) => [s.controlId, s]));
}

export function computeDomainProgress(
  domainId: string,
  label: string,
  shortLabel: string,
  controls: ControlDefinition[],
  states: Map<string, AssessmentControlState> | AssessmentControlState[]
): DomainProgress {
  const byControl = stateMap(states);
  const domainControls = controls.filter((c) => c.domain === domainId);
  const total = domainControls.length;
  const reviewed = domainControls.filter(
    (c) => byControl.get(c.id)?.outcome != null
  ).length;
  const percent = total ? Math.round((reviewed / total) * 100) : 0;
  return { domainId, label, shortLabel, total, reviewed, percent };
}

export function computeFrameworkProgress(
  controls: ControlDefinition[],
  states: Map<string, AssessmentControlState> | AssessmentControlState[],
  excludeDomains: string[] = ["ce_sampling"]
): { total: number; reviewed: number; percent: number } {
  const byControl = stateMap(states);
  const scoped = controls.filter((c) => !excludeDomains.includes(c.domain));
  const total = scoped.length;
  const reviewed = scoped.filter(
    (c) => byControl.get(c.id)?.outcome != null
  ).length;
  const percent = total ? Math.round((reviewed / total) * 100) : 0;
  return { total, reviewed, percent };
}
