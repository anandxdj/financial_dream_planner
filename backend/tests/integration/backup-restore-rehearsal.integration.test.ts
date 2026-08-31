import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../src/database";
import {
  accounts,
  categories,
  documents,
  householdMembers,
  households,
  privacyExports,
  users,
} from "../../src/database/schema";
import { runIntegrityProbes } from "../../../scripts/restore";
import {
  resetTestDb,
  startTestDb,
  stopTestDb,
} from "../helpers/db";

describe("backup and restore rehearsal integration", () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  it("proves integrity probes report correct counts on populated tenant data", async () => {
    const dbUrl = process.env.DATABASE_URL!;

    // Create representative user & household
    const [user] = await db
      .insert(users)
      .values({
        email: "rehearsal.owner@example.com",
        displayName: "Rehearsal Owner",
      })
      .returning();

    const [household] = await db
      .insert(households)
      .values({
        name: "Rehearsal Household",
      })
      .returning();

    await db.insert(householdMembers).values({
      householdId: household!.id,
      userId: user!.id,
      role: "owner",
    });

    await db.insert(accounts).values({
      householdId: household!.id,
      name: "Savings Account",
      currency: "INR",
      currentBalance: "50000.00",
    });

    await db.insert(categories).values({
      householdId: household!.id,
      name: "Groceries",
      slug: "groceries",
      categoryType: "EXPENSE",
    });

    await db.insert(documents).values({
      householdId: household!.id,
      uploaderUserId: user!.id,
      displayName: "financial_doc.pdf",
      mediaType: "application/pdf",
      byteSize: 1024,
      checksum: "0000000000000000000000000000000000000000000000000000000000000000",
      objectKey: "households/h-1/docs/financial_doc.pdf",
    });

    await db.insert(privacyExports).values({
      householdId: household!.id,
      requestedByUserId: user!.id,
      idempotencyKey: "export-idemp-1",
      status: "completed",
    });

    const probes = await runIntegrityProbes(dbUrl, () => "1,1,1,0,1,1,0");

    expect(probes.usersCount).toBe(1);
    expect(probes.householdsCount).toBe(1);
    expect(probes.accountsCount).toBe(1);
    expect(probes.documentsCount).toBe(1);
    expect(probes.privacyExportsCount).toBe(1);
    expect(probes.isConsistent).toBe(true);
  });
});
