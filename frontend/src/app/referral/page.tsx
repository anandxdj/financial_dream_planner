import { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
import { ReferralCard, FinalTrustCta } from "@/features/help";

export const metadata: Metadata = {
  title: "Invite Friends & Earn Rewards - Financial Dream Planner",
  description:
    "Invite your friends to Financial Dream Planner. Give them 1 month of Premium free and receive 1 month free when they join.",
};

export default function ReferralPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF9]">
      <LandingNavbar />
      <main className="flex-1 py-6 sm:py-12">
        <ReferralCard />
        <FinalTrustCta />
      </main>
      <LandingFooter />
    </div>
  );
}
