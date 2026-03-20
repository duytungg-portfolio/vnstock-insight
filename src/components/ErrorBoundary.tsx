"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Section label shown in the error card */
  section?: string;
  /** Compact renders a smaller inline error */
  compact?: boolean;
  /** Custom fallback component */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[ErrorBoundary${this.props.section ? ` — ${this.props.section}` : ""}]`,
      error,
      info.componentStack
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      if (this.props.compact) {
        return (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="flex-1 min-w-0 truncate">
              {this.props.section
                ? `${this.props.section} failed to load`
                : "Something went wrong"}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={this.handleRetry}
              className="shrink-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        );
      }

      return (
        <Card className="border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <div className="rounded-xl bg-destructive/10 p-3 mb-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="font-semibold text-sm mb-1">
              {this.props.section
                ? `${this.props.section} failed to load`
                : "Something went wrong"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mb-4">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <Button variant="outline" size="sm" onClick={this.handleRetry}>
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
