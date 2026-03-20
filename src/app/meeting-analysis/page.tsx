"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Download,
  Send,
  FileVideo,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Lightbulb,
  HandshakeIcon,
  Users,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PageTransition } from "@/components/layout/PageTransition";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MediaInput } from "@/components/meeting/MediaInput";
import { SpeakerCard } from "@/components/meeting/SpeakerCard";
import { RedFlagCard } from "@/components/meeting/RedFlagCard";
import { PromiseTracker } from "@/components/meeting/PromiseTracker";

import type { MeetingAnalysis } from "@/types/meeting";

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  }),
};

const sectionReveal = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const sentimentMeta = {
  bullish: {
    label: "Bullish",
    icon: TrendingUp,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
  },
  bearish: {
    label: "Bearish",
    icon: TrendingDown,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    ring: "ring-red-500/20",
  },
  neutral: {
    label: "Neutral",
    icon: Minus,
    color: "text-muted-foreground",
    bg: "bg-muted",
    ring: "ring-border",
  },
} as const;

// ---------------------------------------------------------------------------
// Mock data for demo (replace with real API call)
// ---------------------------------------------------------------------------

const MOCK_ANALYSIS: MeetingAnalysis = {
  summaryPoints: [
    "Revenue grew 18% YoY driven by strong retail banking performance",
    "Management acknowledged rising NPL ratio but attributed it to seasonal factors",
    "Digital transformation initiative on track with 2M new mobile users in Q4",
    "Dividend payout ratio to be maintained at 30% despite expansion costs",
    "Plans to open 15 new branches in Southern Vietnam by end of 2026",
  ],
  overallSentiment: "bullish",
  speakers: [
    {
      name: "Nguyen Van Minh",
      role: "CEO",
      sentiment: "optimistic",
      analysis:
        "Projected confidence about growth trajectory. Emphasized digital transformation wins and market expansion plans. Avoided direct questions about competitive pressure from fintech.",
      keyQuotes: [
        "We see tremendous opportunity in the underbanked segments of Southern Vietnam",
        "Our digital banking platform has exceeded all internal targets this quarter",
      ],
    },
    {
      name: "Tran Thi Lan",
      role: "CFO",
      sentiment: "cautious",
      analysis:
        "Provided detailed financial breakdowns but was notably careful when discussing NPL trends. Hedged on margin guidance for next quarter.",
      keyQuotes: [
        "The NPL increase is within our expected range and largely seasonal",
        "We are comfortable with our current capital adequacy ratios",
      ],
    },
    {
      name: "Le Duc Thanh",
      role: "Head of Retail Banking",
      sentiment: "optimistic",
      analysis:
        "Enthusiastic about retail growth metrics. Presented compelling data on customer acquisition costs dropping 22% while lifetime value increased.",
      keyQuotes: [
        "Customer acquisition cost has dropped 22% thanks to our digital-first strategy",
      ],
    },
  ],
  redFlags: [
    {
      flag: "CFO avoided direct answer on margin compression from rising deposit rates",
      severity: "high",
      evidence:
        "When asked about NIM outlook, CFO pivoted to discussing non-interest income growth rather than directly addressing margin trends.",
    },
    {
      flag: "NPL ratio increased 40bps QoQ despite claims of seasonal factors",
      severity: "high",
      evidence:
        "Historical data shows Q4 NPL increases typically range 10-20bps. The 40bps increase is materially higher than seasonal norms.",
    },
    {
      flag: "Branch expansion plan lacks detailed ROI projections",
      severity: "medium",
      evidence:
        "CEO mentioned 15 new branches but no specific target revenue per branch or break-even timeline was discussed.",
    },
    {
      flag: "No mention of regulatory compliance costs for new digital banking rules",
      severity: "low",
      evidence:
        "New SBV regulations effective Q2 2026 will require additional compliance infrastructure. Management did not address the cost impact.",
    },
  ],
  promises: [
    { content: "Maintain 30% dividend payout ratio", timeline: "FY2026", credibility: "high" },
    { content: "Open 15 new branches in Southern Vietnam", timeline: "End of 2026", credibility: "medium" },
    { content: "Reduce NPL ratio back below 2% within two quarters", timeline: "Q2 2026", credibility: "low" },
    { content: "Launch wealth management platform for HNW clients", timeline: "Q3 2026", credibility: "medium" },
  ],
  investmentImplications:
    "Overall, the meeting painted a cautiously positive picture. Revenue growth is strong and digital transformation is showing real results. However, the NPL trend deserves close monitoring — the 40bps quarterly increase is above historical norms and management's explanation of seasonal factors is not fully convincing. The aggressive branch expansion while maintaining dividend payouts may strain capital buffers if credit quality deteriorates further. Recommend maintaining position with a close watch on Q1 2026 NPL data.",
  themes: [
    "Digital Transformation",
    "Branch Expansion",
    "NPL Risk",
    "Dividend Policy",
    "Retail Banking Growth",
    "Southern Vietnam",
  ],
};

// ---------------------------------------------------------------------------
// Progress steps
// ---------------------------------------------------------------------------

const ANALYSIS_STEPS = [
  { key: "upload", label: "Uploading media" },
  { key: "transcribe", label: "Transcribing audio" },
  { key: "speakers", label: "Identifying speakers" },
  { key: "analyze", label: "Analyzing sentiment & red flags" },
  { key: "generate", label: "Generating insights" },
] as const;

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

type PageState = "empty" | "loading" | "error" | "results";

export default function MeetingAnalysisPage() {
  const [state, setState] = useState<PageState>("empty");
  const [analysis, setAnalysis] = useState<MeetingAnalysis | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAnalyze = useCallback(() => {
    setState("loading");
    setCurrentStep(0);
    setErrorMessage(null);

    // Step-by-step progress simulation — replace with real API
    const stepDurations = [500, 800, 600, 1200, 900];
    let stepIndex = 0;

    function nextStep() {
      stepIndex++;
      if (stepIndex < ANALYSIS_STEPS.length) {
        setCurrentStep(stepIndex);
        setTimeout(nextStep, stepDurations[stepIndex]);
      } else {
        // Done
        setAnalysis(MOCK_ANALYSIS);
        setState("results");
        toast.success("Analysis complete", {
          description: "Meeting analysis is ready to review.",
        });
      }
    }

    setTimeout(nextStep, stepDurations[0]);
  }, []);

  const handleError = useCallback((message: string) => {
    setState("error");
    setErrorMessage(message);
    toast.error("Analysis failed", { description: message });
  }, []);

  const handleFollowUp = useCallback(() => {
    if (!followUp.trim()) return;
    setFollowUpLoading(true);
    setFollowUpAnswer("");
    setTimeout(() => {
      setFollowUpAnswer(
        "Based on the meeting context, the NPL increase is a significant concern. Historical data for this bank shows seasonal NPL increases typically peak at 15-20bps in Q4, making the reported 40bps increase approximately 2x the normal seasonal range. This warrants closer scrutiny of the loan book composition, particularly in the SME and consumer credit segments that saw aggressive growth in H1."
      );
      setFollowUpLoading(false);
    }, 2000);
  }, [followUp]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied", { description: "Share link copied to clipboard." });
  }, []);

  const handleExport = useCallback(() => {
    toast.info("Export coming soon", { description: "PDF export will be available in a future update." });
  }, []);

  return (
    <PageTransition>
      <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <Breadcrumbs items={[{ label: "Meeting Analyzer" }]} />

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold tracking-tight">
            Meeting Analyzer
          </h1>
          {state === "results" && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5">
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExport} className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Media Input */}
          <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <MediaInput
              onFileSelect={handleAnalyze}
              onUrlSubmit={handleAnalyze}
              disabled={state === "loading"}
            />
          </motion.section>

          {/* Loading: step-by-step progress */}
          {state === "loading" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <ProgressSteps currentStep={currentStep} />
              <LoadingSkeleton />
            </motion.div>
          )}

          {/* Error State */}
          {state === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center py-12 text-center"
            >
              <div className="rounded-2xl bg-destructive/10 p-5 mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold mb-1">Analysis failed</h2>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                {errorMessage ?? "Something went wrong. Please try again."}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setState("empty");
                  setErrorMessage(null);
                }}
              >
                Try again
              </Button>
            </motion.div>
          )}

          {/* Empty State */}
          {state === "empty" && (
            <motion.div
              className="flex flex-col items-center justify-center py-20 text-center"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
            >
              <div className="rounded-2xl bg-muted/50 p-6 mb-6">
                <FileVideo className="h-12 w-12 text-muted-foreground/40" />
              </div>
              <h2 className="text-lg font-semibold mb-1">
                Upload a meeting video to get started
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Upload a shareholder meeting recording or paste a YouTube link.
                Our AI will analyze speaker sentiment, red flags, and key
                commitments.
              </p>
            </motion.div>
          )}

          {/* Results */}
          {state === "results" && analysis && (
            <>
              {/* Analysis header — matches wireframe: "VCB — ĐHCĐ 2025" + badge */}
              <motion.div
                className="flex items-center gap-2 flex-wrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className="text-base font-semibold">
                  VCB &mdash; ĐHCĐ 2025
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0 text-[11px]">
                  Analysis complete
                </Badge>
              </motion.div>
              <ResultsView
                analysis={analysis}
                followUp={followUp}
                followUpAnswer={followUpAnswer}
                followUpLoading={followUpLoading}
                onFollowUpChange={setFollowUp}
                onFollowUpSubmit={handleFollowUp}
              />
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

// ---------------------------------------------------------------------------
// Progress Steps indicator
// ---------------------------------------------------------------------------

function ProgressSteps({ currentStep }: { currentStep: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="space-y-2">
          {ANALYSIS_STEPS.map((step, i) => {
            const isComplete = i < currentStep;
            const isCurrent = i === currentStep;
            return (
              <motion.div
                key={step.key}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/20 shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    isComplete
                      ? "text-muted-foreground line-through"
                      : isCurrent
                        ? "text-foreground font-medium"
                        : "text-muted-foreground/50"
                  }`}
                >
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-3">
        <Skeleton className="h-5 w-44" />
        <Card>
          <CardContent className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results view (with error boundaries per section)
// ---------------------------------------------------------------------------

interface ResultsViewProps {
  analysis: MeetingAnalysis;
  followUp: string;
  followUpAnswer: string;
  followUpLoading: boolean;
  onFollowUpChange: (v: string) => void;
  onFollowUpSubmit: () => void;
}

function ResultsView({
  analysis,
  followUp,
  followUpAnswer,
  followUpLoading,
  onFollowUpChange,
  onFollowUpSubmit,
}: ResultsViewProps) {
  const sentiment = sentimentMeta[analysis.overallSentiment];
  const SentimentIcon = sentiment.icon;

  return (
    <div className="space-y-8">
      {/* Section A — Executive Summary (wireframe: bg card, no border) */}
      <ErrorBoundary section="Executive Summary" compact>
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={sectionReveal}
        >
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground mb-2">
              Executive summary
            </p>
            <p className="text-sm leading-relaxed">
              {analysis.summaryPoints.join(" ")}
            </p>
          </div>
        </motion.section>
      </ErrorBoundary>

      {/* Section B — Red Flags */}
      {analysis.redFlags.length > 0 && (
        <ErrorBoundary section="Red Flags" compact>
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={sectionReveal}
          >
            <SectionHeading
              icon={({ className }: { className?: string }) => (
                <span className={className}>&#9888;</span>
              )}
              title="Red Flags"
            />
            <RedFlagCard flags={analysis.redFlags} />
          </motion.section>
        </ErrorBoundary>
      )}

      {/* Section C — Speaker Sentiment (wireframe: label + 2-col grid) */}
      <ErrorBoundary section="Speaker Sentiment" compact>
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={sectionReveal}
        >
          <p className="text-xs text-muted-foreground mb-2">
            Speaker sentiment
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {analysis.speakers.map((speaker, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <SpeakerCard speaker={speaker} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      </ErrorBoundary>

      {/* Section D — Key Commitments (wireframe: compact bg card) */}
      {analysis.promises.length > 0 && (
        <ErrorBoundary section="Key Commitments" compact>
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={sectionReveal}
          >
            <p className="text-xs text-muted-foreground mb-2">
              Key commitments
            </p>
            <div className="rounded-lg bg-muted/50 p-3">
              <PromiseTracker promises={analysis.promises} />
            </div>
          </motion.section>
        </ErrorBoundary>
      )}

      {/* Section E — Investment Implications */}
      <ErrorBoundary section="Investment Implications" compact>
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={sectionReveal}
        >
          <SectionHeading icon={Lightbulb} title="Investment Implications" />
          <Card>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">
                {analysis.investmentImplications}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.themes.map((theme, i) => (
                  <motion.span
                    key={theme}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                  >
                    <Badge variant="secondary" className="text-xs">
                      {theme}
                    </Badge>
                  </motion.span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </ErrorBoundary>

      {/* Follow-up question */}
      <ErrorBoundary section="Follow-up" compact>
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={sectionReveal}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ask a follow-up question</CardTitle>
              <CardDescription>
                Ask anything about the meeting — the AI has full context of the
                analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onFollowUpSubmit();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="e.g. How does the NPL increase compare to industry averages?"
                  value={followUp}
                  onChange={(e) => onFollowUpChange(e.target.value)}
                  className="h-9"
                  disabled={followUpLoading}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!followUp.trim() || followUpLoading}
                >
                  {followUpLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              </form>
              {followUpLoading && (
                <TypingIndicator />
              )}
              <AnimatePresence>
                {followUpAnswer && (
                  <motion.div
                    className="rounded-lg bg-muted/50 p-3 text-sm leading-relaxed"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {followUpAnswer}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.section>
      </ErrorBoundary>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Typing indicator animation
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      AI is thinking...
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section heading helper
// ---------------------------------------------------------------------------

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-sm font-semibold">{title}</h2>
    </div>
  );
}
