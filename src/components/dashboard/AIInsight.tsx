"use client";

import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AIInsightProps {
  insight: string;
  keyRisk: string;
  keyOpportunity: string;
  actionTags: string[];
}

export function AIInsight({
  insight,
  keyRisk,
  keyOpportunity,
  actionTags,
}: AIInsightProps) {
  return (
    <div className="space-y-4">
      {/* Main insight */}
      <motion.p
        className="text-sm leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {insight}
      </motion.p>

      {/* Risk & Opportunity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.div
          className="flex gap-2.5 rounded-lg border border-red-500/20 bg-red-500/5 p-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-medium text-red-600 dark:text-red-400 mb-0.5">
              Rủi ro chính
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {keyRisk}
            </p>
          </div>
        </motion.div>

        <motion.div
          className="flex gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <Lightbulb className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mb-0.5">
              Cơ hội chính
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {keyOpportunity}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Action Tags */}
      {actionTags.length > 0 && (
        <motion.div
          className="flex items-center gap-2 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.3 }}
        >
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          {actionTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </motion.div>
      )}
    </div>
  );
}
