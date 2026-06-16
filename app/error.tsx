"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="card border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
        <h1 className="text-lg font-bold text-text">Something went wrong</h1>
        <p className="mt-2 text-sm text-text-muted break-words">
          {error.message}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-text-muted">Digest: {error.digest}</p>
        )}
        <p className="mt-3 text-sm text-text-muted">
          On Vercel, connect Supabase env vars and run{" "}
          <code className="text-xs">supabase/schema.sql</code> in the SQL editor.
        </p>
        <button type="button" onClick={reset} className="btn-primary mt-4">
          Try again
        </button>
      </div>
    </div>
  );
}
