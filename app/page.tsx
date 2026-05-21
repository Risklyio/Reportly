import Link from "next/link";
import { listAssessments } from "@/lib/services/assessments";
import { isSupabaseConfigured, isVercel } from "@/lib/db/env";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (isVercel() && !isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="card border-amber-200 bg-amber-50">
          <h1 className="text-xl font-bold text-text">Setup required</h1>
          <p className="mt-2 text-sm text-text-muted">
            Vercel cannot run local SQLite. Add these environment variables in
            Vercel → Project → Settings → Environment Variables, then redeploy:
          </p>
          <ul className="mt-3 list-inside list-disc text-sm font-mono">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            <li>SUPABASE_SERVICE_ROLE_KEY</li>
          </ul>
          <p className="mt-3 text-sm text-text-muted">
            Then run <code className="text-xs">supabase/schema.sql</code> in your
            Supabase SQL editor and create a Storage bucket named{" "}
            <code className="text-xs">reportly-templates</code>.
          </p>
        </div>
      </div>
    );
  }

  const assessments = await listAssessments();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text">
          Compliance assessments
        </h1>
        <p className="mt-2 text-text-muted">
          Automate M365 Application Compliance Program reports with structured
          control outcomes and Word export.
        </p>
      </div>

      <div className="mb-6 flex gap-3">
        <Link href="/assessments/new" className="btn-primary">
          New assessment
        </Link>
        <Link href="/settings" className="btn-secondary">
          Templates & settings
        </Link>
      </div>

      {assessments.length === 0 ? (
        <div className="card text-center text-text-muted">
          <p>No assessments yet.</p>
          <p className="mt-2 text-sm">
            Create one to review 76 M365 certification controls across three
            domains.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {assessments.map((a) => (
            <li key={a.id}>
              <Link
                href={`/assessments/${a.id}`}
                className="card flex items-center justify-between transition hover:shadow-elevated"
              >
                <div>
                  <p className="font-semibold text-text">{a.clientName}</p>
                  <p className="text-sm text-text-muted">
                    {a.appName} · {a.assessmentDate}
                  </p>
                </div>
                <span className="badge-complete capitalize">{a.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
