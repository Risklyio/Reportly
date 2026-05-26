import type { jsPDF } from "jspdf";
import type { AssessmentExportData } from "./report-data";

/* ------------------------------------------------------------------ */
/*  Brand palette                                                      */
/* ------------------------------------------------------------------ */
type Rgb = [number, number, number];

const WHITE: Rgb = [255, 255, 255];
const BG: Rgb = [252, 252, 252];
const BLACK: Rgb = [6, 6, 6];
const MUTED: Rgb = [107, 114, 128];

const COVER_MARGIN = 24;
const LOGO_H = 10;
const LOGO_ASPECT = 200 / 44;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCoverDate(dateStr: string): string {
  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return (
    dateStr ||
    new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  );
}

function tri(doc: jsPDF, c: Rgb, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
  if (typeof doc.triangle !== "function") return;
  doc.setFillColor(...c);
  doc.triangle(x1, y1, x2, y2, x3, y3, "F");
}

function roundRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, style: "F" | "S" | "FD") {
  if (typeof doc.roundedRect === "function") {
    doc.roundedRect(x, y, w, h, r, r, style);
  } else {
    doc.rect(x, y, w, h, style);
  }
}

/* ------------------------------------------------------------------ */
/*  Abstract cover art – premium geometric composition                 */
/*                                                                     */
/*  Layered triangular shards in a gradient from deep black (#060606)  */
/*  through warm greys to light silver, clustered in bottom-left and   */
/*  top-right with subtle scattered accents in the centre field.       */
/* ------------------------------------------------------------------ */

const SHARD_DARK: Rgb = [6, 6, 6];
const SHARD_CHARCOAL: Rgb = [28, 28, 28];
const SHARD_GRAPHITE: Rgb = [48, 48, 48];
const SHARD_STEEL: Rgb = [72, 72, 72];
const SHARD_SLATE: Rgb = [100, 100, 100];
const SHARD_ASH: Rgb = [140, 140, 140];
const SHARD_SILVER: Rgb = [185, 185, 185];
const SHARD_MIST: Rgb = [215, 215, 215];
const SHARD_CLOUD: Rgb = [232, 232, 232];

function drawCoverArt(doc: jsPDF, w: number, h: number) {
  doc.setFillColor(...WHITE);
  doc.rect(0, 0, w, h, "F");

  doc.setFillColor(...BG);
  doc.rect(0, 0, w, h, "F");

  /* --- bottom-left cluster (dense, dark) --- */
  tri(doc, SHARD_DARK,      0,         h,          0,         h * 0.40,  w * 0.50,  h);
  tri(doc, SHARD_CHARCOAL,  0,         h,          w * 0.18,  h,         w * 0.38,  h * 0.58);
  tri(doc, SHARD_GRAPHITE,  0,         h * 0.74,   w * 0.26,  h,         w * 0.10,  h * 0.50);
  tri(doc, SHARD_STEEL,     w * 0.06,  h,          w * 0.32,  h,         w * 0.18,  h * 0.68);
  tri(doc, SHARD_GRAPHITE,  w * 0.14,  h * 0.84,   w * 0.42,  h,         w * 0.28,  h * 0.56);
  tri(doc, SHARD_ASH,       w * 0.02,  h * 0.64,   w * 0.22,  h * 0.82,  w * 0.12,  h * 0.48);
  tri(doc, SHARD_SILVER,    w * 0.20,  h,          w * 0.36,  h,         w * 0.24,  h * 0.76);
  tri(doc, SHARD_SLATE,     w * 0.28,  h * 0.88,   w * 0.46,  h,         w * 0.34,  h * 0.64);
  tri(doc, SHARD_CHARCOAL,  w * 0.34,  h * 0.72,   w * 0.48,  h * 0.88,  w * 0.40,  h * 0.52);
  tri(doc, SHARD_DARK,      w * 0.10,  h * 0.44,   w * 0.22,  h * 0.58,  w * 0.16,  h * 0.36);
  tri(doc, SHARD_MIST,      w * 0.24,  h * 0.50,   w * 0.38,  h * 0.64,  w * 0.30,  h * 0.40);
  tri(doc, SHARD_CLOUD,     w * 0.36,  h * 0.82,   w * 0.50,  h * 0.96,  w * 0.44,  h * 0.70);

  /* --- top-right cluster (crisp, lighter towards edges) --- */
  tri(doc, SHARD_DARK,      w,         0,          w,         h * 0.38,  w * 0.52,  0);
  tri(doc, SHARD_CHARCOAL,  w,         0,          w * 0.82,  0,         w * 0.62,  h * 0.30);
  tri(doc, SHARD_GRAPHITE,  w * 0.76,  0,          w,         h * 0.16,  w * 0.90,  0);
  tri(doc, SHARD_STEEL,     w * 0.70,  0,          w * 0.92,  h * 0.12,  w * 0.82,  h * 0.24);
  tri(doc, SHARD_ASH,       w * 0.78,  h * 0.06,   w * 0.96,  h * 0.22,  w * 0.86,  h * 0.02);
  tri(doc, SHARD_SILVER,    w * 0.66,  0,          w * 0.80,  h * 0.14,  w * 0.72,  h * 0.28);
  tri(doc, SHARD_SLATE,     w * 0.56,  0,          w * 0.68,  h * 0.18,  w * 0.60,  h * 0.08);
  tri(doc, SHARD_MIST,      w * 0.60,  h * 0.20,   w * 0.74,  h * 0.34,  w * 0.66,  h * 0.12);
  tri(doc, SHARD_CHARCOAL,  w * 0.84,  h * 0.26,   w,         h * 0.36,  w * 0.92,  h * 0.16);
  tri(doc, SHARD_CLOUD,     w * 0.72,  h * 0.04,   w * 0.88,  h * 0.18,  w * 0.80,  h * 0.30);

  /* --- scattered accents (centre field) --- */
  tri(doc, SHARD_CHARCOAL,  w * 0.48,  h * 0.10,   w * 0.52,  h * 0.16,  w * 0.50,  h * 0.06);
  tri(doc, SHARD_GRAPHITE,  w * 0.44,  h * 0.76,   w * 0.48,  h * 0.82,  w * 0.46,  h * 0.72);
  tri(doc, SHARD_STEEL,     w * 0.56,  h * 0.36,   w * 0.60,  h * 0.42,  w * 0.58,  h * 0.32);
  tri(doc, SHARD_ASH,       w * 0.38,  h * 0.26,   w * 0.42,  h * 0.32,  w * 0.40,  h * 0.22);
  tri(doc, SHARD_DARK,      w * 0.52,  h * 0.56,   w * 0.56,  h * 0.62,  w * 0.54,  h * 0.52);
  tri(doc, SHARD_SILVER,    w * 0.62,  h * 0.68,   w * 0.66,  h * 0.74,  w * 0.64,  h * 0.64);
  tri(doc, SHARD_MIST,      w * 0.46,  h * 0.44,   w * 0.50,  h * 0.50,  w * 0.48,  h * 0.40);
}

/* ------------------------------------------------------------------ */
/*  Divider line                                                       */
/* ------------------------------------------------------------------ */

function drawAccentLine(doc: jsPDF, x: number, y: number, len: number) {
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.6);
  doc.line(x, y, x + len, y);
}

/* ------------------------------------------------------------------ */
/*  Main cover page export                                             */
/* ------------------------------------------------------------------ */

export function drawLandscapeCoverPage(
  doc: jsPDF,
  data: AssessmentExportData,
  logoDataUri: string | null
): void {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  drawCoverArt(doc, w, h);

  /* --- Logo (top-left, inside a frosted card) --- */
  const logoW = LOGO_H * LOGO_ASPECT;
  const cardX = COVER_MARGIN;
  const cardY = COVER_MARGIN - 4;
  const cardW = logoW + 12;
  const cardH = LOGO_H + 8;

  doc.setFillColor(255, 255, 255);
  roundRect(doc, cardX, cardY, cardW, cardH, 4, "F");

  if (logoDataUri) {
    try {
      doc.addImage(logoDataUri, "PNG", cardX + 6, cardY + 4, logoW, LOGO_H);
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(...BLACK);
      doc.text("Reportly.io", cardX + 6, cardY + LOGO_H + 1);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...BLACK);
    doc.text("Reportly.io", cardX + 6, cardY + LOGO_H + 1);
  }

  /* --- Date (top-right) --- */
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(formatCoverDate(data.assessmentDate), w - COVER_MARGIN, COVER_MARGIN + 2, { align: "right" });

  /* --- Central content card (frosted panel) --- */
  const panelX = w * 0.32;
  const panelY = h * 0.30;
  const panelW = w * 0.58;
  const panelH = h * 0.46;

  doc.setFillColor(255, 255, 255);
  roundRect(doc, panelX, panelY, panelW, panelH, 6, "F");

  const textX = panelX + 18;
  let ty = panelY + 24;

  /* Title */
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text("M365 Application", textX, ty);
  ty += 13;
  doc.text("Compliance", textX, ty);
  ty += 15;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(22);
  doc.setTextColor(...MUTED);
  doc.text("Assessment Report", textX, ty);
  ty += 10;

  drawAccentLine(doc, textX, ty, 50);
  ty += 10;

  /* Meta */
  if (data.clientName) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    doc.setFontSize(13);
    doc.text(data.clientName, textX, ty);
    ty += 7;
  }
  if (data.appName) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.setFontSize(11);
    doc.text(data.appName, textX, ty);
    ty += 6;
  }
  if (data.assessorName) {
    doc.setFontSize(10);
    doc.text(`Assessor: ${data.assessorName}`, textX, ty);
  }

  /* --- Footer badge --- */
  const footerY = h - COVER_MARGIN;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(data.frameworkName, COVER_MARGIN, footerY);
}
