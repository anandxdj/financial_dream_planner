import { beforeEach, describe, expect, it } from "vitest";
import { demoStore } from "@/lib/demo-store";

describe("Goals Seed Data Preservation", () => {
  beforeEach(() => {
    demoStore.setActivePersonaId("rohit");
    demoStore.reset();
  });

  it("retains previous seed goals when adding a new goal", () => {
    // 1. Initial state for Rohit Verma has 2 seed goals
    const initialGoals = demoStore.getGoals();
    expect(initialGoals).toHaveLength(2);
    const initialNames = initialGoals.map((g) => g.name);
    expect(initialNames).toContain("Royal Enfield Bullet 350");
    expect(initialNames).toContain("Starter Home Down Payment");

    // 2. Add a new goal (e.g. "Travel to manali")
    const newGoal = demoStore.addGoal({
      name: "Travel to manali",
      category: "travel",
      targetAmount: "500000.00",
      targetDate: "2030-12-31",
      currentSavings: "0.00",
      monthlyContribution: "12000.00",
    });

    // 3. Verify total goals is now 3 and seed goals were NOT removed
    const updatedGoals = demoStore.getGoals();
    expect(updatedGoals).toHaveLength(3);

    const updatedNames = updatedGoals.map((g) => g.name);
    expect(updatedNames).toContain("Royal Enfield Bullet 350");
    expect(updatedNames).toContain("Starter Home Down Payment");
    expect(updatedNames).toContain("Travel to manali");
    expect(newGoal.id).toBeDefined();

    // 4. Verify feasibility engine dynamically includes all 3 goals
    const feasibility = demoStore.getFeasibility();
    expect(feasibility.goals).toHaveLength(3);
    expect(feasibility.goals.map((g) => g.id)).toContain(newGoal.id);

    // 5. Verify deleting the newly added goal leaves the seed goals intact
    demoStore.deleteGoal(newGoal.id);
    const afterDelete = demoStore.getGoals();
    expect(afterDelete).toHaveLength(2);
    expect(afterDelete.map((g) => g.name)).toEqual(initialNames);
  });

  it("preserves seed goals for Anand persona as well", () => {
    demoStore.setActivePersonaId("anand");
    demoStore.reset();

    const initialGoals = demoStore.getGoals();
    expect(initialGoals).toHaveLength(2);
    expect(initialGoals.map((g) => g.name)).toContain("Emergency Reserve");
    expect(initialGoals.map((g) => g.name)).toContain("First Home Down Payment (Bengaluru)");

    // Add a 3rd goal to Anand
    demoStore.addGoal({
      name: "Europe Summer Vacation",
      category: "travel",
      targetAmount: "600000.00",
      targetDate: "2027-06-30",
      currentSavings: "50000.00",
      monthlyContribution: "25000.00",
    });

    const updatedGoals = demoStore.getGoals();
    expect(updatedGoals).toHaveLength(3);
    expect(updatedGoals.map((g) => g.name)).toContain("Emergency Reserve");
    expect(updatedGoals.map((g) => g.name)).toContain("First Home Down Payment (Bengaluru)");
    expect(updatedGoals.map((g) => g.name)).toContain("Europe Summer Vacation");
  });

  it("resets to initial seed data when reset is triggered", () => {
    demoStore.addGoal({
      name: "Temporary Dream",
      category: "custom",
    });
    expect(demoStore.getGoals()).toHaveLength(3);

    demoStore.reset();
    expect(demoStore.getGoals()).toHaveLength(2);
    expect(demoStore.getGoals().map((g) => g.name)).not.toContain("Temporary Dream");
  });
});
