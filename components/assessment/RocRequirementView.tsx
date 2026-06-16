"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatControlRef } from "@/lib/controls/catalog";
import {
  ensureRocProcedureNote,
  parseRocProcedureNotes,
  stringifyRocProcedureNotes,
} from "@/lib/roc/notes";
import type {
  ControlDefinition,
  ControlOutcome,
  RocProcedureNotesMap,
} from "@/lib/types";
import {
  getReportingDetailLabel,
  getReportingDetailPlaceholder,
} from "@/lib/roc/reporting-labels";
import { RocOutcomeSelect } from "./RocOutcomeSelect";

const AUTOSAVE_DELAY_MS = 1200;

const OUTCOME_LABELS: Record<string, string> = {
  in_place: "In Place",
  not_in_place: "Not in Place",
  not_applicable: "Not Applicable",
  not_tested: "Not Tested",
  in_place_compensating: "Compensating Control",
  customized_approach: "Customized Approach",
};

function outcomeBadgeClass(outcome: ControlOutcome): string {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold leading-none";
  switch (outcome) {
    case "in_place":
      return `${base} border-green-700/25 bg-green-100 text-green-800 dark:border-green-500/30 dark:bg-green-950/40 dark:text-green-200`;
    case "not_in_place":
      return `${base} border-red-700/20 bg-red-100 text-red-800 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200`;
    case "not_applicable":
      return `${base} border-slate-400/40 bg-slate-200 text-slate-700 dark:border-slate-500/40 dark:bg-slate-800 dark:text-slate-200`;
    case "not_tested":
      return `${base} border-violet-700/25 bg-violet-100 text-violet-900 dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-200`;
    case "in_place_compensating":
      return `${base} border-teal-700/25 bg-teal-100 text-teal-900 dark:border-teal-500/30 dark:bg-teal-950/40 dark:text-teal-200`;
    case "customized_approach":
      return `${base} border-indigo-700/25 bg-indigo-100 text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-200`;
    default:
      return `${base} border-border bg-muted text-text-muted`;
  }
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function RocRequirementView({
  control,
  outcome,
  notInPlaceReason,
  rocProcedureNotesJson,
  onSave,
  onOutcomeChange,
}: {
  control: ControlDefinition;
  outcome: ControlOutcome;
  notInPlaceReason: string;
  rocProcedureNotesJson: string;
  onSave: (patch: {
    outcome?: ControlOutcome;
    notInPlaceReason?: string;
    rocProcedureNotes?: RocProcedureNotesMap;
  }) => Promise<void>;
  onOutcomeChange?: (outcome: ControlOutcome) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [findingRationale, setFindingRationale] = useState(notInPlaceReason);
  const [procedureNotes, setProcedureNotes] = useState<RocProcedureNotesMap>(
    () => parseRocProcedureNotes(rocProcedureNotesJson)
  );

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const procedures = control.rocTestingProcedures ?? [];
  const ref = formatControlRef(control);
  const outcomeLabel =
    outcome != null ? OUTCOME_LABELS[outcome] ?? outcome : "Not reviewed";

  useEffect(() => {
    setFindingRationale(notInPlaceReason);
  }, [notInPlaceReason]);

  useEffect(() => {
    setProcedureNotes(parseRocProcedureNotes(rocProcedureNotesJson));
  }, [rocProcedureNotesJson]);

  const scheduleAutosave = useCallback(
    (patch: {
      notInPlaceReason?: string;
      rocProcedureNotes?: RocProcedureNotesMap;
    }) => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          await onSave(patch);
        } finally {
          setSaving(false);
        }
      }, AUTOSAVE_DELAY_MS);
    },
    [onSave]
  );

  const updateProcedureNote = (
    procedureRef: string,
    instructionCount: number,
    updater: (prev: ReturnType<typeof ensureRocProcedureNote>) => ReturnType<
      typeof ensureRocProcedureNote
    >
  ) => {
    setProcedureNotes((prev) => {
      const next = { ...prev };
      next[procedureRef] = updater(
        ensureRocProcedureNote(prev, procedureRef, instructionCount)
      );
      scheduleAutosave({ rocProcedureNotes: next });
      return next;
    });
  };

  return (
    <article className="rounded-xl border border-border bg-surface shadow-sm">
      <header className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-lg font-bold text-primary">{ref}</span>
          <span className={outcomeBadgeClass(outcome)}>{outcomeLabel}</span>
          {saving && (
            <span className="text-xs text-text-muted">Saving…</span>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          {control.section}
        </p>
      </header>

      <div className="space-y-6 px-5 py-5">
        <div className="rounded-xl border-2 border-primary/45 bg-primary/[0.04] p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">
            PCI DSS Requirement
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text">{control.title}</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Assessment findings
          </h2>
          <RocOutcomeSelect
            className="w-full max-w-xs"
            value={outcome}
            onChange={async (v) => {
              if (onOutcomeChange) await onOutcomeChange(v);
              else await onSave({ outcome: v });
            }}
          />
          <textarea
            id={`roc-rationale-${control.id}`}
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text"
            placeholder="Describe why the assessment finding was selected…"
            value={findingRationale}
            onChange={(e) => {
              setFindingRationale(e.target.value);
              scheduleAutosave({ notInPlaceReason: e.target.value });
            }}
          />
        </section>

        {procedures.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Testing procedures
            </h2>
            {procedures.map((proc) => {
              const note = ensureRocProcedureNote(
                procedureNotes,
                proc.ref,
                proc.reportingInstructions.length
              );
              return (
                <div
                  key={proc.ref}
                  className="rounded-lg border border-border bg-muted/20"
                >
                  <div className="border-b border-border bg-muted/40 px-4 py-2">
                    <span className="font-mono text-sm font-semibold text-primary">
                      {proc.ref}
                    </span>
                  </div>
                  <div className="space-y-4 px-4 py-4">
                    <p className="text-sm leading-relaxed text-text">
                      {proc.procedure}
                    </p>
                    <div>
                      <label
                        htmlFor={`roc-notes-${control.id}-${proc.ref}`}
                        className="text-xs font-semibold uppercase tracking-wide text-text-muted"
                      >
                        Assessor testing notes
                      </label>
                      <textarea
                        id={`roc-notes-${control.id}-${proc.ref}`}
                        rows={4}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text"
                        placeholder="Document testing performed, samples, observations…"
                        value={note.testingNotes}
                        onChange={(e) =>
                          updateProcedureNote(
                            proc.ref,
                            proc.reportingInstructions.length,
                            (prev) => ({
                              ...prev,
                              testingNotes: e.target.value,
                            })
                          )
                        }
                      />
                    </div>
                    {proc.reportingInstructions.map((instruction, idx) => {
                      const detailLabel = getReportingDetailLabel(instruction);
                      const detailPlaceholder =
                        getReportingDetailPlaceholder(instruction);
                      return (
                        <div
                          key={`${proc.ref}-${idx}`}
                          className="rounded-md border border-border bg-surface p-3"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                            {detailLabel}
                          </p>
                          <p className="mt-1 text-sm text-text">{instruction}</p>
                          <input
                            id={`roc-detail-${control.id}-${proc.ref}-${idx}`}
                            type="text"
                            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-text"
                            placeholder={detailPlaceholder}
                            value={note.reportingDetails[idx] ?? ""}
                            onChange={(e) =>
                              updateProcedureNote(
                                proc.ref,
                                proc.reportingInstructions.length,
                                (prev) => {
                                  const reportingDetails = [
                                    ...prev.reportingDetails,
                                  ];
                                  reportingDetails[idx] = e.target.value;
                                  return { ...prev, reportingDetails };
                                }
                              )
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </article>
  );
}

/** @deprecated Use RocRequirementView for ROC workspace panel layout. */
export function RocRequirementCard(props: Parameters<typeof RocRequirementView>[0]) {
  return <RocRequirementView {...props} />;
}

export function serializeRocProcedureNotesForSave(
  notes: RocProcedureNotesMap
): RocProcedureNotesMap {
  return parseRocProcedureNotes(stringifyRocProcedureNotes(notes));
}
