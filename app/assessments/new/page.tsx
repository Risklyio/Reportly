"use client";

import { useActionState } from "react";
import {
  startAssessmentAction,
  type StartAssessmentState,
} from "./actions";

const initialState: StartAssessmentState = {};

export default function NewAssessmentPage() {
  const [state, formAction, pending] = useActionState(
    startAssessmentAction,
    initialState
  );

  return (
    <div className="mx-auto max-w-xl px-4 py-10 lg:px-8">
      <h1 className="text-2xl font-bold text-text">New assessment</h1>
      <p className="mt-1 text-sm text-text-muted">
        M365 Application Compliance Program
      </p>

      <form action={formAction} className="card mt-6 space-y-4">
        {state.error && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {state.error}
          </div>
        )}

        <div>
          <label className="label" htmlFor="clientName">
            Client name
          </label>
          <input
            id="clientName"
            name="clientName"
            className="input"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="appName">
            Application / product name
          </label>
          <input id="appName" name="appName" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="assessmentDate">
            Assessment date
          </label>
          <input
            id="assessmentDate"
            name="assessmentDate"
            type="date"
            className="input"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div>
          <label className="label" htmlFor="assessorName">
            Assessor name
          </label>
          <input id="assessorName" name="assessorName" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="scopeNotes">
            Scope notes
          </label>
          <textarea
            id="scopeNotes"
            name="scopeNotes"
            className="input min-h-[80px]"
            rows={3}
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "Creating…" : "Start control review"}
        </button>
      </form>
    </div>
  );
}
