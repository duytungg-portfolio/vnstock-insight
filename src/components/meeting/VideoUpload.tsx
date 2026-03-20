"use client";

import { useCallback, useState } from "react";
import { Upload, FileVideo, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_DURATION_MINUTES = 120;
const TRUNCATE_MINUTES = 60;
const MAX_SIZE_MB = 500;

interface VideoUploadProps {
  onFileSelect: (file: File, truncate?: boolean) => void;
  disabled?: boolean;
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Could not read video metadata"));
    };
    video.src = URL.createObjectURL(file);
  });
}

export function VideoUpload({ onFileSelect, disabled }: VideoUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [showTruncatePrompt, setShowTruncatePrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSelect = useCallback(
    async (file: File) => {
      setError(null);
      setWarning(null);
      setShowTruncatePrompt(false);

      // Validate file type
      if (!file.type.startsWith("video/")) {
        setError("Please select a video file (MP4, WebM, or MOV).");
        return;
      }

      // Validate file size
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > MAX_SIZE_MB) {
        setError(
          `File is too large (${sizeMB.toFixed(0)} MB). Maximum size is ${MAX_SIZE_MB} MB.`
        );
        return;
      }

      setSelectedFile(file);

      // Check duration
      try {
        const durationSec = await getVideoDuration(file);
        const durationMin = durationSec / 60;

        if (durationMin > MAX_DURATION_MINUTES) {
          setShowTruncatePrompt(true);
          setWarning(
            `This video is ${Math.round(durationMin)} minutes long (over ${MAX_DURATION_MINUTES} min). We can analyze the first ${TRUNCATE_MINUTES} minutes.`
          );
          return;
        }

        onFileSelect(file);
      } catch {
        // Can't read metadata — proceed anyway
        setWarning("Could not determine video length. Proceeding with upload.");
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const clearFile = () => {
    setSelectedFile(null);
    setWarning(null);
    setError(null);
    setShowTruncatePrompt(false);
  };

  const handleTruncateAccept = () => {
    if (selectedFile) {
      setShowTruncatePrompt(false);
      onFileSelect(selectedFile, true);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "pointer-events-none opacity-50",
          error && "border-destructive/50"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <FileVideo className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-none">
              {selectedFile.name}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={clearFile}
              className="ml-1 shrink-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium mb-1">
              Drop a video file here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports MP4, WebM, MOV (max {MAX_SIZE_MB}MB)
            </p>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileInput}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Warning + truncate prompt */}
      {warning && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <p>{warning}</p>
            {showTruncatePrompt && (
              <div className="flex gap-2">
                <Button size="xs" onClick={handleTruncateAccept}>
                  Analyze first {TRUNCATE_MINUTES} min
                </Button>
                <Button size="xs" variant="ghost" onClick={clearFile}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
