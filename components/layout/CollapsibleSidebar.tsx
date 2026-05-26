"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { DOMAINS } from "@/lib/controls/catalog";
import type { DomainId } from "@/lib/types";

const FRAMEWORK_NAME = "M365 Application Compliance Program";

/* ------------------------------------------------------------------ */
/*  SVG Icons (20×20 viewBox, currentColor)                            */
/* ------------------------------------------------------------------ */

function IconShield() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 1l7 3.5v5c0 4.4-2.9 8.3-7 9.5C5.9 17.8 3 13.9 3 9.5v-5L10 1z" />
    </svg>
  );
}
function IconServer() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 4a2 2 0 012-2h10a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V4zm0 6a2 2 0 012-2h10a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2zm2 6a2 2 0 00-2 2v0a2 2 0 002 2h10a2 2 0 002-2v0a2 2 0 00-2-2H5z" />
    </svg>
  );
}
function IconDatabase() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2C5.6 2 2 3.3 2 5v10c0 1.7 3.6 3 8 3s8-1.3 8-3V5c0-1.7-3.6-3-8-3zM4 7.3c1.5.9 3.6 1.5 6 1.5s4.5-.6 6-1.5V10c0 .6-2.5 1.8-6 1.8S4 10.6 4 10V7.3zm0 5c1.5.9 3.6 1.5 6 1.5s4.5-.6 6-1.5V15c0 .6-2.5 1.8-6 1.8S4 15.6 4 15v-2.7z" />
    </svg>
  );
}
function IconList() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  );
}
function IconEyeOff() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3.7 2.3a1 1 0 00-1.4 1.4l14 14a1 1 0 001.4-1.4l-2.2-2.2A9.7 9.7 0 0018 10s-3.1-6-8-6a7 7 0 00-3.3.8L3.7 2.3zM10 6a4 4 0 013.9 4.9l-4.8-4.8A4 4 0 0110 6z" />
      <path d="M2 10s1.5-3 4.1-4.6L4.7 4A10 10 0 002 10zm5.1.9A3 3 0 0010 13l-2.9-2.1z" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.3 3.1a2 2 0 013.4 0l5.8 9.7A2 2 0 0115.8 16H4.2a2 2 0 01-1.7-3.2l5.8-9.7zM10 7a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 0110 7zm1 6.5a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
    </svg>
  );
}
function IconFire() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M13.5 3A1.5 1.5 0 0012 4.5v1.9a6.02 6.02 0 00-4.8 2.4A5.03 5.03 0 006 12.5a5.5 5.5 0 005.5 5.5 5.5 5.5 0 005.5-5.5c0-2.3-.8-4.6-2.4-6.3l-.5-.5A1.5 1.5 0 0013.5 3zM10 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
    </svg>
  );
}
function IconMenu() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 5h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2z" clipRule="evenodd" />
    </svg>
  );
}
function IconChevronLeft() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M12.7 5.3a1 1 0 010 1.4L9.4 10l3.3 3.3a1 1 0 01-1.4 1.4l-4-4a1 1 0 010-1.4l4-4a1 1 0 011.4 0z" clipRule="evenodd" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Domain / Filter icon mapping                                       */
/* ------------------------------------------------------------------ */

const DOMAIN_ICONS: Record<string, () => ReactNode> = {
  application_security: IconShield,
  operational_security: IconServer,
  data_handling: IconDatabase,
};

const FILTER_CONFIG = [
  { id: "all", label: "All controls", Icon: IconList },
  { id: "open", label: "Not reviewed", Icon: IconEyeOff },
  { id: "not_in_place", label: "Gaps", Icon: IconAlert },
  { id: "hard_fail", label: "Hard fail", Icon: IconFire },
] as const;

/* ------------------------------------------------------------------ */
/*  Sidebar Item with tooltip when collapsed                           */
/* ------------------------------------------------------------------ */

function SidebarItem({
  href,
  icon,
  label,
  active,
  collapsed,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <li className="relative">
      <Link
        href={href}
        className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
          active
            ? "bg-neutral-200/80 font-semibold text-text"
            : "text-text hover:bg-neutral-200/50"
        } ${collapsed ? "justify-center" : ""}`}
        title={collapsed ? label : undefined}
      >
        <span className={active ? "text-text" : "text-text-muted"}>
          {icon}
        </span>
        {!collapsed && <span>{label}</span>}
        {collapsed && (
          <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-neutral-800 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {label}
          </span>
        )}
      </Link>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Main sidebar                                                       */
/* ------------------------------------------------------------------ */

export function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(false);
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

  const width = collapsed ? "w-14" : "w-64";

  /* ---- Non-assessment pages (idle sidebar) ---- */
  if (!isAssessment) {
    return (
      <aside
        className={`${width} hidden shrink-0 flex-col border-r border-neutral-200 bg-sidebar transition-all duration-200 lg:flex`}
      >
        <ToggleButton collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        {!collapsed && (
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Framework
            </p>
            <p className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-xs text-text">
              {FRAMEWORK_NAME}
            </p>
            <p className="mt-4 px-3 text-xs text-text-muted">
              Start or open an assessment to navigate domains and filters.
            </p>
          </div>
        )}
      </aside>
    );
  }

  /* ---- Assessment pages ---- */
  return (
    <aside
      className={`${width} hidden shrink-0 flex-col border-r border-neutral-200 bg-sidebar transition-all duration-200 lg:flex`}
    >
      <ToggleButton collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {!collapsed && (
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Domains
          </p>
        )}
        {collapsed && <div className="mb-1 border-b border-neutral-200 pb-1" />}
        <ul className="space-y-0.5">
          {DOMAINS.map((d) => {
            const Icon = DOMAIN_ICONS[d.id] ?? IconShield;
            return (
              <SidebarItem
                key={d.id}
                href={assessmentHref(d.id, activeFilter)}
                icon={<Icon />}
                label={d.label}
                active={activeDomain === d.id}
                collapsed={collapsed}
              />
            );
          })}
        </ul>

        <div className="my-3 border-b border-neutral-200" />

        {!collapsed && (
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Filter
          </p>
        )}
        <ul className="space-y-0.5">
          {FILTER_CONFIG.map((f) => (
            <SidebarItem
              key={f.id}
              href={assessmentHref(activeDomain, f.id)}
              icon={<f.Icon />}
              label={f.label}
              active={activeFilter === f.id}
              collapsed={collapsed}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Toggle button                                                      */
/* ------------------------------------------------------------------ */

function ToggleButton({
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
      className="group relative flex h-11 items-center justify-center border-b border-neutral-200 text-text-muted transition hover:bg-neutral-200/50 hover:text-text"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? (
        <IconMenu />
      ) : (
        <span className="flex w-full items-center justify-between px-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Menu
          </span>
          <IconChevronLeft />
        </span>
      )}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-neutral-800 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          Expand menu
        </span>
      )}
    </button>
  );
}
