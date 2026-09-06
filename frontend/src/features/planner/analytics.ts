"use client";
type FunnelEvent = "affordability_completed" | "onboarding_completed" | "first_plan_generated" | "plan_updated";
/** Integrators may subscribe to these events; entered values are never attached. */
export function trackFunnel(name: FunnelEvent) { window.dispatchEvent(new CustomEvent("planner:funnel", { detail: { name } })); }
