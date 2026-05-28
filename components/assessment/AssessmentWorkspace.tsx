"use client";

import { useCallback, useMemo, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import {
  getControlsForFramework,
  getDomainsForFramework,
  getControlsByDomain,
} from "@/lib/controls/catalog";
import type {
  AssessmentMetadata,
  AssessmentControlState,
  ControlOutcome,
  DomainId,
} from "@/lib/types";
import { PENTEST_LEAD_CONTROL_ID } from "@/lib/controls/pentest";
import { ControlCard } from "./ControlCard";
import { MobileAssessmentNav } from "./MobileAssessmentNav";

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
  const frameworkDomains = getDomainsForFramework(initialAssessment.frameworkId);
  const frameworkControls = getControlsForFramework(initialAssessment.frameworkId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const domain =
    (searchParams.get("domain") as DomainId) || frameworkDomains[0]?.id;
  const filter = (searchParams.get("filter") as Filter) || "all";

  const [assessment, setAssessment] = useState(initialAssessment);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [profileDraft, setProfileDraft] = useState({
    clientName: initialAssessment.clientName,
    appName: initialAssessment.appName,
    assessmentDate: initialAssessment.assessmentDate,
    assessorName: initialAssessment.assessorName,
    scopeNotes: initialAssessment.scopeNotes,
  });
  const [states, setStates] = useState(() =>
    buildStateMap(initialAssessment.id, frameworkControls, initialStates)
  );

  const domainLabel =
    frameworkDomains.find((d) => d.id === domain)?.label ?? "Controls";

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

  const saveProfile = useCallback(async () => {
    setSavingProfile(true);
    setProfileError(null);
    try {
      const res = await fetch(`/api/assessments/${assessment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileDraft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save assessment profile");
      }
      setAssessment((prev) => ({
        ...prev,
        clientName: profileDraft.clientName,
        appName: profileDraft.appName,
        assessmentDate: profileDraft.assessmentDate,
        assessorName: profileDraft.assessorName,
        scopeNotes: profileDraft.scopeNotes,
      }));
      setEditingProfile(false);
    } catch (e) {
      setProfileError(
        e instanceof Error ? e.message : "Failed to save assessment profile"
      );
    } finally {
      setSavingProfile(false);
    }
  }, [assessment.id, profileDraft]);

  const deleteAssessmentProfile = useCallback(async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    setProfileError(null);
    try {
      const res = await fetch(`/api/assessments/${assessment.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to delete assessment");
      }
      router.push("/");
      router.refresh();
    } catch (e) {
      setProfileError(
        e instanceof Error ? e.message : "Failed to delete assessment"
      );
    } finally {
      setDeleting(false);
    }
  }, [assessment.id, deleteConfirmText, router]);

  return (
    <div className="px-4 py-6 lg:pl-6 lg:pr-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">{assessment.clientName}</h1>
          <p className="text-sm text-text-muted">
            {assessment.appName} · {assessment.assessmentDate}
          </p>
          <p className="mt-1 text-sm font-medium text-text">{domainLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2" />
      </div>

      <div className="card mb-6">
        <p className="text-sm font-medium text-text">Progress</p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-text-muted">
          {progress}% complete (
          {
            stateList.filter((s) => {
              const control = frameworkControls.find((c) => c.id === s.controlId);
              return control?.domain !== "ce_sampling" && !!s.outcome;
            }).length
          }
          /{frameworkControls.filter((c) => c.domain !== "ce_sampling").length} controls)
        </p>
      </div>

      <div className="card mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-text">Assessment profile</p>
          {!editingProfile ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setProfileDraft({
                  clientName: assessment.clientName,
                  appName: assessment.appName,
                  assessmentDate: assessment.assessmentDate,
                  assessorName: assessment.assessorName,
                  scopeNotes: assessment.scopeNotes,
                });
                setDeleteConfirmText("");
                setProfileError(null);
                setEditingProfile(true);
              }}
            >
              Edit profile
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary"
                disabled={savingProfile}
                onClick={() => void saveProfile()}
              >
                {savingProfile ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditingProfile(false);
                  setDeleteConfirmText("");
                  setProfileError(null);
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {!editingProfile ? (
          <dl className="grid gap-2 text-sm text-text-muted">
            <div>
              <dt className="font-medium text-text">Customer name</dt>
              <dd>{assessment.clientName || "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-text">Assessment name</dt>
              <dd>{assessment.appName || "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-text">Assessment date</dt>
              <dd>{assessment.assessmentDate || "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-text">Assessor</dt>
              <dd>{assessment.assessorName || "—"}</dd>
            </div>
          </dl>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="label">Customer name</label>
              <input
                className="input"
                value={profileDraft.clientName}
                onChange={(e) =>
                  setProfileDraft((p) => ({ ...p, clientName: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Assessment name</label>
              <input
                className="input"
                value={profileDraft.appName}
                onChange={(e) =>
                  setProfileDraft((p) => ({ ...p, appName: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Assessment date</label>
              <input
                className="input"
                type="date"
                value={profileDraft.assessmentDate}
                onChange={(e) =>
                  setProfileDraft((p) => ({
                    ...p,
                    assessmentDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="label">Assessor</label>
              <input
                className="input"
                value={profileDraft.assessorName}
                onChange={(e) =>
                  setProfileDraft((p) => ({
                    ...p,
                    assessorName: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="label">Scope notes</label>
              <textarea
                className="input min-h-[90px]"
                rows={3}
                value={profileDraft.scopeNotes}
                onChange={(e) =>
                  setProfileDraft((p) => ({
                    ...p,
                    scopeNotes: e.target.value,
                  }))
                }
              />
            </div>

            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-800">Delete assessment</p>
              <p className="mt-1 text-xs text-red-700">
                Type <code>DELETE</code> below to enable deletion.
              </p>
              <input
                className="input mt-2"
                placeholder="Type DELETE to confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
              <button
                type="button"
                className="mt-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={deleteConfirmText !== "DELETE" || deleting}
                onClick={() => void deleteAssessmentProfile()}
              >
                {deleting ? "Deleting…" : "Delete assessment"}
              </button>
            </div>
          </div>
        )}
        {profileError && (
          <p className="mt-3 text-xs text-red-600" role="alert">
            {profileError}
          </p>
        )}
      </div>

      <MobileAssessmentNav
        assessmentId={assessment.id}
        frameworkId={assessment.frameworkId}
      />

      <div className="space-y-8">
        {Array.from(domainControls.entries()).map(([section, controls]) => (
          <section key={section}>
            <h2 className="mb-3 text-lg font-semibold text-text">{section}</h2>
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
                    onSave={(patch) => updateControl(control.id, patch)}
                    onSuggest={() =>
                      suggest(control.id, st.notInPlaceReason)
                    }
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
