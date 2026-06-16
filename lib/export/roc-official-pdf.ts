import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  getControlsForFramework,
  PCI_ROC_FRAMEWORK_ID,
  formatControlRef,
} from "@/lib/controls/catalog";
import type { AssessmentControlState } from "@/lib/types";
import { resolveRocTemplateBytes } from "./roc-template-path";
import { loadCachedFieldMap, getRocFieldMapPath } from "./roc-field-map";
import { ROC_OUTCOME_COLUMN } from "./roc-pdf-types";

function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  if (!words[0]) return [];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    } else {
      current = next;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.slice(0, maxLines);
}

export type RocOfficialExportInput = {
  clientName: string;
  appName: string;
  assessmentDate: string;
  assessorName: string;
  scopeNotes: string;
  states: AssessmentControlState[];
};

export async function renderOfficialRocPdf(
  input: RocOfficialExportInput
): Promise<Uint8Array> {
  const templateUint8 = await resolveRocTemplateBytes();
  const pdfDoc = await PDFDocument.load(templateUint8);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const cachedMap = loadCachedFieldMap(getRocFieldMapPath());
  if (!cachedMap) {
    throw new Error(
      "ROC field map not found. Redeploy the app so the build step can generate data/roc-pdf-field-map.json from the official template."
    );
  }

  const controls = getControlsForFramework(PCI_ROC_FRAMEWORK_ID);
  const stateByControl = new Map(input.states.map((s) => [s.controlId, s]));
  const pages = pdfDoc.getPages();

  if (pages[0]) {
    const p0 = pages[0]!;
    let y = 120;
    const metaLines = [
      input.clientName && `Assessed entity: ${input.clientName}`,
      input.appName && `Assessment: ${input.appName}`,
      input.assessmentDate && `Assessment date: ${input.assessmentDate}`,
      input.assessorName && `Lead assessor: ${input.assessorName}`,
    ].filter(Boolean) as string[];
    for (const line of metaLines) {
      p0.drawText(line, { x: 72, y, size: 9, font, color: rgb(0, 0.2, 0.25) });
      y -= 12;
    }
  }

  let filled = 0;

  for (const control of controls) {
    const ref = control.requirementRef ?? formatControlRef(control);
    const state = stateByControl.get(control.id);
    if (!state?.outcome) continue;
    const outcome = state.outcome;

    const field = cachedMap.get(ref);
    if (!field) continue;

    const page = pages[field.page - 1];
    if (!page) continue;

    const col = ROC_OUTCOME_COLUMN[outcome];
    if (col != null && field.checkboxes[col] != null) {
      page.drawText("X", {
        x: field.checkboxes[col]! - 3,
        y: field.rationale.y + 28,
        size: 9,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
    }

    const rationale = state.notInPlaceReason?.trim();
    if (rationale) {
      const maxChars = Math.floor(field.rationale.maxWidth / 4.5);
      const lines = wrapText(
        rationale,
        maxChars,
        field.rationale.maxLines ?? 6
      );
      let y = field.rationale.y;
      for (const line of lines) {
        page.drawText(line, {
          x: field.rationale.x,
          y,
          size: 7,
          font,
          color: rgb(0, 0, 0),
        });
        y -= 9;
      }
    }

    const procNotes = state.rocProcedureNotes ?? {};
    let detailY = field.rationale.y - 54;
    for (const proc of control.rocTestingProcedures ?? []) {
      const note = procNotes[proc.ref];
      if (!note) continue;
      const refs = note.reportingDetails.filter(Boolean).join(", ");
      const detail = [
        note.testingNotes?.trim(),
        refs ? `Evidence: ${refs}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
      if (!detail) continue;
      for (const line of wrapText(`${proc.ref}: ${detail}`, 90, 2)) {
        if (detailY < 40) break;
        page.drawText(line, {
          x: field.rationale.x + 280,
          y: detailY,
          size: 6,
          font,
          color: rgb(0.15, 0.15, 0.15),
        });
        detailY -= 8;
      }
    }

    filled++;
  }

  if (filled === 0) {
    throw new Error(
      "No ROC requirements could be filled. Ensure the official template is installed (npm run setup-roc-template) and requirements have outcomes selected."
    );
  }

  return pdfDoc.save();
}

export function officialRocFilename(clientName: string, assessmentDate: string) {
  const safe = clientName.replace(/[^\w\-]+/g, "-").replace(/-+/g, "-");
  return `PCI-DSS-ROC-${safe}-${assessmentDate}.pdf`;
}
