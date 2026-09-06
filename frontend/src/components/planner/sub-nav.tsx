"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  GitBranch,
  Landmark,
  TrendingUp,
  ReceiptText,
  Wallet,
  User,
  Smartphone,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SubNavTab {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  matchExact?: boolean;
}

const PLANNING_TABS: SubNavTab[] = [
  { label: "Roadmap", href: "/dashboard/plan", icon: Compass, matchExact: true },
  { label: "Scenarios", href: "/dashboard/scenarios", icon: GitBranch },
  { label: "Loans & Debt", href: "/dashboard/loans", icon: Landmark },
  { label: "Investments", href: "/dashboard/investments", icon: TrendingUp },
];

const TRANSACTIONS_TABS: SubNavTab[] = [
  { label: "Transactions", href: "/dashboard/transactions", icon: ReceiptText },
  { label: "Bank Accounts", href: "/dashboard/accounts", icon: Wallet },
];

const SETTINGS_TABS: SubNavTab[] = [
  { label: "Profile & Security", href: "/dashboard/settings", icon: User, matchExact: true },
  { label: "Integrations & Sync", href: "/dashboard/settings/integrations", icon: Smartphone },
  { label: "Notification Rules", href: "/dashboard/settings/notifications", icon: Sliders },
];

function SubNavBar({ tabs, ariaLabel }: { tabs: SubNavTab[]; ariaLabel: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-[#F4EDE2]/80 border border-[#E8E1D6] shadow-2xs mb-6 overflow-x-auto max-w-full"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.matchExact
          ? pathname === tab.href
          : pathname?.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-h-[38px] items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-all outline-none",
              "focus-visible:ring-2 focus-visible:ring-[#5E55C9] focus-visible:ring-offset-1",
              isActive
                ? "bg-white text-[#1F2A44] font-semibold shadow-xs border border-[#E8E1D6]"
                : "text-[#475467] hover:text-[#1F2A44] hover:bg-white/60"
            )}
          >
            <Icon
              className={cn(
                "size-3.5 sm:size-4 shrink-0 transition-colors",
                isActive ? "text-[#5E55C9]" : "text-[#667085]"
              )}
              aria-hidden="true"
            />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function PlanningSubNav() {
  return <SubNavBar tabs={PLANNING_TABS} ariaLabel="Planning sections navigation" />;
}

export function TransactionsSubNav() {
  return <SubNavBar tabs={TRANSACTIONS_TABS} ariaLabel="Transactions and accounts navigation" />;
}

export function SettingsSubNav() {
  return <SubNavBar tabs={SETTINGS_TABS} ariaLabel="Settings sections navigation" />;
}
