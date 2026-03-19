"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  Youtube,
  Check,
  Loader2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { VideoUpload } from "./VideoUpload";
import { YouTubeInput } from "./YouTubeInput";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
}

type MediaInputState = "idle" | "ready" | "processing" | "done" | "error";

// ─── Processing Steps Tracker ────────────────────────────────────────────────

function ProcessingSteps({ steps }: { steps: ProcessingStep[] }) {
  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-3"
        >
          {/* Status icon */}
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
              step.status === "done" && "bg-emerald-100 dark:bg-emerald-950/40",
              step.status === "active" && "bg-primary/10",
              step.status === "pending" && "bg-muted"
            )}
          >
            <AnimatePresence mode="wait">
              {step.status === "done" ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </motion.div>
              ) : step.status === "active" ? (
                <motion.div
                  key="spinner"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                </motion.div>
              ) : (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Label */}
          <span
            className={cn(
              "text-sm transition-colors",
              step.status === "done" && "text-emerald-600 dark:text-emerald-400",
              step.status === "active" && "text-foreground font-medium",
              step.status === "pending" && "text-muted-foreground"
            )}
          >
            {step.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Upload Progress Bar ─────────────────────────────────────────────────────

function UploadProgress({
  progress,
  onCancel,
}: {
  progress: number;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Uploading...</span>
        <div className="flex items-center gap-3">
          <span className="text-foreground font-medium tabular-nums">
            {Math.round(progress)}%
          </span>
          <Button
            variant="ghost"
            size="xs"
            onClick={onCancel}
            className="text-muted-foreground hover:text-destructive"
          >
            Cancel
          </Button>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function MediaInput() {
  const [tab, setTab] = useState<"upload" | "youtube">("upload");
  const [state, setState] = useState<MediaInputState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const [steps, setSteps] = useState<ProcessingStep[]>([]);

  const getProcessingSteps = useCallback(
    (isUpload: boolean): ProcessingStep[] => [
      ...(isUpload
        ? [
            {
              id: "upload",
              label: "Uploading video...",
              status: "pending" as const,
            },
          ]
        : []),
      {
        id: "transcript",
        label: "Extracting audio & transcript...",
        status: "pending",
      },
      {
        id: "analyze",
        label: "Analyzing with AI...",
        status: "pending",
      },
      {
        id: "report",
        label: "Generating report...",
        status: "pending",
      },
    ],
    []
  );

  // Advance step status
  const advanceStep = useCallback(
    (stepId: string, status: "active" | "done") => {
      setSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, status } : s))
      );
    },
    []
  );

  // Simulate processing steps (real implementation would use SSE/WebSocket)
  const simulateProcessing = useCallback(
    async (isUpload: boolean, signal: AbortSignal) => {
      const stepIds = isUpload
        ? ["upload", "transcript", "analyze", "report"]
        : ["transcript", "analyze", "report"];
      const delays = isUpload ? [2000, 3000, 4000, 2000] : [3000, 4000, 2000];

      for (let i = 0; i < stepIds.length; i++) {
        if (signal.aborted) return;

        advanceStep(stepIds[i], "active");

        // Simulate upload progress for file upload step
        if (stepIds[i] === "upload") {
          for (let p = 0; p <= 100; p += 5) {
            if (signal.aborted) return;
            setUploadProgress(p);
            await new Promise((r) => setTimeout(r, delays[i] / 20));
          }
        } else {
          await new Promise((r) => setTimeout(r, delays[i]));
        }

        if (signal.aborted) return;
        advanceStep(stepIds[i], "done");
      }

      setState("done");
    },
    [advanceStep]
  );

  // Handle file upload submission
  const handleFileSelected = useCallback((file: File) => {
    setSelectedFile(file);
    setState("ready");
    setErrorMessage(null);
  }, []);

  // Handle YouTube URL submission
  const handleYouTubeSubmit = useCallback(
    (url: string, _videoId: string) => {
      setYoutubeUrl(url);
      setState("ready");
      setErrorMessage(null);

      // Auto-start processing for YouTube
      const controller = new AbortController();
      setAbortController(controller);
      const processingSteps = getProcessingSteps(false);
      setSteps(processingSteps);
      setState("processing");
      simulateProcessing(false, controller.signal).catch(() => {
        setState("error");
        setErrorMessage("Processing failed. Please try again.");
      });
    },
    [getProcessingSteps, simulateProcessing]
  );

  // Start processing (for file upload)
  const handleStartProcessing = useCallback(() => {
    const controller = new AbortController();
    setAbortController(controller);
    const isUpload = tab === "upload";
    const processingSteps = getProcessingSteps(isUpload);
    setSteps(processingSteps);
    setState("processing");
    setUploadProgress(0);

    simulateProcessing(isUpload, controller.signal).catch(() => {
      setState("error");
      setErrorMessage("Processing failed. Please try again.");
    });
  }, [tab, getProcessingSteps, simulateProcessing]);

  // Cancel processing
  const handleCancel = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    setState(selectedFile || youtubeUrl ? "ready" : "idle");
    setSteps([]);
    setUploadProgress(0);
  }, [abortController, selectedFile, youtubeUrl]);

  // Reset everything
  const handleReset = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    setState("idle");
    setSelectedFile(null);
    setYoutubeUrl(null);
    setSteps([]);
    setUploadProgress(0);
    setErrorMessage(null);
  }, [abortController]);

  const isProcessing = state === "processing";

  return (
    <Card className="w-full max-w-2xl mx-auto border-border/60 shadow-sm">
      <CardContent className="p-6">
        <AnimatePresence mode="wait">
          {state === "processing" || state === "done" ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* Processing header */}
              <div className="text-center space-y-1">
                <h3 className="text-lg font-semibold text-foreground">
                  {state === "done"
                    ? "Analysis Complete!"
                    : "Analyzing your meeting..."}
                </h3>
                {state !== "done" && (
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Usually takes 1-2 minutes
                  </p>
                )}
              </div>

              {/* Upload progress bar (only during upload step) */}
              {isProcessing &&
                steps.find((s) => s.id === "upload")?.status === "active" && (
                  <UploadProgress
                    progress={uploadProgress}
                    onCancel={handleCancel}
                  />
                )}

              {/* Processing steps */}
              <ProcessingSteps steps={steps} />

              {/* Actions */}
              <div className="flex items-center justify-center gap-3 pt-2">
                {state === "done" ? (
                  <div className="flex items-center gap-3">
                    <Button onClick={handleReset} variant="outline" size="sm">
                      Analyze another
                    </Button>
                    <Button size="sm">
                      View Report
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="text-muted-foreground"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* Tab switcher */}
              <Tabs
                defaultValue="upload"
                onValueChange={(v) => {
                  setTab(v as "upload" | "youtube");
                  setState("idle");
                  setSelectedFile(null);
                  setYoutubeUrl(null);
                  setErrorMessage(null);
                }}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="upload" className="flex-1 gap-2">
                    <Upload className="h-4 w-4" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="youtube" className="flex-1 gap-2">
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-4">
                  <VideoUpload
                    onFileSelected={handleFileSelected}
                    disabled={isProcessing}
                  />
                </TabsContent>

                <TabsContent value="youtube" className="mt-4">
                  <YouTubeInput
                    onUrlSubmit={handleYouTubeSubmit}
                    disabled={isProcessing}
                  />
                </TabsContent>
              </Tabs>

              {/* Analyze button for file upload */}
              {tab === "upload" && state === "ready" && selectedFile && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <Button onClick={handleStartProcessing} size="lg" className="gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Analyze Meeting
                  </Button>
                </motion.div>
              )}

              {/* Error message */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-destructive text-center"
                  >
                    {errorMessage}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
