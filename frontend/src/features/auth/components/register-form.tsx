"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/api";
import { useRegister } from "@/hooks/use-register";
import { registerSchema, type RegisterValues } from "@/schemas/auth";
import { SocialAuthButtons } from "./google-button";

export function RegisterForm() {
  const registerAccount = useRegister();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  return (
    <form
      className="flex flex-col gap-4 sm:gap-5"
      onSubmit={form.handleSubmit((values) => registerAccount.mutate(values))}
    >
      {/* Full name */}
      <div className="grid gap-1.5">
        <Label htmlFor="displayName" className="text-sm font-medium text-[#1F2A44]">
          Full name
        </Label>
        <Input
          id="displayName"
          autoComplete="name"
          placeholder="Anand Sharma"
          className="h-11 rounded-xl border-[#E8E1D6] bg-white px-3.5 text-sm text-[#1F2A44] placeholder:text-[#98A2B3] focus-visible:border-[#5855D6] focus-visible:ring-[#5855D6]/20 shadow-xs"
          {...form.register("displayName")}
        />
        {form.formState.errors.displayName ? (
          <p className="text-xs font-medium text-destructive">{form.formState.errors.displayName.message}</p>
        ) : null}
      </div>

      {/* Email address */}
      <div className="grid gap-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-[#1F2A44]">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="anand@example.com"
          className="h-11 rounded-xl border-[#E8E1D6] bg-white px-3.5 text-sm text-[#1F2A44] placeholder:text-[#98A2B3] focus-visible:border-[#5855D6] focus-visible:ring-[#5855D6]/20 shadow-xs"
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-xs font-medium text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      {/* Password with eye toggle */}
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium text-[#1F2A44]">
            Password
          </Label>
          <span className="text-xs text-[#667085]">Min. 8 characters</span>
        </div>
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

      {/* Primary Create Account Button */}
      <Button
        type="submit"
        className="w-full h-11 rounded-xl bg-[#5855D6] hover:bg-[#4D40B8] text-white font-medium text-sm shadow-xs transition-colors mt-1"
        disabled={registerAccount.isPending}
      >
        {registerAccount.isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Creating account...
          </span>
        ) : (
          "Create account"
        )}
      </Button>

      {/* Divider */}
      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E8E1D6]" />
        </div>
        <div className="relative flex justify-center text-xs text-[#667085] uppercase tracking-wider">
          <span className="bg-[#FFFCF8] px-3 font-medium">or continue with</span>
        </div>
      </div>

      {/* Google and Apple OAuth Buttons */}
      <SocialAuthButtons googleLabel="Google" appleLabel="Apple" />

      {/* Legal terms disclaimer */}
      <p className="text-center text-xs text-[#667085] px-2 leading-relaxed">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-[#1F2A44]">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-[#1F2A44]">
          Privacy Policy
        </Link>
        .
      </p>

      {/* Switch to Login */}
      <p className="text-center text-sm text-[#475467] pt-1">
        Already have an account?{" "}
        <Link
          href={ROUTES.login}
          className="font-semibold text-[#5855D6] hover:text-[#4D40B8] hover:underline transition-colors"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}

