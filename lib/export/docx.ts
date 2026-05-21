import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import fs from "fs";
import path from "path";
import { buildExportData } from "./report-data";

export { buildExportData, exportFilename } from "./report-data";

export function renderDocx(
  templateBuffer: Buffer,
  data: ReturnType<typeof buildExportData>
): Buffer {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
  doc.render(data);
  return doc.getZip().generate({ type: "nodebuffer" }) as Buffer;
}

export function getStarterTemplatePath(): string {
  return path.join(process.cwd(), "public", "templates", "reportly-starter.docx");
}

export function ensureStarterTemplate(): string {
  const starterPath = getStarterTemplatePath();
  const dir = path.dirname(starterPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(starterPath)) {
    const minimal = buildMinimalDocxBuffer();
    fs.writeFileSync(starterPath, minimal);
  }
  return starterPath;
}

/** Minimal valid docx with docxtemplater placeholders */
function buildMinimalDocxBuffer(): Buffer {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Reportly.io — M365 Application Compliance Assessment</w:t></w:r></w:p>
    <w:p><w:r><w:t>Client: {clientName}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Application: {appName}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Assessment date: {assessmentDate}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Assessor: {assessorName}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Scope: {scopeNotes}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Generated: {generatedAt}</w:t></w:r></w:p>
    <w:p><w:r><w:t>--- Application Security ---</w:t></w:r></w:p>
    {#appControls}
    <w:p><w:r><w:t>{ref}. {title} — {outcome}</w:t></w:r></w:p>
    <w:p><w:r><w:t>{requirement}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Reason: {reason}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Corrective: {correctiveAction}</w:t></w:r></w:p>
    {/appControls}
    <w:p><w:r><w:t>--- Operational Security ---</w:t></w:r></w:p>
    {#opsControls}
    <w:p><w:r><w:t>{ref}. {title} — {outcome}</w:t></w:r></w:p>
    <w:p><w:r><w:t>{requirement}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Reason: {reason}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Corrective: {correctiveAction}</w:t></w:r></w:p>
    {/opsControls}
    <w:p><w:r><w:t>--- Data Handling ---</w:t></w:r></w:p>
    {#dataControls}
    <w:p><w:r><w:t>{ref}. {title} — {outcome}</w:t></w:r></w:p>
    <w:p><w:r><w:t>{requirement}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Reason: {reason}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Corrective: {correctiveAction}</w:t></w:r></w:p>
    {/dataControls}
    <w:sectPr/>
  </w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;

  const zip = new PizZip();
  zip.file("[Content_Types].xml", contentTypes);
  zip.file("_rels/.rels", rels);
  zip.file("word/_rels/document.xml.rels", docRels);
  zip.file("word/document.xml", documentXml);
  return zip.generate({ type: "nodebuffer" }) as Buffer;
}
