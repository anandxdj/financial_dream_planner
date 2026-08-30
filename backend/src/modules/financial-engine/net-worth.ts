import { Decimal, formatMoney, formatRate, parseNonNegativeDecimal } from "./decimal";
import { createCompletenessResult, type CompletenessResult } from "./completeness";
import { resolveAssumptions, type ResolvedAssumptions } from "./policy";

export interface AssetItem {
  id?: string;
  name: string;
  category: string;
  value: string;
}

export interface LiabilityItem {
  id?: string;
  name: string;
  category: string;
  value: string;
}

export interface CategoryAllocation {
  category: string;
  totalValue: string;
  percentage: string;
}

export interface NetWorthInput {
  assets?: AssetItem[];
  liabilities?: LiabilityItem[];
  policyVersion?: string;
}

export interface NetWorthOutput {
  totalAssets: string | null;
  totalLiabilities: string | null;
  netWorth: string | null;
  assetAllocations: CategoryAllocation[];
  liabilityBreakdown: CategoryAllocation[];
  completeness: CompletenessResult;
  policyVersion: string;
  resolvedAssumptions: ResolvedAssumptions;
}

export function calculateNetWorth(input: NetWorthInput): NetWorthOutput {
  const assumptions = resolveAssumptions(input.policyVersion);
  const missing: string[] = [];
  const warnings: string[] = [];

  if (input.assets === undefined || input.assets === null) missing.push("assets");
  if (input.liabilities === undefined || input.liabilities === null) missing.push("liabilities");

  if (missing.length > 0) {
    return {
      totalAssets: null,
      totalLiabilities: null,
      netWorth: null,
      assetAllocations: [],
      liabilityBreakdown: [],
      completeness: createCompletenessResult(missing, warnings),
      policyVersion: assumptions.policyVersion,
      resolvedAssumptions: assumptions,
    };
  }

  const assetCategoryMap = new Map<string, Decimal>();
  let totalAssets = new Decimal(0);

  for (const asset of input.assets!) {
    const val = parseNonNegativeDecimal(asset.value, `asset: ${asset.name || asset.category}`);
    totalAssets = totalAssets.add(val);
    const existing = assetCategoryMap.get(asset.category) ?? new Decimal(0);
    assetCategoryMap.set(asset.category, existing.add(val));
  }

  const liabilityCategoryMap = new Map<string, Decimal>();
  let totalLiabilities = new Decimal(0);

  for (const liability of input.liabilities!) {
    const val = parseNonNegativeDecimal(liability.value, `liability: ${liability.name || liability.category}`);
    totalLiabilities = totalLiabilities.add(val);
    const existing = liabilityCategoryMap.get(liability.category) ?? new Decimal(0);
    liabilityCategoryMap.set(liability.category, existing.add(val));
  }

  const netWorth = totalAssets.minus(totalLiabilities);

  const assetAllocations: CategoryAllocation[] = [];
  for (const [category, catTotal] of assetCategoryMap.entries()) {
    const percentage = totalAssets.greaterThan(0)
      ? catTotal.div(totalAssets).mul(100)
      : new Decimal(0);
    assetAllocations.push({
      category,
      totalValue: formatMoney(catTotal)!,
      percentage: formatRate(percentage)!,
    });
  }

  const liabilityBreakdown: CategoryAllocation[] = [];
  for (const [category, catTotal] of liabilityCategoryMap.entries()) {
    const percentage = totalLiabilities.greaterThan(0)
      ? catTotal.div(totalLiabilities).mul(100)
      : new Decimal(0);
    liabilityBreakdown.push({
      category,
      totalValue: formatMoney(catTotal)!,
      percentage: formatRate(percentage)!,
    });
  }

  return {
    totalAssets: formatMoney(totalAssets),
    totalLiabilities: formatMoney(totalLiabilities),
    netWorth: formatMoney(netWorth),
    assetAllocations,
    liabilityBreakdown,
    completeness: createCompletenessResult(missing, warnings),
    policyVersion: assumptions.policyVersion,
    resolvedAssumptions: assumptions,
  };
}
