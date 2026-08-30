import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);
const registry = new OpenAPIRegistry();
const ErrorResponseSchema = registry.register("ErrorResponse", z.object({ error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional(), requestId: z.string() }) }));
const JobRunSchema = registry.register("JobRun", z.object({ id: z.string().uuid(), kind: z.string(), status: z.enum(["queued", "running", "completed", "failed", "cancelled"]), input: z.record(z.string(), z.unknown()), result: z.record(z.string(), z.unknown()).nullable(), error: z.record(z.string(), z.unknown()).nullable(), createdAt: z.string().datetime(), updatedAt: z.string().datetime() }));
const RunResponseSchema = registry.register("RunResponse", z.object({ data: JobRunSchema }));
const RunIdParamsSchema = z.object({ id: z.string().uuid() });
const json = (schema: z.ZodType) => ({ "application/json": { schema } });
const AuthUserSchema = registry.register("AuthUser", z.object({ id: z.string().uuid(), email: z.string().email(), displayName: z.string(), avatarUrl: z.string().nullable(), status: z.string(), emailVerified: z.boolean(), roles: z.array(z.string()), createdAt: z.string() }));
const AuthSessionSchema = registry.register("AuthSession", z.object({ user: AuthUserSchema }));
const RegisterSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128), displayName: z.string().min(1).max(80) });
const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const OidcStartSchema = z.object({ redirectUri: z.string().url(), clientId: z.string(), mode: z.enum(["browser", "mobile"]), appChallenge: z.string().optional() });
const OidcBridgeSchema = z.object({ code: z.string(), verifier: z.string(), redirectUri: z.string().url(), clientId: z.string() });

registry.registerPath({ method: "get", path: "/api/v1/runs/{id}", request: { params: RunIdParamsSchema }, responses: { 200: { description: "Run", content: json(RunResponseSchema) }, 404: { description: "Missing", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "post", path: "/api/v1/runs/{id}/cancel", request: { params: RunIdParamsSchema }, responses: { 200: { description: "Cancelled run", content: json(RunResponseSchema) } } });
registry.registerPath({ method: "get", path: "/api/v1/runs/{id}/events", request: { params: RunIdParamsSchema, headers: z.object({ "Last-Event-ID": z.string().uuid().optional() }) }, responses: { 200: { description: "Server-sent run events", content: { "text/event-stream": { schema: z.string() } } } } });
registry.registerPath({ method: "post", path: "/api/v1/auth/register", request: { body: { content: json(RegisterSchema) } }, responses: { 201: { description: "Registered", content: json(AuthSessionSchema) }, 409: { description: "Email exists", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "post", path: "/api/v1/auth/login", request: { body: { content: json(LoginSchema) } }, responses: { 200: { description: "Authenticated", content: json(AuthSessionSchema) }, 401: { description: "Invalid credentials", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "post", path: "/api/v1/auth/refresh", responses: { 200: { description: "Rotated session", content: json(AuthSessionSchema) }, 401: { description: "Invalid or reused refresh", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "post", path: "/api/v1/auth/oidc/start", request: { body: { content: json(OidcStartSchema) } }, responses: { 200: { description: "Central OIDC authorization URL", content: json(z.object({ authorizationUrl: z.string().url() })) } } });
registry.registerPath({ method: "get", path: "/api/v1/auth/oidc/callback", request: { query: z.object({ code: z.string(), state: z.string() }) }, responses: { 302: { description: "Browser callback or short-lived mobile bridge redirect" } } });
registry.registerPath({ method: "post", path: "/api/v1/auth/oidc/bridge/exchange", request: { body: { content: json(OidcBridgeSchema) } }, responses: { 200: { description: "Application token exchange", content: json(z.object({ accessToken: z.string(), refreshToken: z.string(), user: AuthUserSchema })) } } });
registry.registerPath({ method: "get", path: "/api/v1/users/me", responses: { 200: { description: "Current tenant-scoped user", content: json(AuthSessionSchema) }, 401: { description: "Inactive session", content: json(ErrorResponseSchema) } } });

export function generateOpenApiDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({ openapi: "3.1.0", info: { title: "Living Financial Plan API", version: "1.0.0" }, servers: [{ url: "http://localhost:4000" }] });
}
