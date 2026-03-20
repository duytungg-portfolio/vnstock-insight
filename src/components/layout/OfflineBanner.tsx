"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/lib/hooks";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineBanner() {
  const online = useOnlineStatus();

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-amber-500 text-amber-950 overflow-hidden"
        >
          <div className="container mx-auto flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium">
            <WifiOff className="h-3.5 w-3.5" />
            You&apos;re offline — showing cached data where available
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
