import Link from "next/link";
import { listAssessmentsWithProgress } from "@/lib/services/assessments";
import { ALL_CONTROLS, FRAMEWORKS } from "@/lib/controls/catalog";
import { isSupabaseConfigured, isVercel } from "@/lib/db/env";
import { SetupRequired } from "@/components/setup/SetupRequired";
import { AssessmentDashboard } from "@/components/dashboard/AssessmentDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ frameworkId?: string }>;
}) {
  if (isVercel() && !isSupabaseConfigured()) {
    return <SetupRequired />;
  }

  const params = (await searchParams) ?? {};
  const selectedFrameworkId = params.frameworkId ?? "";
  const frameworkLabel =
    FRAMEWORKS.find((f) => f.id === selectedFrameworkId)?.name ?? "";

  const allAssessments = await listAssessmentsWithProgress();
  const assessments = selectedFrameworkId
    ? allAssessments.filter((a) => a.frameworkId === selectedFrameworkId)
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-text sm:text-5xl">
          Reportly Workspace
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-text-muted sm:mt-3">
          Manage and report security assessments across supported frameworks with
          structured control outcomes and automated exports.
        </p>
        {frameworkLabel && (
          <div className="mt-4 inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary ring-1 ring-inset ring-primary/20">
            Viewing: {frameworkLabel}
          </div>
        )}
      </div>

      <div className="mb-10 flex flex-wrap items-center justify-center sm:justify-start gap-4 border-b border-border pb-6">
        <Link href="/assessments/new" className="btn-primary px-6 py-2.5 text-sm font-semibold shadow-sm hover:shadow-md transition-all">
          <svg className="mr-2 h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
          New Assessment
        </Link>
        <Link href="/settings" className="btn-secondary px-6 py-2.5 text-sm font-semibold transition-all hover:bg-muted">
          <svg className="mr-2 h-5 w-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Templates & Settings
        </Link>
      </div>

      {!selectedFrameworkId ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
          <div className="rounded-full bg-primary/10 p-4 text-primary mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Select a Framework</h2>
          <p className="text-text-muted max-w-md">
            Choose a framework from the sidebar to review current assessments or click <strong>New Assessment</strong> to get started.
          </p>
        </div>
      ) : assessments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
          <div className="rounded-full bg-primary/10 p-4 text-primary mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-text mb-2">No Assessments Yet</h2>
          <p className="text-text-muted max-w-md">
            Create an assessment to review {ALL_CONTROLS.length} controls across supported framework domains.
          </p>
          <div className="mt-6">
            <Link href="/assessments/new" className="btn-primary shadow-sm hover:shadow-md transition-all">
              Start Assessment
            </Link>
          </div>
        </div>
      ) : (
        <AssessmentDashboard assessments={assessments} />
      )}
    </div>
  );
}
