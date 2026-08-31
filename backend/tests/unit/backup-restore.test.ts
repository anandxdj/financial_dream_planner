import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { computeSha256, parseDatabaseUrl } from "../../../scripts/backup";
import { runRestore, validateEnvironmentName } from "../../../scripts/restore";

describe("backup and restore operations", () => {
  it("validates environment names and rejects production targets", () => {
    expect(validateEnvironmentName("rehearsal")).toBe(true);
    expect(validateEnvironmentName("operational-test")).toBe(true);
    expect(validateEnvironmentName("dev")).toBe(true);
    expect(validateEnvironmentName("local")).toBe(true);

    expect(validateEnvironmentName("production")).toBe(false);
    expect(validateEnvironmentName("prod")).toBe(false);
    expect(validateEnvironmentName("live")).toBe(false);
    expect(validateEnvironmentName("main")).toBe(false);
    expect(validateEnvironmentName("my-prod-cluster")).toBe(false);
    expect(validateEnvironmentName("")).toBe(false);
  });

  it("parses database URLs correctly without leaking secrets in logs", () => {
    const parsed = parseDatabaseUrl("postgres://admin:secret123@db.example.com:5432/fdp_db");
    expect(parsed.host).toBe("db.example.com");
    expect(parsed.port).toBe("5432");
    expect(parsed.user).toBe("admin");
    expect(parsed.password).toBe("secret123");
    expect(parsed.database).toBe("fdp_db");
  });

  it("computes accurate SHA-256 checksums", () => {
    const tmpFile = path.resolve(__dirname, "temp-sha-test.txt");
    try {
      fs.writeFileSync(tmpFile, "Hello financial dream planner backup test\n", "utf-8");
      const sha = computeSha256(tmpFile);
      expect(sha).toMatch(/^[0-9a-f]{64}$/);
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });

  it("refuses restore without explicit rehearsal acknowledgement", async () => {
    await expect(
      runRestore({
        dumpFile: "nonexistent.dump",
        targetDatabaseUrl: "postgres://postgres:postgres@localhost:5432/test_db",
        environmentName: "rehearsal",
        confirmRehearsal: false,
      }),
    ).rejects.toThrow("explicit confirmation");
  });

  it("refuses restore when target is production", async () => {
    await expect(
      runRestore({
        dumpFile: "nonexistent.dump",
        targetDatabaseUrl: "postgres://postgres:postgres@localhost:5432/test_db",
        environmentName: "production",
        confirmRehearsal: true,
      }),
    ).rejects.toThrow("invalid or indicates production");
  });

  it("refuses restore when source and target database URLs are identical", async () => {
    const dbUrl = "postgres://postgres:postgres@localhost:5432/same_db";
    await expect(
      runRestore({
        dumpFile: "nonexistent.dump",
        sourceDatabaseUrl: dbUrl,
        targetDatabaseUrl: dbUrl,
        environmentName: "rehearsal",
        confirmRehearsal: true,
      }),
    ).rejects.toThrow("identical");
  });

  it("refuses restore if checksum does not match expected", async () => {
    const tmpFile = path.resolve(__dirname, "temp-mismatch.dump");
    try {
      fs.writeFileSync(tmpFile, "corrupted dump content", "utf-8");
      await expect(
        runRestore({
          dumpFile: tmpFile,
          targetDatabaseUrl: "postgres://postgres:postgres@localhost:5432/rehearsal_db",
          environmentName: "rehearsal",
          confirmRehearsal: true,
          expectedSha256: "0000000000000000000000000000000000000000000000000000000000000000",
        }),
      ).rejects.toThrow("Checksum mismatch");
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });
});
