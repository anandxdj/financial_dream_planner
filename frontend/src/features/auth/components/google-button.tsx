"use client";

import { useState } from "react";
import { toast } from "sonner";
import { rememberReturnPath } from "@/constants/api";
import { startOidcAuth } from "@/services/auth.service";

export function GoogleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AppleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.35-.58.67-1.09 1.74-.95 2.77.99.08 2.04-.52 2.67-1.27z" />
    </svg>
  );
}

export function GoogleButton({
  label = "Google",
  fullWidth = false,
}: {
  label?: string;
  fullWidth?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      rememberReturnPath(new URLSearchParams(window.location.search).get("next"));
      const url = await startOidcAuth();
      window.location.assign(url);
    } catch {
      toast.error("Unable to initialize Google sign-in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#E8E1D6] bg-white px-4 py-2.5 text-sm font-medium text-[#1F2A44] shadow-xs hover:bg-[#FAF7F2] hover:border-[#D9D1C5] focus:outline-none focus:ring-2 focus:ring-[#5855D6]/30 disabled:opacity-60 transition-all cursor-pointer ${
        fullWidth ? "w-full" : "w-full"
      }`}
    >
      <GoogleIcon className="size-4 shrink-0" />
      <span>{loading ? "Connecting..." : label}</span>
    </button>
  );
}

export function AppleButton({
  label = "Apple",
  fullWidth = false,
}: {
  label?: string;
  fullWidth?: boolean;
}) {
  const handleClick = () => {
    toast.info("Apple Sign-In is configured for the iOS mobile app. On the web, please continue with Google or email credentials.");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#E8E1D6] bg-white px-4 py-2.5 text-sm font-medium text-[#1F2A44] shadow-xs hover:bg-[#FAF7F2] hover:border-[#D9D1C5] focus:outline-none focus:ring-2 focus:ring-[#5855D6]/30 transition-all cursor-pointer ${
        fullWidth ? "w-full" : "w-full"
      }`}
    >
      <AppleIcon className="size-4 shrink-0 text-[#1F2A44]" />
      <span>{label}</span>
    </button>
  );
}

export function SocialAuthButtons({
  googleLabel = "Google",
  appleLabel = "Apple",
}: {
  googleLabel?: string;
  appleLabel?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <GoogleButton label={googleLabel} />
      <AppleButton label={appleLabel} />
    </div>
  );
}

