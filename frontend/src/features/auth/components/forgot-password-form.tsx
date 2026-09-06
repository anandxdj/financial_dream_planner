"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/api";
import { useForgotPassword } from "@/hooks/use-forgot-password";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/schemas/auth";

export function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  return (
    <div className="flex flex-col gap-6">
      {forgot.isSuccess ? (
        <div className="rounded-xl border border-[#3D5C4A]/20 bg-[#EBF5EF]/60 p-4 sm:p-5 flex items-start gap-3">
          <CheckCircle2 className="size-5 text-[#2E7D32] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[#1F2A44]">Reset link dispatched</h2>
            <p className="text-xs sm:text-sm text-[#344054] leading-relaxed">
              If an account is associated with this email address, we have sent instructions to reset your password. Please check your inbox and spam folder.
            </p>
          </div>
        </div>
      ) : null}

      <form
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit((values) => forgot.mutate(values.email))}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-[#1F2A44]">
            Email address
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="anand@example.com"
              className="h-11 rounded-xl border-[#E8E1D6] bg-white pl-3.5 pr-10 text-sm text-[#1F2A44] placeholder:text-[#98A2B3] focus-visible:border-[#5855D6] focus-visible:ring-[#5855D6]/20 shadow-xs"
              {...form.register("email")}
            />
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3]">
              <Mail className="size-4" aria-hidden="true" />
            </div>
          </div>
          {form.formState.errors.email ? (
            <p className="text-xs font-medium text-destructive">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <Button
          type="submit"
          className="w-full h-11 rounded-xl bg-[#5855D6] hover:bg-[#4D40B8] text-white font-medium text-sm shadow-xs transition-colors"
          disabled={forgot.isPending}
        >
          {forgot.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Sending reset link...
            </span>
          ) : (
            "Send reset link"
          )}
        </Button>

        <div className="pt-2 text-center">
          <Link
            href={ROUTES.login}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5855D6] hover:text-[#4D40B8] hover:underline transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to log in
          </Link>
        </div>
      </form>
    </div>
  );
}

