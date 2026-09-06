"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clearReturnPath, ROUTES } from "@/constants/api";
import { getApiErrorMessage } from "@/lib/api";
import { logout } from "@/services/auth.service";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      clearReturnPath();
      toast.success("Signed out");
      router.replace(ROUTES.login);
      router.refresh();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to sign out"));
    },
  });
}
