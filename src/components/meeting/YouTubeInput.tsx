"use client";

import { useState, useCallback } from "react";
import {
  Link,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const YT_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/;

interface YouTubeInputProps {
  onUrlSubmit: (url: string) => void;
  disabled?: boolean;
}

type ValidationState = "idle" | "validating" | "valid" | "error";

export function YouTubeInput({ onUrlSubmit, disabled }: YouTubeInputProps) {
  const [url, setUrl] = useState("");
  const [validation, setValidation] = useState<ValidationState>("idle");
  const [error, setError] = useState<string | null>(null);

  const validateUrl = useCallback(
    (value: string) => {
      const match = value.match(YT_REGEX);
      if (!match) {
        if (value.includes("youtube") || value.includes("youtu.be")) {
          setError("Invalid YouTube URL format. Check the link and try again.");
          setValidation("error");
        } else {
          setError(null);
          setValidation("idle");
        }
        return;
      }

      setValidation("valid");
      setError(null);
    },
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    validateUrl(value);
  };

  const handleSubmit = useCallback(() => {
    const match = url.match(YT_REGEX);
    if (!match) {
      setError("Please enter a valid YouTube URL.");
      setValidation("error");
      return;
    }
    onUrlSubmit(url);
  }, [url, onUrlSubmit]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Paste a YouTube URL (e.g. https://youtube.com/watch?v=...)"
            value={url}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className={`pl-10 h-11 ${
              validation === "error"
                ? "border-destructive/50 focus-visible:ring-destructive/20"
                : validation === "valid"
                  ? "border-emerald-500/50 focus-visible:ring-emerald-500/20"
                  : ""
            }`}
            disabled={disabled}
          />
          {validation === "valid" && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
          )}
          {validation === "validating" && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={disabled || validation !== "valid"}
          className="h-11 shrink-0"
        >
          Analyze
        </Button>
      </div>

      {/* Error messages */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
