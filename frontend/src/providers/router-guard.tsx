"use client";

import { useEffect, type ReactNode } from "react";

// The error message thrown by Next.js 16 App Router (E668) when an HMR
// refresh or router action races against the router initialization phase.
const ROUTER_INIT_ERROR =
  "Internal Next.js error: Router action dispatched before initialization.";

/**
 * RouterGuard — suppresses the transient Next.js 16 (Turbopack) E668 error:
 *   "Internal Next.js error: Router action dispatched before initialization."
 *
 * Root cause: When Turbopack sends an HMR update (Fast Refresh), `hot-reloader-app.js`
 * calls `publicAppRouterInstance.hmrRefresh()` which eventually calls
 * `dispatchAppRouterAction`. If this fires while `<AppRouter>` is still mounting
 * (i.e. `dispatch === null` in `use-action-queue.js`), error E668 is thrown.
 *
 * In development this manifests as an error overlay; in production it cannot
 * occur because there is no HMR system. This provider captures the window-level
 * `error` and `unhandledrejection` events and swallows the E668 race safely,
 * allowing normal page hydration to proceed.
 */
export function RouterGuard({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    function isRouterInitError(message: string): boolean {
      return (
        typeof message === "string" &&
        (message.includes(ROUTER_INIT_ERROR) ||
          message.includes("E668") ||
          message.includes("Router action dispatched before initialization"))
      );
    }

    /**
     * Suppress synchronous E668 errors thrown into the window error boundary.
     * `event.preventDefault()` stops the browser from logging them and also
     * prevents the Next.js Turbopack overlay from showing the red error screen.
     */
    const handleError = (event: ErrorEvent) => {
      if (isRouterInitError(event?.message ?? "")) {
        event.preventDefault();
        // The router will be ready on the next HMR or interaction — no action needed.
        return false;
      }
    };

    /**
     * Suppress the same error when it surfaces as an unhandled promise rejection
     * (which happens when the error is thrown inside `startTransition` in
     * `app-router-instance.js`).
     */
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      const message =
        typeof reason === "string"
          ? reason
          : reason instanceof Error
          ? reason.message
          : "";
      if (isRouterInitError(message)) {
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  return <>{children}</>;
}
