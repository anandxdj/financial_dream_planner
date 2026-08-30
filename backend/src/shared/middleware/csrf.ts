import type { NextFunction, Request, Response } from "express";
import { COOKIE } from "../../config/constants";
import { env } from "../../config/env";
import { AppError } from "../errors/app-error";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function protectCookieRequests(req: Request, _res: Response, next: NextFunction) {
  const hasAuthCookie = Boolean(req.cookies?.[COOKIE.access] || req.cookies?.[COOKIE.refresh]);
  if (SAFE_METHODS.has(req.method) || req.header("authorization") || !hasAuthCookie) return next();
  const origin = req.get("origin");
  const referer = req.get("referer");
  let sourceOrigin = origin;
  if (!sourceOrigin && referer) {
    try { sourceOrigin = new URL(referer).origin; } catch { sourceOrigin = undefined; }
  }
  const cookieToken = req.cookies?.[COOKIE.csrf] as string | undefined;
  const headerToken = req.get("x-csrf-token");
  if (sourceOrigin !== new URL(env.WEB_ORIGIN).origin || !cookieToken || headerToken !== cookieToken) {
    throw new AppError(403, "CSRF_REJECTED", "Request origin or CSRF token is invalid");
  }
  next();
}
