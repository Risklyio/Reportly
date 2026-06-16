"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  getControlsForFramework,
  getDomainsForFramework,
  PCI_ROC_FRAMEWORK_ID,
} from "@/lib/controls/catalog";
import {
  computeDomainProgress,
  computeFrameworkProgress,
} from "@/lib/assessment/progress";
import type {
  AssessmentControlState,
  AssessmentMetadata,
} from "@/lib/types";

function CircularProgress({ percent }: { percent: number }) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <svg
        className="-rotate-90"
        width="176"
        height="176"
        viewBox="0 0 176 176"
        aria-hidden
      >
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-muted"
        />
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Total progress
        </p>
        <p className="mt-1 text-4xl font-light tabular-nums text-text">
          {percent}%
        </p>
      </div>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-text-muted sm:w-36">
        {label}
      </dt>
      <dd className="text-sm text-text">{value}</dd>
    </div>
  );
}

export function RocAssessmentDashboard({
  assessment,
  states,
}: {
  assessment: AssessmentMetadata;
  states: Map<string, AssessmentControlState>;
}) {
  const frameworkId = assessment.frameworkId ?? PCI_ROC_FRAMEWORK_ID;
  const domains = getDomainsForFramework(frameworkId);
  const controls = getControlsForFramework(frameworkId);
  const stateList = useMemo(() => Array.from(states.values()), [states]);

  const overall = useMemo(
    () => computeFrameworkProgress(controls, stateList),
    [controls, stateList]
  );

  const domainProgress = useMemo(
    () =>
      domains.map((d) =>
        computeDomainProgress(
          d.id,
          d.label,
          d.shortLabel,
          controls,
          stateList
        )
      ),
    [domains, controls, stateList]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text md:text-2xl">
              PCI DSS Report on Compliance
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Assessment overview and requirement progress
            </p>
          </div>
        </div>

        <dl className="mb-8 grid gap-3 rounded-xl border border-border bg-muted/30 p-4 md:grid-cols-2 md:gap-4 md:p-5">
          <InfoRow label="Customer" value={assessment.clientName} />
          <InfoRow label="Assessment" value={assessment.appName} />
          <InfoRow label="Assessment date" value={assessment.assessmentDate} />
          <InfoRow label="Due date" value={assessment.dueDate} />
          <InfoRow label="Lead assessor" value={assessment.assessorName} />
          {assessment.scopeNotes?.trim() && (
            <div className="md:col-span-2">
              <InfoRow label="Scope" value={assessment.scopeNotes} />
            </div>
          )}
        </dl>

        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-4">
            {domainProgress.map((d) => {
              const firstRef =
                controls.find((c) => c.domain === d.domainId)?.requirementRef ??
                "";
              return (
              <div key={d.domainId}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <Link
                    href={
                      firstRef
                        ? `/assessments/${assessment.id}?ref=${encodeURIComponent(firstRef)}`
                        : `/assessments/${assessment.id}`
                    }
                    className="text-sm font-medium text-text hover:text-primary"
                  >
                    {d.label}
                  </Link>
                  <span className="shrink-0 text-sm tabular-nums text-text-muted">
                    {d.percent}%
                  </span>
                </div>
                <ProgressBar percent={d.percent} />
                <p className="mt-1 text-xs text-text-muted">
                  {d.reviewed} of {d.total} requirements reviewed
                </p>
              </div>
            );
            })}
          </div>

          <div className="flex justify-center lg:justify-end">
            <CircularProgress percent={overall.percent} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-text-muted lg:text-left">
          {overall.reviewed} of {overall.total} requirements reviewed overall
        </p>
      </div>
    </div>
  );
}
