/**
 * Shared ROC PDF field-location logic (pdf.js coordinates, origin bottom-left).
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

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

function extractPrintedPage(items, pageWidth = 612) {
  for (const item of items) {
    if (item.y > 55) continue;
    if (item.x < pageWidth * 0.72) continue;
    const n = parseInt(item.str.trim(), 10);
    if (!Number.isNaN(n) && n > 0 && n < 500) return n;
  }
  return null;
}

function findCheckboxLine(lines, startIdx) {
  for (let i = startIdx; i < Math.min(startIdx + 15, lines.length); i++) {
    const t = lineText(lines[i]);
    const boxes = t.match(/\u2610/g)?.length ?? 0;
    if (boxes >= 4) return lines[i];
  }
  return null;
}

function parseRequirementBlock(lines, startIdx, page, pageHeight, printedPage, ref) {
  const startText = lineText(lines[startIdx]);
  const startMatch = startText.match(REQ_LINE);
  if (!startMatch || startMatch[1] !== ref) return null;

  let assessmentFindingsIdx = -1;
  let describeWhyIdx = -1;

  for (let j = startIdx + 1; j < Math.min(startIdx + 18, lines.length); j++) {
    const t = lineText(lines[j]);
    const m = t.match(REQ_LINE);
    if (m && !/\.[a-z]$/i.test(m[1] ?? "") && m[1] !== ref) break;

    if (/Assessment Findings\s*\(check one\)/i.test(t)) {
      assessmentFindingsIdx = j;
    }
    if (/Describe why the assessment finding was selected/i.test(t)) {
      describeWhyIdx = j;
    }
  }

  if (assessmentFindingsIdx < 0 || describeWhyIdx < 0) return null;

  const cbLine =
    findCheckboxLine(lines, assessmentFindingsIdx) ??
    findCheckboxLine(lines, startIdx + 1);
  if (!cbLine) return null;

  const centers = cbLine
    .filter((i) => i.str.includes(CHECKBOX))
    .map((i) => i.x + i.w / 2)
    .sort((a, b) => a - b);
  if (centers.length < 4) return null;

  const checkboxY = cbLine[0].y;
  const describeLine = lines[describeWhyIdx];
  const rationaleX = Math.min(...describeLine.map((c) => c.x));
  const rationaleY = describeLine[0].y - 16;

  return {
    requirementRef: ref,
    page,
    printedPage,
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
      const m = text.match(REQ_LINE);
      if (!m) continue;
      const ref = m[1];
      if (/\.[a-z]$/i.test(ref)) continue;
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
