import fs from "node:fs";
import path from "node:path";
import { buildFieldMapFromPdf } from "../lib/export/roc-pdf-locate";
import { ROC_TEMPLATE_FILENAME } from "../lib/export/roc-template-path";
import type { RocPdfFieldMap } from "../lib/export/roc-pdf-types";
import { getRocTemplatePath } from "../lib/export/roc-template-path";

const OUT_PATH = path.join(process.cwd(), "data", "roc-pdf-field-map.json");

async function main() {
  const pdfPath = getRocTemplatePath();
  const entries = await buildFieldMapFromPdf(pdfPath);
  const output: RocPdfFieldMap = {
    version: ROC_TEMPLATE_FILENAME,
    template: ROC_TEMPLATE_FILENAME,
    generatedAt: new Date().toISOString(),
    pageHeight: 792,
    entries,
  };
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), "utf8");
  console.log(`Wrote ${entries.length} field entries → ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
