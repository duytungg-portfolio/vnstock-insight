"use client";

import { Sparkles } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AIInsightResult } from "@/lib/gemini";

const sentimentConfig = {
  bullish: {
    label: "Bullish",
    variant: "default" as const,
    className: "bg-emerald-600 text-white",
  },
  bearish: {
    label: "Bearish",
    variant: "destructive" as const,
    className: "",
  },
  neutral: {
    label: "Neutral",
    variant: "secondary" as const,
    className: "",
  },
};

interface AIInsightProps {
  insight: AIInsightResult;
}

export function AIInsight({ insight }: AIInsightProps) {
  const config = sentimentConfig[insight.sentiment];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Insight
        </CardTitle>
        <CardAction>
          <Badge variant={config.variant} className={cn(config.className)}>
            {config.label}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-foreground/90">
          {insight.summary}
        </p>

        {insight.keyPoints.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Key Points
            </p>
            <ul className="space-y-1.5">
              {insight.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {insight.risks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Risks
            </p>
            <ul className="space-y-1.5">
              {insight.risks.map((risk, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
