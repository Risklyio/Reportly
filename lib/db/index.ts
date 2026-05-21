import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { frameworks, domains, controls } from "./schema";
import { ALL_CONTROLS, DOMAINS } from "@/lib/controls/catalog";
import path from "path";
import fs from "fs";

const FRAMEWORK_ID = "m365-app-compliance";
let _seeded = false;

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "reportly.db");

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

let _sqlite: Database.Database | null = null;

export function getSqlite() {
  getDb();
  return _sqlite!;
}

export function getDb() {
  if (!_db) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    _sqlite = new Database(DB_PATH);
    _sqlite.pragma("journal_mode = WAL");
    _sqlite.pragma("foreign_keys = ON");
    _db = drizzle(_sqlite, { schema });
    ensureTables(_sqlite);
    ensureSeeded();
  }
  return _db;
}

function ensureTables(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS frameworks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );
    CREATE TABLE IF NOT EXISTS domains (
      id TEXT PRIMARY KEY,
      framework_id TEXT NOT NULL REFERENCES frameworks(id),
      label TEXT NOT NULL,
      short_label TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS controls (
      id TEXT PRIMARY KEY,
      domain_id TEXT NOT NULL REFERENCES domains(id),
      number INTEGER NOT NULL,
      title TEXT NOT NULL,
      section TEXT NOT NULL,
      hard_fail INTEGER NOT NULL DEFAULT 0,
      intent TEXT NOT NULL,
      evidence_requirements TEXT NOT NULL,
      doc_url TEXT NOT NULL,
      default_not_in_place_reasons TEXT NOT NULL,
      corrective_action_hints TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      framework_id TEXT NOT NULL REFERENCES frameworks(id),
      client_name TEXT NOT NULL,
      app_name TEXT NOT NULL,
      assessment_date TEXT NOT NULL,
      assessor_name TEXT NOT NULL DEFAULT '',
      scope_notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS assessment_controls (
      assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      control_id TEXT NOT NULL REFERENCES controls(id),
      outcome TEXT,
      not_in_place_reason TEXT NOT NULL DEFAULT '',
      corrective_action TEXT NOT NULL DEFAULT '',
      evidence_notes TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL,
      PRIMARY KEY (assessment_id, control_id)
    );
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_corrective_overrides (
      id TEXT PRIMARY KEY,
      control_id TEXT NOT NULL,
      reason_code TEXT NOT NULL,
      action_text TEXT NOT NULL,
      links TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );
  `);
}

function ensureSeeded() {
  if (_seeded) return;
  const db = _db!;
  const existing = db.select().from(frameworks).get();
  if (existing) {
    _seeded = true;
    return;
  }
  db.insert(frameworks)
    .values({
      id: FRAMEWORK_ID,
      name: "M365 Application Compliance Program",
      description:
        "Microsoft 365 App Certification sample evidence guide.",
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
  _seeded = true;
}

export { DB_PATH, DATA_DIR };
