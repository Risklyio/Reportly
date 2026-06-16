/**
 * Parse PCI DSS v4.0.1 ROC Template (Part II Section 7) into a controls JSON catalog.
 *
 * Usage:
 *   npx tsx scripts/parse-roc-template.ts [path-to-roc-pdf-or-text]
 *
 * Default input: ../Downloads/PCI-DSS-v4-0-1-ROC-Template-r3.pdf
 * Output: data/pci-roc-controls.json
 */

import * as fs from "node:fs";
import * as path from "node:path";

const DEFAULT_PDF = path.join(
  process.env.USERPROFILE ?? "",
  "Downloads",
  "PCI-DSS-v4-0-1-ROC-Template-r3.pdf"
);

const OUT_PATH = path.join(process.cwd(), "data", "pci-roc-controls.json");

const PCI_DOC =
  "https://www.pcisecuritystandards.org/document_library/";

export interface RocTestingProcedure {
  ref: string;
  procedure: string;
  reportingInstructions: string[];
}

export interface RocControl {
  id: string;
  domain: string;
  requirementRef: string;
  section: string;
  title: string;
  intent: string;
  rocTestingProcedures: RocTestingProcedure[];
}

const SKIP_LINE =
  /^(-- \d+ of \d+ --|Copyright|PCI DSS v4\.0\.1 ROC Template|Page \d+|☐|Assessment Findings|Select If Below|Select if below|In Place\s+Not Applicable|Describe why the assessment|Note: Include all details|table in Assessment Findings|\*As applicable)/i;

const PROCEDURE_REF =
  /^([A-Z]?\d+(?:\.\d+)*(?:\.[a-z])?)\s+(.+)$/;

const REPORTING_START =
  /^(Identify |For each |Describe |Indicate |If |Provide |Confirm |State |List |Document |Note:|Complete |Examine the )/i;

function isFooterOrNoise(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (SKIP_LINE.test(t)) return true;
  if (t === "Testing Procedures" || t.startsWith("Testing Procedures\t")) return true;
  if (t.includes("Reporting Instructions") && t.includes("Reporting Details")) return true;
  return false;
}

function rocDomain(ref: string): string {
  if (ref.startsWith("A1.")) return "roc_appendix_a1";
  if (ref.startsWith("A2.")) return "roc_appendix_a2";
  if (ref.startsWith("A3.")) return "roc_appendix_a3";
  const major = parseInt(ref.replace(/^A/, "").split(".")[0]!, 10);
  return `roc_req_${major}`;
}

function sectionLabel(domain: string): string {
  const map: Record<string, string> = {
    roc_req_1: "Requirement 1: Network security controls",
    roc_req_2: "Requirement 2: Secure configurations",
    roc_req_3: "Requirement 3: Protect stored account data",
    roc_req_4: "Requirement 4: Protect cardholder data with strong cryptography",
    roc_req_5: "Requirement 5: Protect systems from malware",
    roc_req_6: "Requirement 6: Develop secure systems and software",
    roc_req_7: "Requirement 7: Restrict access by business need to know",
    roc_req_8: "Requirement 8: Identify users and authenticate access",
    roc_req_9: "Requirement 9: Restrict physical access",
    roc_req_10: "Requirement 10: Log and monitor access",
    roc_req_11: "Requirement 11: Test security regularly",
    roc_req_12: "Requirement 12: Support information security with policies",
    roc_appendix_a1: "Appendix A1: Multi-tenant service providers",
    roc_appendix_a2: "Appendix A2: Additional PCI DSS requirements for SSL/early TLS",
    roc_appendix_a3: "Appendix A3: Designated entities supplemental validation",
  };
  return map[domain] ?? domain;
}

function rocId(ref: string): string {
  return `roc-${ref.replace(/\./g, "-").toLowerCase()}`;
}

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

function parseTestingSection(lines: string[]): RocTestingProcedure[] {
  const procedures: RocTestingProcedure[] = [];
  let current: RocTestingProcedure | null = null;
  let mode: "procedure" | "reporting" = "procedure";

  const flush = () => {
    if (current) {
      current.procedure = current.procedure.replace(/\s+/g, " ").trim();
      current.reportingInstructions = current.reportingInstructions.map((r) =>
        r.replace(/\s+/g, " ").trim()
      );
      procedures.push(current);
    }
    current = null;
    mode = "procedure";
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (isFooterOrNoise(line)) continue;
    if (line === "PCI DSS Requirement" || line.startsWith("Requirement Description")) break;

    const procMatch = line.match(PROCEDURE_REF);
    if (procMatch) {
      flush();
      current = {
        ref: procMatch[1]!,
        procedure: procMatch[2]!,
        reportingInstructions: [],
      };
      mode = "procedure";
      continue;
    }

    if (!current) continue;

    if (mode === "procedure" && REPORTING_START.test(line)) {
      mode = "reporting";
      current.reportingInstructions.push(line);
    } else if (mode === "reporting") {
      if (REPORTING_START.test(line)) {
        current.reportingInstructions.push(line);
      } else {
        const last = current.reportingInstructions.length - 1;
        if (last >= 0) {
          current.reportingInstructions[last] += " " + line;
        } else {
          current.reportingInstructions.push(line);
        }
      }
    } else {
      current.procedure += " " + line;
    }
  }
  flush();
  return procedures;
}

function parseRequirements(text: string): RocControl[] {
  const startIdx = text.indexOf("7 \tFindings and Observations");
  const altStart = text.indexOf("7  Findings and Observations");
  const sectionStart = startIdx >= 0 ? startIdx : altStart;
  if (sectionStart < 0) {
    throw new Error("Could not find Part II Section 7 (Findings and Observations)");
  }

  let body = text.slice(sectionStart);
  const endMarkers = [
    "Part III",
    "Appendix B",
    "ROC Attestation",
  ];
  for (const m of endMarkers) {
    const i = body.indexOf(m);
    if (i > 0) body = body.slice(0, i);
  }

  const blocks = body.split(/\nPCI DSS Requirement\n/);
  const controls: RocControl[] = [];

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i]!;
    const lines = block.split("\n").map((l) => l.replace(/\t/g, " ").trimEnd());

    const titleParts: string[] = [];
    for (const line of lines) {
      const t = line.trim();
      if (!t || isFooterOrNoise(t)) continue;
      if (t.startsWith("Assessment Findings")) break;
      titleParts.push(t);
    }
    const reqLine = titleParts.join(" ");

    const reqMatch = reqLine.match(/^([A-Z]?\d+(?:\.\d+)+)\s+(.+)$/);
    if (!reqMatch) continue;

    const requirementRef = reqMatch[1]!;
    const title = reqMatch[2]!.replace(/\s+/g, " ").trim();

    const testingIdx = lines.findIndex((l) =>
      l.includes("Testing Procedures") && l.includes("Reporting")
    );
    const testingLines = testingIdx >= 0 ? lines.slice(testingIdx + 1) : [];
    const rocTestingProcedures = parseTestingSection(testingLines);

    const domain = rocDomain(requirementRef);
    controls.push({
      id: rocId(requirementRef),
      domain,
      requirementRef,
      section: sectionLabel(domain),
      title,
      intent: title,
      rocTestingProcedures,
    });
  }

  controls.sort((a, b) => pciSortOrder(a.requirementRef) - pciSortOrder(b.requirementRef));
  return controls;
}

async function loadText(inputPath: string): Promise<string> {
  const ext = path.extname(inputPath).toLowerCase();
  if (ext === ".txt") {
    return fs.readFileSync(inputPath, "utf8");
  }

    try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (
      buf: Buffer
    ) => Promise<{ text: string }>;
    const buf = fs.readFileSync(inputPath);
    const data = await pdfParse(buf);
    return data.text;
  } catch {
    // Fallback: Cursor/read-tool style text with page markers
    return fs.readFileSync(inputPath, "utf8");
  }
}

async function main() {
  const inputPath = process.argv[2] ?? DEFAULT_PDF;
  if (!fs.existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`Parsing: ${inputPath}`);
  const text = await loadText(inputPath);
  const controls = parseRequirements(text);

  const output = {
    version: "PCI DSS v4.0.1 ROC Template r3",
    generatedAt: new Date().toISOString(),
    docUrl: PCI_DOC,
    controlCount: controls.length,
    controls,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), "utf8");

  const procCount = controls.reduce(
    (n, c) => n + c.rocTestingProcedures.length,
    0
  );
  console.log(`Wrote ${controls.length} requirements, ${procCount} testing procedures → ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
