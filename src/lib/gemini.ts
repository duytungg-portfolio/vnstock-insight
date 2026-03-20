import {
  AITimeoutError,
  RateLimitError,
  MalformedAIResponseError,
  NetworkError,
  classifyFetchError,
  safeParseJSON,
} from "@/lib/errors";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const GEMINI_MODEL = "gemini-2.5-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const DEFAULT_TIMEOUT_MS = 45_000; // 2.5-flash uses thinking, needs more time
const EXTENDED_TIMEOUT_MS = 90_000;
const MAX_RETRIES = 2;
const RATE_LIMIT_BACKOFF_MS = 5_000; // wait before retrying after 429

// ---------------------------------------------------------------------------
// Core Gemini API call
// ---------------------------------------------------------------------------

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    code: number;
    message: string;
  };
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    timeoutMs?: number;
    signal?: AbortSignal;
  }
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Combine external abort with our timeout
  if (options?.signal) {
    options.signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const res = await fetch(
      `${BASE_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
          },
        }),
        signal: controller.signal,
      }
    );

    if (res.status === 429) {
      // Parse retry delay from Gemini's error response
      let retryMs = RATE_LIMIT_BACKOFF_MS;
      try {
        const errBody = await res.json();
        const retryInfo = errBody?.error?.details?.find(
          (d: Record<string, unknown>) =>
            d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
        );
        if (retryInfo?.retryDelay) {
          const seconds = parseFloat(retryInfo.retryDelay);
          if (!isNaN(seconds)) retryMs = Math.ceil(seconds * 1000);
        }
        // Log the actual quota violation for debugging
        const quotaMsg = errBody?.error?.message ?? "";
        console.error(`[Gemini] 429 Rate Limited: ${quotaMsg.slice(0, 300)}`);
      } catch {
        // ignore parse error
      }
      throw new RateLimitError(retryMs);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Gemini API HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as GeminiResponse;

    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new MalformedAIResponseError("Empty response from Gemini");
    }

    return text;
  } catch (err) {
    if (
      err instanceof AITimeoutError ||
      err instanceof MalformedAIResponseError ||
      err instanceof RateLimitError
    ) {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new AITimeoutError();
    }
    throw classifyFetchError(err);
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Retry wrapper with stricter prompt on malformed JSON
// ---------------------------------------------------------------------------

async function callGeminiWithRetry<T>(
  systemPrompt: string,
  userPrompt: string,
  options?: { signal?: AbortSignal }
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const timeoutMs =
        attempt === 1 ? DEFAULT_TIMEOUT_MS : EXTENDED_TIMEOUT_MS;

      // On retry after malformed JSON, add extra strictness
      const extraInstruction =
        attempt > 1
          ? "\n\nCRITICAL: Your previous response was NOT valid JSON. You MUST respond with ONLY valid JSON. No markdown code fences, no comments, no extra text. Start with { and end with }."
          : "";

      const raw = await callGemini(
        systemPrompt + extraInstruction,
        userPrompt,
        { timeoutMs, signal: options?.signal }
      );

      return safeParseJSON<T>(raw);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry network errors or aborts
      if (err instanceof NetworkError) throw err;
      if (err instanceof Error && err.name === "AbortError") throw err;

      // Rate limit: wait the specified backoff, then retry once
      if (err instanceof RateLimitError && attempt < MAX_RETRIES) {
        console.warn(
          `[Gemini] Rate limited, waiting ${err.retryAfterMs}ms before retry...`
        );
        await new Promise((r) => setTimeout(r, err.retryAfterMs));
        continue;
      }

      // Retry on malformed JSON or timeout
      if (
        (err instanceof MalformedAIResponseError ||
          err instanceof AITimeoutError) &&
        attempt < MAX_RETRIES
      ) {
        console.warn(
          `[Gemini] Attempt ${attempt} failed (${err.constructor.name}), retrying...`
        );
        continue;
      }

      throw err;
    }
  }

  throw lastError ?? new Error("Gemini call failed");
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

import type { SectorMetric, PricePoint } from "@/types/stock";
import type { MeetingAnalysis } from "@/types/meeting";
import {
  getSectorMetricsPrompt,
  getAIInsightPrompt,
  getMeetingAnalysisPrompt,
  getFollowUpPrompt,
} from "@/lib/prompts";

export async function generateSectorMetrics(
  ticker: string,
  sector: string,
  financialData: Record<string, unknown>,
  options?: { signal?: AbortSignal }
): Promise<SectorMetric[]> {
  const { system, user } = getSectorMetricsPrompt(ticker, sector, financialData);
  const result = await callGeminiWithRetry<{ metrics: SectorMetric[] }>(
    system,
    user,
    options
  );
  return result.metrics ?? [];
}

export async function generateAIInsight(
  ticker: string,
  metrics: SectorMetric[],
  priceData: PricePoint[],
  options?: { signal?: AbortSignal }
): Promise<{
  insight: string;
  keyRisk: string;
  keyOpportunity: string;
  actionTags: string[];
}> {
  const { system, user } = getAIInsightPrompt(ticker, metrics, priceData);
  return callGeminiWithRetry(system, user, options);
}

export async function analyzeMeeting(
  companyName: string,
  ticker: string,
  transcript: string,
  options?: { signal?: AbortSignal }
): Promise<MeetingAnalysis> {
  const { system, user } = getMeetingAnalysisPrompt(companyName, ticker);
  const fullUser = user.replace(
    "[TRANSCRIPT/VIDEO CONTENT WILL BE APPENDED HERE]",
    transcript
  );
  return callGeminiWithRetry<MeetingAnalysis>(system, fullUser, options);
}

export async function askFollowUp(
  originalAnalysis: MeetingAnalysis,
  question: string,
  options?: { signal?: AbortSignal }
): Promise<{
  answer: string;
  relevantEvidence: string[];
  confidence: "high" | "medium" | "low";
}> {
  const { system, user } = getFollowUpPrompt(originalAnalysis, question);
  return callGeminiWithRetry(system, user, options);
}
