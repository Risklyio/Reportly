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
| `AI_PROVIDER` | `google`, `groq`, or `openai` (see below) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | For free testing with Gemini |
| `GROQ_API_KEY` | Optional free alternative |
| `OPENAI_API_KEY` | If using OpenAI (paid) |
| `AI_MODEL` | Optional (provider-specific default if omitted) |

## Enable AI **Generate**

### Free testing (recommended): Google Gemini

OpenAI’s free tier is very limited; **quota exceeded** usually means no credits left. For testing, use **Google Gemini** (free API key):

1. Open [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → **Create API key** (Google account).
2. Vercel → **Reportly** → **Settings** → **Environment Variables** → add:

| Name | Value |
|------|--------|
| `AI_PROVIDER` | `google` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | your Gemini API key |

3. **Redeploy** the project (required — env vars are not applied until you redeploy).
4. **Settings → AI Generate** in the app (or open `https://YOUR-VERCEL-URL/api/controls` and look for `"ai":{"buildStamp":"multi-ai-v3","resolvedProvider":"google",...}`). If there is no `ai` block or build is not `multi-ai-v3`, the latest code is **not deployed** — push to GitHub and Redeploy.
5. Try **Generate** on a control.

Optional: `AI_MODEL=gemini-2.0-flash` (default if omitted). `GEMINI_API_KEY` is accepted as an alias for `GOOGLE_GENERATIVE_AI_API_KEY`.

**Still seeing OpenAI quota errors?** The app was still calling OpenAI. Set `AI_PROVIDER=google` explicitly (not optional when `OPENAI_API_KEY` is also set), add the Gemini key, redeploy, then confirm `/api/ai-config`.

### Alternative free tier: Groq

1. Key from [console.groq.com/keys](https://console.groq.com/keys)
2. Vercel env: `AI_PROVIDER=groq`, `GROQ_API_KEY=...`
3. Redeploy. Default model: `llama-3.3-70b-versatile`

### OpenAI (paid)

| `AI_PROVIDER` | `openai` |
| `OPENAI_API_KEY` | `sk-...` from [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |

Requires billing and available quota on your OpenAI account.
| `DATABASE_URL` | Only for setup (can remove after) |
| `SETUP_SECRET` | Only for Option B (remove after) |
