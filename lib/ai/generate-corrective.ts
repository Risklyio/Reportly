import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { AI_BUILD_STAMP } from "@/lib/ai/build-stamp";
import { generateWithGeminiRestWithFallback } from "@/lib/ai/gemini-rest";
import { formatControlRef, getControlById } from "@/lib/controls/catalog";
import type { ControlOutcome } from "@/lib/types";

const OUTCOME_LABELS: Record<string, string> = {
  in_place: "In place",
  not_in_place: "Not in place",
  partially_in_place: "Partially in place",
  not_applicable: "Not applicable",
};

export type AiProvider = "openai" | "google" | "groq";

const DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: "gpt-4o-mini",
  google: "gemini-2.0-flash-lite",
  groq: "llama-3.3-70b-versatile",
};

const PROVIDER_LABELS: Record<AiProvider, string> = {
  openai: "OpenAI",
  google: "Google Gemini",
  groq: "Groq",
};

export function googleApiKey(): string | undefined {
  return (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    undefined
  );
}

export function resolveProvider(): AiProvider {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === "openai" || explicit === "google" || explicit === "groq") {
    return explicit;
  }
  if (googleApiKey()) return "google";
  if (process.env.GROQ_API_KEY?.trim()) return "groq";
  if (process.env.OPENAI_API_KEY?.trim()) {
    throw new Error(
      "OPENAI_API_KEY is set but AI_PROVIDER is missing — the app will not auto-use OpenAI. Set AI_PROVIDER=google and GOOGLE_GENERATIVE_AI_API_KEY (https://aistudio.google.com/apikey), then Redeploy. Or set AI_PROVIDER=openai only if you have OpenAI credits."
    );
  }
  throw new Error(
    "No AI API key configured. Set AI_PROVIDER=google and GOOGLE_GENERATIVE_AI_API_KEY (https://aistudio.google.com/apikey), then Redeploy on Vercel."
  );
}

export function getAiProviderDiagnostics() {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase() || null;
  let resolvedProvider: AiProvider | null = null;
  let configError: string | null = null;
  try {
    resolvedProvider = resolveProvider();
  } catch (e) {
    configError = e instanceof Error ? e.message : String(e);
  }

  return {
    buildStamp: AI_BUILD_STAMP,
    explicitProvider: explicit,
    resolvedProvider,
    model: resolvedProvider
      ? process.env.AI_MODEL?.trim() || DEFAULT_MODELS[resolvedProvider]
      : null,
    keysPresent: {
      google: !!googleApiKey(),
      groq: !!process.env.GROQ_API_KEY?.trim(),
      openai: !!process.env.OPENAI_API_KEY?.trim(),
    },
    configError,
  };
}

function requireKey(name: string, value: string | undefined, helpUrl: string): string {
  const key = value?.trim();
  if (!key) {
    throw new Error(
      `${name} is required for AI_PROVIDER=${process.env.AI_PROVIDER ?? "?"}. Get a key at ${helpUrl}, add it in Vercel → Environment Variables, then Redeploy.`
    );
  }
  return key;
}

function getModelForProvider(provider: AiProvider) {
  const modelId = process.env.AI_MODEL?.trim() || DEFAULT_MODELS[provider];

  switch (provider) {
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

function friendlyAiError(error: unknown, provider: AiProvider): Error {
  const msg = error instanceof Error ? error.message : String(error);
  const label = PROVIDER_LABELS[provider];

  if (/quota|exceeded|429|insufficient_quota|RESOURCE_EXHAUSTED|rate.?limit/i.test(msg)) {
    if (provider === "openai") {
      return new Error(
        `OpenAI quota or billing limit reached. In Vercel set AI_PROVIDER=google and GOOGLE_GENERATIVE_AI_API_KEY (https://aistudio.google.com/apikey), then Redeploy.`
      );
    }
    if (provider === "google") {
      return new Error(
        `Google Gemini free tier is exhausted (${msg.slice(0, 200)}…). Best fix: set AI_PROVIDER=groq and GROQ_API_KEY (free at https://console.groq.com/keys) in Vercel, then Redeploy. Or set AI_MODEL=gemini-2.0-flash-lite, push latest code, and retry in ~17s.`
      );
    }
    return new Error(`${label} rate limit or quota (${msg}). Wait and retry.`);
  }

  return new Error(`${label}: ${msg}`);
}

const ASSESSOR_SYSTEM = `You are a senior Microsoft 365 Application Compliance Program assessor.
Write corrective action text for an official audit report.
Use professional, concise language suitable for a customer-facing compliance report.
Do not invent evidence, tools, or dates the assessor did not mention.
Structure with short paragraphs or bullet points when helpful.
Do not include assessor-only working notes—only polished corrective actions.
Do not wrap the response in markdown code fences.`;

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

  const provider = resolveProvider();
  const modelId = process.env.AI_MODEL?.trim() || DEFAULT_MODELS[provider];

  const prompt = `Control: ${formatControlRef(control)} — ${control.title}
Section: ${control.section}
Requirement: ${control.intent}

Outcome: ${outcomeLabel}
Gap / reason: ${input.notInPlaceReason.trim() || "Not specified"}

Assessor working notes (internal — rewrite for the report):
${notes}

Write corrective actions the organization should take to close this gap.`;

  let text: string;
  try {
    if (provider === "google") {
      const { text: geminiText } = await generateWithGeminiRestWithFallback({
        apiKey: requireKey(
          "GOOGLE_GENERATIVE_AI_API_KEY",
          googleApiKey(),
          "https://aistudio.google.com/apikey"
        ),
        model: modelId,
        system: ASSESSOR_SYSTEM,
        prompt,
      });
      text = geminiText;
    } else {
      const result = await generateText({
        model: getModelForProvider(provider),
        system: ASSESSOR_SYSTEM,
        prompt,
      });
      text = result.text;
    }
  } catch (e) {
    throw friendlyAiError(e, provider);
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("AI returned an empty response. Try again or edit notes.");
  }
  return trimmed;
}
