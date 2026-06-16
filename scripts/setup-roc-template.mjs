/**
 * Copy official ROC PDF from Downloads into public/templates for deployment.
 * Plain Node script — no tsx required.
 */
import {
  copyRocTemplateFromDownloads,
  getPublicRocTemplatePath,
} from "./roc-template.mjs";
import fs from "node:fs";

const dest = getPublicRocTemplatePath();

try {
  if (fs.existsSync(dest)) {
    console.log(`ROC template ready at ${dest}`);
    process.exit(0);
  }

  const src = copyRocTemplateFromDownloads(dest);
  console.log(`Copied ROC template from ${src}`);
  console.log(`ROC template ready at ${dest}`);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
