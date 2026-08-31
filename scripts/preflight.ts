import { execFileSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { parseDatabaseUrl } from "./backup";

export interface PreflightOptions {
  mode?: "local" | "release";
  rootDir?: string;
  databaseUrl?: string;
  redisUrl?: string;
  skipNetworkChecks?: boolean;
}

export interface PreflightCheckResult {
  name: string;
  passed: boolean;
  message: string;
  details?: unknown;
}

export interface PreflightSummary {
  mode: "local" | "release";
  allPassed: boolean;
  checks: PreflightCheckResult[];
}

export function checkGitStatus(rootDir: string, mode: "local" | "release"): PreflightCheckResult {
  try {
    const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: rootDir,
      encoding: "utf-8",
    }).trim();
    const status = execFileSync("git", ["status", "--porcelain"], {
      cwd: rootDir,
      encoding: "utf-8",
    }).trim();

    const isClean = status.length === 0;
    if (mode === "release") {
      const passed = branch === "main" && isClean;
      return {
        name: "git_clean_main",
        passed,
        message: passed
          ? `Branch is '${branch}' and working tree is clean`
          : `Release requires clean 'main' branch (branch='${branch}', dirtyFiles=${status.split("\n").filter(Boolean).length})`,
      };
    }

    return {
      name: "git_status",
      passed: true,
      message: `Branch is '${branch}' (${isClean ? "clean" : "modified working tree"})`,
    };
  } catch (err) {
    return {
      name: "git_status",
      passed: mode !== "release",
      message: `Failed to inspect git status: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export function checkRequiredEnvVars(envMap: NodeJS.ProcessEnv): PreflightCheckResult {
  const REQUIRED = ["DATABASE_URL", "ACCESS_TOKEN_SECRET", "WEB_ORIGIN", "API_ORIGIN"];
  const missing: string[] = [];
  for (const key of REQUIRED) {
    if (!envMap[key] || envMap[key]!.trim().length === 0) {
      missing.push(key);
    }
  }

  return {
    name: "environment_variables",
    passed: missing.length === 0,
    message:
      missing.length === 0
        ? "All mandatory environment variables are set"
        : `Missing mandatory environment variables: ${missing.join(", ")}`,
  };
}

export function checkBuildArtifacts(rootDir: string): PreflightCheckResult {
  const backendDist = path.join(rootDir, "backend/dist");
  const requiredFiles = ["server.js", "worker.js", "migrate.js"];
  const missing: string[] = [];

  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(backendDist, file))) {
      missing.push(file);
    }
  }

  return {
    name: "build_artifacts",
    passed: missing.length === 0,
    message:
      missing.length === 0
        ? "All required backend build artifacts exist"
        : `Missing build artifacts in backend/dist: ${missing.join(", ")}`,
  };
}

export function checkMigrations(rootDir: string): PreflightCheckResult {
  const drizzleDir = path.join(rootDir, "backend/src/database/drizzle");
  if (!fs.existsSync(drizzleDir)) {
    return {
      name: "migrations_presence",
      passed: false,
      message: "Migrations directory does not exist",
    };
  }
  const files = fs.readdirSync(drizzleDir).filter((f) => f.endsWith(".sql"));
  return {
    name: "migrations_presence",
    passed: files.length > 0,
    message: `Found ${files.length} SQL migration files`,
  };
}

export function checkComposeConfig(rootDir: string): PreflightCheckResult {
  try {
    execFileSync("docker", ["compose", "-f", "docker-compose.prod.yml", "config"], {
      cwd: rootDir,
      encoding: "utf-8",
      stdio: "pipe",
      env: {
        ...process.env,
        TRAEFIK_NETWORK: "traefik-proxy",
      },
    });
    return {
      name: "compose_config_validity",
      passed: true,
      message: "docker-compose.prod.yml configuration is valid",
    };
  } catch (err) {
    return {
      name: "compose_config_validity",
      passed: false,
      message: `docker compose config check failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export function testTcpConnection(host: string, port: number, timeoutMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    socket.setTimeout(timeoutMs);
    socket.on("connect", () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(true);
      }
    });

    socket.on("timeout", () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(false);
      }
    });

    socket.on("error", () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(false);
      }
    });

    socket.connect(port, host);
  });
}

export async function checkConnectivity(
  dbUrl?: string,
  redisUrl?: string,
): Promise<PreflightCheckResult[]> {
  const results: PreflightCheckResult[] = [];

  if (dbUrl) {
    try {
      const dbInfo = parseDatabaseUrl(dbUrl);
      const port = parseInt(dbInfo.port, 10) || 5432;
      const ok = await testTcpConnection(dbInfo.host, port);
      results.push({
        name: "database_connectivity",
        passed: ok,
        message: ok ? `Database port reachable on ${dbInfo.host}:${port}` : `Database port unreachable on ${dbInfo.host}:${port}`,
      });
    } catch (err) {
      results.push({
        name: "database_connectivity",
        passed: false,
        message: `Database check error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  if (redisUrl) {
    try {
      const parsed = new URL(redisUrl);
      const host = parsed.hostname || "127.0.0.1";
      const port = parseInt(parsed.port || "6379", 10);
      const ok = await testTcpConnection(host, port);
      results.push({
        name: "redis_connectivity",
        passed: ok,
        message: ok ? `Redis port reachable on ${host}:${port}` : `Redis port unreachable on ${host}:${port}`,
      });
    } catch (err) {
      results.push({
        name: "redis_connectivity",
        passed: false,
        message: `Redis check error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  return results;
}

export async function runPreflight(options: PreflightOptions = {}): Promise<PreflightSummary> {
  const mode = options.mode || "local";
  const rootDir = path.resolve(options.rootDir || process.cwd());

  const checks: PreflightCheckResult[] = [
    checkGitStatus(rootDir, mode),
    checkRequiredEnvVars(process.env),
    checkBuildArtifacts(rootDir),
    checkMigrations(rootDir),
    checkComposeConfig(rootDir),
  ];

  if (!options.skipNetworkChecks && (options.databaseUrl || options.redisUrl)) {
    const netChecks = await checkConnectivity(options.databaseUrl, options.redisUrl);
    checks.push(...netChecks);
  }

  const allPassed = checks.every((c) => c.passed);

  return {
    mode,
    allPassed,
    checks,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"))) {
  const isRelease = process.argv.includes("--release") || process.env.RELEASE_MODE === "true";
  runPreflight({ mode: isRelease ? "release" : "local" })
    .then((summary) => {
      console.log(`Preflight results (${summary.mode}):`);
      for (const check of summary.checks) {
        console.log(`  [${check.passed ? "PASS" : "FAIL"}] ${check.name}: ${check.message}`);
      }
      if (!summary.allPassed) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error(`Preflight crashed: ${err.message}`);
      process.exit(1);
    });
}
