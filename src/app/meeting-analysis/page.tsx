"use client";

import { ArrowLeft, Video } from "lucide-react";
import Link from "next/link";
import { MediaInput } from "@/components/meeting/MediaInput";

export default function MeetingAnalysisPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto flex items-center gap-4 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Page title */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Video className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Meeting Analysis
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Upload a meeting recording or paste a YouTube link. We&apos;ll extract
              insights, action items, and key decisions using AI.
            </p>
          </div>

          {/* Media input */}
          <MediaInput />
        </div>
      </main>
    </div>
  );
}
