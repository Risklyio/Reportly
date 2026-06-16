"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildRocRequirementTree } from "@/lib/roc/tree";
import type {
  AssessmentControlState,
  ControlDefinition,
  ControlOutcome,
} from "@/lib/types";

function outcomeDotClass(outcome: ControlOutcome): string {
  if (outcome == null) return "bg-muted-foreground/35";
  switch (outcome) {
    case "in_place":
      return "bg-green-500";
    case "not_in_place":
      return "bg-red-500";
    case "not_applicable":
      return "bg-slate-400";
    case "not_tested":
      return "bg-violet-500";
    case "in_place_compensating":
      return "bg-primary";
    case "customized_approach":
      return "bg-indigo-500";
    default:
      return "bg-amber-500";
  }
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 text-text-muted transition-transform ${open ? "rotate-90" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function RocRequirementTree({
  assessmentId,
  frameworkId,
  activeRef,
  states,
  filter,
  controls,
}: {
  assessmentId: string;
  frameworkId: string;
  activeRef: string | null;
  states: Map<string, AssessmentControlState>;
  filter: string;
  controls: ControlDefinition[];
}) {
  const controlById = useMemo(
    () => new Map(controls.map((c) => [c.id, c])),
    [controls]
  );
  const tree = useMemo(
    () => buildRocRequirementTree(frameworkId),
    [frameworkId]
  );

  const [openDomains, setOpenDomains] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const d of tree) {
      const hasActive = d.children.some((c) => c.requirementRef === activeRef);
      initial[d.domainId] = hasActive || d === tree[0];
    }
    return initial;
  });

  function controlHref(ref: string) {
    const params = new URLSearchParams();
    params.set("ref", ref);
    if (filter !== "all") params.set("filter", filter);
    return `/assessments/${assessmentId}?${params.toString()}`;
  }

  function controlVisible(controlId: string, outcome: ControlOutcome): boolean {
    const control = controlById.get(controlId);
    if (filter === "hard_fail") return control?.hardFail ?? false;
    if (filter === "all") return true;
    if (filter === "open") return outcome == null;
    if (filter === "not_in_place") {
      return outcome === "not_in_place" || outcome === "partially_in_place";
    }
    return true;
  }

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-border bg-sidebar max-md:hidden">
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Requirements
        </p>
        <p className="mt-0.5 text-sm font-medium text-text">PCI DSS ROC</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {tree.length === 0 ? (
          <p className="px-2 text-xs text-text-muted">
            No requirements loaded for this framework.
          </p>
        ) : (
        <ul className="space-y-1">
          {tree.map((domain) => {
            const open = openDomains[domain.domainId] ?? false;
            const visibleChildren = domain.children.filter((c) =>
              controlVisible(c.controlId, states.get(c.controlId)?.outcome ?? null)
            );
            if (filter !== "all" && visibleChildren.length === 0) return null;

            return (
              <li key={domain.domainId}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenDomains((p) => ({
                      ...p,
                      [domain.domainId]: !open,
                    }))
                  }
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold text-text hover:bg-muted"
                >
                  <Chevron open={open} />
                  <span className="font-mono text-xs text-primary">
                    {domain.shortLabel}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-text-muted">
                    {domain.label.replace(/^Requirement \d+: |^Appendix A\d+: /, "")}
                  </span>
                </button>
                {open && (
                  <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-2">
                    {(filter === "all" ? domain.children : visibleChildren).map(
                      (child) => {
                        const outcome =
                          states.get(child.controlId)?.outcome ?? null;
                        const active = child.requirementRef === activeRef;
                        return (
                          <li key={child.controlId}>
                            <Link
                              href={controlHref(child.requirementRef)}
                              className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                                active
                                  ? "bg-primary/10 font-semibold text-primary ring-1 ring-inset ring-primary/25"
                                  : "text-text hover:bg-muted"
                              }`}
                              title={child.label}
                            >
                              <span
                                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${outcomeDotClass(outcome)}`}
                                aria-hidden
                              />
                              <span className="min-w-0 font-mono text-xs">
                                {child.requirementRef}
                              </span>
                            </Link>
                          </li>
                        );
                      }
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        )}
        {filter !== "all" &&
          tree.every((domain) =>
            domain.children.every(
              (c) =>
                !controlVisible(
                  c.controlId,
                  states.get(c.controlId)?.outcome ?? null
                )
            )
          ) && (
            <p className="mt-2 px-2 text-xs text-text-muted">
              No requirements match this filter. Try &ldquo;All&rdquo; in the left
              sidebar.
            </p>
          )}
      </nav>
    </aside>
  );
}
