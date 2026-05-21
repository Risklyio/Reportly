import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { formatControlRef, getControlById } from "@/lib/controls/catalog";
import type { ControlOutcome } from "@/lib/types";

const OUTCOME_LABELS: Record<string, string> = {
  in_place: "In place",
  not_in_place: "Not in place",
  partially_in_place: "Partially in place",
  not_applicable: "Not applicable",
};

function getModel() {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it in .env.local and Vercel project settings."
    );
  }
  const modelId = process.env.AI_MODEL?.trim() || "gpt-4o-mini";
  return openai(modelId);
}

export async function generateCorrectiveFromAssessorNotes(input: {
  controlId: string;
  outcome: ControlOutcome;
  notInPlaceReason: string;
  assessorNotes: string;
}): Promise<string> {
  const control = getControlById(input.controlId);
  if (!control) {
    throw new Error("Control not found");
  }

  const notes = input.assessorNotes.trim();
  if (!notes) {
    throw new Error("Add assessor notes before generating corrective actions.");
  }

  const outcomeLabel =
    input.outcome && OUTCOME_LABELS[input.outcome]
      ? OUTCOME_LABELS[input.outcome]
      : "Not specified";

  const { text } = await generateText({
    model: getModel(),
    system: `You are a senior Microsoft 365 Application Compliance Program assessor.
Write corrective action text for an official audit report.
Use professional, concise language suitable for a customer-facing compliance report.
Do not invent evidence, tools, or dates the assessor did not mention.
Structure with short paragraphs or bullet points when helpful.
Do not include assessor-only working notes—only polished corrective actions.
Do not wrap the response in markdown code fences.`,
    prompt: `Control: ${formatControlRef(control)} — ${control.title}
Section: ${control.section}
Requirement: ${control.intent}

Outcome: ${outcomeLabel}
Gap / reason: ${input.notInPlaceReason.trim() || "Not specified"}

Assessor working notes (internal — rewrite for the report):
${notes}

Write corrective actions the organization should take to close this gap.`,
  });

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("AI returned an empty response. Try again or edit notes.");
  }
  return trimmed;
}
