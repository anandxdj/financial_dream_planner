"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clearReturnPath, getReturnPath, QUERY_KEYS, ROUTES, rememberReturnPath } from "@/constants/api";
import { getApiErrorMessage } from "@/lib/api";
import { register } from "@/services/auth.service";
import type { RegisterValues } from "@/schemas/auth";
import { claimPendingAnonymousDraft } from "@/services/onboarding-draft";

export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: RegisterValues) => register(values),
    onMutate: () => rememberReturnPath(new URLSearchParams(window.location.search).get("next")),
    onSuccess: async (data) => {
      if (data.message) {
        toast.success(data.message);
        router.push(ROUTES.login);
        return;
      }
      queryClient.setQueryData(QUERY_KEYS.me, data.user);
      await claimPendingAnonymousDraft().catch(() => {
        toast.error("Your saved affordability inputs could not be added yet. They are still saved on this device; retry after signing in.");
      });
      toast.success("Account created");
      const destination = getReturnPath();
      clearReturnPath();
      router.push(destination);
      router.refresh();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to create account"));
    },
  });
}
