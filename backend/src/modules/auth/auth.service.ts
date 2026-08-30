import {
  and,
  authChallenges,
  authIdentities,
  CHALLENGE_TYPE,
  db,
  eq,
  gt,
  IDENTITY_PROVIDER,
  isNull,
  or,
  sql,
  SESSION_REVOKE_REASON,
  sessions,
  sessionFamilies,
  households,
  householdMembers,
  authInvitations,
  USER_STATUS,
  users,
  type SelectAuthChallenge,
  type SelectUser,
  type Database,
} from "../../database";
import { env } from "../../config/env";
import { GOOGLE_SCOPES } from "../../config/constants";
import { AppError } from "../../shared/errors/app-error";
import {
  generateOpaqueToken,
  hashPassword,
  hashToken,
  signAccessToken,
  verifyPassword,
} from "../../utils/crypto";
import { getGoogleOAuthClient } from "../../utils/google-oauth-client";
import { sendMail } from "../../utils/mailer";
import { toUserOutput } from "../users/model";
import type { LoginInputSchema, RegisterInputSchema, ResetPasswordInputSchema } from "./model";

export type RequestMeta = {
  userAgent?: string;
  ip?: string;
};

export type PasswordRegisterDecision =
  | "create"
  | "email_taken";

export type GoogleAuthDecision = "login" | "registration_disabled" | "email_collision";

/**
 * Determines whether email/password registration should create a user,
 * attach a password identity to an existing verified account, or fail.
 */
export function decidePasswordRegister(input: {
  hasUser: boolean;
  hasPasswordIdentity: boolean;
  emailVerified: boolean;
}): PasswordRegisterDecision {
  if (!input.hasUser) {
    return "create";
  }
  return "email_taken";
}

/**
 * Determines whether Google OAuth should sign in, create a user,
 * attach a Google identity to an existing account, or fail.
 */
export function decideGoogleAuth(input: {
  hasGoogleIdentity: boolean;
  hasUserByEmail: boolean;
  googleEmailVerified: boolean;
}): GoogleAuthDecision {
  if (input.hasGoogleIdentity) {
    return "login";
  }
  return input.hasUserByEmail ? "email_collision" : "registration_disabled";
}

function challengeExpiry(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function refreshExpiry() {
  return new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
}

async function findUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(sql`lower(${users.email}) = ${email.toLowerCase()}`).limit(1);
  return user ?? null;
}

async function findIdentity(
  provider: (typeof IDENTITY_PROVIDER)[keyof typeof IDENTITY_PROVIDER],
  providerUserId: string,
) {
  const [identity] = await db
    .select()
    .from(authIdentities)
    .where(and(eq(authIdentities.provider, provider), eq(authIdentities.providerUserId, providerUserId)))
    .limit(1);
  return identity ?? null;
}

async function findPasswordIdentityForUser(userId: string) {
  const [identity] = await db
    .select()
    .from(authIdentities)
    .where(and(eq(authIdentities.userId, userId), eq(authIdentities.provider, IDENTITY_PROVIDER.password)))
    .limit(1);
  return identity ?? null;
}

/**
 * Issues a new refresh-token family and returns signed access and refresh tokens.
 */
type AuthTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function issueSessionInTransaction(
  tx: AuthTransaction,
  user: SelectUser,
  meta: RequestMeta,
  authMethod: string,
  refreshToken: string,
) {
  const expiresAt = refreshExpiry();
  const [membership] = await tx.select().from(householdMembers).where(and(eq(householdMembers.userId, user.id), isNull(householdMembers.endedAt))).limit(1);
  if (!membership) throw new AppError(403, "HOUSEHOLD_REQUIRED", "Active household membership required");
  const [family] = await tx.insert(sessionFamilies).values({ userId: user.id, householdId: membership.householdId, authMethod, expiresAt }).returning();
  await tx.insert(sessions).values({ userId: user.id, familyId: family.id, tokenHash: hashToken(refreshToken), expiresAt, userAgent: meta.userAgent ?? null, ip: meta.ip ?? null, lastUsedAt: new Date() });
  const [updated] = await tx.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id)).returning();
  const current = updated ?? user;
  return {
    accessToken: signAccessToken(current.id, current.email, family.id),
    refreshToken,
    user: toUserOutput(current),
  };
}

export async function issueSession(user: SelectUser, meta: RequestMeta, authMethod = "password") {
  const refreshToken = generateOpaqueToken();
  return db.transaction((tx) => issueSessionInTransaction(tx, user, meta, authMethod, refreshToken));
}

/**
 * Persists a hashed email-verification challenge and delivers the raw token by email.
 */
async function deliverVerificationEmail(user: SelectUser, token: string) {
  await sendMail({
    to: user.email,
    subject: "Verify your email",
    text: `Verify your email: ${env.WEB_ORIGIN}/verify-email?token=${token}`,
  });
}

/**
 * Registers a user with email and password.
 * Attaches a password identity to an existing verified Google account when applicable.
 * Always sends a verification email. Omits session tokens when email verification is required.
 */
export async function register(input: RegisterInputSchema, meta: RequestMeta) {
  if (!env.AUTH_ENABLED || !env.REGISTRATION_ENABLED) {
    throw new AppError(503, "REGISTRATION_DISABLED", "Registration is temporarily unavailable");
  }
  const existingUser = await findUserByEmail(input.email);
  const passwordIdentity = existingUser ? await findPasswordIdentityForUser(existingUser.id) : null;

  const decision = decidePasswordRegister({
    hasUser: Boolean(existingUser),
    hasPasswordIdentity: Boolean(passwordIdentity),
    emailVerified: Boolean(existingUser?.emailVerifiedAt),
  });

  if (decision === "email_taken") {
    throw new AppError(409, "EMAIL_TAKEN", "An account with this email already exists");
  }
  const passwordHash = await hashPassword(input.password);
  const verificationToken = generateOpaqueToken();
  const initialRefreshToken = env.REQUIRE_EMAIL_VERIFICATION ? null : generateOpaqueToken();
  const created = await db.transaction(async (tx) => {
    if (env.CLOSED_BETA) {
      const [invitation] = await tx.update(authInvitations).set({ consumedAt: new Date() }).where(and(
        sql`lower(${authInvitations.email}) = ${input.email}`,
        isNull(authInvitations.consumedAt),
        or(isNull(authInvitations.expiresAt), gt(authInvitations.expiresAt, new Date())),
      )).returning();
      if (!invitation) throw new AppError(403, "INVITATION_REQUIRED", "Registration requires a valid invitation");
    }
    const status = env.REQUIRE_EMAIL_VERIFICATION
      ? USER_STATUS.pendingVerification
      : USER_STATUS.active;
    const [created] = await tx
      .insert(users)
      .values({
        email: input.email,
        displayName: input.displayName,
        status,
      })
      .returning();
    await tx.insert(authIdentities).values({
    userId: created.id,
    provider: IDENTITY_PROVIDER.password,
    providerUserId: input.email,
    passwordHash,
    email: input.email,
    emailVerified: Boolean(created.emailVerifiedAt),
    });
    const [household] = await tx.insert(households).values({ name: `${input.displayName}'s household` }).returning();
    await tx.insert(householdMembers).values({ householdId: household.id, userId: created.id, role: "owner", isPrimary: true });
    await tx.insert(authChallenges).values({ userId: created.id, type: CHALLENGE_TYPE.emailVerification, tokenHash: hashToken(verificationToken), expiresAt: challengeExpiry(24 * 60) });
    const tokens = initialRefreshToken
      ? await issueSessionInTransaction(tx, created, meta, "password", initialRefreshToken)
      : null;
    return { user: created, tokens };
  });

  await deliverVerificationEmail(created.user, verificationToken);

  if (env.REQUIRE_EMAIL_VERIFICATION) {
    return { user: toUserOutput(created.user), tokens: null as null };
  }
  if (!created.tokens) throw new AppError(500, "INTERNAL_ERROR", "Initial session was not created");
  return { user: created.tokens.user, tokens: created.tokens };
}

/**
 * Authenticates with email and password and issues a new session.
 * Unknown emails and incorrect passwords both fail with 401 to avoid account enumeration.
 */
export async function login(input: LoginInputSchema, meta: RequestMeta) {
  if (!env.AUTH_ENABLED) throw new AppError(503, "AUTH_DISABLED", "Authentication is temporarily unavailable");
  const identity = await findIdentity(IDENTITY_PROVIDER.password, input.email);
  if (!identity?.passwordHash) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const matches = await verifyPassword(identity.passwordHash, input.password);
  if (!matches) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const user = await findUserById(identity.userId);
  if (!user || user.status === USER_STATUS.disabled) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  if (env.REQUIRE_EMAIL_VERIFICATION && !user.emailVerifiedAt) {
    throw new AppError(403, "EMAIL_NOT_VERIFIED", "Verify your email before signing in");
  }

  return issueSession(user, meta);
}

/**
 * Rotates the refresh token within its family and returns a new token pair.
 * Reuse of a revoked token revokes every session in that family.
 */
export async function refresh(rawRefreshToken: string, meta: RequestMeta) {
  const tokenHash = hashToken(rawRefreshToken);

  const outcome = await db.transaction(async (tx) => {
    const [session] = await tx.select().from(sessions).where(eq(sessions.tokenHash, tokenHash)).limit(1);
    if (!session) {
      throw new AppError(401, "UNAUTHORIZED", "Invalid refresh token");
    }

    if (session.revokedAt) {
      await tx.update(sessionFamilies)
        .set({
          revokedAt: new Date(),
          revokedReason: SESSION_REVOKE_REASON.reuseDetected,
        })
        .where(and(eq(sessionFamilies.id, session.familyId), isNull(sessionFamilies.revokedAt)));
      return { rejected: true as const };
    }

    if (session.expiresAt.getTime() < Date.now()) {
      throw new AppError(401, "UNAUTHORIZED", "Refresh token expired");
    }

    const [user] = await tx.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user || user.status === USER_STATUS.disabled) {
      throw new AppError(401, "UNAUTHORIZED", "Invalid refresh token");
    }

    const [family] = await tx.select().from(sessionFamilies).where(and(eq(sessionFamilies.id, session.familyId), isNull(sessionFamilies.revokedAt), gt(sessionFamilies.expiresAt, new Date()))).limit(1);
    if (!family) return { rejected: true as const };
    const [won] = await tx.update(sessions).set({ revokedAt: new Date(), revokedReason: SESSION_REVOKE_REASON.rotated }).where(and(eq(sessions.id, session.id), isNull(sessions.revokedAt))).returning();
    if (!won) {
      await tx.update(sessionFamilies).set({ revokedAt: new Date(), revokedReason: SESSION_REVOKE_REASON.reuseDetected }).where(and(eq(sessionFamilies.id, session.familyId), isNull(sessionFamilies.revokedAt)));
      return { rejected: true as const };
    }
    const nextRefreshToken = generateOpaqueToken();
    const [nextSession] = await tx
      .insert(sessions)
      .values({
        userId: user.id,
        familyId: session.familyId,
        tokenHash: hashToken(nextRefreshToken),
        expiresAt: family.expiresAt,
        userAgent: meta.userAgent ?? session.userAgent,
        ip: meta.ip ?? session.ip,
        lastUsedAt: new Date(),
      })
      .returning();

    await tx.update(sessions).set({ replacedBySessionId: nextSession.id }).where(eq(sessions.id, session.id));

    return {
      rejected: false as const,
      accessToken: signAccessToken(user.id, user.email, family.id),
      refreshToken: nextRefreshToken,
      user: toUserOutput(user),
    };
  });
  if (outcome.rejected) throw new AppError(401, "UNAUTHORIZED", "Invalid or reused refresh token");
  return outcome;
}

/**
 * Revokes the refresh session for the given token.
 * Missing or already-revoked tokens are ignored.
 */
export async function logout(rawRefreshToken: string | undefined) {
  if (!rawRefreshToken) {
    return;
  }
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.tokenHash, hashToken(rawRefreshToken)))
    .limit(1);
  if (!session || session.revokedAt) {
    return;
  }
  await db
    .update(sessionFamilies)
    .set({
      revokedAt: new Date(),
      revokedReason: SESSION_REVOKE_REASON.logout,
    })
    .where(and(eq(sessionFamilies.id, session.familyId), isNull(sessionFamilies.revokedAt)));
}

export async function revokeUserSessionFamilies(userId: string, reason: "password_changed" | "user_disabled") {
  await db.update(sessionFamilies).set({ revokedAt: new Date(), revokedReason: reason }).where(and(eq(sessionFamilies.userId, userId), isNull(sessionFamilies.revokedAt)));
}

/**
 * Persists a one-time OAuth state challenge and returns the Google consent URL.
 */
export async function startGoogleAuth() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new AppError(503, "GOOGLE_NOT_CONFIGURED", "Google OAuth is not configured");
  }

  const state = generateOpaqueToken();
  await db.insert(authChallenges).values({
    type: CHALLENGE_TYPE.oauthState,
    tokenHash: hashToken(state),
    expiresAt: challengeExpiry(10),
  });

  const client = getGoogleOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: [...GOOGLE_SCOPES],
    state,
    prompt: "select_account",
  });
}

/**
 * Completes Google OAuth: consumes state, verifies the ID token, then signs in,
 * creates an account, or links Google to an existing user.
 */
export async function googleCallback(code: string | undefined, state: string | undefined, meta: RequestMeta) {
  if (!code || !state) {
    throw new AppError(400, "OAUTH_ERROR", "Missing Google OAuth code or state");
  }

  const [stateChallenge] = await db
    .update(authChallenges)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(authChallenges.tokenHash, hashToken(state)),
        eq(authChallenges.type, CHALLENGE_TYPE.oauthState),
        isNull(authChallenges.consumedAt),
        gt(authChallenges.expiresAt, new Date()),
      ),
    )
    .returning();
  if (!stateChallenge) {
    throw new AppError(400, "OAUTH_ERROR", "Invalid OAuth state");
  }

  const client = getGoogleOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) {
    throw new AppError(400, "OAUTH_ERROR", "Google did not return an ID token");
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new AppError(400, "OAUTH_ERROR", "Google profile is missing email");
  }

  const googleEmail = payload.email.toLowerCase();
  const googleEmailVerified = Boolean(payload.email_verified);
  const existingGoogle = await findIdentity(IDENTITY_PROVIDER.google, payload.sub);
  const existingUser = await findUserByEmail(googleEmail);

  const decision = decideGoogleAuth({
    hasGoogleIdentity: Boolean(existingGoogle),
    hasUserByEmail: Boolean(existingUser),
    googleEmailVerified,
  });

  if (decision !== "login") {
    throw new AppError(
      409,
      decision === "email_collision" ? "EMAIL_TAKEN" : "GOOGLE_REGISTRATION_DISABLED",
      "Direct Google registration and linking are disabled; use central OIDC",
    );
  }

  const user: SelectUser | null = existingGoogle ? await findUserById(existingGoogle.userId) : null;

  if (!user || user.status === USER_STATUS.disabled) {
    throw new AppError(401, "UNAUTHORIZED", "Unable to sign in with Google");
  }

  return issueSession(user, meta);
}

/**
 * Sends a password-reset email when a password identity exists for the address.
 * Unknown emails and Google-only accounts produce no error and no mail.
 */
export async function forgotPassword(email: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    return;
  }
  const passwordIdentity = await findPasswordIdentityForUser(user.id);
  if (!passwordIdentity) {
    return;
  }

  const token = generateOpaqueToken();
  await db.insert(authChallenges).values({
    userId: user.id,
    type: CHALLENGE_TYPE.passwordReset,
    tokenHash: hashToken(token),
    expiresAt: challengeExpiry(60),
  });
  await sendMail({
    to: user.email,
    subject: "Reset your password",
    text: `Reset your password: ${env.WEB_ORIGIN}/reset-password?token=${token}`,
  });
}

/**
 * Consumes a one-time reset token, replaces the password hash, and revokes all sessions.
 */
export async function resetPassword(input: ResetPasswordInputSchema) {
  const passwordHash = await hashPassword(input.password);
  const consumed = await db.transaction(async (tx) => {
    const [challenge] = await tx.update(authChallenges).set({ consumedAt: new Date() }).where(and(eq(authChallenges.tokenHash, hashToken(input.token)), eq(authChallenges.type, CHALLENGE_TYPE.passwordReset), isNull(authChallenges.consumedAt), gt(authChallenges.expiresAt, new Date()))).returning();
    if (!challenge?.userId) return false;
    const [identity] = await tx.select().from(authIdentities).where(and(eq(authIdentities.userId, challenge.userId), eq(authIdentities.provider, IDENTITY_PROVIDER.password))).limit(1);
    if (!identity) return false;
    await tx.update(authIdentities).set({ passwordHash }).where(eq(authIdentities.id, identity.id));
    await tx.update(sessionFamilies).set({ revokedAt: new Date(), revokedReason: SESSION_REVOKE_REASON.passwordChanged }).where(and(eq(sessionFamilies.userId, challenge.userId), isNull(sessionFamilies.revokedAt)));
    return true;
  });
  if (!consumed) throw new AppError(400, "INVALID_TOKEN", "Invalid or expired reset token");
}

/**
 * Consumes a one-time verification token and marks the user and matching identities as verified.
 */
export async function verifyEmail(token: string) {
  const updated = await db.transaction(async (tx) => {
    const [challenge] = await tx.update(authChallenges).set({ consumedAt: new Date() }).where(and(eq(authChallenges.tokenHash, hashToken(token)), eq(authChallenges.type, CHALLENGE_TYPE.emailVerification), isNull(authChallenges.consumedAt), gt(authChallenges.expiresAt, new Date()))).returning();
    if (!challenge?.userId) return null;
    const [user] = await tx.select().from(users).where(eq(users.id, challenge.userId)).limit(1);
    if (!user) return null;
    const [next] = await tx.update(users)
    .set({
      emailVerifiedAt: new Date(),
      status: user.status === USER_STATUS.pendingVerification ? USER_STATUS.active : user.status,
    })
    .where(eq(users.id, user.id))
    .returning();

    await tx
    .update(authIdentities)
    .set({ emailVerified: true })
    .where(and(eq(authIdentities.userId, user.id), eq(authIdentities.email, user.email)));

    return next ?? { ...user, emailVerifiedAt: new Date() };
  });
  if (!updated) throw new AppError(400, "INVALID_TOKEN", "Invalid or expired verification token");
  return toUserOutput(updated);
}

/**
 * Marks a hashed challenge as consumed.
 * Throws if the token is missing, expired, or has already been used.
 */
export async function consumeChallengeOnce(
  token: string,
  type: (typeof CHALLENGE_TYPE)[keyof typeof CHALLENGE_TYPE],
): Promise<SelectAuthChallenge> {
  const [challenge] = await db
    .update(authChallenges)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(authChallenges.tokenHash, hashToken(token)),
        eq(authChallenges.type, type),
        isNull(authChallenges.consumedAt),
        gt(authChallenges.expiresAt, new Date()),
      ),
    )
    .returning();
  if (!challenge) {
    throw new AppError(400, "INVALID_TOKEN", "Invalid or expired token");
  }
  return challenge;
}
