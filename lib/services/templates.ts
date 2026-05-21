import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { assertDatabaseReady, isSupabaseConfigured } from "@/lib/db";
import { getSupabaseAdmin, TEMPLATES_BUCKET } from "@/lib/supabase/admin";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "templates");

export type TemplateRecord = {
  id: string;
  name: string;
  filename: string;
  filePath?: string;
  storagePath?: string;
  isDefault: boolean;
  createdAt: string;
};

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function listTemplates(): Promise<TemplateRecord[]> {
  await assertDatabaseReady();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from("templates").select("*");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      filename: r.filename,
      storagePath: r.storage_path,
      isDefault: r.is_default,
      createdAt: r.created_at,
    }));
  }
  const { getSqliteDb } = await import("@/lib/db/sqlite");
  const { templates } = await import("@/lib/db/schema");
  return getSqliteDb()
    .select()
    .from(templates)
    .all()
    .map((r) => ({
      id: r.id,
      name: r.name,
      filename: r.filename,
      filePath: r.filePath,
      isDefault: r.isDefault,
      createdAt: r.createdAt,
    }));
}

export async function getDefaultTemplate(): Promise<TemplateRecord | null> {
  const all = await listTemplates();
  return all.find((t) => t.isDefault) ?? all[0] ?? null;
}

export async function saveTemplate(
  name: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  await assertDatabaseReady();
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    const storagePath = `${id}/${filename}`;
    const { error: upErr } = await sb.storage
      .from(TEMPLATES_BUCKET)
      .upload(storagePath, buffer, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: true,
      });
    if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);

    const existing = await listTemplates();
    const isDefault = existing.length === 0;
    const { error } = await sb.from("templates").insert({
      id,
      name,
      filename,
      storage_path: storagePath,
      is_default: isDefault,
      created_at: createdAt,
    });
    if (error) throw new Error(error.message);
    return id;
  }

  ensureUploadDir();
  const { getSqliteDb } = await import("@/lib/db/sqlite");
  const { templates } = await import("@/lib/db/schema");
  const filePath = path.join(UPLOAD_DIR, `${id}-${filename}`);
  fs.writeFileSync(filePath, buffer);
  const existing = await listTemplates();
  getSqliteDb()
    .insert(templates)
    .values({
      id,
      name,
      filename,
      filePath,
      isDefault: existing.length === 0,
      createdAt,
    })
    .run();
  return id;
}

export async function deleteTemplate(id: string): Promise<void> {
  await assertDatabaseReady();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from("templates")
      .select("storage_path")
      .eq("id", id)
      .maybeSingle();
    if (data?.storage_path) {
      await sb.storage.from(TEMPLATES_BUCKET).remove([data.storage_path]);
    }
    await sb.from("templates").delete().eq("id", id);
    return;
  }
  const { getSqliteDb } = await import("@/lib/db/sqlite");
  const { templates } = await import("@/lib/db/schema");
  const row = getSqliteDb()
    .select()
    .from(templates)
    .where(eq(templates.id, id))
    .get();
  if (row?.filePath && fs.existsSync(row.filePath)) {
    fs.unlinkSync(row.filePath);
  }
  getSqliteDb().delete(templates).where(eq(templates.id, id)).run();
}

export async function readTemplateBuffer(
  tmpl: TemplateRecord
): Promise<Buffer> {
  if (isSupabaseConfigured() && tmpl.storagePath) {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.storage
      .from(TEMPLATES_BUCKET)
      .download(tmpl.storagePath);
    if (error || !data) throw new Error(error?.message ?? "Download failed");
    return Buffer.from(await data.arrayBuffer());
  }
  if (tmpl.filePath && fs.existsSync(tmpl.filePath)) {
    return fs.readFileSync(tmpl.filePath);
  }
  throw new Error("Template file not found");
}
