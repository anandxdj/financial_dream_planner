import type { Request, Response } from "express";
import { COOKIE } from "../../config/constants";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors/app-error";
import { verifyAccessToken } from "../../utils/crypto";
import { and, db, eq, gt, householdMembers, isNull, sessionFamilies, users, USER_STATUS } from "../../database";

export function selectAuthToken(header: string | undefined, cookieToken: string | undefined) {
  if (header !== undefined) {
    if (!header.startsWith("Bearer ") || header.length === 7) throw new AppError(401, "UNAUTHORIZED", "Invalid Authorization header");
    return { token: header.slice(7), transport: "bearer" as const };
  }
  return cookieToken ? { token: cookieToken, transport: "cookie" as const } : null;
}

export async function requireAuth(req: Request, _res: Response, next: () => void) {
  const header = req.header("authorization");
  const selected = selectAuthToken(header, req.cookies?.[COOKIE.access] as string | undefined);
  if (!selected) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
  const payload = verifyAccessToken(selected.token);
  const [row] = await db.select({
    userStatus: users.status,
    email: users.email,
    householdId: sessionFamilies.householdId,
    authMethod: sessionFamilies.authMethod,
    role: householdMembers.role,
    authenticatedAt: sessionFamilies.authenticatedAt,
  }).from(sessionFamilies)
    .innerJoin(users, eq(users.id, sessionFamilies.userId))
    .innerJoin(householdMembers, and(eq(householdMembers.userId, users.id), eq(householdMembers.householdId, sessionFamilies.householdId), isNull(householdMembers.endedAt)))
    .where(and(eq(sessionFamilies.id, payload.sid), eq(sessionFamilies.userId, payload.sub), isNull(sessionFamilies.revokedAt), gt(sessionFamilies.expiresAt, new Date())))
    .limit(1);
  if (!row || row.userStatus === USER_STATUS.disabled) throw new AppError(401, "UNAUTHORIZED", "Session is no longer active");
  if (row.authMethod === "oidc" && row.authenticatedAt.getTime() < Date.now() - env.OIDC_REAUTH_HOURS * 3_600_000) {
    throw new AppError(401, "REAUTH_REQUIRED", "OIDC reauthentication required");
  }
  req.user = { id: payload.sub, email: row.email };
  req.auth = {
    userId: payload.sub,
    sessionId: payload.sid,
    householdId: row.householdId,
    role: row.role,
    authMethod: row.authMethod,
    transport: selected.transport,
    authenticatedAt: row.authenticatedAt,
  };
  next();
}

export function getRequestMeta(req: Request) {
  return {
    userAgent: req.get("user-agent") ?? undefined,
    ip: req.ip,
  };
}

export function getRefreshToken(req: Request) {
  const token = req.cookies?.[COOKIE.refresh] as string | undefined;
  if (!token) {
    throw new AppError(401, "UNAUTHORIZED", "Refresh token missing");
  }
  return token;
}

export function getOptionalRefreshToken(req: Request) {
  return req.cookies?.[COOKIE.refresh] as string | undefined;
}

export function googleConfigured() {
  return env.GOOGLE_CLIENT_ID.length > 0 && env.GOOGLE_CLIENT_SECRET.length > 0;
}
