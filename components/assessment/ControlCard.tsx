"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatControlRef } from "@/lib/controls/catalog";
import type { ControlDefinition, ControlOutcome } from "@/lib/types";
import { OutcomeSelector } from "./OutcomeSelector";

const OUTCOME_LABELS: Record<string, string> = {
  in_place: "In place",
  not_in_place: "Not in place",
  partially_in_place: "Partially in place",
  not_applicable: "Not applicable",
};

/** Wait after typing stops before autosave (reduces lag and API calls) */
const AUTOSAVE_DELAY_MS = 1200;

function outcomeBadgeClass(outcome: ControlOutcome): string {
  switch (outcome) {
    case "in_place":
      return "bg-green-100 text-green-800";
    case "not_in_place":
      return "bg-red-100 text-red-800";
    case "partially_in_place":
      return "bg-amber-100 text-amber-900";
    case "not_applicable":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-muted text-text-muted";
  }
}

type TextPatch = {
  notInPlaceReason?: string;
  assessorNotes?: string;
  correctiveAction?: string;
};

export function ControlCard({
  assessmentId,
  control,
  outcome,
  notInPlaceReason,
  assessorNotes,
  correctiveAction,
  onSave,
  onSuggest,
}: {
  assessmentId: string;
  control: ControlDefinition;
  outcome: ControlOutcome;
  notInPlaceReason: string;
  assessorNotes: string;
  correctiveAction: string;
  onSave: (patch: {
    outcome?: ControlOutcome;
    notInPlaceReason?: string;
    assessorNotes?: string;
    correctiveAction?: string;
  }) => Promise<void>;
  onSuggest: () => Promise<{ text: string; links: string[] }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [draftReason, setDraftReason] = useState(notInPlaceReason);
  const [draftNotes, setDraftNotes] = useState(assessorNotes);
  const [draftCorrective, setDraftCorrective] = useState(correctiveAction);

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
  }, [control.id, notInPlaceReason, assessorNotes, correctiveAction]);

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  const showGapFields =
    outcome === "not_in_place" || outcome === "partially_in_place";

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
        throw new Error(data.error ?? "Failed to generate corrective actions");
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

  async function handleComplete() {
    if (showGapFields) {
      pendingPatch.current = {
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
            <span
              className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${outcomeBadgeClass(outcome)}`}
            >
              {outcomeLabel}
            </span>
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
            Microsoft docs
          </a>
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

      <div id={`${control.id}-panel`} className="space-y-4">
        <div>
          <label className="label">Outcome</label>
          <OutcomeSelector
            value={outcome}
            onChange={(v) => void persist({ outcome: v })}
          />
        </div>

        {showGapFields && (
          <>
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
              <label className="label">Assessor notes</label>
              <p className="mb-1 text-xs text-text-muted">
                Internal working notes only — not included in the PDF or Word export.
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
          {showGapFields && (
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
