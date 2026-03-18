import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  // TODO: Implement price data fetching from TCBS
  return NextResponse.json({ prices: [], ticker });
}
