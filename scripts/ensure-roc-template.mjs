/**
 * Ensure ROC PDF exists in public/templates before build/deploy.
 * Plain Node script — no tsx required.
 */
import { ensureRocTemplateForBuild } from "./roc-template.mjs";

try {
  await ensureRocTemplateForBuild();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
