import { AppError } from "../../../shared/errors/app-error";
import type { LlmProvider, LlmRequest, LlmResponse } from "./llm-provider";

export interface FallbackRouterOptions {
  primary: LlmProvider;
  fallback: LlmProvider;
}

export class FallbackLlmRouter implements LlmProvider {
  readonly providerName = "fallback-router";
  readonly primary: LlmProvider;
  readonly fallback: LlmProvider;

  constructor(options: FallbackRouterOptions) {
    this.primary = options.primary;
    this.fallback = options.fallback;
  }

  isFallbackEligible(err: any, hasEmittedVisibleOutput = false): boolean {
    if (hasEmittedVisibleOutput) {
      return false; // Strict requirement: never switch providers after user-visible output begins
    }

    if (err && err.name === "AbortError") {
      return false; // Caller cancellation does not fall back
    }

    if (err instanceof AppError) {
      // Ineligible error codes
      if (
        err.code === "PROVIDER_AUTH_ERROR" ||
        err.code === "PROMPT_INJECTION_DETECTED" ||
        err.code === "RISK_POLICY_VIOLATION" ||
        err.code === "UNAUTHORIZED_TOOL" ||
        err.code === "DISALLOWED_INTENT" ||
        err.code === "INVALID_INPUT"
      ) {
        return false;
      }

      // Eligible error codes
      if (
        err.code === "PROVIDER_TIMEOUT" ||
        err.code === "PROVIDER_UNAVAILABLE" ||
        err.code === "PROVIDER_RATE_LIMITED" ||
        err.code === "STRUCTURED_OUTPUT_VALIDATION_FAILED" ||
        err.statusCode === 408 ||
        err.statusCode === 429 ||
        err.statusCode === 500 ||
        err.statusCode === 502 ||
        err.statusCode === 503 ||
        err.statusCode === 504
      ) {
        return true;
      }
    }

    return false;
  }

  async generate(
    request: LlmRequest,
    context?: { hasEmittedVisibleOutput?: boolean },
  ): Promise<LlmResponse> {
    try {
      return await this.primary.generate(request);
    } catch (primaryErr: any) {
      if (!this.isFallbackEligible(primaryErr, context?.hasEmittedVisibleOutput)) {
        throw primaryErr;
      }

      // Execute fallback attempt (at most 1 per stage)
      return await this.fallback.generate(request);
    }
  }
}
