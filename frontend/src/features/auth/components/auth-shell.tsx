import type { ReactNode } from "react";
import Image from "next/image";
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

const AUTH_STORIES = {
  register: {
    quote: "Start with the money you know today.",
    quoteSubtitle: "You can leave missing details explicitly unrecorded and refine the plan later.",
    image: "/Assets/Characters/woman_with_laptop.png",
    alt: "Person planning future financial goals",
    benefits: [
      "No bank credentials required to start",
      "Financial calculations run on the backend engine",
      "Plan changes happen only after an explicit action",
    ],
  },
  login: {
    quote: "Return to the plan you saved, not a guessed version of it.",
    quoteSubtitle: "Planned money, recorded money, and scenarios stay clearly separated.",
    image: "/Assets/Characters/woman_writing_journal.png",
    alt: "Person reviewing a financial journal",
    benefits: [
      "Saved plans remain versioned",
      "Recorded transactions never silently rewrite the baseline",
      "Scenario changes require review before apply",
    ],
  },
  "forgot-password": {
    quote: "Recover access without changing your financial plan.",
    quoteSubtitle: "Account recovery is separate from your saved planning decisions.",
    image: "/Assets/Characters/woman_writing_journal.png",
    alt: "Person calmly reviewing a roadmap",
    benefits: [
      "Recovery does not modify plan data",
      "Return to the same saved planning workspace",
      "Use the account recovery flow to regain access",
    ],
  },
  "reset-password": {
    quote: "A secure reset should be simple and uneventful.",
    quoteSubtitle: "Update account access, then continue from the same financial baseline.",
    image: "/Assets/Characters/woman_with_laptop.png",
    alt: "Person updating account access",
    benefits: [
      "Password requirements are shown before submission",
      "Financial data is not changed by the reset",
      "Return to the same versioned plan after sign-in",
    ],
  },
  "verify-email": {
    quote: "One small account step before the planning workspace.",
    quoteSubtitle: "Verification confirms access; it does not generate or change a plan.",
    image: "/Assets/Characters/woman_writing_journal.png",
    alt: "Person confirming account access",
    benefits: [
      "Verified account access",
      "Engine-backed financial calculations",
      "Explicit review before plan changes",
    ],
  },
} as const;

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

  const story = AUTH_STORIES[resolvedMode];
  const resolvedQuote = quote ?? story.quote;
  const resolvedQuoteSubtitle = quoteSubtitle ?? story.quoteSubtitle;
  const resolvedHeroImage = heroImage ?? story.image;
  const resolvedHeroAlt = heroImageAlt ?? story.alt;
  const resolvedBenefits = benefits ?? story.benefits;

  return (
    <div className="flex min-h-screen flex-col bg-canvas font-sans text-body">
      <header className="sticky top-0 z-40 border-b bg-canvas/95 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex min-h-11 items-center gap-2.5 rounded-[10px] focus-visible:ring-2 focus-visible:ring-purple"
          >
            <div className="flex size-9 items-center justify-center rounded-[10px] bg-purple text-white transition-transform group-hover:scale-[1.03]">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21c-4.97 0-9-4.03-9-9 0-6.5 9-10 9-10s9 3.5 9 10c0 4.97-4.03 9-9 9z" fill="currentColor" fillOpacity="0.2" />
                <path d="M12 2v19" />
                <path d="M12 9c2.5 1 4 3 4 5" />
                <path d="M12 13c-2.5 1-4 3-4 5" />
              </svg>
            </div>
            <span className="font-serif text-lg tracking-tight text-navy sm:text-xl">Financial Dream Planner</span>
          </Link>

          <div className="flex items-center gap-2">
            {resolvedMode === "register" ? (
              <Link href={ROUTES.login} className="inline-flex min-h-11 items-center rounded-[10px] border bg-card px-3.5 text-sm font-semibold text-navy hover:bg-surface-muted">
                Log in
              </Link>
            ) : (
              <Link href={ROUTES.register} className="inline-flex min-h-11 items-center rounded-[10px] border bg-card px-3.5 text-sm font-semibold text-navy hover:bg-surface-muted">
                Sign up
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto w-full max-w-6xl">
          {resolvedMode === "verify-email" ? (
            <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
              {children}
            </div>
          ) : (
            <div className="grid items-stretch gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
              <section className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8 lg:p-10">
                <div className="mb-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.09em] text-purple">Secure workspace access</p>
                  <h1 className="mt-2 font-serif text-3xl tracking-tight text-navy sm:text-4xl">{title}</h1>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-ink sm:text-base">{description}</p>
                </div>
                {children}
              </section>

              <aside className="relative overflow-hidden rounded-2xl border bg-surface-muted/60 p-6 sm:p-8 lg:p-9">
                <div className="relative z-10 flex h-full flex-col">
                  <div>
                    <p className="font-script text-2xl leading-tight text-navy sm:text-3xl">“{resolvedQuote}”</p>
                    {resolvedQuoteSubtitle ? <p className="mt-2 text-sm leading-relaxed text-muted-ink">{resolvedQuoteSubtitle}</p> : null}
                  </div>

                  <div className="relative my-7 flex min-h-48 flex-1 items-center justify-center">
                    <Image
                      src={resolvedHeroImage}
                      alt={resolvedHeroAlt}
                      width={320}
                      height={260}
                      className="max-h-[260px] w-auto object-contain drop-shadow-sm"
                    />
                  </div>

                  <div className="space-y-3 border-t pt-5">
                    {resolvedBenefits.map((benefit) => (
                      <div key={benefit} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-sage/10 text-sage">
                          <Check className="size-3.5" aria-hidden="true" />
                        </span>
                        <span className="text-sm leading-relaxed text-body">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-start gap-2 border-t pt-4 text-xs leading-relaxed text-muted-ink">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden="true" />
                    <span>Your financial plan changes only when you explicitly choose an action that updates it.</span>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t bg-card/60 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-ink sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Financial Dream Planner.</p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/privacy" className="hover:text-navy">Privacy</Link>
            <Link href="/terms" className="hover:text-navy">Terms</Link>
            <Link href="/security" className="hover:text-navy">Security</Link>
            <Link href="/contact" className="hover:text-navy">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
