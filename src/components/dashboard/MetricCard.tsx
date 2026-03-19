"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SectorMetric } from "@/types/stock";

const impactConfig = {
  positive: {
    icon: TrendingUp,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    ring: "ring-emerald-200/50 dark:ring-emerald-800/30",
  },
  negative: {
    icon: TrendingDown,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    ring: "ring-red-200/50 dark:ring-red-800/30",
  },
  neutral: {
    icon: Minus,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    ring: "ring-amber-200/50 dark:ring-amber-800/30",
  },
};

interface MetricCardProps {
  metric: SectorMetric;
}

export function MetricCard({ metric }: MetricCardProps) {
  const config = impactConfig[metric.impact];
  const Icon = config.icon;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
              {metric.name}
            </p>
            <p className="text-2xl font-bold mt-1 tabular-nums">
              {typeof metric.currentValue === "number"
                ? metric.currentValue.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })
                : metric.currentValue}
            </p>
          </div>
          <div
            className={cn(
              "flex items-center justify-center h-9 w-9 rounded-lg ring-1 shrink-0",
              config.bg,
              config.ring
            )}
          >
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
          {metric.explanation}
        </p>
      </CardContent>
    </Card>
  );
}
