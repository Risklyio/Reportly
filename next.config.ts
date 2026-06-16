import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "pg", "pdf-lib"],
  outputFileTracingIncludes: {
    "/api/assessments/*/export/roc": [
      "./data/roc-pdf-field-map.json",
      "./public/templates/PCI-DSS-v4-0-1-ROC-Template-r3.pdf",
    ],
  },
};

export default nextConfig;