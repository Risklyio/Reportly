type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string; status?: string };
};

/** Models that typically still have Google AI Studio free-tier quota */
export const GEMINI_FALLBACK_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash",
] as const;

function isGeminiQuotaError(message: string): boolean {
  return /quota|rate.?limit|429|RESOURCE_EXHAUSTED|limit:\s*0|free_tier/i.test(
    message
  );
}

export async function generateWithGeminiRest(input: {
  apiKey: string;
  model: string;
  system: string;
  prompt: string;
}): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}:generateContent?key=${encodeURIComponent(input.apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: input.system }] },
      contents: [{ role: "user", parts: [{ text: input.prompt }] }],
      generationConfig: { temperature: 0.4 },
    }),
  });

  const raw = await res.text();
  let data: GeminiGenerateResponse;
  try {
    data = JSON.parse(raw) as GeminiGenerateResponse;
  } catch {
    throw new Error(raw.slice(0, 500) || `Gemini HTTP ${res.status}`);
  }

  if (!res.ok) {
    const msg = data.error?.message ?? raw.slice(0, 500);
    throw new Error(msg || `Gemini HTTP ${res.status}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }
  return text;
}

/** Tries the requested model, then other free-tier models on quota errors. */
export async function generateWithGeminiRestWithFallback(input: {
  apiKey: string;
  model: string;
  system: string;
  prompt: string;
}): Promise<{ text: string; modelUsed: string }> {
  const models = [
    input.model,
    ...GEMINI_FALLBACK_MODELS.filter((m) => m !== input.model),
  ];

  let lastError: Error | null = null;
  for (const model of models) {
    try {
      const text = await generateWithGeminiRest({ ...input, model });
      return { text, modelUsed: model };
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      lastError = err;
      if (!isGeminiQuotaError(err.message)) {
        throw err;
      }
    }
  }

  throw new Error(
    lastError?.message ??
      "Gemini free tier quota exceeded for all models tried."
  );
}
