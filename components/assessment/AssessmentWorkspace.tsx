"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getControlsForFramework,
  getDomainsForFramework,
  getControlsByDomain,
  getOutcomeProfile,
  PCI_ROC_FRAMEWORK_ID,
} from "@/lib/controls/catalog";
import { findRocControlByRef, getDefaultRocRef } from "@/lib/roc/tree";
import type {
  AssessmentMetadata,
  AssessmentControlState,
  ControlOutcome,
  DomainId,
} from "@/lib/types";
import { PENTEST_LEAD_CONTROL_ID } from "@/lib/controls/pentest";
import { ControlCard } from "./ControlCard";
import { RocRequirementView } from "./RocRequirementView";
import { RocAssessmentDashboard } from "./RocAssessmentDashboard";
import { RocRequirementTree } from "./RocRequirementTree";
import { MobileAssessmentNav } from "./MobileAssessmentNav";
import { stringifyRocProcedureNotes } from "@/lib/roc/notes";
import type { RocProcedureNotesMap } from "@/lib/types";

type Filter = "all" | "open" | "not_in_place" | "hard_fail";

function buildStateMap(
  assessmentId: string,
  frameworkControls: ReturnType<typeof getControlsForFramework>,
  initialStates: AssessmentControlState[]
) {
  const map = new Map<string, AssessmentControlState>();
  for (const c of frameworkControls) {
    const existing = initialStates.find((s) => s.controlId === c.id);
    map.set(
      c.id,
      existing ?? {
        assessmentId,
        controlId: c.id,
        outcome: null,
        notInPlaceReason: "",
        assessorNotes: "",
        correctiveAction: "",
        evidenceNotes: "",
        pciExpectedTestingDone: [],
        pciExpectedTestingComments: [],
        rocProcedureNotes: {},
        updatedAt: new Date().toISOString(),
      }
    );
  }
  return map;
}

export function AssessmentWorkspace({
  assessment: initialAssessment,
  controlStates: initialStates,
}: {
  assessment: AssessmentMetadata;
  controlStates: AssessmentControlState[];
}) {
  const router = useRouter();
  const frameworkDomains = getDomainsForFramework(initialAssessment.frameworkId);
  const frameworkControls = getControlsForFramework(initialAssessment.frameworkId);
  const outcomeProfile = getOutcomeProfile(initialAssessment.frameworkId);
  const searchParams = useSearchParams();
  const isRoc = initialAssessment.frameworkId === PCI_ROC_FRAMEWORK_ID;
  const showDashboard = isRoc && searchParams.get("view") === "dashboard";
  const refParam = searchParams.get("ref");
  const domain =
    (searchParams.get("domain") as DomainId) || frameworkDomains[0]?.id;
  const filter = (searchParams.get("filter") as Filter) || "all";

  const [assessment, setAssessment] = useState(initialAssessment);
  const [states, setStates] = useState(() =>
    buildStateMap(initialAssessment.id, frameworkControls, initialStates)
  );

  const activeRef = useMemo(() => {
    if (!isRoc || showDashboard) return null;
    return refParam ?? getDefaultRocRef(assessment.frameworkId);
  }, [isRoc, showDashboard, refParam, assessment.frameworkId]);

  const selectedRocControl = useMemo(() => {
    if (!isRoc || showDashboard) return null;
    return (
      findRocControlByRef(frameworkControls, activeRef) ??
      frameworkControls[0] ??
      null
    );
  }, [isRoc, showDashboard, frameworkControls, activeRef]);

  useEffect(() => {
    if (!isRoc || showDashboard || refParam) return;
    const defaultRef = getDefaultRocRef(assessment.frameworkId);
    if (!defaultRef) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("ref", defaultRef);
    params.delete("domain");
    router.replace(`/assessments/${assessment.id}?${params.toString()}`);
  }, [
    isRoc,
    showDashboard,
    refParam,
    assessment.frameworkId,
    assessment.id,
    router,
    searchParams,
  ]);

  const stateList = useMemo(() => Array.from(states.values()), [states]);

  const progress = useMemo(() => {
    const total = frameworkControls.filter((c) => c.domain !== "ce_sampling").length;
    if (!total) return 0;
    const done = stateList.filter((s) => {
      const control = frameworkControls.find((c) => c.id === s.controlId);
      if (!control) return false;
      if (control.domain === "ce_sampling") return false;
      return s.outcome != null;
    }).length;
    return Math.round((done / total) * 100);
  }, [frameworkControls, stateList]);

  const domainControls = useMemo(() => {
    let list = getControlsByDomain(domain, assessment.frameworkId);
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
  }, [assessment.frameworkId, domain, filter, states]);

  const applyPentestPending = useCallback(async () => {
    const res = await fetch(
      `/api/assessments/${assessment.id}/pentest-pending`,
      { method: "POST" }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to apply penetration test pending");
    }
    const data = (await res.json()) as {
      states: AssessmentControlState[];
    };
    setStates((prev) => {
      const next = new Map(prev);
      for (const row of data.states) {
        next.set(row.controlId, row);
      }
      return next;
    });
    await fetch(`/api/assessments/${assessment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    });
    setAssessment((a) => ({ ...a, status: "in_progress" }));
  }, [assessment.id]);

  const updateControl = useCallback(
    async (
      controlId: string,
      patch: Partial<{
        outcome: ControlOutcome;
        notInPlaceReason: string;
        assessorNotes: string;
        correctiveAction: string;
        pciExpectedTestingDone: boolean[];
        pciExpectedTestingComments: string[];
        rocProcedureNotes?: RocProcedureNotesMap;
      }>
    ) => {
      const res = await fetch(
        `/api/assessments/${assessment.id}/controls/${encodeURIComponent(controlId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save control");
      }
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

  const handleOutcomeChange = useCallback(
    async (controlId: string, outcome: ControlOutcome) => {
      if (controlId === PENTEST_LEAD_CONTROL_ID && outcome === "pending") {
        await applyPentestPending();
        return;
      }
      await updateControl(controlId, { outcome });
    },
    [applyPentestPending, updateControl]
  );

  const suggest = useCallback(
    async (controlId: string, reason: string) => {
      const res = await fetch(`/api/assessments/${assessment.id}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ controlId, notInPlaceReason: reason }),
      });
      if (!res.ok) {
        throw new Error("Suggest failed");
      }
      return res.json();
    },
    [assessment.id]
  );

  const headerBadge = isRoc
    ? (activeRef ?? "ROC")
    : (frameworkDomains.find((d) => d.id === domain)?.shortLabel ?? "Workspace");

  const workspaceHeader = !showDashboard && (
    <div className="mb-8 flex flex-col justify-between gap-6 rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:flex-row md:items-end">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            {headerBadge}
          </span>
          <span className="text-sm font-medium text-text-muted">
            {assessment.assessmentDate}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text">
          {assessment.clientName}
        </h1>
        <p className="mt-1 text-lg font-medium text-text-muted">
          {assessment.appName}
        </p>
      </div>

      <div className="w-full shrink-0 rounded-xl border border-border bg-surface p-4 shadow-sm md:w-64">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold text-text">Progress</p>
          <p className="text-xs font-semibold text-primary">{progress}%</p>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs font-medium text-text-muted">
          {
            stateList.filter((s) => {
              const control = frameworkControls.find((c) => c.id === s.controlId);
              return control?.domain !== "ce_sampling" && !!s.outcome;
            }).length
          }{" "}
          of{" "}
          {frameworkControls.filter((c) => c.domain !== "ce_sampling").length}{" "}
          controls reviewed
        </p>
      </div>
    </div>
  );

  const rocAssessorPanel =
    selectedRocControl && activeRef ? (
      <RocRequirementView
        key={selectedRocControl.id}
        control={selectedRocControl}
        outcome={states.get(selectedRocControl.id)?.outcome ?? null}
        notInPlaceReason={
          states.get(selectedRocControl.id)?.notInPlaceReason ?? ""
        }
        rocProcedureNotesJson={stringifyRocProcedureNotes(
          states.get(selectedRocControl.id)?.rocProcedureNotes ?? {}
        )}
        onSave={(patch) => updateControl(selectedRocControl.id, patch)}
        onOutcomeChange={(o) => handleOutcomeChange(selectedRocControl.id, o)}
      />
    ) : (
      <p className="text-sm text-text-muted">
        Select a requirement from the tree on the right.
      </p>
    );

  if (isRoc) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] w-full">
        <div className="min-w-0 flex-1 px-4 py-8 lg:pl-6 lg:pr-6 lg:py-10">
          {showDashboard ? (
            <RocAssessmentDashboard assessment={assessment} states={states} />
          ) : (
            <>
              {workspaceHeader}
              <MobileAssessmentNav
                assessmentId={assessment.id}
                frameworkId={assessment.frameworkId}
                states={states}
              />
              {rocAssessorPanel}
            </>
          )}
        </div>
        {!showDashboard && (
          <RocRequirementTree
            assessmentId={assessment.id}
            frameworkId={assessment.frameworkId}
            activeRef={activeRef}
            states={states}
            filter={filter}
            controls={frameworkControls}
          />
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-8 lg:pl-6 lg:pr-8 lg:py-10">
      {workspaceHeader}
      <MobileAssessmentNav
        assessmentId={assessment.id}
        frameworkId={assessment.frameworkId}
      />
      <div className="space-y-10">
        {Array.from(domainControls.entries()).map(([section, controls]) => (
          <section key={section} className="scroll-mt-20">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-xl font-bold text-text">{section}</h2>
              <div className="h-px flex-1 bg-border/60" />
              <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium text-text-muted">
                {controls.length} controls
              </span>
            </div>
            <div className="space-y-4">
              {controls.map((control) => {
                const st = states.get(control.id)!;
                return (
                  <ControlCard
                    key={control.id}
                    assessmentId={assessment.id}
                    control={control}
                    outcome={st.outcome}
                    notInPlaceReason={st.notInPlaceReason}
                    assessorNotes={st.assessorNotes}
                    correctiveAction={st.correctiveAction}
                    outcomeProfile={outcomeProfile}
                    pciExpectedTestingDone={st.pciExpectedTestingDone}
                    pciExpectedTestingComments={st.pciExpectedTestingComments}
                    onSave={(patch) => updateControl(control.id, patch)}
                    onSuggest={() => suggest(control.id, st.notInPlaceReason)}
                    showPendingOption={control.id === PENTEST_LEAD_CONTROL_ID}
                    onOutcomeChange={
                      control.id === PENTEST_LEAD_CONTROL_ID
                        ? (o) => handleOutcomeChange(control.id, o)
                        : undefined
                    }
                  />
                );
              })}
            </div>
          </section>
        ))}
        {domainControls.size === 0 && (
          <p className="text-sm text-text-muted">
            No controls match this filter. Try another filter in the left sidebar.
          </p>
        )}
      </div>
    </div>
  );
}
