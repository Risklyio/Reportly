export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function isVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

export function assertDatabaseConfigured(): void {
  if (isVercel() && !isSupabaseConfigured()) {
    throw new Error(
      "Reportly on Vercel requires Supabase. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables, then run supabase/schema.sql in your Supabase project."
    );
  }
}
