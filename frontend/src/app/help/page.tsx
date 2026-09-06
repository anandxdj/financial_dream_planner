import { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
import { HelpHero, FaqHub, ContactSupport, FinalTrustCta } from "@/features/help";

export const metadata: Metadata = {
  title: "Help & Support - Financial Dream Planner",
  description:
    "Find answers, browse FAQs, contact support, and learn how to optimize your financial journey with Financial Dream Planner.",
};

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF9]">
      <LandingNavbar />
      <main className="flex-1">
        <HelpHero />
        <FaqHub />
        <ContactSupport />
        <FinalTrustCta />
      </main>
      <LandingFooter />
    </div>
  );
}
