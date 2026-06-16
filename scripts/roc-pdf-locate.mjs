/**
 * Shared ROC PDF field-location logic (pdf.js coordinates, origin bottom-left).
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const CHECKBOX_CHARS = /[\u2610\u25A1]/;
const REQ_LINE = /^(A?\d+(?:\.\d+)+)\s+/;
const REQ_ONLY = /^(A?\d+(?:\.\d+)+)$/;

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

function countCheckboxes(text) {
  return text.match(/[\u2610\u25A1]/g)?.length ?? 0;
}

function parseRefFromLine(text) {
  const m = text.match(REQ_LINE);
  if (m) return m[1];
  if (REQ_ONLY.test(text)) return text;
  return null;
}

function isProcedureRef(ref) {
  return /\.[a-z]$/i.test(ref);
}

function isNextRequirementLine(text, ref) {
  const nextRef = parseRefFromLine(text);
  if (!nextRef || isProcedureRef(nextRef)) return false;
  return nextRef !== ref;
}

function extractPrintedPage(items, pageWidth = 612) {
  for (const item of items) {
    if (item.y > 55) continue;
    if (item.x < pageWidth * 0.72) continue;
    const n = parseInt(item.str.trim(), 10);
    if (!Number.isNaN(n) && n > 0 && n < 500) return n;
  }
  return null;
}

function findAssessmentFindingsIdx(lines, startIdx, ref) {
  for (let j = startIdx + 1; j < Math.min(startIdx + 28, lines.length); j++) {
    const t = lineText(lines[j]);
    if (isNextRequirementLine(t, ref)) break;

    if (/Assessment Findings/i.test(t)) return j;

    if (j + 1 < lines.length) {
      const combined = `${t} ${lineText(lines[j + 1])}`;
      if (/Assessment Findings/i.test(combined)) return j;
    }
  }
  return -1;
}

function findDescribeWhyIdx(lines, startIdx, ref) {
  for (let j = startIdx + 1; j < Math.min(startIdx + 28, lines.length); j++) {
    const t = lineText(lines[j]);
    if (isNextRequirementLine(t, ref)) break;
    if (/Describe why/i.test(t)) return j;
  }
  return -1;
}

function findCheckboxLine(lines, startIdx) {
  for (let i = startIdx; i < Math.min(startIdx + 24, lines.length); i++) {
    const t = lineText(lines[i]);
    if (countCheckboxes(t) >= 4) return lines[i];
    if (/In Place/i.test(t) && /Not Applicable/i.test(t)) {
      if (countCheckboxes(t) >= 1) return lines[i];
      if (i + 1 < lines.length && countCheckboxes(lineText(lines[i + 1])) >= 4) {
        return lines[i + 1];
      }
    }
    if (/Select if below/i.test(t) && i + 1 < lines.length) {
      const next = lineText(lines[i + 1]);
      if (countCheckboxes(next) >= 4) return lines[i + 1];
    }
  }
  return null;
}

function checkboxCenters(cbLine) {
  const fromGlyphs = cbLine
    .filter((i) => CHECKBOX_CHARS.test(i.str))
    .map((i) => i.x + i.w / 2);
  if (fromGlyphs.length >= 4) {
    return fromGlyphs.sort((a, b) => a - b);
  }
  const t = lineText(cbLine);
  const count = countCheckboxes(t);
  if (count < 4) return [];
  const minX = Math.min(...cbLine.map((c) => c.x));
  const maxX = Math.max(...cbLine.map((c) => c.x + c.w));
  const span = maxX - minX;
  const step = span / Math.max(count - 1, 1);
  return Array.from({ length: count }, (_, idx) => minX + step * idx);
}

function parseRequirementBlock(lines, startIdx, page, pageHeight, printedPage, ref) {
  const startText = lineText(lines[startIdx]);
  const startRef = parseRefFromLine(startText);
  if (!startRef || startRef !== ref || isProcedureRef(startRef)) return null;

  let assessmentFindingsIdx = -1;
  let describeWhyIdx = -1;

  assessmentFindingsIdx = findAssessmentFindingsIdx(lines, startIdx, ref);
  if (assessmentFindingsIdx < 0) return null;

  describeWhyIdx = findDescribeWhyIdx(lines, startIdx, ref);

  const cbLine =
    findCheckboxLine(lines, assessmentFindingsIdx) ??
    findCheckboxLine(lines, startIdx + 1);
  if (!cbLine) return null;

  const centers = checkboxCenters(cbLine);
  if (centers.length < 4) return null;

  const checkboxY = cbLine[0].y;
  let rationaleX = Math.min(...cbLine.map((c) => c.x));
  let rationaleY = checkboxY - 36;

  if (describeWhyIdx >= 0) {
    const describeLine = lines[describeWhyIdx];
    rationaleX = Math.min(...describeLine.map((c) => c.x));
    rationaleY = describeLine[0].y - 16;
  }

  return {
    requirementRef: ref,
    page,
    ...(printedPage != null ? { printedPage } : {}),
    pageHeight,
    checkboxes: centers,
    checkboxY,
    rationale: {
      x: rationaleX,
      y: rationaleY,
      maxWidth: 500,
      maxLines: 8,
    },
  };
}

function scoreEntry(entry) {
  let score = entry.page * 100;
  if (entry.printedPage != null) score += entry.printedPage * 10;
  if (entry.rationale?.y) score += 50;
  return score;
}

function pickBestEntries(entries) {
  const byRef = new Map();
  for (const e of entries) {
    const prev = byRef.get(e.requirementRef);
    if (!prev || scoreEntry(e) > scoreEntry(prev)) {
      byRef.set(e.requirementRef, e);
    }
  }
  return Array.from(byRef.values());
}

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const require = createRequire(import.meta.url);
  const workerPath = require.resolve(
    "pdfjs-dist/legacy/build/pdf.worker.mjs"
  );
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
  return pdfjs;
}

function itemsFromContent(content) {
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
  return items;
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
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items = itemsFromContent(content);
    const printedPage = extractPrintedPage(items, viewport.width);
    const lines = groupLines(items);

    for (let i = 0; i < lines.length; i++) {
      const text = lineText(lines[i]);
      const ref = parseRefFromLine(text);
      if (!ref || isProcedureRef(ref)) continue;
      const entry = parseRequirementBlock(
        lines,
        i,
        pageNum,
        viewport.height,
        printedPage,
        ref
      );
      if (entry) entries.push(entry);
    }
  }

  return pickBestEntries(entries);
}

export async function buildFieldMapFromPdfPath(pdfPath) {
  const fs = await import("node:fs");
  const pdfBytes = new Uint8Array(fs.readFileSync(pdfPath));
  return buildFieldMapFromPdfBytes(pdfBytes);
}

export async function locateRequirementInPdf(pdfBytes, requirementRef) {
  const entries = await buildFieldMapFromPdfBytes(pdfBytes);
  return entries.find((e) => e.requirementRef === requirementRef) ?? null;
}
