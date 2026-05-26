"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startAssessmentAction,
  type StartAssessmentState,
} from "./actions";

const initialState: StartAssessmentState = {};

export default function NewAssessmentPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    startAssessmentAction,
    initialState
  );

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state.redirectTo, router]);

  return (
    <div className="mx-auto max-w-xl px-4 py-10 lg:px-8">
      <h1 className="text-2xl font-bold text-text">New assessment</h1>
      <p className="mt-1 text-sm text-text-muted">
        M365 Application Compliance Program
      </p>

      <div className="card mt-4 border-neutral-200 bg-muted p-4 text-sm">
        <p className="font-medium text-text">Report template (optional)</p>
        <p className="mt-1 text-text-muted">
          Upload your Word report template before or after starting the review.
          Go to{" "}
          <Link href="/settings" className="font-medium text-primary underline">
            Settings → Report templates
          </Link>{" "}
          and upload a <strong>.docx</strong> file with merge fields such as{" "}
          <code className="text-xs">{"{{clientName}}"}</code>,{" "}
          <code className="text-xs">{"{{#appControls}}"}</code>. If you skip
          this, a built-in starter template is used on export.
        </p>
      </div>

      <form action={formAction} className="card mt-6 space-y-4">
        {state.error && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {state.error}
          </div>
        )}

        {pending && (
          <p className="text-sm text-text-muted">Creating assessment…</p>
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
            disabled={pending}
          />
        </div>
        <div>
          <label className="label" htmlFor="appName">
            Application / product name
          </label>
          <input
            id="appName"
            name="appName"
            className="input"
            required
            disabled={pending}
          />
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
            disabled={pending}
          />
        </div>
        <div>
          <label className="label" htmlFor="assessorName">
            Assessor name
          </label>
          <input
            id="assessorName"
            name="assessorName"
            className="input"
            disabled={pending}
          />
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
            disabled={pending}
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "Opening controls…" : "Start control review"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-text-muted">
        After starting, use the <strong>left sidebar</strong> to switch domains
        (Application, Operational, Data) and set an outcome on each control.
      </p>
    </div>
  );
}
