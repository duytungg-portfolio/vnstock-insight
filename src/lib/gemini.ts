import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SectorMetric } from "@/types/stock";

// ─── Config ──────────────────────────────────────────────────────────────────

const USE_MOCK = process.env.GEMINI_MOCK === "true";

// ─── Client ─────────────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

function getModel() {
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

function getMockSectorMetrics(ticker: string, sector: string): SectorMetric[] {
  return [
    {
      name: "P/E Ratio",
      currentValue: 14.2,
      impact: "positive",
      explanation: `${ticker} is trading at a reasonable valuation compared to ${sector} sector peers.`,
      source: "TCBS Financial Data",
    },
    {
      name: "ROE",
      currentValue: 18.5,
      impact: "positive",
      explanation: "Strong return on equity indicates efficient use of shareholder capital.",
      source: "TCBS Financial Data",
    },
    {
      name: "Debt/Equity",
      currentValue: 0.42,
      impact: "neutral",
      explanation: "Moderate leverage level, within acceptable range for the sector.",
      source: "TCBS Financial Data",
    },
    {
      name: "Revenue Growth",
      currentValue: -3.8,
      impact: "negative",
      explanation: "Slight revenue decline year-over-year, monitor for recovery signs.",
      source: "TCBS Financial Data",
    },
  ];
}

function getMockAIInsight(ticker: string, priceChangePercent: number): AIInsightResult {
  const sentiment: AIInsightResult["sentiment"] =
    priceChangePercent > 2 ? "bullish" : priceChangePercent < -2 ? "bearish" : "neutral";

  return {
    summary: `${ticker} shows mixed signals with recent price movement of ${priceChangePercent.toFixed(1)}%. Fundamental indicators remain solid with healthy profitability metrics, though market conditions warrant cautious optimism. Investors should monitor upcoming earnings reports for directional clarity.`,
    sentiment,
    keyPoints: [
      "Strong profitability metrics above sector average",
      "Healthy balance sheet with manageable debt levels",
      "Consistent dividend payout history",
    ],
    risks: [
      "Market volatility may pressure short-term performance",
      "Sector-wide headwinds from regulatory changes",
    ],
  };
}

// ─── Sector Metrics ─────────────────────────────────────────────────────────

export async function generateSectorMetrics(
  ticker: string,
  sector: string,
  financialData: Record<string, unknown>
): Promise<SectorMetric[]> {
  if (USE_MOCK) {
    console.log("[Gemini] Using mock sector metrics");
    return getMockSectorMetrics(ticker, sector);
  }

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
    console.log("[Gemini] Falling back to mock data");
    return getMockSectorMetrics(ticker, sector);
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
  if (USE_MOCK) {
    console.log("[Gemini] Using mock AI insight");
    return getMockAIInsight(ticker, priceChangePercent);
  }

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
    console.log("[Gemini] Falling back to mock data");
    return getMockAIInsight(ticker, priceChangePercent);
  }
}
