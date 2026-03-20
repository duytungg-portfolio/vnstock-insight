"use client";

import { use, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageTransition } from "@/components/layout/PageTransition";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { SectorMetrics } from "@/components/dashboard/SectorMetrics";
import { AIInsight } from "@/components/dashboard/AIInsight";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { PricePoint, SectorMetric } from "@/types/stock";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StockResult {
  ticker: string;
  name: string;
  exchange: string;
}

interface InsightData {
  insight: string;
  keyRisk: string;
  keyOpportunity: string;
  actionTags: string[];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = use(params);
  const upperTicker = ticker.toUpperCase();

  // Data states
  const [stockInfo, setStockInfo] = useState<StockResult | null>(null);
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [sectorMetrics, setSectorMetrics] = useState<SectorMetric[]>([]);
  const [aiInsight, setAiInsight] = useState<InsightData | null>(null);

  // Loading states
  const [priceLoading, setPriceLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(true);

  // Error states
  const [priceError, setPriceError] = useState<string | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);

  // Rate limit
  const [retrying, setRetrying] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);

  // ── Fetch stock info + price data ──────────────────────────────────
  const fetchStockData = useCallback(async () => {
    setPriceLoading(true);
    setPriceError(null);

    try {
      const [searchRes, priceRes] = await Promise.all([
        fetch(`/api/stock/search?q=${encodeURIComponent(upperTicker)}`),
        fetch(`/api/stock/price?ticker=${encodeURIComponent(upperTicker)}`),
      ]);

      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.results?.length > 0) {
          setStockInfo(data.results[0]);
        }
      }

      if (priceRes.status === 429) {
        setRetrying(true);
        setRetryCountdown(5);
        toast.warning("Data source busy, retrying...");
        let count = 5;
        const iv = setInterval(() => {
          count--;
          setRetryCountdown(count);
          if (count <= 0) {
            clearInterval(iv);
            setRetrying(false);
            fetchStockData();
          }
        }, 1000);
        return;
      }

      if (priceRes.ok) {
        const data = await priceRes.json();
        setPriceData(data.prices ?? []);
      }
    } catch (err) {
      setPriceError(
        err instanceof Error ? err.message : "Failed to load price data"
      );
    } finally {
      setPriceLoading(false);
    }
  }, [upperTicker]);

  // ── Fetch AI sector metrics ────────────────────────────────────────
  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);

    try {
      const res = await fetch(
        `/api/stock/metrics?ticker=${encodeURIComponent(upperTicker)}`
      );

      if (res.status === 429) {
        const data = await res.json();
        setMetricsError(
          data.error ?? "AI is rate-limited. Please try again in a minute."
        );
        return;
      }

      if (res.status === 504) {
        setMetricsError("AI is thinking harder... try refreshing in a moment.");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMetricsError(data.error ?? "Failed to generate metrics");
        return;
      }

      const data = await res.json();
      setSectorMetrics(data.metrics ?? []);
    } catch (err) {
      setMetricsError(
        err instanceof Error ? err.message : "Failed to load metrics"
      );
    } finally {
      setMetricsLoading(false);
    }
  }, [upperTicker]);

  // ── Fetch AI insight (needs metrics + price data) ──────────────────
  const fetchInsight = useCallback(async () => {
    setInsightLoading(true);
    setInsightError(null);

    try {
      const res = await fetch("/api/stock/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: upperTicker,
          metrics: sectorMetrics,
          priceData: priceData.slice(-10),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setInsightError(data.error ?? "Failed to generate insight");
        return;
      }

      const data = await res.json();
      setAiInsight(data);
    } catch (err) {
      setInsightError(
        err instanceof Error ? err.message : "Failed to load AI insight"
      );
    } finally {
      setInsightLoading(false);
    }
  }, [upperTicker, sectorMetrics, priceData]);

  // ── Orchestrate fetches ────────────────────────────────────────────
  useEffect(() => {
    fetchStockData();
    fetchMetrics();
  }, [fetchStockData, fetchMetrics]);

  useEffect(() => {
    if (sectorMetrics.length > 0 && priceData.length > 0) {
      fetchInsight();
    } else if (!metricsLoading && !priceLoading) {
      setInsightLoading(false);
    }
  }, [sectorMetrics, priceData, metricsLoading, priceLoading, fetchInsight]);

  // ── Derived values ─────────────────────────────────────────────────
  const lastPrice =
    priceData.length > 0 ? priceData[priceData.length - 1] : null;
  const prevPrice =
    priceData.length > 1 ? priceData[priceData.length - 2] : null;
  const priceChange =
    lastPrice && prevPrice ? lastPrice.close - prevPrice.close : 0;
  const priceChangePct =
    prevPrice && prevPrice.close > 0
      ? (priceChange / prevPrice.close) * 100
      : 0;

  // Pick top 4 metrics for the card row (matching wireframe)
  const topMetrics = sectorMetrics.slice(0, 4);

  return (
    <PageTransition>
      <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/" },
            { label: upperTicker },
          ]}
        />

        {/* ────────────────────────────────────────────────────────────
            Stock header — single row: Ticker | Name — Sector | Price
            Matches wireframe: VCB  Vietcombank — Banking  89,500 +1.2%
        ──────────────────────────────────────────────────────────── */}
        <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 mb-6">
          <h1 className="text-xl font-semibold tracking-tight">
            {upperTicker}
          </h1>
          <span className="text-sm text-muted-foreground">
            {priceLoading
              ? "Loading..."
              : stockInfo?.name ?? upperTicker}
          </span>
          {!priceLoading && lastPrice && (
            <span
              className={`text-base font-semibold ml-auto ${
                priceChange >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {(lastPrice.close * 1000).toLocaleString()}{" "}
              {priceChange >= 0 ? "+" : ""}
              {priceChangePct.toFixed(1)}%
            </span>
          )}
          {retrying && (
            <Badge
              variant="secondary"
              className="gap-1.5 text-amber-700 dark:text-amber-400 bg-amber-500/10 ml-2"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              Retrying in {retryCountdown}s
            </Badge>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────────
            Metric cards row — 4 columns (top sector metrics)
            Matches wireframe: P/E ratio | Credit growth | NPL ratio | SBV rate
        ──────────────────────────────────────────────────────────── */}
        <ErrorBoundary section="Metrics" compact>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {metricsLoading || priceLoading
              ? [1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.35 }}
                  >
                    <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </motion.div>
                ))
              : topMetrics.length > 0
                ? topMetrics.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.35 }}
                    >
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-[11px] text-muted-foreground mb-1 truncate">
                          {m.name}
                        </p>
                        <p className="text-lg font-semibold tracking-tight">
                          {typeof m.currentValue === "number"
                            ? m.currentValue.toLocaleString()
                            : m.currentValue}
                        </p>
                        <p
                          className={`text-[11px] mt-0.5 ${
                            m.impact === "positive"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : m.impact === "negative"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground"
                          }`}
                        >
                          {m.impact === "positive"
                            ? "Positive"
                            : m.impact === "negative"
                              ? "Watch closely"
                              : "Unchanged"}
                        </p>
                      </div>
                    </motion.div>
                  ))
                : /* Fallback: show price-based cards when no AI metrics */
                  [
                    {
                      label: "Giá hiện tại",
                      value: lastPrice
                        ? `${(lastPrice.close * 1000).toLocaleString()}`
                        : "N/A",
                      sub: priceChange >= 0 ? "Positive" : "Watch closely",
                      color:
                        priceChange >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400",
                    },
                    {
                      label: "Khối lượng",
                      value: lastPrice
                        ? lastPrice.volume.toLocaleString()
                        : "N/A",
                      sub: "Latest session",
                      color: "text-muted-foreground",
                    },
                    {
                      label: "Cao nhất",
                      value: lastPrice
                        ? `${(lastPrice.high * 1000).toLocaleString()}`
                        : "N/A",
                      sub: "Intraday high",
                      color: "text-muted-foreground",
                    },
                    {
                      label: "Thấp nhất",
                      value: lastPrice
                        ? `${(lastPrice.low * 1000).toLocaleString()}`
                        : "N/A",
                      sub: "Intraday low",
                      color: "text-muted-foreground",
                    },
                  ].map((card, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.35 }}
                    >
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-[11px] text-muted-foreground mb-1">
                          {card.label}
                        </p>
                        <p className="text-lg font-semibold tracking-tight">
                          {card.value}
                        </p>
                        <p className={`text-[11px] mt-0.5 ${card.color}`}>
                          {card.sub}
                        </p>
                      </div>
                    </motion.div>
                  ))}
          </div>
        </ErrorBoundary>

        {/* ────────────────────────────────────────────────────────────
            Two-column: Price chart (1.4fr) + AI insight (1fr)
            Matches wireframe side-by-side layout
        ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 mb-6">
          {/* Price chart */}
          <ErrorBoundary section="Price Chart" compact>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground font-normal">
                    Price chart (6M)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {priceLoading ? (
                    <Skeleton className="h-[220px] w-full rounded-lg" />
                  ) : priceError ? (
                    <ErrorCard
                      message={priceError}
                      onRetry={fetchStockData}
                    />
                  ) : priceData.length === 0 ? (
                    <EmptyCard
                      icon={
                        <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
                      }
                      title="Không có dữ liệu giá"
                      description="Cổ phiếu mới niêm yết (IPO)."
                    />
                  ) : (
                    <PriceChart data={priceData} ticker={upperTicker} />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </ErrorBoundary>

          {/* AI Insight */}
          <ErrorBoundary section="AI Insight" compact>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs text-muted-foreground font-normal">
                      AI insight (Gemini)
                    </CardTitle>
                    {!insightLoading && aiInsight && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] gap-1"
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        AI
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {insightLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex gap-2 pt-3">
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    </div>
                  ) : insightError ? (
                    <ErrorCard
                      message={insightError}
                      onRetry={fetchInsight}
                    />
                  ) : aiInsight ? (
                    <AIInsight {...aiInsight} />
                  ) : (
                    <EmptyCard
                      icon={
                        <Sparkles className="h-8 w-8 text-muted-foreground/30" />
                      }
                      title="Chưa có nhận định"
                      description="Cần dữ liệu giá và chỉ số ngành."
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </ErrorBoundary>
        </div>

        {/* ────────────────────────────────────────────────────────────
            Sector metrics table — full width below
            Matches wireframe: "Key sector metrics (Banking)" table
        ──────────────────────────────────────────────────────────── */}
        <ErrorBoundary section="Sector Metrics" compact>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs text-muted-foreground font-normal">
                    Key sector metrics
                  </CardTitle>
                  {!metricsLoading && sectorMetrics.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      AI Generated
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-4 flex-[2] hidden sm:block" />
                      </div>
                    ))}
                  </div>
                ) : metricsError ? (
                  <ErrorCard message={metricsError} onRetry={fetchMetrics} />
                ) : sectorMetrics.length === 0 ? (
                  <EmptyCard
                    icon={
                      <Sparkles className="h-8 w-8 text-muted-foreground/30" />
                    }
                    title="Chưa có chỉ số"
                    description="Không thể tạo chỉ số ngành cho mã này."
                  />
                ) : (
                  <SectorMetrics metrics={sectorMetrics} />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </ErrorBoundary>
      </div>
    </PageTransition>
  );
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <AlertTriangle className="h-5 w-5 text-destructive/50 mb-2" />
      <p className="text-xs text-muted-foreground max-w-xs mb-3">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-1.5 h-3 w-3" />
        Thử lại
      </Button>
    </div>
  );
}

function EmptyCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      {icon}
      <p className="text-sm text-muted-foreground mt-2">{title}</p>
      <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
        {description}
      </p>
    </div>
  );
}
