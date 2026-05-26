"use client";

import type { ControlOutcome } from "@/lib/types";

const BASE_OPTIONS: { value: ControlOutcome; label: string }[] = [
  { value: "in_place", label: "In place" },
  { value: "not_in_place", label: "Not in place" },
  { value: "partially_in_place", label: "Partially in place" },
  { value: "not_applicable", label: "Not applicable" },
];

const PENDING_OPTION: { value: ControlOutcome; label: string } = {
  value: "pending",
  label: "Pending",
};

export function OutcomeSelector({
  value,
  onChange,
  showPendingOption = false,
}: {
  value: ControlOutcome;
  onChange: (v: ControlOutcome) => void;
  showPendingOption?: boolean;
}) {
  const options = showPendingOption
    ? [...BASE_OPTIONS, PENDING_OPTION]
    : BASE_OPTIONS;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value ?? "empty"}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
            value === o.value
              ? "border-primary bg-primary font-semibold text-primary-foreground"
              : "border-neutral-200 bg-surface text-text hover:bg-muted"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
