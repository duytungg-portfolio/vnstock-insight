/**
 * Quick test script for the Stock API client.
 * Run: npx tsx scripts/test-tcbs.ts
 */

import { getStockOverview, getPriceHistory, getFinancialOverview, searchTicker } from "../src/lib/tcbs";

async function main() {
  const ticker = "VCB";
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Testing Stock API Client — Ticker: ${ticker}`);
  console.log(`${"=".repeat(60)}\n`);

  // 1. Stock Overview (SSI)
  console.log("── 1. getStockOverview ──────────────────────");
  try {
    const overview = await getStockOverview(ticker);
    console.log(JSON.stringify(overview, null, 2));
  } catch (err) {
    console.error("Failed:", err);
  }

  // 2. Price History (VPS — 3 months)
  console.log("\n── 2. getPriceHistory (3 months) ────────────");
  try {
    const prices = await getPriceHistory(ticker, 3);
    console.log(`Got ${prices.length} data points`);
    if (prices.length > 0) {
      console.log("First:", JSON.stringify(prices[0], null, 2));
      console.log("Last:", JSON.stringify(prices[prices.length - 1], null, 2));
    }
  } catch (err) {
    console.error("Failed:", err);
  }

  // 3. Financial Overview (SSI)
  console.log("\n── 3. getFinancialOverview ──────────────────");
  try {
    const finance = await getFinancialOverview(ticker);
    console.log(JSON.stringify(finance, null, 2));
  } catch (err) {
    console.error("Failed:", err);
  }

  // 4. Search Ticker
  console.log("\n── 4. searchTicker ─────────────────────────");
  try {
    const results = await searchTicker("VCB");
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error("Failed:", err);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("  Test complete!");
  console.log(`${"=".repeat(60)}\n`);
}

main();
