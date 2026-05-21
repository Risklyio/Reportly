"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ALL_CONTROLS,
  DOMAINS,
  getControlsByDomain,
} from "@/lib/controls/catalog";
import type {
  AssessmentMetadata,
  AssessmentControlState,
  ControlOutcome,
  DomainId,
} from "@/lib/types";
import { ControlCard } from "./ControlCard";

type Filter = "all" | "open" | "not_in_place" | "hard_fail";

export function AssessmentWorkspace({
  assessment: initialAssessment,
  controlStates: initialStates,
  initialDomain,
}: {
  assessment: AssessmentMetadata;
  controlStates: AssessmentControlState[];
  initialDomain: DomainId;
}) {
  const [assessment, setAssessment] = useState(initialAssessment);
  const [states, setStates] = useState(
    new Map(initialStates.map((s) => [s.controlId, s]))
  );
  const router = useRouter();
  const [domain, setDomain] = useState<DomainId>(initialDomain);
  const [filter, setFilter] = useState<Filter>("all");

  function selectDomain(d: DomainId) {
    setDomain(d);
    router.push(`/assessments/${assessment.id}?domain=${d}`);
  }

  const stateList = useMemo(() => Array.from(states.values()), [states]);

  const progress = useMemo(() => {
    const total = ALL_CONTROLS.length;
    const done = stateList.filter((s) => s.outcome != null).length;
    return Math.round((done / total) * 100);
  }, [stateList]);

  const domainControls = useMemo(() => {
    let list = getControlsByDomain(domain);
    if (filter === "open") {
      list = list.filter((c) => !states.get(c.id)?.outcome);
    } else if (filter === "not_in_place") {
      list = list.filter(
        (c) =>
          states.get(c.id)?.outcome === "not_in_place" ||
          states.get(c.id)?.outcome === "partially_in_place"
      );
    } else if (filter === "hard_fail") {
      list = list.filter((c) => c.hardFail);
    }
    const sections = new Map<string, typeof list>();
    for (const c of list) {
      const arr = sections.get(c.section) ?? [];
      arr.push(c);
      sections.set(c.section, arr);
    }
    return sections;
  }, [domain, filter, states]);

  const updateControl = useCallback(
    async (
      controlId: string,
      patch: Partial<{
        outcome: ControlOutcome;
        notInPlaceReason: string;
        correctiveAction: string;
        evidenceNotes: string;
      }>
    ) => {
      await fetch(
        `/api/assessments/${assessment.id}/controls/${controlId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }
      );
      setStates((prev) => {
        const next = new Map(prev);
        const cur = next.get(controlId)!;
        next.set(controlId, {
          ...cur,
          ...patch,
          updatedAt: new Date().toISOString(),
        });
        return next;
      });
      if (patch.outcome) {
        await fetch(`/api/assessments/${assessment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "in_progress" }),
        });
        setAssessment((a) => ({ ...a, status: "in_progress" }));
      }
    },
    [assessment.id]
  );

  const suggest = useCallback(
    async (controlId: string, reason: string) => {
      const res = await fetch(`/api/assessments/${assessment.id}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ controlId, notInPlaceReason: reason }),
      });
      return res.json();
    },
    [assessment.id]
  );

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">{assessment.clientName}</h1>
          <p className="text-sm text-text-muted">
            {assessment.appName} · {assessment.assessmentDate}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/assessments/${assessment.id}/export`}
            className="btn-secondary"
          >
            Export report
          </Link>
          <a
            href={`/api/assessments/${assessment.id}/export`}
            className="btn-primary"
            download
          >
            Download DOCX
          </a>
        </div>
      </div>

      <div className="mb-4 card flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-medium text-text">Progress</p>
          <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {progress}% complete ({stateList.filter((s) => s.outcome).length}/
            {ALL_CONTROLS.length} controls)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "open", "not_in_place", "hard_fail"] as Filter[]).map(
            (f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1 text-xs font-medium ${
                  filter === f
                    ? "bg-primary text-white"
                    : "bg-muted text-text"
                }`}
              >
                {f.replace(/_/g, " ")}
              </button>
            )
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-2 border-b border-border">
        {DOMAINS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => selectDomain(d.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              domain === d.id
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {d.shortLabel}
          </button>
        ))}
      </div>

      <div className="space-y-8 max-w-3xl">
        {Array.from(domainControls.entries()).map(([section, controls]) => (
          <section key={section}>
            <h2 className="mb-3 text-lg font-semibold text-text">{section}</h2>
            <div className="space-y-4">
              {controls.map((control) => {
                const st = states.get(control.id)!;
                return (
                  <ControlCard
                    key={control.id}
                    control={control}
                    outcome={st.outcome}
                    notInPlaceReason={st.notInPlaceReason}
                    correctiveAction={st.correctiveAction}
                    evidenceNotes={st.evidenceNotes}
                    onSave={(patch) => updateControl(control.id, patch)}
                    onSuggest={() =>
                      suggest(control.id, st.notInPlaceReason)
                    }
                  />
                );
              })}
            </div>
          </section>
        ))}
        {domainControls.size === 0 && (
          <p className="text-sm text-text-muted">No controls match this filter.</p>
        )}
      </div>
    </div>
  );
}
