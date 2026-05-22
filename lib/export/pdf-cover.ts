import type { jsPDF } from "jspdf";
import type { AssessmentExportData } from "./report-data";

const COVER_WHITE: [number, number, number] = [255, 255, 255];
const COVER_BG: [number, number, number] = [242, 241, 237];
const COVER_SUBTLE: [number, number, number] = [228, 232, 232];
const COVER_TEXT: [number, number, number] = [1, 30, 31];
const COVER_MUTED: [number, number, number] = [74, 92, 93];

const NAVY: [number, number, number] = [26, 50, 51];
const DEEP_TEAL: [number, number, number] = [12, 95, 108];
const TEAL: [number, number, number] = [20, 150, 165];
const AQUA: [number, number, number] = [56, 190, 185];
const MINT: [number, number, number] = [146, 252, 219];
const SOFT_MINT: [number, number, number] = [190, 245, 232];

const COVER_MARGIN = 22;
const LOGO_H = 9;
const LOGO_ASPECT = 200 / 44;

type Rgb = [number, number, number];
type TriangleSpec = { color: Rgb; x1: number; y1: number; x2: number; y2: number; x3: number; y3: number };

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

function drawTriangle(doc: jsPDF, t: TriangleSpec) {
  if (typeof doc.triangle !== "function") return;
  doc.setFillColor(...t.color);
  doc.triangle(t.x1, t.y1, t.x2, t.y2, t.x3, t.y3, "F");
}

function drawTriangles(doc: jsPDF, specs: TriangleSpec[]) {
  for (const t of specs) drawTriangle(doc, t);
}

/** Soft large shapes — depth without transparency API */
function drawBackgroundTexture(doc: jsPDF, w: number, h: number) {
  const specs: TriangleSpec[] = [
    {
      color: COVER_SUBTLE,
      x1: w * 0.15,
      y1: h * 0.08,
      x2: w * 0.55,
      y2: h * 0.02,
      x3: w * 0.48,
      y3: h * 0.42,
    },
    {
      color: COVER_BG,
      x1: w * 0.35,
      y1: h * 0.55,
      x2: w * 0.72,
      y2: h * 0.48,
      x3: w * 0.58,
      y3: h * 0.88,
    },
    {
      color: COVER_SUBTLE,
      x1: w * 0.52,
      y1: h * 0.22,
      x2: w * 0.78,
      y2: h * 0.38,
      x3: w * 0.62,
      y3: h * 0.62,
    },
  ];
  drawTriangles(doc, specs);
}

/** Dense cluster — bottom-left (reference image) */
function drawBottomLeftCluster(doc: jsPDF, w: number, h: number) {
  drawTriangles(doc, [
    { color: NAVY, x1: 0, y1: h, x2: 0, y2: h * 0.48, x3: w * 0.46, y3: h },
    { color: DEEP_TEAL, x1: 0, y1: h, x2: w * 0.14, y2: h, x3: w * 0.34, y3: h * 0.68 },
    { color: TEAL, x1: 0, y1: h * 0.82, x2: w * 0.22, y2: h, x3: w * 0.08, y3: h * 0.58 },
    { color: AQUA, x1: w * 0.04, y1: h, x2: w * 0.28, y2: h, x3: w * 0.16, y3: h * 0.76 },
    { color: TEAL, x1: w * 0.12, y1: h * 0.9, x2: w * 0.38, y2: h, x3: w * 0.24, y3: h * 0.62 },
    { color: MINT, x1: w * 0.02, y1: h * 0.72, x2: w * 0.2, y2: h * 0.88, x3: w * 0.1, y3: h * 0.54 },
    { color: SOFT_MINT, x1: w * 0.18, y1: h, x2: w * 0.32, y2: h, x3: w * 0.22, y3: h * 0.8 },
    { color: AQUA, x1: w * 0.26, y1: h * 0.94, x2: w * 0.42, y2: h, x3: w * 0.3, y3: h * 0.7 },
    { color: DEEP_TEAL, x1: w * 0.3, y1: h * 0.78, x2: w * 0.44, y2: h * 0.92, x3: w * 0.36, y3: h * 0.58 },
    { color: NAVY, x1: w * 0.08, y1: h * 0.48, x2: w * 0.2, y2: h * 0.62, x3: w * 0.14, y3: h * 0.4 },
    { color: MINT, x1: w * 0.22, y1: h * 0.52, x2: w * 0.34, y2: h * 0.66, x3: w * 0.26, y3: h * 0.44 },
  ]);
}

/** Dense cluster — top-right */
function drawTopRightCluster(doc: jsPDF, w: number, h: number) {
  drawTriangles(doc, [
    { color: NAVY, x1: w, y1: 0, x2: w, y2: h * 0.42, x3: w * 0.54, y3: 0 },
    { color: DEEP_TEAL, x1: w, y1: 0, x2: w * 0.86, y2: 0, x3: w * 0.66, y3: h * 0.32 },
    { color: TEAL, x1: w * 0.78, y1: 0, x2: w, y2: h * 0.18, x3: w * 0.92, y3: 0 },
    { color: AQUA, x1: w * 0.72, y1: 0, x2: w * 0.94, y2: h * 0.1, x3: w * 0.84, y3: h * 0.24 },
    { color: MINT, x1: w * 0.8, y1: h * 0.06, x2: w * 0.96, y2: h * 0.22, x3: w * 0.88, y3: h * 0.02 },
    { color: SOFT_MINT, x1: w * 0.68, y1: 0, x2: w * 0.82, y2: h * 0.14, x3: w * 0.74, y3: h * 0.28 },
    { color: TEAL, x1: w * 0.58, y1: 0, x2: w * 0.7, y2: h * 0.2, x3: w * 0.62, y3: h * 0.08 },
    { color: AQUA, x1: w * 0.62, y1: h * 0.22, x2: w * 0.76, y2: h * 0.34, x3: w * 0.68, y3: h * 0.12 },
    { color: DEEP_TEAL, x1: w * 0.86, y1: h * 0.28, x2: w, y2: h * 0.38, x3: w * 0.92, y3: h * 0.18 },
  ]);
}

/** Small floating accents between clusters */
function drawScatterAccents(doc: jsPDF, w: number, h: number) {
  drawTriangles(doc, [
    { color: DEEP_TEAL, x1: w * 0.48, y1: h * 0.12, x2: w * 0.52, y2: h * 0.18, x3: w * 0.5, y3: h * 0.08 },
    { color: TEAL, x1: w * 0.44, y1: h * 0.78, x2: w * 0.48, y2: h * 0.84, x3: w * 0.46, y3: h * 0.74 },
    { color: AQUA, x1: w * 0.56, y1: h * 0.38, x2: w * 0.6, y2: h * 0.44, x3: w * 0.58, y3: h * 0.34 },
    { color: MINT, x1: w * 0.38, y1: h * 0.28, x2: w * 0.42, y2: h * 0.34, x3: w * 0.4, y3: h * 0.24 },
    { color: NAVY, x1: w * 0.5, y1: h * 0.58, x2: w * 0.54, y2: h * 0.64, x3: w * 0.52, y3: h * 0.54 },
  ]);
}

function drawAbstractCoverArt(doc: jsPDF, w: number, h: number) {
  doc.setFillColor(...COVER_WHITE);
  doc.rect(0, 0, w, h, "F");
  drawBackgroundTexture(doc, w, h);
  drawBottomLeftCluster(doc, w, h);
  drawTopRightCluster(doc, w, h);
  drawScatterAccents(doc, w, h);
}

export function drawLandscapeCoverPage(
  doc: jsPDF,
  data: AssessmentExportData,
  logoDataUri: string | null
): void {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  drawAbstractCoverArt(doc, w, h);

  doc.setTextColor(...COVER_MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(formatCoverDate(data.assessmentDate), COVER_MARGIN, COVER_MARGIN + 4);

  const titleX = w * 0.36;
  const titleY = h * 0.38;

  doc.setTextColor(...COVER_TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.text("M365 Application", titleX, titleY);

  doc.setFontSize(34);
  doc.text("Compliance", titleX, titleY + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(28);
  doc.setTextColor(...COVER_MUTED);
  doc.text("Assessment Report", titleX, titleY + 28);

  let metaY = titleY + 40;
  if (data.clientName) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COVER_TEXT);
    doc.setFontSize(13);
    doc.text(data.clientName, titleX, metaY);
    metaY += 7;
  }
  if (data.appName) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COVER_MUTED);
    doc.setFontSize(11);
    doc.text(data.appName, titleX, metaY);
    metaY += 6;
  }
  if (data.assessorName) {
    doc.setFontSize(10);
    doc.text(`Assessor: ${data.assessorName}`, titleX, metaY);
  }

  const footerY = h - COVER_MARGIN;
  doc.setFillColor(...COVER_BG);
  doc.roundedRect?.(
    COVER_MARGIN - 2,
    footerY - 18,
    LOGO_H * LOGO_ASPECT + 8,
    16,
    2,
    2,
    "F"
  ) ?? doc.rect(COVER_MARGIN - 2, footerY - 18, LOGO_H * LOGO_ASPECT + 8, 16, "F");

  const logoW = LOGO_H * LOGO_ASPECT;
  const logoY = footerY - 15;
  if (logoDataUri) {
    try {
      doc.addImage(logoDataUri, "PNG", COVER_MARGIN, logoY, logoW, LOGO_H);
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...COVER_TEXT);
      doc.text("Reportly.io", COVER_MARGIN, footerY - 4);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...COVER_TEXT);
    doc.text("Reportly.io", COVER_MARGIN, footerY - 4);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COVER_MUTED);
  doc.text(data.frameworkName, COVER_MARGIN + logoW + 6, footerY - 3);
}
