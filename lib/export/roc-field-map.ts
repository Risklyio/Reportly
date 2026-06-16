import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RocPdfFieldEntry } from "./roc-pdf-types";
import {
  ROC_PDF_FIELD_MAP_ENTRIES,
  ROC_PDF_FIELD_MAP_GENERATED_AT,
} from "./roc-pdf-field-map.generated";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_MAP_PATH = path.join(process.cwd(), "data", "roc-pdf-field-map.json");

const FALLBACK_MAP_PATHS = [
  DEFAULT_MAP_PATH,
  path.join(MODULE_DIR, "../../data/roc-pdf-field-map.json"),
];

function entriesToMap(entries: RocPdfFieldEntry[]): Map<string, RocPdfFieldEntry> {
  return new Map(entries.map((e) => [e.requirementRef, e]));
}

function loadFromJsonFile(mapPath: string): Map<string, RocPdfFieldEntry> | null {
  if (!fs.existsSync(mapPath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(mapPath, "utf8")) as {
      entries: RocPdfFieldEntry[];
    };
    if (!Array.isArray(data.entries) || data.entries.length === 0) return null;
    return entriesToMap(data.entries);
  } catch {
    return null;
  }
}

function loadBundledEntries(): Map<string, RocPdfFieldEntry> | null {
  if (
    Array.isArray(ROC_PDF_FIELD_MAP_ENTRIES) &&
    ROC_PDF_FIELD_MAP_ENTRIES.length > 0
  ) {
    return entriesToMap(ROC_PDF_FIELD_MAP_ENTRIES);
  }
  return null;
}

export function loadCachedFieldMap(
  mapPath: string = DEFAULT_MAP_PATH
): Map<string, RocPdfFieldEntry> | null {
  const bundled = loadBundledEntries();
  if (bundled) return bundled;

  for (const candidate of new Set([mapPath, ...FALLBACK_MAP_PATHS])) {
    const fromFile = loadFromJsonFile(candidate);
    if (fromFile) return fromFile;
  }

  return null;
}

export function getRocFieldMapPath(): string {
  return DEFAULT_MAP_PATH;
}

export function getRocFieldMapMeta(): {
  generatedAt: string;
  entryCount: number;
} {
  return {
    generatedAt: ROC_PDF_FIELD_MAP_GENERATED_AT,
    entryCount: ROC_PDF_FIELD_MAP_ENTRIES.length,
  };
}
