import { NextRequest, NextResponse } from "next/server";
import { getPriceHistory } from "@/lib/tcbs";
import { AppError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  const months = parseInt(
    request.nextUrl.searchParams.get("months") ?? "6",
    10
  );

  if (!ticker) {
    return NextResponse.json(
      { error: "Missing ticker parameter", prices: [] },
      { status: 400 }
    );
  }

  try {
    const prices = await getPriceHistory(ticker, months);

    if (prices.length === 0) {
      return NextResponse.json({
        prices: [],
        ticker,
        warning:
          "No price data available. This may be a newly-listed stock.",
      });
    }

    return NextResponse.json({ prices, ticker });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { error: err.userMessage, prices: [], ticker },
        { status: err.retryable ? 503 : 400 }
      );
    }
    console.error("[API /stock/price]", err);
    return NextResponse.json(
      { error: "Failed to fetch price data.", prices: [], ticker },
      { status: 500 }
    );
  }
}
