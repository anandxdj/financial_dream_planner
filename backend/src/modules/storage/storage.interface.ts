import { randomUUID } from "node:crypto";

export interface ObjectStorage {
  upload(key: string, data: Buffer | Uint8Array, mediaType: string): Promise<void>;
  download(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  createDownloadGrant(
    key: string,
    expiresInSeconds: number,
  ): Promise<{ downloadUrl: string; expiresAt: Date }>;
}

export class StorageError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code = "STORAGE_ERROR", statusCode = 500) {
    super(message);
    this.name = "StorageError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class StorageNotFoundError extends StorageError {
  constructor(message = "Object not found in storage") {
    super(message, "STORAGE_NOT_FOUND", 404);
    this.name = "StorageNotFoundError";
  }
}

export class StorageUnavailableError extends StorageError {
  constructor(message = "Storage service unavailable") {
    super(message, "STORAGE_UNAVAILABLE", 503);
    this.name = "StorageUnavailableError";
  }
}

export class StorageConfigError extends StorageError {
  constructor(message = "Invalid storage configuration") {
    super(message, "STORAGE_CONFIG_ERROR", 500);
    this.name = "StorageConfigError";
  }
}

/**
 * Generates an opaque, cryptographically random server object key with a fixed namespace prefix.
 * Keys are never derived from filenames, email addresses, household IDs, user-controlled path fragments,
 * or raw database IDs.
 */
export function generateObjectKey(namespace: "documents" | "exports" | "artifacts"): string {
  const safeNamespace = namespace.replace(/[^a-z0-9_-]/gi, "");
  const randomIdentifier = randomUUID();
  return `${safeNamespace}/${randomIdentifier}`;
}

export function generateDocumentKey(): string {
  return generateObjectKey("documents");
}

export function generateExportKey(): string {
  return `${generateObjectKey("exports")}.json`;
}

export interface StorageConfig {
  endpoint: string;
  bucket: string;
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export function validateStorageConfig(config: StorageConfig): void {
  if (!config.endpoint || !config.endpoint.startsWith("https://")) {
    throw new StorageConfigError("Storage endpoint must be a valid HTTPS URL");
  }
  if (!config.bucket || config.bucket.trim().length === 0) {
    throw new StorageConfigError("Storage bucket name is required");
  }
  if (!config.accessKeyId || config.accessKeyId.trim().length === 0) {
    throw new StorageConfigError("Storage access key ID is required");
  }
  if (!config.secretAccessKey || config.secretAccessKey.trim().length === 0) {
    throw new StorageConfigError("Storage secret access key is required");
  }
}
