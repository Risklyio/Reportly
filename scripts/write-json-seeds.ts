import fs from "fs";
import path from "path";
import { ALL_CONTROLS } from "../lib/controls/catalog";
import type { DomainId } from "../lib/types";

const OUT = path.join(process.cwd(), "data", "m365-app-compliance");

function writeDomain(domain: DomainId, filename: string) {
  const controls = ALL_CONTROLS.filter((c) => c.domain === domain);
  fs.writeFileSync(
    path.join(OUT, filename),
    JSON.stringify({ domain, controls }, null, 2)
  );
  console.log(`Wrote ${filename} (${controls.length} controls)`);
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
writeDomain("application_security", "application-security.json");
writeDomain("operational_security", "operational-security.json");
writeDomain("data_handling", "data-handling.json");
