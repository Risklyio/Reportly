import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { controlRows, domainRows, frameworkRows } from "./seed-data";

let seeded = false;

export async function ensureSupabaseSeeded(): Promise<void> {
  if (seeded) return;
  const sb = getSupabaseAdmin();
  for (const fw of frameworkRows()) {
    const { error } = await sb
      .from("frameworks")
      .upsert(fw, { onConflict: "id" });
    if (error) throw new Error(`Seed frameworks failed: ${error.message}`);
  }

  const { error: domErr } = await sb
    .from("domains")
    .upsert(domainRows(), { onConflict: "id" });
  if (domErr) throw new Error(`Seed domains failed: ${domErr.message}`);

  const rows = controlRows();
  const batchSize = 25;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await sb
      .from("controls")
      .upsert(batch, { onConflict: "id" });
    if (error) throw new Error(`Seed controls failed: ${error.message}`);
  }

  seeded = true;
}
