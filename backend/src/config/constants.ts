export {
  CHALLENGE_TYPE,
  DEFAULT_ROLES,
  IDENTITY_PROVIDER,
  SESSION_REVOKE_REASON,
  USER_STATUS,
} from "../database/constants";

export const COOKIE = {
  access: process.env.NODE_ENV === "production" ? "__Host-access_token" : "access_token",
  refresh: process.env.NODE_ENV === "production" ? "__Host-refresh_token" : "refresh_token",
  csrf: process.env.NODE_ENV === "production" ? "__Host-csrf_token" : "csrf_token",
} as const;

export const GOOGLE_SCOPES = ["openid", "email", "profile"] as const;
