import type { jsPDF } from "jspdf";
import type { AssessmentExportData } from "./report-data";

/** Dark navy — aligned with Reportly sidebar / reference cover */
const COVER_BG: [number, number, number] = [15, 30, 31];
const COVER_TEXT: [number, number, number] = [255, 255, 255];
const COVER_MUTED: [number, number, number] = [168, 184, 185];
const ACCENT_EMERALD: [number, number, number] = [16, 185, 129];
const ACCENT_TEAL: [number, number, number] = [20, 184, 166];
const ACCENT_PURPLE: [number, number, number] = [99, 102, 241];
const ACCENT_VIOLET: [number, number, number] = [124, 58, 237];
const BRAND_MINT: [number, number, number] = [146, 252, 219];

const COVER_MARGIN = 22;
const LOGO_H = 9;
const LOGO_ASPECT = 200 / 44;

function formatCoverDate(dateStr: string): string {
  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return dateStr || new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Bottom-right folded ribbon (green → purple), reference-style */
function drawCoverAccent(doc: jsPDF, w: number, h: number) {
  if (typeof doc.triangle === "function") {
    doc.setFillColor(...ACCENT_EMERALD);
    doc.triangle(w, h, w, h * 0.38, w * 0.28, h, "F");

    doc.setFillColor(...ACCENT_TEAL);
    doc.triangle(w, h, w * 0.32, h, w, h * 0.48, "F");

    doc.setFillColor(...ACCENT_PURPLE);
    doc.triangle(w, h, w * 0.42, h, w, h * 0.58, "F");

    doc.setFillColor(...ACCENT_VIOLET);
    doc.triangle(w, h, w * 0.52, h, w, h * 0.68, "F");

    doc.setFillColor(...BRAND_MINT);
    doc.triangle(w, h, w * 0.78, h, w, h * 0.82, "F");

    doc.setFillColor(72, 120, 118);
    doc.triangle(w * 0.55, h * 0.72, w * 0.88, h * 0.88, w * 0.72, h, "F");
  } else {
    doc.setFillColor(...ACCENT_TEAL);
    doc.rect(w * 0.5, h * 0.55, w * 0.5, h * 0.45, "F");
    doc.setFillColor(...ACCENT_VIOLET);
    doc.rect(w * 0.65, h * 0.7, w * 0.35, h * 0.3, "F");
  }
}

export function drawLandscapeCoverPage(
  doc: jsPDF,
  data: AssessmentExportData,
  logoDataUri: string | null
): void {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setFillColor(...COVER_BG);
  doc.rect(0, 0, w, h, "F");

  drawCoverAccent(doc, w, h);

  doc.setTextColor(...COVER_MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(formatCoverDate(data.assessmentDate), COVER_MARGIN, COVER_MARGIN + 4);

  const titleX = COVER_MARGIN;
  const titleY = h * 0.4;

  doc.setTextColor(...COVER_TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.text("M365 Application", titleX, titleY);

  doc.setFontSize(36);
  doc.text("Compliance", titleX, titleY + 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(32);
  doc.text("Assessment Report", titleX, titleY + 30);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COVER_MUTED);
  let metaY = titleY + 42;
  if (data.clientName) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COVER_TEXT);
    doc.setFontSize(12);
    doc.text(data.clientName, titleX, metaY);
    metaY += 7;
  }
  if (data.appName) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COVER_MUTED);
    doc.setFontSize(10);
    doc.text(data.appName, titleX, metaY);
    metaY += 6;
  }
  if (data.assessorName) {
    doc.text(`Assessor: ${data.assessorName}`, titleX, metaY);
  }

  const footerY = h - COVER_MARGIN;
  doc.setTextColor(...COVER_MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Prepared by", COVER_MARGIN, footerY - 14);

  const logoW = LOGO_H * LOGO_ASPECT;
  const logoY = footerY - 11;
  if (logoDataUri) {
    try {
      doc.addImage(logoDataUri, "PNG", COVER_MARGIN, logoY, logoW, LOGO_H);
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...COVER_TEXT);
      doc.text("Reportly.io", COVER_MARGIN, footerY - 2);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...COVER_TEXT);
    doc.text("Reportly.io", COVER_MARGIN, footerY - 2);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COVER_MUTED);
  doc.text(data.frameworkName, COVER_MARGIN, footerY + 4);
}
