import { AppError } from "../../../shared/errors/app-error";
import type { LlmProvider, LlmRequest, LlmResponse, LlmToolCall } from "./llm-provider";

export interface OpenAiConfig {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  fetchTransport?: (url: string, init?: RequestInit) => Promise<Response>;
}

export class OpenAiLlmAdapter implements LlmProvider {
  readonly providerName = "openai-compatible";
  private baseUrl: string;
  private apiKey: string;
  private model: string;
  private fetchTransport: (url: string, init?: RequestInit) => Promise<Response>;

  constructor(config: OpenAiConfig = {}) {
    this.baseUrl = (config.baseUrl ?? process.env.AI_PRIMARY_BASE_URL ?? "https://api.openai.com/v1").replace(
      /\/+$/,
      "",
    );
    this.apiKey = config.apiKey ?? process.env.AI_PRIMARY_API_KEY ?? "";
    this.model = config.model ?? process.env.AI_PRIMARY_MODEL ?? "gpt-4o-mini";
    this.fetchTransport = config.fetchTransport ?? fetch;
  }

  async generate(request: LlmRequest): Promise<LlmResponse> {
    const timeoutMs = request.timeoutMs ?? 15000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const formattedMessages = request.messages.map((m) => {
      const msgObj: Record<string, unknown> = {
        role: m.role,
        content: m.content,
      };
      if (m.name) msgObj.name = m.name;
      if (m.toolCallId) msgObj.tool_call_id = m.toolCallId;
      if (m.toolCalls && m.toolCalls.length > 0) {
        msgObj.tool_calls = m.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        }));
      }
      return msgObj;
    });

    const bodyPayload: Record<string, unknown> = {
      model: this.model,
      messages: formattedMessages,
    };

    if (request.tools && request.tools.length > 0) {
      bodyPayload.tools = request.tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }

    if (request.responseSchema) {
      bodyPayload.response_format = { type: "json_object" };
    }

    try {
      const response = await this.fetchTransport(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(bodyPayload),
        signal: request.signal ?? controller.signal,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new AppError(500, "PROVIDER_AUTH_ERROR", "Primary LLM authentication failed");
        }
        if (response.status === 429) {
          throw new AppError(429, "PROVIDER_RATE_LIMITED", "Primary LLM provider rate limit exceeded");
        }
        if (response.status >= 500) {
          throw new AppError(503, "PROVIDER_UNAVAILABLE", `Primary LLM returned server error ${response.status}`);
        }
        throw new AppError(502, "INVALID_PROVIDER_OUTPUT", `Primary LLM request failed with status ${response.status}`);
      }

      const data = (await response.json()) as any;
      const choice = data.choices?.[0];
      if (!choice || !choice.message) {
        throw new AppError(502, "INVALID_PROVIDER_OUTPUT", "Primary LLM returned empty choices");
      }

      const rawContent: string | null = choice.message.content ?? null;
      let parsed: unknown = undefined;

      if (request.responseSchema && rawContent) {
        try {
          parsed = JSON.parse(rawContent);
        } catch {
          throw new AppError(
            502,
            "STRUCTURED_OUTPUT_VALIDATION_FAILED",
            "Failed to parse structured JSON output from primary LLM",
          );
        }
      }

      const toolCalls: LlmToolCall[] = [];
      if (Array.isArray(choice.message.tool_calls)) {
        for (const tc of choice.message.tool_calls) {
          if (tc.type === "function" && tc.function) {
            let parsedArgs: Record<string, unknown> = {};
            if (tc.function.arguments) {
              try {
                parsedArgs = JSON.parse(tc.function.arguments);
              } catch {
                throw new AppError(
                  502,
                  "INVALID_PROVIDER_OUTPUT",
                  `Failed to parse tool call arguments for tool ${tc.function.name}`,
                );
              }
            }
            toolCalls.push({
              id: tc.id || `call_${Math.random().toString(36).substring(2, 9)}`,
              name: tc.function.name,
              arguments: parsedArgs,
            });
          }
        }
      }

      return {
        content: rawContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        parsed,
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens ?? 0,
              completionTokens: data.usage.completion_tokens ?? 0,
              totalTokens: data.usage.total_tokens ?? 0,
            }
          : undefined,
        provider: this.providerName,
        model: this.model,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (err.name === "AbortError") {
        throw new AppError(504, "PROVIDER_TIMEOUT", "Primary LLM request timed out");
      }
      throw new AppError(503, "PROVIDER_UNAVAILABLE", "Primary LLM connection failed");
    } finally {
      clearTimeout(timer);
    }
  }
}
