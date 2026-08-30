export type LlmRole = "system" | "user" | "assistant" | "tool";

export interface LlmToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LlmMessage {
  role: LlmRole;
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: LlmToolCall[];
}

export interface LlmToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LlmUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LlmRequest {
  messages: LlmMessage[];
  responseSchema?: Record<string, unknown>;
  tools?: LlmToolDefinition[];
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface LlmResponse {
  content: string | null;
  toolCalls?: LlmToolCall[];
  parsed?: unknown;
  usage?: LlmUsage;
  provider: string;
  model: string;
}

export interface LlmProvider {
  readonly providerName: string;
  generate(request: LlmRequest): Promise<LlmResponse>;
}
