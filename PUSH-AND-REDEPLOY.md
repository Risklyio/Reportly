# Deploy the AI fix to Vercel

If **Generate** still shows an old quota message, or **Settings → AI Generate** says "older build", the new code is **not on Vercel yet**. Env vars alone are not enough — you must **push** and **redeploy**.

## 1. Push from your PC (in the `reportly-io` folder)

```powershell
cd "C:\Users\Charly Admin\reportly-io"
git add -A
git status
git commit -m "Fix AI Generate: Gemini REST, Settings AI status, no auto-OpenAI"
git push origin main
```

If `git push` fails, connect the folder to your GitHub repo first (the repo Vercel is linked to).

## 2. Vercel environment variables

**Settings → Environment Variables** — for **Production** (and Preview if you use preview URLs):

| Name | Value |
|------|--------|
| `AI_PROVIDER` | `google` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | your key from https://aistudio.google.com/apikey |

Optional: remove `OPENAI_API_KEY` to avoid confusion.

## 3. Redeploy

Vercel → **Deployments** → latest → **⋯** → **Redeploy** (or wait for auto-deploy after push).

Wait until status is **Ready** (not Error). If **Error**, open the build log and fix before retrying.

## 4. Verify

1. Open the live site → **Settings** → **AI Generate**
2. You should see **Build: multi-ai-v4** and **Active provider: google** (or **groq** if you switched)
3. Try **Generate** on a control with assessor notes

Or in the browser: `https://YOUR-APP.vercel.app/api/controls` — JSON should include `"ai":{"buildStamp":"multi-ai-v3",...}`.
