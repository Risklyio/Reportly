import { createRequire } from "node:module";

const CHECKBOX = "\u2610";
const REQ_LINE = /^(A?\d+(?:\.\d+)+)\s+/;

function groupLines(items, tolerance = 2.5) {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines = [];
  for (const item of sorted) {
    const line = lines.find((l) => Math.abs(l[0].y - item.y) <= tolerance);
    if (line) line.push(item);
    else lines.push([item]);
  }
  for (const line of lines) {
    line.sort((a, b) => a.x - b.x);
  }
  return lines;
}

function lineText(line) {
  return line.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim();
}

function findCheckboxLine(lines, startIdx) {
  for (let i = startIdx; i < Math.min(startIdx + 12, lines.length); i++) {
    const t = lineText(lines[i]);
    if (t.includes(CHECKBOX) && (t.match(/\u2610/g)?.length ?? 0) >= 4) {
      return lines[i];
    }
  }
  return null;
}

function parseRequirementBlock(lines, startIdx, page, ref) {
  let hasAssessmentFindings = false;
  for (let j = startIdx + 1; j < Math.min(startIdx + 8, lines.length); j++) {
    const t = lineText(lines[j]);
    const m = t.match(REQ_LINE);
    if (m && !/\.[a-z]$/i.test(m[1] ?? "") && m[1] !== ref) break;
    if (/Assessment Findings/i.test(t)) {
      hasAssessmentFindings = true;
      break;
    }
  }
  if (!hasAssessmentFindings) return null;

  const cbLine = findCheckboxLine(lines, startIdx + 1);
  if (!cbLine) return null;
  const centers = cbLine
    .filter((i) => i.str.includes(CHECKBOX))
    .map((i) => i.x + i.w / 2)
    .sort((a, b) => a - b);
  if (centers.length < 4) return null;

  const cbY = cbLine[0].y;
  return {
    requirementRef: ref,
    page,
    checkboxes: centers,
    rationale: {
      x: Math.min(...cbLine.map((c) => c.x)),
      y: cbY - 28,
      maxWidth: 520,
      maxLines: 6,
    },
  };
}

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const require = createRequire(import.meta.url);
  const workerPath = require.resolve(
    "pdfjs-dist/legacy/build/pdf.worker.mjs"
  );
  pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
  return pdfjs;
}

export async function buildFieldMapFromPdfBytes(pdfBytes) {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({
    data: pdfBytes,
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;
  const entries = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const items = [];
    for (const raw of content.items) {
      if (!raw.str?.trim()) continue;
      items.push({
        str: raw.str,
        x: raw.transform[4],
        y: raw.transform[5],
        w: raw.width,
        h: raw.height,
      });
    }

    const lines = groupLines(items);
    for (let i = 0; i < lines.length; i++) {
      const text = lineText(lines[i]);
      const m = text.match(REQ_LINE);
      if (!m) continue;
      const ref = m[1];
      if (/\.[a-z]$/i.test(ref)) continue;
      const entry = parseRequirementBlock(lines, i, pageNum, ref);
      if (entry) entries.push(entry);
    }
  }

  const byRef = new Map();
  for (const e of entries) {
    if (!byRef.has(e.requirementRef)) byRef.set(e.requirementRef, e);
  }
  return Array.from(byRef.values());
}

export async function buildFieldMapFromPdfPath(pdfPath) {
  const fs = await import("node:fs");
  const pdfBytes = new Uint8Array(fs.readFileSync(pdfPath));
  return buildFieldMapFromPdfBytes(pdfBytes);
}
