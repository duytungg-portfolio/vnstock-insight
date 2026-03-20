import { NextRequest, NextResponse } from "next/server";
import { generateAIInsight } from "@/lib/gemini";
import { AppError, RateLimitError, AITimeoutError } from "@/lib/errors";
import type { SectorMetric, PricePoint } from "@/types/stock";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ticker,
      metrics,
      priceData,
    }: {
      ticker: string;
      metrics: SectorMetric[];
      priceData: PricePoint[];
    } = body;

    if (!ticker) {
      return NextResponse.json(
        { error: "Missing ticker" },
        { status: 400 }
      );
    }

    if (!metrics?.length || !priceData?.length) {
      return NextResponse.json(
        { error: "Need both metrics and price data to generate insight" },
        { status: 400 }
      );
    }

    const result = await generateAIInsight(ticker, metrics, priceData);

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.userMessage, retryAfterMs: err.retryAfterMs },
        { status: 429 }
      );
    }

    if (err instanceof AITimeoutError) {
      return NextResponse.json(
        { error: err.userMessage },
        { status: 504 }
      );
    }

    if (err instanceof AppError) {
      return NextResponse.json(
        { error: err.userMessage },
        { status: err.retryable ? 503 : 400 }
      );
    }

    console.error("[API /stock/insight]", err);
    return NextResponse.json(
      { error: "Failed to generate AI insight." },
      { status: 500 }
    );
  }
}
