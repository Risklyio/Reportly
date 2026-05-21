import { ALL_CONTROLS, DOMAINS } from "@/lib/controls/catalog";

export const FRAMEWORK_ID = "m365-app-compliance";

export function frameworkRow() {
  return {
    id: FRAMEWORK_ID,
    name: "M365 Application Compliance Program",
    description:
      "Microsoft 365 App Certification sample evidence guide.",
  };
}

export function domainRows() {
  return DOMAINS.map((d, i) => ({
    id: d.id,
    framework_id: FRAMEWORK_ID,
    label: d.label,
    short_label: d.shortLabel,
    sort_order: i,
  }));
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
