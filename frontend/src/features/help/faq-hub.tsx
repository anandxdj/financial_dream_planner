"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Search,
  Layers,
  User,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Grid,
  LifeBuoy,
} from "lucide-react";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const FAQ_DATA: FaqItem[] = [
  {
    id: "create-account",
    question: "How do I create an account?",
    category: "Account & Login",
    answer:
      "Getting started takes less than 2 minutes. Click 'Get started' on the top navigation bar, enter your email address or use Google SSO, verify your email, and follow the simple 3-step onboarding wizard. You will immediately get a personalized financial projection roadmap.",
  },
  {
    id: "change-plan",
    question: "Can I change my plan later?",
    category: "Billing & Plans",
    answer:
      "Yes, absolutely. You can upgrade, downgrade, or switch between monthly and annual billing at any time directly from Settings > Billing. Any upgrades apply immediately with prorated billing.",
  },
  {
    id: "data-secure",
    question: "Is my data secure?",
    category: "Security & Privacy",
    answer:
      "Your privacy and security are fundamental to our architecture. We employ bank-grade 256-bit AES encryption at rest, TLS 1.3 in transit, and multi-factor authentication. We never sell your personal or financial data, and Account Aggregator data sync is strictly read-only with explicit consent.",
  },
  {
    id: "connect-banks",
    question: "Can I connect my bank accounts?",
    category: "Apps & Integrations",
    answer:
      "Yes! Financial Dream Planner connects with over 128+ Indian banks, NBFCs, credit cards, and investment depositories via RBI-regulated Account Aggregator (AA) protocols. You can also import CSV / PDF bank statements securely anytime.",
  },
  {
    id: "cancel-subscription",
    question: "How do I cancel my subscription?",
    category: "Billing & Plans",
    answer:
      "You can cancel your subscription at any time without hassle or lock-ins. Simply head to Settings > Billing and click 'Cancel subscription'. You will retain full access to all premium features until the end of your prepaid billing period.",
  },
  {
    id: "features-scenarios",
    question: "How does what-if scenario planning work?",
    category: "Features",
    answer:
      "Our deterministic simulation engine models life events—such as taking a home loan, changing jobs, or early retirement—and calculates your cash flow and net worth trajectories across conservative, baseline, and optimistic horizons.",
  },
  {
    id: "reset-password",
    question: "How do I reset my password?",
    category: "Account & Login",
    answer:
      "On the login page, click 'Forgot password?', enter your registered email address, and you will receive a secure reset link valid for 15 minutes.",
  },
  {
    id: "troubleshoot-sync",
    question: "What should I do if an account sync fails?",
    category: "Troubleshooting",
    answer:
      "Account syncs may temporarily fail if your bank's portal undergoes routine maintenance. You can click 'Retry Sync' in Settings > Integrations or upload your latest statement as a quick alternative.",
  },
];

export const FAQ_CATEGORIES = [
  { id: "all", name: "All topics", icon: Layers },
  { id: "Account & Login", name: "Account & Login", icon: User },
  { id: "Billing & Plans", name: "Billing & Plans", icon: CreditCard },
  { id: "Features", name: "Features", icon: Sparkles },
  { id: "Security & Privacy", name: "Security & Privacy", icon: ShieldCheck },
  { id: "Apps & Integrations", name: "Apps & Integrations", icon: Grid },
  { id: "Troubleshooting", name: "Troubleshooting", icon: LifeBuoy },
];

interface FaqHubProps {
  initialCategory?: string;
}

export function FaqHub({ initialCategory = "all" }: FaqHubProps) {
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "create-account": true,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((faq) => {
      const matchesCategory =
        activeCategory === "all" || faq.category === activeCategory;
      const matchesQuery =
        searchQuery.trim() === "" ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  return (
    <section id="faqs-section" className="py-14 sm:py-20 bg-[#FFFDF9]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1F2A44] font-normal tracking-tight">
            Frequently asked questions
          </h2>
          <p className="text-base text-[#475467]">
            Find quick answers to common questions about Financial Dream Planner.
          </p>

          {/* Search Bar */}
          <div className="pt-3 max-w-lg mx-auto">
            <div className="relative flex items-center rounded-xl bg-white border border-[#E8E1D6] p-1.5 shadow-2xs focus-within:border-[#5E55C9] focus-within:ring-2 focus-within:ring-[#5E55C9]/20 transition-all">
              <Search className="size-4.5 text-[#475467]/60 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FAQs..."
                className="w-full bg-transparent px-3 py-2 text-sm text-[#1F2A44] placeholder:text-[#475467]/50 outline-none"
                aria-label="Search FAQs"
              />
              <button
                type="button"
                aria-label="Search FAQ"
                className="inline-flex size-9 items-center justify-center rounded-lg bg-[#5E55C9] text-white hover:bg-[#4D4AB8] transition-colors"
              >
                <Search className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Layout: Categories Sidebar + Accordion List + Side Script */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Category Filter Pills/Sidebar */}
          <div className="lg:col-span-3">
            <div className="sticky top-24 bg-white/70 backdrop-blur-xs rounded-2xl border border-[#E8E1D6] p-3 shadow-2xs space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-[#475467]/80 uppercase tracking-wider">
                Categories
              </div>
              <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
                {FAQ_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.name || (cat.id === "all" && activeCategory === "all");
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id === "all" ? "all" : cat.name)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 cursor-pointer text-left ${
                        isActive
                          ? "bg-[#5E55C9] text-white shadow-xs"
                          : "text-[#344054] hover:bg-[#F5EFE6]/70 hover:text-[#1F2A44]"
                      }`}
                    >
                      <Icon className={`size-4 ${isActive ? "text-white" : "text-[#475467]"}`} />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Middle Column: Accordion Items */}
          <div className="lg:col-span-6 space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-[#E8E1D6]">
                <p className="text-[#475467] text-sm">
                  No questions match &ldquo;{searchQuery}&rdquo;. Try another term or contact support.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  className="mt-3 text-sm font-medium text-[#5E55C9] hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = !!openItems[faq.id];
                return (
                  <div
                    key={faq.id}
                    className="overflow-hidden rounded-xl border border-[#E8E1D6] bg-white transition-all hover:border-[#5E55C9]/40 shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => toggleItem(faq.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left font-medium text-[#1F2A44] transition-colors hover:text-[#5E55C9] cursor-pointer"
                    >
                      <span className="text-base font-semibold leading-snug">{faq.question}</span>
                      <div
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F5EFE6] text-[#1F2A44] transition-transform duration-200 ${
                          isOpen ? "rotate-180 bg-[#5E55C9]/10 text-[#5E55C9]" : ""
                        }`}
                      >
                        <ChevronDown className="size-4" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-[#E8E1D6]/60 px-5 pt-3 pb-5 text-sm text-[#475467] leading-relaxed animate-in fade-in-50 duration-150">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Side Script Quote & Botanical Accent */}
          <div className="lg:col-span-3 flex lg:flex-col items-center lg:items-start justify-center lg:justify-start gap-4 pt-4 lg:pt-8">
            <div className="space-y-4 max-w-xs text-center lg:text-left">
              <div className="transform -rotate-2">
                <span className="font-script text-2xl sm:text-3xl text-[#3B5B8C] drop-shadow-xs italic">
                  Good questions. Brighter answers.
                </span>
              </div>
              <p className="text-xs text-[#475467]/80 leading-relaxed hidden lg:block">
                Can&apos;t find what you&apos;re looking for? Our advisory team is always ready to assist.
              </p>
              <div className="hidden lg:flex justify-center lg:justify-start pt-2">
                <Image
                  src="/Assets/Nature Elements/leafy_twig.png"
                  alt="Botanical twig illustration"
                  width={90}
                  height={180}
                  className="opacity-75 rotate-12 drop-shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
