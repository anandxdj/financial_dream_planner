import { createPublicKey } from "node:crypto";
import jwt, { type JwtHeader } from "jsonwebtoken";
import { and, authChallenges, authIdentities, authInvitations, db, eq, gt, households, householdMembers, IDENTITY_PROVIDER, isNull, or, sql, users, USER_STATUS } from "../../database";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors/app-error";
import { generateOpaqueToken, hashToken, pkceChallenge } from "../../utils/crypto";
import { issueSession, issueSessionInTransaction, type RequestMeta } from "./auth.service";

type OidcClaims = { sub: string; email: string; email_verified?: boolean; name?: string; picture?: string; nonce?: string; iss: string; aud: string | string[]; azp?: string; exp: number };
type OidcTransaction = { nonce: string; verifier: string; redirectUri: string; clientId: string; mode: "browser" | "mobile"; appChallenge?: string };
export type BridgePayload = { clientId: string; redirectUri: string; appChallenge: string; meta?: RequestMeta };

export function canCreateOidcAccount(claims: Pick<OidcClaims, "email_verified">) {
  return claims.email_verified === true;
}

export function validateOidcClaims(claims: OidcClaims, expectedNonce: string, clientId = env.OIDC_CLIENT_ID) {
  if (claims.nonce !== expectedNonce || !claims.sub || !claims.email) return false;
  return !Array.isArray(claims.aud) || claims.aud.length <= 1 || claims.azp === clientId;
}

export function buildBridgePayload(input: { clientId: string; redirectUri: string; appChallenge: string; meta: RequestMeta }): BridgePayload {
  return { clientId: input.clientId, redirectUri: input.redirectUri, appChallenge: input.appChallenge, meta: { userAgent: input.meta.userAgent?.slice(0, 512), ip: input.meta.ip?.slice(0, 64) } };
}

export function bridgeClaimMatches(payload: BridgePayload, input: { verifier: string; redirectUri: string; clientId: string }) {
  return payload.clientId === input.clientId && payload.redirectUri === input.redirectUri && pkceChallenge(input.verifier) === payload.appChallenge;
}

export interface OidcProvider {
  authorizationUrl(input: { state: string; nonce: string; challenge: string }): Promise<string>;
  exchangeAndVerify(code: string, verifier: string, nonce: string): Promise<OidcClaims>;
}

type Discovery = { authorization_endpoint: string; token_endpoint: string; jwks_uri: string; issuer: string };

export class DiscoveryOidcProvider implements OidcProvider {
  private async discovery(): Promise<Discovery> {
    const response = await fetch(`${env.OIDC_ISSUER.replace(/\/$/, "")}/.well-known/openid-configuration`);
    if (!response.ok) throw new AppError(503, "OIDC_UNAVAILABLE", "OIDC discovery failed");
    const data = await response.json() as Discovery;
    if (data.issuer !== env.OIDC_ISSUER) throw new AppError(503, "OIDC_INVALID_ISSUER", "OIDC issuer mismatch");
    return data;
  }

  async authorizationUrl(input: { state: string; nonce: string; challenge: string }) {
    const discovery = await this.discovery();
    const url = new URL(discovery.authorization_endpoint);
    url.search = new URLSearchParams({ response_type: "code", client_id: env.OIDC_CLIENT_ID, redirect_uri: env.OIDC_REDIRECT_URI, scope: "openid email profile", state: input.state, nonce: input.nonce, code_challenge: input.challenge, code_challenge_method: "S256" }).toString();
    return url.toString();
  }

  async exchangeAndVerify(code: string, verifier: string, nonce: string) {
    const discovery = await this.discovery();
    const response = await fetch(discovery.token_endpoint, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", code, client_id: env.OIDC_CLIENT_ID, client_secret: env.OIDC_CLIENT_SECRET, redirect_uri: env.OIDC_REDIRECT_URI, code_verifier: verifier }) });
    if (!response.ok) throw new AppError(401, "OIDC_EXCHANGE_FAILED", "OIDC exchange failed");
    const tokens = await response.json() as { id_token?: string };
    if (!tokens.id_token) throw new AppError(401, "OIDC_INVALID_TOKEN", "OIDC ID token missing");
    const decoded = jwt.decode(tokens.id_token, { complete: true });
    const header = decoded?.header as JwtHeader | undefined;
    if (!header?.kid || header.alg !== "RS256") throw new AppError(401, "OIDC_INVALID_TOKEN", "OIDC signing header rejected");
    const jwksResponse = await fetch(discovery.jwks_uri);
    if (!jwksResponse.ok) throw new AppError(503, "OIDC_UNAVAILABLE", "OIDC signing keys unavailable");
    const jwks = await jwksResponse.json() as { keys: Array<Record<string, unknown> & { kid?: string }> };
    const jwk = jwks.keys.find((candidate) => candidate.kid === header.kid);
    if (!jwk) throw new AppError(401, "OIDC_INVALID_TOKEN", "OIDC signing key unavailable");
    const claims = jwt.verify(tokens.id_token, createPublicKey({ key: jwk as never, format: "jwk" }), { algorithms: ["RS256"], issuer: env.OIDC_ISSUER, audience: env.OIDC_CLIENT_ID }) as OidcClaims;
    if (!validateOidcClaims(claims, nonce)) throw new AppError(401, "OIDC_INVALID_TOKEN", "OIDC claims rejected");
    return claims;
  }
}

export function isExactRedirectAllowed(redirectUri: string, allowlist = env.OIDC_ALLOWED_REDIRECTS) {
  return allowlist.split(",").map((value) => value.trim()).filter(Boolean).includes(redirectUri);
}

export class OidcService {
  constructor(private readonly provider: OidcProvider = new DiscoveryOidcProvider()) {}

  async start(input: { redirectUri: string; clientId: string; mode: "browser" | "mobile"; appChallenge?: string }) {
    if (!env.AUTH_ENABLED || !env.OIDC_ENABLED) throw new AppError(503, "OIDC_DISABLED", "OIDC is unavailable");
    if (!isExactRedirectAllowed(input.redirectUri) || (input.mode === "mobile" && !input.appChallenge)) throw new AppError(400, "INVALID_REDIRECT", "OIDC redirect is not allowed");
    const state = generateOpaqueToken(); const nonce = generateOpaqueToken(); const verifier = generateOpaqueToken();
    const payload: OidcTransaction = { ...input, nonce, verifier };
    await db.insert(authChallenges).values({ type: "oidc_transaction", tokenHash: hashToken(state), expiresAt: new Date(Date.now() + 10 * 60_000), payload });
    return this.provider.authorizationUrl({ state, nonce, challenge: pkceChallenge(verifier) });
  }

  async callback(code: string, state: string, meta: RequestMeta) {
    const [transaction] = await db.update(authChallenges).set({ consumedAt: new Date() }).where(and(eq(authChallenges.type, "oidc_transaction"), eq(authChallenges.tokenHash, hashToken(state)), isNull(authChallenges.consumedAt), gt(authChallenges.expiresAt, new Date()))).returning();
    const payload = transaction?.payload as OidcTransaction | null;
    if (!payload) throw new AppError(400, "OIDC_STATE_INVALID", "OIDC transaction is invalid or expired");
    const claims = await this.provider.exchangeAndVerify(code, payload.verifier, payload.nonce);
    const email = claims.email.trim().toLowerCase();
    const [identity] = await db.select().from(authIdentities).where(and(eq(authIdentities.issuer, env.OIDC_ISSUER), eq(authIdentities.subject, claims.sub))).limit(1);
    let [user] = identity ? await db.select().from(users).where(eq(users.id, identity.userId)).limit(1) : [];
    if (!user) {
      const [collision] = await db.select().from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
      if (collision) throw new AppError(409, "EMAIL_TAKEN", "An account with this email already exists");
      if (!env.REGISTRATION_ENABLED) throw new AppError(403, "REGISTRATION_DISABLED", "Registration is closed");
      if (!canCreateOidcAccount(claims)) throw new AppError(403, "OIDC_EMAIL_UNVERIFIED", "A verified provider email is required to register");
      user = await db.transaction(async (tx) => {
        if (env.CLOSED_BETA) {
          const [invite] = await tx.update(authInvitations).set({ consumedAt: new Date() }).where(and(sql`lower(${authInvitations.email}) = ${email}`, isNull(authInvitations.consumedAt), or(isNull(authInvitations.expiresAt), gt(authInvitations.expiresAt, new Date())))).returning();
          if (!invite) throw new AppError(403, "INVITATION_REQUIRED", "Registration requires an invitation");
        }
        const [created] = await tx.insert(users).values({ email, displayName: claims.name ?? email.split("@")[0]!, avatarUrl: claims.picture, status: USER_STATUS.active, emailVerifiedAt: claims.email_verified ? new Date() : null }).returning();
        await tx.insert(authIdentities).values({ userId: created.id, provider: IDENTITY_PROVIDER.oidc, providerUserId: `${env.OIDC_ISSUER}|${claims.sub}`, issuer: env.OIDC_ISSUER, subject: claims.sub, email, emailVerified: Boolean(claims.email_verified) });
        const [household] = await tx.insert(households).values({ name: `${created.displayName}'s household` }).returning();
        await tx.insert(householdMembers).values({ householdId: household.id, userId: created.id, role: "owner", isPrimary: true });
        return created;
      });
    }
    if (user.status === USER_STATUS.disabled) throw new AppError(401, "UNAUTHORIZED", "Unable to sign in");
    if (payload.mode === "browser") {
      const session = await issueSession(user, meta, "oidc");
      return { kind: "browser" as const, redirectUri: payload.redirectUri, session };
    }
    const bridgeCode = generateOpaqueToken();
    const bridgePayload = buildBridgePayload({ clientId: payload.clientId, redirectUri: payload.redirectUri, appChallenge: payload.appChallenge!, meta });
    await db.insert(authChallenges).values({ userId: user.id, type: "oidc_bridge", tokenHash: hashToken(bridgeCode), expiresAt: new Date(Date.now() + 60_000), payload: bridgePayload });
    return { kind: "mobile" as const, redirectUri: payload.redirectUri, bridgeCode };
  }

  async exchangeBridge(input: { code: string; verifier: string; redirectUri: string; clientId: string }) {
    const refreshToken = generateOpaqueToken();
    const result = await db.transaction(async (tx) => {
      const [bridge] = await tx.select().from(authChallenges).where(and(eq(authChallenges.type, "oidc_bridge"), eq(authChallenges.tokenHash, hashToken(input.code)), isNull(authChallenges.consumedAt), gt(authChallenges.expiresAt, new Date()))).for("update").limit(1);
      const payload = bridge?.payload as BridgePayload | null;
      if (!bridge?.userId || !payload || !bridgeClaimMatches(payload, input)) return null;
      const [claimed] = await tx.update(authChallenges).set({ consumedAt: new Date() }).where(and(eq(authChallenges.id, bridge.id), isNull(authChallenges.consumedAt))).returning();
      if (!claimed) return null;
      const [user] = await tx.select().from(users).where(eq(users.id, bridge.userId)).limit(1);
      if (!user || user.status === USER_STATUS.disabled) return null;
      return issueSessionInTransaction(tx, user, payload.meta ?? {}, "oidc", refreshToken);
    });
    if (!result) throw new AppError(400, "BRIDGE_CODE_INVALID", "Bridge code is invalid or expired");
    return result;
  }
}
