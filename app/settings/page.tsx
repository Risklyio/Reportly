"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ALL_CONTROLS } from "@/lib/controls/catalog";

interface TemplateRow {
  id: string;
  name: string;
  filename: string;
  isDefault: boolean;
}

interface OverrideRow {
  id: string;
  controlId: string;
  reasonCode: string;
  actionText: string;
  links: string[];
}

interface AiDiagnostics {
  buildStamp?: string;
  explicitProvider?: string | null;
  resolvedProvider?: string | null;
  model?: string | null;
  keysPresent?: { google: boolean; groq: boolean; openai: boolean };
  configError?: string | null;
}

export default function SettingsPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [ai, setAi] = useState<AiDiagnostics | null>(null);
  const [aiLoadError, setAiLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoredAssessmentId, setRestoredAssessmentId] = useState<string | null>(
    null
  );
  const [overrideForm, setOverrideForm] = useState({
    controlId: "data-1",
    reasonCode: "",
    actionText: "",
    links: "",
  });

  async function loadAiStatus() {
    setAiLoadError(null);
    try {
      const res = await fetch("/api/controls", { cache: "no-store" });
      if (!res.ok) {
        setAiLoadError(`Could not load /api/controls (${res.status})`);
        setAi(null);
        return;
      }
      const data = await res.json();
      if (data.ai?.buildStamp) {
        setAi(data.ai as AiDiagnostics);
      } else {
        setAi(null);
        setAiLoadError(
          "Production is running an older build (no ai.buildStamp). Push the latest code to GitHub and Redeploy on Vercel."
        );
      }
    } catch {
      setAiLoadError("Could not reach /api/controls");
      setAi(null);
    }
  }

  async function load() {
    const [t, o] = await Promise.all([
      fetch("/api/templates").then((r) => r.json()),
      fetch("/api/overrides").then((r) => r.json()),
    ]);
    setTemplates(t);
    setOverrides(o);
    await loadAiStatus();
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadTemplate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setUploading(true);
    try {
      await fetch("/api/templates", { method: "POST", body: fd });
      form.reset();
      await load();
    } finally {
      setUploading(false);
    }
  }

  async function addOverride(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...overrideForm,
        links: overrideForm.links
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
      }),
    });
    setOverrideForm({
      controlId: "data-1",
      reasonCode: "",
      actionText: "",
      links: "",
    });
    await load();
  }

  async function restoreBackup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setRestoring(true);
    setRestoreMessage(null);
    setRestoredAssessmentId(null);
    try {
      const res = await fetch("/api/assessments/restore", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Restore failed");
      }
      setRestoreMessage(`Restored as ${data.clientName}`);
      setRestoredAssessmentId(String(data.assessmentId ?? ""));
      form.reset();
      await load();
    } catch (e) {
      setRestoreMessage(e instanceof Error ? e.message : "Restore failed");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 lg:px-8">
      <h1 className="text-2xl font-bold text-text">Settings</h1>
      <p className="mt-1 text-sm text-text-muted">
        Word templates and custom corrective-action snippets
      </p>

      <section id="report-templates" className="card mt-8 scroll-mt-20">
        <h2 className="text-lg font-semibold text-text">Report templates</h2>
        <p className="mt-1 text-sm text-text-muted">
          <strong>Where to upload:</strong> use the form below on this page
          (top menu → <strong>Settings</strong>). Upload one or more{" "}
          <strong>.docx</strong> Word files. The first upload becomes the default
          template used when you click <strong>Download DOCX</strong> on an
          assessment.
        </p>
        <div className="mt-3 rounded-lg border border-border bg-muted p-3 text-xs text-text-muted">
          <p className="font-medium text-text">Suggested placeholders in Word</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <code>{"{{clientName}}"}</code>, <code>{"{{appName}}"}</code>,{" "}
              <code>{"{{assessmentDate}}"}</code>, <code>{"{{assessorName}}"}</code>
            </li>
            <li>
              Loop: <code>{"{{#appControls}}"}</code> …{" "}
              <code>{"{{title}}"}</code>, <code>{"{{outcome}}"}</code>,{" "}
              <code>{"{{reason}}"}</code>, <code>{"{{correctiveAction}}"}</code> …{" "}
              <code>{"{{/appControls}}"}</code>
            </li>
            <li>
              Same pattern for <code>opsControls</code> and{" "}
              <code>dataControls</code>
            </li>
          </ul>
        </div>
        <form onSubmit={uploadTemplate} className="mt-4 space-y-3">
          <div>
            <label className="label" htmlFor="template-name">
              Template name
            </label>
            <input
              id="template-name"
              name="name"
              className="input"
              placeholder="e.g. M365 Audit Report 2026"
            />
          </div>
          <div>
            <label className="label" htmlFor="template-file">
              Word document (.docx)
            </label>
            <input
              id="template-file"
              name="file"
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="input"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={uploading}>
            {uploading ? "Uploading…" : "Upload template"}
          </button>
        </form>
        {templates.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {templates.map((t) => (
              <li
                key={t.id}
                className="flex justify-between rounded-lg border border-border px-3 py-2"
              >
                <span>
                  {t.name} ({t.filename})
                  {t.isDefault && (
                    <span className="ml-2 text-xs font-medium text-primary">default</span>
                  )}
                </span>
                <button
                  type="button"
                  className="text-red-600 text-xs"
                  onClick={async () => {
                    await fetch(`/api/templates?id=${t.id}`, {
                      method: "DELETE",
                    });
                    load();
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card mt-6">
        <h2 className="text-lg font-semibold text-text">Restore assessment backup</h2>
        <p className="mt-1 text-sm text-text-muted">
          Upload a <code>.reportly</code> backup file to restore an assessment.
          Restored assessments keep the same name with a numeric suffix (for
          example <code>(1)</code>).
        </p>
        <form onSubmit={restoreBackup} className="mt-4 space-y-3">
          <div>
            <label className="label" htmlFor="restore-file">
              Backup file
            </label>
            <input
              id="restore-file"
              name="file"
              type="file"
              accept=".reportly,application/json"
              className="input"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={restoring}>
            {restoring ? "Restoring…" : "Restore backup"}
          </button>
        </form>
        {restoreMessage && (
          <p className="mt-3 text-sm text-text">
            {restoreMessage}
            {restoredAssessmentId ? (
              <>
                {" "}
                <Link
                  href={`/assessments/${restoredAssessmentId}`}
                  className="text-primary hover:underline"
                >
                  Open restored assessment
                </Link>
              </>
            ) : null}
          </p>
        )}
      </section>

      <section className="card mt-6">
        <h2 className="text-lg font-semibold text-text">AI Generate</h2>
        <p className="mt-1 text-sm text-text-muted">
          After changing Vercel environment variables, <strong>Redeploy</strong>{" "}
          then refresh this page.
        </p>
        {aiLoadError && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {aiLoadError}
          </p>
        )}
        {ai && (
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Build</dt>
              <dd className="font-mono text-text">{ai.buildStamp}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">AI_PROVIDER (env)</dt>
              <dd className="font-mono text-text">
                {ai.explicitProvider ?? "— not set —"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Active provider</dt>
              <dd className="font-mono font-medium text-text">
                {ai.resolvedProvider ?? "none"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Model</dt>
              <dd className="font-mono text-text">{ai.model ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Keys detected</dt>
              <dd className="font-mono text-xs text-text">
                google={String(ai.keysPresent?.google)}
                {" "}
                groq={String(ai.keysPresent?.groq)} openai=
                {String(ai.keysPresent?.openai)}
              </dd>
            </div>
            {ai.configError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">
                {ai.configError}
              </p>
            )}
            {ai.resolvedProvider === "google" && (
              <p className="text-green-800">
                Gemini is configured. Try <strong>Generate</strong> on a control.
              </p>
            )}
          </dl>
        )}
        <button
          type="button"
          className="btn-secondary mt-3"
          onClick={() => loadAiStatus()}
        >
          Refresh AI status
        </button>
      </section>

      <section className="card mt-6">
        <h2 className="text-lg font-semibold text-text">
          Corrective action overrides
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Your snippets take priority over the built-in M365 knowledge base when
          the reason matches.
        </p>
        <form onSubmit={addOverride} className="mt-4 space-y-3">
          <select
            className="input"
            value={overrideForm.controlId}
            onChange={(e) =>
              setOverrideForm({ ...overrideForm, controlId: e.target.value })
            }
          >
            {ALL_CONTROLS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.title}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Reason code / keyword match"
            value={overrideForm.reasonCode}
            onChange={(e) =>
              setOverrideForm({ ...overrideForm, reasonCode: e.target.value })
            }
            required
          />
          <textarea
            className="input min-h-[80px]"
            placeholder="Corrective action text"
            value={overrideForm.actionText}
            onChange={(e) =>
              setOverrideForm({ ...overrideForm, actionText: e.target.value })
            }
            required
          />
          <textarea
            className="input min-h-[60px]"
            placeholder="Links (one per line)"
            value={overrideForm.links}
            onChange={(e) =>
              setOverrideForm({ ...overrideForm, links: e.target.value })
            }
          />
          <button type="submit" className="btn-secondary">
            Add override
          </button>
        </form>
        {overrides.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {overrides.map((o) => (
              <li
                key={o.id}
                className="rounded-lg border border-border px-3 py-2"
              >
                <p className="font-medium">
                  {o.controlId} — {o.reasonCode}
                </p>
                <p className="text-text-muted line-clamp-2">{o.actionText}</p>
                <button
                  type="button"
                  className="mt-1 text-xs text-red-600"
                  onClick={async () => {
                    await fetch(`/api/overrides?id=${o.id}`, {
                      method: "DELETE",
                    });
                    load();
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card mt-6 text-sm text-text-muted">
        <h2 className="text-lg font-semibold text-text">About</h2>
        <p className="mt-2">
          Reportly.io v0.1 — M365 Application Compliance Program with{" "}
          {ALL_CONTROLS.length} controls across application, operational, and
          data handling domains.
        </p>
      </section>
    </div>
  );
}
