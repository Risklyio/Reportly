"use client";

import { useEffect, useState } from "react";
import { formatControlRef } from "@/lib/controls/catalog";
import type { ControlDefinition, ControlOutcome } from "@/lib/types";
import { OutcomeSelector } from "./OutcomeSelector";

const OUTCOME_LABELS: Record<string, string> = {
  in_place: "In place",
  not_in_place: "Not in place",
  partially_in_place: "Partially in place",
  not_applicable: "Not applicable",
};

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

export function ControlCard({
  control,
  outcome,
  notInPlaceReason,
  correctiveAction,
  onSave,
  onSuggest,
}: {
  control: ControlDefinition;
  outcome: ControlOutcome;
  notInPlaceReason: string;
  correctiveAction: string;
  onSave: (patch: {
    outcome?: ControlOutcome;
    notInPlaceReason?: string;
    correctiveAction?: string;
  }) => Promise<void>;
  onSuggest: () => Promise<{ text: string; links: string[] }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === `#${control.id}`) {
      setExpanded(true);
    }
  }, [control.id]);
  const [suggesting, setSuggesting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const showGapFields =
    outcome === "not_in_place" || outcome === "partially_in_place";

  async function handleSuggest() {
    setSuggesting(true);
    try {
      const result = await onSuggest();
      const linksBlock = result.links.length
        ? `\n\nReferences:\n${result.links.map((l) => `• ${l}`).join("\n")}`
        : "";
      await onSave({ correctiveAction: result.text + linksBlock });
    } finally {
      setSuggesting(false);
    }
  }

  async function save(patch: Parameters<typeof onSave>[0]) {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(patch);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
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
            <p className="mt-0.5 text-sm font-semibold text-text">
              <span className="text-text-muted">{formatControlRef(control)}</span>{" "}
              {control.title}
            </p>
          </div>
          <div className="grid w-[13.5rem] shrink-0 grid-cols-[4.75rem_6.75rem_1rem] items-center gap-1.5">
            <span
              className={`inline-flex justify-center ${
                control.hardFail ? "" : "invisible"
              }`}
              aria-hidden={!control.hardFail}
            >
              <span className="badge-hard-fail whitespace-nowrap">HARD FAIL</span>
            </span>
            <span
              className={`inline-flex justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${outcomeBadgeClass(outcome)}`}
            >
              {outcomeLabel}
            </span>
            <span className="text-center text-text-muted" aria-hidden>
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
          <h3 className="text-base font-semibold text-text">
            <span className="text-text-muted">{formatControlRef(control)}</span>{" "}
            {control.title}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {control.hardFail && (
            <span className="badge-hard-fail">HARD FAIL</span>
          )}
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
      <p className="mb-4 text-sm text-text-muted whitespace-pre-line">
        {control.intent}
      </p>

      <div id={`${control.id}-panel`} className="space-y-4">
        <div>
          <label className="label">Outcome</label>
          <OutcomeSelector
            value={outcome}
            onChange={(v) => save({ outcome: v })}
          />
        </div>

        {showGapFields && (
          <>
            <div>
              <label className="label">Why not in place</label>
              <select
                className="input mb-2"
                value={notInPlaceReason}
                onChange={(e) => save({ notInPlaceReason: e.target.value })}
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
                value={notInPlaceReason}
                onChange={(e) => save({ notInPlaceReason: e.target.value })}
                onBlur={(e) => save({ notInPlaceReason: e.target.value })}
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="label mb-0">Corrective actions</label>
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                  disabled={suggesting || !notInPlaceReason}
                  onClick={handleSuggest}
                >
                  {suggesting ? "Suggesting…" : "Suggest"}
                </button>
              </div>
              <textarea
                className="input min-h-[100px]"
                rows={4}
                value={correctiveAction}
                onChange={(e) =>
                  save({ correctiveAction: e.target.value })
                }
                onBlur={(e) =>
                  save({ correctiveAction: e.target.value })
                }
                placeholder="Document planned or completed remediation…"
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        {saving && (
          <p className="text-xs text-text-muted">Saving…</p>
        )}
        {saveError && (
          <p className="text-xs text-red-600" role="alert">
            {saveError}
          </p>
        )}
        <button
          type="button"
          className="btn-primary ml-auto"
          onClick={() => setExpanded(false)}
        >
          Complete
        </button>
      </div>
    </article>
  );
}
