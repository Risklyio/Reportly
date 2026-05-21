import fs from "fs";
import path from "path";
import { getDb, getSqlite } from "../lib/db";
import { frameworks, domains, controls } from "../lib/db/schema";
import { ALL_CONTROLS, DOMAINS } from "../lib/controls/catalog";
import type { DomainId } from "../lib/types";

const FRAMEWORK_ID = "m365-app-compliance";

async function seed() {
  const db = getDb();

  getSqlite().exec(
    "DELETE FROM assessment_controls; DELETE FROM controls; DELETE FROM domains; DELETE FROM frameworks;"
  );

  db.insert(frameworks)
    .values({
      id: FRAMEWORK_ID,
      name: "M365 Application Compliance Program",
      description:
        "Microsoft 365 App Certification sample evidence guide — application, operational, and data handling domains.",
    })
    .run();

  DOMAINS.forEach((d, i) => {
    db.insert(domains)
      .values({
        id: d.id,
        frameworkId: FRAMEWORK_ID,
        label: d.label,
        shortLabel: d.shortLabel,
        sortOrder: i,
      })
      .run();
  });

  for (const c of ALL_CONTROLS) {
    db.insert(controls)
      .values({
        id: c.id,
        domainId: c.domain,
        number: c.number,
        title: c.title,
        section: c.section,
        hardFail: c.hardFail,
        intent: c.intent,
        evidenceRequirements: JSON.stringify(c.evidenceRequirements),
        docUrl: c.docUrl,
        defaultNotInPlaceReasons: JSON.stringify(c.defaultNotInPlaceReasons),
        correctiveActionHints: JSON.stringify(c.correctiveActionHints),
      })
      .run();
  }

  const outDir = path.join(process.cwd(), "data", "m365-app-compliance");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const jsonDomains: { domain: DomainId; file: string }[] = [
    { domain: "application_security", file: "application-security.json" },
    { domain: "operational_security", file: "operational-security.json" },
    { domain: "data_handling", file: "data-handling.json" },
  ];
  for (const { domain, file } of jsonDomains) {
    const list = ALL_CONTROLS.filter((c) => c.domain === domain);
    fs.writeFileSync(
      path.join(outDir, file),
      JSON.stringify({ domain, controls: list }, null, 2)
    );
  }

  console.log(`Seeded framework ${FRAMEWORK_ID} with ${ALL_CONTROLS.length} controls.`);
  console.log("Wrote JSON seeds to data/m365-app-compliance/");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
