"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AI_BUILD_STAMP } from "@/lib/ai/build-stamp";
import { formatControlRef } from "@/lib/controls/catalog";
import type { ControlDefinition, ControlOutcome, OutcomeProfile } from "@/lib/types";
import { OutcomeSelector } from "./OutcomeSelector";

const OUTCOME_LABELS: Record<string, string> = {
  in_place: "In place",
  not_in_place: "Not in place",
  partially_in_place: "Partially in place",
  not_applicable: "Not applicable",
  not_tested: "Not tested",
  in_place_compensating: "In place via compensating control",
  pending: "Pending",
};
/** Wait after typing stops before autosave (reduces lag and API calls) */
const AUTOSAVE_DELAY_MS = 1200;

function outcomeBadgeClass(outcome: ControlOutcome): string {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold leading-none";
  switch (outcome) {
    case "in_place":
      return `${base} border-green-700/25 bg-green-100 text-green-800`;
    case "not_in_place":
      return `${base} border-red-700/20 bg-red-100 text-red-800`;
    case "partially_in_place":
      return `${base} border-amber-700/25 bg-amber-100 text-amber-900`;
    case "not_applicable":
      return `${base} border-slate-400/40 bg-slate-200 text-slate-700`;
    case "not_tested":
      return `${base} border-violet-700/25 bg-violet-100 text-violet-900`;
    case "in_place_compensating":
      return `${base} border-teal-700/25 bg-teal-100 text-teal-900`;
    case "pending":      return `${base} border-slate-500/45 bg-blue-50 text-blue-900`;
    default:
      return `${base} border-border bg-muted text-text-muted`;
  }
}

function InPlaceShieldIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0 text-green-700"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path d="M10 1.5 17 4.5v4.8c0 4.6-3 8.6-7 9.7C6 17.9 3 13.9 3 9.3V4.5l7-3zm-1.1 8.6 3.4-3.5-1.4-1.4-2 2-0.9-0.9-1.4 1.4 2.3 2.4z" />
    </svg>
  );
}

function OutcomeBadgeContent({
  outcome,
  label,
}: {
  outcome: ControlOutcome;
  label: string;
}) {
  return (
    <span className={outcomeBadgeClass(outcome)}>
      {outcome === "in_place" && <InPlaceShieldIcon />}
      {outcome === "in_place_compensating" && <InPlaceShieldIcon />}      {label}
    </span>
  );
}

type TextPatch = {
  notInPlaceReason?: string;
  assessorNotes?: string;
  correctiveAction?: string;
  pciExpectedTestingDone?: boolean[];
  pciExpectedTestingComments?: string[];
};

export function ControlCard({
  assessmentId,
  control,
  outcome,
  notInPlaceReason,
  assessorNotes,
  correctiveAction,
  pciExpectedTestingDone,
  pciExpectedTestingComments,
  onSave,
  onSuggest,
  onOutcomeChange,
  outcomeProfile = "microsoft",
  showPendingOption = false,
}: {
  assessmentId: string;
  control: ControlDefinition;
  outcome: ControlOutcome;
  notInPlaceReason: string;
  assessorNotes: string;
  correctiveAction: string;
  pciExpectedTestingDone: boolean[];
  pciExpectedTestingComments: string[];
  onSave: (patch: {
    outcome?: ControlOutcome;
    notInPlaceReason?: string;
    assessorNotes?: string;
    correctiveAction?: string;
    pciExpectedTestingDone?: boolean[];
    pciExpectedTestingComments?: string[];
  }) => Promise<void>;
  onSuggest: () => Promise<{ text: string; links: string[] }>;
  /** When set, outcome buttons call this instead of a single-control save (e.g. pentest bulk Pending). */
  onOutcomeChange?: (outcome: ControlOutcome) => Promise<void>;
  outcomeProfile?: OutcomeProfile;
  showPendingOption?: boolean;
}) {  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [cleaningNotes, setCleaningNotes] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [draftReason, setDraftReason] = useState(notInPlaceReason);
  const [draftNotes, setDraftNotes] = useState(assessorNotes);
  const [draftCorrective, setDraftCorrective] = useState(correctiveAction);
  const [draftExpectedTestingDone, setDraftExpectedTestingDone] = useState(
    pciExpectedTestingDone
  );
  const [draftExpectedTestingComments, setDraftExpectedTestingComments] =
    useState(pciExpectedTestingComments);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatch = useRef<TextPatch | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === `#${control.id}`) {
      setExpanded(true);
    }
  }, [control.id]);

  useEffect(() => {
    setDraftReason(notInPlaceReason);
    setDraftNotes(assessorNotes);
    setDraftCorrective(correctiveAction);
    const expected = control.expectedTesting ?? [];
    setDraftExpectedTestingDone(
      Array.from({ length: expected.length }, (_, i) => pciExpectedTestingDone[i] ?? false)
    );
    setDraftExpectedTestingComments(
      Array.from(
        { length: expected.length },
        (_, i) => pciExpectedTestingComments[i] ?? ""
      )
    );
  }, [
    control.id,
    notInPlaceReason,
    assessorNotes,
    correctiveAction,
    pciExpectedTestingDone,
    pciExpectedTestingComments,
  ]);

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  const isPci = outcomeProfile === "pci";
  const showGapFields =
    outcome === "not_in_place" ||
    (!isPci && outcome === "partially_in_place");
  const showPendingFields = outcome === "pending";
  const showImplementationFields =
    isPci &&
    (outcome === "in_place" || outcome === "in_place_compensating");
  const showNaReasonFields =
    isPci &&
    (outcome === "not_applicable" || outcome === "not_tested");
  const isSamplingControl = control.domain === "ce_sampling";
  const docsLabel = isPci ? "PCI SSC docs" : "Microsoft docs";
  const persist = useCallback(
    async (patch: TextPatch & { outcome?: ControlOutcome }) => {
      setSaving(true);
      setSaveError(null);
      try {
        await onSave(patch);
        pendingPatch.current = null;
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Failed to save");
      } finally {
        setSaving(false);
      }
    },
    [onSave]
  );

  const scheduleAutosave = useCallback(
    (patch: TextPatch) => {
      pendingPatch.current = { ...pendingPatch.current, ...patch };
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => {
        const toSave = pendingPatch.current;
        if (toSave) void persist(toSave);
      }, AUTOSAVE_DELAY_MS);
    },
    [persist]
  );

  const flushAutosave = useCallback(async () => {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
    const toSave = pendingPatch.current;
    if (toSave) await persist(toSave);
  }, [persist]);

  async function handleSuggest() {
    await flushAutosave();
    setSuggesting(true);
    try {
      const result = await onSuggest();
      const linksBlock = result.links.length
        ? `\n\nReferences:\n${result.links.map((l) => `• ${l}`).join("\n")}`
        : "";
      const text = result.text + linksBlock;
      setDraftCorrective(text);
      await persist({ correctiveAction: text });
    } finally {
      setSuggesting(false);
    }
  }

  async function handleGenerate() {
    await flushAutosave();
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch(
        `/api/assessments/${assessmentId}/generate-corrective`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            controlId: control.id,
            outcome,
            notInPlaceReason: draftReason,
            assessorNotes: draftNotes,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const hint =
          data.ai?.buildStamp !== AI_BUILD_STAMP
            ? ` Deploy latest build (Settings → AI Generate should show ${AI_BUILD_STAMP}).`
            : data.provider
              ? ` (provider: ${data.provider})`
              : "";
        throw new Error(
          (data.error ?? "Failed to generate corrective actions") + hint
        );
      }
      const text = data.text as string;
      setDraftCorrective(text);
      await persist({ correctiveAction: text });
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCleanUpNotes() {
    await flushAutosave();
    if (!draftNotes.trim()) return;
    setCleaningNotes(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/cleanup-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          controlId: control.id,
          assessorNotes: draftNotes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to clean up notes");
      }
      const text = String(data.text ?? "").trim();
      if (!text) {
        throw new Error("Cleaned notes were empty.");
      }
      setDraftNotes(text);
      await persist({ assessorNotes: text });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to clean up notes");
    } finally {
      setCleaningNotes(false);
    }
  }

  async function handleComplete() {
    await flushAutosave();
    if (isSamplingControl) {
      pendingPatch.current = {
        notInPlaceReason: draftReason,
        assessorNotes: draftNotes,
        correctiveAction: draftCorrective,
      };
      await flushAutosave();
      await persist({
        outcome: "in_place",
        notInPlaceReason: draftReason,
        assessorNotes: draftNotes,
        correctiveAction: draftCorrective,
      });
    } else if (showGapFields || showPendingFields || showImplementationFields || showNaReasonFields) {      pendingPatch.current = {
        notInPlaceReason: draftReason,
        assessorNotes: draftNotes,
        correctiveAction: draftCorrective,
      };
      await flushAutosave();
    }
    setExpanded(false);
  }

  const outcomeLabel = outcome ? OUTCOME_LABELS[outcome] : "Not reviewed";

  if (!expanded) {
    return (
      <article className="card p-0" id={control.id}>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-3 rounded-xl px-5 py-4 text-left transition hover:bg-muted/40"
          aria-expanded={false}
          aria-controls={`${control.id}-panel`}
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-text-muted">{control.section}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm font-semibold text-text">
              <span>
                <span className="text-text-muted">{formatControlRef(control)}</span>{" "}
                {control.title}
              </span>
              {control.hardFail && (
                <span className="badge-hard-fail shrink-0">HARD FAIL</span>
              )}
            </p>
          </div>
          <div className="flex w-[9.75rem] shrink-0 items-center justify-end gap-2">
            <OutcomeBadgeContent outcome={outcome} label={outcomeLabel} />
            <span className="shrink-0 text-text-muted" aria-hidden>
              ▼
            </span>
          </div>
        </button>
      </article>
    );
  }

  return (
    <article className="card" id={control.id}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-text-muted">{control.section}</p>
          <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold text-text">
            <span>
              <span className="text-text-muted">{formatControlRef(control)}</span>{" "}
              {control.title}
            </span>
            {control.hardFail && (
              <span className="badge-hard-fail shrink-0">HARD FAIL</span>
            )}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={control.docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            {docsLabel}          </a>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-text-muted hover:bg-muted"
            aria-label="Collapse control"
          >
            ▲
          </button>
        </div>
      </div>
      <p className="mb-4 whitespace-pre-line text-sm text-text-muted">
        {control.intent}
      </p>

      {control.expectedTesting && control.expectedTesting.length > 0 && (
        <div className="mb-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Expected testing (assessor guidance)
          </p>
          <div className="mt-3 space-y-4">
            {control.expectedTesting.map((item, idx) => {
              const checked = draftExpectedTestingDone[idx] ?? false;
              const comment = draftExpectedTestingComments[idx] ?? "";
              return (
                <div
                  key={`${idx}-${item}`}
                  className="rounded-lg border border-border/60 bg-surface px-3 py-2"
                >
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={checked}
                      onChange={(e) => {
                        const v = e.target.checked;
                        const next = [...draftExpectedTestingDone];
                        next[idx] = v;
                        setDraftExpectedTestingDone(next);
                        scheduleAutosave({ pciExpectedTestingDone: next });
                      }}
                    />
                    <span className="font-medium">{item}</span>
                  </label>

                  <div className="mt-2">
                    <p className="text-xs font-medium text-text-muted">
                      Notes for this expected testing
                    </p>
                    <textarea
                      className="input mt-1 min-h-[72px]"
                      rows={3}
                      value={comment}
                      onChange={(e) => {
                        const v = e.target.value;
                        const next = [...draftExpectedTestingComments];
                        next[idx] = v;
                        setDraftExpectedTestingComments(next);
                        scheduleAutosave({
                          pciExpectedTestingComments: next,
                        });
                      }}
                      placeholder="Evidence details, links, screenshots, interview notes…"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div id={`${control.id}-panel`} className="space-y-4">
        {isSamplingControl ? (
          <>
            <div>
              <label className="label">Devices</label>
              <p className="mb-1 text-xs text-text-muted">
                Example: 2 x Windows 11 25H2 end user devices, 5 x Android 16
                mobile devices, 1 x Windows Server 2022.
              </p>
              <textarea
                className="input min-h-[88px]"
                rows={3}
                value={draftReason}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraftReason(v);
                  scheduleAutosave({ notInPlaceReason: v });
                }}
                onBlur={() => void persist({ notInPlaceReason: draftReason })}
                placeholder="List sampled end-user and server devices..."
              />
            </div>
            <div>
              <label className="label">Cloud services</label>
              <textarea
                className="input min-h-[88px]"
                rows={3}
                value={draftNotes}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraftNotes(v);
                  scheduleAutosave({ assessorNotes: v });
                }}
                onBlur={() => void persist({ assessorNotes: draftNotes })}
                placeholder="List sampled cloud services..."
              />
            </div>
            <div>
              <label className="label">External IP addresses</label>
              <textarea
                className="input min-h-[88px]"
                rows={3}
                value={draftCorrective}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraftCorrective(v);
                  scheduleAutosave({ correctiveAction: v });
                }}
                onBlur={() => void persist({ correctiveAction: draftCorrective })}
                placeholder="List sampled external/public IP addresses..."
              />
            </div>
          </>
        ) : (
          <>
        <div>
          <label className="label">Outcome</label>
          <OutcomeSelector
            value={outcome}
            outcomeProfile={outcomeProfile}
            showPendingOption={showPendingOption}            onChange={(v) => {
              if (onOutcomeChange) {
                void (async () => {
                  setSaving(true);
                  setSaveError(null);
                  try {
                    await onOutcomeChange(v);
                  } catch (e) {
                    setSaveError(
                      e instanceof Error ? e.message : "Failed to save outcome"
                    );
                  } finally {
                    setSaving(false);
                  }
                })();
              } else {
                void persist({ outcome: v });
              }
            }}
          />
          {showPendingOption && (
            <p className="mt-2 text-xs text-text-muted">
              Pending applies to all penetration testing controls (1–16) and
              fills the report text on control 1.
            </p>
          )}
        </div>

        {showPendingFields && (
          <div>
            <label className="label">Report text (corrective actions)</label>
            <p className="mb-1 text-xs text-text-muted">
              Included in PDF and Word export. Edit if needed before completing.
            </p>
            <textarea
              className="input min-h-[100px]"
              rows={4}
              value={draftCorrective}
              onChange={(e) => {
                const v = e.target.value;
                setDraftCorrective(v);
                scheduleAutosave({ correctiveAction: v });
              }}
              onBlur={() => void persist({ correctiveAction: draftCorrective })}
            />
          </div>
        )}

        {showImplementationFields && (
          <>
            <div>
              <label className="label">
                How the control is implemented (included in report)
              </label>
              <p className="mb-1 text-xs text-text-muted">
                Describe how this requirement is met. This text appears in HTML and
                PDF exports.
              </p>
              <textarea
                className="input min-h-[100px]"
                rows={4}
                value={draftCorrective}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraftCorrective(v);
                  scheduleAutosave({ correctiveAction: v });
                }}
                onBlur={() => void persist({ correctiveAction: draftCorrective })}
                placeholder="e.g. Quarterly ASV scans performed by [vendor]; most recent passing scan dated…"
              />
            </div>
            {outcome === "in_place_compensating" && (
              <div>
                <label className="label">
                  Compensating control details (included in report)
                </label>
                <p className="mb-1 text-xs text-text-muted">
                  Summarize constraints, compensating controls, validation, and
                  maintenance per PCI DSS Appendix B.
                </p>
                <textarea
                  className="input min-h-[88px]"
                  rows={3}
                  value={draftNotes}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraftNotes(v);
                    scheduleAutosave({ assessorNotes: v });
                  }}
                  onBlur={() => void persist({ assessorNotes: draftNotes })}
                  placeholder="Constraints, compensating control definition, objective, risk, validation…"
                />
              </div>
            )}
          </>
        )}

        {showNaReasonFields && (
          <div>
            <label className="label">
              {outcome === "not_applicable"
                ? "Why not applicable (included in report)"
                : "Why not tested (included in report)"}
            </label>
            <textarea
              className="input min-h-[88px]"
              rows={3}
              value={draftReason}
              onChange={(e) => {
                const v = e.target.value;
                setDraftReason(v);
                scheduleAutosave({ notInPlaceReason: v });
              }}
              onBlur={() => void persist({ notInPlaceReason: draftReason })}
              placeholder={
                outcome === "not_applicable"
                  ? "e.g. Merchant does not store any paper records with account data…"
                  : "e.g. Control was outside scope of this assessment…"
              }
            />
          </div>
        )}

        {showGapFields && (          <>
            <div>
              <label className="label">Why not in place</label>
              <select
                className="input mb-2"
                value={draftReason}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraftReason(v);
                  void persist({ notInPlaceReason: v });
                }}
              >
                <option value="">Select a reason…</option>
                {control.defaultNotInPlaceReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <input
                className="input"
                placeholder="Or describe custom reason…"
                value={draftReason}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraftReason(v);
                  scheduleAutosave({ notInPlaceReason: v });
                }}
                onBlur={() => void persist({ notInPlaceReason: draftReason })}
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="label mb-0">Assessor notes</label>
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                  disabled={cleaningNotes || !draftNotes.trim()}
                  onClick={handleCleanUpNotes}
                  title={
                    !draftNotes.trim()
                      ? "Add assessor notes first"
                      : "Clean up grammar with minimal wording changes"
                  }
                >
                  {cleaningNotes ? "Cleaning up..." : "Clean up"}
                </button>
              </div>
              <p className="mb-1 text-xs text-text-muted">
                Internal working notes. Included in report exports to show assessor context.
              </p>
              <textarea
                className="input min-h-[88px]"
                rows={3}
                value={draftNotes}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraftNotes(v);
                  scheduleAutosave({ assessorNotes: v });
                }}
                onBlur={() => void persist({ assessorNotes: draftNotes })}
                placeholder="Observations, evidence references, interview notes…"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="label mb-0">Corrective actions</label>
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                  disabled={suggesting || !draftReason}
                  onClick={handleSuggest}
                >
                  {suggesting ? "Suggesting…" : "Suggest"}
                </button>
              </div>
              <textarea
                className="input min-h-[100px]"
                rows={4}
                value={draftCorrective}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraftCorrective(v);
                  scheduleAutosave({ correctiveAction: v });
                }}
                onBlur={() => void persist({ correctiveAction: draftCorrective })}
                placeholder="Report-ready corrective actions (use Generate from assessor notes)…"
              />
            </div>
          </>
        )}
          </>
        )}
      </div>

      {generateError && (
        <p className="mt-3 text-xs text-red-600" role="alert">
          {generateError}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        {saving && (
          <p className="text-xs text-text-muted">Saving…</p>
        )}
        {saveError && (
          <p className="text-xs text-red-600" role="alert">
            {saveError}
          </p>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          {showGapFields && !isSamplingControl && (
            <button
              type="button"
              className="btn-secondary"
              disabled={generating || !draftNotes.trim()}
              onClick={handleGenerate}
              title={
                !draftNotes.trim()
                  ? "Add assessor notes first"
                  : "Generate report-ready corrective actions with AI"
              }
            >
              {generating ? "Generating…" : "Generate"}
            </button>
          )}
          <button type="button" className="btn-primary" onClick={handleComplete}>
            Complete
          </button>
        </div>
      </div>
    </article>
  );
}
