"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Speaker } from "@/types/meeting";

const sentimentConfig = {
  optimistic: { label: "Optimistic", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  cautious: { label: "Cautious", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  defensive: { label: "Defensive", color: "bg-orange-500/15 text-orange-700 dark:text-orange-400" },
  evasive: { label: "Evasive", color: "bg-red-500/15 text-red-700 dark:text-red-400" },
} as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface SpeakerCardProps {
  speaker: Speaker;
}

export function SpeakerCard({ speaker }: SpeakerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = sentimentConfig[speaker.sentiment];

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(speaker.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{speaker.name}</span>
              <Badge
                className={cn(
                  "border-0 text-[11px] font-medium",
                  config.color
                )}
              >
                {config.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{speaker.role}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {speaker.analysis}
        </p>

        {speaker.keyQuotes.length > 0 && (
          <div>
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
              {expanded ? "Hide" : "Show"} quotes ({speaker.keyQuotes.length})
            </button>

            {expanded && (
              <div className="mt-2 space-y-2">
                {speaker.keyQuotes.map((quote, i) => (
                  <blockquote
                    key={i}
                    className="border-l-2 border-muted-foreground/20 pl-3 text-xs text-muted-foreground italic"
                  >
                    &ldquo;{quote}&rdquo;
                  </blockquote>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
