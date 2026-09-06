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
  { label: "Transactions", href: "/dashboard/transactions", icon: ReceiptText },
  { label: "Goals", href: "/dashboard/goals", icon: Target },
  { label: "Plan", href: "/dashboard/plan", icon: Compass },
  { label: "Scenarios", href: "/dashboard/scenarios", icon: GitBranch },
  { label: "Loans", href: "/dashboard/loans", icon: Landmark },
  { label: "Investments", href: "/dashboard/investments", icon: TrendingUp },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
  { label: "AI planner", href: "/dashboard/ai", icon: MessageCircleMore },
  { label: "Accounts", href: "/dashboard/accounts", icon: Wallet },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Data sources", href: "/dashboard/settings/data-sources", icon: Smartphone },
  { label: "Notification preferences", href: "/dashboard/settings/notifications", icon: Sliders },
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
        const isActive =
          item.href === "/dashboard" || item.href === "/dashboard/settings"
            ? effectivePath === item.href
            : effectivePath.startsWith(item.href);

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
        <div className="p-3 border-t border-[#E8E1D6] bg-[#FFF9F0]/40">
          {user ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-[10px] hover:bg-[#FFF9F0]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-full bg-[#E8E1D6] flex items-center justify-center text-[#1F2A44] shrink-0">
                  <User className="size-4" />
                </div>
                <div className="min-w-0 truncate">
                  <p className="text-xs font-semibold text-[#1F2A44] truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-[11px] text-[#475467] truncate">
                    {user.email || ""}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-[#475467] px-2 py-1 flex items-center justify-between">
              <span>Financial Dream Planner</span>
              <span className="text-[#3D5C4A] font-medium">v1.0</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header (68px height) */}
        <header className="h-[68px] shrink-0 sticky top-0 z-20 border-b border-[#E8E1D6] bg-[#FFFCF8]/90 backdrop-blur-md px-4 md:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Drawer Trigger (visible under 1024px) */}
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-[10px] border border-[#E8E1D6] bg-[#FFFCF8] text-[#1F2A44] hover:bg-[#FFF9F0] focus-visible:ring-2 focus-visible:ring-[#5E55C9] cursor-pointer"
              aria-label="Open navigation drawer"
              aria-expanded={drawerOpen}
              aria-controls="mobile-nav-drawer"
            >
              <Menu className="size-5" />
            </button>

            {/* Title / Subtitle */}
            <div className="min-w-0">
              {title && (
                <h1 className="font-serif text-lg md:text-xl font-normal text-[#1F2A44] truncate leading-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-xs text-[#475467] truncate hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Header Action Slot */}
          {headerActions && (
            <div className="flex items-center gap-2.5 shrink-0">{headerActions}</div>
          )}
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
