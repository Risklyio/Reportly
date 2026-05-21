import type { ControlDefinition, DomainId } from "@/lib/types";

const APP_BASE =
  "https://learn.microsoft.com/en-us/microsoft-365-app-certification/docs/seg2_app";
const OPS_BASE =
  "https://learn.microsoft.com/en-us/microsoft-365-app-certification/docs/seg2_ops";
const DATA_BASE =
  "https://learn.microsoft.com/en-us/microsoft-365-app-certification/docs/seg2_data";

function app(
  n: number,
  section: string,
  title: string,
  opts: Partial<ControlDefinition> = {}
): ControlDefinition {
  return {
    id: `app-${n}`,
    domain: "application_security",
    number: n,
    title,
    section,
    hardFail: opts.hardFail ?? false,
    intent: opts.intent ?? title,
    evidenceRequirements: opts.evidenceRequirements ?? [
      "Provide documentation and evidence per Microsoft sample evidence guide.",
    ],
    docUrl: `${APP_BASE}#control-no-${n}`,
    defaultNotInPlaceReasons: opts.defaultNotInPlaceReasons ?? [
      "Evidence not yet collected",
      "Requirement not fully implemented",
      "Pending remediation from penetration test",
    ],
    correctiveActionHints: opts.correctiveActionHints ?? [
      "Review Microsoft M365 App Certification guidance and remediate gaps.",
      "Engage a reputable third-party for validation where required.",
    ],
  };
}

function ops(
  n: number,
  section: string,
  title: string,
  hardFail = false,
  extra: Partial<ControlDefinition> = {}
): ControlDefinition {
  return {
    id: `ops-${n}`,
    domain: "operational_security",
    number: n,
    title,
    section,
    hardFail,
    intent: extra.intent ?? title,
    evidenceRequirements: extra.evidenceRequirements ?? [
      "Provide screenshots, policies, and records demonstrating control operation.",
    ],
    docUrl: `${OPS_BASE}#control-no-${n}`,
    defaultNotInPlaceReasons: extra.defaultNotInPlaceReasons ?? [
      "Policy or procedure not documented",
      "Technical control not deployed across in-scope systems",
      "Evidence incomplete for sampled components",
    ],
    correctiveActionHints: extra.correctiveActionHints ?? [
      "Document and implement required operational security control.",
      "Extend coverage to all in-scope system components.",
    ],
  };
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

const PENTEST_SECTION = "Penetration Testing";
const pentestTitles: string[] = [
  "Annual independent penetration testing (web and infrastructure)",
  "Critical/high vulnerabilities remediated within one month",
  "Full external footprint included in pentest scope",
  "Full internal networks included in pentest scope",
  "Web app testing covers OWASP Top 10 / SANS CWE classes",
  "Critical/high findings retested and marked fixed in report",
  "No unsupported operating systems or JavaScript libraries",
  "No default, enumerable, or guessable administrative accounts",
  "No SQL injection risks present",
  "No cross-site scripting vulnerabilities",
  "No directory traversal (path) vulnerabilities",
  "No HTTP smuggling, desync, or header-splitting vulnerabilities",
  "No source code disclosure or local file inclusion",
  "No unpatched critical/high CVSS vulnerabilities",
  "No readily exploitable vulnerability affecting EUII/OUI at scale",
  "Penetration test report demonstrates all stated requirements",
];

const applicationControls: ControlDefinition[] = [
  ...pentestTitles.map((title, i) =>
    app(i + 1, PENTEST_SECTION, title, {
      hardFail: i >= 6,
      docUrl: `${APP_BASE}#penetration-testing`,
      defaultNotInPlaceReasons: [
        "Finding identified in latest penetration test",
        "Annual penetration test not performed",
        "Scope did not include all in-scope endpoints",
      ],
      correctiveActionHints: [
        "Remediate findings and obtain retest confirmation from the testing firm.",
        "Schedule annual third-party penetration testing covering full footprint.",
      ],
    })
  ),
  app(17, "Graph API Checks", "Graph API permissions and least privilege", {
    intent:
      "Document all Microsoft Graph API permissions, types, endpoints, and business justification.",
    defaultNotInPlaceReasons: [
      "Permission inventory incomplete",
      "Application permissions lack business justification",
      "Credential storage not documented",
    ],
  }),
  app(18, "Responsible AI", "AI technology integration documentation", {
    intent: "Describe AI technology, Copilot agents, or CEA RAI assessment.",
  }),
  app(19, "Responsible AI", "AI functionality scope and user consent", {
    intent: "Document AI features, autonomous actions, and consent process.",
  }),
  app(20, "Responsible AI", "AI data management and privacy implications", {
    intent: "Document data flows and privacy regulation implications for AI.",
  }),
  app(21, "Responsible AI", "Notification of AI use to users", {
    intent: "Transparency on where and how AI is used in the application.",
  }),
  app(22, "Responsible AI", "AI governance and accountability framework", {
    intent: "Establish governance for AI integration and accountability.",
  }),
  app(23, "Responsible AI", "User control over AI integration", {
    intent: "Users can control or disable AI functionality.",
  }),
  app(24, "Responsible AI -- SaaS", "Policies prohibiting inappropriate AI content", {
    intent: "Policies aligned with marketplace policy 100.10.",
  }),
  app(25, "Responsible AI -- SaaS", "Testing and reporting inappropriate AI content", {
    intent: "Quarterly testing of protections and user reporting mechanisms.",
  }),
  app(26, "Responsible AI -- SaaS", "Timely response to reported AI concerns", {
    intent: "Updates to reporters within two working days.",
  }),
  app(27, "Responsible AI -- SaaS", "Transparency of AI functionality before acquisition", {
    intent: "Clear AI descriptions at acquisition and in-app.",
  }),
];

const operationalControls: ControlDefinition[] = [
  ops(1, "Awareness training", "Security awareness training program"),
  ops(2, "Malware protection/anti-malware", "Anti-malware on all sampled components", true, {
    defaultNotInPlaceReasons: [
      "AV/EDR not on all in-scope systems",
      "Signatures older than one day",
      "On-access scanning disabled",
    ],
    correctiveActionHints: [
      "Deploy Microsoft Defender or EDR with real-time protection on all sampled hosts.",
      "Enable automatic quarantine and verify signature update cadence.",
    ],
  }),
  ops(3, "Malware protection/application control", "Approved application allow list", true),
  ops(4, "Patch management/patching and risk ranking", "Patch management policy and risk ranking"),
  ops(5, "Patch management/patching and risk ranking", "Patch deployment within defined windows", true),
  ops(6, "Vulnerability scanning", "Internal and external vulnerability scanning"),
  ops(7, "Vulnerability scanning", "Rescan after remediation of findings", true),
  ops(8, "Network Security Controls (NSC)", "NSC installed on environment boundaries", true),
  ops(9, "Network Security Controls (NSC)", "NSC default-deny and six-month rule reviews"),
  ops(10, "Change control", "Change control policy and procedures"),
  ops(11, "Change control", "Change testing and approval before production", true),
  ops(12, "Secure software development/deployment", "Secure SDLC practices"),
  ops(13, "Secure software development/deployment", "Code review and security testing in CI/CD"),
  ops(14, "Account management", "Default credentials removed or disabled"),
  ops(15, "Account management", "Unique IDs and authentication for users and admins"),
  ops(16, "Account management", "Privileged access management", true),
  ops(17, "Security event logging, reviewing and alerting", "Audit logging enabled"),
  ops(18, "Security event logging, reviewing and alerting", "Log retention and storage"),
  ops(19, "Security event logging, reviewing and alerting", "Log review procedures"),
  ops(20, "Security event logging, reviewing and alerting", "Security alerting configured", true),
  ops(21, "Information security risk management", "Risk management program"),
  ops(22, "Information security risk management", "Risk register maintained", true),
  ops(23, "Information security risk management", "Risk treatment and acceptance"),
  ops(24, "Information security risk management", "Management review of risk posture"),
  ops(25, "Security incident response", "Incident response plan", true),
  ops(26, "Security incident response", "Incident response testing"),
  ops(27, "Security incident response", "Incident reporting to Microsoft when required"),
  ops(28, "Business continuity plan and disaster recovery plan", "BCP documented and maintained"),
  ops(29, "Business continuity plan and disaster recovery plan", "DR plan and recovery objectives"),
  ops(30, "Business continuity plan and disaster recovery plan", "BCP/DR testing evidence"),
];

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

export const ALL_CONTROLS: ControlDefinition[] = [
  ...applicationControls,
  ...operationalControls,
  ...dataControls,
];

export const DOMAINS: {
  id: DomainId;
  label: string;
  shortLabel: string;
}[] = [
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

export function getControlsByDomain(domain: DomainId): ControlDefinition[] {
  return ALL_CONTROLS.filter((c) => c.domain === domain);
}

export function getControlById(id: string): ControlDefinition | undefined {
  return ALL_CONTROLS.find((c) => c.id === id);
}
