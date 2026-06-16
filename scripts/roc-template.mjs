import fs from "node:fs";
import path from "node:path";

export const ROC_TEMPLATE_FILENAME = "PCI-DSS-v4-0-1-ROC-Template-r3.pdf";

export function getPublicRocTemplatePath(cwd = process.cwd()) {
  return path.join(cwd, "public", "templates", ROC_TEMPLATE_FILENAME);
}

export function getDownloadsRocTemplatePath() {
  const home = process.env.USERPROFILE ?? process.env.HOME ?? "";
  if (!home) return null;
  const downloads = path.join(home, "Downloads", ROC_TEMPLATE_FILENAME);
  return fs.existsSync(downloads) ? downloads : null;
}

export async function downloadRocTemplateTo(dest) {
  const url = process.env.ROC_TEMPLATE_URL?.trim();
  if (!url) {
    throw new Error(
      "ROC_TEMPLATE_URL is not set. Host the PDF and set this env var, " +
        "or copy it to your Downloads folder and run npm run setup-roc-template."
    );
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to download ROC template (${res.status} ${res.statusText})`
    );
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 10_000) {
    throw new Error("Downloaded ROC template looks too small — check ROC_TEMPLATE_URL");
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buffer);
}

export function copyRocTemplateFromDownloads(dest) {
  const src = getDownloadsRocTemplatePath();
  if (!src) {
    throw new Error(
      `Source ROC template not found in Downloads. Expected:\n` +
        `  ${path.join(process.env.USERPROFILE ?? process.env.HOME ?? "", "Downloads", ROC_TEMPLATE_FILENAME)}`
    );
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return src;
}

export async function ensureRocTemplateForBuild(cwd = process.cwd()) {
  const dest = getPublicRocTemplatePath(cwd);
  if (fs.existsSync(dest)) {
    console.log(`ROC template already present at ${dest}`);
    return dest;
  }

  const downloads = getDownloadsRocTemplatePath();
  if (downloads) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(downloads, dest);
    console.log(`Copied ROC template from Downloads → ${dest}`);
    return dest;
  }

  if (process.env.ROC_TEMPLATE_URL?.trim()) {
    await downloadRocTemplateTo(dest);
    console.log(`Downloaded ROC template → ${dest}`);
    return dest;
  }

  console.warn(
    `Warning: ${ROC_TEMPLATE_FILENAME} not found. Official ROC export will fail until ` +
      `the template is in public/templates/ or ROC_TEMPLATE_URL is configured.`
  );
  return null;
}
