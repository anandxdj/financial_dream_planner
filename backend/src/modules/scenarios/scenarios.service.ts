import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../database/client";
import {
  financialSnapshots,
  plans,
  planVersions,
  type SelectFinancialSnapshot,
  type SelectPlan,
  type SelectPlanVersion,
} from "../plans/model";
import {
  scenarios,
  type SelectScenario,
} from "./model";
import {
  evaluateScenario,
  type ScenarioDomainInputs,
  type ScenarioEvaluationOutput,
} from "../financial-engine";
import { computeCanonicalHash } from "../../shared/utils/canonical-json";
import { AppError } from "../../shared/errors/app-error";

export interface CreateScenarioInput {
  name: string;
  description?: string;
  overlay: ScenarioDomainInputs;
}

export interface AppliedScenarioResult {
  plan: SelectPlan;
  version: SelectPlanVersion;
  snapshot: SelectFinancialSnapshot;
}

export interface CompareScenariosResult {
  baselineVersionId: string;
  scenarios: ScenarioEvaluationOutput[];
}

export function serializeScenario(scenario: SelectScenario) {
  return {
    id: scenario.id,
    householdId: scenario.householdId,
    baselineVersionId: scenario.baselineVersionId,
    name: scenario.name,
    description: scenario.description ?? null,
    overlay: scenario.overlay,
    status: scenario.status as "draft" | "applied",
    appliedVersionId: scenario.appliedVersionId ?? null,
    appliedAt: scenario.appliedAt ? scenario.appliedAt.toISOString() : null,
    createdAt: scenario.createdAt.toISOString(),
    updatedAt: scenario.updatedAt.toISOString(),
  };
}

export function mergeScenarioInputs(
  baseline: ScenarioDomainInputs,
  overlay: ScenarioDomainInputs,
): ScenarioDomainInputs {
  const merged: ScenarioDomainInputs = {};
  const domains: (keyof ScenarioDomainInputs)[] = [
    "cashFlow",
    "emergencyFund",
    "loan",
    "investment",
    "goal",
    "netWorth",
  ];

  for (const domain of domains) {
    const baseVal = baseline[domain];
    const overVal = overlay[domain];
    if (baseVal || overVal) {
      merged[domain] = {
        ...(baseVal ?? {}),
        ...(overVal ?? {}),
      } as any;
    }
  }

  return merged;
}

export async function createScenario(
  householdId: string,
  input: CreateScenarioInput,
): Promise<SelectScenario> {
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.householdId, householdId))
    .limit(1);

  if (!plan || !plan.currentVersionId) {
    throw new AppError(400, "NO_CURRENT_PLAN", "Cannot create scenario without an existing current plan");
  }

  const [created] = await db
    .insert(scenarios)
    .values({
      householdId,
      baselineVersionId: plan.currentVersionId,
      name: input.name,
      description: input.description ?? null,
      overlay: input.overlay,
      status: "draft",
    })
    .returning();

  return created;
}

export async function listScenarios(householdId: string): Promise<SelectScenario[]> {
  return db
    .select()
    .from(scenarios)
    .where(eq(scenarios.householdId, householdId))
    .orderBy(desc(scenarios.createdAt));
}

export async function getScenarioById(
  householdId: string,
  id: string,
): Promise<SelectScenario> {
  const [scenario] = await db
    .select()
    .from(scenarios)
    .where(and(eq(scenarios.id, id), eq(scenarios.householdId, householdId)))
    .limit(1);

  if (!scenario) {
    throw new AppError(404, "SCENARIO_NOT_FOUND", "Scenario not found");
  }

  return scenario;
}

export async function runScenario(
  householdId: string,
  id: string,
): Promise<ScenarioEvaluationOutput> {
  const scenario = await getScenarioById(householdId, id);

  const [row] = await db
    .select({
      version: planVersions,
      snapshot: financialSnapshots,
    })
    .from(planVersions)
    .innerJoin(financialSnapshots, eq(financialSnapshots.id, planVersions.snapshotId))
    .where(and(eq(planVersions.id, scenario.baselineVersionId), eq(planVersions.householdId, householdId)))
    .limit(1);

  if (!row) {
    throw new AppError(404, "PLAN_VERSION_NOT_FOUND", "Baseline plan version not found");
  }

  return evaluateScenario({
    name: scenario.name,
    description: scenario.description ?? undefined,
    baseline: row.snapshot.inputs,
    scenario: scenario.overlay,
    policyVersion: row.snapshot.policyVersion,
  });
}

export async function compareScenarios(
  householdId: string,
  scenarioIds: string[],
): Promise<CompareScenariosResult> {
  if (scenarioIds.length < 2 || scenarioIds.length > 10) {
    throw new AppError(400, "INVALID_SCENARIO_COUNT", "Comparison requires between 2 and 10 scenarios");
  }

  const uniqueScenarioIds = [...new Set(scenarioIds)];

  const loadedScenarios = await db
    .select()
    .from(scenarios)
    .where(and(eq(scenarios.householdId, householdId), inArray(scenarios.id, uniqueScenarioIds)));

  if (loadedScenarios.length !== uniqueScenarioIds.length) {
    throw new AppError(404, "SCENARIO_NOT_FOUND", "One or more scenarios not found");
  }

  if (uniqueScenarioIds.length !== scenarioIds.length) {
    throw new AppError(400, "DUPLICATE_SCENARIO_IDS", "Scenario IDs must be unique");
  }

  const baselineVersionIds = new Set(loadedScenarios.map((s) => s.baselineVersionId));
  if (baselineVersionIds.size > 1) {
    throw new AppError(
      400,
      "SCENARIO_MIXED_BASELINES",
      "All scenarios in a comparison must share the same baseline plan version",
    );
  }

  const commonBaselineVersionId = Array.from(baselineVersionIds)[0];
  const [row] = await db
    .select({
      version: planVersions,
      snapshot: financialSnapshots,
    })
    .from(planVersions)
    .innerJoin(financialSnapshots, eq(financialSnapshots.id, planVersions.snapshotId))
    .where(and(eq(planVersions.id, commonBaselineVersionId), eq(planVersions.householdId, householdId)))
    .limit(1);

  if (!row) {
    throw new AppError(404, "PLAN_VERSION_NOT_FOUND", "Baseline plan version not found");
  }

  const scenarioMap = new Map<string, SelectScenario>();
  for (const s of loadedScenarios) {
    scenarioMap.set(s.id, s);
  }

  // Preserve caller order
  const results: ScenarioEvaluationOutput[] = [];
  for (const sId of scenarioIds) {
    const sc = scenarioMap.get(sId)!;
    const evaluated = evaluateScenario({
      name: sc.name,
      description: sc.description ?? undefined,
      baseline: row.snapshot.inputs,
      scenario: sc.overlay,
      policyVersion: row.snapshot.policyVersion,
    });
    results.push(evaluated);
  }

  return {
    baselineVersionId: commonBaselineVersionId,
    scenarios: results,
  };
}

export async function applyScenario(
  householdId: string,
  id: string,
): Promise<AppliedScenarioResult> {
  return db.transaction(async (tx) => {
    // 1. Transaction-level advisory lock on household
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${householdId}))`);

    // 2. Lock scenario row
    const [scenario] = await tx
      .select()
      .from(scenarios)
      .where(and(eq(scenarios.id, id), eq(scenarios.householdId, householdId)))
      .for("update");

    if (!scenario) {
      throw new AppError(404, "SCENARIO_NOT_FOUND", "Scenario not found");
    }

    // 3. Lock plan row
    const [plan] = await tx
      .select()
      .from(plans)
      .where(eq(plans.householdId, householdId))
      .for("update");

    if (!plan || !plan.currentVersionId) {
      throw new AppError(404, "PLAN_NOT_FOUND", "Plan not found");
    }

    // 4. Idempotent return if already applied
    if (scenario.status === "applied" && scenario.appliedVersionId) {
      const [appliedVersion] = await tx
        .select()
        .from(planVersions)
        .where(and(eq(planVersions.id, scenario.appliedVersionId), eq(planVersions.householdId, householdId)))
        .limit(1);

      if (appliedVersion) {
        const [appliedSnapshot] = await tx
          .select()
          .from(financialSnapshots)
          .where(
            and(
              eq(financialSnapshots.id, appliedVersion.snapshotId),
              eq(financialSnapshots.householdId, householdId),
            ),
          )
          .limit(1);

        if (appliedSnapshot) {
          return {
            plan,
            version: appliedVersion,
            snapshot: appliedSnapshot,
          };
        }
      }
    }

    // 5. Stale baseline check
    if (plan.currentVersionId !== scenario.baselineVersionId) {
      throw new AppError(
        409,
        "SCENARIO_BASELINE_STALE",
        "Scenario baseline is no longer the current plan version",
      );
    }

    // 6. Load baseline version and snapshot
    const [baselineVersion] = await tx
      .select()
      .from(planVersions)
      .where(and(eq(planVersions.id, scenario.baselineVersionId), eq(planVersions.householdId, householdId)))
      .limit(1);

    if (!baselineVersion) {
      throw new AppError(404, "PLAN_VERSION_NOT_FOUND", "Baseline plan version not found");
    }

    const [baselineSnapshot] = await tx
      .select()
      .from(financialSnapshots)
      .where(
        and(
          eq(financialSnapshots.id, baselineVersion.snapshotId),
          eq(financialSnapshots.householdId, householdId),
        ),
      )
      .limit(1);

    if (!baselineSnapshot) {
      throw new AppError(404, "SNAPSHOT_NOT_FOUND", "Baseline snapshot not found");
    }

    // 7. Merge inputs and evaluate
    const mergedInputs = mergeScenarioInputs(baselineSnapshot.inputs, scenario.overlay);
    const evalResult = evaluateScenario({
      name: scenario.name,
      description: scenario.description ?? undefined,
      baseline: mergedInputs,
      scenario: {},
      policyVersion: baselineSnapshot.policyVersion,
    });

    const inputHash = computeCanonicalHash(mergedInputs);
    const outputHash = computeCanonicalHash(evalResult.baseline);

    // 8. Next version number
    const [maxVerRow] = await tx
      .select({
        maxVer: sql<number>`coalesce(max(${planVersions.versionNumber}), 0)`,
      })
      .from(planVersions)
      .where(eq(planVersions.planId, plan.id));

    const nextVersionNumber = Number(maxVerRow?.maxVer ?? 0) + 1;

    // 9. Insert new snapshot
    const [newSnapshot] = await tx
      .insert(financialSnapshots)
      .values({
        householdId,
        asOf: baselineSnapshot.asOf,
        revision: baselineSnapshot.revision,
        engineVersion: baselineSnapshot.engineVersion,
        policyVersion: evalResult.policyVersion,
        inputs: mergedInputs,
        resolvedAssumptions: evalResult.resolvedAssumptions,
        completeness: evalResult.completeness,
        inputHash,
        outputHash,
        calculatedOutput: evalResult.baseline,
      })
      .returning();

    // 10. Insert new plan version
    const [newVersion] = await tx
      .insert(planVersions)
      .values({
        householdId,
        planId: plan.id,
        versionNumber: nextVersionNumber,
        snapshotId: newSnapshot.id,
        assumptions: evalResult.resolvedAssumptions,
        scenarioOutput: evalResult,
      })
      .returning();

    // 11. Advance plan's currentVersionId
    const [updatedPlan] = await tx
      .update(plans)
      .set({
        currentVersionId: newVersion.id,
        updatedAt: new Date(),
      })
      .where(eq(plans.id, plan.id))
      .returning();

    // 12. Mark scenario as applied
    await tx
      .update(scenarios)
      .set({
        status: "applied",
        appliedVersionId: newVersion.id,
        appliedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(scenarios.id, scenario.id));

    return {
      plan: updatedPlan,
      version: newVersion,
      snapshot: newSnapshot,
    };
  });
}
