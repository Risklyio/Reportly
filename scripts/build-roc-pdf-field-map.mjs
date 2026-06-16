/**
 * Build ROC PDF field map at deploy time (not in serverless runtime).
 */
import fs from "node:fs";
import path from "node:path";
import { buildFieldMapFromPdfPath } from "./roc-pdf-locate.mjs";
import {
  getPublicRocTemplatePath,
  ROC_TEMPLATE_FILENAME,
} from "./roc-template.mjs";

const OUT_PATH = path.join(process.cwd(), "data", "roc-pdf-field-map.json");

async function main() {
  const pdfPath = getPublicRocTemplatePath();
  if (!fs.existsSync(pdfPath)) {
    console.warn(
      `Skipping ROC field map build — template not found at ${pdfPath}`
    );
    return;
  }

  const entries = await buildFieldMapFromPdfPath(pdfPath);
  const output = {
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
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
