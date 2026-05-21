import { isSupabaseConfigured } from "@/lib/db/env";

let assessorNotesColumnReady = false;

/**
 * Adds assessor_notes to assessment_controls on existing Supabase projects.
 * Requires DATABASE_URL (direct Postgres URI). Safe to run repeatedly.
 */
export async function ensureAssessorNotesColumn(): Promise<void> {
  if (assessorNotesColumnReady || !isSupabaseConfigured()) return;

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return;

  const { Client } = await import("pg");
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(`
      alter table assessment_controls
      add column if not exists assessor_notes text not null default '';
    `);
    assessorNotesColumnReady = true;
  } finally {
    await client.end().catch(() => undefined);
  }
}
