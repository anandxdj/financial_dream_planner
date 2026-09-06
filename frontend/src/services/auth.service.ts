import { API_BASE_URL, API_PATHS } from "@/constants/api";
import { api } from "@/lib/api";
import type { AuthResponse, User } from "@/types/auth";
import type { LoginValues, RegisterValues } from "@/schemas/auth";

export async function register(values: RegisterValues) {
  const { data } = await api.post<AuthResponse>(API_PATHS.register, values);
  return data;
}

export async function login(values: LoginValues) {
  const { data } = await api.post<AuthResponse>(API_PATHS.login, values);
  return data;
}

export async function logout() {
  await api.post(API_PATHS.logout);
}

export async function refresh() {
  const { data } = await api.post<AuthResponse>(API_PATHS.refresh);
  return data;
}

export async function getMe() {
  const { data } = await api.get<{ user: User }>(API_PATHS.me);
  return data.user;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<{ message: string }>(API_PATHS.forgotPassword, { email });
  return data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post<{ message: string }>(API_PATHS.resetPassword, {
    token,
    password,
  });
  return data;
}

export async function verifyEmail(token: string) {
  const { data } = await api.post<AuthResponse>(API_PATHS.verifyEmail, { token });
  return data;
}

export function getGoogleAuthUrl() {
  return `${API_BASE_URL}${API_PATHS.google}`;
}

export async function startOidcAuth() {
  const { data } = await api.post<{ authorizationUrl: string }>(API_PATHS.oidcStart, {
    redirectUri: `${window.location.origin}${"/auth/callback"}`,
    clientId: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID ?? "web",
    mode: "browser",
  });
  return data.authorizationUrl;
}
