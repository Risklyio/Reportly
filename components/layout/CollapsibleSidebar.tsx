"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  DOMAINS,
  FRAMEWORKS,
  getDomainsForFramework,
} from "@/lib/controls/catalog";
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

function IconFileText() {
  return (
    <svg className={IC} viewBox="0 0 24 24" fill="none" stroke={STROKE_COLOR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg className="h-4 w-4 shrink-0 transition-transform" viewBox="0 0 24 24" fill="none" stroke={STROKE_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
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
  ce_external_vulnerability_assessment: IconShield,
  ce_authenticated_vulnerability_assessment: IconCheckCircle,
  ce_malware_protection: IconAlertTriangle,
  ce_multi_factor_authentication: IconCheckCircle,
  ce_account_separation: IconDatabase,
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
        <span className="flex items-center justify-center">{icon}</span>
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
/*  Report dropdown                                                    */
/* ------------------------------------------------------------------ */

const EXPORT_FORMATS = [
  { id: "pdf", label: "PDF Report", ext: "pdf" },
  { id: "docx", label: "Word (DOCX)", ext: "docx" },
  { id: "html", label: "HTML Report", ext: "html" },
] as const;

function ReportDropdown({
  assessmentId,
  collapsed,
}: {
  assessmentId: string;
  collapsed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const containerRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function exportUrl(format: string) {
    if (format === "pdf") return `/api/assessments/${assessmentId}/export/pdf`;
    if (format === "html") return `/api/assessments/${assessmentId}/export/html`;
    return `/api/assessments/${assessmentId}/export`;
  }

  async function handleExport(format: string) {
    setDownloading(format);
    try {
      const url = exportUrl(format);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+?)"/);
      a.download = match?.[1] ?? `report.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch {
      /* silently fail */
    } finally {
      setDownloading(null);
      setOpen(false);
    }
  }

  if (collapsed) {
    return (
      <li ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="group flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm text-text transition hover:bg-neutral-200/50"
          title="Generate Report"
        >
          <span className="flex items-center justify-center">
            <IconFileText />
          </span>
          <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-neutral-800 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            Generate Report
          </span>
        </button>
        {open && (
          <div
            className="absolute left-full top-0 z-50 ml-2 w-44 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
          >
            {EXPORT_FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleExport(f.id)}
                disabled={downloading !== null}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text transition hover:bg-neutral-100 disabled:opacity-50"
              >
                {downloading === f.id ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
                ) : (
                  <IconFileText />
                )}
                {f.label}
              </button>
            ))}
          </div>
        )}
      </li>
    );
  }

  return (
    <li ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text transition hover:bg-neutral-200/50"
      >
        <span className="flex items-center justify-center">
          <IconFileText />
        </span>
        <span className="flex-1 text-left">Generate Report</span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <IconChevronDown />
        </span>
      </button>
      {open && (
        <ul className="ml-8 mt-0.5 space-y-0.5">
          {EXPORT_FORMATS.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => handleExport(f.id)}
                disabled={downloading !== null}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm text-text transition hover:bg-neutral-200/50 disabled:opacity-50"
              >
                {downloading === f.id && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
                )}
                {f.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Main sidebar                                                       */
/* ------------------------------------------------------------------ */

export function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [frameworkName, setFrameworkName] = useState(FRAMEWORK_NAME);
  const [frameworkDomains, setFrameworkDomains] = useState(DOMAINS);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeDomain =
    (searchParams.get("domain") as DomainId | null) ??
    frameworkDomains[0]?.id ??
    "application_security";
  const activeFilter = searchParams.get("filter") ?? "all";

  const assessmentMatch = pathname.match(/^\/assessments\/([^/]+)/);
  const assessmentId = assessmentMatch?.[1];
  const isAssessment =
    assessmentId && assessmentId !== "new" && !pathname.endsWith("/export");

  useEffect(() => {
    async function loadAssessmentFramework() {
      if (!assessmentId || !isAssessment) return;
      try {
        const res = await fetch(`/api/assessments/${assessmentId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          assessment?: { frameworkId?: string };
        };
        const fwId = data.assessment?.frameworkId;
        if (!fwId) return;
        const fw = FRAMEWORKS.find((f) => f.id === fwId);
        if (fw) {
          setFrameworkName(fw.name);
          setFrameworkDomains(getDomainsForFramework(fw.id));
        }
      } catch {
        // keep defaults
      }
    }
    void loadAssessmentFramework();
  }, [assessmentId, isAssessment]);

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
              {frameworkName}
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
        {/* Domains */}
        {!collapsed && (
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Domains
          </p>
        )}
        {collapsed && <div className="mb-1 border-b border-neutral-200 pb-1" />}
        <ul className="space-y-0.5">
          {frameworkDomains.map((d) => {
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

        {/* Filters */}
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

        <div className="my-3 border-b border-neutral-200" />

        {/* Report */}
        {!collapsed && (
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Report
          </p>
        )}
        <ul className="space-y-0.5">
          <ReportDropdown assessmentId={assessmentId} collapsed={collapsed} />
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
