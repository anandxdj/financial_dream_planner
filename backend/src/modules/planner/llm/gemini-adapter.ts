import { AppError } from "../../../shared/errors/app-error";
import type { LlmProvider, LlmRequest, LlmResponse, LlmToolCall } from "./llm-provider";

export interface GeminiConfig {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  fetchTransport?: (url: string, init?: RequestInit) => Promise<Response>;
}

export class GeminiLlmAdapter implements LlmProvider {
  readonly providerName = "gemini";
  private baseUrl: string;
  private apiKey: string;
  private model: string;
  private fetchTransport: (url: string, init?: RequestInit) => Promise<Response>;

  constructor(config: GeminiConfig = {}) {
    this.baseUrl = (
      config.baseUrl ??
      process.env.AI_FALLBACK_BASE_URL ??
      "https://generativelanguage.googleapis.com/v1beta"
    ).replace(/\/+$/, "");
    this.apiKey = config.apiKey ?? process.env.AI_FALLBACK_API_KEY ?? "";
    this.model = config.model ?? process.env.AI_FALLBACK_MODEL ?? "gemini-1.5-flash";
    this.fetchTransport = config.fetchTransport ?? fetch;
  }

  async generate(request: LlmRequest): Promise<LlmResponse> {
    const timeoutMs = request.timeoutMs ?? 15000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let systemText = "";
    const contents: Array<{ role: string; parts: Array<Record<string, unknown>> }> = [];

    for (const msg of request.messages) {
      if (msg.role === "system") {
        systemText += (systemText ? "\n\n" : "") + msg.content;
      } else if (msg.role === "tool") {
        contents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name: msg.name || "tool_result",
                response: { content: msg.content },
              },
            },
          ],
        });
      } else {
        const parts: Array<Record<string, unknown>> = [];
        if (msg.content) {
          parts.push({ text: msg.content });
        }
        if (msg.toolCalls) {
          for (const tc of msg.toolCalls) {
            parts.push({
              functionCall: {
                name: tc.name,
                args: tc.arguments,
              },
            });
          }
        }
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: parts.length > 0 ? parts : [{ text: "" }],
        });
      }
    }

    const bodyPayload: Record<string, unknown> = {
      contents,
    };

    if (systemText) {
      bodyPayload.system_instruction = {
        parts: [{ text: systemText }],
      };
    }

    if (request.tools && request.tools.length > 0) {
      bodyPayload.tools = [
        {
          functionDeclarations: request.tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        },
      ];
    }

    if (request.responseSchema) {
      bodyPayload.generationConfig = {
        responseMimeType: "application/json",
      };
    }

    const endpointUrl = `${this.baseUrl}/models/${this.model}:generateContent`;

    try {
      const response = await this.fetchTransport(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { "x-goog-api-key": this.apiKey } : {}),
        },
        body: JSON.stringify(bodyPayload),
        signal: request.signal ?? controller.signal,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new AppError(500, "PROVIDER_AUTH_ERROR", "Gemini LLM authentication failed");
        }
        if (response.status === 429) {
          throw new AppError(429, "PROVIDER_RATE_LIMITED", "Gemini LLM rate limit exceeded");
        }
        if (response.status >= 500) {
          throw new AppError(503, "PROVIDER_UNAVAILABLE", `Gemini LLM returned server error ${response.status}`);
        }
        throw new AppError(502, "INVALID_PROVIDER_OUTPUT", `Gemini LLM request failed with status ${response.status}`);
      }

      const data = (await response.json()) as any;
      const candidate = data.candidates?.[0];
      if (!candidate || !candidate.content || !Array.isArray(candidate.content.parts)) {
        throw new AppError(502, "INVALID_PROVIDER_OUTPUT", "Gemini LLM returned empty candidate");
      }

      let rawContent: string | null = null;
      const toolCalls: LlmToolCall[] = [];

      for (const part of candidate.content.parts) {
        if (part.text !== undefined) {
          rawContent = (rawContent || "") + part.text;
        }
        if (part.functionCall) {
          toolCalls.push({
            id: `call_${Math.random().toString(36).substring(2, 9)}`,
            name: part.functionCall.name,
            arguments: (part.functionCall.args as Record<string, unknown>) || {},
          });
        }
      }

      let parsed: unknown = undefined;
      if (request.responseSchema && rawContent) {
        try {
          parsed = JSON.parse(rawContent);
        } catch {
          throw new AppError(
            502,
            "STRUCTURED_OUTPUT_VALIDATION_FAILED",
            "Failed to parse structured JSON output from Gemini LLM",
          );
        }
      }

      const usageMetadata = data.usageMetadata;
      return {
        content: rawContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        parsed,
        usage: usageMetadata
          ? {
              promptTokens: usageMetadata.promptTokenCount ?? 0,
              completionTokens: usageMetadata.candidatesTokenCount ?? 0,
              totalTokens: usageMetadata.totalTokenCount ?? 0,
            }
          : undefined,
        provider: this.providerName,
        model: this.model,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (err.name === "AbortError") {
        throw new AppError(504, "PROVIDER_TIMEOUT", "Gemini LLM request timed out");
      }
      throw new AppError(503, "PROVIDER_UNAVAILABLE", "Fallback LLM connection failed");
    } finally {
      clearTimeout(timer);
    }
  }
}
