"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PricePoint } from "@/types/stock";

interface PriceChartProps {
  data: PricePoint[];
  ticker: string;
}

export function PriceChart({ data, ticker }: PriceChartProps) {
  const chartData = useMemo(() => {
    return data.map((p) => ({
      date: p.date,
      // Format date for axis: "Mar 05"
      label: new Date(p.date).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      }),
      close: p.close,
      volume: p.volume,
    }));
  }, [data]);

  const { min, max } = useMemo(() => {
    const closes = data.map((p) => p.close);
    const pad = (Math.max(...closes) - Math.min(...closes)) * 0.05;
    return {
      min: Math.floor(Math.min(...closes) - pad),
      max: Math.ceil(Math.max(...closes) + pad),
    };
  }, [data]);

  const isUp =
    chartData.length >= 2 &&
    chartData[chartData.length - 1].close >= chartData[0].close;

  const strokeColor = isUp ? "#10b981" : "#ef4444";
  const fillId = isUp ? "fillGreen" : "fillRed";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {ticker} · 6 months · {chartData.length} sessions
          </span>
        </div>
        {chartData.length >= 2 && (
          <div
            className={`text-xs font-medium ${isUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
          >
            {isUp ? "▲" : "▼"}{" "}
            {(
              ((chartData[chartData.length - 1].close - chartData[0].close) /
                chartData[0].close) *
              100
            ).toFixed(1)}
            %
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="fillGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fillRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--color-border, #e5e7eb)"
            opacity={0.4}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground, #9ca3af)" }}
            tickLine={false}
            axisLine={false}
            interval={Math.max(Math.floor(chartData.length / 6) - 1, 0)}
          />
          <YAxis
            domain={[min, max]}
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground, #9ca3af)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${(v * 1000).toLocaleString()}`}
            width={65}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-xs">
                  <p className="font-medium mb-1">{d.date}</p>
                  <p>
                    Close:{" "}
                    <span className="font-semibold">
                      {(d.close * 1000).toLocaleString()} VND
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Vol: {d.volume.toLocaleString()}
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={`url(#${fillId})`}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
