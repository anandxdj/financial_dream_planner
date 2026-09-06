// Keep browser requests same-origin in production. The reverse proxy forwards
// /api/v1 to the API service, which keeps cookies and streaming on one origin.
export const API_BASE_URL = process.env.NODE_ENV === "production"
  ? "/api/v1"
  : (process.env.NEXT_PUBLIC_API_URL ?? "/api/v1");
export const API_ORIGIN = process.env.NODE_ENV === "production" ? "" : (process.env.NEXT_PUBLIC_API_ORIGIN ?? "");

export function authCookieNames(production = process.env.NODE_ENV === "production") {
  return {
    access: production ? "__Host-access_token" : "access_token",
    refresh: production ? "__Host-refresh_token" : "refresh_token",
    csrf: production ? "__Host-csrf_token" : "csrf_token",
  } as const;
}
export const COOKIE = authCookieNames();

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  authCallback: "/auth/callback",
  dashboard: "/dashboard",
} as const;

export const API_PATHS = {
  register: "/auth/register",
  login: "/auth/login",
  logout: "/auth/logout",
  refresh: "/auth/refresh",
  google: "/auth/google",
  oidcStart: "/auth/oidc/start",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  verifyEmail: "/auth/verify-email",
  me: "/users/me",
} as const;

export function safeReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return ROUTES.dashboard;
  const path = value.split("?")[0].toLowerCase();
  if (
    path === "/login" ||
    path === "/register" ||
    path === "/auth" ||
    path.startsWith("/auth/") ||
    path === "/forgot-password" ||
    path === "/reset-password" ||
    path === "/verify-email"
  ) {
    return ROUTES.dashboard;
  }
  return value;
}

export function getReturnPath() {
  if (typeof window === "undefined") return ROUTES.dashboard;
  return safeReturnPath(new URLSearchParams(window.location.search).get("next") ?? window.sessionStorage.getItem("fdp:return-path"));
}

export function rememberReturnPath(value: string | null | undefined) {
  if (typeof window !== "undefined") window.sessionStorage.setItem("fdp:return-path", safeReturnPath(value));
}

export function clearReturnPath() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem("fdp:return-path");
}

export const QUERY_KEYS = {
  me: ["me"] as const,
};
