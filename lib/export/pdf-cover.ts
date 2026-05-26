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
const HEADER_BG: Rgb = [247, 247, 247];
const BORDER: Rgb = [235, 235, 235];

const COVER_MARGIN = 28;
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

function roundRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, style: "F" | "S" | "FD") {
  if (typeof doc.roundedRect === "function") {
    doc.roundedRect(x, y, w, h, r, r, style);
  } else {
    doc.rect(x, y, w, h, style);
  }
}

/* ------------------------------------------------------------------ */
/*  Clean, professional cover layout (no triangles)                    */
/* ------------------------------------------------------------------ */

export function drawLandscapeCoverPage(
  doc: jsPDF,
  data: AssessmentExportData,
  logoDataUri: string | null
): void {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  /* Solid white background */
  doc.setFillColor(...WHITE);
  doc.rect(0, 0, w, h, "F");

  /* Top header strip – #f7f7f7 */
  const headerH = 20;
  doc.setFillColor(...HEADER_BG);
  doc.rect(0, 0, w, headerH, "F");
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(0, headerH, w, headerH);

  /* Logo in header */
  const logoW = LOGO_H * LOGO_ASPECT;
  const logoY = (headerH - LOGO_H) / 2;
  if (logoDataUri) {
    try {
      doc.addImage(logoDataUri, "PNG", COVER_MARGIN, logoY, logoW, LOGO_H);
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...BLACK);
      doc.text("Reportly.io", COVER_MARGIN, headerH / 2 + 2);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...BLACK);
    doc.text("Reportly.io", COVER_MARGIN, headerH / 2 + 2);
  }

  /* Date in header (right-aligned) */
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(formatCoverDate(data.assessmentDate), w - COVER_MARGIN, headerH / 2 + 1, { align: "right" });

  /* ---- Central content area ---- */

  const contentY = h * 0.32;
  const textX = COVER_MARGIN;

  /* Thin accent line above title */
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.8);
  doc.line(textX, contentY - 6, textX + 60, contentY - 6);

  /* Title */
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.text("M365 Application", textX, contentY);

  doc.setFontSize(34);
  doc.text("Compliance", textX, contentY + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(24);
  doc.setTextColor(...MUTED);
  doc.text("Assessment Report", textX, contentY + 30);

  /* Meta info card */
  let metaY = contentY + 46;
  const cardX = textX;
  const cardW = w * 0.45;
  const cardH = 34;

  doc.setFillColor(...BG);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.25);
  roundRect(doc, cardX, metaY - 5, cardW, cardH, 4, "FD");

  const labelX = cardX + 8;
  const valueX = cardX + 40;

  if (data.clientName) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    doc.setFontSize(10);
    doc.text("Client", labelX, metaY + 2);
    doc.setFont("helvetica", "normal");
    doc.text(data.clientName, valueX, metaY + 2);
    metaY += 7;
  }
  if (data.appName) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    doc.setFontSize(10);
    doc.text("Application", labelX, metaY + 2);
    doc.setFont("helvetica", "normal");
    doc.text(data.appName, valueX, metaY + 2);
    metaY += 7;
  }
  if (data.assessorName) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    doc.setFontSize(10);
    doc.text("Assessor", labelX, metaY + 2);
    doc.setFont("helvetica", "normal");
    doc.text(data.assessorName, valueX, metaY + 2);
  }

  /* ---- Bottom footer ---- */
  const footerH = 14;
  const footerY = h - footerH;
  doc.setFillColor(...HEADER_BG);
  doc.rect(0, footerY, w, footerH, "F");
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(0, footerY, w, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(data.frameworkName, COVER_MARGIN, footerY + footerH / 2 + 1, { baseline: "middle" });
  doc.text("Confidential", w - COVER_MARGIN, footerY + footerH / 2 + 1, { align: "right", baseline: "middle" });
}
