import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const frameworks = sqliteTable("frameworks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const domains = sqliteTable("domains", {
  id: text("id").primaryKey(),
  frameworkId: text("framework_id")
    .notNull()
    .references(() => frameworks.id),
  label: text("label").notNull(),
  shortLabel: text("short_label").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const controls = sqliteTable("controls", {
  id: text("id").primaryKey(),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  section: text("section").notNull(),
  hardFail: integer("hard_fail", { mode: "boolean" }).notNull().default(false),
  intent: text("intent").notNull(),
  evidenceRequirements: text("evidence_requirements").notNull(),
  docUrl: text("doc_url").notNull(),
  defaultNotInPlaceReasons: text("default_not_in_place_reasons").notNull(),
  correctiveActionHints: text("corrective_action_hints").notNull(),
});

export const assessments = sqliteTable("assessments", {
  id: text("id").primaryKey(),
  frameworkId: text("framework_id")
    .notNull()
    .references(() => frameworks.id),
  clientName: text("client_name").notNull(),
  appName: text("app_name").notNull(),
  assessmentDate: text("assessment_date").notNull(),
  dueDate: text("due_date").notNull().default(""),
  assessorName: text("assessor_name").notNull().default(""),
  scopeNotes: text("scope_notes").notNull().default(""),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const assessmentControls = sqliteTable("assessment_controls", {
  assessmentId: text("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  controlId: text("control_id")
    .notNull()
    .references(() => controls.id),
  outcome: text("outcome"),
  notInPlaceReason: text("not_in_place_reason").notNull().default(""),
  assessorNotes: text("assessor_notes").notNull().default(""),
  correctiveAction: text("corrective_action").notNull().default(""),
  evidenceNotes: text("evidence_notes").notNull().default(""),
  pciExpectedTestingDone: text("pci_expected_testing_done")
    .notNull()
    .default("[]"),
  pciExpectedTestingComments: text("pci_expected_testing_comments")
    .notNull()
    .default("[]"),
  updatedAt: text("updated_at").notNull(),
});

export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  filename: text("filename").notNull(),
  filePath: text("file_path").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const userCorrectiveOverrides = sqliteTable("user_corrective_overrides", {
  id: text("id").primaryKey(),
  controlId: text("control_id").notNull(),
  reasonCode: text("reason_code").notNull(),
  actionText: text("action_text").notNull(),
  links: text("links").notNull().default("[]"),
  createdAt: text("created_at").notNull(),
});
