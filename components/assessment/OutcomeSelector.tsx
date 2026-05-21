"use client";

import type { ControlOutcome } from "@/lib/types";

const OPTIONS: { value: ControlOutcome; label: string }[] = [
  { value: "in_place", label: "In place" },
  { value: "not_in_place", label: "Not in place" },
  { value: "partially_in_place", label: "Partially in place" },
  { value: "not_applicable", label: "Not applicable" },
];

export function OutcomeSelector({
  value,
  onChange,
}: {
  value: ControlOutcome;
  onChange: (v: ControlOutcome) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((o) => (
        <button
          key={o.value ?? "empty"}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
            value === o.value
              ? "border-primary bg-primary font-semibold text-primary-foreground"
              : "border-border bg-surface text-text hover:border-topbar/30"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
