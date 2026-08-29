# Financial Engine

The engine is a pure TypeScript library with explicit inputs: no database, clock, environment, provider, or logger access. It uses decimal arithmetic and documents rounding boundaries.

It calculates cash flow, savings rate, emergency runway, EMI/amortization/prepayment/refinancing, SIP and lump-sum projections, goal future cost/funding/required contribution, net worth, allocation, deterministic scenarios, and drift impact. Missing required inputs produce completeness warnings rather than zeros.

Initial visible defaults: general inflation 6%, education/medical inflation 8%, return scenarios 6/9/12%, step-up 0%, and emergency reserves of 6/9/12 months for stable/variable/irregular income. Defaults live in immutable published policy versions; historical outputs never inherit a later policy.
