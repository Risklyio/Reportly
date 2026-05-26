import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";
import type { AssessmentExportData, ExportControlRow } from "./report-data";
import { DOMAIN_EXPORT_KEYS } from "./report-data";
import { drawLandscapeCoverPage } from "./pdf-cover";

type PdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

/* ------------------------------------------------------------------ */
/*  Layout constants                                                   */
/* ------------------------------------------------------------------ */

const MARGIN = 14;
const HEADER_H = 22;
const LOGO_ASPECT = 200 / 44;
const LOGO_DISPLAY_H = 12;
const LOGO_DISPLAY_W = LOGO_DISPLAY_H * LOGO_ASPECT;
const FOOTER_Y_OFFSET = 10;
const CORNER_R = 3;

/* ------------------------------------------------------------------ */
/*  Brand palette (matches app: #060606 / #fcfcfc / #f7f7f7)           */
/* ------------------------------------------------------------------ */

type Rgb = [number, number, number];

const C_BLACK: Rgb = [6, 6, 6];
const C_WHITE: Rgb = [255, 255, 255];
const C_BG: Rgb = [252, 252, 252];
const C_HEADER_BG: Rgb = [247, 247, 247];
const C_BORDER: Rgb = [235, 235, 235];
const C_MUTED: Rgb = [107, 114, 128];
const C_SECTION_BG: Rgb = [245, 245, 245];

/* Outcome badge colours */
const C_GREEN: Rgb = [34, 197, 94];
const C_GREEN_RING: Rgb = [21, 128, 61];
const C_RED: Rgb = [239, 68, 68];
const C_RED_RING: Rgb = [185, 28, 28];
const C_AMBER: Rgb = [245, 158, 11];
const C_AMBER_RING: Rgb = [180, 83, 9];
const C_SLATE: Rgb = [148, 163, 184];
const C_SLATE_RING: Rgb = [100, 116, 139];
const C_BLUE_LIGHT: Rgb = [219, 234, 254];
const C_BLUE_RING: Rgb = [71, 85, 105];
const C_BLUE_TEXT: Rgb = [30, 58, 95];
const C_GREY_LIGHT: Rgb = [226, 232, 240];

const COL_CONTROL = 1;
const COL_OUTCOME = 3;

/* Outcome badge sizing */
const OUTCOME_FONT_SIZE = 5.5;
const BADGE_PAD_X = 1.4;
const BADGE_PAD_Y = 0.55;
const BADGE_ICON = 2.35;
const BADGE_ICON_GAP = 0.45;
const BADGE_MAX_H = 4.1;
const BADGE_R = 2;

type OutcomeVisual = {
  fill: Rgb;
  ring: Rgb;
  text: Rgb;
  short: string;
};

const OUTCOME_VISUALS: Record<string, OutcomeVisual> = {
  "In place": { fill: C_GREEN, ring: C_GREEN_RING, text: C_WHITE, short: "In place" },
  "Not in place": { fill: C_RED, ring: C_RED_RING, text: C_WHITE, short: "Not in place" },
  "Partially in place": { fill: C_AMBER, ring: C_AMBER_RING, text: C_BLACK, short: "Partial" },
  "Not applicable": { fill: C_SLATE, ring: C_SLATE_RING, text: C_WHITE, short: "N/A" },
  Pending: { fill: C_BLUE_LIGHT, ring: C_BLUE_RING, text: C_BLUE_TEXT, short: "Pending" },
  "Not reviewed": { fill: C_GREY_LIGHT, ring: C_SLATE, text: C_MUTED, short: "Open" },
};

/* ------------------------------------------------------------------ */
/*  Domain icon SVG paths (24×24 viewBox, drawn via jsPDF lines)       */
/* ------------------------------------------------------------------ */

const DOMAIN_ICON_MAP: Record<string, string> = {
  application_security: "shield",
  operational_security: "check-circle",
  data_handling: "database",
};

function drawDomainIcon(doc: jsPDF, type: string, cx: number, cy: number, size: number) {
  const s = size / 2;
  doc.setDrawColor(...C_BLACK);
  doc.setLineWidth(0.4);

  switch (type) {
    case "shield": {
      const pts = [
        [cx, cy - s],
        [cx + s * 0.85, cy - s * 0.55],
        [cx + s * 0.85, cy + s * 0.1],
        [cx, cy + s],
        [cx - s * 0.85, cy + s * 0.1],
        [cx - s * 0.85, cy - s * 0.55],
      ];
      for (let i = 0; i < pts.length; i++) {
        const next = pts[(i + 1) % pts.length];
        doc.line(pts[i][0], pts[i][1], next[0], next[1]);
      }
      break;
    }
    case "check-circle": {
      doc.setFillColor(...C_WHITE);
      doc.circle(cx, cy, s, "S");
      const x1 = cx - s * 0.3;
      const y1 = cy + s * 0.05;
      const x2 = cx - s * 0.05;
      const y2 = cy + s * 0.3;
      const x3 = cx + s * 0.35;
      const y3 = cy - s * 0.25;
      doc.line(x1, y1, x2, y2);
      doc.line(x2, y2, x3, y3);
      break;
    }
    case "database": {
      const rx = s * 0.8;
      const ry = s * 0.3;
      const top = cy - s;
      const bot = cy + s;
      doc.ellipse(cx, top + ry, rx, ry, "S");
      doc.line(cx - rx, top + ry, cx - rx, bot - ry);
      doc.line(cx + rx, top + ry, cx + rx, bot - ry);
      const midY = (top + bot) / 2;
      doc.ellipse(cx, midY, rx, ry, "S");
      doc.ellipse(cx, bot - ry, rx, ry, "S");
      break;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Geometry helpers                                                   */
/* ------------------------------------------------------------------ */

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

function roundRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, style: "S" | "F" | "FD") {
  if (typeof doc.roundedRect === "function") {
    doc.roundedRect(x, y, w, h, r, r, style);
  } else {
    doc.rect(x, y, w, h, style);
  }
}

/* ------------------------------------------------------------------ */
/*  Logo                                                               */
/* ------------------------------------------------------------------ */

function loadLogoDataUri(): string | null {
  const logoPath = path.join(process.cwd(), "public", "brand", "reportly-logo.png");
  if (!fs.existsSync(logoPath)) return null;
  const base64 = fs.readFileSync(logoPath).toString("base64");
  return `data:image/png;base64,${base64}`;
}

/* ------------------------------------------------------------------ */
/*  Page header – slim rounded strip at top                            */
/* ------------------------------------------------------------------ */

function drawPageHeader(doc: jsPDF, logoDataUri: string | null) {
  const w = pageWidth(doc);

  doc.setFillColor(...C_HEADER_BG);
  doc.rect(0, 0, w, HEADER_H, "F");
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.3);
  doc.line(0, HEADER_H, w, HEADER_H);

  const logoY = (HEADER_H - LOGO_DISPLAY_H) / 2;
  if (logoDataUri) {
    try {
      doc.addImage(logoDataUri, "PNG", MARGIN, logoY, LOGO_DISPLAY_W, LOGO_DISPLAY_H);
    } catch {
      doc.setTextColor(...C_BLACK);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Reportly.io", MARGIN, 14);
    }
  } else {
    doc.setTextColor(...C_BLACK);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Reportly.io", MARGIN, 14);
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C_MUTED);
  doc.text("M365 Application Compliance Assessment", w - MARGIN, 14, { align: "right" });

  doc.setTextColor(...C_BLACK);
}

function contentStartY(): number {
  return HEADER_H + 8;
}

function addLandscapePage(doc: jsPDF, logoDataUri: string | null) {
  doc.addPage("a4", "landscape");
  drawPageHeader(doc, logoDataUri);
}

/* ------------------------------------------------------------------ */
/*  Text helpers                                                       */
/* ------------------------------------------------------------------ */

const BULLET_INDENT = "   ";
const TABLE_LINE_H = 2.55;

function normalizeCellText(text: string): string {
  const trimmed = text.replace(/\r\n/g, "\n").trim() || "—";
  return indentBulletLines(trimmed);
}

function indentBulletLines(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (/^\s*•\s?/.test(line)) return line.replace(/^(\s*)•\s?/, `$1${BULLET_INDENT}• `);
      if (/^\s*-\s+/.test(line)) return line.replace(/^(\s*)-\s+/, `$1${BULLET_INDENT}- `);
      return line;
    })
    .join("\n");
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

/* ------------------------------------------------------------------ */
/*  Compliance shield for "In place"                                   */
/* ------------------------------------------------------------------ */

function drawComplianceShield(doc: jsPDF, cx: number, cy: number, size: number) {
  const w = size * 0.82;
  const h = size;
  const left = cx - w / 2;
  const top = cy - h / 2;

  doc.setFillColor(...C_WHITE);
  doc.setDrawColor(...C_GREEN_RING);
  doc.setLineWidth(0.2);

  if (typeof doc.roundedRect === "function") {
    doc.roundedRect(left, top, w, h * 0.58, 0.5, 0.5, "F");
    if (typeof doc.triangle === "function") {
      doc.triangle(left, top + h * 0.5, left + w / 2, top + h, left + w, top + h * 0.5, "F");
    }
  } else {
    doc.rect(left, top, w, h * 0.85, "F");
  }

  doc.setDrawColor(22, 101, 52);
  doc.setLineWidth(0.28);
  doc.line(left + w * 0.26, cy + h * 0.06, left + w * 0.4, cy + h * 0.2);
  doc.line(left + w * 0.4, cy + h * 0.2, left + w * 0.74, cy - h * 0.14);
}

/* ------------------------------------------------------------------ */
/*  Outcome badges (pill shape, rounded)                               */
/* ------------------------------------------------------------------ */

function measureOutcomeBadge(doc: jsPDF, label: string, withShield: boolean) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(OUTCOME_FONT_SIZE);
  const textW = doc.getTextWidth(label);
  const textH = typeof doc.getTextDimensions === "function"
    ? doc.getTextDimensions(label).h
    : OUTCOME_FONT_SIZE * 0.352;
  const iconSlot = withShield ? BADGE_ICON + BADGE_ICON_GAP : 0;
  const boxW = textW + iconSlot + BADGE_PAD_X * 2;
  const innerH = Math.max(textH, withShield ? BADGE_ICON : textH);
  const boxH = Math.min(innerH + BADGE_PAD_Y * 2, BADGE_MAX_H);
  return { boxW, boxH, textW };
}

function drawOutcomeBadge(doc: jsPDF, x: number, y: number, width: number, height: number, outcome: string) {
  const visual = OUTCOME_VISUALS[outcome] ?? OUTCOME_VISUALS["Not reviewed"];
  const label = visual.short;
  const withShield = outcome === "In place";
  const { boxW, boxH, textW } = measureOutcomeBadge(doc, label, withShield);

  const cx = x + width / 2;
  const cy = y + height / 2;
  const rx = cx - boxW / 2;
  const ry = cy - boxH / 2;

  doc.setFillColor(...visual.fill);
  roundRect(doc, rx, ry, boxW, boxH, BADGE_R, "F");

  doc.setLineWidth(0.18);
  doc.setDrawColor(...visual.ring);
  roundRect(doc, rx, ry, boxW, boxH, BADGE_R, "S");

  const contentLeft = rx + BADGE_PAD_X;
  if (withShield) {
    drawComplianceShield(doc, contentLeft + BADGE_ICON / 2, cy, BADGE_ICON);
  }

  doc.setTextColor(...visual.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(OUTCOME_FONT_SIZE);
  const textX = contentLeft + (withShield ? BADGE_ICON + BADGE_ICON_GAP : 0) + textW / 2;
  doc.text(label, textX, cy, { align: "center", baseline: "middle" });
}

/* ------------------------------------------------------------------ */
/*  Hard-fail tag                                                      */
/* ------------------------------------------------------------------ */

function drawHardFailTag(doc: jsPDF, x: number, y: number) {
  const tagW = 14;
  const tagH = 3.2;
  doc.setFillColor(254, 226, 226);
  doc.setDrawColor(...C_RED_RING);
  doc.setLineWidth(0.25);
  roundRect(doc, x, y, tagW, tagH, 1.2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.5);
  doc.setTextColor(...C_RED_RING);
  doc.text("HARD FAIL", x + 1.2, y + tagH / 2 + 0.15, { baseline: "middle" });
  doc.setTextColor(...C_BLACK);
}

function hardFailTagY(cellY: number, cellPaddingTop: number, titleLineCount: number): number {
  return cellY + cellPaddingTop + titleLineCount * TABLE_LINE_H + 0.6;
}

/* ------------------------------------------------------------------ */
/*  Domain section title bar with icon                                 */
/* ------------------------------------------------------------------ */

function drawDomainSectionBar(doc: jsPDF, label: string, domainId: string, y: number, w: number) {
  const barH = 10;
  const barX = MARGIN;
  const barW = w - MARGIN * 2;

  doc.setFillColor(...C_SECTION_BG);
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.3);
  roundRect(doc, barX, y - 6, barW, barH, CORNER_R, "FD");

  const iconType = DOMAIN_ICON_MAP[domainId] ?? "shield";
  const iconSize = 5;
  const iconX = barX + 6;
  const iconY = y - 6 + barH / 2;
  drawDomainIcon(doc, iconType, iconX, iconY, iconSize);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_BLACK);
  doc.text(label, iconX + iconSize / 2 + 4, iconY + 0.5, { baseline: "middle" });

  return barH;
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

function addFooter(doc: jsPDF, coverPageCount = 1) {
  const pages = doc.getNumberOfPages();
  const w = pageWidth(doc);
  const h = pageHeight(doc);
  const contentPages = pages - coverPageCount;
  for (let i = 1; i <= pages; i++) {
    if (i <= coverPageCount) continue;
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...C_MUTED);
    const contentIndex = i - coverPageCount;
    doc.text(
      `Reportly.io  —  M365 Application Compliance Assessment  —  Page ${contentIndex} of ${contentPages}`,
      w / 2,
      h - FOOTER_Y_OFFSET,
      { align: "center" }
    );
  }
  doc.setTextColor(...C_BLACK);
}

/* ------------------------------------------------------------------ */
/*  Table body builder                                                 */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Main render                                                        */
/* ------------------------------------------------------------------ */

export function renderAssessmentPdf(data: AssessmentExportData): Buffer {
  const logoDataUri = loadLogoDataUri();
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  /* ---- Cover page ---- */
  drawLandscapeCoverPage(doc, data, logoDataUri);

  /* ---- Page 2: metadata + executive summary ---- */
  doc.addPage("a4", "landscape");
  drawPageHeader(doc, logoDataUri);

  const w = pageWidth(doc);
  let y = contentStartY();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C_BLACK);
  doc.text(data.frameworkName, MARGIN, y);
  y += 9;

  /* Meta block inside a rounded card */
  const metaCardX = MARGIN;
  const metaCardW = w - MARGIN * 2;
  const metaCardH = 32;
  doc.setFillColor(...C_BG);
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.25);
  roundRect(doc, metaCardX, y - 4, metaCardW, metaCardH, CORNER_R, "FD");

  doc.setFontSize(8.5);
  const metaLines: [string, string][] = [
    ["Client:", data.clientName],
    ["Application:", data.appName],
    ["Assessment date:", data.assessmentDate],
    ["Assessor:", data.assessorName || "—"],
    ["Report generated:", data.generatedAt],
  ];
  for (const [label, value] of metaLines) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C_BLACK);
    doc.text(label, MARGIN + 4, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 42, y);
    y += 5;
  }
  y += 5;

  if (data.scopeNotes) {
    y += 1;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Scope:", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const scopeLines = doc.splitTextToSize(data.scopeNotes, w - MARGIN * 2 - 4);
    doc.text(scopeLines, MARGIN, y);
    y += scopeLines.length * 3.5 + 3;
  }

  y += 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C_BLACK);
  doc.text("Executive Summary", MARGIN, y);
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
    styles: { fontSize: 7.5, textColor: C_BLACK, cellPadding: 2.5 },
    headStyles: {
      fillColor: C_HEADER_BG,
      textColor: C_BLACK,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: C_BG },
    tableLineColor: C_BORDER,
    tableLineWidth: 0.2,
    didDrawPage() {
      drawPageHeader(doc, logoDataUri);
    },
  });

  y = tableEndY(doc, y) + 10;

  /* ---- Domain sections ---- */
  for (const domain of DOMAIN_EXPORT_KEYS) {
    const controls = data[domain.controlsKey];
    if (controls.length === 0) continue;

    if (y > contentBottom(doc) - 40) {
      addLandscapePage(doc, logoDataUri);
      y = contentStartY();
    }

    const barH = drawDomainSectionBar(doc, domain.label, domain.id, y, w);
    y += barH + 2;

    const sections = groupBySection(controls);
    for (const [section, rows] of sections) {
      if (y > contentBottom(doc) - 30) {
        addLandscapePage(doc, logoDataUri);
        y = contentStartY();
      }

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C_BLACK);
      doc.text(section, MARGIN + 2, y);
      y += 3;

      const tableBody = controlTableBody(rows);
      const contentW = w - MARGIN * 2;

      const colRef = 10;
      const colOutcome = 24;
      const flexW = contentW - colRef - colOutcome;
      const colControl = Math.round(flexW * 0.17);
      const colReq = Math.round(flexW * 0.30);
      const colGap = Math.round(flexW * 0.22);
      const colAction = flexW - colControl - colReq - colGap;

      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        tableWidth: contentW,
        head: [["#", "Control", "Requirement", "Outcome", "Gap / Reason", "Corrective Action"]],
        body: tableBody,
        styles: {
          fontSize: 6.5,
          cellPadding: 2.5,
          textColor: C_BLACK,
          overflow: "linebreak",
          valign: "top",
          lineColor: C_BORDER,
          lineWidth: 0.15,
        },
        headStyles: {
          fillColor: C_HEADER_BG,
          textColor: C_BLACK,
          fontStyle: "bold",
          fontSize: 6.5,
        },
        columnStyles: {
          0: { cellWidth: colRef },
          1: { cellWidth: colControl },
          2: { cellWidth: colReq },
          3: { cellWidth: colOutcome, halign: "center", valign: "middle" },
          4: { cellWidth: colGap },
          5: { cellWidth: colAction },
        },
        alternateRowStyles: { fillColor: C_BG },
        tableLineColor: C_BORDER,
        tableLineWidth: 0.15,
        didParseCell(hook) {
          if (hook.section !== "body") return;
          const row = rows[hook.row.index];
          if (hook.column.index === COL_OUTCOME) {
            hook.cell.text = [];
          }
          if (hook.column.index === COL_CONTROL && row?.hardFail === "Yes") {
            const pad = 2.5;
            hook.cell.styles.cellPadding = { top: pad, right: pad, bottom: pad + 4.5, left: pad };
          }
        },
        didDrawCell(hook) {
          if (hook.section !== "body") return;
          const row = rows[hook.row.index];
          if (!row) return;

          if (hook.column.index === COL_CONTROL && row.hardFail === "Yes") {
            const pad = typeof hook.cell.padding === "function" ? hook.cell.padding("top") : 2.5;
            const titleLines = Array.isArray(hook.cell.text) ? hook.cell.text.length : 1;
            drawHardFailTag(doc, hook.cell.x + pad, hardFailTagY(hook.cell.y, pad, titleLines));
          }

          if (hook.column.index === COL_OUTCOME) {
            drawOutcomeBadge(doc, hook.cell.x, hook.cell.y, hook.cell.width, hook.cell.height, row.outcome);
          }
        },
        didDrawPage() {
          drawPageHeader(doc, logoDataUri);
        },
      });

      y = tableEndY(doc, y) + 6;
    }
  }

  addFooter(doc, 1);

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
