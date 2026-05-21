import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db";
import { templates } from "@/lib/db/schema";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "templates");

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export function listTemplates() {
  const db = getDb();
  return db.select().from(templates).all();
}

export function getDefaultTemplate() {
  const db = getDb();
  return (
    db.select().from(templates).where(eq(templates.isDefault, true)).get() ??
    db.select().from(templates).all()[0] ??
    null
  );
}

export function saveTemplate(name: string, filename: string, buffer: Buffer) {
  ensureUploadDir();
  const db = getDb();
  const id = uuidv4();
  const filePath = path.join(UPLOAD_DIR, `${id}-${filename}`);
  fs.writeFileSync(filePath, buffer);
  const existing = db.select().from(templates).all();
  const isDefault = existing.length === 0;
  db.insert(templates)
    .values({
      id,
      name,
      filename,
      filePath,
      isDefault,
      createdAt: new Date().toISOString(),
    })
    .run();
  return id;
}

export function deleteTemplate(id: string) {
  const db = getDb();
  const row = db.select().from(templates).where(eq(templates.id, id)).get();
  if (row && fs.existsSync(row.filePath)) {
    fs.unlinkSync(row.filePath);
  }
  db.delete(templates).where(eq(templates.id, id)).run();
}

export function readTemplateFile(filePath: string): Buffer {
  return fs.readFileSync(filePath);
}
