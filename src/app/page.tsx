"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BarChart3, Video, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function HomePage() {
  const [ticker, setTicker] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = ticker.trim().toUpperCase();
    if (trimmed) {
      router.push(`/dashboard/${trimmed}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6">
      {/* Hero */}
      <motion.div
        className="flex flex-col items-center text-center max-w-2xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1 text-xs">
          <Sparkles className="h-3 w-3" />
          Powered by Gemini AI
        </Badge>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
          VNStock Insight
        </h1>

        <p className="text-muted-foreground text-lg sm:text-xl mb-8 max-w-md">
          AI-powered stock analysis for Vietnamese investors
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.form
        onSubmit={handleSearch}
        className="w-full max-w-xl mb-16"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="ticker-search"
            type="text"
            placeholder="Enter stock ticker (e.g. VCB, FPT, VNM)..."
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="pl-10 pr-28 h-12 text-base"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1.5 top-1/2 -translate-y-1/2"
          >
            Analyze
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to analyze · Covers 1500+ tickers on HOSE, HNX, UPCOM
        </p>
      </motion.form>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
          <Card
            className="group cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => router.push("/dashboard/VCB")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">Smart Dashboard</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Real-time stock data with AI-generated sector metrics and
                investment insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-xs text-primary font-medium inline-flex items-center gap-1 group-hover:underline">
                Try with VCB
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
          <Card
            className="group cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => router.push("/meeting-analysis")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Video className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">Meeting Analyzer</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Upload shareholder meeting videos for AI sentiment analysis, red
                flags, and key commitments.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-xs text-primary font-medium inline-flex items-center gap-1 group-hover:underline">
                Upload video
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        className="mt-16 mb-8 text-center"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={4}
      >
        <p className="text-xs text-muted-foreground">
          Built with Next.js · Powered by Gemini AI · Real-time data from
          TCBS
        </p>
      </motion.footer>
    </div>
  );
}
