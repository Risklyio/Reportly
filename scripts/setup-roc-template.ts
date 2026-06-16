/**
 * Copy official ROC PDF from Downloads into public/templates for deployment.
 */
import { ensureRocTemplateInPublic } from "../lib/export/roc-template-path";

try {
  const dest = ensureRocTemplateInPublic();
  console.log(`ROC template ready at ${dest}`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
