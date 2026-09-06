"use client";

import { useState } from "react";
import Image from "next/image";
import { Landmark, CreditCard, TrendingUp, Wallet, CheckCircle2, RefreshCw, ShieldCheck, Check } from "lucide-react";
import { toast } from "sonner";

export interface IntegrationAccount {
  id: string;
  name: string;
  description: string;
  badge: string;
  icon: typeof Landmark;
  connected: boolean;
  institutionCount?: string;
  lastSynced?: string;
}

const DEFAULT_ACCOUNTS: IntegrationAccount[] = [
  {
    id: "bank-accounts",
    name: "Bank Accounts",
    description: "Link securely with 128+ banks",
    badge: "128+ banks",
    icon: Landmark,
    connected: true,
    institutionCount: "HDFC, ICICI, SBI",
    lastSynced: "Today, 10:45 AM",
  },
  {
    id: "credit-cards",
    name: "Credit Cards",
    description: "Track spending in one place",
    badge: "Auto Statement",
    icon: CreditCard,
    connected: false,
    institutionCount: "Axis, Amazon Pay, OneCard",
  },
  {
    id: "investments",
    name: "Investments",
    description: "Sync your portfolio and net worth",
    badge: "MF & Equities",
    icon: TrendingUp,
    connected: true,
    institutionCount: "Zerodha & Groww",
    lastSynced: "Yesterday, 6:00 PM",
  },
  {
    id: "upi-wallets",
    name: "UPI & Wallets",
    description: "Connect UPI, wallets and more",
    badge: "Instant Sync",
    icon: Wallet,
    connected: false,
    institutionCount: "PhonePe, GPay, Paytm",
  },
];

interface ConnectedAppsProps {
  isDashboardLayout?: boolean;
}

export function ConnectedApps({ isDashboardLayout = false }: ConnectedAppsProps) {
  const [accounts, setAccounts] = useState<IntegrationAccount[]>(DEFAULT_ACCOUNTS);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const toggleConnection = (id: string, currentlyConnected: boolean) => {
    if (currentlyConnected) {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === id ? { ...acc, connected: false, lastSynced: undefined } : acc
        )
      );
      toast.info("Account disconnected", {
        description: "Historical data remains archived in your vault.",
      });
    } else {
      setConnectingId(id);
      setTimeout(() => {
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === id
              ? {
                  ...acc,
                  connected: true,
                  lastSynced: "Just now",
                }
              : acc
          )
        );
        setConnectingId(null);
        toast.success("Account connected successfully!", {
          description: "Encrypted read-only synchronization completed.",
        });
      }, 700);
    }
  };

  const handleSyncAll = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: "Syncing accounts via Account Aggregator...",
        success: "All connected accounts refreshed with latest transactions.",
        error: "Failed to refresh accounts.",
      }
    );
  };

  return (
    <section className={`py-10 sm:py-16 ${isDashboardLayout ? "bg-transparent" : "bg-[#FFFDF9] border-t border-[#E8E1D6]/70"}`}>
      <div className={`mx-auto ${isDashboardLayout ? "max-w-6xl px-0" : "max-w-7xl px-4 sm:px-6 lg:px-8"}`}>
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3D5C4A]/10 text-[#3D5C4A] text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="size-3.5" />
              <span>RBI Account Aggregator Compliant</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#1F2A44] font-normal tracking-tight">
              Connect your accounts
            </h2>
            <p className="text-sm sm:text-base text-[#475467] leading-relaxed">
              Link your favorite apps to get a complete view of your finances.
            </p>
          </div>

          {isDashboardLayout && (
            <button
              type="button"
              onClick={handleSyncAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8E1D6] bg-white hover:bg-[#F5EFE6] text-sm font-medium text-[#1F2A44] transition-colors self-start md:self-auto cursor-pointer shadow-2xs"
            >
              <RefreshCw className="size-4 text-[#5E55C9]" />
              <span>Sync All Accounts</span>
            </button>
          )}
        </div>

        {/* Content Layout: 4 Cards + Side Script */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Integration Cards Grid */}
          <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {accounts.map((item) => {
              const Icon = item.icon;
              const isConnecting = connectingId === item.id;
              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between rounded-2xl border p-5.5 transition-all bg-white shadow-2xs ${
                    item.connected
                      ? "border-[#3D5C4A]/30 ring-1 ring-[#3D5C4A]/20"
                      : "border-[#E8E1D6] hover:border-[#5E55C9]/40 hover:shadow-xs"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header with Icon and Connection status pill */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex size-12 items-center justify-center rounded-xl ${
                          item.connected
                            ? "bg-[#3D5C4A]/10 text-[#3D5C4A]"
                            : "bg-[#5E55C9]/10 text-[#5E55C9]"
                        }`}
                      >
                        <Icon className="size-6" />
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F5EFE6] text-[#475467]">
                        {item.badge}
                      </span>
                    </div>

                    {/* Card Title & Description */}
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-[#1F2A44]">{item.name}</h3>
                      <p className="text-xs text-[#475467] leading-relaxed">{item.description}</p>
                    </div>

                    {/* Metadata / Institution summary */}
                    <div className="rounded-lg bg-[#FFFDF9] border border-[#E8E1D6]/60 p-2 text-[11px] text-[#475467] space-y-0.5">
                      <div className="font-medium text-[#1F2A44] truncate">{item.institutionCount}</div>
                      {item.connected && (
                        <div className="flex items-center gap-1 text-[#3D5C4A]">
                          <CheckCircle2 className="size-3" />
                          <span>Synced: {item.lastSynced}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connect / Connected Button */}
                  <div className="mt-5 pt-3 border-t border-[#E8E1D6]/60">
                    <button
                      type="button"
                      disabled={isConnecting}
                      onClick={() => toggleConnection(item.id, item.connected)}
                      className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-70 ${
                        item.connected
                          ? "bg-[#3D5C4A]/10 text-[#3D5C4A] hover:bg-[#A13F39]/10 hover:text-[#A13F39]"
                          : "bg-[#5E55C9] hover:bg-[#4D4AB8] active:scale-[0.98] text-white"
                      }`}
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw className="size-3.5 animate-spin" />
                          <span>Connecting...</span>
                        </>
                      ) : item.connected ? (
                        <>
                          <Check className="size-3.5" />
                          <span>Connected</span>
                        </>
                      ) : (
                        <span>Connect</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Side Quote & Botanical Leaves */}
          <div className="lg:col-span-3 flex lg:flex-col items-center lg:items-start justify-center lg:justify-start gap-4">
            <div className="space-y-4 text-center lg:text-left max-w-xs">
              <div className="transform -rotate-1">
                <span className="font-script text-2xl sm:text-3xl text-[#3B5B8C] drop-shadow-xs italic">
                  All your finances, working together.
                </span>
              </div>
              <p className="text-xs text-[#475467]/80 leading-relaxed hidden lg:block">
                Aggregate real-time savings, debt balances, and mutual fund NAVs with a single consent token.
              </p>
              <div className="hidden lg:flex justify-start pt-2">
                <Image
                  src="/Assets/Nature Elements/leafy_twig.png"
                  alt="Nature element twig"
                  width={80}
                  height={160}
                  className="opacity-75 rotate-45 drop-shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
