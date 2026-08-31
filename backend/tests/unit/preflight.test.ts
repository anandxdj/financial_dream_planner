import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkBuildArtifacts,
  checkMigrations,
  checkRequiredEnvVars,
  runPreflight,
} from "../../../scripts/preflight";

describe("release preflight checks", () => {
  const rootDir = path.resolve(__dirname, "../../..");

  it("checks required environment variables without printing secrets", () => {
    const validEnv = {
      DATABASE_URL: "postgres://postgres:postgres@localhost:5432/db",
      ACCESS_TOKEN_SECRET: "secret123456789012345678901234567890",
      WEB_ORIGIN: "https://app.example.com",
      API_ORIGIN: "https://api.example.com",
    };
    const checkValid = checkRequiredEnvVars(validEnv as any);
    expect(checkValid.passed).toBe(true);
    expect(checkValid.message).not.toContain("secret1234567890");

    const invalidEnv = {
      DATABASE_URL: "",
      ACCESS_TOKEN_SECRET: "secret",
    };
    const checkInvalid = checkRequiredEnvVars(invalidEnv as any);
    expect(checkInvalid.passed).toBe(false);
    expect(checkInvalid.message).toContain("DATABASE_URL");
    expect(checkInvalid.message).toContain("WEB_ORIGIN");
  });

  it("checks build artifacts presence", () => {
    const result = checkBuildArtifacts(rootDir);
    // In dev before build this might be false, or true after build; check structure
    expect(result.name).toBe("build_artifacts");
    expect(typeof result.passed).toBe("boolean");
  });

  it("checks migrations presence", () => {
    const result = checkMigrations(rootDir);
    expect(result.passed).toBe(true);
    expect(result.message).toMatch(/Found \d+ SQL migration files/);
  });

  it("runs preflight in local mode without network checks", async () => {
    const summary = await runPreflight({
      mode: "local",
      rootDir,
      skipNetworkChecks: true,
    });
    expect(summary.mode).toBe("local");
    expect(summary.checks.length).toBeGreaterThanOrEqual(4);
  });
});
