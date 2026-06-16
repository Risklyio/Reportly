/**
 * Ensure ROC PDF exists in public/templates before build/deploy.
 * Sources: existing file, Downloads folder, or ROC_TEMPLATE_URL.
 */
import { ensureRocTemplateForBuild } from "../lib/export/roc-template-path";

ensureRocTemplateForBuild()
  .then((dest) => {
    if (!dest) process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
