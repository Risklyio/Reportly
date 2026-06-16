"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getDomainsForFramework,
  PCI_ROC_FRAMEWORK_ID,
} from "@/lib/controls/catalog";
import type { DomainId } from "@/lib/types";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "not_in_place", label: "Gaps" },
  { id: "hard_fail", label: "Hard fail" },
] as const;

export function MobileAssessmentNav({
  assessmentId,
  frameworkId,
}: {
  assessmentId: string;
  frameworkId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRoc = frameworkId === PCI_ROC_FRAMEWORK_ID;
  const isDashboard = searchParams.get("view") === "dashboard";
  const domains = getDomainsForFramework(frameworkId);
  const domain =
    (searchParams.get("domain") as DomainId) || domains[0]?.id || "";
  const filter = searchParams.get("filter") ?? "all";

  function href(d: string, f: string) {
    return `/assessments/${assessmentId}?domain=${d}&filter=${f}`;
  }

  if (isRoc) {
    const selected = domains.find((d) => d.id === domain) ?? domains[0];
    return (
      <div className="mb-4 space-y-3 lg:hidden">
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
              value={domain}
              onChange={(e) => {
                router.push(href(e.target.value, filter));
              }}
            >
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.shortLabel}: {d.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map((f) => (
                <Link
                  key={f.id}
                  href={href(selected?.id ?? domain, f.id)}
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
