import { describe, expect, it } from "vitest";
import { AppError } from "../../src/shared/errors/app-error";
import { FallbackLlmRouter } from "../../src/modules/planner/llm/fallback-router";
import { GeminiLlmAdapter } from "../../src/modules/planner/llm/gemini-adapter";
import type { LlmProvider, LlmRequest, LlmResponse } from "../../src/modules/planner/llm/llm-provider";
import { OpenAiLlmAdapter } from "../../src/modules/planner/llm/openai-adapter";

describe("LLM Provider Abstraction & Fallback Router", () => {
  describe("OpenAI-compatible adapter", () => {
    it("formats request correctly and parses normalized response with usage and tool calls", async () => {
      let capturedBody: any;
      const mockFetch = async (_url: string, init?: RequestInit) => {
        capturedBody = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "Hello from OpenAI",
                  tool_calls: [
                    {
                      id: "call_1",
                      type: "function",
                      function: {
                        name: "calculate_cash_flow",
                        arguments: JSON.stringify({ income: "100000.00" }),
                      },
                    },
                  ],
                },
              },
            ],
            usage: {
              prompt_tokens: 15,
              completion_tokens: 25,
              total_tokens: 40,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      };

      const adapter = new OpenAiLlmAdapter({
        baseUrl: "https://api.openai.com/v1",
        apiKey: "test-openai-key",
        model: "gpt-4o-mini",
        fetchTransport: mockFetch as any,
      });

      const response = await adapter.generate({
        messages: [{ role: "user", content: "Plan my finances" }],
        tools: [
          {
            name: "calculate_cash_flow",
            description: "Cash flow tool",
            parameters: { type: "object" },
          },
        ],
      });

      expect(capturedBody.model).toBe("gpt-4o-mini");
      expect(capturedBody.messages[0].content).toBe("Plan my finances");
      expect(response.content).toBe("Hello from OpenAI");
      expect(response.toolCalls).toHaveLength(1);
      expect(response.toolCalls![0].name).toBe("calculate_cash_flow");
      expect(response.toolCalls![0].arguments).toEqual({ income: "100000.00" });
      expect(response.usage?.totalTokens).toBe(40);
    });

    it("parses structured output JSON schema", async () => {
      const mockFetch = async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  role: "assistant",
                  content: JSON.stringify({ summary: "Good cashflow", score: 85 }),
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );

      const adapter = new OpenAiLlmAdapter({
        fetchTransport: mockFetch as any,
      });

      const res = await adapter.generate({
        messages: [{ role: "user", content: "Analyze" }],
        responseSchema: { type: "object" },
      });

      expect(res.parsed).toEqual({ summary: "Good cashflow", score: 85 });
    });

    it("maps 401/403 to PROVIDER_AUTH_ERROR", async () => {
      const mockFetch = async () =>
        new Response("Unauthorized", { status: 401 });

      const adapter = new OpenAiLlmAdapter({ fetchTransport: mockFetch as any });
      await expect(adapter.generate({ messages: [{ role: "user", content: "test" }] })).rejects.toMatchObject({
        code: "PROVIDER_AUTH_ERROR",
        statusCode: 500,
      });
    });
  });

  describe("Gemini adapter", () => {
    it("formats system instruction and contents, and normalizes candidate response", async () => {
      let capturedBody: any;
      const mockFetch = async (_url: string, init?: RequestInit) => {
        capturedBody = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    { text: "Hello from Gemini" },
                    {
                      functionCall: {
                        name: "calculate_emergency_fund",
                        args: { monthlyEssentialExpenses: "30000.00" },
                      },
                    },
                  ],
                },
              },
            ],
            usageMetadata: {
              promptTokenCount: 20,
              candidatesTokenCount: 30,
              totalTokenCount: 50,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      };

      const adapter = new GeminiLlmAdapter({
        baseUrl: "https://generativelanguage.googleapis.com/v1beta",
        apiKey: "test-gemini-key",
        model: "gemini-1.5-flash",
        fetchTransport: mockFetch as any,
      });

      const response = await adapter.generate({
        messages: [
          { role: "system", content: "You are a financial planner." },
          { role: "user", content: "Help me save." },
        ],
        tools: [
          {
            name: "calculate_emergency_fund",
            description: "Emergency tool",
            parameters: { type: "object" },
          },
        ],
      });

      expect(capturedBody.system_instruction.parts[0].text).toBe("You are a financial planner.");
      expect(capturedBody.contents[0].parts[0].text).toBe("Help me save.");
      expect(response.content).toBe("Hello from Gemini");
      expect(response.toolCalls).toHaveLength(1);
      expect(response.toolCalls![0].name).toBe("calculate_emergency_fund");
      expect(response.toolCalls![0].arguments).toEqual({ monthlyEssentialExpenses: "30000.00" });
      expect(response.usage?.totalTokens).toBe(50);
    });
  });

  describe("Fallback Router Boundary Enforcement", () => {
    const createMockProvider = (name: string, impl: (req: LlmRequest) => Promise<LlmResponse>): LlmProvider => ({
      providerName: name,
      generate: impl,
    });

    it("returns primary output when primary succeeds", async () => {
      const primary = createMockProvider("primary", async () => ({
        content: "Primary Success",
        provider: "primary",
        model: "primary-model",
      }));
      const fallback = createMockProvider("fallback", async () => {
        throw new Error("Should not be called");
      });

      const router = new FallbackLlmRouter({ primary, fallback });
      const result = await router.generate({ messages: [{ role: "user", content: "Hello" }] });

      expect(result.content).toBe("Primary Success");
      expect(result.provider).toBe("primary");
    });

    it("switches to Gemini fallback on transient primary error (503/timeout/rate limit)", async () => {
      const primary = createMockProvider("primary", async () => {
        throw new AppError(503, "PROVIDER_UNAVAILABLE", "Primary server error");
      });
      const fallback = createMockProvider("fallback", async () => ({
        content: "Fallback Gemini Success",
        provider: "gemini",
        model: "gemini-1.5-flash",
      }));

      const router = new FallbackLlmRouter({ primary, fallback });
      const result = await router.generate({ messages: [{ role: "user", content: "Hello" }] });

      expect(result.content).toBe("Fallback Gemini Success");
      expect(result.provider).toBe("gemini");
    });

    it("switches to Gemini fallback on structured output validation failure", async () => {
      const primary = createMockProvider("primary", async () => {
        throw new AppError(502, "STRUCTURED_OUTPUT_VALIDATION_FAILED", "Malformed JSON");
      });
      const fallback = createMockProvider("fallback", async () => ({
        content: JSON.stringify({ valid: true }),
        parsed: { valid: true },
        provider: "gemini",
        model: "gemini-1.5-flash",
      }));

      const router = new FallbackLlmRouter({ primary, fallback });
      const result = await router.generate({ messages: [{ role: "user", content: "Hello" }] });

      expect(result.content).toContain("valid");
      expect(result.provider).toBe("gemini");
    });

    it("DOES NOT fall back on authentication/configuration error (401/403)", async () => {
      let fallbackCalled = false;
      const primary = createMockProvider("primary", async () => {
        throw new AppError(500, "PROVIDER_AUTH_ERROR", "Auth failed");
      });
      const fallback = createMockProvider("fallback", async () => {
        fallbackCalled = true;
        return { content: "Fallback", provider: "gemini", model: "model" };
      });

      const router = new FallbackLlmRouter({ primary, fallback });
      await expect(router.generate({ messages: [{ role: "user", content: "Hello" }] })).rejects.toMatchObject({
        code: "PROVIDER_AUTH_ERROR",
      });
      expect(fallbackCalled).toBe(false);
    });

    it("DOES NOT fall back on prompt injection or policy rejection", async () => {
      let fallbackCalled = false;
      const primary = createMockProvider("primary", async () => {
        throw new AppError(400, "PROMPT_INJECTION_DETECTED", "Injection detected");
      });
      const fallback = createMockProvider("fallback", async () => {
        fallbackCalled = true;
        return { content: "Fallback", provider: "gemini", model: "model" };
      });

      const router = new FallbackLlmRouter({ primary, fallback });
      await expect(router.generate({ messages: [{ role: "user", content: "Hello" }] })).rejects.toMatchObject({
        code: "PROMPT_INJECTION_DETECTED",
      });
      expect(fallbackCalled).toBe(false);
    });

    it("STRICTLY PROHIBITS switching providers after user-visible output begins", async () => {
      let fallbackCalled = false;
      const primary = createMockProvider("primary", async () => {
        throw new AppError(503, "PROVIDER_UNAVAILABLE", "Server crashed mid-stream");
      });
      const fallback = createMockProvider("fallback", async () => {
        fallbackCalled = true;
        return { content: "Fallback", provider: "gemini", model: "model" };
      });

      const router = new FallbackLlmRouter({ primary, fallback });
      await expect(
        router.generate(
          { messages: [{ role: "user", content: "Hello" }] },
          { hasEmittedVisibleOutput: true }, // Visible output already began
        ),
      ).rejects.toMatchObject({
        code: "PROVIDER_UNAVAILABLE",
      });
      expect(fallbackCalled).toBe(false);
    });
  });
});
