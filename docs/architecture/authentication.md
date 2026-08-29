# Authentication

The starter currently supports local password and direct Google identities with rotating, hashed refresh sessions. U2 hardens these flows and introduces central OIDC identities keyed by issuer and subject.

For mobile, the backend owns OIDC state, nonce, and S256 PKCE. Its callback validates the authorization response and redirects Expo with a short-lived, single-use bridge code—not OIDC or app tokens. The app proves its bridge verifier to exchange that code for application access and refresh tokens.

`AUTH_MODE=hybrid` retains invite-gated local registration while OIDC is introduced; `oidc_only` disables new local registration. Sessions represent devices, while refresh rotations remain child token records. Web uses secure cookies plus CSRF protection; mobile uses bearer access tokens and encrypted refresh storage.
