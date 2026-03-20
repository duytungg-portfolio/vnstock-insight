import { NextRequest, NextResponse } from "next/server";
import { getStockOverview, getFinancialOverview } from "@/lib/tcbs";
import { generateSectorMetrics } from "@/lib/gemini";
import { AppError, RateLimitError, AITimeoutError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json(
      { error: "Missing ticker parameter", metrics: [] },
      { status: 400 }
    );
  }

  try {
    // Fetch stock info to get sector
    const stockInfo = await getStockOverview(ticker);
    const financialData = await getFinancialOverview(ticker);

    // Generate AI metrics
    const metrics = await generateSectorMetrics(
      stockInfo.ticker,
      stockInfo.sector,
      financialData as unknown as Record<string, unknown>
    );

    return NextResponse.json({ metrics, ticker: stockInfo.ticker });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: err.userMessage,
          retryAfterMs: err.retryAfterMs,
          metrics: [],
          ticker,
        },
        { status: 429 }
      );
    }

    if (err instanceof AITimeoutError) {
      return NextResponse.json(
        { error: err.userMessage, metrics: [], ticker },
        { status: 504 }
      );
    }

    if (err instanceof AppError) {
      return NextResponse.json(
        { error: err.userMessage, metrics: [], ticker },
        { status: err.retryable ? 503 : 400 }
      );
    }

    console.error("[API /stock/metrics]", err);
    return NextResponse.json(
      { error: "Failed to generate metrics.", metrics: [], ticker },
      { status: 500 }
    );
  }
}
