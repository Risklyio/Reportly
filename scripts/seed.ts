import fs from "fs";
import path from "path";
import { isSupabaseConfigured } from "../lib/db/env";

async function main() {
  if (isSupabaseConfigured()) {
    const { ensureSupabaseSeeded } = await import("../lib/db/supabase-seed");
    await ensureSupabaseSeeded();
    console.log("Supabase seed complete.");
  } else {
    const { getSqliteDb } = await import("../lib/db/sqlite");
    await getSqliteDb();
    console.log("SQLite seed complete.");
  }

  const { ALL_CONTROLS } = await import("../lib/controls/catalog");
  const outDir = path.join(process.cwd(), "data", "m365-app-compliance");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const domains = [
    { domain: "application_security", file: "application-security.json" },
    { domain: "operational_security", file: "operational-security.json" },
    { domain: "data_handling", file: "data-handling.json" },
  ] as const;

  for (const { domain, file } of domains) {
    const list = ALL_CONTROLS.filter((c) => c.domain === domain);
    fs.writeFileSync(
      path.join(outDir, file),
      JSON.stringify({ domain, controls: list }, null, 2)
    );
  }
  console.log(`Wrote JSON seeds (${ALL_CONTROLS.length} controls).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
