"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DOMAINS } from "@/lib/controls/catalog";
import type { DomainId } from "@/lib/types";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "not_in_place", label: "Gaps" },
  { id: "hard_fail", label: "Hard fail" },
] as const;

export function MobileAssessmentNav({ assessmentId }: { assessmentId: string }) {
  const searchParams = useSearchParams();
  const domain =
    (searchParams.get("domain") as DomainId) || "application_security";
  const filter = searchParams.get("filter") ?? "all";

  function href(d: string, f: string) {
    return `/assessments/${assessmentId}?domain=${d}&filter=${f}`;
  }

  return (
    <div className="mb-4 space-y-3 lg:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DOMAINS.map((d) => (
          <Link
            key={d.id}
            href={href(d.id, filter)}
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
            href={href(domain, f.id)}
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
