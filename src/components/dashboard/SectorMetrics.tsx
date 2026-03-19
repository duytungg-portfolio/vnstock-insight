"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SectorMetric } from "@/types/stock";

const impactStyles = {
  positive: {
    icon: TrendingUp,
    label: "Positive",
  },
  negative: {
    icon: TrendingDown,
    label: "Negative",
  },
  neutral: {
    icon: Minus,
    label: "Neutral",
  },
};

interface SectorMetricsProps {
  metrics: SectorMetric[];
  sector: string;
}

export function SectorMetrics({ metrics, sector }: SectorMetricsProps) {
  if (!metrics.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sector Metrics — {sector}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No sector metrics available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sector Metrics — {sector}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Metric
                </th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Value
                </th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Impact
                </th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                  Explanation
                </th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, i) => {
                const style = impactStyles[metric.impact];
                const Icon = style.icon;
                return (
                  <tr
                    key={i}
                    className={cn(
                      "border-b border-border/30 last:border-0",
                      "hover:bg-muted/30 transition-colors"
                    )}
                  >
                    <td className="py-3 px-3 font-medium">{metric.name}</td>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold">
                      {typeof metric.currentValue === "number"
                        ? metric.currentValue.toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })
                        : metric.currentValue}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge
                        variant={
                          metric.impact === "positive"
                            ? "default"
                            : metric.impact === "negative"
                              ? "destructive"
                              : "secondary"
                        }
                        className={cn(
                          "gap-1",
                          metric.impact === "positive" &&
                            "bg-emerald-600 text-white"
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {style.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground hidden sm:table-cell max-w-[300px] truncate">
                      {metric.explanation}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground/60 text-xs hidden md:table-cell">
                      {metric.source}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
