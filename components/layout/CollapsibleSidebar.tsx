"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DOMAINS } from "@/lib/controls/catalog";
import type { DomainId } from "@/lib/types";

const FRAMEWORK_NAME = "M365 Application Compliance Program";

const FILTERS = [
  { id: "all", label: "All controls" },
  { id: "open", label: "Not reviewed" },
  { id: "not_in_place", label: "Gaps" },
  { id: "hard_fail", label: "Hard fail" },
] as const;

export function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [frameworkOpen, setFrameworkOpen] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeDomain =
    (searchParams.get("domain") as DomainId | null) ?? "application_security";
  const activeFilter = searchParams.get("filter") ?? "all";

  const assessmentMatch = pathname.match(/^\/assessments\/([^/]+)/);
  const assessmentId = assessmentMatch?.[1];
  const isAssessment =
    assessmentId && assessmentId !== "new" && !pathname.endsWith("/export");

  function assessmentHref(domain: DomainId, filter: string) {
    return `/assessments/${assessmentId}?domain=${domain}&filter=${filter}`;
  }

  const asideClass = `shrink-0 border-neutral-200 bg-sidebar transition-all flex flex-col ${
    collapsed ? "w-12" : "w-72"
  } border-r`;

  if (!isAssessment) {
    return (
      <aside className={`${asideClass} hidden lg:flex`}>
        <SidebarToggle
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
        {!collapsed && (
          <div className="p-4 text-sm text-text-muted">
            <p className="mb-2 font-medium text-text">Frameworks</p>
            <p className="rounded-lg border border-neutral-200 bg-white p-3 text-xs text-text">
              {FRAMEWORK_NAME}
            </p>
            <p className="mt-3 text-xs">
              Start or open an assessment to navigate domains and filters.
            </p>
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside className={`${asideClass} hidden lg:flex`}>
      <SidebarToggle
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      {!collapsed && (
        <div className="flex flex-col overflow-y-auto p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Framework
          </p>
          <button
            type="button"
            onClick={() => setFrameworkOpen(!frameworkOpen)}
            className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-medium text-text hover:bg-neutral-100"
          >
            <span className="line-clamp-2">{FRAMEWORK_NAME}</span>
            <span className="text-text-muted">{frameworkOpen ? "−" : "+"}</span>
          </button>

          {frameworkOpen && (
            <>
              <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Domains
              </p>
              <ul className="space-y-1">
                {DOMAINS.map((d) => {
                  const href = assessmentHref(d.id, activeFilter);
                  const active = activeDomain === d.id;
                  return (
                    <li key={d.id}>
                      <Link
                        href={href}
                        className={`block rounded-lg px-3 py-2 text-sm transition ${
                          active
                            ? "bg-primary font-semibold text-primary-foreground"
                            : "text-text hover:bg-neutral-100"
                        }`}
                      >
                        {d.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Filter
              </p>
              <ul className="space-y-1">
                {FILTERS.map((f) => {
                  const href = assessmentHref(activeDomain, f.id);
                  const active = activeFilter === f.id;
                  return (
                    <li key={f.id}>
                      <Link
                        href={href}
                        className={`block rounded-lg px-3 py-2 text-sm transition ${
                          active
                            ? "bg-primary font-semibold text-primary-foreground"
                            : "text-text hover:bg-neutral-100"
                        }`}
                      >
                        {f.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </aside>
  );
}

function SidebarToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex h-10 items-center justify-center border-b border-neutral-200 text-text-muted transition hover:bg-neutral-100 hover:text-text"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? "»" : "«"}
    </button>
  );
}
