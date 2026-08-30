import { z } from "zod";
import { userOutputSchema } from "../users/model";

export const registerInputSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(80).trim(),
});
export type RegisterInputSchema = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(1),
});
export type LoginInputSchema = z.infer<typeof loginInputSchema>;

export const forgotPasswordInputSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase().trim()),
});
export type ForgotPasswordInputSchema = z.infer<typeof forgotPasswordInputSchema>;

export const resetPasswordInputSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});
export type ResetPasswordInputSchema = z.infer<typeof resetPasswordInputSchema>;

export const verifyEmailInputSchema = z.object({
  token: z.string().min(1),
});
export type VerifyEmailInputSchema = z.infer<typeof verifyEmailInputSchema>;

export const oidcStartInputSchema = z.object({
  redirectUri: z.string().url(),
  clientId: z.string().min(1).max(120),
  mode: z.enum(["browser", "mobile"]).default("browser"),
  appChallenge: z.string().min(43).max(128).optional(),
}).refine((value) => value.mode === "browser" || Boolean(value.appChallenge), { message: "appChallenge is required for mobile" });
export type OidcStartInput = z.infer<typeof oidcStartInputSchema>;

export const oidcBridgeInputSchema = z.object({ code: z.string().min(1), verifier: z.string().min(43).max(128), redirectUri: z.string().url(), clientId: z.string().min(1).max(120) });
export type OidcBridgeInput = z.infer<typeof oidcBridgeInputSchema>;

export const registerOutputSchema = z.object({
  user: userOutputSchema,
  message: z.string().optional(),
});
export type RegisterOutputSchema = z.infer<typeof registerOutputSchema>;

export const loginOutputSchema = z.object({
  user: userOutputSchema,
});
export type LoginOutputSchema = z.infer<typeof loginOutputSchema>;

export const refreshOutputSchema = loginOutputSchema;
export type RefreshOutputSchema = LoginOutputSchema;

export const logoutOutputSchema = z.undefined();
export type LogoutOutputSchema = z.infer<typeof logoutOutputSchema>;

export const forgotPasswordOutputSchema = z.object({
  message: z.string(),
});
export type ForgotPasswordOutputSchema = z.infer<typeof forgotPasswordOutputSchema>;

export const resetPasswordOutputSchema = z.object({
  message: z.string(),
});
export type ResetPasswordOutputSchema = z.infer<typeof resetPasswordOutputSchema>;

export const verifyEmailOutputSchema = loginOutputSchema;
export type VerifyEmailOutputSchema = LoginOutputSchema;
