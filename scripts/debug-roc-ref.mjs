/**
 * Debug ROC PDF field map for a requirement ref.
 * Usage: node scripts/debug-roc-ref.mjs 1.1.1
 */
import fs from "node:fs";
import { getPublicRocTemplatePath } from "./roc-template.mjs";
import {
  buildFieldMapFromPdfPath,
  buildFieldMapFromPdfBytes,
} from "./roc-pdf-locate.mjs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const ref = process.argv[2] ?? "1.1.1";
const pdfPath = getPublicRocTemplatePath();

if (!fs.existsSync(pdfPath)) {
  console.error("Template not found:", pdfPath);
  process.exit(1);
}

console.log("Building field map from", pdfPath);
const map = await buildFieldMapFromPdfPath(pdfPath);
const entry = map.find((e) => e.requirementRef === ref);
console.log("\nSelected entry for", ref + ":");
console.log(JSON.stringify(entry, null, 2));

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const require = createRequire(import.meta.url);
pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
  require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")
).href;
const bytes = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await pdfjs.getDocument({ data: bytes, disableFontFace: true }).promise;

console.log("\nAll PDF pages containing", ref + ":");
for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  const text = content.items.map((i) => i.str).join(" ");
  if (!text.includes(ref)) continue;
  const footer = content.items
    .filter((i) => i.transform[5] < 55 && i.transform[4] > viewport.width * 0.72)
    .map((i) => i.str.trim())
    .filter(Boolean);
  console.log(`  PDF page ${pageNum}, printed footer: ${footer.join(" ") || "?"}`);
}

console.log(`\nTotal mapped requirements: ${map.length}`);
