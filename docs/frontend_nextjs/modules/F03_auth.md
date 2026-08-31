# F03 - Authentication & Continuity

## Routes
Login, register, forgot/reset password, verify email.

## Requirements
- preserve anonymous draft context after signup
- use existing backend auth model
- access token in memory; refresh flow consistent with starter
- startup session restoration
- clean failure -> login, no retry loop

## UX
Simple centered auth surfaces. No marketing carousel.

## Tests
Login success/failure, expired session, refresh failure, anonymous draft claim.
