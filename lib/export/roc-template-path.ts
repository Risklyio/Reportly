import fs from "node:fs";
import path from "node:path";

export const ROC_TEMPLATE_FILENAME = "PCI-DSS-v4-0-1-ROC-Template-r3.pdf";

export function getRocTemplatePath(): string {
  const bundled = path.join(
    process.cwd(),
    "public",
    "templates",
    ROC_TEMPLATE_FILENAME
  );
  if (fs.existsSync(bundled)) return bundled;

  const downloads = path.join(
    process.env.USERPROFILE ?? process.env.HOME ?? "",
    "Downloads",
    ROC_TEMPLATE_FILENAME
  );
  if (downloads && fs.existsSync(downloads)) return downloads;

  throw new Error(
    `ROC template not found. Copy ${ROC_TEMPLATE_FILENAME} to public/templates/ or Downloads/.`
  );
}

export function ensureRocTemplateInPublic(): string {
  const dest = path.join(
    process.cwd(),
    "public",
    "templates",
    ROC_TEMPLATE_FILENAME
  );
  if (fs.existsSync(dest)) return dest;

  const src = path.join(
    process.env.USERPROFILE ?? process.env.HOME ?? "",
    "Downloads",
    ROC_TEMPLATE_FILENAME
  );
  if (!fs.existsSync(src)) {
    throw new Error(`Source ROC template not found at ${src}`);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return dest;
}
