"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex flex-col items-center"
      >
        <div className="rounded-2xl bg-muted/50 p-6 mb-6">
          <TrendingDown className="h-12 w-12 text-muted-foreground/40" />
        </div>

        <h1 className="text-6xl font-bold tracking-tight mb-2">404</h1>
        <h2 className="text-xl font-semibold mb-2">Page not found</h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-8">
          This ticker doesn&apos;t seem to exist. Double-check the URL or head
          back home to search for a stock.
        </p>

        <Link href="/">
          <Button>
            <Home className="mr-2 h-4 w-4" />
            Go home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
