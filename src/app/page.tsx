"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  BarChart3,
  Video,
  ArrowRight,
  Sparkles,
  Zap,
  Database,
  Globe,
  Loader2,
  SearchX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { CountUp } from "@/components/layout/CountUp";
import { PageTransition } from "@/components/layout/PageTransition";
import { useDebounce, useAbortController } from "@/lib/hooks";

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  }),
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardHover = {
  rest: { scale: 1, boxShadow: "0 0 0 rgba(0,0,0,0)" },
  hover: {
    scale: 1.02,
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

// ---------------------------------------------------------------------------
// Search result type
// ---------------------------------------------------------------------------

interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const [ticker, setTicker] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedTicker = useDebounce(ticker, 300);
  const { getSignal } = useAbortController();

  // Fetch search results on debounced input change
  useEffect(() => {
    const trimmed = debouncedTicker.trim();
    if (trimmed.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    let cancelled = false;

    async function search() {
      setSearching(true);
      try {
        const signal = getSignal();
        const res = await fetch(
          `/api/stock/search?q=${encodeURIComponent(trimmed)}`,
          { signal }
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        if (!cancelled) {
          setResults(data.results ?? []);
          setShowDropdown(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }

    search();
    return () => {
      cancelled = true;
    };
  }, [debouncedTicker, getSignal]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navigateToTicker = useCallback(
    (t: string) => {
      const upper = t.trim().toUpperCase();
      if (upper) {
        setShowDropdown(false);
        router.push(`/dashboard/${upper}`);
      }
    },
    [router]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && results[selectedIndex]) {
      navigateToTicker(results[selectedIndex].ticker);
    } else {
      navigateToTicker(ticker);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col">
        {/* ============================================================ */}
        {/* Hero Section                                                  */}
        {/* ============================================================ */}
        <section className="relative flex flex-col items-center justify-center px-4 pt-20 pb-16 sm:pt-28 sm:pb-24 overflow-hidden">
          {/* Gradient background blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute top-20 -right-40 h-[300px] w-[400px] rounded-full bg-chart-1/10 blur-3xl" />
            <div className="absolute top-40 -left-40 h-[300px] w-[400px] rounded-full bg-chart-3/10 blur-3xl" />
          </div>

          <motion.div
            className="flex flex-col items-center text-center max-w-2xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <Badge
              variant="secondary"
              className="mb-5 gap-1.5 px-3 py-1 text-xs"
            >
              <Sparkles className="h-3 w-3" />
              Powered by Gemini AI
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text">
              VNStock Insight
            </h1>

            <p className="text-muted-foreground text-lg sm:text-xl mb-10 max-w-lg leading-relaxed">
              AI-powered stock analysis for Vietnamese investors
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.form
            onSubmit={handleSearch}
            className="w-full max-w-xl mb-4"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <div className="relative group" ref={dropdownRef}>
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/20 via-chart-1/20 to-chart-3/20 opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-500" />
              <div className="relative flex items-center">
                {searching ? (
                  <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                ) : (
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  ref={inputRef}
                  id="ticker-search"
                  type="text"
                  placeholder="Enter stock ticker (e.g. VCB, FPT, VNM)..."
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  onFocus={() => {
                    if (results.length > 0) setShowDropdown(true);
                  }}
                  onKeyDown={handleKeyDown}
                  className="pl-11 pr-28 h-12 text-base rounded-xl border-border/60 bg-background"
                  autoComplete="off"
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

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {showDropdown && ticker.trim().length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{
                      type: "spring" as const,
                      stiffness: 400,
                      damping: 25,
                    }}
                    className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border bg-popover shadow-lg overflow-hidden"
                  >
                    {results.length > 0 ? (
                      <ul className="py-1">
                        {results.map((r, i) => (
                          <li key={r.ticker}>
                            <button
                              type="button"
                              onClick={() => navigateToTicker(r.ticker)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                                i === selectedIndex
                                  ? "bg-muted"
                                  : "hover:bg-muted/50"
                              }`}
                            >
                              <span className="font-semibold text-foreground min-w-[48px]">
                                {r.ticker}
                              </span>
                              <span className="flex-1 text-muted-foreground truncate">
                                {r.name}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-[10px] shrink-0"
                              >
                                {r.exchange}
                              </Badge>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : !searching ? (
                      <div className="flex flex-col items-center gap-1 py-6 text-center">
                        <SearchX className="h-5 w-5 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground">
                          No tickers found for &ldquo;{ticker.trim()}&rdquo;
                        </p>
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="text-xs text-muted-foreground mt-2.5 text-center">
              Press Enter to analyze · Covers 1 500+ tickers on HOSE, HNX,
              UPCOM
            </p>
          </motion.form>
        </section>

        {/* ============================================================ */}
        {/* Feature Cards                                                 */}
        {/* ============================================================ */}
        <section className="px-4 pb-16 sm:pb-20">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {/* Smart Dashboard Card */}
            <motion.div variants={fadeUp} custom={2}>
              <motion.div
                initial="rest"
                whileHover="hover"
                variants={cardHover}
              >
                <Card
                  className="group cursor-pointer h-full transition-colors hover:border-primary/30"
                  onClick={() => router.push("/dashboard/VCB")}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="p-2.5 rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">
                        Smart Dashboard
                      </CardTitle>
                    </div>
                    <CardDescription className="text-sm leading-relaxed">
                      Real-time stock data with AI-generated sector metrics and
                      investment insights tailored to Vietnamese markets.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <span className="text-xs text-primary font-medium inline-flex items-center gap-1 group-hover:underline">
                      Try with VCB
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Meeting Analyzer Card */}
            <motion.div variants={fadeUp} custom={3}>
              <motion.div
                initial="rest"
                whileHover="hover"
                variants={cardHover}
              >
                <Card
                  className="group cursor-pointer h-full transition-colors hover:border-primary/30"
                  onClick={() => router.push("/meeting-analysis")}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="p-2.5 rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                        <Video className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">
                        Meeting Analyzer
                      </CardTitle>
                    </div>
                    <CardDescription className="text-sm leading-relaxed">
                      Upload shareholder meeting videos for AI sentiment
                      analysis, red flags, and key commitment tracking.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <span className="text-xs text-primary font-medium inline-flex items-center gap-1 group-hover:underline">
                      Upload video
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* ============================================================ */}
        {/* Stats Section                                                 */}
        {/* ============================================================ */}
        <section className="border-t bg-muted/30 px-4 py-16 sm:py-20">
          <motion.div
            className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0}>
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-xl bg-primary/10 mb-1">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl font-bold tracking-tight">
                  <CountUp end={1500} suffix="+" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Tickers covered
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={1}>
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-xl bg-primary/10 mb-1">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl font-bold tracking-tight">
                  Gemini AI
                </div>
                <p className="text-sm text-muted-foreground">
                  Powered by Google
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={2}>
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-xl bg-primary/10 mb-1">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl font-bold tracking-tight">
                  Real-time
                </div>
                <p className="text-sm text-muted-foreground">
                  Market data from TCBS
                </p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ============================================================ */}
        {/* Footer                                                        */}
        {/* ============================================================ */}
        <footer className="border-t px-4 py-8">
          <div className="max-w-3xl mx-auto text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Built by Duy Tu &middot; Portfolio project &middot; Powered by
              Gemini Pro
            </p>
            <p className="text-xs text-muted-foreground/60">
              Data provided by TCBS. Not financial advice.
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
