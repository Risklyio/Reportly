import m365Kb from "@/data/corrective-actions/m365.json";
import type { ControlDefinition } from "@/lib/types";

interface KbEntry {
  controlId: string;
  reasonMatch: string[];
  actionText: string;
  links: string[];
}

interface UserOverride {
  controlId: string;
  reasonCode: string;
  actionText: string;
  links: string[];
}

export function suggestCorrectiveAction(
  control: ControlDefinition,
  notInPlaceReason: string,
  userOverrides: UserOverride[] = []
): { text: string; links: string[] } {
  const reason = notInPlaceReason.trim();
  const reasonLower = reason.toLowerCase();

  const override = userOverrides.find(
    (o) =>
      o.controlId === control.id &&
      (o.reasonCode === reason || reasonLower.includes(o.reasonCode.toLowerCase()))
  );
  if (override) {
    return { text: override.actionText, links: override.links };
  }

  const entries = (m365Kb as { entries: KbEntry[] }).entries;
  const match = entries.find((e) => {
    if (e.controlId !== control.id) return false;
    return e.reasonMatch.some((m) => reasonLower.includes(m.toLowerCase()));
  });
  if (match) {
    return { text: match.actionText, links: match.links };
  }

  const hints = control.correctiveActionHints;
  const hintText = hints.join(" ");
  const links = [control.docUrl];
  if (control.domain === "data_handling" && reasonLower.includes("tls")) {
    links.push("https://www.ssllabs.com/ssltest/");
  }

  const text = [
    `Address gap for ${control.title}:`,
    hintText,
    reason ? `Context: ${reason}` : "",
    `Reference: ${control.docUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { text, links: [...new Set(links)] };
}
