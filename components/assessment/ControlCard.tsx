"use client";

import { useState } from "react";
import type { ControlDefinition, ControlOutcome } from "@/lib/types";
import { OutcomeSelector } from "./OutcomeSelector";

export function ControlCard({
  control,
  outcome,
  notInPlaceReason,
  correctiveAction,
  evidenceNotes,
  onSave,
  onSuggest,
}: {
  control: ControlDefinition;
  outcome: ControlOutcome;
  notInPlaceReason: string;
  correctiveAction: string;
  evidenceNotes: string;
  onSave: (patch: {
    outcome?: ControlOutcome;
    notInPlaceReason?: string;
    correctiveAction?: string;
    evidenceNotes?: string;
  }) => Promise<void>;
  onSuggest: () => Promise<{ text: string; links: string[] }>;
}) {
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
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
    try {
      await onSave(patch);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="card" id={control.id}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-text-muted">{control.section}</p>
          <h3 className="text-base font-semibold text-text">
            <span className="text-text-muted">#{control.number}</span> {control.title}
          </h3>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>
      <p className="mb-4 text-sm text-text-muted">{control.intent}</p>

      <div className="space-y-4">
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

        <div>
          <label className="label">Evidence notes</label>
          <textarea
            className="input min-h-[72px]"
            rows={2}
            value={evidenceNotes}
            onChange={(e) => save({ evidenceNotes: e.target.value })}
            onBlur={(e) => save({ evidenceNotes: e.target.value })}
            placeholder="Screenshots, policies, ticket IDs…"
          />
        </div>
      </div>
      {saving && (
        <p className="mt-2 text-xs text-text-muted">Saving…</p>
      )}
    </article>
  );
}
