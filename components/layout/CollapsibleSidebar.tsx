"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { DOMAINS } from "@/lib/controls/catalog";
import type { DomainId } from "@/lib/types";

const FRAMEWORK_NAME = "M365 Application Compliance Program";

/* ------------------------------------------------------------------ */
/*  SVG Icons – 24×24 stroke-based for crisp rendering at all sizes    */
/*  All icons use #060606 to match the site's deep black               */
/* ------------------------------------------------------------------ */

const IC = "h-[22px] w-[22px] shrink-0";
const STROKE_COLOR = "#060606";

function IconShield() {
  return (
    <svg className={IC} viewBox="0 0 24 24" fill="none" stroke={STROKE_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 4v6c0 5.25-3.4 9.74-8 11-4.6-1.26-8-5.75-8-11V6l8-4z" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg className={IC} viewBox="0 0 24 24" fill="none" stroke={STROKE_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconDatabase() {
  return (
    <svg className={IC} viewBox="0 0 24 24" fill="none" stroke={STROKE_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  );
}

function IconList() {
  return (
    <svg className={IC} viewBox="0 0 24 24" fill="none" stroke={STROKE_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg className={IC} viewBox="0 0 24 24" fill="none" stroke={STROKE_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function IconAlertTriangle() {
  return (
    <svg className={IC} viewBox="0 0 24 24" fill="none" stroke={STROKE_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconXOctagon() {
  return (
    <svg className={IC} viewBox="0 0 24 24" fill="none" stroke={STROKE_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg className={IC} viewBox="0 0 24 24" fill="none" stroke={STROKE_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg className={IC} viewBox="0 0 24 24" fill="none" stroke={STROKE_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Domain / Filter icon mapping                                       */
/* ------------------------------------------------------------------ */

const DOMAIN_ICONS: Record<string, () => ReactNode> = {
  application_security: IconShield,
  operational_security: IconCheckCircle,
  data_handling: IconDatabase,
};

const FILTER_CONFIG = [
  { id: "all", label: "All controls", Icon: IconList },
  { id: "open", label: "Not reviewed", Icon: IconEyeOff },
  { id: "not_in_place", label: "Gaps", Icon: IconAlertTriangle },
  { id: "hard_fail", label: "Hard fail", Icon: IconXOctagon },
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
        <span className="flex items-center justify-center">
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
