import type { Request, Response } from "express";
import { env } from "../../config/env";
import { clearAuthCookies, setAuthCookies } from "../../shared/middleware/cookies";
import { getOptionalRefreshToken, getRefreshToken, getRequestMeta } from "../../shared/middleware/require-auth";
import * as authService from "./auth.service";
import type {
  ForgotPasswordInputSchema,
  LoginInputSchema,
  RegisterInputSchema,
  ResetPasswordInputSchema,
  VerifyEmailInputSchema,
  OidcStartInput,
  OidcBridgeInput,
} from "./model";
import { OidcService } from "./oidc.service";

const oidc = new OidcService();

function respondWithSession(
  res: Response,
  payload: { accessToken: string; refreshToken: string; user: unknown },
  status = 200,
) {
  setAuthCookies(res, payload.accessToken, payload.refreshToken);
  res.status(status).json({ user: payload.user });
}

export async function register(req: Request, res: Response) {
  const result = await authService.register(req.body as RegisterInputSchema, getRequestMeta(req));
  if (!result.tokens) {
    res.status(201).json({
      user: result.user,
      message: "Check your email to verify your account",
    });
    return;
  }
  respondWithSession(res, result.tokens, 201);
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body as LoginInputSchema, getRequestMeta(req));
  respondWithSession(res, result);
}

export async function refresh(req: Request, res: Response) {
  const result = await authService.refresh(getRefreshToken(req), getRequestMeta(req));
  respondWithSession(res, result);
}

export async function logout(req: Request, res: Response) {
  await authService.logout(getOptionalRefreshToken(req));
  clearAuthCookies(res);
  res.status(204).send();
}

export async function googleStart(_req: Request, res: Response) {
  const url = await authService.startGoogleAuth();
  res.redirect(url);
}

export async function googleCallback(req: Request, res: Response) {
  const code = typeof req.query.code === "string" ? req.query.code : undefined;
  const state = typeof req.query.state === "string" ? req.query.state : undefined;
  const result = await authService.googleCallback(code, state, getRequestMeta(req));
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.redirect(`${env.WEB_ORIGIN}/auth/callback`);
}

export async function forgotPassword(req: Request, res: Response) {
  const body = req.body as ForgotPasswordInputSchema;
  await authService.forgotPassword(body.email);
  res.json({ message: "If that email exists, a reset link has been sent" });
}

export async function resetPassword(req: Request, res: Response) {
  await authService.resetPassword(req.body as ResetPasswordInputSchema);
  res.json({ message: "Password updated. Sign in with your new password." });
}

export async function verifyEmail(req: Request, res: Response) {
  const body = req.body as VerifyEmailInputSchema;
  const user = await authService.verifyEmail(body.token);
  res.json({ user });
}

export async function oidcStart(req: Request, res: Response) {
  const url = await oidc.start(req.body as OidcStartInput);
  res.json({ authorizationUrl: url });
}

export async function oidcCallback(req: Request, res: Response) {
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const result = await oidc.callback(code, state, getRequestMeta(req));
  if (result.kind === "browser") {
    setAuthCookies(res, result.session.accessToken, result.session.refreshToken);
    res.redirect(result.redirectUri);
    return;
  }
  const redirect = new URL(result.redirectUri);
  redirect.searchParams.set("code", result.bridgeCode);
  res.redirect(redirect.toString());
}

export async function oidcBridge(req: Request, res: Response) {
  const session = await oidc.exchangeBridge(req.body as OidcBridgeInput);
  res.json(session);
}
