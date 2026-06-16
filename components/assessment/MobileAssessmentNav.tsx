"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildRocRequirementTree,
  getDefaultRocRef,
} from "@/lib/roc/tree";
import {
  getDomainsForFramework,
  PCI_ROC_FRAMEWORK_ID,
} from "@/lib/controls/catalog";
import type { AssessmentControlState, DomainId } from "@/lib/types";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "not_in_place", label: "Gaps" },
  { id: "hard_fail", label: "Hard fail" },
] as const;

export function MobileAssessmentNav({
  assessmentId,
  frameworkId,
  states,
}: {
  assessmentId: string;
  frameworkId: string;
  states?: Map<string, AssessmentControlState>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRoc = frameworkId === PCI_ROC_FRAMEWORK_ID;
  const isDashboard = searchParams.get("view") === "dashboard";
  const activeRef = searchParams.get("ref") ?? getDefaultRocRef(frameworkId) ?? "";
  const domains = getDomainsForFramework(frameworkId);
  const domain =
    (searchParams.get("domain") as DomainId) || domains[0]?.id || "";
  const filter = searchParams.get("filter") ?? "all";

  function domainHref(d: string, f: string) {
    return `/assessments/${assessmentId}?domain=${d}&filter=${f}`;
  }

  function refHref(ref: string) {
    const params = new URLSearchParams({ ref });
    if (filter !== "all") params.set("filter", filter);
    return `/assessments/${assessmentId}?${params.toString()}`;
  }

  if (isRoc) {
    const tree = buildRocRequirementTree(frameworkId);
    return (
      <div className="mb-4 space-y-3 md:hidden">
        <div className="flex gap-2">
          <Link
            href={`/assessments/${assessmentId}?view=dashboard`}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
              isDashboard
                ? "bg-primary font-semibold text-primary-foreground"
                : "border border-border bg-surface text-text"
            }`}
          >
            Dashboard
          </Link>
        </div>
        {!isDashboard && (
          <>
            <select
              className="input w-full text-sm"
              value={activeRef}
              onChange={(e) => router.push(refHref(e.target.value))}
            >
              {tree.map((domainNode) => (
                <optgroup
                  key={domainNode.domainId}
                  label={`${domainNode.shortLabel}: ${domainNode.label}`}
                >
                  {domainNode.children.map((child) => (
                    <option key={child.controlId} value={child.requirementRef}>
                      {child.requirementRef}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map((f) => {
                const params = new URLSearchParams();
                if (activeRef) params.set("ref", activeRef);
                if (f.id !== "all") params.set("filter", f.id);
                return (
                  <Link
                    key={f.id}
                    href={`/assessments/${assessmentId}?${params.toString()}`}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                      filter === f.id
                        ? "bg-primary font-semibold text-primary-foreground"
                        : "border border-border bg-surface text-text"
                    }`}
                  >
                    {f.label}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-3 lg:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {domains.map((d) => (
          <Link
            key={d.id}
            href={domainHref(d.id, filter)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
              domain === d.id
                ? "bg-primary font-semibold text-primary-foreground"
                : "border border-border bg-surface text-text"
            }`}
          >
            {d.shortLabel}
          </Link>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={domainHref(domain, f.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
              filter === f.id
                ? "bg-primary font-semibold text-primary-foreground"
                : "border border-border bg-surface text-text"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
