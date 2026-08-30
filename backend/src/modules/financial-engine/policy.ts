import { AppError } from "../../shared/errors/app-error";
import { formatRate } from "./decimal";

export interface IncomeStabilityMonths {
  readonly stable: number;
  readonly variable: number;
  readonly irregular: number;
}

export interface ReturnScenarios {
  readonly conservative: string;
  readonly expected: string;
  readonly optimistic: string;
}

export interface PublishedPolicy {
  readonly version: string;
  readonly generalInflation: string;
  readonly educationInflation: string;
  readonly medicalInflation: string;
  readonly returns: ReturnScenarios;
  readonly defaultAnnualStepUp: string;
  readonly emergencyReserveMonths: IncomeStabilityMonths;
}

export const PUBLISHED_POLICIES: Readonly<Record<string, PublishedPolicy>> = Object.freeze({
  "IN-2026.1": Object.freeze({
    version: "IN-2026.1",
    generalInflation: "6.0000",
    educationInflation: "8.0000",
    medicalInflation: "8.0000",
    returns: Object.freeze({
      conservative: "6.0000",
      expected: "9.0000",
      optimistic: "12.0000",
    }),
    defaultAnnualStepUp: "0.0000",
    emergencyReserveMonths: Object.freeze({
      stable: 6,
      variable: 9,
      irregular: 12,
    }),
  }),
});

export const DEFAULT_POLICY_VERSION = "IN-2026.1";

export function getPublishedPolicy(version: string = DEFAULT_POLICY_VERSION): Readonly<PublishedPolicy> {
  const policy = PUBLISHED_POLICIES[version];
  if (!policy) {
    throw new AppError(400, "INVALID_POLICY_VERSION", `Unknown policy version: "${version}". Supported versions: ${Object.keys(PUBLISHED_POLICIES).join(", ")}`);
  }
  return policy;
}

export interface PolicyAssumptionsOverride {
  generalInflation?: string;
  educationInflation?: string;
  medicalInflation?: string;
  expectedReturn?: string;
  conservativeReturn?: string;
  optimisticReturn?: string;
  annualStepUp?: string;
  emergencyReserveMonths?: Partial<IncomeStabilityMonths>;
}

export interface ResolvedAssumptions {
  policyVersion: string;
  generalInflation: string;
  educationInflation: string;
  medicalInflation: string;
  returns: ReturnScenarios;
  annualStepUp: string;
  emergencyReserveMonths: IncomeStabilityMonths;
}

export function resolveAssumptions(
  version: string = DEFAULT_POLICY_VERSION,
  overrides?: PolicyAssumptionsOverride,
): ResolvedAssumptions {
  const policy = getPublishedPolicy(version);

  return {
    policyVersion: policy.version,
    generalInflation: formatRate(overrides?.generalInflation ?? policy.generalInflation)!,
    educationInflation: formatRate(overrides?.educationInflation ?? policy.educationInflation)!,
    medicalInflation: formatRate(overrides?.medicalInflation ?? policy.medicalInflation)!,
    returns: {
      conservative: formatRate(overrides?.conservativeReturn ?? policy.returns.conservative)!,
      expected: formatRate(overrides?.expectedReturn ?? policy.returns.expected)!,
      optimistic: formatRate(overrides?.optimisticReturn ?? policy.returns.optimistic)!,
    },
    annualStepUp: formatRate(overrides?.annualStepUp ?? policy.defaultAnnualStepUp)!,
    emergencyReserveMonths: {
      stable: overrides?.emergencyReserveMonths?.stable ?? policy.emergencyReserveMonths.stable,
      variable: overrides?.emergencyReserveMonths?.variable ?? policy.emergencyReserveMonths.variable,
      irregular: overrides?.emergencyReserveMonths?.irregular ?? policy.emergencyReserveMonths.irregular,
    },
  };
}
