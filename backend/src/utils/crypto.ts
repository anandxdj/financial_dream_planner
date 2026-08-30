import argon2 from "argon2";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AccessTokenPayload } from "../types/tokens";
import { AppError } from "../shared/errors/app-error";

export async function hashPassword(password: string) {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export function generateOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function pkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function newFamilyId() {
  return randomUUID();
}

export function signAccessToken(userId: string, email: string, sessionId: string) {
  return jwt.sign({ sub: userId, email, sid: sessionId }, env.ACCESS_TOKEN_SECRET, {
    algorithm: "HS256",
    issuer: env.API_ORIGIN,
    audience: "financial-dream-planner",
    jwtid: randomUUID(),
    mutatePayload: false,
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET, {
      algorithms: ["HS256"],
      issuer: env.API_ORIGIN,
      audience: "financial-dream-planner",
    }) as AccessTokenPayload;
    if (!payload.sub || !payload.email || !payload.sid) {
      throw new AppError(401, "UNAUTHORIZED", "Invalid access token");
    }
    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired access token");
  }
}
