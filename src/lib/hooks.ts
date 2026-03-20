"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// useDebounce — delays value updates
// ---------------------------------------------------------------------------

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

// ---------------------------------------------------------------------------
// useOnlineStatus — tracks navigator.onLine
// ---------------------------------------------------------------------------

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}

// ---------------------------------------------------------------------------
// useAbortController — auto-cancel in-flight requests
// ---------------------------------------------------------------------------

export function useAbortController() {
  const controllerRef = useRef<AbortController | null>(null);

  const getSignal = useCallback((): AbortSignal => {
    // Abort previous request if any
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    return controller.signal;
  }, []);

  const abort = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return { getSignal, abort };
}

// ---------------------------------------------------------------------------
// useRetryCountdown — countdown timer for rate-limit retries
// ---------------------------------------------------------------------------

export function useRetryCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback((totalSeconds: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecondsLeft(totalSeconds);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const cancel = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setSecondsLeft(0);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { secondsLeft, isCountingDown: secondsLeft > 0, start, cancel };
}

// ---------------------------------------------------------------------------
// useLocalStorageCache — persist data across page reloads
// ---------------------------------------------------------------------------

export function useLocalStorageCache<T>(key: string) {
  const get = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { data, expiresAt } = JSON.parse(raw);
      if (Date.now() > expiresAt) {
        localStorage.removeItem(key);
        return null;
      }
      return data as T;
    } catch {
      return null;
    }
  }, [key]);

  const set = useCallback(
    (data: T, ttlMs: number = 30 * 60 * 1000) => {
      try {
        localStorage.setItem(
          key,
          JSON.stringify({ data, expiresAt: Date.now() + ttlMs })
        );
      } catch {
        // Storage full — ignore
      }
    },
    [key]
  );

  return { get, set };
}
