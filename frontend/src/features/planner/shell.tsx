"use client";
import type { ReactNode } from "react";
import { AppShell } from "@/components/planner/app-shell";
import { useMe } from "@/hooks/use-me";
import { useLogout } from "@/hooks/use-logout";
import { secondary } from "./ui";
export function PlannerShell({ children }: { children: ReactNode }) {
  const me = useMe(); const logout = useLogout();
  return <AppShell headerActions={<button className={secondary} onClick={() => logout.mutate()} disabled={logout.isPending}>Sign out</button>} user={me.data ? { name: me.data.displayName, email: me.data.email } : undefined}>{children}</AppShell>;
}
