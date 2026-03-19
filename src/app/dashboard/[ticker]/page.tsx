"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { AIInsight } from "@/components/dashboard/AIInsight";
import { SectorMetrics } from "@/components/dashboard/SectorMetrics";
import type { StockInfo, SectorMetric, PricePoint } from "@/types/stock";
import type { AIInsightResult } from "@/lib/gemini";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DashboardState {
  stockInfo: StockInfo | null;
  priceHistory: PricePoint[];
  metrics: SectorMetric[];
  insight: AIInsightResult | null;
  financialData: Record<string, unknown> | null;
  loading: {
    price: boolean;
    metrics: boolean;
  };
  error: string | null;
}

// ─── Loading Skeletons ──────────────────────────────────────────────────────

function HeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-7 w-24" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <Skeleton className="h-3 w-full mt-3" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardContent>
        <Skeleton className="h-5 w-48 mb-4" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function InsightSkeleton() {
  return (
    <Card className="h-full">
      <CardContent>
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-2/3" />
      </CardContent>
    </Card>
  );
}

function SectorSkeleton() {
  return (
    <Card>
      <CardContent>
        <Skeleton className="h-5 w-56 mb-4" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-48 hidden sm:block" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Error Component ────────────────────────────────────────────────────────

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        <p className="text-sm font-medium text-foreground mb-1">
          Something went wrong
        </p>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {message}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Dashboard Page ─────────────────────────────────────────────────────────

export default function DashboardPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker: rawTicker } = use(params);
  const ticker = rawTicker.toUpperCase();

  const [state, setState] = useState<DashboardState>({
    stockInfo: null,
    priceHistory: [],
    metrics: [],
    insight: null,
    financialData: null,
    loading: { price: true, metrics: true },
    error: null,
  });

  const [refreshing, setRefreshing] = useState(false);

  // Fetch price data
  const fetchPrice = useCallback(async () => {
    setState((s) => ({ ...s, loading: { ...s.loading, price: true } }));
    try {
      const res = await fetch(`/api/stock/price?ticker=${ticker}`);
      if (!res.ok) throw new Error("Failed to fetch price data");
      const data = await res.json();
      setState((s) => ({
        ...s,
        priceHistory: data.prices ?? [],
        loading: { ...s.loading, price: false },
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: { ...s.loading, price: false },
        error: s.error || (err instanceof Error ? err.message : "Failed to load price data"),
      }));
    }
  }, [ticker]);

  // Fetch AI metrics + stock info
  const fetchMetrics = useCallback(async () => {
    setState((s) => ({ ...s, loading: { ...s.loading, metrics: true } }));
    try {
      const res = await fetch(`/api/stock/metrics?ticker=${ticker}`);
      if (!res.ok) throw new Error("Failed to fetch stock data");
      const data = await res.json();
      setState((s) => ({
        ...s,
        stockInfo: data.stockInfo ?? null,
        metrics: data.metrics ?? [],
        insight: data.insight ?? null,
        financialData: data.financialData ?? null,
        loading: { ...s.loading, metrics: false },
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: { ...s.loading, metrics: false },
        error: err instanceof Error ? err.message : "Failed to load data",
      }));
    }
  }, [ticker]);

  // Initial parallel fetch
  useEffect(() => {
    setState((s) => ({ ...s, error: null }));
    fetchPrice();
    fetchMetrics();
  }, [fetchPrice, fetchMetrics]);

  // Refresh AI analysis
  const handleRefresh = async () => {
    setRefreshing(true);
    setState((s) => ({ ...s, error: null }));
    await Promise.all([fetchPrice(), fetchMetrics()]);
    setRefreshing(false);
  };

  const { stockInfo, priceHistory, metrics, insight, loading, error } = state;
  const isFullyLoading = loading.price && loading.metrics;

  // Full-page error
  if (error && !stockInfo && !loading.metrics) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to search
        </Link>
        <ErrorCard message={error} onRetry={handleRefresh} />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 text-xs">
            <Sparkles className="h-3 w-3" />
            Powered by Gemini
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5 mr-1.5", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stock Header */}
      {loading.metrics ? (
        <HeaderSkeleton />
      ) : stockInfo ? (
        <div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">
              {stockInfo.ticker}
            </h1>
            <span className="text-lg text-muted-foreground">
              {stockInfo.name}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Badge variant="outline">{stockInfo.sector}</Badge>
            <Badge variant="outline">{stockInfo.exchange}</Badge>
            {stockInfo.currentPrice > 0 && (
              <span className="text-lg font-semibold tabular-nums">
                {stockInfo.currentPrice.toLocaleString("en-US")} VND
              </span>
            )}
            {stockInfo.priceChangePercent !== 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-sm font-medium",
                  stockInfo.priceChangePercent > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {stockInfo.priceChangePercent > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {stockInfo.priceChangePercent > 0 ? "+" : ""}
                {stockInfo.priceChangePercent.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      ) : null}

      {/* Row 1: Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading.metrics
          ? [0, 1, 2, 3].map((i) => <MetricCardSkeleton key={i} />)
          : metrics.map((metric, i) => (
              <MetricCard key={i} metric={metric} />
            ))}
      </div>

      {/* Row 2: Chart + AI Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          {loading.price ? (
            <ChartSkeleton />
          ) : (
            <PriceChart priceHistory={priceHistory} ticker={ticker} />
          )}
        </div>
        <div className="lg:col-span-2">
          {loading.metrics || !insight ? (
            <InsightSkeleton />
          ) : (
            <AIInsight insight={insight} />
          )}
        </div>
      </div>

      {/* Row 3: Sector Metrics Table */}
      {loading.metrics ? (
        <SectorSkeleton />
      ) : (
        <SectorMetrics
          metrics={metrics}
          sector={stockInfo?.sector ?? ticker}
        />
      )}

      {/* Footer */}
      <div className="text-center pt-4 pb-8">
        <p className="text-xs text-muted-foreground">
          Data from TCBS/SSI · AI analysis by Gemini · Prices may be delayed
        </p>
      </div>
    </div>
  );
}
