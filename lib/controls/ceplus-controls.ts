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
    "Remote vulnerability assessment",
    true,
    {
      subId: "A",
      intent:
        "Scan all identified IP addresses, on the recommended set of TCP and UDP ports.",
    }
  ),
  ce(
    "ce_external_vulnerability_assessment",
    1,
    "External vulnerability assessment",
    "External Services",
    true,
    {
      subId: "B",
      intent:
        "For each Internet-accessible service you discover use the flow diagram and notes below to determine whether to record a Pass or Fail for the service.",
    }
  ),

  ce(
    "ce_authenticated_vulnerability_assessment",
    2,
    "Authenticated vulnerability assessment",
    "Check patching, by authenticated vulnerability scan of devices",
    true,
    {
      subId: "A",
      intent:
        "For each device to be tested, scan with the approved vulnerability scanning tool. Using the output of the scan, identify vulnerabilities that meet any of the three following criteria: described by the vendor as critical or high risk; has a CVSS v3 base score of 7 or above; there are no details of the level of vulnerabilities the update fixes provided by the vendor.",
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
    "ce_malware_protection",
    3,
    "Malware protection",
    "Check that the anti-malware software is installed and running",
    true,
    {
      subId: "A",
      intent:
        "For each device in the sample set, check that the anti-malware software is installed and running.",
    }
  ),
  ce(
    "ce_malware_protection",
    3,
    "Malware protection",
    "Check effectiveness of defences against malware delivered by email",
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
    "Check effectiveness of defences against malware delivered by browser",
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
    "Manual Checks for devices that use anti-malware software",
    true,
    {
      subId: "D",
      intent:
        "For devices that use anti-malware software, complete the required manual checks to validate protections are configured and operating as expected.",
    }
  ),
  ce(
    "ce_malware_protection",
    3,
    "Malware protection",
    "For devices that use certificate-based application allow listing",
    true,
    {
      subId: "E",
      intent:
        "For devices using certificate-based allow listing, only trusted-signed executables run and policy applies across executable types.",
    }
  ),

  ce(
    "ce_multi_factor_authentication",
    4,
    "Multi-factor authentication",
    "Check multi-factor authentication configuration",
    true,
    {
      subId: "A",
      intent:
        "To test cloud services declared in scope have been configured for multi factor authentication (MFA).",
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
    "ce_account_separation",
    5,
    "Account separation",
    "Check account separation",
    true,
    {
      subId: "A",
      intent:
        "To test user accounts don't have administrator privileges assigned.",
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
    "ce_sampling",
    6,
    "Sampling",
    "Selected sample of devices",
    false,
    {
      subId: "A",
      intent:
        "List the sampled devices and quantities used for Cyber Essentials Plus testing.",
      defaultNotInPlaceReasons: [],
      correctiveActionHints: [],
    }
  ),
];

