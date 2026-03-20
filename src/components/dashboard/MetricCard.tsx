"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  icon,
}: MetricCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          {icon}
        </div>
        <p className="text-xl font-bold tracking-tight">{value}</p>
        {change !== undefined && change !== 0 && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              change > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {change > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{changeLabel ?? Math.abs(change).toFixed(2)}</span>
          </div>
        )}
        {(change === undefined || change === 0) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Minus className="h-3 w-3" />
            <span>{changeLabel ?? "—"}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
