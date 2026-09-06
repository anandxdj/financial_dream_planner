import { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
import { ContactSupport, FinalTrustCta } from "@/features/help";

export const metadata: Metadata = {
  title: "Contact Us - Financial Dream Planner",
  description:
    "Get in touch with our certified financial planners and customer success team via chat, email, or scheduled call.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF9]">
      <LandingNavbar />
      <main className="flex-1">
        <ContactSupport />
        <FinalTrustCta />
      </main>
      <LandingFooter />
    </div>
  );
}
