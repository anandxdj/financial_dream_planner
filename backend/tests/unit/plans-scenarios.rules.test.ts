import { describe, expect, it } from "vitest";
import { mergeScenarioInputs } from "../../src/modules/scenarios/scenarios.service";
import {
  RecalculatePlanRequestSchema,
} from "../../src/modules/plans/model";
import {
  CreateScenarioRequestSchema,
  CompareScenariosRequestSchema,
} from "../../src/modules/scenarios/model";

describe("plans and scenarios rules & schemas", () => {
  describe("mergeScenarioInputs", () => {
    it("correctly overlays scenario changes onto baseline across domains", () => {
      const baseline = {
        cashFlow: {
          income: "100000.00",
          essentialExpenses: "40000.00",
          discretionaryExpenses: "20000.00",
        },
        emergencyFund: {
          currentReserves: "200000.00",
          incomeStability: "stable" as const,
        },
      };

      const overlay = {
        cashFlow: {
          income: "120000.00",
        },
        loan: {
          principal: "5000000.00",
          annualRate: "8.50",
          tenureMonths: 240,
        },
      };

      const merged = mergeScenarioInputs(baseline, overlay);

      expect(merged.cashFlow).toEqual({
        income: "120000.00",
        essentialExpenses: "40000.00",
        discretionaryExpenses: "20000.00",
      });

      expect(merged.emergencyFund).toEqual({
        currentReserves: "200000.00",
        incomeStability: "stable",
      });

      expect(merged.loan).toEqual({
        principal: "5000000.00",
        annualRate: "8.50",
        tenureMonths: 240,
      });

      expect(merged.investment).toBeUndefined();
    });
  });

  describe("RecalculatePlanRequestSchema", () => {
    it("validates valid recalculation request", () => {
      const valid = {
        asOf: "2026-08-30T12:00:00.000Z",
        revision: 0,
        inputs: {
          cashFlow: {
            income: "100000.00",
            essentialExpenses: "40000.00",
          },
        },
      };
      expect(() => RecalculatePlanRequestSchema.parse(valid)).not.toThrow();
    });

    it("rejects negative revision", () => {
      const invalid = {
        asOf: "2026-08-30T12:00:00.000Z",
        revision: -1,
        inputs: {},
      };
      expect(() => RecalculatePlanRequestSchema.parse(invalid)).toThrow();
    });

    it("rejects invalid asOf date", () => {
      const invalid = {
        asOf: "invalid-date",
        revision: 0,
        inputs: {},
      };
      expect(() => RecalculatePlanRequestSchema.parse(invalid)).toThrow();
    });

    it("rejects unknown extra fields (strict schema)", () => {
      const invalid = {
        asOf: "2026-08-30T12:00:00.000Z",
        revision: 0,
        inputs: {},
        unknownField: "malicious",
      };
      expect(() => RecalculatePlanRequestSchema.parse(invalid)).toThrow();
    });
  });

  describe("CreateScenarioRequestSchema", () => {
    it("validates valid scenario draft", () => {
      const valid = {
        name: "Higher Savings Scenario",
        description: "Reducing discretionary expenses by 5000",
        overlay: {
          cashFlow: {
            discretionaryExpenses: "15000.00",
          },
        },
      };
      expect(() => CreateScenarioRequestSchema.parse(valid)).not.toThrow();
    });

    it("rejects empty or whitespace-only name", () => {
      const invalid = {
        name: "   ",
        overlay: {},
      };
      expect(() => CreateScenarioRequestSchema.parse(invalid)).toThrow();
    });

    it("rejects unknown extra fields", () => {
      const invalid = {
        name: "Test",
        overlay: {},
        householdId: "00000000-0000-0000-0000-000000000000",
      };
      expect(() => CreateScenarioRequestSchema.parse(invalid)).toThrow();
    });
  });

  describe("CompareScenariosRequestSchema", () => {
    it("accepts 2 to 10 scenario IDs", () => {
      const valid2 = {
        scenarioIds: [
          "11111111-1111-4111-8111-111111111111",
          "22222222-2222-4222-8222-222222222222",
        ],
      };
      expect(() => CompareScenariosRequestSchema.parse(valid2)).not.toThrow();
    });

    it("rejects fewer than 2 scenario IDs", () => {
      const invalid1 = {
        scenarioIds: ["11111111-1111-4111-8111-111111111111"],
      };
      expect(() => CompareScenariosRequestSchema.parse(invalid1)).toThrow();
    });

    it("rejects duplicate scenario IDs", () => {
      const id = "11111111-1111-4111-8111-111111111111";
      expect(() => CompareScenariosRequestSchema.parse({ scenarioIds: [id, id] })).toThrow();
    });

    it("rejects more than 10 scenario IDs", () => {
      const ids = [
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
        "33333333-3333-4333-8333-333333333333",
        "44444444-4444-4444-8444-444444444444",
        "55555555-5555-4555-8555-555555555555",
        "66666666-6666-4666-8666-666666666666",
        "77777777-7777-4777-8777-777777777777",
        "88888888-8888-4888-8888-888888888888",
        "99999999-9999-4999-8999-999999999999",
        "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      ];
      expect(() => CompareScenariosRequestSchema.parse({ scenarioIds: ids })).toThrow();
    });
  });
});
