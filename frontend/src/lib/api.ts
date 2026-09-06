import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL, API_PATHS, COOKIE, ROUTES, safeReturnPath } from "@/constants/api";
import type { ApiErrorBody } from "@/types/auth";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const SKIP_REFRESH = new Set([
  API_PATHS.login,
  API_PATHS.register,
  API_PATHS.logout,
  API_PATHS.refresh,
  API_PATHS.forgotPassword,
  API_PATHS.resetPassword,
  API_PATHS.verifyEmail,
]);

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  config.headers.set("x-request-id", crypto.randomUUID());
  const method = (config.method ?? "get").toUpperCase();
  if (typeof document !== "undefined" && !["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrf = document.cookie.split("; ").find((entry) => entry.startsWith(`${COOKIE.csrf}=`) || entry.startsWith("csrf_token=") || entry.startsWith("__Host-csrf_token="))?.split("=").slice(1).join("=");
    if (csrf) config.headers.set("x-csrf-token", decodeURIComponent(csrf));
  }
  return config;
});

let refreshPromise: Promise<void> | null = null;

export function refreshSession() {
  return refreshPromise ?? (refreshPromise = api.post(API_PATHS.refresh).then(() => undefined).finally(() => {
    refreshPromise = null;
  }));
}

function isRefreshExempt(url: string) {
  return [...SKIP_REFRESH].some((path) => url === path || url.endsWith(path));
}

/** Fetch transport shared by generated SDK and Axios, including one refresh gate. */
export async function coordinatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const buildRequest = () => {
    const request = new Request(input, init);
    const method = request.method.toUpperCase();
    if (!["GET", "HEAD", "OPTIONS"].includes(method) && typeof document !== "undefined") {
      const csrf = document.cookie.split("; ").find((entry) => entry.startsWith(`${COOKIE.csrf}=`) || entry.startsWith("csrf_token=") || entry.startsWith("__Host-csrf_token="))?.split("=").slice(1).join("=");
      if (csrf) request.headers.set('x-csrf-token', decodeURIComponent(csrf));
    }
    if (!request.headers.has('x-request-id')) request.headers.set('x-request-id', crypto.randomUUID());
    return request;
  };

  const initial = buildRequest();
  const response = await fetch(initial);
  if (response.status !== 401 || isRefreshExempt(new URL(initial.url).pathname)) return response;
  try {
    await refreshSession();
    return fetch(buildRequest());
  } catch (error) {
    redirectToLogin();
    throw error;
  }
}

function shouldSkipRefresh(config?: RetryConfig) {
  const url = config?.url ?? "";
  return [...SKIP_REFRESH].some((path) => url === path || url.endsWith(path));
}

export function loginPathForLocation(location: Pick<Location, "pathname" | "search">) {
  const next = `${location.pathname}${location.search}`;
  const destination = safeReturnPath(next);
  return `${ROUTES.login}?next=${encodeURIComponent(destination)}`;
}

function redirectToLogin() {
  if (typeof window !== "undefined" && window.location.pathname !== ROUTES.login) {
    // Interceptor is outside React; a full navigation resets stale auth state.
    window.location.href = loginPathForLocation(window.location);
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetryConfig | undefined;
    if (error.response?.status !== 401 || !original || original._retry || shouldSkipRefresh(original)) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const pending = refreshSession();
      await pending;
      return api(original);
    } catch (refreshError) {
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  },
);

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.error?.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
