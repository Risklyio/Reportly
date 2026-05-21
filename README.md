# Reportly.io

Lightweight local web app for **M365 Application Compliance Program** audit reporting.

## Features

- 76 controls across three domains (application, operational, data handling)
- Per-control outcomes, gap reasons, corrective actions (with **Suggest** automation)
- Word template upload and DOCX export via docxtemplater
- HostedScan-inspired UI with collapsible framework sidebar

## Quick start (local)

```bash
cd reportly-io
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without Supabase env vars, data is stored in `data/reportly.db`.

## Deploy on Vercel + Supabase

1. Create a [Supabase](https://supabase.com) project.
2. In **SQL Editor**, run the full script in [`supabase/schema.sql`](supabase/schema.sql).
3. In **Storage**, create a private bucket named `reportly-templates`.
4. In Supabase **Settings → API**, copy URL, anon key, and **service role** key.
5. In Vercel **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Redeploy. The app auto-seeds controls on first request.

```bash
npm run db:seed   # optional: seed Supabase from your machine
```

## Word template placeholders

- `clientName`, `appName`, `assessmentDate`, `assessorName`, `scopeNotes`, `generatedAt`
- Loops: `appControls`, `opsControls`, `dataControls` with `number`, `title`, `outcome`, `reason`, `correctiveAction`

## Scripts

- `npm run db:seed` — reset and seed SQLite catalog
- `npx tsx scripts/write-json-seeds.ts` — export `data/m365-app-compliance/*.json`

## Data

SQLite database: `data/reportly.db`  
Uploaded templates: `uploads/templates/`
