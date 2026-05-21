import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAssessment,
  getAssessmentControlStates,
} from "@/lib/services/assessments";
import { ALL_CONTROLS } from "@/lib/controls/catalog";

export const dynamic = "force-dynamic";

export default async function ExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assessment = await getAssessment(id);
  if (!assessment) notFound();

  const states = await getAssessmentControlStates(id);
  const filled = states.filter((s) => s.outcome).length;
  const gaps = states.filter(
    (s) => s.outcome === "not_in_place" || s.outcome === "partially_in_place"
  ).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 lg:px-8">
      <h1 className="text-2xl font-bold text-text">Export report</h1>
      <p className="mt-1 text-sm text-text-muted">
        {assessment.clientName} — {assessment.appName}
      </p>

      <div className="card mt-6 space-y-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <dt className="text-text-muted">Client</dt>
          <dd className="font-medium">{assessment.clientName}</dd>
          <dt className="text-text-muted">Application</dt>
          <dd className="font-medium">{assessment.appName}</dd>
          <dt className="text-text-muted">Date</dt>
          <dd>{assessment.assessmentDate}</dd>
          <dt className="text-text-muted">Controls reviewed</dt>
          <dd>
            {filled} / {ALL_CONTROLS.length}
          </dd>
          <dt className="text-text-muted">Gaps identified</dt>
          <dd>{gaps}</dd>
        </dl>

        <p className="text-sm text-text-muted">
          Reports include all control outcomes, gap reasons, corrective actions,
          and an executive summary. PDF is generated from your assessment data.
          DOCX uses your uploaded Word template from Settings (or the built-in
          starter).
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href={`/api/assessments/${id}/export/pdf`}
            className="btn-primary"
            download
          >
            Download PDF
          </a>
          <a
            href={`/api/assessments/${id}/export`}
            className="btn-secondary"
            download
          >
            Download DOCX
          </a>
          <Link href={`/assessments/${id}`} className="btn-secondary">
            Back to assessment
          </Link>
        </div>
      </div>
    </div>
  );
}
