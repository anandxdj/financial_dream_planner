import { AppError } from "../../../shared/errors/app-error";

const RISK_VIOLATION_PATTERNS = [
  // Specific stock / security buy/sell calls
  /\b(buy|sell|short|long)\s+(shares?\s+of\s+|stock\s+of\s+|equity\s+in\s+)?([A-Z]{2,10}|Reliance|Tata\s+Motors|Infosys|HDFC\s+Bank|TCS|ICICI\s+Bank|Wipro|ITC|SBI|Adani|Nvidia|Tesla|Apple)\b/i,
  /\b(target\s+price\s+of\s+(?:₹|INR|USD|\$)|stop\s+loss\s+at)\b/i,
  // Guaranteed returns
  /\b(guaranteed|assured|risk-free|100%\s+safe)\s+(returns?|profits?|yields?|gains?)\b/i,
  // Autonomous execution promises
  /\b(i\s+have\s+(executed|placed|applied|updated|deleted|modified|filed)|i\s+will\s+(execute\s+the\s+trade|file\s+your\s+taxes|make\s+the\s+payment))\b/i,
];

export interface RiskValidationResult {
  approved: boolean;
  violations: string[];
}

export function validateRiskPolicy(content: string): RiskValidationResult {
  const violations: string[] = [];

  for (const pattern of RISK_VIOLATION_PATTERNS) {
    if (pattern.test(content)) {
      violations.push(`Matches prohibited risk pattern: ${pattern.toString()}`);
    }
  }

  return {
    approved: violations.length === 0,
    violations,
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
