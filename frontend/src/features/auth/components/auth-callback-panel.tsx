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

  useEffect(() => {
    if (me.isSuccess && !completed.current) {
      completed.current = true;
      const destination = getReturnPath();
      clearReturnPath();
      void claimPendingAnonymousDraft()
        .catch(() => {
          toast.error("Your saved affordability inputs could not be added yet. They are still saved on this device; retry from onboarding.");
        })
        .finally(() => router.replace(destination));
    }
    if (me.isError && !completed.current) {
      completed.current = true;
      router.replace(ROUTES.login);
    }
  }, [me.isSuccess, me.isError, router]);

  return <p className="text-sm text-muted-foreground">Finishing Google sign-in...</p>;
}
