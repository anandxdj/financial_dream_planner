"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/api";
import { useLogin } from "@/hooks/use-login";
import { loginSchema, type LoginValues } from "@/schemas/auth";
import { SocialAuthButtons } from "./google-button";

export function LoginForm() {
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Restore remembered email if available
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("fdp_remembered_email");
      if (savedEmail) {
        form.setValue("email", savedEmail);
        setRememberMe(true);
      }
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }
  }, [form]);

  const onSubmit = (values: LoginValues) => {
    try {
      if (rememberMe) {
        localStorage.setItem("fdp_remembered_email", values.email);
      } else {
        localStorage.removeItem("fdp_remembered_email");
      }
    } catch {
      // Ignore storage errors
    }
    login.mutate(values);
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
      {/* Email field */}
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

      {/* Password field with eye toggle */}
      <div className="grid gap-1.5">
        <Label htmlFor="password" className="text-sm font-medium text-[#1F2A44]">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
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

      {/* Remember me + Forgot password row */}
      <div className="flex items-center justify-between pt-0.5">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="size-4 rounded border-[#D0D5DD] text-[#5855D6] accent-[#5855D6] cursor-pointer"
          />
          <span className="text-sm font-medium text-[#475467]">Keep me signed in</span>
        </label>
        <Link
          href={ROUTES.forgotPassword}
          className="text-sm font-medium text-[#5855D6] hover:text-[#4D40B8] hover:underline transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      {/* Primary Log In Button */}
      <Button
        type="submit"
        className="w-full h-11 rounded-xl bg-[#5855D6] hover:bg-[#4D40B8] text-white font-medium text-sm shadow-xs transition-colors"
        disabled={login.isPending}
      >
        {login.isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Signing in...
          </span>
        ) : (
          "Log in"
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

      {/* Switch to Register */}
      <p className="text-center text-sm text-[#475467] pt-1">
        Don&apos;t have an account?{" "}
        <Link
          href={ROUTES.register}
          className="font-semibold text-[#5855D6] hover:text-[#4D40B8] hover:underline transition-colors"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}

