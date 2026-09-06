"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * useSafeNav — safe navigation hook that defers router actions until after
 * the component is mounted and the Next.js 16 AppRouter action queue is ready.
 *
 * This avoids the E668 error "Router action dispatched before initialization"
 * that occurs when `router.push` or `router.replace` is called too early
 * (e.g. in immediate useEffect callbacks during initial hydration).
 *
 * Usage:
 *   const { push, replace } = useSafeNav();
 *   push("/dashboard");      // deferred until mounted
 *   replace("/login");       // same
 */
export function useSafeNav() {
  const router = useRouter();
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const push = useCallback(
    (href: string, options?: Parameters<typeof router.push>[1]) => {
      if (isMounted.current) {
        router.push(href, options);
      } else {
        // Defer until after the router action queue is ready
        requestAnimationFrame(() => {
          if (isMounted.current) router.push(href, options);
        });
      }
    },
    [router]
  );

  const replace = useCallback(
    (href: string, options?: Parameters<typeof router.replace>[1]) => {
      if (isMounted.current) {
        router.replace(href, options);
      } else {
        requestAnimationFrame(() => {
          if (isMounted.current) router.replace(href, options);
        });
      }
    },
    [router]
  );

  return { push, replace, router };
}
