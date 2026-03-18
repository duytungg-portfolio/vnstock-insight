import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  // TODO: Implement ticker search autocomplete
  return NextResponse.json({ results: [], query });
}
