type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string; status?: string };
};

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
