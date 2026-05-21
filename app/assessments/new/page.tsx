"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewAssessmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    clientName: "",
    appName: "",
    assessmentDate: new Date().toISOString().slice(0, 10),
    assessorName: "",
    scopeNotes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/assessments/${data.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 lg:px-8">
      <h1 className="text-2xl font-bold text-text">New assessment</h1>
      <p className="mt-1 text-sm text-text-muted">
        M365 Application Compliance Program
      </p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="clientName">
            Client name
          </label>
          <input
            id="clientName"
            className="input"
            required
            value={form.clientName}
            onChange={(e) =>
              setForm({ ...form, clientName: e.target.value })
            }
          />
        </div>
        <div>
          <label className="label" htmlFor="appName">
            Application / product name
          </label>
          <input
            id="appName"
            className="input"
            required
            value={form.appName}
            onChange={(e) => setForm({ ...form, appName: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="assessmentDate">
            Assessment date
          </label>
          <input
            id="assessmentDate"
            type="date"
            className="input"
            required
            value={form.assessmentDate}
            onChange={(e) =>
              setForm({ ...form, assessmentDate: e.target.value })
            }
          />
        </div>
        <div>
          <label className="label" htmlFor="assessorName">
            Assessor name
          </label>
          <input
            id="assessorName"
            className="input"
            value={form.assessorName}
            onChange={(e) =>
              setForm({ ...form, assessorName: e.target.value })
            }
          />
        </div>
        <div>
          <label className="label" htmlFor="scopeNotes">
            Scope notes
          </label>
          <textarea
            id="scopeNotes"
            className="input min-h-[80px]"
            rows={3}
            value={form.scopeNotes}
            onChange={(e) =>
              setForm({ ...form, scopeNotes: e.target.value })
            }
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating…" : "Start control review"}
        </button>
      </form>
    </div>
  );
}
