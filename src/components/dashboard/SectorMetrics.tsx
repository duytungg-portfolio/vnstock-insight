"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SectorMetric } from "@/types/stock";

interface SectorMetricsProps {
  metrics: SectorMetric[];
}

const impactConfig = {
  positive: {
    icon: TrendingUp,
    color: "text-emerald-600 dark:text-emerald-400",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0",
    label: "Tích cực",
  },
  negative: {
    icon: TrendingDown,
    color: "text-red-600 dark:text-red-400",
    badgeClass: "bg-red-500/10 text-red-700 dark:text-red-400 border-0",
    label: "Tiêu cực",
  },
  neutral: {
    icon: Minus,
    color: "text-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground border-0",
    label: "Trung tính",
  },
} as const;

export function SectorMetrics({ metrics }: SectorMetricsProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2.5 pr-3 font-medium text-muted-foreground">
              Chỉ số
            </th>
            <th className="pb-2.5 pr-3 font-medium text-muted-foreground text-right whitespace-nowrap">
              Giá trị
            </th>
            <th className="pb-2.5 pr-3 font-medium text-muted-foreground whitespace-nowrap">
              Tác động
            </th>
            <th className="pb-2.5 font-medium text-muted-foreground hidden sm:table-cell">
              Giải thích
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {metrics.map((metric, i) => {
            const config = impactConfig[metric.impact];
            const Icon = config.icon;
            return (
              <motion.tr
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
              >
                <td className="py-2.5 pr-3">
                  <div className="font-medium">{metric.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 sm:hidden">
                    {metric.explanation}
                  </div>
                </td>
                <td className="py-2.5 pr-3 text-right font-mono whitespace-nowrap">
                  {typeof metric.currentValue === "number"
                    ? metric.currentValue.toLocaleString()
                    : metric.currentValue}
                </td>
                <td className="py-2.5 pr-3">
                  <Badge className={`${config.badgeClass} text-[11px] gap-1`}>
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </td>
                <td className="py-2.5 text-xs text-muted-foreground leading-relaxed hidden sm:table-cell max-w-xs">
                  {metric.explanation}
                  {metric.source && (
                    <span className="block text-[10px] text-muted-foreground/60 mt-0.5">
                      Nguồn: {metric.source}
                    </span>
                  )}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
