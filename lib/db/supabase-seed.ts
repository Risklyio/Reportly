import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { controlRows, domainRows, frameworkRow, FRAMEWORK_ID } from "./seed-data";

let seeded = false;

export async function ensureSupabaseSeeded(): Promise<void> {
  if (seeded) return;
  const sb = getSupabaseAdmin();
  const { data: existing } = await sb
    .from("frameworks")
    .select("id")
    .eq("id", FRAMEWORK_ID)
    .maybeSingle();

  if (existing) {
    seeded = true;
    return;
  }

  const { error: fwErr } = await sb.from("frameworks").insert(frameworkRow());
  if (fwErr) throw new Error(`Seed frameworks failed: ${fwErr.message}`);

  const { error: domErr } = await sb.from("domains").insert(domainRows());
  if (domErr) throw new Error(`Seed domains failed: ${domErr.message}`);

  const rows = controlRows();
  const batchSize = 25;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await sb.from("controls").insert(batch);
    if (error) throw new Error(`Seed controls failed: ${error.message}`);
  }

  seeded = true;
}
