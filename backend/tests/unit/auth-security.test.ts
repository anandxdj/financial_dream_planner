import { describe, expect, it } from "vitest";
import { AppError } from "../../src/shared/errors/app-error";
import { getOptionalRefreshToken, selectAuthToken } from "../../src/shared/middleware/require-auth";
import { COOKIE } from "../../src/config/constants";
import type { Request } from "express";
import { bridgeClaimMatches, buildBridgePayload, canCreateOidcAccount, isExactRedirectAllowed, validateOidcClaims } from "../../src/modules/auth/oidc.service";
import { pkceChallenge } from "../../src/utils/crypto";

describe("authentication transport policy", () => {
  it("never falls back to a cookie when Authorization is present but malformed", () => {
    expect(() => selectAuthToken("Basic attacker", "valid-cookie")).toThrow(AppError);
    expect(() => selectAuthToken("Bearer ", "valid-cookie")).toThrow(AppError);
  });

  it("selects exactly one transport", () => {
    expect(selectAuthToken("Bearer api-token", "cookie-token")).toEqual({ token: "api-token", transport: "bearer" });
    expect(selectAuthToken(undefined, "cookie-token")).toEqual({ token: "cookie-token", transport: "cookie" });
  });

  it("reads logout refresh tokens through the environment-aware cookie name", () => {
    const req = { cookies: { [COOKIE.refresh]: "refresh-value" } } as Request;
    expect(getOptionalRefreshToken(req)).toBe("refresh-value");
    expect(getOptionalRefreshToken({ cookies: {} } as Request)).toBeUndefined();
  });
});

describe("OIDC broker policy", () => {
  it("uses exact redirect matching", () => {
    const allowed = "https://app.example/callback,myapp://auth/callback";
    expect(isExactRedirectAllowed("https://app.example/callback", allowed)).toBe(true);
    expect(isExactRedirectAllowed("https://app.example/callback/evil", allowed)).toBe(false);
    expect(isExactRedirectAllowed("https://app.example.evil/callback", allowed)).toBe(false);
  });

  it("derives an RFC 7636 S256 challenge", () => {
    expect(pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("requires a provider-verified email only for account creation", () => {
    expect(canCreateOidcAccount({ email_verified: true })).toBe(true);
    expect(canCreateOidcAccount({ email_verified: false })).toBe(false);
    expect(canCreateOidcAccount({})).toBe(false);
  });

  it("stores no raw verifier or application tokens in a mobile bridge payload", () => {
    const verifier = "x".repeat(43);
    const payload = buildBridgePayload({ clientId: "mobile", redirectUri: "myapp://auth/callback", appChallenge: pkceChallenge(verifier), meta: { userAgent: "phone", ip: "127.0.0.1" } });
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain(verifier);
    expect(serialized).not.toContain("accessToken");
    expect(serialized).not.toContain("refreshToken");
    expect(bridgeClaimMatches(payload, { clientId: "mobile", redirectUri: "myapp://auth/callback", verifier })).toBe(true);
    expect(bridgeClaimMatches(payload, { clientId: "mobile", redirectUri: "myapp://auth/callback", verifier: "y".repeat(43) })).toBe(false);
  });

  it("requires azp for a multi-audience ID token", () => {
    const claims = { sub: "subject", email: "user@example.com", nonce: "nonce", iss: "issuer", aud: ["client", "api"], exp: 9999999999 };
    expect(validateOidcClaims({ ...claims, azp: "client" }, "nonce", "client")).toBe(true);
    expect(validateOidcClaims(claims, "nonce", "client")).toBe(false);
    expect(validateOidcClaims({ ...claims, azp: "other" }, "nonce", "client")).toBe(false);
  });
});
