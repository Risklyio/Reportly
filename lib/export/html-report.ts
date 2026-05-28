import fs from "fs";
import path from "path";
import { CEPLUS_FRAMEWORK_ID } from "@/lib/controls/catalog";
import type { AssessmentExportData, ExportControlRow } from "./report-data";
function loadLogoBase64(): string | null {
  const logoPath = path.join(process.cwd(), "public", "brand", "reportly-logo.png");
  if (!fs.existsSync(logoPath)) return null;
  return `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;
}

function loadFaviconBase64(): string | null {
  const faviconPath = path.join(process.cwd(), "public", "brand", "reportly-favicon.png");
  if (!fs.existsSync(faviconPath)) return null;
  return `data:image/png;base64,${fs.readFileSync(faviconPath).toString("base64")}`;
}

type SectionStatus = "ok" | "partial" | "fail";

function sectionStatus(rows: ExportControlRow[]): SectionStatus {
  if (rows.some((r) => r.outcome === "Not in place")) return "fail";
  if (rows.some((r) => r.outcome === "Partially in place")) return "partial";
  return "ok";
}

function statusIcon(status: SectionStatus): string {
  if (status === "fail")
    return `<svg class="status-icon status-fail" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  if (status === "partial")
    return `<svg class="status-icon status-partial" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  return `<svg class="status-icon status-ok" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" fill="#15803d" stroke="#15803d" stroke-width="1.5"/><path d="M9 12l2 2 4-4" stroke="#fff" stroke-width="2.2"/></svg>`;
}

const IN_PLACE_ICON = `<svg class="in-place-icon" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" fill="#15803d" stroke="#15803d"/><path d="M9 12l2 2 4-4" stroke="#fff"/></svg>`;

function outcomeBadge(outcome: string): string {
  const map: Record<string, string> = {
    "In place": "badge-green",
    "Not in place": "badge-red",
    "Partially in place": "badge-amber",
    "Not applicable": "badge-slate",
    Pending: "badge-blue",
    "Not reviewed": "badge-grey",
  };
  const cls = map[outcome] ?? "badge-grey";
  const icon = outcome === "In place" ? IN_PLACE_ICON : "";
  return `<span class="badge ${cls}">${icon}${esc(outcome)}</span>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nl2br(s: string): string {
  return esc(s).replace(/\n/g, "<br>");
}

function groupBySection(rows: ExportControlRow[]): Map<string, ExportControlRow[]> {
  const map = new Map<string, ExportControlRow[]>();
  for (const r of rows) {
    const list = map.get(r.section) ?? [];
    list.push(r);
    map.set(r.section, list);
  }
  return map;
}

function getSamplingFields(data: AssessmentExportData) {
  const samplingDomain = data.domains.find((d) => d.id === "ce_sampling");
  const sampleRow = samplingDomain?.controls[0];
  return {
    devices: (sampleRow?.reason || "").trim(),
    cloudServices: (sampleRow?.assessorNotes || "").trim(),
    externalIps: (sampleRow?.correctiveAction || "").trim(),
  };
}

function renderControlRow(r: ExportControlRow): string {
  const hardTag = r.hardFail === "Yes" ? `<span class="hard-fail-tag">HARD FAIL</span>` : "";
  return `<tr>
  <td class="col-ref">${esc(r.ref)}</td>
  <td>${esc(r.title)}${hardTag}</td>
  <td class="col-req">${nl2br(r.requirement)}</td>
  <td class="col-outcome">${outcomeBadge(r.outcome)}</td>
  <td>${nl2br(r.reason) || "—"}</td>
  <td>${nl2br(r.assessorNotes) || "—"}</td>
  <td>${nl2br(r.correctiveAction) || "—"}</td>
</tr>`;
}

const TABLE_HEAD = `<thead><tr>
      <th class="col-ref">#</th>
      <th>Control</th>
      <th class="col-req">Requirement</th>
      <th class="col-outcome">Outcome</th>
      <th>Gap / Reason</th>
      <th>Assessor Notes</th>
      <th>Corrective Action</th>
    </tr></thead>`;

function renderCeplusSubControl(r: ExportControlRow): string {
  const status = sectionStatus([r]);
  const icon = statusIcon(status);
  return `<details class="sub-control-block">
  <summary class="sub-control-title">${icon}<span class="sub-control-ref">${esc(r.ref)}</span>${esc(r.title)}</summary>
  <table class="controls-table">
    ${TABLE_HEAD}
    <tbody>${renderControlRow(r)}</tbody>
  </table>
</details>`;
}

type MainControlGroup = {
  number: number;
  section: string;
  subs: ExportControlRow[];
};

function groupByMainControl(rows: ExportControlRow[]): MainControlGroup[] {
  const map = new Map<number, MainControlGroup>();
  for (const r of rows) {
    const existing = map.get(r.number);
    if (existing) {
      existing.subs.push(r);
    } else {
      map.set(r.number, { number: r.number, section: r.section, subs: [r] });
    }
  }
  return [...map.values()].sort((a, b) => a.number - b.number);
}

function renderCeplusMainControl(group: MainControlGroup): string {
  const status = sectionStatus(group.subs);
  const icon = statusIcon(status);
  const subs = group.subs.map(renderCeplusSubControl).join("\n");
  return `<details class="control-block">
  <summary class="control-title">${icon}<span class="control-ref">${group.number}</span>${esc(group.section)}</summary>
  <div class="control-body">${subs}</div>
</details>`;
}

function renderCeplusDomain(domainLabel: string, domainId: string, controls: ExportControlRow[]): string {
  if (controls.length === 0) return "";
  const domainStatus = sectionStatus(controls);
  const icon = statusIcon(domainStatus);

  const iconMap: Record<string, string> = {
    ce_external_vulnerability_assessment: `<svg class="domain-icon" viewBox="0 0 24 24" fill="none" stroke="#060606" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
    ce_authenticated_vulnerability_assessment: `<svg class="domain-icon" viewBox="0 0 24 24" fill="none" stroke="#060606" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
    ce_malware_protection: `<svg class="domain-icon" viewBox="0 0 24 24" fill="none" stroke="#060606" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5.25-3.4 9.74-8 11-4.6-1.26-8-5.75-8-11V6l8-4z"/></svg>`,
    ce_multi_factor_authentication: `<svg class="domain-icon" viewBox="0 0 24 24" fill="none" stroke="#060606" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 11c1.66 0 3-1.34 3-3S13.66 5 12 5 9 6.34 9 8s1.34 3 3 3z"/><path d="M6 21v-1a6 6 0 0112 0v1"/></svg>`,
    ce_account_separation: `<svg class="domain-icon" viewBox="0 0 24 24" fill="none" stroke="#060606" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4"/><circle cx="17" cy="11" r="3"/><path d="M21 21v-1a3 3 0 00-3-3h-1"/></svg>`,
  };
  const domIcon = iconMap[domainId] ?? "";

  const mainControls = groupByMainControl(controls)
    .map(renderCeplusMainControl)
    .join("\n");

  return `<details class="domain-block">
  <summary class="domain-title">${domIcon}${icon}${esc(domainLabel)}</summary>
  ${mainControls}
</details>`;
}

function renderSection(section: string, rows: ExportControlRow[]): string {
  const status = sectionStatus(rows);
  const icon = statusIcon(status);
  return `<details class="section-block">
  <summary class="section-title">${icon}${esc(section)}</summary>
  <table class="controls-table">
    ${TABLE_HEAD}
    <tbody>${rows.map(renderControlRow).join("\n")}</tbody>
  </table>
</details>`;
}

function renderDomain(domainLabel: string, domainId: string, controls: ExportControlRow[]): string {
  if (controls.length === 0) return "";
  const sections = groupBySection(controls);
  const domainStatus = sectionStatus(controls);
  const icon = statusIcon(domainStatus);

  const iconMap: Record<string, string> = {
    application_security: `<svg class="domain-icon" viewBox="0 0 24 24" fill="none" stroke="#060606" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5.25-3.4 9.74-8 11-4.6-1.26-8-5.75-8-11V6l8-4z"/></svg>`,
    operational_security: `<svg class="domain-icon" viewBox="0 0 24 24" fill="none" stroke="#060606" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>`,
    data_handling: `<svg class="domain-icon" viewBox="0 0 24 24" fill="none" stroke="#060606" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>`,
  };
  const domIcon = iconMap[domainId] ?? "";

  let body = "";
  for (const [sec, rows] of sections) {
    body += renderSection(sec, rows);
  }

  return `<details class="domain-block">
  <summary class="domain-title">${domIcon}${icon}${esc(domainLabel)}</summary>
  ${body}
</details>`;
}

function buildDomainFindings(data: AssessmentExportData) {
  return data.domains
    .filter((d) => d.id !== "ce_sampling")
    .map((d) => ({
    label: d.label,
    notInPlace: d.controls.filter((c) => c.outcome === "Not in place").length,
    partiallyInPlace: d.controls.filter((c) => c.outcome === "Partially in place").length,
    flagged: d.controls.filter(
      (c) => c.outcome === "Not in place" || c.outcome === "Partially in place"
    ).length,
    }));
}

export function renderAssessmentHtml(
  data: AssessmentExportData,
  options: { executiveSummary?: string } = {}
): string {
  const logoUri = loadLogoBase64();
  const faviconUri = loadFaviconBase64();
  const sampling = getSamplingFields(data);
  const domainFindings = buildDomainFindings(data);
  const totalFlagged = domainFindings.reduce((sum, d) => sum + d.flagged, 0);

  let domains = "";
  const isCeplus = data.frameworkId === CEPLUS_FRAMEWORK_ID;
  for (const d of data.domains) {
    if (d.id === "ce_sampling") continue;
    domains += isCeplus
      ? renderCeplusDomain(d.label, d.id, d.controls)
      : renderDomain(d.label, d.id, d.controls);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(
    isCeplus
      ? `${data.clientName} — ${data.frameworkName}`
      : `${data.clientName} — ${data.frameworkName}`
  )}</title>
${faviconUri ? `<link rel="icon" type="image/png" href="${faviconUri}"/>` : ""}
<style>
:root {
  --black: #060606;
  --white: #ffffff;
  --bg: #fcfcfc;
  --header-bg: #f7f7f7;
  --border: #ebebeb;
  --muted: #6b7280;
  --section-bg: #f5f5f5;
  --green: #22c55e;
  --green-ring: #15803d;
  --red: #ef4444;
  --red-ring: #b91c1c;
  --amber: #f59e0b;
  --amber-ring: #b45309;
  --blue: #dbeafe;
  --blue-ring: #475569;
  --blue-text: #1e3a5f;
  --slate: #94a3b8;
  --grey-light: #e2e8f0;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:var(--bg);color:var(--black);font-size:13px;line-height:1.5}
.report{max-width:1680px;width:calc(100vw - 32px);margin:0 auto;padding:0 16px 60px}

/* Header */
.report-header{background:var(--header-bg);border-bottom:1px solid var(--border);padding:14px 24px;margin:0 -24px 32px;display:flex;align-items:center;justify-content:space-between}
.report-header .logo{height:38px;width:auto}
.report-header h1{font-size:16px;font-weight:700;color:var(--black)}
.report-header .header-right{display:flex;align-items:center;gap:16px}
.report-header .date{font-size:12px;color:var(--muted)}

/* Meta card */
.meta-card{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:20px 24px;margin-bottom:28px}
.meta-card .title{font-size:22px;font-weight:700;margin-bottom:16px;color:var(--black)}
.meta-grid{display:grid;grid-template-columns:120px 1fr;gap:6px 16px;font-size:13px}
.meta-grid dt{font-weight:600;color:var(--black)}
.meta-grid dd{color:var(--muted)}

/* Sampling section */
.sampling-card{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:16px 18px;margin-bottom:24px}
.sampling-card h2{font-size:15px;font-weight:700;margin-bottom:8px}
.sampling-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.sampling-col{border:1px solid var(--border);border-radius:8px;background:#fff;padding:10px}
.sampling-col h3{font-size:12px;font-weight:700;margin-bottom:6px}
.sampling-col p{line-height:1.55}

/* Assessment findings */
.exec-summary{margin-bottom:32px}
.exec-summary h2{font-size:16px;font-weight:700;margin-bottom:10px}
.exec-summary .exec-text{margin-bottom:14px;color:var(--black);line-height:1.55;white-space:pre-line}
.summary-table{width:100%;border-collapse:collapse;font-size:13px}
.summary-table th,.summary-table td{padding:8px 12px;text-align:left;border-bottom:1px solid var(--border)}
.summary-table th{background:var(--header-bg);font-weight:600;color:var(--black)}
.summary-table tr:nth-child(even) td{background:var(--bg)}

/* Domain blocks */
.domain-block{margin-bottom:24px;border:1px solid var(--border);border-radius:8px;overflow:hidden}
.domain-title{display:flex;align-items:center;gap:8px;padding:12px 16px;background:var(--section-bg);font-weight:700;font-size:14px;cursor:pointer;list-style:none;user-select:none;border-bottom:1px solid var(--border)}
.domain-title::-webkit-details-marker{display:none}
.domain-title::before{content:'▸';font-size:12px;transition:transform .15s}
details[open]>.domain-title::before{transform:rotate(90deg)}
.domain-icon{width:18px;height:18px;flex-shrink:0}

/* Section blocks */
.section-block{margin:0;border-top:1px solid var(--border)}
.section-block:first-child{border-top:none}
.section-title{display:flex;align-items:center;gap:8px;padding:10px 16px 10px 28px;font-weight:600;font-size:13px;cursor:pointer;list-style:none;background:var(--white);user-select:none}
.section-title:hover{background:var(--header-bg)}
.section-title::-webkit-details-marker{display:none}
.section-title::before{content:'▸';font-size:11px;transition:transform .15s}
details[open]>.section-title::before{transform:rotate(90deg)}

/* CE+ main control blocks */
.control-block{border-top:1px solid var(--border)}
.control-block:first-child{border-top:none}
.control-title{display:flex;align-items:center;gap:8px;padding:10px 16px 10px 36px;font-weight:600;font-size:13px;cursor:pointer;list-style:none;background:var(--white);user-select:none}
.control-title:hover{background:var(--header-bg)}
.control-title::-webkit-details-marker{display:none}
.control-title::before{content:'▸';font-size:11px;transition:transform .15s;flex-shrink:0}
details[open]>.control-title::before{transform:rotate(90deg)}
.control-ref{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;border-radius:6px;background:var(--header-bg);border:1px solid var(--border);font-size:11px;font-weight:700;padding:0 6px}
.control-body{padding:0 0 4px}

/* CE+ sub-control blocks */
.sub-control-block{margin:0 16px 6px 52px;border:1px solid var(--border);border-radius:6px;overflow:hidden;background:var(--white)}
.sub-control-title{display:flex;align-items:center;gap:8px;padding:8px 12px;font-weight:500;font-size:12px;cursor:pointer;list-style:none;background:var(--bg);user-select:none}
.sub-control-title:hover{background:var(--header-bg)}
.sub-control-title::-webkit-details-marker{display:none}
.sub-control-title::before{content:'▸';font-size:10px;transition:transform .15s;flex-shrink:0}
details[open]>.sub-control-title::before{transform:rotate(90deg)}
.sub-control-ref{font-weight:700;color:var(--muted);font-size:11px;min-width:28px}

/* Status icons */
.status-icon{width:16px;height:16px;flex-shrink:0}
.status-ok{stroke:#15803d}
.status-fail{stroke:#dc2626}
.status-partial{stroke:#d97706}

/* Controls table */
.controls-table{width:100%;border-collapse:collapse;font-size:12px}
.controls-table th,.controls-table td{padding:8px 10px;text-align:left;border-bottom:1px solid var(--border);vertical-align:top}
.controls-table thead th{background:var(--header-bg);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.3px;color:var(--black);position:sticky;top:0}
.controls-table tbody tr:nth-child(even) td{background:var(--bg)}
.controls-table tbody tr:hover td{background:var(--header-bg)}
.col-ref{width:50px;white-space:nowrap}
.col-req{max-width:300px}
.col-outcome{width:120px;text-align:center}

/* Badges */
.badge{display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap;border:1px solid transparent}
.in-place-icon{width:14px;height:14px;flex-shrink:0}
.badge-green{background:var(--green);color:var(--white);border-color:var(--green-ring)}
.badge-red{background:var(--red);color:var(--white);border-color:var(--red-ring)}
.badge-amber{background:var(--amber);color:var(--black);border-color:var(--amber-ring)}
.badge-slate{background:var(--slate);color:var(--white)}
.badge-blue{background:var(--blue);color:var(--blue-text);border-color:var(--blue-ring)}
.badge-grey{background:var(--grey-light);color:var(--muted)}

/* Hard fail */
.hard-fail-tag{display:inline-block;margin-left:6px;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:700;background:#fee2e2;color:#b91c1c;border:1px solid #b91c1c;vertical-align:middle}

/* Print */
@media print{
  body{font-size:10px}
  .report{max-width:none;padding:0}
  .report-header{margin:0 0 16px;position:static}
  details{break-inside:avoid}
  .domain-title,.section-title{break-after:avoid}
  .controls-table{font-size:9px}
  .controls-table thead th{position:static}
}
</style>
</head>
<body>
<div class="report">
  <header class="report-header">
    <div style="display:flex;align-items:center;gap:12px">
      ${logoUri ? `<img class="logo" src="${logoUri}" alt="Reportly.io"/>` : `<span style="font-weight:700;font-size:16px">Reportly.io</span>`}
    </div>
    <div class="header-right">
      <h1>${esc(data.frameworkName)}</h1>
      <span class="date">${esc(data.generatedAt)}</span>
    </div>
  </header>

  <div class="meta-card">
    <div class="title">${esc(
      isCeplus ? data.clientName : `${data.clientName} — ${data.appName}`
    )}</div>
    <dl class="meta-grid">
      <dt>Client</dt><dd>${esc(data.clientName)}</dd>
      ${isCeplus ? "" : `<dt>Application</dt><dd>${esc(data.appName)}</dd>`}
      <dt>Assessment date</dt><dd>${esc(data.assessmentDate)}</dd>
      <dt>Assessor</dt><dd>${esc(data.assessorName || "—")}</dd>
      <dt>Generated</dt><dd>${esc(data.generatedAt)}</dd>
      ${data.scopeNotes ? `<dt>Scope</dt><dd>${nl2br(data.scopeNotes)}</dd>` : ""}
    </dl>
  </div>

  ${
    isCeplus
      ? `<section class="sampling-card">
    <h2>Sampling</h2>
    <div class="sampling-grid">
      <div class="sampling-col">
        <h3>Devices</h3>
        <p>${nl2br(sampling.devices || "No sampled devices provided.")}</p>
      </div>
      <div class="sampling-col">
        <h3>Cloud services</h3>
        <p>${nl2br(sampling.cloudServices || "No sampled cloud services provided.")}</p>
      </div>
      <div class="sampling-col">
        <h3>External IP addresses</h3>
        <p>${nl2br(sampling.externalIps || "No sampled external IP addresses provided.")}</p>
      </div>
    </div>
  </section>`
      : ""
  }

  <div class="exec-summary">
    <h2>Assessment Findings</h2>
    <p class="exec-text">${nl2br(
      options.executiveSummary ||
        (totalFlagged > 0
          ? `This assessment identified ${totalFlagged} flagged controls that should be prioritized for remediation based on business risk.`
          : "No controls were flagged as not in place or partially in place.")
    )}</p>
    <table class="summary-table">
      <thead><tr><th>Control domain</th><th>Not in place</th><th>Partially in place</th><th>Total flagged</th></tr></thead>
      <tbody>
        ${domainFindings
          .map(
            (d) =>
              `<tr><td>${esc(d.label)}</td><td>${d.notInPlace}</td><td>${d.partiallyInPlace}</td><td>${d.flagged}</td></tr>`
          )
          .join("")}
        <tr><td><strong>Total</strong></td><td><strong>${domainFindings.reduce(
          (sum, d) => sum + d.notInPlace,
          0
        )}</strong></td><td><strong>${domainFindings.reduce(
          (sum, d) => sum + d.partiallyInPlace,
          0
        )}</strong></td><td><strong>${totalFlagged}</strong></td></tr>
      </tbody>
    </table>
  </div>

  ${domains}
</div>
</body>
</html>`;
}
