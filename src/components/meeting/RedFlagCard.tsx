"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RedFlag } from "@/types/meeting";

const severityConfig = {
  high: { label: "High", color: "bg-red-500/15 text-red-700 dark:text-red-400" },
  medium: { label: "Medium", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  low: { label: "Low", color: "bg-muted text-muted-foreground" },
} as const;

interface RedFlagCardProps {
  flags: RedFlag[];
}

export function RedFlagCard({ flags }: RedFlagCardProps) {
  const sorted = [...flags].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="rounded-xl border-2 border-red-500/20 bg-red-500/5 dark:bg-red-500/5">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-red-500/10">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <h3 className="font-semibold text-sm">
          Red Flags ({flags.length})
        </h3>
      </div>
      <div className="divide-y divide-red-500/10">
        {sorted.map((flag, i) => (
          <RedFlagItem key={i} flag={flag} />
        ))}
      </div>
    </div>
  );
}

function RedFlagItem({ flag }: { flag: RedFlag }) {
  const [expanded, setExpanded] = useState(false);
  const config = severityConfig[flag.severity];

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-2">
        <Badge
          className={cn(
            "mt-0.5 shrink-0 border-0 text-[11px] font-medium",
            config.color
          )}
        >
          {config.label}
        </Badge>
        <p className="text-sm flex-1">{flag.flag}</p>
      </div>

      {flag.evidence && (
        <div className="ml-[52px] mt-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                expanded && "rotate-180"
              )}
            />
            Evidence
          </button>
          {expanded && (
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              {flag.evidence}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
