"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clearReturnPath, getReturnPath, QUERY_KEYS, rememberReturnPath } from "@/constants/api";
import { getApiErrorMessage } from "@/lib/api";
import { login } from "@/services/auth.service";
import type { LoginValues } from "@/schemas/auth";
import { claimPendingAnonymousDraft } from "@/services/onboarding-draft";

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: LoginValues) => login(values),
    onMutate: () => rememberReturnPath(new URLSearchParams(window.location.search).get("next")),
    onSuccess: async (data) => {
      queryClient.setQueryData(QUERY_KEYS.me, data.user);
      await claimPendingAnonymousDraft().catch(() => {
        toast.error("Your saved affordability inputs could not be added yet. They are still saved on this device; retry after signing in.");
      });
      toast.success("Signed in");
      const destination = getReturnPath();
      clearReturnPath();
      router.push(destination);
      router.refresh();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to sign in"));
    },
  });
}
