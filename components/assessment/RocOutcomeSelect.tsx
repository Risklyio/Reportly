"use client";

import type { ControlOutcome } from "@/lib/types";

const ROC_OPTIONS: { value: ControlOutcome; label: string }[] = [
  { value: "in_place", label: "In Place" },
  { value: "not_applicable", label: "Not Applicable" },
  { value: "not_tested", label: "Not Tested" },
  { value: "not_in_place", label: "Not in Place" },
  { value: "in_place_compensating", label: "Compensating Control" },
  { value: "customized_approach", label: "Customized Approach" },
];

export function RocOutcomeSelect({
  value,
  onChange,
}: {
  value: ControlOutcome;
  onChange: (v: ControlOutcome) => void | Promise<void>;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        void onChange(v ? (v as ControlOutcome) : null);
      }}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
    >
      <option value="">Select assessment finding…</option>
      {ROC_OPTIONS.map((o) => (
        <option key={o.value} value={o.value ?? ""}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
