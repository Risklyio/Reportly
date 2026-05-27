import type { ControlDefinition } from "@/lib/types";

const CE_BASE =
  "https://www.ncsc.gov.uk/files/cyber-essentials-plus-test-specification-v3-2%20english.pdf";

function ce(
  domain: ControlDefinition["domain"],
  n: number,
  section: string,
  title: string,
  hardFail = true,
  extra: Partial<ControlDefinition> = {}
): ControlDefinition {
  const subId = extra.subId;
  const suffix = subId ? subId.toLowerCase() : "";
  return {
    id: extra.id ?? `ce-${n}${suffix}`,
    domain,
    number: n,
    subId,
    sortOrder:
      extra.sortOrder ??
      n * 10 + (subId ? subId.toUpperCase().charCodeAt(0) - 64 : 0),
    title,
    section,
    hardFail,
    intent: extra.intent ?? title,
    evidenceRequirements: extra.evidenceRequirements ?? [
      "Provide assessor evidence, screenshots, and test records for this CE+ sub-test.",
    ],
    docUrl: extra.docUrl ?? CE_BASE,
    defaultNotInPlaceReasons: extra.defaultNotInPlaceReasons ?? [
      "Test case failed on one or more sampled assets",
      "Evidence missing for representative sampling",
      "Control not enforced consistently across in-scope systems",
    ],
    correctiveActionHints: extra.correctiveActionHints ?? [
      "Remediate failed CE+ findings and re-test sampled systems.",
      "Document representative sample, pass/fail decisions, and supporting evidence.",
    ],
  };
}

export const ceplusControls: ControlDefinition[] = [
  ce(
    "ce_external_vulnerability_assessment",
    1,
    "External vulnerability assessment",
    "Identify all internet-facing IPs and externally reachable services in scope",
    true,
    {
      subId: "A",
      intent:
        "Identify all internet-facing IP addresses and services in scope (including IaaS where used) before remote vulnerability testing.",
    }
  ),
  ce(
    "ce_external_vulnerability_assessment",
    1,
    "External vulnerability assessment",
    "Run approved external vulnerability scans across identified IPs and relevant TCP/UDP ports",
    true,
    {
      subId: "B",
      intent:
        "Perform approved remote vulnerability scanning on the identified public footprint and review each discovered internet-accessible service.",
    }
  ),
  ce(
    "ce_external_vulnerability_assessment",
    1,
    "External vulnerability assessment",
    "Record pass only when all tested internet-accessible services pass",
    true,
    {
      subId: "C",
      intent:
        "A single failed service results in a failed external vulnerability assessment test case.",
    }
  ),

  ce(
    "ce_authenticated_vulnerability_assessment",
    2,
    "Authenticated vulnerability assessment",
    "Perform authenticated scans on sampled end-user devices, servers, and IaaS instances",
    true,
    {
      subId: "A",
      intent:
        "Use approved authenticated scanning against representative sampled devices (EUDs, servers, and IaaS instances).",
    }
  ),
  ce(
    "ce_authenticated_vulnerability_assessment",
    2,
    "Authenticated vulnerability assessment",
    "Fail findings with vendor critical/high, CVSS v3 >= 7, or unclassified severe vulnerabilities older than 14 days",
    true,
    {
      subId: "B",
      intent:
        "If qualifying vulnerabilities have a vendor-provided fix older than 14 days, this test case fails.",
      defaultNotInPlaceReasons: [
        "Critical/high vulnerabilities older than 14 days detected",
        "CVSS 7+ vulnerabilities not remediated within required window",
        "Unclassified severe vulnerability fixes overdue",
      ],
      correctiveActionHints: [
        "Patch or otherwise apply vendor-approved fixes within 14 days.",
        "Track vulnerability age and evidence remediation/retest outcomes.",
      ],
    }
  ),
  ce(
    "ce_authenticated_vulnerability_assessment",
    2,
    "Authenticated vulnerability assessment",
    "Use representative sampling methodology and retain sample-size evidence",
    false,
    {
      subId: "C",
      intent:
        "Assessment evidence must justify representative sample calculation and retain records for certification assurance.",
    }
  ),

  ce(
    "ce_malware_protection",
    3,
    "Malware protection",
    "Anti-malware installed, running, and updated on sampled devices using AV",
    true,
    {
      subId: "A",
      intent:
        "For sampled devices using anti-malware software, verify product is installed, operational, and updated per vendor guidance.",
    }
  ),
  ce(
    "ce_malware_protection",
    3,
    "Malware protection",
    "Email-delivered malware test files are blocked from access/execution",
    true,
    {
      subId: "B",
      intent:
        "Where users receive email, malware test files and unsafe executable behavior must be blocked according to CE+ sub-test expectations.",
    }
  ),
  ce(
    "ce_malware_protection",
    3,
    "Malware protection",
    "Browser-delivered malware test files are blocked from download/access/execution",
    true,
    {
      subId: "C",
      intent:
        "Where users browse the web, test files downloaded from approved test sources must be blocked or safely controlled.",
    }
  ),
  ce(
    "ce_malware_protection",
    3,
    "Malware protection",
    "Certificate-based application allow listing enforced where used",
    true,
    {
      subId: "D",
      intent:
        "For devices using certificate-based allow listing, only trusted-signed executables run and policy applies across executable types.",
    }
  ),

  ce(
    "ce_multi_factor_authentication",
    4,
    "Multi-factor authentication",
    "MFA enforced for user and administrator access to all in-scope cloud services",
    true,
    {
      subId: "A",
      intent:
        "Users and admins must be prompted for MFA before access to each in-scope authentication service.",
      defaultNotInPlaceReasons: [
        "One or more in-scope cloud services allow access without MFA",
        "MFA not enforced for either user or administrative access",
      ],
      correctiveActionHints: [
        "Enable and enforce MFA for all user and admin access paths.",
        "Re-test from untrusted device/incognito sessions.",
      ],
    }
  ),
  ce(
    "ce_multi_factor_authentication",
    4,
    "Multi-factor authentication",
    "Test authentication flows on untrusted or incognito sessions for each authentication service",
    true,
    {
      subId: "B",
      intent:
        "Assessment should observe authentication behavior for each cloud authentication service in use.",
    }
  ),

  ce(
    "ce_account_separation",
    5,
    "Account separation",
    "Standard user accounts cannot run administrative processes without separate admin credentials",
    true,
    {
      subId: "A",
      intent:
        "When a user attempts administrative actions, the system must require additional admin login and not run with standard user rights.",
      defaultNotInPlaceReasons: [
        "Standard users can run administrative processes directly",
        "No prompt for separate administrator credentials",
      ],
      correctiveActionHints: [
        "Remove local admin rights from standard users.",
        "Enforce privileged actions via separate admin accounts.",
      ],
    }
  ),
  ce(
    "ce_account_separation",
    5,
    "Account separation",
    "Repeat account-separation test across all sampled devices and applicable cloud environments",
    true,
    {
      subId: "B",
      intent:
        "All sampled devices and relevant cloud environments where admin processes can run must pass account-separation testing.",
    }
  ),
];

