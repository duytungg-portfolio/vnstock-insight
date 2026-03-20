"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MeetingPromise } from "@/types/meeting";

const credibilityConfig = {
  high: { label: "High", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  medium: { label: "Medium", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  low: { label: "Low", color: "bg-red-500/15 text-red-700 dark:text-red-400" },
} as const;

interface PromiseTrackerProps {
  promises: MeetingPromise[];
}

export function PromiseTracker({ promises }: PromiseTrackerProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Promise / Commitment
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">
              Timeline
            </th>
            <th className="pb-2 font-medium text-muted-foreground whitespace-nowrap">
              Credibility
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {promises.map((promise, i) => {
            const config = credibilityConfig[promise.credibility];
            return (
              <tr key={i}>
                <td className="py-2.5 pr-4">{promise.content}</td>
                <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">
                  {promise.timeline}
                </td>
                <td className="py-2.5">
                  <Badge
                    className={cn(
                      "border-0 text-[11px] font-medium",
                      config.color
                    )}
                  >
                    {config.label}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
