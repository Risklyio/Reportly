"use client";

import { useEffect, useState } from "react";
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

export default function SettingsPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    controlId: "data-1",
    reasonCode: "",
    actionText: "",
    links: "",
  });

  async function load() {
    const [t, o] = await Promise.all([
      fetch("/api/templates").then((r) => r.json()),
      fetch("/api/overrides").then((r) => r.json()),
    ]);
    setTemplates(t);
    setOverrides(o);
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 lg:px-8">
      <h1 className="text-2xl font-bold text-text">Settings</h1>
      <p className="mt-1 text-sm text-text-muted">
        Word templates and custom corrective-action snippets
      </p>

      <section className="card mt-8">
        <h2 className="text-lg font-semibold text-text">Report templates</h2>
        <p className="mt-1 text-sm text-text-muted">
          Upload a .docx with docxtemplater placeholders. If none uploaded, the
          built-in starter template is used.
        </p>
        <form onSubmit={uploadTemplate} className="mt-4 space-y-3">
          <input name="name" className="input" placeholder="Template name" />
          <input
            name="file"
            type="file"
            accept=".docx"
            className="input"
            required
          />
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
                    <span className="ml-2 text-xs text-primary">default</span>
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
