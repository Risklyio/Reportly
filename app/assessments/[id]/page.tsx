import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  getAssessment,
  getAssessmentControlStates,
} from "@/lib/services/assessments";
import { normalizeControlStates } from "@/lib/assessments/normalize-states";
import { AssessmentWorkspace } from "@/components/assessment/AssessmentWorkspace";

export const dynamic = "force-dynamic";

function WorkspaceFallback() {
  return (
    <div className="px-4 py-10 text-sm text-text-muted">Loading controls…</div>
  );
}

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assessment = await getAssessment(id);
  if (!assessment) notFound();

  const rows = await getAssessmentControlStates(id);
  const controlStates = normalizeControlStates(id, rows);

  return (
    <Suspense fallback={<WorkspaceFallback />}>
      <AssessmentWorkspace
        assessment={assessment}
        controlStates={controlStates}
      />
    </Suspense>
  );
}
