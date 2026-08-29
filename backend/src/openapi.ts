import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);
const registry = new OpenAPIRegistry();
const ErrorResponseSchema = registry.register("ErrorResponse", z.object({ error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional(), requestId: z.string() }) }));
const JobRunSchema = registry.register("JobRun", z.object({ id: z.string().uuid(), kind: z.string(), status: z.enum(["queued", "running", "completed", "failed", "cancelled"]), input: z.record(z.string(), z.unknown()), result: z.record(z.string(), z.unknown()).nullable(), error: z.record(z.string(), z.unknown()).nullable(), createdAt: z.string().datetime(), updatedAt: z.string().datetime() }));
const RunResponseSchema = registry.register("RunResponse", z.object({ data: JobRunSchema }));
const RunIdParamsSchema = z.object({ id: z.string().uuid() });
const json = (schema: z.ZodType) => ({ "application/json": { schema } });

registry.registerPath({ method: "get", path: "/api/v1/runs/{id}", request: { params: RunIdParamsSchema }, responses: { 200: { description: "Run", content: json(RunResponseSchema) }, 404: { description: "Missing", content: json(ErrorResponseSchema) } } });
registry.registerPath({ method: "post", path: "/api/v1/runs/{id}/cancel", request: { params: RunIdParamsSchema }, responses: { 200: { description: "Cancelled run", content: json(RunResponseSchema) } } });
registry.registerPath({ method: "get", path: "/api/v1/runs/{id}/events", request: { params: RunIdParamsSchema, headers: z.object({ "Last-Event-ID": z.string().uuid().optional() }) }, responses: { 200: { description: "Server-sent run events", content: { "text/event-stream": { schema: z.string() } } } } });

export function generateOpenApiDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({ openapi: "3.1.0", info: { title: "Living Financial Plan API", version: "1.0.0" }, servers: [{ url: "http://localhost:4000" }] });
}
