import { AiAnalysis } from "../types/domain";

/**
 * OpenAI-backed analysis + report generation for the patrol app.
 * Model: gpt-4o-mini (vision-capable). Key is read from EXPO_PUBLIC_OPENAI_KEY.
 *
 * SECURITY: the key ships in the client bundle. Acceptable for an FYP/MVP;
 * for production move these calls behind a server.
 */
const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY as string | undefined;
const MODEL = "gpt-4o-mini";
const ENDPOINT = "https://api.openai.com/v1/chat/completions";

export type EvidenceInput = {
  type: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  /** Optional base64 JPEG (no data: prefix) for vision analysis. */
  imageBase64?: string;
};

async function callOpenAI(body: any, timeoutMs = 30000): Promise<any> {
  if (!OPENAI_KEY) throw new Error("Missing EXPO_PUBLIC_OPENAI_KEY");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, ...body }),
      signal: controller.signal,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || `OpenAI HTTP ${res.status}`);
    return json;
  } finally {
    clearTimeout(timer);
  }
}

/** Real threat analysis. Uses the photo (vision) when available. */
export async function analyseEvidence(input: EvidenceInput): Promise<AiAnalysis> {
  const loc =
    input.latitude != null && input.longitude != null
      ? `Coordinates: ${input.latitude.toFixed(5)}, ${input.longitude.toFixed(5)}.`
      : "Coordinates: unknown.";

  const userText =
    `Maritime IUU (Illegal, Unreported, Unregulated) fishing surveillance.\n` +
    `Reported violation type: ${input.type}.\n` +
    `Officer notes: ${input.description?.trim() || "none"}.\n` +
    `${loc}\n` +
    `Assess the threat. Respond ONLY as JSON with keys: ` +
    `threat_level (one of "low","medium","high","critical"), ` +
    `confidence_score (number 0-1), ` +
    `detected_objects (array of short strings), ` +
    `ai_summary (one or two sentences).`;

  const content: any[] = [{ type: "text", text: userText }];
  if (input.imageBase64) {
    content.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${input.imageBase64}` },
    });
  }

  const json = await callOpenAI({
    messages: [
      {
        role: "system",
        content:
          "You are a maritime fisheries enforcement analyst specialising in IUU fishing. Be precise and conservative. Always reply with valid JSON only.",
      },
      { role: "user", content },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const raw = json.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);

  const level = ["low", "medium", "high", "critical"].includes(parsed.threat_level)
    ? parsed.threat_level
    : "medium";
  const conf = Math.max(0, Math.min(1, Number(parsed.confidence_score) || 0));

  return {
    threat_level: level,
    confidence_score: conf,
    detected_objects: Array.isArray(parsed.detected_objects)
      ? parsed.detected_objects.map(String).slice(0, 6)
      : [],
    ai_summary: String(parsed.ai_summary || "No summary produced."),
  };
}

/** ~300-word formal incident report for the dashboard + download. */
export async function generateReport(
  input: EvidenceInput & { analysis: AiAnalysis; officer?: string }
): Promise<string> {
  const when = new Date().toLocaleString();
  const loc =
    input.latitude != null && input.longitude != null
      ? `${input.latitude.toFixed(5)}, ${input.longitude.toFixed(5)}`
      : "unknown";

  const prompt =
    `Write a formal maritime IUU fishing incident report of APPROXIMATELY 300 words ` +
    `(between 280 and 320 words). Use clear sections: Summary, Observations, ` +
    `Threat Assessment, Recommended Action. Write in professional enforcement prose, ` +
    `no markdown headers symbols beyond plain section titles.\n\n` +
    `Date/time: ${when}\n` +
    `Reporting officer: ${input.officer || "Patrol officer"}\n` +
    `Violation type: ${input.type}\n` +
    `Location (lat,lng): ${loc}\n` +
    `Officer notes: ${input.description?.trim() || "none"}\n` +
    `AI threat level: ${input.analysis.threat_level}\n` +
    `AI confidence: ${(input.analysis.confidence_score * 100).toFixed(0)}%\n` +
    `Detected objects: ${input.analysis.detected_objects.join(", ") || "none"}\n` +
    `AI summary: ${input.analysis.ai_summary}`;

  const json = await callOpenAI({
    messages: [
      {
        role: "system",
        content:
          "You are an experienced maritime enforcement officer writing concise, factual incident reports for a surveillance command center.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 700,
  });

  return String(json.choices?.[0]?.message?.content ?? "").trim();
}

/** Placeholder used when a report is captured offline. */
export function pendingAnalysis(): AiAnalysis {
  return {
    threat_level: "pending",
    confidence_score: 0,
    detected_objects: [],
    ai_summary: "AI analysis will run automatically once this report syncs online.",
  };
}
