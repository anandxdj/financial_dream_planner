"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/api";

export function LandingFooter() {
  return (
    <footer className="border-t border-[#E8E1D6] bg-[#FFFCF8] py-14 text-xs text-[#475467]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#E8E1D6]">
          {/* Brand Info (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#5855D6] rounded-md"
            >
              <div className="flex size-8 items-center justify-center rounded-[8px] bg-[#5855D6] text-white">
                <svg
                  className="size-4.5"
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
              <span className="font-serif text-lg text-[#1F2A44] font-medium">
                Financial Dream Planner
              </span>
            </Link>
            <p className="text-xs text-[#475467] max-w-sm leading-relaxed">
              India-first personal financial planning command center. Where clarity meets
              financial confidence through deterministic mathematics.
            </p>
          </div>

          {/* Product Links (2 cols) */}
          <div className="md:col-span-2 space-y-2.5">
            <h4 className="font-semibold text-[#1F2A44] uppercase tracking-wider text-[11px]">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="hover:text-[#1F2A44] transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#1F2A44] transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-[#1F2A44] transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#calculator-preview" className="hover:text-[#1F2A44] transition-colors">
                  Can I Afford This?
                </a>
              </li>
            </ul>
          </div>

          {/* Planning Tools (3 cols) */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="font-semibold text-[#1F2A44] uppercase tracking-wider text-[11px]">
              Command Center
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="hover:text-[#1F2A44] transition-colors">
                  Dashboard Overview
                </Link>
              </li>
              <li>
                <Link href="/affordability" className="hover:text-[#1F2A44] transition-colors">
                  Affordability Calculator
                </Link>
              </li>
              <li>
                <Link href="/dashboard/scenarios" className="hover:text-[#1F2A44] transition-colors">
                  Scenario Simulator
                </Link>
              </li>
              <li>
                <Link href="/dashboard/goals" className="hover:text-[#1F2A44] transition-colors">
                  Connected Goals
                </Link>
              </li>
            </ul>
          </div>

          {/* Account (2 cols) */}
          <div className="md:col-span-2 space-y-2.5">
            <h4 className="font-semibold text-[#1F2A44] uppercase tracking-wider text-[11px]">
              Access
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href={ROUTES.login} className="hover:text-[#1F2A44] transition-colors">
                  Log In
                </Link>
              </li>
              <li>
                <Link href={ROUTES.register} className="hover:text-[#1F2A44] transition-colors">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="hover:text-[#1F2A44] transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#475467]">
          <div>
            <span>Deterministic Math · Zero Invented Scores · 100% Privacy</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} Finance Buddy. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
