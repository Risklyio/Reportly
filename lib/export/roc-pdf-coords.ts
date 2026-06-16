import type { PDFPage } from "pdf-lib";
import type { RocPdfFieldEntry } from "./roc-pdf-types";

/** Map pdf.js y (stored in field map) to pdf-lib page y, accounting for page height. */
export function mapFieldY(
  field: RocPdfFieldEntry,
  y: number,
  page: PDFPage
): number {
  const { height } = page.getSize();
  const sourceH = field.pageHeight ?? height;
  if (Math.abs(sourceH - height) < 1) return y;
  return (y / sourceH) * height;
}

export function getCheckboxDrawY(field: RocPdfFieldEntry, page: PDFPage): number {
  const y = field.checkboxY ?? field.rationale.y + 28;
  return mapFieldY(field, y, page) - 2;
}

export function getRationaleDrawY(field: RocPdfFieldEntry, page: PDFPage): number {
  return mapFieldY(field, field.rationale.y, page);
}
