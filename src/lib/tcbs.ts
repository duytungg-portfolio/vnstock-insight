import type { StockInfo, PricePoint } from "@/types/stock";

// ─── Constants ───────────────────────────────────────────────────────────────

const SSI_BASE = "https://iboard-query.ssi.com.vn";
const VPS_BASE = "https://histdatafeed.vps.com.vn";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1_000;
const CACHE_TTL_MS = 5 * 60 * 1_000; // 5 minutes

// ─── In-Memory Cache ─────────────────────────────────────────────────────────

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Logger ──────────────────────────────────────────────────────────────────

function logApi(method: string, url: string, status?: number, error?: string) {
    const timestamp = new Date().toISOString();
    const prefix = `[StockAPI ${timestamp}]`;
    if (error) {
        console.error(`${prefix} ❌ ${method} ${url} — ${error}`);
    } else {
        console.log(`${prefix} ✅ ${method} ${url} → ${status}`);
    }
}

// ─── Fetch with Retry ────────────────────────────────────────────────────────

async function fetchWithRetry<T>(url: string): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            logApi("GET", url);
            const res = await fetch(url, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    Accept: "application/json",
                },
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const data = (await res.json()) as T;
            logApi("GET", url, res.status);
            return data;
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            logApi(
                "GET",
                url,
                undefined,
                `Attempt ${attempt}/${MAX_RETRIES} — ${lastError.message}`
            );

            if (attempt < MAX_RETRIES) {
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }
    }

    throw new Error(
        `Stock API failed after ${MAX_RETRIES} retries: ${lastError?.message}`
    );
}

// ─── Cached Fetch Helper ────────────────────────────────────────────────────

async function cachedFetch<T>(cacheKey: string, url: string): Promise<T> {
    const cached = getCached<T>(cacheKey);
    if (cached) {
        console.log(`[StockAPI] Cache hit: ${cacheKey}`);
        return cached;
    }

    const data = await fetchWithRetry<T>(url);
    setCache(cacheKey, data);
    return data;
}

// ─── SSI API Response Types ──────────────────────────────────────────────────

interface SsiStockResponse {
    code: string;
    message: string;
    data: SsiStockData;
}

interface SsiStockData {
    stockSymbol: string;
    companyNameEn: string;
    companyNameVi: string;
    clientName: string;
    clientNameEn: string;
    exchange: string;
    ceiling: number;
    floor: number;
    refPrice: number;
    matchedPrice: number;
    priceChange: number;
    priceChangePercent: number;
    openPrice: number;
    highest: number;
    lowest: number;
    avgPrice: number;
    stockVol: number;
    nmTotalTradedValue: number;
    buyForeignQtty: number;
    sellForeignQtty: number;
    session: string;
    [key: string]: unknown;
}

interface SsiExchangeResponse {
    code: string;
    message: string;
    data: SsiStockData[];
}

// ─── VPS Price History Response Types ────────────────────────────────────────

interface VpsPriceResponse {
    symbol: string;
    s: string; // "ok" | "no_data"
    t: number[]; // timestamps
    c: number[]; // close prices
    o: number[]; // open prices
    h: number[]; // high prices
    l: number[]; // low prices
    v: number[]; // volumes
}

// ─── Sector Mapping ──────────────────────────────────────────────────────────

const TICKER_SECTOR_MAP: Record<string, string> = {
    VCB: "Ngân hàng",
    BID: "Ngân hàng",
    CTG: "Ngân hàng",
    TCB: "Ngân hàng",
    MBB: "Ngân hàng",
    VPB: "Ngân hàng",
    HPG: "Thép",
    HSG: "Thép",
    VNM: "Thực phẩm & Đồ uống",
    MSN: "Thực phẩm & Đồ uống",
    VHM: "Bất động sản",
    VRE: "Bất động sản",
    NVL: "Bất động sản",
    VIC: "Tập đoàn đa ngành",
    FPT: "Công nghệ",
    GAS: "Dầu khí",
    PLX: "Dầu khí",
    PNJ: "Bán lẻ",
    MWG: "Bán lẻ",
    SSI: "Chứng khoán",
    VCI: "Chứng khoán",
    HCM: "Chứng khoán",
};

// ─── Public API Functions ────────────────────────────────────────────────────

/**
 * Fetch stock overview information for a given ticker using SSI API.
 */
export async function getStockOverview(ticker: string): Promise<StockInfo> {
    const upperTicker = ticker.toUpperCase();
    const url = `${SSI_BASE}/stock/${upperTicker}`;
    const raw = await cachedFetch<SsiStockResponse>(
        `overview:${upperTicker}`,
        url
    );

    if (raw.code !== "SUCCESS" || !raw.data) {
        throw new Error(`Failed to fetch stock overview for ${upperTicker}`);
    }

    const d = raw.data;
    return {
        ticker: d.stockSymbol ?? upperTicker,
        name: d.companyNameVi || d.clientName || d.companyNameEn || upperTicker,
        sector: TICKER_SECTOR_MAP[upperTicker] ?? "Khác",
        exchange: (d.exchange ?? "HOSE").toUpperCase(),
        currentPrice: d.matchedPrice ?? d.refPrice ?? 0,
        priceChange: d.priceChange ?? 0,
        priceChangePercent: d.priceChangePercent ?? 0,
    };
}

/**
 * Fetch historical price data for the past N months using VPS API.
 */
export async function getPriceHistory(
    ticker: string,
    months: number = 6
): Promise<PricePoint[]> {
    const upperTicker = ticker.toUpperCase();
    const to = Math.floor(Date.now() / 1000);
    const from = to - months * 30 * 24 * 60 * 60;
    const url =
        `${VPS_BASE}/tradingview/history` +
        `?symbol=${upperTicker}&resolution=D&from=${from}&to=${to}`;

    const raw = await cachedFetch<VpsPriceResponse>(
        `price:${upperTicker}:${months}m`,
        url
    );

    if (raw.s !== "ok" || !raw.t || !Array.isArray(raw.t)) {
        return [];
    }

    return raw.t.map((timestamp, i) => ({
        date: new Date(timestamp * 1000).toISOString().split("T")[0],
        open: raw.o[i] ?? 0,
        high: raw.h[i] ?? 0,
        low: raw.l[i] ?? 0,
        close: raw.c[i] ?? 0,
        volume: raw.v[i] ?? 0,
    }));
}

/**
 * Fetch financial overview metrics for a ticker.
 * Uses SSI stock data to derive basic financial info since TCBS is deprecated.
 */
export async function getFinancialOverview(ticker: string): Promise<{
    ticker: string;
    refPrice: number;
    ceiling: number;
    floor: number;
    avgPrice: number;
    totalVolume: number;
    totalValue: number;
    foreignBuyVolume: number;
    foreignSellVolume: number;
    openPrice: number;
    highestPrice: number;
    lowestPrice: number;
    exchange: string;
}> {
    const upperTicker = ticker.toUpperCase();
    const url = `${SSI_BASE}/stock/${upperTicker}`;
    const raw = await cachedFetch<SsiStockResponse>(
        `finance:${upperTicker}`,
        url
    );

    if (raw.code !== "SUCCESS" || !raw.data) {
        throw new Error(`Failed to fetch financial data for ${upperTicker}`);
    }

    const d = raw.data;
    return {
        ticker: d.stockSymbol ?? upperTicker,
        refPrice: d.refPrice ?? 0,
        ceiling: d.ceiling ?? 0,
        floor: d.floor ?? 0,
        avgPrice: d.avgPrice ?? 0,
        totalVolume: d.stockVol ?? 0,
        totalValue: d.nmTotalTradedValue ?? 0,
        foreignBuyVolume: d.buyForeignQtty ?? 0,
        foreignSellVolume: d.sellForeignQtty ?? 0,
        openPrice: d.openPrice ?? 0,
        highestPrice: d.highest ?? 0,
        lowestPrice: d.lowest ?? 0,
        exchange: (d.exchange ?? "HOSE").toUpperCase(),
    };
}

/**
 * Search for tickers matching a query string.
 * Fetches all HOSE stocks and filters by ticker prefix or company name.
 */
export async function searchTicker(
    query: string
): Promise<{ ticker: string; name: string; exchange: string }[]> {
    const upperQuery = query.toUpperCase().trim();

    if (!upperQuery || upperQuery.length < 1) {
        return [];
    }

    // First, try exact ticker lookup
    try {
        const info = await getStockOverview(upperQuery);
        return [
            {
                ticker: info.ticker,
                name: info.name,
                exchange: info.exchange,
            },
        ];
    } catch {
        // Not an exact match, try fetching the full exchange list
    }

    // Fallback: search across HOSE exchange
    try {
        const url = `${SSI_BASE}/stock/exchange/HOSE`;
        const raw = await cachedFetch<SsiExchangeResponse>(
            "exchange:HOSE",
            url
        );

        if (raw.code !== "SUCCESS" || !raw.data) {
            return [];
        }

        return raw.data
            .filter(
                (s) =>
                    s.stockSymbol?.toUpperCase().includes(upperQuery) ||
                    s.companyNameEn?.toUpperCase().includes(upperQuery) ||
                    s.companyNameVi?.toUpperCase().includes(upperQuery)
            )
            .slice(0, 10)
            .map((s) => ({
                ticker: s.stockSymbol,
                name: s.companyNameVi || s.companyNameEn || s.stockSymbol,
                exchange: (s.exchange ?? "HOSE").toUpperCase(),
            }));
    } catch {
        return [];
    }
}
