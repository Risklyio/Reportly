import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { formatControlRef, getControlById } from "@/lib/controls/catalog";
import type { ControlOutcome } from "@/lib/types";

const OUTCOME_LABELS: Record<string, string> = {
  in_place: "In place",
  not_in_place: "Not in place",
  partially_in_place: "Partially in place",
  not_applicable: "Not applicable",
};

type AiProvider = "openai" | "google" | "groq";

const DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: "gpt-4o-mini",
  google: "gemini-2.0-flash",
  groq: "llama-3.3-70b-versatile",
};

function resolveProvider(): AiProvider {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === "openai" || explicit === "google" || explicit === "groq") {
    return explicit;
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) return "google";
  if (process.env.GROQ_API_KEY?.trim()) return "groq";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  throw new Error(
    "No AI API key configured. For free testing, set AI_PROVIDER=google and GOOGLE_GENERATIVE_AI_API_KEY (get a key at https://aistudio.google.com/apikey), then redeploy on Vercel."
  );
}

function requireKey(name: string, value: string | undefined, helpUrl: string): string {
  const key = value?.trim();
  if (!key) {
    throw new Error(
      `${name} is required for the selected AI_PROVIDER. Get a key at ${helpUrl}, add it in Vercel → Environment Variables, then Redeploy.`
    );
  }
  return key;
}

function getModel() {
  const provider = resolveProvider();
  const modelId = process.env.AI_MODEL?.trim() || DEFAULT_MODELS[provider];

  switch (provider) {
    case "google": {
      const google = createGoogleGenerativeAI({
        apiKey: requireKey(
          "GOOGLE_GENERATIVE_AI_API_KEY",
          process.env.GOOGLE_GENERATIVE_AI_API_KEY,
          "https://aistudio.google.com/apikey"
        ),
      });
      return google(modelId);
    }
    case "groq": {
      const groq = createGroq({
        apiKey: requireKey(
          "GROQ_API_KEY",
          process.env.GROQ_API_KEY,
          "https://console.groq.com/keys"
        ),
      });
      return groq(modelId);
    }
    default: {
      const openai = createOpenAI({
        apiKey: requireKey(
          "OPENAI_API_KEY",
          process.env.OPENAI_API_KEY,
          "https://platform.openai.com/api-keys"
        ),
      });
      return openai(modelId);
    }
  }
}

function friendlyAiError(error: unknown): Error {
  const msg = error instanceof Error ? error.message : String(error);
  if (/quota|exceeded|429|insufficient_quota/i.test(msg)) {
    return new Error(
      "AI quota or billing limit reached for the current provider. For free testing, switch to Google Gemini: set AI_PROVIDER=google and GOOGLE_GENERATIVE_AI_API_KEY in Vercel (free key at https://aistudio.google.com/apikey), remove or keep OPENAI_API_KEY, then Redeploy."
    );
  }
  return error instanceof Error ? error : new Error(msg);
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

  let text: string;
  try {
    const result = await generateText({
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
    text = result.text;
  } catch (e) {
    throw friendlyAiError(e);
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("AI returned an empty response. Try again or edit notes.");
  }
  return trimmed;
}
