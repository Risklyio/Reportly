import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { assertDatabaseReady, isSupabaseConfigured } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function listOverrides() {
  await assertDatabaseReady();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("user_corrective_overrides")
      .select("*");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      controlId: r.control_id,
      reasonCode: r.reason_code,
      actionText: r.action_text,
      links: JSON.parse(r.links || "[]") as string[],
      createdAt: r.created_at,
    }));
  }
  const { getSqliteDb } = await import("@/lib/db/sqlite");
  const { userCorrectiveOverrides } = await import("@/lib/db/schema");
  return getSqliteDb()
    .select()
    .from(userCorrectiveOverrides)
    .all()
    .map((r) => ({
      id: r.id,
      controlId: r.controlId,
      reasonCode: r.reasonCode,
      actionText: r.actionText,
      links: JSON.parse(r.links || "[]") as string[],
      createdAt: r.createdAt,
    }));
}

export async function createOverride(input: {
  controlId: string;
  reasonCode: string;
  actionText: string;
  links?: string[];
}) {
  await assertDatabaseReady();
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("user_corrective_overrides").insert({
      id,
      control_id: input.controlId,
      reason_code: input.reasonCode,
      action_text: input.actionText,
      links: JSON.stringify(input.links ?? []),
      created_at: createdAt,
    });
    if (error) throw new Error(error.message);
    return id;
  }

  const { getSqliteDb } = await import("@/lib/db/sqlite");
  const { userCorrectiveOverrides } = await import("@/lib/db/schema");
  getSqliteDb()
    .insert(userCorrectiveOverrides)
    .values({
      id,
      controlId: input.controlId,
      reasonCode: input.reasonCode,
      actionText: input.actionText,
      links: JSON.stringify(input.links ?? []),
      createdAt,
    })
    .run();
  return id;
}

export async function deleteOverride(id: string) {
  await assertDatabaseReady();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    await sb.from("user_corrective_overrides").delete().eq("id", id);
    return;
  }
  const { getSqliteDb } = await import("@/lib/db/sqlite");
  const { userCorrectiveOverrides } = await import("@/lib/db/schema");
  getSqliteDb()
    .delete(userCorrectiveOverrides)
    .where(eq(userCorrectiveOverrides.id, id))
    .run();
}
