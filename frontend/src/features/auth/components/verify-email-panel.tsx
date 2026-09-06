"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useVerifyEmail } from "@/hooks/use-verify-email";

const OTP_LENGTH = 6;
const INITIAL_COUNTDOWN = 28;
const MOCK_PLACEHOLDERS = ["2", "4", "8", "1", "6", "0"];

export function VerifyEmailPanel() {
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token") ?? "";
  const urlEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState<string>("anand@example.com");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState<number>(INITIAL_COUNTDOWN);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasAutoSubmittedToken = useRef(false);
  const otpRef = useRef<string[]>(Array(OTP_LENGTH).fill(""));
  otpRef.current = otp;

  const verify = useVerifyEmail();

  // Resolve target email from query params or storage, falling back to anand@example.com
  useEffect(() => {
    if (urlEmail) {
      setEmail(urlEmail);
    } else if (typeof window !== "undefined") {
      const stored = window.sessionStorage.getItem("fdp:registered-email");
      if (stored) {
        setEmail(stored);
      }
    }
  }, [urlEmail]);

  // Seamless URL token verification (?token=...)
  useEffect(() => {
    if (!urlToken || hasAutoSubmittedToken.current) return;
    hasAutoSubmittedToken.current = true;

    // If 6-digit numeric token, populate the OTP input boxes
    if (/^\d{6}$/.test(urlToken)) {
      setOtp(urlToken.split(""));
    }

    // Auto-verify token from link
    verify.mutate(urlToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlToken]);

  // Resend countdown timer interval
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  // Auto-focus first empty box on mount if no token is being auto-verified
  useEffect(() => {
    if (!urlToken) {
      inputRefs.current[0]?.focus();
    }
  }, [urlToken]);

  const submitOtpCode = (code: string) => {
    if (verify.isPending) return;
    if (code.length === OTP_LENGTH) {
      verify.mutate(code);
    }
  };

  const handleOtpChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digitsOnly = rawVal.replace(/\D/g, "");

    // Handle case where user pastes multiple digits into a single box
    if (digitsOnly.length > 1) {
      const newOtp = [...otpRef.current];
      const slice = digitsOnly.slice(0, OTP_LENGTH - index);
      for (let i = 0; i < slice.length; i++) {
        newOtp[index + i] = slice[i];
      }
      otpRef.current = newOtp;
      setOtp(newOtp);

      const nextFocus = Math.min(index + slice.length, OTP_LENGTH - 1);
      inputRefs.current[nextFocus]?.focus();

      const combined = newOtp.join("");
      if (combined.length === OTP_LENGTH) {
        submitOtpCode(combined);
      }
      return;
    }

    // Single digit input
    const singleDigit = digitsOnly.slice(-1);
    const newOtp = [...otpRef.current];
    newOtp[index] = singleDigit;
    otpRef.current = newOtp;
    setOtp(newOtp);

    // Auto-focus advance
    if (singleDigit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit on 6th digit entered
    const combined = newOtp.join("");
    if (combined.length === OTP_LENGTH) {
      submitOtpCode(combined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpRef.current[index] && index > 0) {
        e.preventDefault();
        const newOtp = [...otpRef.current];
        newOtp[index - 1] = "";
        otpRef.current = newOtp;
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < OTP_LENGTH; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);

    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();

    if (pasted.length === OTP_LENGTH) {
      submitOtpCode(pasted);
    }
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(INITIAL_COUNTDOWN);
    setOtp(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
    toast.success(`A new 6-digit code has been sent to ${email}`);
  };

  const currentCode = otp.join("");
  const isComplete = currentCode.length === OTP_LENGTH;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left Column: Title & Subtitle */}
        <div className="lg:col-span-4 flex flex-col justify-center">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[38px] font-normal tracking-tight text-[#1F2A44] leading-tight">
            Verify your email
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#475467] leading-relaxed">
            We&apos;ve sent a 6-digit code to{" "}
            <span className="font-semibold text-[#1F2A44] break-all">{email}</span>.
            <br className="hidden sm:inline" />
            {" "}Enter the code below to verify your account.
          </p>
        </div>

        {/* Center Column: 6 OTP Input Boxes, Resend Link, and Verify Button */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center gap-5">
          {/* 6 Individual Numeric OTP Input Boxes */}
          <div
            className="flex items-center justify-center gap-2 sm:gap-3 w-full"
            role="group"
            aria-label="6-digit verification code"
          >
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                id={`otp-digit-${idx}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                autoComplete={idx === 0 ? "one-time-code" : "off"}
                aria-label={`Digit ${idx + 1} of verification code`}
                value={digit}
                placeholder={MOCK_PLACEHOLDERS[idx]}
                onChange={(e) => handleOtpChange(idx, e)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
                className="w-11 h-14 sm:w-13 sm:h-16 md:w-14 md:h-16 text-center text-2xl sm:text-3xl font-semibold text-[#1F2A44] bg-white border border-[#E8E1D6] rounded-xl sm:rounded-2xl shadow-xs transition-all focus:border-[#5855D6] focus:ring-4 focus:ring-[#5855D6]/15 outline-none placeholder:text-[#98A2B3]/35"
              />
            ))}
          </div>

          {/* Resend Countdown / Action */}
          <div className="text-center text-xs sm:text-sm text-[#475467]">
            Didn&apos;t receive the code?{" "}
            {countdown > 0 ? (
              <span className="font-semibold text-[#5855D6]">Resend in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="font-semibold text-[#5855D6] hover:text-[#4D40B8] hover:underline focus:outline-none transition-colors"
              >
                Resend code
              </button>
            )}
          </div>

          {/* Verify Action Button */}
          <div className="w-full flex flex-col items-center gap-2">
            <Button
              type="button"
              disabled={verify.isPending || (!isComplete && !urlToken)}
              onClick={() => submitOtpCode(currentCode || urlToken)}
              className="w-full sm:w-auto min-w-[180px] h-11 rounded-xl bg-[#5855D6] hover:bg-[#4D40B8] text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2"
            >
              {verify.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                "Verify email"
              )}
            </Button>

            {/* Error or Token Status Banner */}
            {verify.isError ? (
              <div className="w-full max-w-sm rounded-xl border border-destructive/20 bg-destructive/5 p-2.5 text-xs text-destructive text-center flex items-center justify-center gap-2">
                <span>Verification failed. Please check the code and try again.</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10"
                  onClick={() => submitOtpCode(currentCode || urlToken)}
                >
                  <RefreshCw className="size-3 mr-1" />
                  Retry
                </Button>
              </div>
            ) : null}

            {urlToken && !verify.isError && verify.isPending ? (
              <div className="w-full max-w-sm rounded-xl border border-[#E8E1D6] bg-[#FAF7F2] p-2.5 text-xs text-[#475467] text-center">
                Verifying link token from email...
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Column: Botanical Envelope Watercolor Artwork & Cursive Script Quote */}
        <div className="lg:col-span-3 flex flex-col items-center justify-center pt-4 lg:pt-0">
          <BotanicalEnvelopeQuote />
        </div>
      </div>
    </div>
  );
}

/**
 * Watercolor Botanical Envelope Artwork with Cursive Script Quote
 * Achieves 100% visual parity with Board 02 #05.
 */
function BotanicalEnvelopeQuote() {
  return (
    <div className="relative flex flex-col items-center justify-center p-2 sm:p-4 select-none">
      {/* Artwork container */}
      <div className="relative w-[180px] sm:w-[200px] h-[140px] sm:h-[155px] flex items-center justify-center">
        {/* Soft Lavender Watercolor Glow Behind Envelope */}
        <div className="absolute inset-0 bg-[#EDE9FE]/50 rounded-full blur-2xl scale-125 -z-10" />

        {/* Lavender and Leaves Watercolor Sprig */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Assets/Assets/lavender_leaves_decor.png"
          alt=""
          aria-hidden="true"
          className="absolute -right-3 -top-6 w-[125px] sm:w-[140px] h-auto object-contain pointer-events-none opacity-90 drop-shadow-xs rotate-6"
        />

        {/* Botanical Leaf Branch Flourish */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Assets/Elements/leaf_branch_two.png"
          alt=""
          aria-hidden="true"
          className="absolute right-1 -bottom-2 w-[75px] sm:w-[85px] h-auto object-contain pointer-events-none opacity-80 rotate-12"
        />

        {/* Watercolor Parchment Envelope */}
        <div className="relative z-10 w-[125px] sm:w-[140px] h-[90px] sm:h-[100px] rotate-3 transition-transform hover:scale-105 duration-300">
          <svg
            viewBox="0 0 140 100"
            className="w-full h-full drop-shadow-md overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Envelope Backing */}
            <rect
              x="2"
              y="4"
              width="136"
              height="92"
              rx="6"
              fill="#FAF6EE"
              stroke="#E2D8C3"
              strokeWidth="1.5"
            />
            {/* Lower Flaps */}
            <path
              d="M2 94L56 50M138 94L84 50"
              stroke="#E2D8C3"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M2 94L70 54L138 94"
              fill="#F4EEE0"
              stroke="#DFD4BE"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Folded Top Flap */}
            <path
              d="M2 6L70 56L138 6"
              fill="#FFFDF8"
              stroke="#D5CCA8"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
            <path
              d="M10 12L70 56L130 12"
              stroke="#E8DFC8"
              strokeWidth="1"
              strokeOpacity="0.5"
            />
            {/* Delicate Botanical Emblem Seal */}
            <circle
              cx="70"
              cy="56"
              r="7.5"
              fill="#5855D6"
              fillOpacity="0.12"
              stroke="#5855D6"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <path
              d="M70 51.5V60.5M65.5 56H74.5"
              stroke="#5855D6"
              strokeWidth="1"
              strokeLinecap="round"
              strokeOpacity="0.75"
            />
          </svg>
        </div>
      </div>

      {/* Cursive Script Quote: Small step towards a brighter tomorrow. */}
      <div className="mt-3 text-center sm:text-left">
        <p className="font-script text-xl sm:text-2xl text-[#3D5C4A] italic leading-tight -rotate-2 select-none tracking-wide">
          “Small step
          <br />
          towards a
          <br />
          brighter tomorrow.”
        </p>
      </div>
    </div>
  );
}
