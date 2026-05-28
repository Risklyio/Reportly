import type { ControlDefinition, DomainId } from "@/lib/types";
import { applicationControls } from "./application-controls";
import { operationalControls } from "./operational-controls";
import { ceplusControls } from "./ceplus-controls";

const DATA_BASE =
  "https://learn.microsoft.com/en-us/microsoft-365-app-certification/docs/seg2_data";

export const M365_FRAMEWORK_ID = "m365-app-compliance";
export const CEPLUS_FRAMEWORK_ID = "ncsc-cyber-essentials-plus-v3-2";

export function formatControlRef(c: ControlDefinition): string {
  return c.subId ? `${c.number}${c.subId}` : String(c.number);
}

export function compareControls(
  a: ControlDefinition,
  b: ControlDefinition
): number {
  const sa = a.sortOrder ?? a.number * 10;
  const sb = b.sortOrder ?? b.number * 10;
  return sa - sb || a.id.localeCompare(b.id);
}

function data(
  n: number,
  section: string,
  title: string,
  hardFail = false,
  extra: Partial<ControlDefinition> = {}
): ControlDefinition {
  return {
    id: extra.id ?? `data-${n}`,
    domain: "data_handling",
    number: n,
    title,
    section,
    hardFail,
    intent: extra.intent ?? title,
    evidenceRequirements: extra.evidenceRequirements ?? [
      "Provide evidence per data handling, security, and privacy sample guide.",
    ],
    docUrl: `${DATA_BASE}#control-no-${n}`,
    defaultNotInPlaceReasons: extra.defaultNotInPlaceReasons ?? [
      "Encryption or privacy requirement not met",
      "Policy not published or not followed",
      "Technical evidence missing for public endpoints or data stores",
    ],
    correctiveActionHints: extra.correctiveActionHints ?? [
      "Align configuration with Microsoft encryption and TLS profile requirements.",
      "Update privacy documentation and operational procedures.",
    ],
  };
}

const dataControls: ControlDefinition[] = [
  data(1, "Data in Transit", "TLS 1.2+ and certificate inventory", true, {
    defaultNotInPlaceReasons: ["TLS below 1.2 enabled", "Certificate inventory missing"],
    correctiveActionHints: [
      "Run Qualys SSL Server Test on all public endpoints.",
      "Maintain trusted key and certificate inventory in Key Vault or equivalent.",
    ],
  }),
  data(2, "Data in Transit", "TLS compression disabled and HSTS 180+ days"),
  data(3, "Data at rest", "Encryption at rest per encryption profile", true),
  data(4, "Data retention, back-up, and disposal", "Documented data retention period"),
  data(5, "Data retention, back-up, and disposal", "Data retained only per policy"),
  data(6, "Data retention, back-up, and disposal", "Secure data disposal procedures"),
  data(7, "Data retention, back-up, and disposal", "Backup retention aligned to policy"),
  data(8, "Data access management", "Access control policy for M365 data"),
  data(9, "Data access management", "Access reviews and least privilege"),
  data(10, "Privacy", "Personal data handling and privacy notice"),
  data(11, "Privacy", "User awareness of data collection", false),
  data(12, "Privacy", "Data Processing Agreements (DPAs)"),
  data(13, "Privacy", "Data Protection Impact Assessments (DPIAs)"),
  data(14, "Privacy", "Biometric data handling"),
  data(15, "Privacy", "Data insights and secondary use"),
  data(16, "Privacy", "GDPR lawful basis and data subject rights"),
  data(17, "Privacy", "GDPR breach notification procedures", true),
  data(18, "HIPAA", "HIPAA applicability and safeguards", false),
  data(19, "HIPAA", "HIPAA business associate agreements", false),
];

export type FrameworkDefinition = {
  id: string;
  vendor: string;
  name: string;
  description: string;
  domains: {
    id: DomainId;
    label: string;
    shortLabel: string;
  }[];
  controls: ControlDefinition[];
};

const m365Domains: FrameworkDefinition["domains"] = [
  {
    id: "application_security",
    label: "Application security",
    shortLabel: "Application",
  },
  {
    id: "operational_security",
    label: "Operational security",
    shortLabel: "Operational",
  },
  {
    id: "data_handling",
    label: "Data handling, security & privacy",
    shortLabel: "Data",
  },
];

const ceplusDomains: FrameworkDefinition["domains"] = [
  {
    id: "ce_sampling",
    label: "Sampling",
    shortLabel: "Sampling",
  },
  {
    id: "ce_external_vulnerability_assessment",
    label: "External vulnerability assessment",
    shortLabel: "External VA",
  },
  {
    id: "ce_authenticated_vulnerability_assessment",
    label: "Authenticated vulnerability assessment",
    shortLabel: "Auth VA",
  },
  {
    id: "ce_malware_protection",
    label: "Malware protection",
    shortLabel: "Malware",
  },
  {
    id: "ce_multi_factor_authentication",
    label: "Multi-factor authentication",
    shortLabel: "MFA",
  },
  {
    id: "ce_account_separation",
    label: "Account separation",
    shortLabel: "Accounts",
  },
];

export const FRAMEWORKS: FrameworkDefinition[] = [
  {
    id: M365_FRAMEWORK_ID,
    vendor: "Microsoft",
    name: "M365 Application Compliance Program",
    description:
      "Microsoft 365 App Certification control set covering application, operational, and data controls.",
    domains: m365Domains,
    controls: [...applicationControls, ...operationalControls, ...dataControls],
  },
  {
    id: CEPLUS_FRAMEWORK_ID,
    vendor: "NCSC",
    name: "Cyber Essentials Plus v3.2",
    description:
      "NCSC Cyber Essentials Plus technical test specification v3.2 aligned controls.",
    domains: ceplusDomains,
    controls: [...ceplusControls],
  },
];

export const ALL_CONTROLS: ControlDefinition[] = FRAMEWORKS.flatMap(
  (f) => f.controls
);

/** Legacy alias used in older components; defaults to M365 domains. */
export const DOMAINS = m365Domains;

export function getFrameworkById(frameworkId: string): FrameworkDefinition {
  return (
    FRAMEWORKS.find((f) => f.id === frameworkId) ??
    FRAMEWORKS.find((f) => f.id === M365_FRAMEWORK_ID)!
  );
}

export function getDomainsForFramework(frameworkId: string) {
  return getFrameworkById(frameworkId).domains;
}

export function getControlsForFramework(frameworkId: string) {
  return getFrameworkById(frameworkId).controls.sort(compareControls);
}

export function getControlsByDomain(
  domain: DomainId,
  frameworkId = M365_FRAMEWORK_ID
): ControlDefinition[] {
  return getControlsForFramework(frameworkId).filter((c) => c.domain === domain);
}

export function getControlById(id: string): ControlDefinition | undefined {
  return ALL_CONTROLS.find((c) => c.id === id);
}
