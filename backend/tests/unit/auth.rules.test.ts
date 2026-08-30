import { describe, expect, it } from "vitest";
import {
  generateOpaqueToken,
  hashPassword,
  hashToken,
  signAccessToken,
  verifyAccessToken,
  verifyPassword,
} from "../../src/utils/crypto";
import { decideGoogleAuth, decidePasswordRegister } from "../../src/modules/auth/auth.service";

describe("crypto", () => {
  it("hashes and verifies a password with argon2id", async () => {
    const hash = await hashPassword("correct-horse-battery");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(hash, "correct-horse-battery")).toBe(true);
    expect(await verifyPassword(hash, "wrong-password")).toBe(false);
  });

  it("issues and verifies an access JWT", () => {
    const token = signAccessToken("user-1", "a@example.com", "session-1");
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe("user-1");
    expect(payload.email).toBe("a@example.com");
    expect(payload.sid).toBe("session-1");
  });

  it("hashes opaque tokens deterministically", () => {
    const token = generateOpaqueToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(hashToken(`${token}x`));
  });
});

describe("identity linking rules", () => {
  it("creates a new password user when email is free", () => {
    expect(
      decidePasswordRegister({ hasUser: false, hasPasswordIdentity: false, emailVerified: false }),
    ).toBe("create");
  });

  it("rejects a second password identity", () => {
    expect(
      decidePasswordRegister({ hasUser: true, hasPasswordIdentity: true, emailVerified: true }),
    ).toBe("email_taken");
  });

  it("rejects password registration for an existing verified OAuth user", () => {
    expect(
      decidePasswordRegister({ hasUser: true, hasPasswordIdentity: false, emailVerified: true }),
    ).toBe("email_taken");
  });

  it("rejects password registration for any existing unverified user", () => {
    expect(
      decidePasswordRegister({ hasUser: true, hasPasswordIdentity: false, emailVerified: false }),
    ).toBe("email_taken");
  });

  it("logs in when a Google identity already exists", () => {
    expect(
      decideGoogleAuth({
        hasGoogleIdentity: true,
        hasUserByEmail: true,
        googleEmailVerified: true,
      }),
    ).toBe("login");
  });

  it("does not create new direct Google users", () => {
    expect(
      decideGoogleAuth({
        hasGoogleIdentity: false,
        hasUserByEmail: false,
        googleEmailVerified: true,
      }),
    ).toBe("registration_disabled");
  });

  it("does not auto-link Google onto an existing user", () => {
    expect(
      decideGoogleAuth({
        hasGoogleIdentity: false,
        hasUserByEmail: true,
        googleEmailVerified: true,
      }),
    ).toBe("email_collision");
  });

  it("rejects Google email collisions regardless of provider verification", () => {
    expect(
      decideGoogleAuth({
        hasGoogleIdentity: false,
        hasUserByEmail: true,
        googleEmailVerified: false,
      }),
    ).toBe("email_collision");
  });
});
