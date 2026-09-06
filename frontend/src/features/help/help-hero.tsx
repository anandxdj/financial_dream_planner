"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, HelpCircle, Headphones, BookOpen } from "lucide-react";

interface HelpHeroProps {
  onSearch?: (query: string) => void;
  onCategorySelect?: (category: string) => void;
}

export function HelpHero({ onSearch, onCategorySelect }: HelpHeroProps) {
  const [query, setQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query.trim());
    }
  };

  const handleCategoryClick = (category: string, targetId: string) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
    const elem = document.getElementById(targetId);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFFDF9] via-[#FFF9F0] to-[#FFF7E8]/60 py-12 md:py-16 lg:py-20 border-b border-[#E8E1D6]/70">
      {/* Subtle ambient watercolor background glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-[#5E55C9]/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 right-0 size-80 rounded-full bg-[#E5D298]/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Heading, Subtitle, Search, Quick Categories */}
          <div className="lg:col-span-7 space-y-7">
            <div className="space-y-3">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#1F2A44] leading-[1.15]">
                How can we help you today?
              </h1>
              <p className="text-base sm:text-lg text-[#475467] max-w-xl leading-relaxed">
                Find answers, get support, and make the most of your financial journey.
              </p>
            </div>

            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
              <div className="flex items-center rounded-2xl bg-white border border-[#E8E1D6] p-1.5 shadow-sm hover:border-[#5E55C9]/40 focus-within:border-[#5E55C9] focus-within:ring-2 focus-within:ring-[#5E55C9]/20 transition-all">
                <div className="pl-3.5 pr-2 text-[#475467]">
                  <Search className="size-5 text-[#475467]/70" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (onSearch) onSearch(e.target.value);
                  }}
                  placeholder="Search help articles, topics, or questions..."
                  className="w-full bg-transparent py-2.5 text-sm sm:text-base text-[#1F2A44] placeholder:text-[#475467]/60 outline-none"
                  aria-label="Search help articles, topics, or questions"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="inline-flex items-center justify-center rounded-xl bg-[#5E55C9] hover:bg-[#4D4AB8] active:scale-95 text-white px-4 py-2.5 shadow-xs transition-all cursor-pointer font-medium text-sm"
                >
                  <Search className="size-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </form>

            {/* 3 Quick Category Cards */}
            <div className="pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-xl">
                {/* Card 1: Browse FAQs */}
                <button
                  type="button"
                  onClick={() => handleCategoryClick("Browse FAQs", "faqs-section")}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E8E1D6] bg-white/90 hover:bg-white hover:border-[#5E55C9]/50 hover:shadow-xs text-left transition-all group cursor-pointer"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#5E55C9]/10 text-[#5E55C9] group-hover:bg-[#5E55C9] group-hover:text-white transition-colors">
                    <HelpCircle className="size-4.5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1F2A44] group-hover:text-[#5E55C9] transition-colors">
                      Browse FAQs
                    </div>
                    <div className="text-xs text-[#475467]">Quick answers</div>
                  </div>
                </button>

                {/* Card 2: Contact Support */}
                <button
                  type="button"
                  onClick={() => handleCategoryClick("Contact Support", "contact-section")}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E8E1D6] bg-white/90 hover:bg-white hover:border-[#5E55C9]/50 hover:shadow-xs text-left transition-all group cursor-pointer"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#3B5B8C]/10 text-[#3B5B8C] group-hover:bg-[#3B5B8C] group-hover:text-white transition-colors">
                    <Headphones className="size-4.5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1F2A44] group-hover:text-[#3B5B8C] transition-colors">
                      Contact Support
                    </div>
                    <div className="text-xs text-[#475467]">Get in touch</div>
                  </div>
                </button>

                {/* Card 3: Guides & Resources */}
                <button
                  type="button"
                  onClick={() => handleCategoryClick("Guides & Resources", "resources-section")}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E8E1D6] bg-white/90 hover:bg-white hover:border-[#5E55C9]/50 hover:shadow-xs text-left transition-all group cursor-pointer"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#3D5C4A]/10 text-[#3D5C4A] group-hover:bg-[#3D5C4A] group-hover:text-white transition-colors">
                    <BookOpen className="size-4.5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1F2A44] group-hover:text-[#3D5C4A] transition-colors">
                      Guides & Resources
                    </div>
                    <div className="text-xs text-[#475467]">Learn and plan</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Watercolor Artwork with script quote */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative max-w-sm sm:max-w-md lg:max-w-none">
              {/* Script Quote Float */}
              <div className="absolute top-2 right-4 z-10 select-none pointer-events-none transform rotate-1">
                <span className="font-script text-xl sm:text-2xl text-[#3B5B8C] drop-shadow-xs italic">
                  Support today. A brighter tomorrow.
                </span>
              </div>

              {/* Artwork Container */}
              <div className="relative overflow-hidden rounded-2xl p-2 bg-gradient-to-tr from-white/70 to-transparent">
                <Image
                  src="/Assets/help/help_hero_illustration.png"
                  alt="Support today. A brighter tomorrow."
                  width={380}
                  height={340}
                  className="rounded-xl object-contain drop-shadow-sm transition-transform hover:scale-[1.01]"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
