import { getMissingSupabaseEnv, getSupabaseEnv } from "@/lib/db/env";

export function SetupRequired() {
  const missing = getMissingSupabaseEnv();
  const { url } = getSupabaseEnv();
  const hasUrl = Boolean(url);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="card border-amber-200 bg-amber-50">
        <h1 className="text-xl font-bold text-text">Connect Supabase to Vercel</h1>
        <p className="mt-2 text-sm text-text-muted">
          Reportly cannot use local SQLite on Vercel. Complete these steps, then
          redeploy (Deployments → … → Redeploy).
        </p>

        <section className="mt-6 space-y-4 text-sm">
          <div>
            <h2 className="font-semibold text-text">
              Step 1 — Supabase project
            </h2>
            <p className="mt-1 text-text-muted">
              Open{" "}
              <a
                href="https://supabase.com/dashboard"
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                supabase.com/dashboard
              </a>
              , create or open your project.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-text">
              Step 2 — Run database schema
            </h2>
            <p className="mt-1 text-text-muted">
              Supabase → <strong>SQL Editor</strong> → New query → paste the
              contents of{" "}
              <code className="rounded bg-surface px-1 text-xs">
                supabase/schema.sql
              </code>{" "}
              from your GitHub repo → <strong>Run</strong>.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-text">
              Step 3 — Storage bucket
            </h2>
            <p className="mt-1 text-text-muted">
              Supabase → <strong>Storage</strong> → New bucket → name:{" "}
              <code className="rounded bg-surface px-1 text-xs">
                reportly-templates
              </code>{" "}
              (private is fine).
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-text">
              Step 4 — Vercel environment variables
            </h2>
            <p className="mt-1 text-text-muted">
              Vercel → your Reportly project → <strong>Settings</strong> →{" "}
              <strong>Environment Variables</strong>. Add for Production,
              Preview, and Development:
            </p>
            <ul className="mt-2 space-y-2 font-mono text-xs">
              <li
                className={`rounded border px-2 py-1 ${hasUrl ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/40" : "border-amber-300 bg-surface"}`}
              >
                NEXT_PUBLIC_SUPABASE_URL — Supabase → Settings → API → Project
                URL
                {hasUrl ? " ✓ detected" : " ✗ missing"}
              </li>
              <li
                className={`rounded border px-2 py-1 ${missing.includes("SUPABASE_SERVICE_ROLE_KEY") ? "border-amber-300 bg-surface" : "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/40"}`}
              >
                SUPABASE_SERVICE_ROLE_KEY — Supabase → Settings → API →{" "}
                <strong>service_role</strong> (secret, not anon)
                {missing.includes("SUPABASE_SERVICE_ROLE_KEY")
                  ? " ✗ missing (most common)"
                  : " ✓ detected"}
              </li>
              <li className="rounded border border-border bg-surface px-2 py-1">
                NEXT_PUBLIC_SUPABASE_ANON_KEY — optional but recommended (anon
                public key)
              </li>
            </ul>
            <p className="mt-2 text-xs text-text-muted">
              If you used Vercel&apos;s Supabase integration, URL and anon key
              may already exist. You still must add{" "}
              <strong>SUPABASE_SERVICE_ROLE_KEY</strong> manually from Supabase.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-text">Step 5 — Redeploy</h2>
            <p className="mt-1 text-text-muted">
              After saving env vars, go to <strong>Deployments</strong> → latest
              deployment → <strong>Redeploy</strong> (do not skip this).
            </p>
          </div>

          <div className="rounded-lg border border-primary/30 bg-surface p-3">
            <h2 className="font-semibold text-text">Automated setup</h2>
            <p className="mt-1 text-xs text-text-muted">
              On your PC: copy keys to <code>.env.local</code> and run{" "}
              <code>npm run supabase:setup</code>. Or on Vercel: add{" "}
              <code>DATABASE_URL</code> + <code>SETUP_SECRET</code>, redeploy,
              then open{" "}
              <code>/api/setup?secret=YOUR_SECRET</code> once. See{" "}
              <code>DEPLOY.md</code> in the repo.
            </p>
          </div>
        </section>

        {missing.length > 0 && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Still missing on this deployment: {missing.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
