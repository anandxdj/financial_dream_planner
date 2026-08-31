import { type Env, env as defaultEnv } from "../../config/env";
import { FakeObjectStorage } from "./fake-storage.adapter";
import { R2ObjectStorage } from "./r2-storage.adapter";
import {
  type ObjectStorage,
  type StorageConfig,
  StorageUnavailableError,
  generateObjectKey,
} from "./storage.interface";

export * from "./storage.interface";
export * from "./r2-storage.adapter";
export * from "./fake-storage.adapter";

export const FakeStorage = FakeObjectStorage;
export type FakeStorage = FakeObjectStorage;
export const R2Storage = R2ObjectStorage;
export type R2Storage = R2ObjectStorage;

export function generateDocumentKey(): string {
  return generateObjectKey("documents");
}

export function generateExportKey(): string {
  return `${generateObjectKey("exports")}.json`;
}

export function validateObjectKey(key: string): boolean {
  if (typeof key !== "string" || key.length === 0 || key.length > 255) return false;
  if (key.includes("..") || key.includes("\\")) return false;
  return key.startsWith("documents/") || key.startsWith("exports/") || key.startsWith("artifacts/");
}

let globalStorage: ObjectStorage | undefined;

class DisabledObjectStorage implements ObjectStorage {
  private unavailable(): never {
    throw new StorageUnavailableError("Private object storage is disabled");
  }
  upload(): Promise<void> { return Promise.reject(this.unavailable()); }
  download(): Promise<Buffer> { return Promise.reject(this.unavailable()); }
  exists(): Promise<boolean> { return Promise.reject(this.unavailable()); }
  delete(): Promise<void> { return Promise.reject(this.unavailable()); }
  createDownloadGrant(): Promise<{ downloadUrl: string; expiresAt: Date }> {
    return Promise.reject(this.unavailable());
  }
}

export function createObjectStorage(
  config: Env = defaultEnv,
  overrideStorage?: ObjectStorage,
): ObjectStorage {
  if (overrideStorage) {
    return overrideStorage;
  }

  if (!config.STORAGE_ENABLED) {
    return new DisabledObjectStorage();
  }

  const storageConfig: StorageConfig = {
    endpoint: config.STORAGE_ENDPOINT,
    bucket: config.STORAGE_BUCKET,
    region: config.STORAGE_REGION || "auto",
    accessKeyId: config.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: config.STORAGE_SECRET_ACCESS_KEY,
  };

  return new R2ObjectStorage(storageConfig);
}

export const createStorageFromConfig = createObjectStorage;

export function getObjectStorage(config: Env = defaultEnv): ObjectStorage {
  if (!globalStorage) {
    globalStorage = createObjectStorage(config);
  }
  return globalStorage;
}

export function setGlobalStorage(storage: ObjectStorage): void {
  globalStorage = storage;
}

export function resetGlobalStorage(): void {
  globalStorage = undefined;
}
