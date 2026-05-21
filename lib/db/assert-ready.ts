import { assertDatabaseConfigured, isSupabaseConfigured } from "./env";

export async function assertDatabaseReady(): Promise<void> {
  assertDatabaseConfigured();
  if (isSupabaseConfigured()) {
    const { ensureSupabaseSeeded } = await import("./supabase-seed");
    await ensureSupabaseSeeded();
  } else {
    const { getSqliteDb } = await import("./sqlite");
    await getSqliteDb();
  }
}
