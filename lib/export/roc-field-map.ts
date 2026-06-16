import fs from "node:fs";
import path from "node:path";
import type { RocPdfFieldEntry } from "./roc-pdf-types";

const DEFAULT_MAP_PATH = path.join(
  process.cwd(),
  "data",
  "roc-pdf-field-map.json"
);

export function loadCachedFieldMap(
  mapPath: string = DEFAULT_MAP_PATH
): Map<string, RocPdfFieldEntry> | null {
  if (!fs.existsSync(mapPath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(mapPath, "utf8")) as {
      entries: RocPdfFieldEntry[];
    };
    if (!Array.isArray(data.entries) || data.entries.length === 0) return null;
    return new Map(data.entries.map((e) => [e.requirementRef, e]));
  } catch {
    return null;
  }
}

export function getRocFieldMapPath(): string {
  return DEFAULT_MAP_PATH;
}
