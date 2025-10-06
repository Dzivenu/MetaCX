"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, Button, Stack, Text, Code } from "@mantine/core";
import { logger } from "@/client/utils/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error with full context
    logger.error("React Error Boundary caught an error", {
      component: "ErrorBoundary",
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        componentStack: errorInfo.componentStack,
      },
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    logger.info("Error boundary reset", { component: "ErrorBoundary" });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert color="red" title="Something went wrong">
          <Stack gap="md">
            <Text>
              An error occurred while rendering this component. This might be
              due to an infinite loop or other React issue.
            </Text>

            {this.state.error && <Code block>{this.state.error.message}</Code>}

            <Button onClick={this.handleReset} variant="outline">
              Try Again
            </Button>

            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <details style={{ whiteSpace: "pre-wrap" }}>
                <summary>Component Stack (Development)</summary>
                <Code block>{this.state.errorInfo.componentStack}</Code>
              </details>
            )}
          </Stack>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Hook to add global error handlers
export function useGlobalErrorHandlers() {
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logger.error("Global JavaScript error", {
        component: "GlobalErrorHandler",
        error: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        },
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error("Unhandled Promise rejection", {
        component: "GlobalErrorHandler",
        error: {
          reason: event.reason,
          stack: event.reason?.stack,
        },
      });
    };

    // Add global error listeners
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);
}
