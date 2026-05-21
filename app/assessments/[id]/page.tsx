import { notFound } from "next/navigation";
import {
  getAssessment,
  getAssessmentControlStates,
} from "@/lib/services/assessments";
import { AssessmentWorkspace } from "@/components/assessment/AssessmentWorkspace";
import type { DomainId } from "@/lib/types";
import "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ domain?: string }>;
}) {
  const { id } = await params;
  const { domain: domainParam } = await searchParams;
  const assessment = getAssessment(id);
  if (!assessment) notFound();

  const controls = getAssessmentControlStates(id);
  const initialDomain =
    (domainParam as DomainId) || "application_security";

  return (
    <AssessmentWorkspace
      assessment={assessment}
      controlStates={controls}
      initialDomain={initialDomain}
    />
  );
}
