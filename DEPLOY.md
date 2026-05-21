# Deploy Reportly on Vercel + Supabase

I cannot log into your Supabase or Vercel accounts from here. Use one of these **automated setup** options instead.

## Option A — Setup from your PC (recommended)

1. In Supabase → **Settings → API**, copy URL, anon key, and **service_role** key.
2. In Supabase → **Settings → Database**, copy **Connection string → URI** (not the pooler session mode if it fails; try **Direct** or **Transaction** pooler).
3. Create `reportly-io/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...
```

4. Run:

```bash
cd reportly-io
npm install
npm run supabase:setup
```

5. Add the **same variables** plus `OPENAI_API_KEY` to Vercel → Environment Variables → **Redeploy**.

6. For existing Supabase DBs, add the `assessor_notes` column (pick one):
   - **SQL Editor** (fastest): paste and run `supabase/migrations/add-assessor-notes.sql`
   - **Or** add `DATABASE_URL` on Vercel and open once:  
     `https://YOUR-APP.vercel.app/api/migrate-assessor-notes?secret=YOUR_SETUP_SECRET`  
     (same `SETUP_SECRET` as `/api/setup`)
   - Wait ~30 seconds after either method so Supabase refreshes its schema cache.

## Option B — Setup on Vercel (no local terminal)

1. Add to Vercel env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (postgres URI from Supabase)
   - `SETUP_SECRET` = any long random string (e.g. `my-setup-8f3k2j9x`)
2. **Redeploy**
3. Open in browser (once):

```
https://YOUR-APP.vercel.app/api/setup?secret=YOUR_SETUP_SECRET
```

4. You should see `"ok": true`. Then remove `SETUP_SECRET` from Vercel and redeploy again.

## Vercel variables checklist

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Recommended |
| `OPENAI_API_KEY` | Yes (for **Generate** corrective actions) |
| `AI_MODEL` | Optional (default `gpt-4o-mini`) |
| `DATABASE_URL` | Only for setup (can remove after) |
| `SETUP_SECRET` | Only for Option B (remove after) |
