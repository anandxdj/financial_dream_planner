"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/planner/app-shell";
import { DemoBanner } from "@/components/planner/demo-banner";
import { useMe } from "@/hooks/use-me";
import { useLogout } from "@/hooks/use-logout";

export function PlannerShell({ children }: { children: ReactNode }) {
  const me = useMe();
  const logout = useLogout();

  return (
    <AppShell
      onLogout={() => logout.mutate()}
      isLoggingOut={logout.isPending}
      user={me.data ? { name: me.data.displayName, email: me.data.email } : undefined}
    >
      <DemoBanner />
      {children}
    </AppShell>
  );
}
