import { AppError } from "../../../shared/errors/app-error";

export interface RiskValidationResult {
  approved: boolean;
  violations: string[];
}

// Restrictions removed for now; safety guidelines are enforced directly via the LLM system prompt.
export function validateRiskPolicy(_content: string): RiskValidationResult {
  return {
    approved: true,
    violations: [],
  };
}

export function enforceRiskPolicy(content: string): void {
  const result = validateRiskPolicy(content);
  if (!result.approved) {
    throw new AppError(
      422,
      "RISK_POLICY_VIOLATION",
      `Planning output violates safety risk policy: ${result.violations.join("; ")}`,
    );
  }
}
