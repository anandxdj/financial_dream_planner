"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, Lock, Trash2, Smartphone } from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    question: "Do you read personal messages?",
    answer:
      "No. The optional companion parses only transactional bank SMS completely on your device. Personal conversations, OTPs, and private messages are never accessed, read, or transmitted to any server.",
  },
  {
    id: "faq-2",
    question: "What data is stored?",
    answer:
      "Only the financial accounts you connect or enter, your specified goals, and simulation settings. All data is encrypted at rest and in transit.",
  },
  {
    id: "faq-3",
    question: "Can I use it without Android?",
    answer:
      "Yes! The entire web platform is fully functional without Android. You can enter data manually, import bank statements, or build scenario plans directly from any desktop or mobile browser.",
  },
  {
    id: "faq-4",
    question: "Is my data secure?",
    answer:
      "Absolutely. We enforce TLS 1.3 encryption in transit, AES-256 encryption at rest, and strict row-level household isolation in our database.",
  },
  {
    id: "faq-5",
    question: "Can I delete my data?",
    answer:
      "Yes, anytime. We offer a complete data export followed by irreversible two-step household account purge from all active databases and caches.",
  },
  {
    id: "faq-6",
    question: "Do you share data with third parties?",
    answer:
      "Never. We are an independent personal financial planning platform. We do not sell your personal or financial data to credit card brokers, lenders, or advertisers.",
  },
];

export function SecurityFaqSection() {
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-1");

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="py-16 md:py-24 border-b border-[#E8E1D6] bg-[#FAF7F2] relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Security Shield & Guarantees (5 cols) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            {/* Illustrated Shield */}
            <div className="relative mx-auto lg:mx-0 size-48 flex items-center justify-center">
              <Image
                src="/Assets/Cards%20And%20Charts/secure_shield.png"
                alt="Verified Security Shield"
                width={192}
                height={192}
                className="size-44 object-contain drop-shadow-sm"
              />
            </div>

            <div className="space-y-3">
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1F2A44] tracking-tight">
                Your data stays yours.
              </h2>
              <p className="text-base text-[#475467] leading-relaxed">
                We take your privacy and security seriously. Your financial data is encrypted,
                secure, and used only to help you.
              </p>
            </div>

            {/* Quick Guarantees */}
            <div className="space-y-3 pt-2 text-xs sm:text-sm text-[#344054]">
              <div className="flex items-center gap-3">
                <div className="flex size-6 items-center justify-center rounded-full bg-[#3D5C4A]/10 text-[#3D5C4A]">
                  <Lock className="size-3.5" />
                </div>
                <span>Bank-grade 256-bit encryption</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-6 items-center justify-center rounded-full bg-[#3D5C4A]/10 text-[#3D5C4A]">
                  <Smartphone className="size-3.5" />
                </div>
                <span>On-device transactional SMS parsing</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-6 items-center justify-center rounded-full bg-[#3D5C4A]/10 text-[#3D5C4A]">
                  <Trash2 className="size-3.5" />
                </div>
                <span>Irreversible one-click account deletion</span>
              </div>
            </div>
          </div>

          {/* Right Column: FAQ Accordion (7 cols) */}
          <div className="lg:col-span-7">
            <h3 className="font-serif text-2xl font-normal text-[#1F2A44] mb-6 text-left">
              Frequently asked
            </h3>

            <div className="space-y-3">
              {FAQS.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="rounded-[16px] border border-[#E8E1D6] bg-[#FFFCF8] overflow-hidden transition-all shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm sm:text-base font-medium text-[#1F2A44] hover:text-[#5855D6] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5855D6]"
                      aria-expanded={isOpen}
                    >
                      <span className="pr-4">{faq.question}</span>
                      <ChevronDown
                        className={`size-4.5 text-[#475467] shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-[#5855D6]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-[#475467] leading-relaxed border-t border-[#E8E1D6]/60 pt-3">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
