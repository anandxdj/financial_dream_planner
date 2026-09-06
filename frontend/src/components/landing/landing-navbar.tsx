"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { ROUTES } from "@/constants/api";

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#E8E1D6] bg-[#FFFDF9]/90 backdrop-blur-md transition-all">
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

        {/* Desktop Nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#475467]">
          <a
            href="#features"
            className="min-h-[44px] inline-flex items-center hover:text-[#1F2A44] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5855D6] rounded-md px-1"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="min-h-[44px] inline-flex items-center hover:text-[#1F2A44] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5855D6] rounded-md px-1"
          >
            How it works
          </a>
          <a
            href="#pricing"
            className="min-h-[44px] inline-flex items-center hover:text-[#1F2A44] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5855D6] rounded-md px-1"
          >
            Pricing
          </a>
          <a
            href="#about"
            className="min-h-[44px] inline-flex items-center hover:text-[#1F2A44] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5855D6] rounded-md px-1"
          >
            About
          </a>
        </nav>

        {/* Desktop Header Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href={ROUTES.login}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[10px] px-4 py-2 text-sm font-medium text-[#344054] hover:text-[#1F2A44] hover:bg-[#F5EFE6]/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5855D6]"
          >
            Log in
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-[12px] bg-[#5855D6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4D4AB8] active:scale-[0.98] transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#5855D6]"
          >
            <span>Get started</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="flex md:hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#344054] hover:bg-[#F5EFE6] transition-colors"
        >
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8E1D6] bg-[#FFFDF9] px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1 text-sm font-medium text-[#344054]">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center px-3 rounded-lg hover:bg-[#F5EFE6]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center px-3 rounded-lg hover:bg-[#F5EFE6]"
            >
              How it works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center px-3 rounded-lg hover:bg-[#F5EFE6]"
            >
              Pricing
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center px-3 rounded-lg hover:bg-[#F5EFE6]"
            >
              About
            </a>
            <a
              href="#calculator-preview"
              onClick={() => setMobileMenuOpen(false)}
              className="min-h-[44px] flex items-center px-3 rounded-lg hover:bg-[#F5EFE6]"
            >
              Can I Afford This?
            </a>
          </nav>
          <div className="pt-3 border-t border-[#E8E1D6] flex flex-col gap-2">
            <Link
              href={ROUTES.login}
              className="min-h-[44px] flex items-center justify-center rounded-[10px] border border-[#E8E1D6] text-sm font-medium text-[#344054] hover:bg-[#F5EFE6]"
            >
              Log in
            </Link>
            <Link
              href="/onboarding"
              className="min-h-[44px] flex items-center justify-center gap-2 rounded-[12px] bg-[#5855D6] text-sm font-semibold text-white shadow-sm hover:bg-[#4D4AB8]"
            >
              <span>Get started</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
