import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "pg", "pdf-lib", "pdfjs-dist"],
};

export default nextConfig;
