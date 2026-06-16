# Official PCI DSS ROC PDF export

Reportly fills the **PCI DSS v4.0.1 ROC Template r3** with assessment findings from your ROC workspace.

## Setup (one time)

1. Copy the official template to the repo:

```powershell
npm run setup-roc-template
```

This copies `PCI-DSS-v4-0-1-ROC-Template-r3.pdf` from your Downloads folder to `public/templates/`.

2. Optional — pre-build a coordinate cache for faster exports:

```powershell
npm run build-roc-pdf-map
```

If you skip this step, Reportly locates fields dynamically when generating the PDF.

## Export

In a **PCI DSS ROC** assessment, use **Generate Report → Official PCI DSS ROC (PDF)** in the sidebar.

The export will:

- Place an **X** in the correct assessment finding column (In Place, N/A, Not Tested, etc.)
- Write **assessment findings** text (finding rationale) under each requirement
- Overlay **testing notes** and Section 6 evidence references where captured

## Deployment

Commit `public/templates/PCI-DSS-v4-0-1-ROC-Template-r3.pdf` for Vercel/production, or upload it to your server after deploy.
