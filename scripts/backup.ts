import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export interface BackupOptions {
  databaseUrl: string;
  outputDir?: string;
  environment?: string;
  schemaVersion?: string;
}

export interface BackupResult {
  dumpFile: string;
  checksumFile: string;
  manifestFile: string;
  sha256: string;
  timestamp: string;
  sizeBytes: number;
}

export function computeSha256(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function parseDatabaseUrl(url: string): {
  host: string;
  port: string;
  user: string;
  password?: string;
  database: string;
} {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "127.0.0.1",
    port: parsed.port || "5432",
    user: decodeURIComponent(parsed.username || "postgres"),
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    database: parsed.pathname.replace(/^\//, "") || "postgres",
  };
}

export async function runBackup(options: BackupOptions): Promise<BackupResult> {
  const databaseUrl = options.databaseUrl;
  if (!databaseUrl || databaseUrl.trim().length === 0) {
    throw new Error("DATABASE_URL is required for backup");
  }

  const outputDir = path.resolve(options.outputDir || "./backups");
  fs.mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dumpFilename = `fdp_backup_${timestamp}.dump`;
  const dumpPath = path.join(outputDir, dumpFilename);
  const checksumPath = path.join(outputDir, `${dumpFilename}.sha256`);
  const manifestPath = path.join(outputDir, `fdp_backup_${timestamp}.manifest.json`);

  const dbInfo = parseDatabaseUrl(databaseUrl);

  const envVars = {
    ...process.env,
    ...(dbInfo.password ? { PGPASSWORD: dbInfo.password } : {}),
  };

  // Run pg_dump in custom format
  const args = [
    "-h",
    dbInfo.host,
    "-p",
    dbInfo.port,
    "-U",
    dbInfo.user,
    "-d",
    dbInfo.database,
    "-Fc",
    "-f",
    dumpPath,
  ];

  try {
    execFileSync("pg_dump", args, {
      env: envVars,
      stdio: "pipe",
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`pg_dump execution failed: ${errorMsg}`);
  }

  // Set file permissions (owner-restricted where supported)
  try {
    fs.chmodSync(dumpPath, 0o600);
  } catch {
    // Windows or filesystems not supporting POSIX permissions
  }

  const sha256 = computeSha256(dumpPath);
  fs.writeFileSync(checksumPath, `${sha256}  ${dumpFilename}\n`, "utf-8");

  const stat = fs.statSync(dumpPath);
  const manifest = {
    timestamp: new Date().toISOString(),
    backupFile: dumpFilename,
    sha256,
    sizeBytes: stat.size,
    format: "custom (pg_dump -Fc)",
    schemaVersion: options.schemaVersion || "u9-beta",
    environment: options.environment || "operational-backup",
  };

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");

  return {
    dumpFile: dumpPath,
    checksumFile: checksumPath,
    manifestFile: manifestPath,
    sha256,
    timestamp: manifest.timestamp,
    sizeBytes: stat.size,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"))) {
  const dbUrl = process.env.DATABASE_URL || "";
  runBackup({ databaseUrl: dbUrl })
    .then((result) => {
      console.log(`Backup completed successfully: ${result.dumpFile} (SHA256: ${result.sha256})`);
    })
    .catch((err) => {
      console.error(`Backup failed: ${err.message}`);
      process.exit(1);
    });
}
