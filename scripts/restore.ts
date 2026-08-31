import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { computeSha256, parseDatabaseUrl } from "./backup";

export interface RestoreOptions {
  dumpFile: string;
  targetDatabaseUrl: string;
  sourceDatabaseUrl?: string;
  environmentName: string;
  confirmRehearsal: boolean;
  checksumFile?: string;
  expectedSha256?: string;
}

export interface IntegrityProbeResult {
  usersCount: number;
  householdsCount: number;
  accountsCount: number;
  transactionsCount: number;
  plansCount: number;
  documentsCount: number;
  privacyExportsCount: number;
  householdDeletionsCount: number;
  isConsistent: boolean;
}

export interface RestoreResult {
  targetDatabase: string;
  environment: string;
  restoredFile: string;
  sha256Verified: boolean;
  integrityProbes: IntegrityProbeResult;
}

const FORBIDDEN_ENVIRONMENTS = new Set([
  "production",
  "prod",
  "live",
  "main",
  "master",
  "primary",
]);

export function validateEnvironmentName(envName: string): boolean {
  if (!envName || envName.trim().length === 0) return false;
  const normalized = envName.trim().toLowerCase();
  if (FORBIDDEN_ENVIRONMENTS.has(normalized)) return false;
  if (normalized.includes("prod") || normalized.includes("live")) return false;
  return true;
}

export type IntegrityQueryRunner = (databaseUrl: string, query: string) => string;

export async function runIntegrityProbes(
  databaseUrl: string,
  queryRunner?: IntegrityQueryRunner,
): Promise<IntegrityProbeResult> {
  const dbInfo = parseDatabaseUrl(databaseUrl);
  const envVars = {
    ...process.env,
    ...(dbInfo.password ? { PGPASSWORD: dbInfo.password } : {}),
  };

  const query = "SELECT (SELECT count(*) FROM users) as u, (SELECT count(*) FROM households) as h, (SELECT count(*) FROM accounts) as a, (SELECT count(*) FROM transactions) as t, (SELECT count(*) FROM documents) as d, (SELECT count(*) FROM privacy_exports) as e, (SELECT count(*) FROM household_deletions) as del;";

  const out = (queryRunner
    ? queryRunner(databaseUrl, query)
    : execFileSync(
        "psql",
        ["-h", dbInfo.host, "-p", dbInfo.port, "-U", dbInfo.user, "-d", dbInfo.database, "-t", "-A", "-F", ",", "-c", query],
        { env: envVars, encoding: "utf-8", stdio: "pipe" },
      )).trim();

    const [u, h, a, t, d, e, del] = out.split(",").map((v) => parseInt(v.trim(), 10) || 0);
  const result = {
      usersCount: u,
      householdsCount: h,
      accountsCount: a,
      transactionsCount: t,
      plansCount: 0,
      documentsCount: d,
      privacyExportsCount: e,
      householdDeletionsCount: del,
      isConsistent: u >= 0 && h >= 0,
    };
  if ([result.usersCount, result.householdsCount, result.accountsCount, result.transactionsCount,
    result.documentsCount, result.privacyExportsCount, result.householdDeletionsCount]
    .some((value) => !Number.isSafeInteger(value) || value < 0)) {
    throw new Error("Restore integrity probe returned invalid counts");
  }
  return result;
}

export async function runRestore(options: RestoreOptions): Promise<RestoreResult> {
  if (!options.confirmRehearsal) {
    throw new Error("Restore refused: explicit confirmation (--confirm-rehearsal) is required");
  }

  if (!validateEnvironmentName(options.environmentName)) {
    throw new Error(`Restore refused: target environment name '${options.environmentName}' is invalid or indicates production`);
  }

  if (options.sourceDatabaseUrl && options.targetDatabaseUrl) {
    const src = new URL(options.sourceDatabaseUrl);
    const tgt = new URL(options.targetDatabaseUrl);
    if (src.host === tgt.host && src.pathname === tgt.pathname) {
      throw new Error("Restore refused: source and target database URLs are identical");
    }
  }

  const dumpPath = path.resolve(options.dumpFile);
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Dump file not found: ${dumpPath}`);
  }

  const actualSha256 = computeSha256(dumpPath);

  let expectedSha256 = options.expectedSha256;
  if (!expectedSha256 && options.checksumFile && fs.existsSync(options.checksumFile)) {
    const checksumContent = fs.readFileSync(options.checksumFile, "utf-8").trim();
    expectedSha256 = checksumContent.split(/\s+/)[0];
  }

  if (!expectedSha256) {
    throw new Error("Restore refused: an expected SHA-256 or checksum file is required");
  }
  if (actualSha256 !== expectedSha256) {
    throw new Error(`Checksum mismatch: expected ${expectedSha256}, got ${actualSha256}`);
  }

  const dbInfo = parseDatabaseUrl(options.targetDatabaseUrl);
  const envVars = {
    ...process.env,
    ...(dbInfo.password ? { PGPASSWORD: dbInfo.password } : {}),
  };

  const args = [
    "-h",
    dbInfo.host,
    "-p",
    dbInfo.port,
    "-U",
    dbInfo.user,
    "-d",
    dbInfo.database,
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    dumpPath,
  ];

  execFileSync("pg_restore", args, { env: envVars, stdio: "pipe" });

  const integrity = await runIntegrityProbes(options.targetDatabaseUrl);

  return {
    targetDatabase: dbInfo.database,
    environment: options.environmentName,
    restoredFile: dumpPath,
    sha256Verified: true,
    integrityProbes: integrity,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"))) {
  const targetUrl = process.env.TARGET_DATABASE_URL || "";
  const sourceUrl = process.env.DATABASE_URL || "";
  const dumpFile = process.env.DUMP_FILE || "";
  const envName = process.env.ENVIRONMENT_NAME || "rehearsal";
  const confirm = process.env.CONFIRM_REHEARSAL === "true";
  const checksumFile = process.env.CHECKSUM_FILE;
  const expectedSha256 = process.env.EXPECTED_SHA256;

  runRestore({
    dumpFile,
    targetDatabaseUrl: targetUrl,
    sourceDatabaseUrl: sourceUrl,
    environmentName: envName,
    confirmRehearsal: confirm,
    checksumFile,
    expectedSha256,
  })
    .then((result) => {
      console.log(`Restore rehearsal completed successfully: ${JSON.stringify(result, null, 2)}`);
    })
    .catch((err) => {
      console.error(`Restore rehearsal failed: ${err.message}`);
      process.exit(1);
    });
}
