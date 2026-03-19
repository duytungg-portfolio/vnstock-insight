"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format, parseISO, subMonths, subYears } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PricePoint } from "@/types/stock";

// ─── Types ──────────────────────────────────────────────────────────────────

type TimeRange = "1M" | "3M" | "6M" | "1Y" | "All";

interface PriceChartProps {
  priceHistory: PricePoint[];
  ticker: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const VND = (v: number) =>
  v.toLocaleString("vi-VN", { maximumFractionDigits: 0 });

function formatAxisPrice(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v.toFixed(0);
}

function formatAxisDate(dateStr: string): string {
  return format(parseISO(dateStr), "dd/MM");
}

function filterByRange(data: PricePoint[], range: TimeRange): PricePoint[] {
  if (range === "All" || data.length === 0) return data;

  const now = new Date();
  const cutoff =
    range === "1M"
      ? subMonths(now, 1)
      : range === "3M"
        ? subMonths(now, 3)
        : range === "6M"
          ? subMonths(now, 6)
          : subYears(now, 1);

  const cutoffStr = cutoff.toISOString().split("T")[0];
  const filtered = data.filter((d) => d.date >= cutoffStr);
  return filtered.length > 0 ? filtered : data;
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
  payload: PricePoint;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-border/40 bg-zinc-900 dark:bg-zinc-950 px-3.5 py-2.5 shadow-xl text-sm">
      <p className="text-[11px] text-zinc-400 font-medium mb-1.5 tracking-wide">
        {format(parseISO(point.date), "dd/MM/yyyy")}
      </p>
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
        <span className="text-zinc-500 text-xs">Open</span>
        <span className="text-zinc-100 text-xs tabular-nums text-right font-medium">
          {VND(point.open)}
        </span>
        <span className="text-zinc-500 text-xs">High</span>
        <span className="text-emerald-400 text-xs tabular-nums text-right font-medium">
          {VND(point.high)}
        </span>
        <span className="text-zinc-500 text-xs">Low</span>
        <span className="text-red-400 text-xs tabular-nums text-right font-medium">
          {VND(point.low)}
        </span>
        <span className="text-zinc-500 text-xs">Close</span>
        <span className="text-zinc-100 text-xs tabular-nums text-right font-semibold">
          {VND(point.close)}
        </span>
      </div>
      {point.volume > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-zinc-700/60">
          <span className="text-zinc-500 text-[11px]">Vol </span>
          <span className="text-zinc-300 text-[11px] tabular-nums font-medium">
            {point.volume >= 1_000_000
              ? `${(point.volume / 1_000_000).toFixed(2)}M`
              : point.volume >= 1_000
                ? `${(point.volume / 1_000).toFixed(0)}K`
                : point.volume.toLocaleString("en-US")}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Time Range Selector ────────────────────────────────────────────────────

const RANGES: TimeRange[] = ["1M", "3M", "6M", "1Y", "All"];

function RangeSelector({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (r: TimeRange) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg bg-muted/60 p-0.5">
      {RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={cn(
            "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
            r === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function PriceChart({ priceHistory, ticker }: PriceChartProps) {
  const [range, setRange] = useState<TimeRange>("6M");

  const data = useMemo(
    () => filterByRange(priceHistory, range),
    [priceHistory, range]
  );

  if (!priceHistory.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{ticker} Price</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No price data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentPrice = data[data.length - 1].close;
  const firstPrice = data[0].close;
  const isUp = currentPrice >= firstPrice;
  const strokeColor = isUp ? "#10b981" : "#ef4444";
  const gradientId = `priceGradient-${ticker}`;

  const closes = data.map((d) => d.close);
  const minPrice = Math.min(...closes);
  const maxPrice = Math.max(...closes);
  const pricePad = (maxPrice - minPrice) * 0.06 || maxPrice * 0.02;

  const maxVolume = Math.max(...data.map((d) => d.volume));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{ticker} Price</CardTitle>
        <CardAction>
          <RangeSelector value={range} onChange={setRange} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={strokeColor}
                    stopOpacity={0.15}
                  />
                  <stop
                    offset="100%"
                    stopColor={strokeColor}
                    stopOpacity={0.01}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                strokeOpacity={0.06}
              />

              {/* Price Y axis (left) */}
              <YAxis
                yAxisId="price"
                domain={[minPrice - pricePad, maxPrice + pricePad]}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatAxisPrice}
                width={52}
              />

              {/* Volume Y axis (right, hidden) */}
              <YAxis
                yAxisId="volume"
                orientation="right"
                domain={[0, maxVolume * 4]}
                hide
              />

              <XAxis
                dataKey="date"
                tickFormatter={formatAxisDate}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                minTickGap={50}
              />

              <Tooltip
                content={<ChartTooltip />}
                cursor={{
                  stroke: "var(--color-muted-foreground)",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                  strokeOpacity: 0.4,
                }}
              />

              {/* Current price reference line */}
              <ReferenceLine
                yAxisId="price"
                y={currentPrice}
                stroke={strokeColor}
                strokeDasharray="6 4"
                strokeOpacity={0.5}
                strokeWidth={1}
                label={{
                  value: VND(currentPrice),
                  position: "right",
                  fill: strokeColor,
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />

              {/* Volume bars */}
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="currentColor"
                fillOpacity={0.06}
                radius={[1, 1, 0, 0]}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              />

              {/* Price area */}
              <Area
                yAxisId="price"
                type="monotone"
                dataKey="close"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: strokeColor,
                  fill: "var(--color-background)",
                }}
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
