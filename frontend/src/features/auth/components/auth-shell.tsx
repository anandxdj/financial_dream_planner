import type { ReactNode } from "react";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { ROUTES } from "@/constants/api";

export interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  mode?: "login" | "register" | "forgot-password" | "reset-password" | "verify-email";
  quote?: string;
  quoteSubtitle?: string;
  heroImage?: string;
  heroImageAlt?: string;
  benefits?: string[];
}

export function AuthShell({
  title,
  description,
  children,
  mode,
  quote,
  quoteSubtitle,
  heroImage,
  heroImageAlt,
  benefits,
}: AuthShellProps) {
  const resolvedMode =
    mode ??
    (title.toLowerCase().includes("create") ||
    title.toLowerCase().includes("register") ||
    title.toLowerCase().includes("sign up")
      ? "register"
      : title.toLowerCase().includes("forgot")
      ? "forgot-password"
      : title.toLowerCase().includes("reset")
      ? "reset-password"
      : title.toLowerCase().includes("verify")
      ? "verify-email"
      : "login");

  const defaultHero = {
    register: {
      quote: "A more confident you starts here.",
      quoteSubtitle: "A brighter tomorrow is a plan away.",
      image: "/Assets/Characters/woman_with_laptop.png",
      alt: "Woman with laptop planning future goals",
      benefits: ["Free to start", "No credit card required", "Set up in 2 minutes"],
    },
    login: {
      quote: "Progress over perfection.",
      quoteSubtitle: "A calmer tomorrow is possible.",
      image: "/Assets/Characters/woman_writing_journal.png",
      alt: "Woman mindfully writing her financial journal",
      benefits: ["Free to start", "No credit card required", "Set up in 2 minutes"],
    },
    "forgot-password": {
      quote: "Small steps today, peace of mind tomorrow.",
      quoteSubtitle: "Regain secure access to your roadmap in seconds.",
      image: "/Assets/Characters/woman_writing_journal.png",
      alt: "Woman reviewing her roadmap calmly",
      benefits: ["Secure single-use reset links", "No plain text password storage", "Set up in 2 minutes"],
    },
    "reset-password": {
      quote: "Fresh starts lead to brighter horizons.",
      quoteSubtitle: "Keep your account safe and empowered.",
      image: "/Assets/Characters/woman_with_laptop.png",
      alt: "Woman updating secure account credentials",
      benefits: ["At least 8 characters", "Bank-grade password hashing", "Instant session sync"],
    },
    "verify-email": {
      quote: "One small step towards financial clarity.",
      quoteSubtitle: "Confirming your personalized journey.",
      image: "/Assets/Characters/woman_writing_journal.png",
      alt: "Woman confirming account verification",
      benefits: ["Safe, verified access", "Deterministic planning engine", "Your data stays yours"],
    },
  }[resolvedMode];

  const resolvedQuote = quote ?? defaultHero.quote;
  const resolvedQuoteSubtitle = quoteSubtitle ?? defaultHero.quoteSubtitle;
  const resolvedHeroImage = heroImage ?? defaultHero.image;
  const resolvedHeroAlt = heroImageAlt ?? defaultHero.alt;
  const resolvedBenefits = benefits ?? defaultHero.benefits;

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#344054] flex flex-col font-sans selection:bg-[#5855D6]/20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#E8E1D6] bg-[#FFFDF9]/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo with Botanical Leaf Emblem */}
          <Link
            href="/"
            className="flex min-h-[44px] items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#5855D6] rounded-lg group"
          >
            <div className="flex size-9 items-center justify-center rounded-[10px] bg-[#5855D6] text-white shadow-xs group-hover:scale-105 transition-transform">
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path
                  d="M12 21c-4.97 0-9-4.03-9-9 0-6.5 9-10 9-10s9 3.5 9 10c0 4.97-4.03 9-9 9z"
                  fill="currentColor"
                  fillOpacity="0.25"
                />
                <path d="M12 2v19" />
                <path d="M12 9c2.5 1 4 3 4 5" />
                <path d="M12 13c-2.5 1-4 3-4 5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-normal tracking-tight text-[#1F2A44]">
                Financial Dream Planner
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#475467]">
            <Link
              href="/#features"
              className="min-h-[44px] inline-flex items-center hover:text-[#1F2A44] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5855D6] rounded-md px-1"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              className="min-h-[44px] inline-flex items-center hover:text-[#1F2A44] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5855D6] rounded-md px-1"
            >
              How it works
            </Link>
            <Link
              href="/#pricing"
              className="min-h-[44px] inline-flex items-center hover:text-[#1F2A44] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5855D6] rounded-md px-1"
            >
              Pricing
            </Link>
            <Link
              href="/#about"
              className="min-h-[44px] inline-flex items-center hover:text-[#1F2A44] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5855D6] rounded-md px-1"
            >
              About
            </Link>
          </nav>

          {/* Right Action Switcher */}
          <div className="flex items-center gap-3">
            {resolvedMode === "register" ? (
              <Link
                href={ROUTES.login}
                className="hidden sm:inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#E8E1D6] bg-white px-4 py-2 text-sm font-semibold text-[#1F2A44] hover:bg-[#FAF7F2] transition-colors shadow-xs"
              >
                Log in
              </Link>
            ) : (
              <Link
                href={ROUTES.register}
                className="hidden sm:inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#E8E1D6] bg-white px-4 py-2 text-sm font-semibold text-[#1F2A44] hover:bg-[#FAF7F2] transition-colors shadow-xs"
              >
                Sign up
              </Link>
            )}
            <Link
              href={ROUTES.register}
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[#5855D6] px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#4D40B8] transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl mx-auto">
          {resolvedMode === "verify-email" ? (
            <div className="rounded-2xl sm:rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 sm:p-10 lg:p-12 shadow-[0_4px_30px_rgba(31,42,68,0.05)]">
              {children}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left / Main Card Column */}
              <div className="w-full lg:col-span-7 xl:col-span-7">
                <div className="rounded-2xl sm:rounded-3xl border border-[#E8E1D6] bg-[#FFFCF8] p-6 sm:p-8 md:p-10 shadow-[0_4px_30px_rgba(31,42,68,0.05)]">
                <div className="mb-6 sm:mb-8">
                  <h1 className="font-serif text-2xl sm:text-3xl lg:text-[32px] font-normal tracking-tight text-[#1F2A44]">
                    {title}
                  </h1>
                  <p className="mt-1.5 text-sm sm:text-base text-[#475467] leading-relaxed">
                    {description}
                  </p>
                </div>
                {children}
              </div>
            </div>

            {/* Right / Hero Column */}
            <div className="w-full lg:col-span-5 xl:col-span-5">
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E8E1D6] bg-gradient-to-br from-[#FFFDF9] via-[#FAF5EC] to-[#F5EEE2] p-6 sm:p-8 lg:p-10 shadow-[0_4px_30px_rgba(31,42,68,0.03)] flex flex-col justify-between">
                {/* Script italic quote */}
                <div className="space-y-1">
                  <p className="font-script text-2xl sm:text-3xl text-[#1F2A44] italic leading-tight">
                    &ldquo;{resolvedQuote}&rdquo;
                  </p>
                  {resolvedQuoteSubtitle && (
                    <p className="text-xs sm:text-sm text-[#475467] font-sans">
                      {resolvedQuoteSubtitle}
                    </p>
                  )}
                </div>

                {/* Scenic character artwork */}
                <div className="relative my-6 sm:my-8 flex items-center justify-center">
                  <div className="absolute inset-0 -m-3 bg-gradient-to-tr from-[#E8DEC9]/50 to-transparent rounded-3xl blur-xl -z-10" />
                  <div className="relative w-full max-w-[260px] sm:max-w-[300px] aspect-[4/3] flex items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolvedHeroImage}
                      alt={resolvedHeroAlt}
                      className="max-h-[260px] w-auto object-contain drop-shadow-sm transition-transform duration-500 hover:scale-[1.02]"
                    />
                  </div>
                </div>

                {/* Green checkmark benefits list */}
                <div className="space-y-3 pt-2">
                  {resolvedBenefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#EBF5EF] text-[#2E7D32] shadow-xs">
                        <Check className="size-3.5 stroke-[2.5]" aria-hidden="true" />
                      </div>
                      <span className="text-sm font-medium text-[#344054]">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Trust Reassurance banner */}
                <div className="mt-6 pt-4 border-t border-[#E8E1D6]/80 flex items-center gap-2 text-xs text-[#667085]">
                  <ShieldCheck className="size-4 text-[#3D5C4A] shrink-0" aria-hidden="true" />
                  <span>256-bit bank-grade encryption · Your data stays yours</span>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* Auth Footer */}
      <footer className="border-t border-[#E8E1D6] py-6 bg-[#FFFDF9]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#667085]">
          <p>© {new Date().getFullYear()} Financial Dream Planner. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/privacy" className="hover:text-[#1F2A44] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#1F2A44] transition-colors">
              Terms of Service
            </Link>
            <Link href="/security" className="hover:text-[#1F2A44] transition-colors">
              Security
            </Link>
            <Link href="/contact" className="hover:text-[#1F2A44] transition-colors">
              Contact
            </Link>
          </div>
          <p className="flex items-center gap-1.5 text-[#3D5C4A] font-medium">
            <span>Made for a financially brighter world</span>
            <span>🌱</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

