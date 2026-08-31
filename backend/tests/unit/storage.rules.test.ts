import { describe, expect, it } from "vitest";
import {
  generateDocumentKey,
  generateExportKey,
  generateObjectKey,
  StorageConfigError,
  StorageNotFoundError,
  StorageUnavailableError,
  validateStorageConfig,
} from "../../src/modules/storage/storage.interface";
import { FakeObjectStorage } from "../../src/modules/storage/fake-storage.adapter";
import { R2ObjectStorage } from "../../src/modules/storage/r2-storage.adapter";

describe("Storage Rules & Adapter Unit Tests", () => {
  describe("Object Key Generation & Randomness", () => {
    it("generates opaque cryptographically random keys within fixed namespaces", () => {
      const docKey1 = generateDocumentKey();
      const docKey2 = generateDocumentKey();
      const exportKey = generateExportKey();

      expect(docKey1).toMatch(/^documents\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(docKey2).toMatch(/^documents\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(docKey1).not.toBe(docKey2);

      expect(exportKey).toMatch(/^exports\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.json$/);
    });

    it("sanitizes custom namespaces in generateObjectKey", () => {
      const customKey = generateObjectKey("artifacts" as any);
      expect(customKey).toMatch(/^artifacts\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it("never derives keys from user inputs or database IDs", () => {
      const userEmail = "victim@example.com";
      const householdId = "household-1234";
      const key = generateDocumentKey();

      expect(key).not.toContain(userEmail);
      expect(key).not.toContain(householdId);
    });
  });

  describe("Configuration Validation", () => {
    it("accepts valid HTTPS storage configurations", () => {
      expect(() =>
        validateStorageConfig({
          endpoint: "https://r2.cloudflarestorage.com",
          bucket: "financial-vault",
          accessKeyId: "valid-key-id",
          secretAccessKey: "valid-secret-key",
          region: "auto",
        }),
      ).not.toThrow();
    });

    it("rejects non-HTTPS endpoints", () => {
      expect(() =>
        validateStorageConfig({
          endpoint: "http://insecure.endpoint.local",
          bucket: "bucket",
          accessKeyId: "key",
          secretAccessKey: "secret",
        }),
      ).toThrow(StorageConfigError);
    });

    it("rejects empty bucket or credentials", () => {
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
  });

  describe("Fake Storage In-Memory Adapter", () => {
    it("supports upload, exists, download, and delete operations", async () => {
      const storage = new FakeObjectStorage();
      const key = generateDocumentKey();
      const content = Buffer.from("test document content", "utf-8");

      expect(await storage.exists(key)).toBe(false);

      await storage.upload(key, content, "text/plain");
      expect(await storage.exists(key)).toBe(true);

      const downloaded = await storage.download(key);
      expect(downloaded.toString("utf-8")).toBe("test document content");

      await storage.delete(key);
      expect(await storage.exists(key)).toBe(false);

      // Idempotent delete on missing key
      await expect(storage.delete(key)).resolves.toBeUndefined();
    });

    it("throws StorageNotFoundError when downloading non-existent key", async () => {
      const storage = new FakeObjectStorage();
      await expect(storage.download("documents/nonexistent")).rejects.toThrow(StorageNotFoundError);
    });

    it("creates download grant bounded to max 300 seconds", async () => {
      const fixedTime = new Date("2026-08-30T10:00:00.000Z");
      const storage = new FakeObjectStorage(() => fixedTime);
      const key = generateDocumentKey();
      await storage.upload(key, Buffer.from("data"), "text/plain");

      const grant = await storage.createDownloadGrant(key, 600); // requested 600s
      expect(grant.downloadUrl).toContain("key=");
      // Should be clamped to 300 seconds
      expect(grant.expiresAt.toISOString()).toBe("2026-08-30T10:05:00.000Z");
    });

    it("handles fault injection hooks correctly", async () => {
      const storage = new FakeObjectStorage();
      const key = generateDocumentKey();

      storage.failNextUpload = true;
      await expect(storage.upload(key, Buffer.from("test"), "text/plain")).rejects.toThrow();

      storage.unavailable = true;
      await expect(storage.download(key)).rejects.toThrow(StorageUnavailableError);
      await expect(storage.delete(key)).rejects.toThrow(StorageUnavailableError);
      await expect(storage.exists(key)).rejects.toThrow(StorageUnavailableError);
    });
  });

  describe("R2 Storage Adapter Error Normalization", () => {
    it("normalizes mock S3 client errors to stable storage errors", async () => {
      const mockClient = {
        send: async (command: any) => {
          if (command.constructor.name === "GetObjectCommand") {
            const err = new Error("NoSuchKey");
            (err as any).name = "NoSuchKey";
            throw err;
          }
          if (command.constructor.name === "PutObjectCommand") {
            const err = new Error("ServiceUnavailable");
            (err as any).name = "ServiceUnavailable";
            (err as any).$metadata = { httpStatusCode: 503 };
            throw err;
          }
        },
      } as any;

      const r2 = new R2ObjectStorage(
        {
          endpoint: "https://r2.cloudflarestorage.com",
          bucket: "secure-vault",
          accessKeyId: "mock-key",
          secretAccessKey: "mock-secret",
        },
        mockClient,
      );

      await expect(r2.download("documents/nonexistent")).rejects.toThrow(StorageNotFoundError);
      await expect(r2.upload("documents/test", Buffer.from("data"), "text/plain")).rejects.toThrow(
        StorageUnavailableError,
      );
    });
  });
});
