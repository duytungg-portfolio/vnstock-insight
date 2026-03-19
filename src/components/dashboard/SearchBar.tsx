"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
}

// ─── localStorage helpers ───────────────────────────────────────────────────

const RECENT_KEY = "vnstock-recent-searches";
const MAX_RECENT = 5;

function getRecentSearches(): SearchResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as SearchResult[]).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(item: SearchResult) {
  const recent = getRecentSearches().filter((r) => r.ticker !== item.ticker);
  recent.unshift(item);
  localStorage.setItem(
    RECENT_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT))
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/stock/search?q=${encodeURIComponent(trimmed)}`
        );
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Items to display in dropdown
  const displayItems: (SearchResult & { isRecent?: boolean })[] =
    query.trim().length > 0
      ? results
      : recentSearches.map((r) => ({ ...r, isRecent: true }));

  const hasItems = displayItems.length > 0;

  // Navigate to ticker
  const selectItem = useCallback(
    (item: SearchResult) => {
      addRecentSearch(item);
      setRecentSearches(getRecentSearches());
      setQuery("");
      setIsOpen(false);
      router.push(`/dashboard/${item.ticker}`);
    },
    [router]
  );

  // Handle direct enter with typed text
  const handleDirectSubmit = useCallback(() => {
    const trimmed = query.trim().toUpperCase();
    if (trimmed) {
      addRecentSearch({ ticker: trimmed, name: trimmed, exchange: "HOSE" });
      setRecentSearches(getRecentSearches());
      setQuery("");
      setIsOpen(false);
      router.push(`/dashboard/${trimmed}`);
    }
  }, [query, router]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < displayItems.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : displayItems.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < displayItems.length) {
          selectItem(displayItems[activeIndex]);
        } else {
          handleDirectSubmit();
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Reset active index when items change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results, query]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full max-w-[600px] mx-auto", className)}
    >
      {/* Search input with focus animation */}
      <motion.div
        initial={false}
        animate={isOpen ? { scale: 1.02 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search stock ticker (e.g. VCB, FPT, VNM)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-4 h-12 text-base rounded-xl border-border/60 bg-background shadow-sm focus-visible:shadow-md transition-shadow"
            autoComplete="off"
          />
        </div>
      </motion.div>

      {/* Hint text */}
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Press Enter to analyze · Covers 1500+ tickers on HOSE, HNX, UPCOM
      </p>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (hasItems || isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-[calc(100%-1.5rem)] left-0 right-0 mt-1 rounded-xl border border-border/60 bg-popover shadow-lg overflow-hidden"
          >
            {/* Recent searches header */}
            {query.trim().length === 0 && recentSearches.length > 0 && (
              <div className="px-3 pt-2.5 pb-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Recent searches
                </span>
              </div>
            )}

            {/* Loading skeletons */}
            {isLoading && query.trim().length > 0 && (
              <div className="p-2 space-y-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-3 w-12 ml-auto" />
                  </div>
                ))}
              </div>
            )}

            {/* Results list */}
            {!isLoading && (
              <div className="p-1.5 max-h-[280px] overflow-y-auto" role="listbox">
                {displayItems.map((item, index) => (
                  <button
                    key={item.ticker}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer",
                      index === activeIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(e) => {
                      e.preventDefault(); // prevent input blur
                      selectItem(item);
                    }}
                  >
                    {item.isRecent ? (
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <span className="text-sm font-semibold text-foreground w-14 shrink-0">
                        {item.ticker}
                      </span>
                    )}

                    {item.isRecent && (
                      <span className="text-sm font-semibold text-foreground w-14 shrink-0">
                        {item.ticker}
                      </span>
                    )}

                    <span className="text-sm text-muted-foreground truncate flex-1">
                      {item.name !== item.ticker ? item.name : ""}
                    </span>

                    <span className="text-xs text-muted-foreground/60 shrink-0">
                      {item.exchange}
                    </span>

                    {index === activeIndex && (
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {!isLoading &&
              query.trim().length > 0 &&
              results.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No tickers found for &ldquo;{query.trim()}&rdquo;
                  <br />
                  <span className="text-xs">
                    Press Enter to search anyway
                  </span>
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
