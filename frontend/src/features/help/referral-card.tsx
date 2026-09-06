"use client";

import { useState } from "react";
import Image from "next/image";
import { Mail, Users, Gift, Copy, Check, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ReferralCardProps {
  referralCode?: string;
}

export function ReferralCard({
  referralCode = "BRIGHTER-TOMORROW-2026",
}: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `https://financialdreamplanner.com/invite/${referralCode}`;

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
      }
      setCopied(true);
      toast.success("Invite link copied to clipboard!", {
        description: "Share this link with your friends to grant both of you 1 month free Premium.",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! I'm planning my financial goals with Financial Dream Planner. Join with my link to get 1 month free Premium: ${inviteUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <section className="relative overflow-hidden py-12 sm:py-16 bg-[#FFFDF9] border-t border-[#E8E1D6]/70">
      {/* Background watercolor wash glow */}
      <div className="pointer-events-none absolute -bottom-16 -right-16 size-80 rounded-full bg-[#5E55C9]/5 blur-3xl" />
      <div className="pointer-events-none absolute top-10 left-10 size-60 rounded-full bg-[#3B5B8C]/5 blur-2xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#E8E1D6] bg-white p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Title, Subtitle, 3-Step Timeline, Copy Link, Stats */}
            <div className="lg:col-span-8 space-y-8">
              {/* Header Title & Subtitle */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5E55C9]/10 text-[#5E55C9] text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="size-3.5" />
                  <span>Referral Program</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#1F2A44] font-normal tracking-tight">
                  Invite friends, spread brighter tomorrows
                </h2>
                <p className="text-base text-[#475467] leading-relaxed max-w-2xl">
                  Give your friends 1 month of Premium and get 1 month free when they join.
                </p>
              </div>

              {/* 3-Step Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
                {/* Step 1 */}
                <div className="relative flex flex-col items-start gap-3 p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8E1D6]/60">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-[#5E55C9]/10 text-[#5E55C9]">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1F2A44]">1. Send your invite</div>
                    <div className="text-xs text-[#475467] mt-0.5">Share your unique link</div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex flex-col items-start gap-3 p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8E1D6]/60">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-[#3B5B8C]/10 text-[#3B5B8C]">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1F2A44]">2. Your friend joins</div>
                    <div className="text-xs text-[#475467] mt-0.5">They create an account</div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative flex flex-col items-start gap-3 p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8E1D6]/60">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-[#3D5C4A]/10 text-[#3D5C4A]">
                    <Gift className="size-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1F2A44]">3. You both get rewarded</div>
                    <div className="text-xs text-[#475467] mt-0.5">Each gets 1 month free</div>
                  </div>
                </div>
              </div>

              {/* Copy Link Input & Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-xl">
                  <div className="relative flex-1 flex items-center rounded-xl border border-[#E8E1D6] bg-[#FFFDF9] px-3.5 py-2.5 text-xs sm:text-sm font-mono text-[#1F2A44] truncate select-all">
                    <span className="truncate">{inviteUrl}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5E55C9] hover:bg-[#4D4AB8] active:scale-[0.98] text-white px-5 py-2.5 font-semibold text-sm transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="size-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" />
                        <span>Copy invite link</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Share Links */}
                <div className="flex items-center gap-3 pt-1 text-xs text-[#475467]">
                  <span className="font-medium">Or share directly:</span>
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E1D6] hover:bg-[#F5EFE6] text-[#1F2A44] transition-colors cursor-pointer"
                  >
                    <Share2 className="size-3 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>
                  <a
                    href={`mailto:?subject=Join me on Financial Dream Planner&body=Hey, join using my link to get 1 month of Premium free: ${inviteUrl}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E1D6] hover:bg-[#F5EFE6] text-[#1F2A44] transition-colors"
                  >
                    <Mail className="size-3 text-[#3B5B8C]" />
                    <span>Email</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Friends Artwork + Script Quote */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center">
              <div className="relative max-w-xs sm:max-w-sm">
                {/* Script Quote */}
                <div className="text-center mb-2 transform -rotate-2">
                  <span className="font-script text-2xl sm:text-3xl text-[#3B5B8C] drop-shadow-xs italic">
                    Brighter tomorrows are better together.
                  </span>
                </div>

                {/* Watercolor Friends Illustration */}
                <div className="relative overflow-hidden rounded-2xl p-2 flex justify-center">
                  <Image
                    src="/Assets/help/referral_friends.png"
                    alt="Brighter tomorrows are better together - Friends embracing"
                    width={220}
                    height={250}
                    className="rounded-xl object-contain drop-shadow-sm hover:scale-[1.02] transition-transform"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
