import { execFileSync } from "node:child_process";
import { eq, sql } from "drizzle-orm";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import {
  authChallenges,
  connectDb,
  db,
  disconnectDb,
  migrateDb,
  sessions,
} from "../../src/database";

let container: StartedPostgreSqlContainer | undefined;

export function isDockerAvailable() {
  try {
    execFileSync("docker", ["info"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export async function startTestDb() {
  container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("auth_starter_test")
    .withUsername("postgres")
    .withPassword("postgres")
    .start();
  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url;
  await connectDb(url);
  await migrateDb();
}

export async function stopTestDb() {
  await disconnectDb();
  await container?.stop();
  container = undefined;
}

export async function resetTestDb() {
  await db.execute(
    sql`TRUNCATE TABLE auth_challenges, sessions, auth_identities, drift_events, drift_checks, scenarios, plan_versions, financial_snapshots, plans, transaction_sources, transactions, accounts, categories, household_members, session_families, households, users, planner_message_citations, planner_messages, planner_conversations, evidence, research_runs, documents, privacy_exports, household_deletions, consent_records, audit_events RESTART IDENTITY CASCADE`,
  );
}

export async function findSessionsByUserId(userId: string) {
  return db.select().from(sessions).where(eq(sessions.userId, userId));
}

export async function findPasswordResetChallenge() {
  const [challenge] = await db
    .select()
    .from(authChallenges)
    .where(eq(authChallenges.type, "password_reset"))
    .limit(1);
  return challenge ?? null;
}

export async function setChallengeTokenHash(id: string, tokenHash: string) {
  await db.update(authChallenges).set({ tokenHash }).where(eq(authChallenges.id, id));
}
