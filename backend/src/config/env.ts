import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(backendRoot, ".env"), quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url().default("redis://127.0.0.1:6379"),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),
  WEB_ORIGIN: z.string().url(),
  API_ORIGIN: z.string().url(),
  COOKIE_SAMESITE: z.enum(["lax", "none", "strict"]).default("lax"),
  REQUIRE_EMAIL_VERIFICATION: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  GOOGLE_REDIRECT_URI: z.string().default(""),
  MAIL_FROM: z.string().default("noreply@localhost"),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  AUTH_ENABLED: z.enum(["true", "false"]).default("true").transform((value) => value === "true"),
  REGISTRATION_ENABLED: z.enum(["true", "false"]).default("true").transform((value) => value === "true"),
  CLOSED_BETA: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  OIDC_ENABLED: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  OIDC_ISSUER: z.string().url().default("https://github.com/anandxdj/id"),
  OIDC_CLIENT_ID: z.string().default(""),
  OIDC_CLIENT_SECRET: z.string().default(""),
  OIDC_REDIRECT_URI: z.string().default(""),
  OIDC_ALLOWED_REDIRECTS: z.string().default(""),
  OIDC_REAUTH_HOURS: z.coerce.number().int().positive().default(24),
  COOKIE_DOMAIN: z.string().default(""),
  STORAGE_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  STORAGE_ENDPOINT: z.string().default(""),
  STORAGE_BUCKET: z.string().default(""),
  STORAGE_ACCESS_KEY_ID: z.string().default(""),
  STORAGE_SECRET_ACCESS_KEY: z.string().default(""),
  STORAGE_REGION: z.string().default("auto"),
}).superRefine((value, ctx) => {
  if (value.STORAGE_ENABLED) {
    if (!value.STORAGE_ENDPOINT || (value.NODE_ENV === "production" && !value.STORAGE_ENDPOINT.startsWith("https://"))) {
      ctx.addIssue({ code: "custom", message: "STORAGE_ENDPOINT must be a valid HTTPS URL when storage is enabled" });
    }
    if (!value.STORAGE_BUCKET) {
      ctx.addIssue({ code: "custom", message: "STORAGE_BUCKET is required when storage is enabled" });
    }
    if (!value.STORAGE_ACCESS_KEY_ID || !value.STORAGE_SECRET_ACCESS_KEY) {
      ctx.addIssue({ code: "custom", message: "STORAGE credentials are required when storage is enabled" });
    }
  }
  if (value.NODE_ENV !== "production") return;
  if (!value.WEB_ORIGIN.startsWith("https://") || !value.API_ORIGIN.startsWith("https://")) {
    ctx.addIssue({ code: "custom", message: "Production auth origins must use HTTPS" });
  }
  if (value.COOKIE_DOMAIN) {
    ctx.addIssue({ code: "custom", message: "COOKIE_DOMAIN must be empty for __Host- cookies" });
  }
  if (value.OIDC_ENABLED && (!value.OIDC_CLIENT_ID || !value.OIDC_CLIENT_SECRET || !value.OIDC_REDIRECT_URI)) {
    ctx.addIssue({ code: "custom", message: "OIDC client settings are required when OIDC is enabled" });
  }
});

export function createEnv(input: NodeJS.ProcessEnv) {
  return envSchema.parse(input);
}

export const env = createEnv(process.env);
export type Env = z.infer<typeof envSchema>;
