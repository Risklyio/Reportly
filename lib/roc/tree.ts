import {
  formatControlRef,
  getControlsForFramework,
  getDomainsForFramework,
} from "@/lib/controls/catalog";
import type { ControlDefinition } from "@/lib/types";

export type RocTreeControlNode = {
  type: "control";
  controlId: string;
  requirementRef: string;
  label: string;
};

export type RocTreeDomainNode = {
  type: "domain";
  domainId: string;
  label: string;
  shortLabel: string;
  children: RocTreeControlNode[];
};

export function buildRocRequirementTree(
  frameworkId: string
): RocTreeDomainNode[] {
  const domains = getDomainsForFramework(frameworkId);
  const controls = getControlsForFramework(frameworkId);

  return domains.map((d) => ({
    type: "domain" as const,
    domainId: d.id,
    label: d.label,
    shortLabel: d.shortLabel,
    children: controls
      .filter((c) => c.domain === d.id)
      .map((c) => ({
        type: "control" as const,
        controlId: c.id,
        requirementRef: c.requirementRef ?? formatControlRef(c),
        label: c.title,
      })),
  }));
}

export function findRocControlByRef(
  controls: ControlDefinition[],
  ref: string | null
): ControlDefinition | undefined {
  if (!ref) return undefined;
  return controls.find(
    (c) => (c.requirementRef ?? formatControlRef(c)) === ref
  );
}

export function getDefaultRocRef(frameworkId: string): string | null {
  const tree = buildRocRequirementTree(frameworkId);
  for (const domain of tree) {
    const first = domain.children[0];
    if (first) return first.requirementRef;
  }
  return null;
}
