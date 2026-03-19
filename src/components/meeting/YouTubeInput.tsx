"use client";

import { useState, useCallback } from "react";
import { Youtube, AlertCircle, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const YT_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

function extractVideoId(url: string): string | null {
  const match = url.match(YT_REGEX);
  return match ? match[1] : null;
}

function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface YouTubeInputProps {
  onUrlSubmit: (url: string, videoId: string) => void;
  disabled?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function YouTubeInput({ onUrlSubmit, disabled }: YouTubeInputProps) {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
    setError(null);

    if (!value.trim()) {
      setVideoId(null);
      return;
    }

    const id = extractVideoId(value.trim());
    if (id) {
      setVideoId(id);
    } else if (value.trim().length > 10) {
      setVideoId(null);
      setError("Invalid YouTube URL. Please use a youtube.com or youtu.be link.");
    } else {
      setVideoId(null);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!videoId) {
      setError("Please enter a valid YouTube URL.");
      return;
    }
    onUrlSubmit(url.trim(), videoId);
  }, [videoId, url, onUrlSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="space-y-4">
      {/* URL input */}
      <div className="relative">
        <Youtube className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="url"
          placeholder="Paste YouTube URL (e.g. youtube.com/watch?v=...)"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "pl-10 pr-4 h-12 text-base rounded-xl border-border/60 bg-background shadow-sm focus-visible:shadow-md transition-shadow",
            error && "border-destructive/50 focus-visible:border-destructive"
          )}
          autoComplete="off"
        />
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thumbnail preview */}
      <AnimatePresence>
        {videoId && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-border/60 bg-muted/20 p-4"
          >
            <div className="flex items-start gap-4">
              {/* Thumbnail */}
              <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getYouTubeThumbnail(videoId)}
                  alt="Video thumbnail"
                  className="h-full w-full object-cover"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center">
                    <svg className="h-4 w-4 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  YouTube Video
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {url}
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5"
                >
                  Open in YouTube
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint */}
      <p className="text-xs text-muted-foreground text-center">
        Supports youtube.com and youtu.be links
      </p>
    </div>
  );
}
