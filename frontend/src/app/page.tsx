import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { AboutSection } from "@/components/landing/about-section";
import { SecurityFaqSection } from "@/components/landing/security-faq-section";
import { CalculatorPreviewSection } from "@/components/landing/calculator-preview-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#344054] flex flex-col font-sans selection:bg-[#5855D6]/20">
      {/* 01 Navigation */}
      <LandingNavbar />

      <main className="flex-1">
        {/* 01 Hero Section */}
        <HeroSection />

        {/* 02 Features */}
        <FeaturesSection />

        {/* 03 How It Works */}
        <HowItWorksSection />

        {/* 04 Pricing */}
        <PricingSection />

        {/* 05 About */}
        <AboutSection />

        {/* 06 Security & FAQ */}
        <SecurityFaqSection />

        {/* 07 Can I Afford This? Calculator & Interactive Sandbox */}
        <CalculatorPreviewSection />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
