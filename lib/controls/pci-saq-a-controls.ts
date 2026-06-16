import type { ControlDefinition } from "@/lib/types";

const PCI_DOC =
  "https://www.pcisecuritystandards.org/document_library/";

function pciSortOrder(ref: string): number {
  const parts = ref.split(".").map((p) => parseInt(p, 10) || 0);
  let order = 0;
  for (let i = 0; i < parts.length; i++) {
    order += parts[i]! * Math.pow(100, 3 - i);
  }
  return order;
}

function pci(
  domain: ControlDefinition["domain"],
  ref: string,
  section: string,
  title: string,
  intent: string,
  extra: Partial<ControlDefinition> = {}
): ControlDefinition {
  const [major, ...rest] = ref.split(".");
  return {
    id: extra.id ?? `pci-${ref.replace(/\./g, "-")}`,
    domain,
    number: parseInt(major!, 10),
    subId: rest.length ? `.${rest.join(".")}` : undefined,
    sortOrder: extra.sortOrder ?? pciSortOrder(ref),
    title,
    section,
    hardFail: extra.hardFail ?? false,
    intent,
    evidenceRequirements: extra.evidenceRequirements ?? [
      "Provide evidence per PCI DSS v4.0.1 SAQ A expected testing methods.",
    ],
    docUrl: extra.docUrl ?? PCI_DOC,
    defaultNotInPlaceReasons: extra.defaultNotInPlaceReasons ?? [
      "Requirement not fully met based on assessor testing",
      "Evidence incomplete or not available",
      "Policy or procedure gap identified",
    ],
    correctiveActionHints: extra.correctiveActionHints ?? [
      "Remediate gaps and re-test against PCI DSS SAQ A requirement.",
      "Update policies, procedures, and technical controls as needed.",
    ],
  };
}

export const pciSaqAControls: ControlDefinition[] = [
  pci(
    "pci_req_2",
    "2.2.2",
    "Requirement 2: Secure configurations",
    "Vendor default accounts",
    "Vendor default accounts are managed as follows: if used, the default password is changed per Requirement 8.3.6; if not used, the account is removed or disabled. Applies to e-commerce merchants’ vendor default accounts on web servers.",
    {
      defaultNotInPlaceReasons: [
        "Default vendor accounts still enabled with unchanged passwords",
        "Unused default accounts not removed or disabled",
        "Configuration standards do not address vendor defaults",
      ],
    }
  ),

  pci(
    "pci_req_3",
    "3.1.1",
    "Requirement 3: Protect stored account data",
    "Security policies and operational procedures",
    "All security policies and operational procedures identified in Requirement 3 are documented, kept up to date, in use, and known to all affected parties. Applies when the merchant stores paper records with account data.",
    {
      defaultNotInPlaceReasons: [
        "Policies for paper account data storage are not documented",
        "Personnel are unaware of data protection procedures",
        "Policies are outdated or not in active use",
      ],
    }
  ),
  pci(
    "pci_req_3",
    "3.2.1",
    "Requirement 3: Protect stored account data",
    "Account data storage minimized",
    "Account data storage is kept to a minimum through data retention and disposal policies covering all storage locations, retention limits, business justification, secure deletion, and quarterly verification that expired data is destroyed.",
    {
      defaultNotInPlaceReasons: [
        "Paper records retained beyond defined retention period",
        "No documented retention and disposal policy",
        "Secure destruction process not verified quarterly",
      ],
    }
  ),

  pci(
    "pci_req_6",
    "6.3.1",
    "Requirement 6: Secure systems and software",
    "Security vulnerabilities identified and managed",
    "New security vulnerabilities are identified from industry-recognized sources, assigned risk rankings, and high-risk or critical vulnerabilities are identified. Applies to merchant servers with redirect or embedded payment pages.",
    {
      defaultNotInPlaceReasons: [
        "No process to monitor industry vulnerability sources",
        "Vulnerabilities not risk-ranked",
        "Critical or high-risk vulnerabilities not tracked",
      ],
    }
  ),
  pci(
    "pci_req_6",
    "6.3.3",
    "Requirement 6: Secure systems and software",
    "Security patches within one month",
    "All system components are protected from known vulnerabilities by installing applicable security patches; critical vulnerabilities are patched within one month of release.",
    {
      defaultNotInPlaceReasons: [
        "Critical patches not applied within one month",
        "Patch compliance not verified on in-scope servers",
        "Vulnerability remediation tracking incomplete",
      ],
    }
  ),

  pci(
    "pci_req_8",
    "8.2.1",
    "Requirement 8: Identify users and authenticate access",
    "Unique user IDs",
    "All users are assigned a unique ID before access to system components or cardholder data is allowed.",
    {
      defaultNotInPlaceReasons: [
        "Shared or duplicate user identifiers in use",
        "New users provisioned without unique IDs",
      ],
    }
  ),
  pci(
    "pci_req_8",
    "8.2.2",
    "Requirement 8: Identify users and authenticate access",
    "Group, shared, or generic IDs",
    "Group, shared, or generic IDs are only used when necessary on an exception basis and are managed with documented justification, management approval, time limits, and attributable actions.",
    {
      defaultNotInPlaceReasons: [
        "Shared accounts used without documented exception",
        "Management approval or justification missing",
      ],
    }
  ),
  pci(
    "pci_req_8",
    "8.2.5",
    "Requirement 8: Identify users and authenticate access",
    "Terminated user access revoked",
    "Access for terminated users is immediately revoked.",
    {
      defaultNotInPlaceReasons: [
        "Terminated users retain active accounts",
        "Deprovisioning process is not timely",
      ],
    }
  ),
  pci(
    "pci_req_8",
    "8.3.1",
    "Requirement 8: Identify users and authenticate access",
    "Strong authentication factors",
    "All user and administrator access to system components is authenticated via at least one authentication factor (something you know, have, or are).",
    {
      defaultNotInPlaceReasons: [
        "Authentication not enforced for administrative access",
        "Weak or missing authentication on in-scope systems",
      ],
    }
  ),
  pci(
    "pci_req_8",
    "8.3.5",
    "Requirement 8: Identify users and authenticate access",
    "Password set and reset",
    "If passwords are used, they are set to a unique value for first-time use and upon reset, and users are forced to change passwords immediately after first use.",
    {
      defaultNotInPlaceReasons: [
        "Default or reused passwords issued to users",
        "First-login password change not enforced",
      ],
    }
  ),
  pci(
    "pci_req_8",
    "8.3.6",
    "Requirement 8: Identify users and authenticate access",
    "Password complexity",
    "If passwords are used, they meet minimum complexity: at least 12 characters (or 8 if the system cannot support 12) and contain both numeric and alphabetic characters.",
    {
      defaultNotInPlaceReasons: [
        "Password length or complexity policy below PCI minimum",
        "System settings do not enforce complexity requirements",
      ],
    }
  ),
  pci(
    "pci_req_8",
    "8.3.7",
    "Requirement 8: Identify users and authenticate access",
    "Password history",
    "Individuals cannot submit a new password that matches any of the last four passwords used.",
    {
      defaultNotInPlaceReasons: [
        "Password history not enforced",
        "Users can reuse recent passwords",
      ],
    }
  ),
  pci(
    "pci_req_8",
    "8.3.9",
    "Requirement 8: Identify users and authenticate access",
    "Password change or dynamic analysis",
    "If passwords are the only authentication factor, passwords are changed at least every 90 days OR account security posture is dynamically analyzed to determine real-time access.",
    {
      defaultNotInPlaceReasons: [
        "Passwords not rotated within 90 days where required",
        "No dynamic account risk analysis in place",
      ],
    }
  ),

  pci(
    "pci_req_9",
    "9.4.1",
    "Requirement 9: Restrict physical access",
    "Media with cardholder data physically secured",
    "All media with cardholder data is physically secured. Applies to merchants with paper records containing account data.",
    {
      defaultNotInPlaceReasons: [
        "Paper media with account data not stored securely",
        "No locked storage for physical cardholder data",
      ],
    }
  ),
  pci(
    "pci_req_9",
    "9.4.1.1",
    "Requirement 9: Restrict physical access",
    "Offline media backups secured",
    "Offline media backups with cardholder data are stored in a secure location.",
    {
      defaultNotInPlaceReasons: [
        "Offline backups not stored in a secure location",
        "Backup storage controls not documented",
      ],
    }
  ),
  pci(
    "pci_req_9",
    "9.4.2",
    "Requirement 9: Restrict physical access",
    "Media classification",
    "All media with cardholder data is classified in accordance with the sensitivity of the data.",
    {
      defaultNotInPlaceReasons: [
        "Media classification procedures missing",
        "Sensitive paper media not labeled or classified",
      ],
    }
  ),
  pci(
    "pci_req_9",
    "9.4.3",
    "Requirement 9: Restrict physical access",
    "Media sent outside the facility",
    "Media with cardholder data sent outside the facility is secured and sent by a tracked delivery method.",
    {
      defaultNotInPlaceReasons: [
        "Offsite media shipments not tracked or secured",
        "Courier or tracking controls not in place",
      ],
    }
  ),
  pci(
    "pci_req_9",
    "9.4.4",
    "Requirement 9: Restrict physical access",
    "Management approval for offsite media",
    "Management approves all media with cardholder data moved outside the facility.",
    {
      defaultNotInPlaceReasons: [
        "Offsite media movements lack management approval",
        "Approval records not maintained",
      ],
    }
  ),
  pci(
    "pci_req_9",
    "9.4.6",
    "Requirement 9: Restrict physical access",
    "Hard-copy destruction",
    "Hard-copy materials with cardholder data are destroyed when no longer needed via cross-cut shredding, incineration, or pulping, with secure storage containers used prior to destruction.",
    {
      defaultNotInPlaceReasons: [
        "Paper destruction process not defined or followed",
        "Insecure disposal of materials with account data",
      ],
    }
  ),

  pci(
    "pci_req_11",
    "11.3.2",
    "Requirement 11: Test security regularly",
    "Quarterly ASV external vulnerability scans",
    "External vulnerability scans are performed at least quarterly by a PCI SSC Approved Scanning Vendor, vulnerabilities are resolved, and rescans confirm passing results per the ASV Program Guide.",
    {
      hardFail: true,
      defaultNotInPlaceReasons: [
        "Most recent ASV scan did not pass",
        "Quarterly scanning not performed",
        "Critical vulnerabilities remain unresolved",
      ],
    }
  ),
  pci(
    "pci_req_11",
    "11.3.2.1",
    "Requirement 11: Test security regularly",
    "External scans after significant change",
    "External vulnerability scans are performed after any significant change; CVSS 4.0+ vulnerabilities are resolved and rescans conducted by qualified personnel with organizational independence.",
    {
      defaultNotInPlaceReasons: [
        "No scan performed after significant infrastructure change",
        "High-severity findings from post-change scan remain open",
      ],
    }
  ),

  pci(
    "pci_req_12",
    "12.8.1",
    "Requirement 12: Policies and programs",
    "TPSP list maintained",
    "A list of all third-party service providers with which account data is shared or that could affect account data security is maintained, including a description of services provided.",
    {
      defaultNotInPlaceReasons: [
        "TPSP inventory incomplete or outdated",
        "Service descriptions missing from TPSP list",
      ],
    }
  ),
  pci(
    "pci_req_12",
    "12.8.2",
    "Requirement 12: Policies and programs",
    "Written agreements with TPSPs",
    "Written agreements are maintained with all relevant TPSPs and include acknowledgments that TPSPs are responsible for the security of account data they handle or that could impact the merchant CDE.",
    {
      defaultNotInPlaceReasons: [
        "Written TPSP agreements missing or incomplete",
        "TPSP security acknowledgments not documented",
      ],
    }
  ),
  pci(
    "pci_req_12",
    "12.8.3",
    "Requirement 12: Policies and programs",
    "TPSP due diligence",
    "An established process is implemented for engaging TPSPs, including proper due diligence prior to engagement.",
    {
      defaultNotInPlaceReasons: [
        "No due diligence process before engaging TPSPs",
        "Due diligence evidence not retained",
      ],
    }
  ),
  pci(
    "pci_req_12",
    "12.8.4",
    "Requirement 12: Policies and programs",
    "Monitor TPSP PCI DSS compliance",
    "A program is implemented to monitor TPSPs’ PCI DSS compliance status at least once every 12 months.",
    {
      defaultNotInPlaceReasons: [
        "TPSP compliance status not reviewed annually",
        "AOC or compliance evidence not collected from TPSPs",
      ],
    }
  ),
  pci(
    "pci_req_12",
    "12.8.5",
    "Requirement 12: Policies and programs",
    "TPSP responsibility matrix",
    "Information is maintained about which PCI DSS requirements are managed by each TPSP, which are managed by the entity, and any that are shared.",
    {
      defaultNotInPlaceReasons: [
        "Shared responsibility matrix not documented",
        "TPSP vs merchant responsibilities unclear",
      ],
    }
  ),
  pci(
    "pci_req_12",
    "12.10.1",
    "Requirement 12: Policies and programs",
    "Incident response plan",
    "An incident response plan exists and is ready to be activated, including roles, communication strategies, containment procedures, recovery, backup processes, legal reporting requirements, and payment brand references.",
    {
      defaultNotInPlaceReasons: [
        "Incident response plan not documented",
        "Plan not reviewed or available to personnel",
        "Key incident contacts or procedures missing",
      ],
    }
  ),
];
