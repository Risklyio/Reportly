import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";
import type { AssessmentExportData, ExportControlRow } from "./report-data";
import { DOMAIN_EXPORT_KEYS } from "./report-data";
import { drawLandscapeCoverPage } from "./pdf-cover";

type PdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

const MARGIN = 14;
const HEADER_H = 26;
const LOGO_ASPECT = 200 / 44;
const LOGO_DISPLAY_H = 11;
const LOGO_DISPLAY_W = LOGO_DISPLAY_H * LOGO_ASPECT;
const FOOTER_Y_OFFSET = 10;

const BRAND_HEADER: [number, number, number] = [6, 6, 6];
const BRAND_MINT: [number, number, number] = [247, 247, 247];
const BRAND_DARK: [number, number, number] = [6, 6, 6];
const BRAND_APP: [number, number, number] = [252, 252, 252];

const COL_CONTROL = 1;
const COL_OUTCOME = 3;

/** Compact outcome badges (fixed size, independent of row height) */
const OUTCOME_FONT_SIZE = 5.5;
const BADGE_PAD_X = 1.4;
const BADGE_PAD_Y = 0.55;
const BADGE_ICON = 2.35;
const BADGE_ICON_GAP = 0.45;
const BADGE_MAX_H = 4.1;

type OutcomeVisual = {
  fill: [number, number, number];
  ring: [number, number, number];
  text: [number, number, number];
  short: string;
};

const OUTCOME_VISUALS: Record<string, OutcomeVisual> = {
  "In place": {
    fill: [34, 197, 94],
    ring: [21, 128, 61],
    text: [255, 255, 255],
    short: "In place",
  },
  "Not in place": {
    fill: [239, 68, 68],
    ring: [185, 28, 28],
    text: [255, 255, 255],
    short: "Not in place",
  },
  "Partially in place": {
    fill: [245, 158, 11],
    ring: [180, 83, 9],
    text: [30, 30, 30],
    short: "Partial",
  },
  "Not applicable": {
    fill: [148, 163, 184],
    ring: [100, 116, 139],
    text: [255, 255, 255],
    short: "N/A",
  },
  Pending: {
    fill: [219, 234, 254],
    ring: [71, 85, 105],
    text: [30, 58, 95],
    short: "Pending",
  },
  "Not reviewed": {
    fill: [226, 232, 240],
    ring: [148, 163, 184],
    text: [71, 85, 105],
    short: "Open",
  },
};

function tableEndY(doc: jsPDF, fallback: number): number {
  return (doc as PdfWithTable).lastAutoTable?.finalY ?? fallback;
}

function pageWidth(doc: jsPDF): number {
  return doc.internal.pageSize.getWidth();
}

function pageHeight(doc: jsPDF): number {
  return doc.internal.pageSize.getHeight();
}

function contentBottom(doc: jsPDF): number {
  return pageHeight(doc) - 14;
}

function loadLogoDataUri(): string | null {
  const logoPath = path.join(
    process.cwd(),
    "public",
    "brand",
    "reportly-logo.png"
  );
  if (!fs.existsSync(logoPath)) return null;
  const base64 = fs.readFileSync(logoPath).toString("base64");
  return `data:image/png;base64,${base64}`;
}

function drawPageHeader(doc: jsPDF, logoDataUri: string | null) {
  const w = pageWidth(doc);
  doc.setFillColor(...BRAND_HEADER);
  doc.rect(0, 0, w, HEADER_H, "F");

  const logoY = (HEADER_H - LOGO_DISPLAY_H) / 2;
  if (logoDataUri) {
    try {
      doc.addImage(
        logoDataUri,
        "PNG",
        MARGIN,
        logoY,
        LOGO_DISPLAY_W,
        LOGO_DISPLAY_H
      );
    } catch {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Reportly.io", MARGIN, 15);
    }
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Reportly.io", MARGIN, 15);
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.text("M365 Application Compliance Assessment", w - MARGIN, 15, {
    align: "right",
  });

  doc.setTextColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
}

function contentStartY(): number {
  return HEADER_H + 8;
}

function addLandscapePage(doc: jsPDF, logoDataUri: string | null) {
  doc.addPage("a4", "landscape");
  drawPageHeader(doc, logoDataUri);
}

function groupBySection(rows: ExportControlRow[]): Map<string, ExportControlRow[]> {
  const map = new Map<string, ExportControlRow[]>();
  for (const row of rows) {
    const list = map.get(row.section) ?? [];
    list.push(row);
    map.set(row.section, list);
  }
  return map;
}

const BULLET_INDENT = "   ";
const TABLE_LINE_H = 2.55;
const BADGE_CORNER_RADIUS = 2;

function normalizeCellText(text: string): string {
  const trimmed = text.replace(/\r\n/g, "\n").trim() || "—";
  return indentBulletLines(trimmed);
}

/** Slight indent for lines that start with bullet characters */
function indentBulletLines(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (/^\s*•\s?/.test(line)) {
        return line.replace(/^(\s*)•\s?/, `$1${BULLET_INDENT}• `);
      }
      if (/^\s*-\s+/.test(line)) {
        return line.replace(/^(\s*)-\s+/, `$1${BULLET_INDENT}- `);
      }
      return line;
    })
    .join("\n");
}

function drawRoundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  style: "S" | "F" | "FD"
) {
  if (typeof doc.roundedRect === "function") {
    doc.roundedRect(x, y, w, h, radius, radius, style);
  } else {
    doc.rect(x, y, w, h, style);
  }
}

/** Small shield with check for “In place” badges */
function drawComplianceShield(
  doc: jsPDF,
  cx: number,
  cy: number,
  size: number
) {
  const w = size * 0.82;
  const h = size;
  const left = cx - w / 2;
  const top = cy - h / 2;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(21, 128, 61);
  doc.setLineWidth(0.2);

  if (typeof doc.roundedRect === "function") {
    doc.roundedRect(left, top, w, h * 0.58, 0.5, 0.5, "F");
    doc.triangle(left, top + h * 0.5, left + w / 2, top + h, left + w, top + h * 0.5, "F");
  } else {
    doc.rect(left, top, w, h * 0.85, "F");
  }

  doc.setDrawColor(22, 101, 52);
  doc.setLineWidth(0.28);
  const x1 = left + w * 0.26;
  const y1 = cy + h * 0.06;
  const x2 = left + w * 0.4;
  const y2 = cy + h * 0.2;
  const x3 = left + w * 0.74;
  const y3 = cy - h * 0.14;
  doc.line(x1, y1, x2, y2);
  doc.line(x2, y2, x3, y3);
}

function measureOutcomeBadge(
  doc: jsPDF,
  label: string,
  withShield: boolean
): { boxW: number; boxH: number; textW: number } {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(OUTCOME_FONT_SIZE);
  const textW = doc.getTextWidth(label);
  const textH =
    typeof doc.getTextDimensions === "function"
      ? doc.getTextDimensions(label).h
      : OUTCOME_FONT_SIZE * 0.352;

  const iconSlot = withShield ? BADGE_ICON + BADGE_ICON_GAP : 0;
  const boxW = textW + iconSlot + BADGE_PAD_X * 2;
  const innerH = Math.max(textH, withShield ? BADGE_ICON : textH);
  const boxH = Math.min(innerH + BADGE_PAD_Y * 2, BADGE_MAX_H);

  return { boxW, boxH, textW };
}

/** Fixed-size pill badge centered in the cell (ignores tall requirement rows). */
function drawOutcomeBadge(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  outcome: string
) {
  const visual = OUTCOME_VISUALS[outcome] ?? OUTCOME_VISUALS["Not reviewed"];
  const label = visual.short;
  const withShield = outcome === "In place";
  const { boxW, boxH, textW } = measureOutcomeBadge(doc, label, withShield);

  const cx = x + width / 2;
  const cy = y + height / 2;
  const rx = cx - boxW / 2;
  const ry = cy - boxH / 2;

  doc.setLineWidth(0.22);
  doc.setDrawColor(...visual.ring);
  drawRoundedRect(doc, rx, ry, boxW, boxH, BADGE_CORNER_RADIUS, "S");

  doc.setFillColor(...visual.fill);
  drawRoundedRect(
    doc,
    rx + 0.25,
    ry + 0.25,
    boxW - 0.5,
    boxH - 0.5,
    BADGE_CORNER_RADIUS - 0.2,
    "F"
  );

  const contentLeft = rx + BADGE_PAD_X;
  if (withShield) {
    drawComplianceShield(doc, contentLeft + BADGE_ICON / 2, cy, BADGE_ICON);
  }

  doc.setTextColor(...visual.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(OUTCOME_FONT_SIZE);
  const textX =
    contentLeft + (withShield ? BADGE_ICON + BADGE_ICON_GAP : 0) + textW / 2;
  doc.text(label, textX, cy, { align: "center", baseline: "middle" });
}

/** Small HARD FAIL tag under control title, left-aligned */
function drawHardFailTag(doc: jsPDF, x: number, y: number) {
  const tagW = 14;
  const tagH = 3.2;
  const tagX = x;
  const tagY = y;

  doc.setFillColor(254, 226, 226);
  doc.setDrawColor(180, 35, 35);
  doc.setLineWidth(0.3);
  drawRoundedRect(doc, tagX, tagY, tagW, tagH, 0.8, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.5);
  doc.setTextColor(180, 35, 35);
  doc.text("HARD FAIL", tagX + 1.2, tagY + tagH / 2 + 0.15, {
    baseline: "middle",
  });
  doc.setTextColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
}

function hardFailTagY(
  cellY: number,
  cellPaddingTop: number,
  titleLineCount: number
): number {
  return cellY + cellPaddingTop + titleLineCount * TABLE_LINE_H + 0.6;
}

function addFooter(doc: jsPDF, coverPageCount = 1) {
  const pages = doc.getNumberOfPages();
  const w = pageWidth(doc);
  const h = pageHeight(doc);
  const contentPages = pages - coverPageCount;
  for (let i = 1; i <= pages; i++) {
    if (i <= coverPageCount) continue;
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const contentIndex = i - coverPageCount;
    doc.text(
      `Reportly.io — M365 Application Compliance Assessment — Page ${contentIndex} of ${contentPages}`,
      w / 2,
      h - FOOTER_Y_OFFSET,
      { align: "center" }
    );
  }
  doc.setTextColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
}

function controlTableBody(rows: ExportControlRow[]): string[][] {
  return rows.map((r) => [
    r.ref,
    normalizeCellText(r.title),
    normalizeCellText(r.requirement),
    r.outcome,
    normalizeCellText(r.reason),
    normalizeCellText(r.correctiveAction),
  ]);
}

export function renderAssessmentPdf(data: AssessmentExportData): Buffer {
  const logoDataUri = loadLogoDataUri();
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  drawLandscapeCoverPage(doc, data, logoDataUri);
  doc.addPage("a4", "landscape");

  const w = pageWidth(doc);
  let y = contentStartY();

  drawPageHeader(doc, logoDataUri);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
  doc.text(data.frameworkName, MARGIN, y);
  y += 9;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const metaLines = [
    [`Client:`, data.clientName],
    [`Application:`, data.appName],
    [`Assessment date:`, data.assessmentDate],
    [`Assessor:`, data.assessorName || "—"],
    [`Report generated:`, data.generatedAt],
  ];
  for (const [label, value] of metaLines) {
    doc.setFont("helvetica", "bold");
    doc.text(label, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 42, y);
    y += 5;
  }

  if (data.scopeNotes) {
    y += 1;
    doc.setFont("helvetica", "bold");
    doc.text("Scope:", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    const scopeLines = doc.splitTextToSize(data.scopeNotes, w - MARGIN * 2);
    doc.text(scopeLines, MARGIN, y);
    y += scopeLines.length * 4 + 3;
  }

  y += 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Executive summary", MARGIN, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Metric", "Count"]],
    body: [
      ["Total controls", String(data.summary.total)],
      ["Controls reviewed", String(data.summary.reviewed)],
      ["In place", String(data.summary.inPlace)],
      ["Not in place", String(data.summary.notInPlace)],
      ["Partially in place", String(data.summary.partiallyInPlace)],
      ["Not applicable", String(data.summary.notApplicable)],
      ["Pending", String(data.summary.pending)],
      ["Not yet reviewed", String(data.summary.notReviewed)],
      ["Hard-fail controls (total)", String(data.summary.hardFailTotal)],
      ["Hard-fail with gaps", String(data.summary.hardFailGaps)],
    ],
    styles: { fontSize: 8, textColor: BRAND_DARK },
    headStyles: {
      fillColor: BRAND_HEADER,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: BRAND_APP },
  });

  y = tableEndY(doc, y) + 10;

  for (const domain of DOMAIN_EXPORT_KEYS) {
    const controls = data[domain.controlsKey];
    if (controls.length === 0) continue;

    if (y > contentBottom(doc) - 40) {
      addLandscapePage(doc, logoDataUri);
      y = contentStartY();
    }

    doc.setFillColor(...BRAND_MINT);
    doc.rect(MARGIN, y - 5, w - MARGIN * 2, 9, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
    doc.text(domain.label, MARGIN + 2, y);
    y += 9;

    const sections = groupBySection(controls);
    for (const [section, rows] of sections) {
      if (y > contentBottom(doc) - 30) {
        addLandscapePage(doc, logoDataUri);
        y = contentStartY();
      }

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(section, MARGIN, y);
      y += 3;

      const tableBody = controlTableBody(rows);
      const contentW = w - MARGIN * 2;

      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [
          [
            "#",
            "Control",
            "Requirement (full text)",
            "Outcome",
            "Gap / reason",
            "Corrective action",
          ],
        ],
        body: tableBody,
        styles: {
          fontSize: 6.5,
          cellPadding: 2.5,
          textColor: BRAND_DARK,
          overflow: "linebreak",
          valign: "top",
        },
        headStyles: {
          fillColor: BRAND_HEADER,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 6.5,
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: contentW * 0.16 },
          2: { cellWidth: contentW * 0.27 },
          3: { cellWidth: 26, halign: "center", valign: "middle" },
          4: { cellWidth: contentW * 0.17 },
          5: { cellWidth: contentW * 0.28 },
        },
        alternateRowStyles: { fillColor: BRAND_APP },
        didParseCell(hook) {
          if (hook.section !== "body") return;
          const row = rows[hook.row.index];
          if (hook.column.index === COL_OUTCOME) {
            hook.cell.text = [];
          }
          if (hook.column.index === COL_CONTROL && row?.hardFail === "Yes") {
            const pad = 2.5;
            hook.cell.styles.cellPadding = {
              top: pad,
              right: pad,
              bottom: pad + 4.5,
              left: pad,
            };
          }
        },
        didDrawCell(hook) {
          if (hook.section !== "body") return;
          const row = rows[hook.row.index];
          if (!row) return;

          if (hook.column.index === COL_CONTROL && row.hardFail === "Yes") {
            const pad =
              typeof hook.cell.padding === "function"
                ? hook.cell.padding("top")
                : 2.5;
            const titleLines = Array.isArray(hook.cell.text)
              ? hook.cell.text.length
              : 1;
            const tagY = hardFailTagY(hook.cell.y, pad, titleLines);
            drawHardFailTag(doc, hook.cell.x + pad, tagY);
          }

          if (hook.column.index === COL_OUTCOME) {
            drawOutcomeBadge(
              doc,
              hook.cell.x,
              hook.cell.y,
              hook.cell.width,
              hook.cell.height,
              row.outcome
            );
          }
        },
      });

      y = tableEndY(doc, y) + 6;
    }
  }

  addFooter(doc, 1);

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
