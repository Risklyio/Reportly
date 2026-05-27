import {
  ALL_CONTROLS,
  FRAMEWORKS,
  M365_FRAMEWORK_ID,
} from "@/lib/controls/catalog";

export const FRAMEWORK_ID = M365_FRAMEWORK_ID;

export function frameworkRow() {
  const primary = FRAMEWORKS.find((f) => f.id === FRAMEWORK_ID)!;
  return {
    id: primary.id,
    name: primary.name,
    description: primary.description,
  };
}

export function frameworkRows() {
  return FRAMEWORKS.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
  }));
}

export function domainRows() {
  return FRAMEWORKS.flatMap((framework) =>
    framework.domains.map((d, i) => ({
      id: d.id,
      framework_id: framework.id,
      label: d.label,
      short_label: d.shortLabel,
      sort_order: i,
    }))
  );
}

export function controlRows() {
  return ALL_CONTROLS.map((c) => ({
    id: c.id,
    domain_id: c.domain,
    number: c.number,
    title: c.title,
    section: c.section,
    hard_fail: c.hardFail,
    intent: c.intent,
    evidence_requirements: JSON.stringify(c.evidenceRequirements),
    doc_url: c.docUrl,
    default_not_in_place_reasons: JSON.stringify(c.defaultNotInPlaceReasons),
    corrective_action_hints: JSON.stringify(c.correctiveActionHints),
  }));
}
