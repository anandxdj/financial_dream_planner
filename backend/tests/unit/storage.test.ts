import { describe, expect, it } from "vitest";
import {
  FakeObjectStorage,
  generateObjectKey,
  StorageConfigError,
  StorageNotFoundError,
  StorageUnavailableError,
  validateStorageConfig,
} from "../../src/modules/storage";

describe("ObjectStorage Key Generation & Safety", () => {
  it("generates cryptographically random opaque keys under fixed namespaces", () => {
    const docKey1 = generateObjectKey("documents");
    const docKey2 = generateObjectKey("documents");
    const expKey = generateObjectKey("exports");

    expect(docKey1).toMatch(/^documents\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(docKey2).toMatch(/^documents\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(expKey).toMatch(/^exports\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    expect(docKey1).not.toBe(docKey2);
  });

  it("never includes user or filename data in generated object keys", () => {
    const maliciousNamespace = "documents/../evil" as any;
    const key = generateObjectKey(maliciousNamespace);
    expect(key).not.toContain("..");
    expect(key.startsWith("documentsevil/")).toBe(true);
  });
});

describe("Storage Configuration Validation", () => {
  it("rejects invalid or missing configuration parameters", () => {
    expect(() =>
      validateStorageConfig({
        endpoint: "http://insecure.endpoint",
        bucket: "bucket",
        accessKeyId: "key",
        secretAccessKey: "secret",
      }),
    ).toThrow(StorageConfigError);

    expect(() =>
      validateStorageConfig({
        endpoint: "https://r2.example.com",
        bucket: "",
        accessKeyId: "key",
        secretAccessKey: "secret",
      }),
    ).toThrow(StorageConfigError);

    expect(() =>
      validateStorageConfig({
        endpoint: "https://r2.example.com",
        bucket: "bucket",
        accessKeyId: "",
        secretAccessKey: "secret",
      }),
    ).toThrow(StorageConfigError);

    expect(() =>
      validateStorageConfig({
        endpoint: "https://r2.example.com",
        bucket: "bucket",
        accessKeyId: "key",
        secretAccessKey: "",
      }),
    ).toThrow(StorageConfigError);
  });

  it("accepts valid storage configuration", () => {
    expect(() =>
      validateStorageConfig({
        endpoint: "https://accountid.r2.cloudflarestorage.com",
        bucket: "financial-documents",
        accessKeyId: "test-access-key",
        secretAccessKey: "test-secret-key",
      }),
    ).not.toThrow();
  });
});

describe("FakeObjectStorage Adapter", () => {
  it("supports byte upload, download, existence checks, and deletion", async () => {
    const storage = new FakeObjectStorage();
    const key = generateObjectKey("documents");
    const data = Buffer.from("Test financial statement content", "utf8");

    expect(await storage.exists(key)).toBe(false);
    await expect(storage.download(key)).rejects.toThrow(StorageNotFoundError);

    await storage.upload(key, data, "application/pdf");
    expect(await storage.exists(key)).toBe(true);

    const downloaded = await storage.download(key);
    expect(downloaded.toString("utf8")).toBe("Test financial statement content");

    await storage.delete(key);
    expect(await storage.exists(key)).toBe(false);
  });

  it("bounds download grants to a maximum of 5 minutes (300 seconds)", async () => {
    const baseTime = new Date("2026-08-30T12:00:00.000Z");
    const storage = new FakeObjectStorage(() => baseTime);
    const key = generateObjectKey("documents");
    await storage.upload(key, Buffer.from("hello"), "text/plain");

    // Request 3600 seconds (1 hour) -> should be clamped to 300 seconds
    const grant = await storage.createDownloadGrant(key, 3600);
    expect(grant.expiresAt.toISOString()).toBe("2026-08-30T12:05:00.000Z");
    expect(grant.downloadUrl).toContain(encodeURIComponent(key));
  });

  it("handles fault injection properly for outage simulation", async () => {
    const storage = new FakeObjectStorage();
    const key = generateObjectKey("documents");

    storage.failNextUpload = true;
    await expect(storage.upload(key, Buffer.from("fail"), "text/plain")).rejects.toThrow("Injected upload failure");

    // Next upload succeeds after single failure
    await expect(storage.upload(key, Buffer.from("ok"), "text/plain")).resolves.toBeUndefined();

    storage.failNextDelete = true;
    await expect(storage.delete(key)).rejects.toThrow(StorageUnavailableError);

    // Next delete succeeds
    await expect(storage.delete(key)).resolves.toBeUndefined();

    storage.unavailable = true;
    await expect(storage.exists(key)).rejects.toThrow(StorageUnavailableError);
  });
});
