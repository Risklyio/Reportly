import Link from "next/link";
import { listAssessments } from "@/lib/services/assessments";
import "@/lib/db";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const assessments = listAssessments();

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
