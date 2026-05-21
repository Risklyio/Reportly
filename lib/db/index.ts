import { isSupabaseConfigured } from "./env";

/** @deprecated Use store services; kept for scripts */
export async function getDb() {
  assertDatabaseReady();
  if (isSupabaseConfigured()) {
    const { ensureSupabaseSeeded } = await import("./supabase-seed");
    await ensureSupabaseSeeded();
    throw new Error("Use Supabase store functions instead of getDb() on Vercel.");
  }
  const { getSqliteDb } = await import("./sqlite");
  return getSqliteDb();
}

export async function assertDatabaseReady(): Promise<void> {
  const { assertDatabaseConfigured, isSupabaseConfigured: configured } =
    await import("./env");
  assertDatabaseConfigured();
  if (configured()) {
    const { ensureSupabaseSeeded } = await import("./supabase-seed");
    await ensureSupabaseSeeded();
  } else {
    const { getSqliteDb } = await import("./sqlite");
    getSqliteDb();
  }
}

export { isSupabaseConfigured } from "./env";
