# Reportly.io

Lightweight local web app for **M365 Application Compliance Program** audit reporting.

## Features

- 76 controls across three domains (application, operational, data handling)
- Per-control outcomes, gap reasons, corrective actions (with **Suggest** automation)
- Word template upload and DOCX export via docxtemplater
- HostedScan-inspired UI with collapsible framework sidebar

## Quick start

```bash
cd reportly-io
npm install
npm run db:seed   # optional; auto-seeds on first run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Word template placeholders

- `clientName`, `appName`, `assessmentDate`, `assessorName`, `scopeNotes`, `generatedAt`
- Loops: `appControls`, `opsControls`, `dataControls` with `number`, `title`, `outcome`, `reason`, `correctiveAction`

## Scripts

- `npm run db:seed` — reset and seed SQLite catalog
- `npx tsx scripts/write-json-seeds.ts` — export `data/m365-app-compliance/*.json`

## Data

SQLite database: `data/reportly.db`  
Uploaded templates: `uploads/templates/`
