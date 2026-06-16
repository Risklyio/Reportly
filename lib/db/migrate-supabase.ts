import { isSupabaseConfigured } from "@/lib/db/env";

let assessorNotesColumnReady = false;
let dueDateColumnReady = false;
let expectedTestingColumnsReady = false;

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

/** Adds due_date to assessments on existing Supabase projects. */
export async function ensureDueDateColumn(): Promise<void> {
  if (dueDateColumnReady || !isSupabaseConfigured()) return;

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
      alter table assessments
      add column if not exists due_date text not null default '';
    `);
    dueDateColumnReady = true;
  } finally {
    await client.end().catch(() => undefined);
  }
}

/**
 * Adds PCI expected-testing tracking fields to assessment_controls on existing Supabase projects.
 * Requires DATABASE_URL (direct Postgres URI). Safe to run repeatedly.
 */
export async function ensurePciExpectedTestingColumns(): Promise<void> {
  if (expectedTestingColumnsReady || !isSupabaseConfigured()) return;

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
      add column if not exists pci_expected_testing_done text not null default '[]';

      alter table assessment_controls
      add column if not exists pci_expected_testing_comments text not null default '[]';

      alter table assessment_controls
      add column if not exists roc_procedure_notes text not null default '{}';
    `);
    expectedTestingColumnsReady = true;
  } finally {
    await client.end().catch(() => undefined);
  }
}
