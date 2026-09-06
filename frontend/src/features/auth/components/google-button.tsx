"use client";

import { Button } from "@/components/ui/button";
import { rememberReturnPath } from "@/constants/api";
import { startOidcAuth } from "@/services/auth.service";

export function GoogleButton({ label }: { label: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={async () => {
        rememberReturnPath(new URLSearchParams(window.location.search).get("next"));
        const url = await startOidcAuth();
        window.location.assign(url);
      }}
    >
      Continue with Google
      <span className="sr-only">{label}</span>
    </Button>
  );
}
