"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { clearReturnPath, getReturnPath, ROUTES } from "@/constants/api";
import { useMe } from "@/hooks/use-me";
import { claimPendingAnonymousDraft } from "@/services/onboarding-draft";

export function AuthCallbackPanel() {
  const router = useRouter();
  const me = useMe();
  const completed = useRef(false);
  // Guard: ensure navigation only fires after the component is mounted and
  // the Next.js AppRouter action queue is initialized (avoids E668).
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (me.isSuccess && !completed.current) {
      completed.current = true;
      const destination = getReturnPath();
      clearReturnPath();
      // Use requestAnimationFrame to defer navigation until the AppRouter
      // action queue is ready (prevents Next.js 16 E668 race condition).
      requestAnimationFrame(() => {
        if (!isMounted.current) return;
        void claimPendingAnonymousDraft()
          .catch(() => {
            toast.error("Your saved affordability inputs could not be added yet. They are still saved on this device; retry from onboarding.");
          })
          .finally(() => {
            if (isMounted.current) router.replace(destination);
          });
      });
    }
    if (me.isError && !completed.current) {
      completed.current = true;
      requestAnimationFrame(() => {
        if (isMounted.current) router.replace(ROUTES.login);
      });
    }
  }, [me.isSuccess, me.isError, router]);

  return <p className="text-sm text-muted-foreground">Finishing Google sign-in...</p>;
}
