import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const ROC_TEMPLATE_FILENAME = "PCI-DSS-v4-0-1-ROC-Template-r3.pdf";

const PUBLIC_TEMPLATE_DIR = path.join(
  process.cwd(),
  "public",
  "templates"
);

export function getPublicRocTemplatePath(): string {
  return path.join(PUBLIC_TEMPLATE_DIR, ROC_TEMPLATE_FILENAME);
}

function getDownloadsRocTemplatePath(): string | null {
  const home = process.env.USERPROFILE ?? process.env.HOME ?? "";
  if (!home) return null;
  const downloads = path.join(home, "Downloads", ROC_TEMPLATE_FILENAME);
  return fs.existsSync(downloads) ? downloads : null;
}

function getTmpRocTemplatePath(): string {
  return path.join(os.tmpdir(), "reportly-roc-template.pdf");
}

function getEnvRocTemplatePath(): string | null {
  const custom = process.env.ROC_TEMPLATE_PATH?.trim();
  if (!custom) return null;
  return fs.existsSync(custom) ? custom : null;
}

/** All on-disk locations checked in priority order. */
export function findRocTemplateOnDisk(): string | null {
  const candidates = [
    getPublicRocTemplatePath(),
    getEnvRocTemplatePath(),
    getTmpRocTemplatePath(),
    getDownloadsRocTemplatePath(),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export function getRocTemplatePath(): string {
  const found = findRocTemplateOnDisk();
  if (found) return found;

  throw new Error(buildRocTemplateMissingMessage());
}

export function buildRocTemplateMissingMessage(): string {
  return (
    `ROC template not found (${ROC_TEMPLATE_FILENAME}). ` +
    `For local dev, run: npm run setup-roc-template. ` +
    `For Vercel, commit the PDF to public/templates/ or set ROC_TEMPLATE_URL ` +
    `to a publicly accessible copy of the official PCI SSC template.`
  );
}

async function downloadRocTemplateTo(dest: string): Promise<void> {
  const url = process.env.ROC_TEMPLATE_URL?.trim();
  if (!url) {
    throw new Error(
      "ROC_TEMPLATE_URL is not set. Add it in Vercel environment variables " +
        "pointing to the official ROC PDF, or commit public/templates/" +
        ROC_TEMPLATE_FILENAME
    );
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to download ROC template from ROC_TEMPLATE_URL (${res.status} ${res.statusText})`
    );
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 10_000) {
    throw new Error(
      "Downloaded ROC template looks too small — check ROC_TEMPLATE_URL"
    );
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buffer);
}

/** Resolve template bytes at runtime (supports URL fetch + /tmp cache on serverless). */
export async function resolveRocTemplateBytes(): Promise<Uint8Array> {
  const onDisk = findRocTemplateOnDisk();
  if (onDisk) {
    return new Uint8Array(fs.readFileSync(onDisk));
  }

  const tmpPath = getTmpRocTemplatePath();
  await downloadRocTemplateTo(tmpPath);
  return new Uint8Array(fs.readFileSync(tmpPath));
}

/** Copy template into public/templates for git commit / static deploy. */
export function ensureRocTemplateInPublic(): string {
  const dest = getPublicRocTemplatePath();
  if (fs.existsSync(dest)) return dest;

  const downloads = getDownloadsRocTemplatePath();
  if (downloads) {
    fs.mkdirSync(PUBLIC_TEMPLATE_DIR, { recursive: true });
    fs.copyFileSync(downloads, dest);
    return dest;
  }

  throw new Error(
    `Source ROC template not found. Place ${ROC_TEMPLATE_FILENAME} in your Downloads folder ` +
      `or set ROC_TEMPLATE_URL before running setup.`
  );
}

/** Build-time helper: populate public/templates from Downloads or ROC_TEMPLATE_URL. */
export async function ensureRocTemplateForBuild(): Promise<string | null> {
  const dest = getPublicRocTemplatePath();
  if (fs.existsSync(dest)) {
    console.log(`ROC template already present at ${dest}`);
    return dest;
  }

  const downloads = getDownloadsRocTemplatePath();
  if (downloads) {
    fs.mkdirSync(PUBLIC_TEMPLATE_DIR, { recursive: true });
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
