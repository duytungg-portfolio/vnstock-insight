import { NextRequest, NextResponse } from "next/server";
import { getPriceHistory } from "@/lib/tcbs";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.trim();

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker" }, { status: 400 });
  }

  try {
    const prices = await getPriceHistory(ticker, 6);
    return NextResponse.json({ prices });
  } catch (error) {
    console.error("[API /stock/price]", error);
    return NextResponse.json({ prices: [] }, { status: 500 });
  }
}
