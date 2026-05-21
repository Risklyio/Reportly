import type { ControlDefinition } from "@/lib/types";

const OPS_BASE =
  "https://learn.microsoft.com/en-us/microsoft-365-app-certification/docs/seg2_ops";

function opsSortOrder(n: number, subId?: string): number {
  const subOffset = subId ? subId.toUpperCase().charCodeAt(0) - 64 : 0;
  return n * 10 + subOffset;
}

function ops(
  n: number,
  section: string,
  title: string,
  hardFail = false,
  extra: Partial<ControlDefinition> = {}
): ControlDefinition {
  const subId = extra.subId;
  const suffix = subId ? subId.toLowerCase() : "";
  return {
    id: extra.id ?? `ops-${n}${suffix}`,
    domain: "operational_security",
    number: n,
    subId,
    sortOrder: extra.sortOrder ?? opsSortOrder(n, subId),
    title,
    section,
    hardFail,
    intent: extra.intent ?? title,
    evidenceRequirements: extra.evidenceRequirements ?? [
      "Provide screenshots, policies, and records demonstrating control operation.",
    ],
    docUrl: extra.docUrl ?? `${OPS_BASE}#control-no-${n}`,
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

export const operationalControls: ControlDefinition[] = [
  ops(1, "Awareness training", "Security awareness training policies and processes", false, {
    subId: "A",
    intent:
      "The organization establishes security awareness training policies and processes requiring that all users of the in-scope systems (including contractors) undergo training:\n• As part of initial training for new users, or when required by information system/organization changes or industry trends.\n• At least annually.",
  }),
  ops(1, "Awareness training", "Training documentation, monitoring, and records", false, {
    subId: "B",
    intent:
      "You document and monitor information system security awareness training and retain individual training records inline with point A.",
  }),

  ops(2, "Malware protection/anti-malware", "Traditional anti-malware on sampled components", true, {
    subId: "A",
    intent:
      "The organization's anti-malware solution is active and enabled across all the sampled system components.\nIf using a traditional anti-virus solution then it MUST be configured:\n• On-access scanning is enabled and signatures are up-to-date within 1-day.\n• Automatically blocks/quarantines malware or alerts for immediate triage when malware is detected.",
    defaultNotInPlaceReasons: [
      "AV not on all in-scope systems",
      "Signatures older than one day",
      "On-access scanning disabled",
    ],
    correctiveActionHints: [
      "Deploy Microsoft Defender or equivalent AV with real-time protection on all sampled hosts.",
      "Enable automatic quarantine and verify signature updates within one day.",
    ],
  }),
  ops(2, "Malware protection/anti-malware", "NGAV / EDR configuration (alternative to 2A)", true, {
    subId: "B",
    intent:
      "OR If using NGAV (Endpoint Detection and Response/Next-Generation Antivirus) then it MUST be configured:\n• To perform periodic scanning,\n• To generate audit logs, and\n• To be kept up-to-date continually and have self-learning capabilities.\n\nIt MUST be configured:\n• To block known malware, and\n• To identify and block new malware variants based on macro behaviors as well as having full safelist capabilities.",
    defaultNotInPlaceReasons: [
      "EDR/NGAV not deployed on all sampled components",
      "Periodic scanning or audit logging not configured",
      "Behavioral blocking or safelist capabilities incomplete",
    ],
  }),

  ops(3, "Malware protection/application control", "Approved software list and approval process", true, {
    subId: "A",
    intent:
      "You have an approved list of software/applications with business justification that:\n• Exists and is kept up to date\n• Each application undergoes an approval process and sign off prior to its deployment",
  }),
  ops(3, "Malware protection/application control", "Application control enforcement", true, {
    subId: "B",
    intent:
      "Application control technology is active, enabled, and configured inline with the approval list across the sampled system components.",
  }),

  ops(4, "Patch management/patching and risk ranking", "Patch management policy and risk ranking", false, {
    intent:
      "A patch management policy and procedure documentation defines all of the following:\n• Suitable minimal patching window for critical/high and medium risk security vulnerabilities from the time of vendor patch release or from when bespoke coding vulnerabilities are first identified\n• Decommissioning of unsupported operating systems and application software, including third-party code dependencies\n• Details on how new vendor notified security vulnerabilities are identified and assigned a risk score",
  }),
  ops(5, "Patch management/patching and risk ranking", "Patching and unsupported software", true, {
    intent:
      "All sampled system components, including installed application software, and all third-party code dependencies are being patched.\nUnsupported operating systems and application software, including third-party code dependencies are not in use.\nFor true PaaS environments, this control is only applicable to third-party code dependencies.",
  }),

  ops(6, "Vulnerability scanning", "Quarterly vulnerability scanning", false, {
    intent:
      "Quarterly external infrastructure and web application/API vulnerability scanning is carried out.\nAND if Hybrid, On-prem or IaaS also provide evidence that:\nScanning needs to be carried out against the entire public footprint (IPs/URLs) and internal IP ranges if the environment is IaaS, Hybrid or On-prem.\nNote: This must include the full scope of the environment.",
  }),
  ops(7, "Vulnerability scanning", "Remediation within patching windows", true, {
    intent:
      "Remediation of all vulnerabilities identified in previous control are patched inline with the minimal patching window defined in your policy.",
  }),

  ops(8, "Network Security Controls (NSC)", "NSCs on environment boundaries", true, {
    intent:
      "Network Security Controls (NSCs) are installed on the boundary of the in-scope environment such as:\n• Between the Internet and the in-scope environment, and/or\n• Between any less trusted networks or systems and the in-scope environment.\nAND if Hybrid, On-prem or IaaS also provide evidence that:\n• Where applicable, all system components with Public IP Addresses are suitably segmented from all other internal system components using NSCs.",
  }),
  ops(9, "Network Security Controls (NSC)", "Default-deny NSC configuration", false, {
    subId: "A",
    intent:
      "All Network Security Controls (NSC) are configured to drop traffic not explicitly defined within the rule base.",
  }),
  ops(9, "Network Security Controls (NSC)", "NSC rule reviews every six months", false, {
    subId: "B",
    intent: "NSC rule reviews are carried out at least every six (6) months.",
  }),

  ops(10, "Change control", "Documented change requests for production", false, {
    intent:
      "Any changes introduced to production environments are implemented through documented change requests contain:\n• Security impact of the change\n• Details of any back-out procedures\n• Details of testing to be carried out to ensure the change has been securely implemented\n• Approval by authorized personnel\n\nNote: Changes include all changes within the environment, for example, infrastructure, environment configurations (i.e., cloud/applications/etc.) and code changes.",
  }),
  ops(11, "Change control", "Isolated non-production environments", true, {
    intent:
      "A separate environment exists so that:\n• Development and test/staging environments are isolated from the production environment via NSCs.\n• Development and test/staging environments enforce separation of duties from the production environment via access controls.\n• Sensitive production data is not used within the development or test/staging environments.",
  }),

  ops(12, "Secure software development/deployment", "Secure development policy and standards", false, {
    subId: "A",
    intent:
      "Policy/Standards exists and are maintained that supports the development of secure software and includes industry standards and/or best practices for secure coding, such as Open Web Application Security Project (OWASP) Top 10 or SysAdmin, Audit, Network and Security (SANS) Top 25 Common Weakness Enumeration (CWE)",
  }),
  ops(12, "Secure software development/deployment", "Annual secure coding training for developers", false, {
    subId: "B",
    intent:
      "All developers have undergone suitable security coding and software development training at least annually",
  }),
  ops(13, "Secure software development/deployment", "Secured code repositories and release approval", false, {
    intent:
      "Code repositories are secured so that:\n• All code changes undergo a review and approval process by a second reviewer prior to being merged with main branch\n• Appropriate access controls are in place\n• All access is enforced through multi-factor authentication (MFA).\n• All releases made into the production environment(s) are approved prior to their deployment.",
  }),

  ops(14, "Account management", "Default credentials and service account hardening", false, {
    intent:
      "Default credentials are either disabled, removed, or changed across the sampled system components.\nA process is in place to secure (harden) service accounts and that this process is followed.",
  }),
  ops(15, "Account management", "Unique accounts, least privilege, and inactive accounts", false, {
    intent:
      "• Unique user accounts are issued to all users.\n• User least privilege principles are being followed within the environment.\n• A strong password/passphrase policy or other suitable mitigations are in place.\n• A process is in place and followed at least every three (3) months to either disabled or deleted accounts not used for three months.",
  }),
  ops(16, "Account management", "MFA for remote and administrative access", true, {
    intent:
      "MFA is configured for all remote access and all non-console administrative interfaces and Cloud management interfaces.",
  }),

  ops(17, "Security event logging, reviewing and alerting", "Security event logging coverage", false, {
    intent:
      "Security event logging is setup across the in-scope environment, including sampled system components, to log events where applicable such as:\n• User logical access to system components (valid & invalid access)\n• All actions taken by a high-privileged user\n• Privileged account creation/modification\n• Event log tampering\n• Disabling of security tools (example: event logging)\n• Anti-Malware logging (example: updates, malware detection, scan failures)",
  }),
  ops(18, "Security event logging, reviewing and alerting", "Log availability and retention", false, {
    intent:
      "A minimum of 30 days' worth of security event logging data is immediately available, with 90 days of security event logs being retained.",
  }),
  ops(19, "Security event logging, reviewing and alerting", "Log review and investigation", false, {
    intent:
      "Logs are being reviewed periodically and any potential security events/anomalies identified during the review process are investigated and addressed.",
  }),
  ops(20, "Security event logging, reviewing and alerting", "Security alerting rules", true, {
    intent:
      "Alert rules are configured so that alerts are triggered for immediate investigation for the following security events where applicable:\n• Privileged account creation/modifications\n• Privileged/High risk activities or operations\n• Malware events (if applicable)\n• Event log tampering\n• IDPS/WAF events (if configured)",
  }),

  ops(21, "Information security risk management", "Information security risk management policy", false, {
    intent:
      "A ratified formal information security risk management policy/process is documented and established.",
  }),
  ops(22, "Information security risk management", "Annual company-wide risk assessment", true, {
    intent:
      "A formal company-wide information security risk assessment is carried out at least annually or upon a significant change to the environment.\nThe risk assessment includes the in-scope environment.",
  }),
  ops(23, "Information security risk management", "Risk assessment content", false, {
    intent:
      "The information security risk assessment includes:\n• System component or resource affected\n• Threats and vulnerabilities, or equivalent\n• Impact and likelihood metrics or equivalent\n• The creation of a risk register/risk treatment plan",
  }),
  ops(24, "Information security risk management", "Vendor and partner risk management", false, {
    intent:
      "A risk management processes is in place that assesses and manages risks associated with vendors and business partners.\nThe risk management process for vendors and business partners has been carried out at least within the past twelve (12) months.",
  }),

  ops(25, "Security incident response", "Security incident response plan", true, {
    intent:
      "A ratified security incident response plan/procedure (IRP) exists outlining how your organization responds to incidents, showing how it is maintained, and that it includes:\n• Details of the incident response team including contact information.\n• An internal communication plan to follow during the incident and for external communication to relevant parties such as key stakeholders, payment brands and acquirers, regulatory bodies (for example 72 hours for GDPR), supervisory authorities, directors, customers.\n• Steps for activities such as incident classification, containment, mitigation, recovery and returning to normal business operations depending on the type of incident.",
  }),
  ops(26, "Security incident response", "Incident response team training", false, {
    intent:
      "All members of the security incident response team have received annual organization specific incident response training which enables them to respond to security incidents.",
  }),
  ops(27, "Security incident response", "Incident response plan review and updates", false, {
    intent:
      "The security incident response strategy and supporting documentation is reviewed and updated based on EITHER:\n• Lessons learned from a tabletop exercise\n• Lessons learned from responding to a security incident, or\n• Significant organizational changes",
  }),

  ops(28, "Business continuity plan and disaster recovery plan", "Business Continuity Plan", false, {
    intent:
      "Documentation exists, and is maintained, outlining the Business Continuity Plan which includes:\n• Details of relevant personnel including their roles and responsibilities\n• Details of all critical business functions with associated contingency requirements and objectives\n• Recovery priority and timeframe targets system restoration and return to the original state.",
  }),
  ops(29, "Business continuity plan and disaster recovery plan", "Disaster Recovery Plan", false, {
    intent:
      "Documentation exists, and is maintained, outlining the Disaster Recovery Plan which includes at a minimum:\n• Personnel their roles, responsibilities, and escalation process\n• Inventory of the information systems used to support critical business functions and services\n• System and data backup procedures and configuration\n• A recovery plan detailing actions and procedures to be followed to restore critical information systems and data to operation.",
  }),
  ops(30, "Business continuity plan and disaster recovery plan", "BCP/DR review, training, and exercises", false, {
    intent:
      "The Business Continuity and Disaster Recovery Plans are reviewed at least annually to ensure that they remain valid and effective during adverse situations.\n• All relevant personnel receive training on their roles and responsibilities assigned within the contingency plans.\n• Both plans are being tested through annual Business Continuity and Disaster Recovery exercises.\n• Both plans are updated based on lessons learned from either enacting the plans or through the annual exercises, or updated after significant organizational changes.",
  }),
];
