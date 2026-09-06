"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/api";
import { useResetPassword } from "@/hooks/use-reset-password";
import { resetPasswordSchema, type ResetPasswordValues } from "@/schemas/auth";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const reset = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "" },
  });

  const passwordVal = form.watch("password") || "";
  const hasMinLength = passwordVal.length >= 8;
  const hasNumber = /\d/.test(passwordVal);
  const hasLetter = /[a-zA-Z]/.test(passwordVal);
  const hasSpecial = /[^a-zA-Z0-9]/.test(passwordVal);

  if (!token) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center">
        <p className="text-sm font-medium text-destructive">This reset link is invalid or missing a token.</p>
        <Link
          href={ROUTES.forgotPassword}
          className="mt-3 inline-block text-xs font-semibold text-[#5855D6] hover:underline"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={form.handleSubmit((values) => reset.mutate({ token, password: values.password }))}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="password" className="text-sm font-medium text-[#1F2A44]">
          New password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••••••"
            className="h-11 rounded-xl border-[#E8E1D6] bg-white pl-3.5 pr-11 text-sm text-[#1F2A44] placeholder:text-[#98A2B3] focus-visible:border-[#5855D6] focus-visible:ring-[#5855D6]/20 shadow-xs"
            {...form.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#667085] hover:text-[#1F2A44] transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-[#5855D6]"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {form.formState.errors.password ? (
          <p className="text-xs font-medium text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>

      {/* Password criteria checklist */}
      <div className="rounded-xl border border-[#E8E1D6]/80 bg-[#FAF7F2] p-3.5 space-y-2 text-xs">
        <p className="font-medium text-[#1F2A44]">Password strength requirements:</p>
        <div className="grid grid-cols-2 gap-2 text-[#475467]">
          <div className="flex items-center gap-1.5">
            <Check className={`size-3.5 ${hasMinLength ? "text-[#2E7D32]" : "text-[#98A2B3]"}`} />
            <span className={hasMinLength ? "text-[#1F2A44] font-medium" : ""}>At least 8 characters</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className={`size-3.5 ${hasNumber ? "text-[#2E7D32]" : "text-[#98A2B3]"}`} />
            <span className={hasNumber ? "text-[#1F2A44] font-medium" : ""}>Includes a number</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className={`size-3.5 ${hasLetter ? "text-[#2E7D32]" : "text-[#98A2B3]"}`} />
            <span className={hasLetter ? "text-[#1F2A44] font-medium" : ""}>Includes a letter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className={`size-3.5 ${hasSpecial ? "text-[#2E7D32]" : "text-[#98A2B3]"}`} />
            <span className={hasSpecial ? "text-[#1F2A44] font-medium" : ""}>Special character</span>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-11 rounded-xl bg-[#5855D6] hover:bg-[#4D40B8] text-white font-medium text-sm shadow-xs transition-colors mt-1"
        disabled={reset.isPending}
      >
        {reset.isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Updating password...
          </span>
        ) : (
          "Reset password"
        )}
      </Button>

      <div className="text-center pt-1">
        <Link
          href={ROUTES.login}
          className="text-sm font-semibold text-[#5855D6] hover:text-[#4D40B8] hover:underline transition-colors"
        >
          Back to log in
        </Link>
      </div>
    </form>
  );
}

