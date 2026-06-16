# Official PCI DSS ROC PDF export

## Setup

1. Copy the template into the repo:

```powershell
npm run setup-roc-template
git add public/templates/PCI-DSS-v4-0-1-ROC-Template-r3.pdf
git commit -m "Add official PCI DSS ROC template"
git push
```

2. Field coordinates are generated automatically during `npm run build` (Vercel deploy).  
   To regenerate locally:

```powershell
npm run setup-roc-template
npm run build-roc-pdf-map
```

Commit both `data/roc-pdf-field-map.json` and `lib/export/roc-pdf-field-map.generated.ts` (bundled for serverless).

## Vercel

Commit the template PDF to `public/templates/`. The build step generates `data/roc-pdf-field-map.json`.  
Export at runtime uses **pdf-lib only** (no pdfjs worker on serverless).

Optional: set `ROC_TEMPLATE_URL` if you cannot commit the PDF.

## Export

**Generate Report → Official PCI DSS ROC (PDF)** in a PCI DSS ROC assessment.
