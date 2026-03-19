import { NextRequest, NextResponse } from "next/server";
import { getStockOverview, getFinancialOverview } from "@/lib/tcbs";
import { generateSectorMetrics, generateAIInsight } from "@/lib/gemini";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.trim();

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker" }, { status: 400 });
  }

  try {
    const [stockInfo, financialData] = await Promise.all([
      getStockOverview(ticker),
      getFinancialOverview(ticker),
    ]);

    const [metrics, insight] = await Promise.all([
      generateSectorMetrics(ticker, stockInfo.sector, financialData as unknown as Record<string, unknown>),
      generateAIInsight(ticker, stockInfo.sector, financialData as unknown as Record<string, unknown>, stockInfo.priceChangePercent),
    ]);

    return NextResponse.json({ metrics, insight, stockInfo, financialData });
  } catch (error) {
    console.error("[API /stock/metrics]", error);
    return NextResponse.json(
      { error: "Failed to generate metrics" },
      { status: 500 }
    );
  }
}
