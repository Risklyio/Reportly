import type { ControlDefinition } from "@/lib/types";

const APP_BASE =
  "https://learn.microsoft.com/en-us/microsoft-365-app-certification/docs/seg2_app";

function appSortOrder(n: number, subId?: string): number {
  const subOffset = subId ? subId.toUpperCase().charCodeAt(0) - 64 : 0;
  return n * 10 + subOffset;
}

function app(
  n: number,
  section: string,
  title: string,
  opts: Partial<ControlDefinition> = {}
): ControlDefinition {
  const subId = opts.subId;
  const suffix = subId ? subId.toLowerCase() : "";
  return {
    id: opts.id ?? `app-${n}${suffix}`,
    domain: "application_security",
    number: n,
    subId,
    sortOrder: opts.sortOrder ?? appSortOrder(n, subId),
    title,
    section,
    hardFail: opts.hardFail ?? false,
    intent: opts.intent ?? title,
    evidenceRequirements: opts.evidenceRequirements ?? [
      "Provide documentation and evidence per Microsoft sample evidence guide.",
    ],
    docUrl: opts.docUrl ?? `${APP_BASE}#control-no-${n}`,
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

const RAI_PAAS_SECTION = "Responsible AI (PaaS, IaaS & Hybrid)";
const RAI_SAAS_SECTION = "Responsible AI (SaaS)";

const pentestControls: ControlDefinition[] = pentestTitles.map((title, i) =>
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
);

const raiPaasHybridControls: ControlDefinition[] = [
  app(18, RAI_PAAS_SECTION, "Understanding and Verification of AI Integration", {
    intent: `Describe the AI technology integrated into the App/Add-in, as follows:
• Details of the technology being used, i.e. Microsoft Copilot or a Customer Engine Agent (CEA) and how it is being used.

If using Microsoft Copilot:
• List and describe specific Copilot agents being used within your App/Add-in.
• Detail all processes these agents are designed to automate and execute, referencing the Copilot Agent Guidance and Copilot Agent Validation Guidelines if necessary.

If using a CEA integration:
• Complete the Microsoft RAI Impact Assessment as part of the Responsible AI Tools and Practice by Microsoft AI.
• Provide a detailed review of the MS RAI assessment.`,
    defaultNotInPlaceReasons: [
      "AI technology not documented",
      "Copilot agents or CEA RAI assessment not described",
      "Automation scope for agents incomplete",
    ],
    correctiveActionHints: [
      "Document Copilot agents or complete and attach the Microsoft RAI Impact Assessment for CEA.",
      "Map each agent to processes automated and reference Copilot Agent Guidance where applicable.",
    ],
  }),

  app(
    19,
    RAI_PAAS_SECTION,
    "Confirming Functional Scope and User Consent for AI Actions",
    {
      intent: `Provide:
• An explanation of the features, functions and actions/tasks associated with the App/Add-ons AI functionality.
• Details whether the AI integration has the capability to autonomously perform actions on behalf of the user and specifically what actions.

Details of the AI consent process used by the App/Add-in when performing actions on behalf of the user, including:
• If specific consent is needed in addition to the initial access permissions.
• Process for obtaining and withdrawing such consent, including any mechanisms for additional authentication.
• A detailed description of the various consent flows identifying how and when users are informed of the exact actions the AI may take.
• How the App/Add-in implements the consent process.
• Suitable logging of consent given by the user.`,
      defaultNotInPlaceReasons: [
        "AI scope and autonomous actions not documented",
        "Consent flows incomplete or not evidenced",
        "Consent logging not demonstrated",
      ],
      correctiveActionHints: [
        "Document consent flows with screenshots and implement audit logging for user consent events.",
        "Clarify which actions require consent beyond initial permissions.",
      ],
    }
  ),

  app(
    20,
    RAI_PAAS_SECTION,
    "Clarity on Data Management and Privacy Regulations Implications",
    {
      intent: `Provide:
• The documented inventory including all data types processed/analysed by the AI, including highlighting PII/Personal Data as defined under GDPR or similar Data Privacy laws and regulations.
• Documentation that includes details of ALL data sources (Microsoft endpoints, ISV endpoints or third-party endpoints), along with business justification for their use, that are accessible to the AI system, i.e. Microsoft Connectors such as Microsoft 365 Copilot Connectors, Power Platform Connectors, External connectors, API endpoints, SDKs, etc.

If AI is processing PII/Personal Data, then provide:
• A link to your published Privacy Notice demonstrating reference to AI functionality, all the data types highlighted above are detailed, and all Data Privacy concerns (i.e. purpose(s), processing locations, lawfulness of processing, profiling, etc.).`,
      defaultNotInPlaceReasons: [
        "AI data inventory missing or incomplete",
        "Data sources and business justification not documented",
        "Privacy notice does not cover AI processing of personal data",
      ],
      correctiveActionHints: [
        "Publish an AI data inventory and update the privacy notice with AI-specific processing details.",
        "Document all connectors and endpoints accessible to the AI with justification.",
      ],
    }
  ),

  app(21, RAI_PAAS_SECTION, "Transparency in AI usage", {
    intent: `Provide details on:
• How users are notified that the App/Add-in utilizes AI.
• When users are notified of the use of AI, i.e. during the use of AI features or upon signing up to the service.

Please provide evidence to demonstrate:
• That the notification provides details on the functions performed by the AI.`,
    defaultNotInPlaceReasons: [
      "Users not notified of AI use",
      "Notifications lack detail on AI functions performed",
    ],
    correctiveActionHints: [
      "Add in-app and signup disclosures describing AI features and when they are used.",
      "Include screenshots of notifications shown before and during AI feature use.",
    ],
  }),

  app(22, RAI_PAAS_SECTION, "Establishing Comprehensive Governance for AI", {
    intent: `Provide your formal AI Policy (or equivalent) that includes, at a minimum:
• A definition of roles and responsibilities for ensuring AI ethical use.
• A structured process for reporting concerns or anomalies related to the AI integration and functionality.
• How your organization identifies and addresses issues of AI bias and lack of fairness.
• How the App/Add-in ensures users understand how AI decisions are made, to ensure transparency.
• How your organization monitors AI performance and compliance with the AI Policy.`,
    defaultNotInPlaceReasons: [
      "Formal AI policy not published",
      "Governance roles and reporting process not defined",
      "Bias, fairness, and monitoring controls not documented",
    ],
    correctiveActionHints: [
      "Publish an AI policy covering roles, reporting, bias, transparency, and monitoring.",
      "Link policy to operational procedures for the App/Add-in.",
    ],
  }),

  app(23, RAI_PAAS_SECTION, "User Control Over AI Integration", {
    intent: `If end users can control the AI functionality, either fully or partially:
• Your application allows the AI functionality to be enabled/disabled by the end user.
• If there is a pre-selected option (enabled/disabled), what it defaults to.
• How the App/Add-in provides the user with a clear explanation of what impacts disabling the AI will have to the overall functionality and user experience.

OR If no control is permitted for end users:
• Information on why certain AI features cannot be disabled or adjusted by the user, and whether there are alternatives to the use of AI.`,
    defaultNotInPlaceReasons: [
      "User enable/disable controls not documented",
      "Default AI setting or impact of disabling not explained",
      "No rationale when AI cannot be disabled",
    ],
    correctiveActionHints: [
      "Implement and document user toggles for AI with clear UX messaging on impact.",
      "If AI is mandatory, document business rationale and alternatives.",
    ],
  }),
];

const raiSaasControls: ControlDefinition[] = [
  app(24, RAI_SAAS_SECTION, "Prohibition of Inappropriate AI-generated Content", {
    intent: `Provide evidence that:
• Policies prohibiting the generation, storage, or provision of access to inappropriate, harmful, or offensive AI-generated content are in place:
  – As per the commercial marketplace certification policies under '100.10 Inappropriate content'
  – And updated in response to updates / changes occur in AI models or algorithms
  – And are reviewed at least every six months, or more frequently in response to technological changes in AI best practices and techniques and updates to Microsoft's commercial marketplace certification policies
• Processes are in place to ensure that relevant updates to the App/Add-in are implemented when required to reflect updates/changes in AI models or algorithms or in response to updates in AI best practices and techniques
• Processes are implemented to test the Apps/Add-ins protection mechanisms designed to protect users against inappropriate content and are carried out at least quarterly. As part of the M365 Certification Assessment, the Analysts will carry out independent testing of the technological controls implemented to fulfil the intent of this control using pre-defined scripts.`,
    defaultNotInPlaceReasons: [
      "Inappropriate content policy missing or not aligned to marketplace 100.10",
      "Policy review cycle not at least every six months",
      "Quarterly testing of AI content protections not evidenced",
    ],
    correctiveActionHints: [
      "Publish and review inappropriate-content policies at least every six months.",
      "Document quarterly testing of AI safeguards and remediation of model changes.",
    ],
  }),

  app(25, RAI_SAAS_SECTION, "Reporting Mechanism for Inappropriate Content", {
    intent: `Provide evidence that:
• Mechanisms are implemented for app users to report inappropriate, harmful, or offensive content to the ISV immediately upon user identification of such content.
• A response is given to the app user to acknowledge receipt of the report.
• Processes are in place to test the Apps/Add-ins reporting mechanisms and are carried out at least quarterly.`,
    defaultNotInPlaceReasons: [
      "No in-app reporting mechanism for inappropriate AI content",
      "Acknowledgement of reports not demonstrated",
      "Quarterly testing of reporting flows not documented",
    ],
    correctiveActionHints: [
      "Implement user reporting with automatic acknowledgement and track reports to closure.",
      "Test reporting mechanisms quarterly and retain records.",
    ],
  }),

  app(26, RAI_SAAS_SECTION, "Timely Action on Reported Concerns", {
    intent: `Provide evidence that:
• There is a documented policy and process for responding to and taking appropriate corrective actions to user reports of inappropriate content
• For substantiated reports of inappropriate content, the ISV implements appropriate corrective actions to the App/Add-in's content moderation logic within 2 working days of first being reported by the user.
• Adequate testing of the appropriate corrective actions is carried out and documented to verify that the reported concern has been remediated.
• The ISV has a mechanism to provide the user reporting their concern with an update as follows:
  – For unsubstantiated reports, the ISV provides details on why the report has been deemed to be unsubstantiated, or
  – Confirmation that the claim has been substantiated and what the ISV has done to remedy the situation.
  – All updates must be provided within 2 working days of the report being raised, i.e. upon completion of remediation activities.`,
    defaultNotInPlaceReasons: [
      "Response policy missing or exceeds two working days",
      "Substantiated findings not remediated within two working days",
      "User updates on report outcome not documented",
    ],
    correctiveActionHints: [
      "Define SLAs for report triage, remediation, and user notification within two working days.",
      "Document testing after content-moderation changes.",
    ],
  }),

  app(27, RAI_SAAS_SECTION, "Transparency of AI Functionality", {
    intent: `Provide evidence that:
• The App/Add-in clearly describes its Artificial Intelligence (AI) functionality to the customer before acquisition and as part of in-app functionality as follows:
  – As part of the app acquisition process.
  – Upon first use of the app.
  – When updates or changes occur in the app's AI functionalities.
  – At an organization-defined frequency to ensure user awareness of the AI functionalities.
• The ISV documents the process of providing AI functionality descriptions and user prompts as above.
• The ISV implements the process defined in point B) at least every six months, and retains records of these activities.`,
    defaultNotInPlaceReasons: [
      "AI functionality not described at acquisition or first use",
      "Process for AI transparency not documented",
      "Six-month review cycle not evidenced",
    ],
    correctiveActionHints: [
      "Add marketplace and in-app AI descriptions; document prompts at acquisition, first use, and on change.",
      "Run and record AI transparency reviews at least every six months.",
    ],
  }),
];

export const applicationControls: ControlDefinition[] = [
  ...pentestControls,
  app(17, "Graph API Checks", "Graph API permissions and least privilege", {
    intent:
      "Document all Microsoft Graph API permissions, types, endpoints, and business justification.",
    defaultNotInPlaceReasons: [
      "Permission inventory incomplete",
      "Application permissions lack business justification",
      "Credential storage not documented",
    ],
  }),
  ...raiPaasHybridControls,
  ...raiSaasControls,
];
