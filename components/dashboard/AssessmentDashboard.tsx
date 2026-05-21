"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AssessmentListItem } from "@/lib/types";

function formatOptionLabel(a: AssessmentListItem): string {
  return `${a.clientName} — ${a.appName} (${a.assessmentDate})`;
}

function AssessmentSelect({
  id,
  label,
  emptyMessage,
  items,
  showProgress,
}: {
  id: string;
  label: string;
  emptyMessage: string;
  items: AssessmentListItem[];
  showProgress?: boolean;
}) {
  const router = useRouter();
  const sorted = [...items].sort((a, b) =>
    a.clientName.localeCompare(b.clientName)
  );

  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
        {items.length > 0 && (
          <span className="ml-2 font-normal text-text-muted">({items.length})</span>
        )}
      </label>
      <select
        id={id}
        className="input"
        defaultValue=""
        disabled={sorted.length === 0}
        onChange={(e) => {
          const value = e.target.value;
          if (value) router.push(`/assessments/${value}`);
        }}
      >
        <option value="">
          {sorted.length === 0 ? emptyMessage : "Select customer…"}
        </option>
        {sorted.map((a) => (
          <option key={a.id} value={a.id}>
            {formatOptionLabel(a)}
            {showProgress ? ` — ${a.progressPercent}%` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function AssessmentGroupList({
  title,
  items,
}: {
  title: string;
  items: AssessmentListItem[];
}) {
  const sorted = [...items].sort((a, b) =>
    a.clientName.localeCompare(b.clientName)
  );

  if (sorted.length === 0) {
    return (
      <div className="card text-sm text-text-muted">
        <h2 className="font-semibold text-text">{title}</h2>
        <p className="mt-2">None yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="font-semibold text-text">{title}</h2>
      <ul className="mt-3 space-y-2">
        {sorted.map((a) => (
          <li key={a.id}>
            <Link
              href={`/assessments/${a.id}`}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-muted"
            >
              <span>
                <span className="font-medium text-text">{a.clientName}</span>
                <span className="text-text-muted">
                  {" "}
                  · {a.appName} · {a.assessmentDate}
                </span>
              </span>
              <span
                className={
                  a.isFullyReviewed ? "badge-complete" : "text-xs text-text-muted"
                }
              >
                {a.isFullyReviewed
                  ? "Complete"
                  : `${a.progressPercent}%`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AssessmentDashboard({
  assessments,
}: {
  assessments: AssessmentListItem[];
}) {
  const completed = assessments.filter((a) => a.isFullyReviewed);
  const inProgress = assessments.filter((a) => !a.isFullyReviewed);

  return (
    <div className="space-y-6">
      <div className="card grid gap-4 sm:grid-cols-2">
        <AssessmentSelect
          id="completed-assessments"
          label="Completed assessments"
          emptyMessage="No completed assessments"
          items={completed}
        />
        <AssessmentSelect
          id="in-progress-assessments"
          label="In progress"
          emptyMessage="No in-progress assessments"
          items={inProgress}
          showProgress
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AssessmentGroupList title="Completed" items={completed} />
        <AssessmentGroupList title="In progress" items={inProgress} />
      </div>
    </div>
  );
}
