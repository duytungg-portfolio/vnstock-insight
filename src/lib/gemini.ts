import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SectorMetric } from "@/types/stock";

// ─── Client ─────────────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

function getModel() {
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

// ─── Sector Metrics ─────────────────────────────────────────────────────────

export async function generateSectorMetrics(
  ticker: string,
  sector: string,
  financialData: Record<string, unknown>
): Promise<SectorMetric[]> {
  const model = getModel();

  const prompt = `You are a Vietnamese stock market analyst. Analyze the stock ${ticker} in the "${sector}" sector.

Financial data: ${JSON.stringify(financialData)}

Return exactly 4 key sector-specific metrics as a JSON array. Each metric must have:
- "name": metric name (e.g., "NIM", "NPL Ratio", "P/E", "ROE")
- "currentValue": numeric value (number, not string)
- "impact": one of "positive", "negative", or "neutral"
- "explanation": brief 1-sentence explanation of what this means for investors
- "source": data source description

Return ONLY the JSON array, no markdown fences, no extra text.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```(?:json)?\n?/g, "").replace(/```$/g, "").trim();
    const metrics = JSON.parse(cleaned) as SectorMetric[];
    return metrics.slice(0, 4);
  } catch (error) {
    console.error("[Gemini] Failed to generate sector metrics:", error);
    return [];
  }
}

// ─── AI Insight ─────────────────────────────────────────────────────────────

export interface AIInsightResult {
  summary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  keyPoints: string[];
  risks: string[];
}

export async function generateAIInsight(
  ticker: string,
  sector: string,
  financialData: Record<string, unknown>,
  priceChangePercent: number
): Promise<AIInsightResult> {
  const model = getModel();

  const prompt = `You are a Vietnamese stock market analyst. Provide an investment insight for ${ticker} in the "${sector}" sector.

Financial data: ${JSON.stringify(financialData)}
Recent price change: ${priceChangePercent}%

Return a JSON object with:
- "summary": 2-3 sentence investment insight in English
- "sentiment": one of "bullish", "bearish", or "neutral"
- "keyPoints": array of 2-3 positive points (short strings)
- "risks": array of 1-2 risk factors (short strings)

Return ONLY the JSON object, no markdown fences, no extra text.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```(?:json)?\n?/g, "").replace(/```$/g, "").trim();
    return JSON.parse(cleaned) as AIInsightResult;
  } catch (error) {
    console.error("[Gemini] Failed to generate AI insight:", error);
    return {
      summary: "AI analysis is temporarily unavailable. Please try refreshing.",
      sentiment: "neutral",
      keyPoints: [],
      risks: [],
    };
  }
}
