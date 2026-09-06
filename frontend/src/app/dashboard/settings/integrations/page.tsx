import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ConnectedApps } from "@/features/help";
import { SettingsSubNav } from "@/components/planner/sub-nav";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6 pb-12">
      <SettingsSubNav />
      {/* Header with back navigation & breadcrumb */}
      <div className="flex items-center justify-between border-b border-[#E8E1D6] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/settings"
            className="flex size-9 items-center justify-center rounded-xl border border-[#E8E1D6] bg-white text-[#475467] hover:bg-[#F5EFE6] hover:text-[#1F2A44] transition-colors"
            aria-label="Back to settings"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-[#475467]">
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <span>/</span>
              <Link href="/dashboard/settings" className="hover:underline">Settings</Link>
              <span>/</span>
              <span className="text-[#1F2A44] font-medium">Integrations</span>
            </div>
            <h1 className="text-xl font-bold text-[#1F2A44] mt-0.5">
              Account Integrations &amp; Data Sync
            </h1>
          </div>
        </div>

        <Link
          href="/referral"
          className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#5E55C9]/10 text-[#5E55C9] hover:bg-[#5E55C9]/20 text-xs font-semibold transition-colors"
        >
          <Sparkles className="size-3.5" />
          <span>Invite Friends</span>
        </Link>
      </div>

      <ConnectedApps isDashboardLayout={true} />
    </div>
  );
}
