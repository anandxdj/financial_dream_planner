"use client";
import type { ReactNode } from "react";
import { AppShell } from "@/components/planner/app-shell";
import { DemoBanner } from "@/components/planner/demo-banner";
import { useMe } from "@/hooks/use-me";
import { useLogout } from "@/hooks/use-logout";
import { secondary } from "./ui";

export function PlannerShell({ children }: { children: ReactNode }) {
  const me = useMe();
  const logout = useLogout();
  return (
    <AppShell
      onLogout={() => logout.mutate()}
      isLoggingOut={logout.isPending}
      user={
        me.data
          ? { name: me.data.displayName, email: me.data.email }
          : { name: "Anand Sharma", email: "demo@example.com" }
      }
    >
      <DemoBanner />
      {children}
    </AppShell>
  );
}

