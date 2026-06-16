import type { ControlDefinition, RocTestingProcedure } from "@/lib/types";
import rocCatalog from "@/data/pci-roc-controls.json";

const PCI_DOC =
  "https://www.pcisecuritystandards.org/document_library/";

function pciSortOrder(ref: string): number {
  const isAppendix = ref.startsWith("A");
  const clean = ref.replace(/^A/, "");
  const parts = clean.split(".").map((p) => {
    const m = p.match(/^(\d+)([a-z])?$/);
    if (!m) return parseInt(p, 10) || 0;
    return (parseInt(m[1]!, 10) || 0) * 10 + (m[2] ? m[2].charCodeAt(0) - 96 : 0);
  });
  let order = isAppendix ? 1_000_000 : 0;
  for (let i = 0; i < parts.length; i++) {
    order += parts[i]! * Math.pow(100, 4 - i);
  }
  return order;
}

function rocControl(
  domain: string,
  requirementRef: string,
  section: string,
  title: string,
  rocTestingProcedures: RocTestingProcedure[]
): ControlDefinition {
  const [major, ...rest] = requirementRef.replace(/^A/, "").split(".");
  const isAppendix = requirementRef.startsWith("A");
  return {
    id: `roc-${requirementRef.replace(/\./g, "-").toLowerCase()}`,
    domain,
    number: isAppendix ? 0 : parseInt(major!, 10),
    subId: isAppendix
      ? requirementRef
      : rest.length
        ? `.${rest.join(".")}`
        : undefined,
    requirementRef,
    sortOrder: pciSortOrder(requirementRef),
    title,
    section,
    hardFail: false,
    intent: title,
    rocTestingProcedures,
    evidenceRequirements: [
      "Document Section 6 evidence reference numbers for each testing procedure.",
    ],
    docUrl: PCI_DOC,
    defaultNotInPlaceReasons: [
      "Requirement not fully met based on assessor testing",
      "Evidence incomplete or not available",
      "Compensating control or customized approach documentation required",
    ],
    correctiveActionHints: [
      "Remediate gaps and re-test against PCI DSS ROC requirement.",
      "Update policies, procedures, and technical controls as needed.",
    ],
  };
}

type CatalogEntry = {
  domain: string;
  requirementRef: string;
  section: string;
  title: string;
  rocTestingProcedures: RocTestingProcedure[];
};

export const PCI_ROC_FRAMEWORK_ID = "pci-dss-roc";

export const pciRocControls: ControlDefinition[] = (
  rocCatalog.controls as CatalogEntry[]
)
  .map((c) =>
    rocControl(
      c.domain,
      c.requirementRef,
      c.section,
      c.title,
      c.rocTestingProcedures
    )
  )
  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
