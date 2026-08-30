# U6 AI and Research Specification

Date: 2026-08-30
Branch: `feat/financial-engine`
Status: accepted

## Scope

U6 adds a tenant-scoped AI planning and cited-research layer on top of the accepted deterministic financial engine and immutable U5 plans. The AI layer may explain, compare, research, and draft suggestions; it is never authoritative for calculations or plan state.

The unit delivers:

- a vendor-neutral LLM provider contract with an OpenAI-compatible primary adapter and Gemini fallback adapter;
- explicit provider routing and normalized failures, with fallback allowed only before user-visible output begins;
- bounded planner orchestration with supervisor, financial-state, research, risk, and critic stages;
- a closed, typed tool registry containing tenant-scoped reads, deterministic calculations, and approved research only;
- Tavily-compatible search plus a safe bounded document fetcher, source ranking, evidence persistence, and citation validation;
- durable conversations, user messages, final answers, research runs, and evidence with a 90-day default retention policy;
- authenticated planner/research APIs, OpenAPI/SDK contracts, migrations, documentation, and focused tests.

U6 does not autonomously edit or apply financial state. It may describe a possible scenario overlay, but persisted scenario-draft creation remains an explicit, separately authorized application operation and is not exposed as an LLM tool in this unit.

## Provider abstraction and fallback

Domain code depends on `LlmProvider`, not vendor SDK types. The normalized contract accepts system/user messages, a strict response schema, approved tool definitions, abort signal, and timeout, and returns either a validated final response or normalized tool calls and usage metadata. Raw chain-of-thought, provider request bodies, API keys, and raw provider traces are never persisted or returned.

The primary adapter calls the configured OpenAI Chat-Completions-compatible HTTPS endpoint. The fallback adapter calls the configured Gemini HTTPS endpoint. Outbound provider requests are dependency-injected and use fixed configured origins; model output cannot choose provider URLs, headers, credentials, or models.

Fallback is eligible only for timeout, transient provider error, model unavailable, rate limiting, or structured-output validation exhaustion. Authentication/configuration errors, caller cancellation, policy rejection, tool-authorization rejection, and prompt-injection rejection do not fall back. A run may switch from primary to Gemini only before any user-visible token or final answer has been emitted. At most one attempt per provider is made per orchestration stage.

Provider responses are untrusted. Tool calls must parse against the exact registered Zod input schema and pass server-side authorization before execution. Unknown tools, unknown fields, malformed arguments, repeated-call budget exhaustion, and attempts to smuggle instructions through tool output fail closed.

## Orchestration and safety policy

The planner workflow is an explicit bounded state graph:

1. supervisor classifies the request and rejects disallowed or unrelated intent;
2. financial-state stage reads only the authenticated household's current immutable plan/snapshot and prepares a minimal context;
3. optional research stage obtains approved external evidence;
4. planner creates educational guidance using deterministic outputs and cited evidence;
5. risk stage applies deterministic policy checks and may veto unsafe content;
6. critic validates supported assumptions, required citations, freshness, and policy compliance before a final answer is persisted.

Budgets cap graph steps, provider calls, tool calls, searches, fetched documents, response bytes, and elapsed time. The server, never the model, decides which tools are available at each stage.

Models can never:

- execute raw SQL or receive a database handle;
- choose or perform arbitrary HTTP requests, DNS lookups, redirects, or filesystem/process operations;
- inspect secrets or environment variables;
- create/apply scenarios, accept drift, update plans, advance current plan versions, or change snapshot/baseline data;
- trade, pay, file taxes, or recommend an individual security as a buy/sell instruction.

User text, prior messages, provider output, search snippets, and fetched pages are all untrusted data. They are delimited from system instructions and never promoted into tool authority. Prompt-injection detection and output policy checks fail closed with stable error codes. Retrieved instructions such as “ignore previous rules,” credential requests, encoded tool commands, or requests to cite unsupported claims cannot alter the graph or tool allowlist.

## Research and SSRF contract

`SearchProvider` returns normalized candidates. Tavily is the initial adapter. Search results are not evidence until normalized, safely fetched where appropriate, and persisted.

The safe fetcher permits HTTPS only and validates every initial URL and redirect. It rejects credentials in URLs, non-default ports, IP literals, localhost/local hostnames, private/link-local/loopback/multicast/reserved IPv4 and IPv6 ranges, non-public DNS answers, DNS rebinding, redirect loops, cross-scheme redirects, excessive redirects, oversized bodies, unsupported content types, and timeouts. DNS resolution and HTTP transport are injected for deterministic tests. Only bounded text/HTML responses are accepted; scripts and active content are never executed.

Sources rank: government/regulator; exchange/official filing; official provider; structured finance API; reputable publication; community. Evidence records include household and research-run ownership, topic, claim, canonical source URL, publisher, source type, optional publication/effective times, retrieval time, freshness expiry, content hash, bounded supporting excerpt, and confidence. Stored excerpts are evidence snippets, not raw page archives.

Every externally factual final-answer claim must reference one or more evidence IDs. Citation validation verifies ownership, existence, claim linkage, URL, freshness, and that the cited excerpt supports the attributed claim. Missing, foreign-tenant, stale-required, duplicate, or fabricated citations fail the critic stage. The API returns citation objects alongside final answers.

## Persistence and retention

- `planner_conversations` is household/user scoped and stores title/status plus `retention_expires_at`.
- `planner_messages` stores only `user` messages and `assistant` final answers, in stable sequence order. It never stores system prompts, hidden reasoning, intermediate agent messages, raw tool/provider traces, or secrets.
- `research_runs` is household/user scoped and records sanitized query, status, provider, failure code, timestamps, and retention expiry.
- `evidence` is household scoped and belongs to one research run; citations join assistant messages to evidence.

The default retention deadline is 90 days from creation. A deterministic retention service deletes expired conversations/messages and research/evidence in bounded batches while preserving unrelated household data. Reads treat expired records as unavailable even before cleanup. Retention is based on an injected clock and is covered by tests.

Database foreign keys include household ownership in composite references wherever practical. All service queries include authenticated `householdId`; client input never accepts a household ID. Cross-tenant IDs return 404 and cannot be used as citations.

## API contract

All endpoints require existing authentication, derive user and household exclusively from `AuthContext`, use strict Zod schemas, and return the standard error envelope.

- `POST /api/v1/planner/chat` accepts `{ conversationId?, message }`, persists the user message, runs the bounded graph, then persists and returns the final assistant message with citations. A missing/foreign conversation returns 404. Failed runs retain the user message but never persist a fabricated assistant answer.
- `POST /api/v1/planner/analyze` accepts `{ conversationId? }`, requires a current plan, analyzes its immutable current version without changing it, and returns/persists a cited final answer.
- `GET /api/v1/planner/conversations` returns non-expired conversations newest first with stable cursor pagination.
- `GET /api/v1/planner/conversations/:id/messages` returns non-expired visible messages in ascending sequence order with citation objects.
- `POST /api/v1/research` accepts a bounded `{ query, topic }`, performs approved search/fetch, persists the run/evidence, and returns the research run and evidence.
- `GET /api/v1/research/:id` returns the authenticated household's non-expired research run or 404.
- `GET /api/v1/research/:id/evidence` returns that run's evidence in deterministic rank/order or 404.

Request bodies reject unknown keys. Messages and queries are Unicode-normalized, length-bounded, reject NUL/control characters, and are never logged verbatim. Responses serialize timestamps as ISO-8601 strings.

## Failure semantics

Stable errors distinguish invalid input, missing current plan, prompt/policy rejection, unavailable provider, invalid provider output, unauthorized tool call, research failure, unsafe source URL, insufficient/freshness-invalid evidence, and expired/missing history. Provider and research details exposed to clients are sanitized; credentials, internal URLs, stack traces, and vendor payloads never appear.

Partial research or orchestration failure must not create a completed run or assistant answer. Database persistence uses transactions where final status/evidence/message consistency requires it. Retries cannot duplicate message sequence numbers, citations, or evidence identities.

## Acceptance gates

- Migrations define tenant ownership, durable visible history, evidence/citation integrity, retention indexes, status checks, and stable uniqueness constraints.
- Unit tests cover provider normalization and fallback/non-fallback boundaries, no switching after visible output, malformed structured output, tool allowlisting/argument validation/budgets, prompt injection, risk veto, unsupported assumptions, citation ownership/support/freshness, URL canonicalization, every SSRF class above, redirect/DNS rebinding, size/type/time limits, and retention cutoff/batching.
- PostgreSQL-backed integration/API tests cover authentication, strict contracts, durable history, failed-run behavior, citation persistence/order, tenant non-disclosure, immutable plan state before/after planner calls, and cleanup isolation.
- Tests use injected fake providers/transports; deterministic gates require no live AI, Tavily, DNS, or internet access and contain no skips.
- Existing U1-U5 tests remain green.
- Backend typecheck, lint, production build, full local and Docker-backed tests, migration generation/application, OpenAPI generation/check, SDK typecheck/build, and `git diff --check` pass.

## Out of scope

- token streaming and a dedicated planner SSE endpoint (durable U1 run-event transport remains available for a future async workflow);
- user-visible hidden reasoning or provider traces;
- document/R2 ingestion, privacy export, and account deletion (U8);
- drift detection/acceptance (U7);
- live-provider staging calls, which remain release gates;
- automatic scenario creation/application, plan recalculation, baseline mutation, trading, payments, or tax filing.

## Completion evidence

- Antigravity bulk implementation: Gemini 3.7 Flash High, conversation `babc5201-7c66-4f0b-aef2-2b1feeb900fc`, explicitly authorized by the user for private-repository access, edits, configured account, and network use. It preserved the branch/HEAD and did not commit or push. Its wrapper ended with a stream-interrupted `ERROR`; all reported results were treated only as claims.
- Conductor review audited the readable trace and every changed source/test/document/migration/contract file. Corrections connected the closed tool registry to the LangGraph loop, added bounded provider/tool calls, FK-backed message citations, concurrency-safe sequence allocation, sanitized failure messages, complete failed-run transitions, strict path/query validation, broader injection detection, explicit citation enforcement, streaming body limits, and validated-IP-pinned HTTPS dispatch.
- Final conductor-controlled backend result: 36 test files and 218 tests pass with no skips or failures while PostgreSQL API/integration/concurrency tests run through Docker; backend typecheck, lint, and production build pass.
- Drizzle migrations `0007` and `0008` plus metadata were generated and applied by the Docker-backed suite. OpenAPI and SDK contracts were regenerated; SDK typecheck/build and `git diff --check` pass. The post-commit `openapi:check` is recorded after the dedicated U6 commit.
