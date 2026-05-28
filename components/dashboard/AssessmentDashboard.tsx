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
      <div className="card text-sm text-text-muted">
        <h2 className="font-semibold text-text">{title}</h2>
        <p className="mt-2">None yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="font-semibold text-text">{title}</h2>
      <ul className="mt-3 space-y-2">
        {sorted.map((a) => (
          <li key={a.id}>
            <div className="rounded-lg border border-border px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/assessments/${a.id}`}
                  className="min-w-0 flex-1 transition hover:text-primary"
                >
                  <span className="font-medium text-text">{a.clientName}</span>
                  <span className="text-text-muted">
                    {" "}
                    · {a.appName} · Assessment date: {a.assessmentDate}
                    {a.dueDate ? ` · Report due date: ${a.dueDate}` : ""}
                  </span>
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
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
                    Edit
                  </button>
                  <span
                    className={
                      a.isFullyReviewed ? "badge-complete" : "text-xs text-text-muted"
                    }
                  >
                    {a.isFullyReviewed ? "Complete" : `${a.progressPercent}%`}
                  </span>
                </div>
              </div>
              {editingId === a.id && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  <input className="input" value={draft.clientName} onChange={(e)=>setDraft((p)=>({...p,clientName:e.target.value}))} placeholder="Customer name" />
                  <input className="input" value={draft.appName} onChange={(e)=>setDraft((p)=>({...p,appName:e.target.value}))} placeholder="Assessment name" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input className="input" type="date" value={draft.assessmentDate} onChange={(e)=>setDraft((p)=>({...p,assessmentDate:e.target.value}))} />
                    <input className="input" type="date" value={draft.dueDate} onChange={(e)=>setDraft((p)=>({...p,dueDate:e.target.value}))} />
                  </div>
                  <input className="input" value={draft.assessorName} onChange={(e)=>setDraft((p)=>({...p,assessorName:e.target.value}))} placeholder="Assessor" />
                  <textarea className="input min-h-[72px]" value={draft.scopeNotes} onChange={(e)=>setDraft((p)=>({...p,scopeNotes:e.target.value}))} placeholder="Scope notes" />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-primary" disabled={saving} onClick={() => void saveEdit(a.id)}>
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                  <details className="rounded-lg border border-red-200 bg-red-50 p-2">
                    <summary className="cursor-pointer text-xs font-medium text-red-800">
                      Delete assessment
                    </summary>
                    <p className="mt-2 text-xs text-red-700">
                      Type <code>DELETE</code> to enable delete.
                    </p>
                    <input
                      className="input mt-2"
                      value={deleteConfirm}
                      onChange={(e)=>setDeleteConfirm(e.target.value)}
                      placeholder="DELETE"
                    />
                    <button
                      type="button"
                      className="mt-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                      disabled={deleteConfirm !== "DELETE" || deleting}
                      onClick={() => void deleteAssessment(a.id)}
                    >
                      {deleting ? "Deleting…" : "Delete assessment"}
                    </button>
                  </details>
                  {error && <p className="text-xs text-red-600">{error}</p>}
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
    <div className="space-y-6">
      {groupedByFramework.map((group) => {
        const completed = group.items.filter((a) => a.isFullyReviewed);
        const inProgress = group.items.filter((a) => !a.isFullyReviewed);
        return (
          <section
            key={group.frameworkId}
            className="space-y-4 rounded-xl border border-border bg-white p-4"
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Framework
              </span>
              <h2 className="mt-1 text-lg font-semibold text-text">
                {group.frameworkName}
              </h2>
            </div>
            <div className="card grid gap-4 sm:grid-cols-2">
              <AssessmentSelect
                id={`completed-${group.frameworkId}`}
                label="Completed assessments"
                emptyMessage="No completed assessments"
                items={completed}
              />
              <AssessmentSelect
                id={`inprogress-${group.frameworkId}`}
                label="In progress"
                emptyMessage="No in-progress assessments"
                items={inProgress}
                showProgress
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <AssessmentGroupList title="Completed" items={completed} />
              <AssessmentGroupList title="In progress" items={inProgress} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
