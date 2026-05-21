import Link from "next/link";
import { listAssessmentsWithProgress } from "@/lib/services/assessments";
import { ALL_CONTROLS } from "@/lib/controls/catalog";
import { isSupabaseConfigured, isVercel } from "@/lib/db/env";
import { SetupRequired } from "@/components/setup/SetupRequired";
import { AssessmentDashboard } from "@/components/dashboard/AssessmentDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (isVercel() && !isSupabaseConfigured()) {
    return <SetupRequired />;
  }

  const assessments = await listAssessmentsWithProgress();

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
            Create one to review {ALL_CONTROLS.length} M365 certification
            controls across three domains.
          </p>
        </div>
      ) : (
        <AssessmentDashboard assessments={assessments} />
      )}
    </div>
  );
}
