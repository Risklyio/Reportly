import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AssessmentExportData, ExportControlRow } from "./report-data";
import { DOMAIN_EXPORT_KEYS } from "./report-data";

type PdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

function tableEndY(doc: jsPDF, fallback: number): number {
  return (doc as PdfWithTable).lastAutoTable?.finalY ?? fallback;
}

const BRAND_HEADER: [number, number, number] = [26, 50, 51];
const BRAND_MINT: [number, number, number] = [146, 252, 219];
const BRAND_DARK: [number, number, number] = [1, 30, 31];

function truncate(text: string, max = 120): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
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

function addFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Reportly.io — M365 Application Compliance Assessment — Page ${i} of ${pages}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
  doc.setTextColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
}

export function renderAssessmentPdf(data: AssessmentExportData): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  doc.setFillColor(...BRAND_HEADER);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Reportly.io", 14, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Compliance Assessment Report", 14, 21);

  doc.setTextColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
  y = 38;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(data.frameworkName, 14, y);
  y += 10;

  doc.setFontSize(10);
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
    doc.text(label, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 48, y);
    y += 6;
  }

  if (data.scopeNotes) {
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.text("Scope:", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const scopeLines = doc.splitTextToSize(data.scopeNotes, pageWidth - 28);
    doc.text(scopeLines, 14, y);
    y += scopeLines.length * 5 + 4;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Executive summary", 14, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [["Metric", "Count"]],
    body: [
      ["Total controls", String(data.summary.total)],
      ["Controls reviewed", String(data.summary.reviewed)],
      ["In place", String(data.summary.inPlace)],
      ["Not in place", String(data.summary.notInPlace)],
      ["Partially in place", String(data.summary.partiallyInPlace)],
      ["Not applicable", String(data.summary.notApplicable)],
      ["Not yet reviewed", String(data.summary.notReviewed)],
      ["Hard-fail controls (total)", String(data.summary.hardFailTotal)],
      ["Hard-fail with gaps", String(data.summary.hardFailGaps)],
    ],
    styles: { fontSize: 9, textColor: BRAND_DARK },
    headStyles: {
      fillColor: BRAND_HEADER,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [242, 241, 237] },
  });

  y = tableEndY(doc, y) + 12;

  for (const domain of DOMAIN_EXPORT_KEYS) {
    const controls = data[domain.controlsKey];
    if (controls.length === 0) continue;

    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(...BRAND_MINT);
    doc.rect(14, y - 6, pageWidth - 28, 10, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(BRAND_DARK[0], BRAND_DARK[1], BRAND_DARK[2]);
    doc.text(domain.label, 16, y);
    y += 10;

    const sections = groupBySection(controls);
    for (const [section, rows] of sections) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(section, 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        head: [
          [
            "#",
            "Control",
            "Requirement",
            "Outcome",
            "HF",
            "Gap / reason",
          ],
        ],
        body: rows.map((r) => [
          r.ref,
          truncate(r.title, 40),
          truncate(r.requirement, 70),
          r.outcome,
          r.hardFail,
          truncate(r.reason, 40),
        ]),
        styles: { fontSize: 7, cellPadding: 2, textColor: BRAND_DARK },
        headStyles: {
          fillColor: BRAND_HEADER,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7,
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 32 },
          2: { cellWidth: 58 },
          3: { cellWidth: 20 },
          4: { cellWidth: 8 },
          5: { cellWidth: 32 },
        },
        alternateRowStyles: { fillColor: [242, 241, 237] },
        didParseCell(hook) {
          if (hook.section === "body" && hook.column.index === 3) {
            const outcome = String(hook.cell.raw ?? "");
            if (outcome === "Not in place") {
              hook.cell.styles.textColor = [180, 40, 40];
              hook.cell.styles.fontStyle = "bold";
            } else if (outcome === "Partially in place") {
              hook.cell.styles.textColor = [160, 100, 20];
            }
          }
        },
      });

      y = tableEndY(doc, y) + 8;
    }
  }

  addFooter(doc);

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
