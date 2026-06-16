"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { AssessmentListItem } from "@/lib/types";
import { FRAMEWORKS } from "@/lib/controls/catalog";

function formatOptionLabel(a: AssessmentListItem): string {
  return `${a.clientName} — ${a.appName} (assessment: ${a.assessmentDate}${a.dueDate ? `, due: ${a.dueDate}` : ""})`;
}

function AssessmentSelect({
  id,
  label,
  emptyMessage,
  items,
  showProgress,
}: {
  id: string;
  label: string;
  emptyMessage: string;
  items: AssessmentListItem[];
  showProgress?: boolean;
}) {
  const router = useRouter();
  const sorted = [...items].sort((a, b) =>
    a.clientName.localeCompare(b.clientName)
  );

  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
        {items.length > 0 && (
          <span className="ml-2 font-normal text-text-muted">({items.length})</span>
        )}
      </label>
      <select
        id={id}
        className="input"
        defaultValue=""
        disabled={sorted.length === 0}
        onChange={(e) => {
          const value = e.target.value;
          if (value) router.push(`/assessments/${value}`);
        }}
      >
        <option value="">
          {sorted.length === 0 ? emptyMessage : "Select customer…"}
        </option>
        {sorted.map((a) => (
          <option key={a.id} value={a.id}>
            {formatOptionLabel(a)}
            {showProgress ? ` — ${a.progressPercent}%` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function AssessmentGroupList({
  title,
  items,
}: {
  title: string;
  items: AssessmentListItem[];
}) {
  const sorted = useMemo(() => [...items].sort((a, b) =>
    a.clientName.localeCompare(b.clientName)
  ), [items]);
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [draft, setDraft] = useState({
    clientName: "",
    appName: "",
    assessmentDate: "",
    dueDate: "",
    assessorName: "",
    scopeNotes: "",
  });

  async function saveEdit(id: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAssessment(id: string) {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      setEditingId(null);
      setDeleteConfirm("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-text-muted">
        <h3 className="font-semibold text-text">{title}</h3>
        <p className="mt-1">No assessments in this category.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <h3 className="mb-3 font-semibold text-text flex items-center gap-2">
        {title}
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-text-muted">
          {sorted.length}
        </span>
      </h3>
      <ul className="space-y-3">
        {sorted.map((a) => (
          <li key={a.id}>
            <div className="rounded-xl border border-border bg-background shadow-sm transition hover:border-primary/40 hover:shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                <Link
                  href={`/assessments/${a.id}`}
                  className="min-w-0 flex-1 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-text group-hover:text-primary transition-colors">
                      {a.clientName}
                    </span>
                    <span className="text-sm font-medium text-text-muted">
                      / {a.appName}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      {a.assessmentDate}
                    </span>
                    {a.dueDate && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Due: {a.dueDate}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-border pt-3 sm:border-0 sm:pt-0">
                  <div className="flex flex-col items-start sm:items-end gap-1">
                    <span
                      className={
                        a.isFullyReviewed ? "badge-complete" : "inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-500/30"
                      }
                    >
                      {a.isFullyReviewed ? "Complete" : `${a.progressPercent}% progress`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-text-muted hover:bg-muted hover:text-text transition-colors"
                    title="Edit details"
                    onClick={() => {
                      setEditingId(a.id);
                      setDeleteConfirm("");
                      setError(null);
                      setDraft({
                        clientName: a.clientName,
                        appName: a.appName,
                        assessmentDate: a.assessmentDate,
                        dueDate: a.dueDate ?? "",
                        assessorName: a.assessorName ?? "",
                        scopeNotes: a.scopeNotes ?? "",
                      });
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                </div>
              </div>
              {editingId === a.id && (
                <div className="border-t border-border bg-muted/20 p-4">
                  <div className="grid gap-3 sm:grid-cols-2 mb-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-text-muted">Client name</label>
                      <input className="input" value={draft.clientName} onChange={(e)=>setDraft((p)=>({...p,clientName:e.target.value}))} placeholder="Customer name" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-text-muted">Assessment / App name</label>
                      <input className="input" value={draft.appName} onChange={(e)=>setDraft((p)=>({...p,appName:e.target.value}))} placeholder="Assessment name" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-text-muted">Assessment date</label>
                      <input className="input" type="date" value={draft.assessmentDate} onChange={(e)=>setDraft((p)=>({...p,assessmentDate:e.target.value}))} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-text-muted">Due date</label>
                      <input className="input" type="date" value={draft.dueDate} onChange={(e)=>setDraft((p)=>({...p,dueDate:e.target.value}))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-text-muted">Assessor name</label>
                      <input className="input" value={draft.assessorName} onChange={(e)=>setDraft((p)=>({...p,assessorName:e.target.value}))} placeholder="Assessor" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-text-muted">Scope notes</label>
                      <textarea className="input min-h-[72px]" value={draft.scopeNotes} onChange={(e)=>setDraft((p)=>({...p,scopeNotes:e.target.value}))} placeholder="Scope notes" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn-primary py-1.5 px-4" disabled={saving} onClick={() => void saveEdit(a.id)}>
                        {saving ? "Saving…" : "Save changes"}
                      </button>
                      <button type="button" className="btn-secondary py-1.5 px-4" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                    <details className="relative rounded-lg border border-red-200/50 bg-red-50/50 p-2 dark:border-red-900/30 dark:bg-red-950/20 group">
                      <summary className="cursor-pointer text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 list-none flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </summary>
                      <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-red-200 bg-white p-3 shadow-xl dark:border-red-900/50 dark:bg-neutral-900 z-10">
                        <p className="text-xs font-medium text-red-800 dark:text-red-300 mb-2">
                          Type <code>DELETE</code> to confirm.
                        </p>
                        <input
                          className="input mb-2 border-red-200 focus:border-red-500 focus:ring-red-500/20 dark:border-red-900/50"
                          value={deleteConfirm}
                          onChange={(e)=>setDeleteConfirm(e.target.value)}
                          placeholder="DELETE"
                        />
                        <button
                          type="button"
                          className="w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                          disabled={deleteConfirm !== "DELETE" || deleting}
                          onClick={() => void deleteAssessment(a.id)}
                        >
                          {deleting ? "Deleting…" : "Permanently Delete"}
                        </button>
                      </div>
                    </details>
                  </div>
                  {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AssessmentDashboard({
  assessments,
}: {
  assessments: AssessmentListItem[];
}) {
  const groupedByFramework = useMemo(() => {
    const map = new Map<string, AssessmentListItem[]>();
    for (const a of assessments) {
      const list = map.get(a.frameworkId) ?? [];
      list.push(a);
      map.set(a.frameworkId, list);
    }
    return FRAMEWORKS.map((fw) => ({
      frameworkId: fw.id,
      frameworkName: fw.name,
      items: map.get(fw.id) ?? [],
    })).filter((g) => g.items.length > 0);
  }, [assessments]);

  return (
    <div className="space-y-8">
      {groupedByFramework.map((group) => {
        const completed = group.items.filter((a) => a.isFullyReviewed);
        const inProgress = group.items.filter((a) => !a.isFullyReviewed);
        return (
          <section
            key={group.frameworkId}
            className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm"
          >
            <div className="border-b border-border pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Framework
              </span>
              <h2 className="mt-1 text-xl font-semibold text-text">
                {group.frameworkName}
              </h2>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-2 pt-2">
              <AssessmentGroupList title="In Progress" items={inProgress} />
              <AssessmentGroupList title="Completed" items={completed} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
