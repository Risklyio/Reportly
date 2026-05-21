import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { frameworks, domains, controls } from "./schema";
import { controlRows, domainRows, frameworkRow, FRAMEWORK_ID } from "./seed-data";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "reportly.db");

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _sqlite: Database.Database | null = null;
let _seeded = false;

export function getSqliteDb() {
  if (!_db) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    _sqlite = new Database(DB_PATH);
    _sqlite.pragma("journal_mode = WAL");
    _sqlite.pragma("foreign_keys = ON");
    _db = drizzle(_sqlite, { schema });
    ensureSqliteTables(_sqlite);
    ensureSqliteSeeded();
  }
  return _db;
}

function ensureSqliteTables(sqlite: Database.Database) {
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

function ensureSqliteSeeded() {
  if (_seeded) return;
  const db = _db!;
  const existing = db.select().from(frameworks).get();
  if (existing) {
    _seeded = true;
    return;
  }
  const fw = frameworkRow();
  db.insert(frameworks)
    .values({ id: fw.id, name: fw.name, description: fw.description })
    .run();
  for (const d of domainRows()) {
    db.insert(domains)
      .values({
        id: d.id,
        frameworkId: d.framework_id,
        label: d.label,
        shortLabel: d.short_label,
        sortOrder: d.sort_order,
      })
      .run();
  }
  for (const c of controlRows()) {
    db.insert(controls)
      .values({
        id: c.id,
        domainId: c.domain_id,
        number: c.number,
        title: c.title,
        section: c.section,
        hardFail: c.hard_fail,
        intent: c.intent,
        evidenceRequirements: c.evidence_requirements,
        docUrl: c.doc_url,
        defaultNotInPlaceReasons: c.default_not_in_place_reasons,
        correctiveActionHints: c.corrective_action_hints,
      })
      .run();
  }
  _seeded = true;
}

export { DB_PATH, DATA_DIR };
