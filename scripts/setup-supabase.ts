/**
 * One-time Supabase setup (run locally with .env.local):
 *   npm run supabase:setup
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DATABASE_URL (Supabase → Settings → Database → Connection string → URI)
 */

import fs from "fs";
import path from "path";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
  }

  if (!databaseUrl) {
    console.error(
      "Missing DATABASE_URL in .env.local\n" +
        "Get it from Supabase → Project Settings → Database → Connection string → URI"
    );
    process.exit(1);
  }

  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("1/3 Running schema.sql …");
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
  await client.query(`
    alter table assessment_controls
    add column if not exists assessor_notes text not null default '';
  `);
  await client.end();
  console.log("   Tables created / migrations applied.");

  console.log("2/3 Creating storage bucket reportly-templates …");
  const { error: bucketErr } = await sb.storage.createBucket(
    "reportly-templates",
    { public: false }
  );
  if (bucketErr && !bucketErr.message.includes("already exists")) {
    console.warn("   Bucket:", bucketErr.message);
  } else {
    console.log("   Bucket ready.");
  }

  console.log("3/3 Seeding M365 controls …");
  const { ensureSupabaseSeeded } = await import("../lib/db/supabase-seed");
  await ensureSupabaseSeeded();
  console.log("   Seed complete.");

  console.log("\nDone. Add the same env vars to Vercel, then redeploy.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
