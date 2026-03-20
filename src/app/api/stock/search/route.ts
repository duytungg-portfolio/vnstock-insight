import { NextRequest, NextResponse } from "next/server";
import { searchTicker } from "@/lib/tcbs";
import { AppError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [], query: "" });
  }

  try {
    const results = await searchTicker(query.trim());
    return NextResponse.json({ results, query });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { error: err.userMessage, results: [], query },
        { status: err.retryable ? 503 : 400 }
      );
    }
    console.error("[API /stock/search]", err);
    return NextResponse.json(
      { error: "Search failed. Please try again.", results: [], query },
      { status: 500 }
    );
  }
}
