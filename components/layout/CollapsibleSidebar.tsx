"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DOMAINS } from "@/lib/controls/catalog";
import type { DomainId } from "@/lib/types";

const FRAMEWORK_NAME = "M365 Application Compliance Program";

export function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [frameworkOpen, setFrameworkOpen] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeDomain = searchParams.get("domain") as DomainId | null;

  const assessmentMatch = pathname.match(/^\/assessments\/([^/]+)/);
  const assessmentId = assessmentMatch?.[1];
  const isAssessment =
    assessmentId && assessmentId !== "new" && !pathname.endsWith("/export");

  if (!isAssessment) {
    return (
      <aside
        className={`border-l border-border bg-surface transition-all ${
          collapsed ? "w-12" : "w-72"
        } hidden lg:flex flex-col shrink-0`}
      >
        <SidebarToggle collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        {!collapsed && (
          <div className="p-4 text-sm text-text-muted">
            <p className="font-medium text-text mb-2">Frameworks</p>
            <p className="rounded-lg border border-border bg-muted p-3 text-xs">
              {FRAMEWORK_NAME}
            </p>
            <p className="mt-3 text-xs">
              Start or open an assessment to navigate control domains.
            </p>
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside
      className={`border-l border-border bg-surface transition-all ${
        collapsed ? "w-12" : "w-72"
      } hidden lg:flex flex-col shrink-0`}
    >
      <SidebarToggle collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      {!collapsed && (
        <div className="flex flex-col overflow-y-auto p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
            Frameworks
          </p>
          <button
            type="button"
            onClick={() => setFrameworkOpen(!frameworkOpen)}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-muted px-3 py-2 text-left text-sm font-medium text-text hover:bg-primary-light/30"
          >
            <span className="line-clamp-2">{FRAMEWORK_NAME}</span>
            <span className="text-text-muted">{frameworkOpen ? "−" : "+"}</span>
          </button>
          {frameworkOpen && (
            <ul className="mt-2 space-y-1">
              {DOMAINS.map((d) => {
                const href = `/assessments/${assessmentId}?domain=${d.id}`;
                const active = activeDomain === d.id;
                return (
                  <li key={d.id}>
                    <Link
                      href={href}
                      className={`block rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? "bg-primary text-white"
                          : "text-text hover:bg-muted"
                      }`}
                    >
                      {d.shortLabel}
                    </Link>
                  </li>
                );
              })}
            </ul>
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
      className="flex h-10 items-center justify-center border-b border-border text-text-muted hover:bg-muted hover:text-text"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? "«" : "»"}
    </button>
  );
}
