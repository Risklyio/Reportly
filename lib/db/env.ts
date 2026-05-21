export function getSupabaseEnv() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    "";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim() ||
    "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    "";

  return { url, serviceKey, anonKey };
}

export function getMissingSupabaseEnv(): string[] {
  const { url, serviceKey } = getSupabaseEnv();
  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return missing;
}

export function isSupabaseConfigured(): boolean {
  const { url, serviceKey } = getSupabaseEnv();
  return Boolean(url && serviceKey);
}

export function isVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

export function assertDatabaseConfigured(): void {
  if (isVercel() && !isSupabaseConfigured()) {
    const missing = getMissingSupabaseEnv().join(", ");
    throw new Error(
      `Reportly on Vercel requires Supabase. Missing: ${missing}. Add them in Vercel → Settings → Environment Variables, run supabase/schema.sql, then redeploy.`
    );
  }
}
