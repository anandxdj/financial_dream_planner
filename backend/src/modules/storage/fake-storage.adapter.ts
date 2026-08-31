import {
  type ObjectStorage,
  StorageError,
  StorageNotFoundError,
  StorageUnavailableError,
} from "./storage.interface";

export class FakeObjectStorage implements ObjectStorage {
  private readonly objects = new Map<string, { data: Buffer; mediaType: string }>();
  private clock: () => Date;

  // Fault injection hooks
  public failNextUpload = false;
  public failNextDownload = false;
  public failNextDelete = false;
  public failNextGrant = false;
  public unavailable = false;

  constructor(clockOverride?: () => Date) {
    this.clock = clockOverride ?? (() => new Date());
  }

  setClock(clock: () => Date) {
    this.clock = clock;
  }

  clear(): void {
    this.objects.clear();
    this.failNextUpload = false;
    this.failNextDownload = false;
    this.failNextDelete = false;
    this.failNextGrant = false;
    this.unavailable = false;
  }

  async upload(key: string, data: Buffer | Uint8Array, mediaType: string): Promise<void> {
    if (this.unavailable) {
      throw new StorageUnavailableError("Fake storage is unavailable");
    }
    if (this.failNextUpload) {
      this.failNextUpload = false;
      throw new StorageError("Injected upload failure", "UPLOAD_FAILED", 500);
    }
    const buf = Buffer.isBuffer(data) ? Buffer.from(data) : Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    this.objects.set(key, { data: buf, mediaType });
  }

  async download(key: string): Promise<Buffer> {
    if (this.unavailable) {
      throw new StorageUnavailableError("Fake storage is unavailable");
    }
    if (this.failNextDownload) {
      this.failNextDownload = false;
      throw new StorageError("Injected download failure", "DOWNLOAD_FAILED", 500);
    }
    const record = this.objects.get(key);
    if (!record) {
      throw new StorageNotFoundError();
    }
    return Buffer.from(record.data);
  }

  async exists(key: string): Promise<boolean> {
    if (this.unavailable) {
      throw new StorageUnavailableError("Fake storage is unavailable");
    }
    return this.objects.has(key);
  }

  async delete(key: string): Promise<void> {
    if (this.unavailable) {
      throw new StorageUnavailableError("Fake storage is unavailable");
    }
    if (this.failNextDelete) {
      this.failNextDelete = false;
      throw new StorageUnavailableError("Injected delete failure");
    }
    this.objects.delete(key);
  }

  async createDownloadGrant(
    key: string,
    expiresInSeconds: number,
  ): Promise<{ downloadUrl: string; expiresAt: Date }> {
    if (this.unavailable) {
      throw new StorageUnavailableError("Fake storage is unavailable");
    }
    if (this.failNextGrant) {
      this.failNextGrant = false;
      throw new StorageError("Injected grant failure", "GRANT_FAILED", 500);
    }
    if (!this.objects.has(key)) {
      throw new StorageNotFoundError();
    }
    const clampedExpires = Math.min(Math.max(Number(expiresInSeconds) || 300, 1), 300);
    const expiresAt = new Date(this.clock().getTime() + clampedExpires * 1000);
    const downloadUrl = `https://storage.fake.local/download?key=${encodeURIComponent(
      key,
    )}&expires=${expiresAt.getTime()}`;
    return { downloadUrl, expiresAt };
  }

  // Inspection helpers for testing
  getStoredObject(key: string): { data: Buffer; mediaType: string } | undefined {
    return this.objects.get(key);
  }

  getAllKeys(): string[] {
    return Array.from(this.objects.keys());
  }

  hasKey(key: string): boolean {
    return this.objects.has(key);
  }
}
