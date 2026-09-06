"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  Target,
  Compass,
  Landmark,
  Settings,
  Menu,
  X,
  Sparkles,
  User,
  LogOut,
  GitBranch,
  TrendingUp,
  Wallet,
  MessageCircleMore,
  FileText,
  Bell,
  Smartphone,
  Sliders,
  Search,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export const DEFAULT_PLANNER_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Goals", href: "/dashboard/goals", icon: Target },
  { label: "Transactions", href: "/dashboard/transactions", icon: ReceiptText },
  { label: "Plan", href: "/dashboard/plan", icon: Compass },
  { label: "AI Copilot", href: "/dashboard/ai", icon: MessageCircleMore },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export interface AppShellProps {
  children: React.ReactNode;
  activePath?: string;
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
  navigation?: NavItem[];
  headerActions?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

export function AppShell({
  children,
  activePath,
  user,
  navigation = DEFAULT_PLANNER_NAV,
  headerActions,
  title,
  subtitle,
  className,
  onLogout,
  isLoggingOut,
}: AppShellProps) {
  const currentPathname = usePathname();
  const effectivePath = activePath ?? currentPathname ?? "/dashboard";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const drawerRef = React.useRef<HTMLDivElement | null>(null);

  // Close drawer on path change
  const [prevPath, setPrevPath] = useState(effectivePath);
  if (prevPath !== effectivePath) {
    setPrevPath(effectivePath);
    setDrawerOpen(false);
  }

  // Focus management and restoration for mobile drawer
  useEffect(() => {
    if (drawerOpen) {
      // Focus close button when drawer opens
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    } else {
      // Restore focus to trigger button when drawer closes
      triggerRef.current?.focus();
    }
  }, [drawerOpen]);

  // Handle escape key and focus trap inside drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!drawerOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setDrawerOpen(false);
        return;
      }

      if (e.key === "Tab" && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const renderNavLinks = (onClick?: () => void) => (
    <nav className="space-y-1.5 px-3" aria-label="Main Navigation">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isPlanningRoute =
          item.href === "/dashboard/plan" &&
          (effectivePath.startsWith("/dashboard/plan") ||
            effectivePath.startsWith("/dashboard/scenarios") ||
            effectivePath.startsWith("/dashboard/loans") ||
            effectivePath.startsWith("/dashboard/investments"));

        const isTransactionsRoute =
          item.href === "/dashboard/transactions" &&
          (effectivePath.startsWith("/dashboard/transactions") ||
            effectivePath.startsWith("/dashboard/accounts"));

        const isSettingsRoute =
          item.href === "/dashboard/settings" &&
          effectivePath.startsWith("/dashboard/settings");

        const isActive =
          item.href === "/dashboard"
            ? effectivePath === "/dashboard"
            : isPlanningRoute || isTransactionsRoute || isSettingsRoute || effectivePath.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-medium transition-colors outline-none",
              "focus-visible:ring-2 focus-visible:ring-[#5E55C9] focus-visible:ring-offset-2",
              isActive
                ? "bg-[#FFF9F0] text-[#1F2A44] border border-[#E8E1D6] font-semibold shadow-xs"
                : "text-[#344054] hover:bg-[#FFF9F0]/80 hover:text-[#1F2A44]"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {Icon && (
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  isActive ? "text-[#5E55C9]" : "text-[#475467]"
                )}
              />
            )}
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && (
              <span className="rounded-full bg-[#E8E1D6]/60 px-2 py-0.5 text-[11px] font-semibold text-[#1F2A44]">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className={cn("min-h-screen bg-[#FFF9F0] text-[#344054] flex font-sans", className)}>
      {/* Desktop Sidebar (248px fixed width) */}
      <aside
        className="hidden lg:flex w-[248px] shrink-0 flex-col justify-between border-r border-[#E8E1D6] bg-[#FFFCF8] h-screen sticky top-0 z-30"
        aria-label="Sidebar navigation"
      >
        <div>
          {/* Logo / Brand Header */}
          <div className="h-[68px] flex items-center px-5 border-b border-[#E8E1D6]">
            <Link
              href="/"
              className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] rounded-md min-h-[44px]"
            >
              <div className="flex size-8 items-center justify-center rounded-[8px] bg-[#1F2A44] text-[#E6B46A]">
                <Sparkles className="size-4" />
              </div>
              <div className="leading-tight">
                <span className="font-serif text-base font-medium tracking-tight text-[#1F2A44] block">
                  Dream Planner
                </span>
                <span className="text-[10px] text-[#3D5C4A] font-semibold tracking-wider uppercase block">
                  Living Plan
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="py-4">{renderNavLinks()}</div>
        </div>

        {/* User profile / Footer section */}
        <div className="p-3 border-t border-[#E8E1D6] bg-[#FFF9F0]/60 space-y-2">
          <div className="px-2 py-1.5 rounded-lg bg-[#FFFCF8] border border-[#E8E1D6]/80 text-center">
            <p className="text-[11px] font-serif italic text-[#7D5200]/90 leading-snug">
              &ldquo;A clearer tomorrow, one thoughtful step today.&rdquo;
            </p>
          </div>

          {user ? (
            <div className="flex items-center justify-between gap-1 p-2 rounded-[10px] bg-[#FFFCF8] border border-[#E8E1D6]/80 hover:border-[#E8E1D6] transition-colors">
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity"
                title="View settings"
              >
                <div className="size-8 rounded-full bg-[#E8E1D6] flex items-center justify-center text-[#1F2A44] shrink-0 font-medium text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : <User className="size-4" />}
                </div>
                <div className="min-w-0 truncate">
                  <p className="text-xs font-semibold text-[#1F2A44] truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-[11px] text-[#475467] truncate">
                    {user.email || ""}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-0.5 shrink-0">
                {/* Notifications Bell in Sidebar */}
                <Link
                  href="/dashboard/notifications"
                  className="relative p-1.5 rounded-lg text-[#475467] hover:bg-[#FFF9F0] hover:text-[#1F2A44] transition-colors"
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <Bell className="size-4" />
                  <span className="absolute top-1 right-1 size-2 bg-[#5E55C9] rounded-full ring-1 ring-white" />
                </Link>

                {/* Sign Out Button in Sidebar */}
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    disabled={isLoggingOut}
                    className="p-1.5 rounded-lg text-[#667085] hover:text-[#B42318] hover:bg-[#FEF3F2] transition-colors cursor-pointer disabled:opacity-50"
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <LogOut className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-[#475467] px-2 py-0.5 flex items-center justify-between">
              <span>Financial Dream Planner</span>
              <span className="text-[#3D5C4A] font-medium">v1.0</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Minimal Mobile-Only Header (Viewport < 1024px, completely hidden on lg desktop screens) */}
        <header className="lg:hidden h-12 shrink-0 sticky top-0 z-20 border-b border-[#E8E1D6] bg-[#FFFCF8]/95 backdrop-blur-md px-4 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#5E55C9] rounded-md min-h-[40px]"
          >
            <div className="flex size-7 items-center justify-center rounded-[7px] bg-[#1F2A44] text-[#E6B46A]">
              <Sparkles className="size-3.5" />
            </div>
            <div className="leading-tight">
              <span className="font-serif text-sm font-medium tracking-tight text-[#1F2A44] block">
                Dream Planner
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {/* Mobile Notifications Link */}
            <Link
              href="/dashboard/notifications"
              className="relative p-2 rounded-lg text-[#475467] hover:bg-[#FFF9F0] hover:text-[#1F2A44] transition-colors"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-2 bg-[#5E55C9] rounded-full ring-2 ring-[#FFFCF8]" />
            </Link>

            {/* Mobile Drawer Trigger (visible under 1024px) */}
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-[10px] border border-[#E8E1D6] bg-[#FFFCF8] text-[#1F2A44] hover:bg-[#FFF9F0] focus-visible:ring-2 focus-visible:ring-[#5E55C9] cursor-pointer shrink-0"
              aria-label="Open navigation drawer"
              aria-expanded={drawerOpen}
              aria-controls="mobile-nav-drawer"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer (Viewport < 1024px) */}
        {drawerOpen && (
          <div
            id="mobile-nav-drawer"
            className="lg:hidden fixed inset-0 z-50 flex"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-nav-title"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-[#1F2A44]/30 backdrop-blur-xs transition-opacity"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer Sheet (248px width) */}
            <div
              ref={drawerRef}
              className="relative w-[248px] max-w-[80vw] bg-[#FFFCF8] h-full shadow-2xl flex flex-col justify-between border-r border-[#E8E1D6] z-10 outline-none"
              tabIndex={-1}
            >
              <div>
                {/* Drawer Header */}
                <div className="h-[68px] flex items-center justify-between px-4 border-b border-[#E8E1D6]">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-[6px] bg-[#1F2A44] text-[#E6B46A]">
                      <Sparkles className="size-3.5" />
                    </div>
                    <span id="mobile-nav-title" className="font-serif text-base text-[#1F2A44]">
                      Dream Planner
                    </span>
                  </div>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-[10px] text-[#344054] hover:bg-[#FFF9F0] focus-visible:ring-2 focus-visible:ring-[#5E55C9] cursor-pointer"
                    aria-label="Close navigation drawer"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Drawer Navigation */}
                <div className="py-4">{renderNavLinks(() => setDrawerOpen(false))}</div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[#E8E1D6] bg-[#FFF9F0]/50 text-xs text-[#475467]">
                <Link
                  href="/auth/logout"
                  className="flex min-h-[44px] items-center gap-2 text-[#A13F39] hover:underline"
                >
                  <LogOut className="size-4" />
                  <span>Sign out</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
