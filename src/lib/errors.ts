// ---------------------------------------------------------------------------
// Typed error classes for the application
// ---------------------------------------------------------------------------

/** Base application error with a user-friendly message */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** TCBS / SSI / VPS API rate-limited (HTTP 429 or similar) */
export class RateLimitError extends AppError {
  constructor(public readonly retryAfterMs: number = 5_000) {
    super(
      `Rate limited, retry after ${retryAfterMs}ms`,
      "Data source busy, retrying...",
      true
    );
    this.name = "RateLimitError";
  }
}

/** Gemini API timeout or slow response */
export class AITimeoutError extends AppError {
  constructor() {
    super(
      "Gemini API timed out",
      "AI is thinking harder... extending timeout.",
      true
    );
    this.name = "AITimeoutError";
  }
}

/** Gemini returned malformed JSON */
export class MalformedAIResponseError extends AppError {
  constructor(public readonly rawResponse: string) {
    super(
      `Malformed AI response: ${rawResponse.slice(0, 200)}`,
      "AI returned unexpected format — retrying with stricter instructions.",
      true
    );
    this.name = "MalformedAIResponseError";
  }
}

/** Network is unavailable */
export class NetworkError extends AppError {
  constructor(originalMessage?: string) {
    super(
      `Network error: ${originalMessage ?? "unknown"}`,
      "You appear to be offline. Showing cached data if available.",
      true
    );
    this.name = "NetworkError";
  }
}

/** Ticker not found in the market */
export class TickerNotFoundError extends AppError {
  constructor(
    public readonly ticker: string,
    public readonly suggestions: string[] = []
  ) {
    super(
      `Ticker "${ticker}" not found`,
      `Ticker "${ticker}" not found. ${suggestions.length > 0 ? `Did you mean: ${suggestions.join(", ")}?` : "Check the ticker symbol and try again."}`,
      false
    );
    this.name = "TickerNotFoundError";
  }
}

/** No financial data for this ticker (e.g. new IPO) */
export class NoDataError extends AppError {
  constructor(ticker: string) {
    super(
      `No financial data for ${ticker}`,
      `No financial data available for ${ticker}. This may be a recently-listed stock (IPO). Data should appear within a few trading days.`,
      false
    );
    this.name = "NoDataError";
  }
}

/** YouTube video is private, deleted, or unavailable */
export class YouTubeVideoError extends AppError {
  constructor(reason: "private" | "deleted" | "unavailable" | "too_long") {
    const messages: Record<string, string> = {
      private:
        "This YouTube video is private. Please use a publicly accessible video.",
      deleted:
        "This YouTube video has been deleted or is no longer available.",
      unavailable:
        "Unable to access this YouTube video. Check the URL and try again.",
      too_long:
        "This video exceeds 2 hours. We can analyze the first 60 minutes — proceed?",
    };
    super(`YouTube video ${reason}`, messages[reason], reason === "too_long");
    this.name = "YouTubeVideoError";
  }
}

/** Video file is too long */
export class VideoTooLongError extends AppError {
  constructor(public readonly durationMinutes: number) {
    super(
      `Video is ${durationMinutes} minutes long`,
      `This video is ${durationMinutes} minutes long (over 2 hours). Would you like to analyze the first 60 minutes instead?`,
      true
    );
    this.name = "VideoTooLongError";
  }
}

// ---------------------------------------------------------------------------
// Error classification helper
// ---------------------------------------------------------------------------

export function classifyFetchError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  const message =
    err instanceof Error ? err.message : String(err);

  // Network-level errors
  if (
    message.includes("Failed to fetch") ||
    message.includes("NetworkError") ||
    message.includes("ERR_INTERNET_DISCONNECTED") ||
    message.includes("net::ERR_") ||
    (typeof navigator !== "undefined" && !navigator.onLine)
  ) {
    return new NetworkError(message);
  }

  // Rate limiting
  if (message.includes("429") || message.includes("rate limit")) {
    return new RateLimitError();
  }

  // Timeout
  if (
    message.includes("timeout") ||
    message.includes("AbortError") ||
    message.includes("aborted")
  ) {
    return new AITimeoutError();
  }

  return new AppError(message, "Something went wrong. Please try again.", true);
}

// ---------------------------------------------------------------------------
// Safe JSON parse with retry context
// ---------------------------------------------------------------------------

export function safeParseJSON<T>(raw: string): T {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new MalformedAIResponseError(raw);
  }
}
