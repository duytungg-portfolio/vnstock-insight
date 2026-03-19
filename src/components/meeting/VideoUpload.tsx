"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileVideo, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ACCEPTED_EXT = ".mp4, .mov, .webm";

// ─── Types ───────────────────────────────────────────────────────────────────

interface VideoUploadProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VideoUpload({ onFileSelected, disabled }: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Invalid file type. Please upload ${ACCEPTED_EXT}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 100MB.`;
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const err = validateFile(file);
      if (err) {
        setError(err);
        return;
      }

      setSelectedFile(file);

      // Generate video thumbnail
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onFileSelected(file);
    },
    [validateFile, onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [previewUrl]);

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !disabled && inputRef.current?.click()}
              className={cn(
                "relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-all cursor-pointer",
                isDragOver
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border/60 hover:border-primary/40 hover:bg-muted/30",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <motion.div
                animate={isDragOver ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
              </motion.div>

              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {isDragOver ? "Drop your video here" : "Drag & drop your video file"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
                <span>{ACCEPTED_EXT}</span>
                <span className="h-3 w-px bg-border" />
                <span>Max 100MB</span>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_EXT}
                onChange={handleInputChange}
                className="hidden"
                disabled={disabled}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* File preview */}
            <div className="relative rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {previewUrl ? (
                    <video
                      src={previewUrl}
                      className="h-full w-full object-cover"
                      muted
                      preload="metadata"
                      onLoadedMetadata={(e) => {
                        // Seek to 1s for thumbnail
                        (e.target as HTMLVideoElement).currentTime = 1;
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <FileVideo className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>

                {/* Remove button */}
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={clearFile}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </div>
  );
}
