import fs from "fs";
import path from "path";
import { getSupabaseEnv } from "@/lib/db/env";
import { getSupabaseAdmin, TEMPLATES_BUCKET } from "@/lib/supabase/admin";
import { ensureSupabaseSeeded } from "@/lib/db/supabase-seed";

export async function runSupabaseSetup(): Promise<string[]> {
  const logs: string[] = [];
  const { url, serviceKey } = getSupabaseEnv();
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  if (!databaseUrl) {
    throw new Error(
      "Missing DATABASE_URL (Supabase → Database → Connection string URI)"
    );
  }

  logs.push("Running schema…");
  const { Client } = await import("pg");
  const schema = fs.readFileSync(
    path.join(process.cwd(), "supabase", "schema.sql"),
    "utf8"
  );
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query(schema);
  await client.end();
  logs.push("Schema applied.");

  logs.push("Creating storage bucket…");
  const sb = getSupabaseAdmin();
  const { error: bucketErr } = await sb.storage.createBucket(TEMPLATES_BUCKET, {
    public: false,
  });
  if (bucketErr && !bucketErr.message.toLowerCase().includes("exists")) {
    logs.push(`Bucket warning: ${bucketErr.message}`);
  } else {
    logs.push("Storage bucket ready.");
  }

  logs.push("Seeding controls…");
  await ensureSupabaseSeeded();
  logs.push("Seed complete.");

  return logs;
}
