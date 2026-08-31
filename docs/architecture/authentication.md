# Authentication

Local password and central OIDC are the supported onboarding paths. Direct Google is migration-only: an already linked Google identity may still sign in, but it can neither create an account nor auto-link by email. Public registration treats every existing normalized email as occupied. Identity linking is a separate future authenticated operation requiring recent reauthentication.

For mobile, the backend owns OIDC state, nonce, and S256 PKCE. Its callback validates the authorization response and redirects Expo with a short-lived, single-use bridge code—not OIDC or app tokens. The app proves its bridge verifier to exchange that code for application access and refresh tokens.

`AUTH_ENABLED`, `REGISTRATION_ENABLED`, `OIDC_ENABLED`, and `CLOSED_BETA` are independent operational kill switches. Closed beta requires an unconsumed invitation for either onboarding path; existing users can still log in when registration is closed.

An application session is a fixed seven-day `session_family`; rotating refresh records are its children and never extend the family expiry. Refresh replacement is a conditional one-winner update. Reuse revokes the family in a committed transaction. Access tokens are HS256-only, last 15 minutes, carry `sid`, and pin the application issuer/audience. Every protected request resolves the active user, family, household membership, role, and auth method from server-owned state. OIDC-origin families require reauthentication after 24 hours.

Browser and API transports do not mix. A present malformed/invalid `Authorization` header cannot fall back to cookies. Unsafe cookie-authenticated requests require an exact web origin (or referer origin) and matching double-submit CSRF token. Production cookie names use the `__Host-` prefix and are Secure, HttpOnly where applicable, and path `/`.

OIDC network access is dependency-injected. Discovery must report the configured issuer; ID tokens require RS256, a discovered `kid`, matching issuer/audience/nonce, and normal expiry validation. A provider-verified email is mandatory when creating an OIDC account, but an existing `(issuer, subject)` identity can continue signing in even if a later response omits that flag. State, nonce, provider PKCE verifier, and mobile bridge records are hashed/single-use.

Mobile adds a second app PKCE proof and receives only a bridge code (maximum 60 seconds) in its exact allowlisted redirect. The callback stores only the user reference, PKCE challenge, exact client/redirect context, and bounded request metadata—never application tokens or the raw app verifier. It does not create a session. Bridge exchange locks the record, validates the proof/context before consuming it, and creates the application session in the same transaction, so a wrong verifier preserves the code and concurrent correct exchanges have one winner.

For local onboarding without email verification, user, password identity, household, primary membership, session family, and first hashed refresh version commit in one transaction. Verification-required onboarding deliberately omits the session. Closed-beta invitation claiming is a case-insensitive conditional update inside the same account-creation transaction; an expired, consumed, or concurrently claimed invitation cannot create an account.

Authentication failures are categorized by bounded reasons and recorded in `fdp_auth_failures_total`. Surge alerts trigger when failure rates exceed baseline beta thresholds (>10/min) without logging passwords, tokens, or personal identifiers.
