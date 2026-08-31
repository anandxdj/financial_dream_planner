import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  type ObjectStorage,
  type StorageConfig,
  StorageError,
  StorageNotFoundError,
  StorageUnavailableError,
  validateStorageConfig,
} from "./storage.interface";

export class R2ObjectStorage implements ObjectStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly clock: () => Date;

  constructor(
    config: StorageConfig,
    clientOverride?: S3Client,
    clockOverride?: () => Date,
  ) {
    validateStorageConfig(config);
    this.bucket = config.bucket;
    this.clock = clockOverride ?? (() => new Date());

    if (clientOverride) {
      this.client = clientOverride;
    } else {
      const s3Config: S3ClientConfig = {
        endpoint: config.endpoint,
        region: config.region ?? "auto",
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
        forcePathStyle: true,
      };
      this.client = new S3Client(s3Config);
    }
  }

  async upload(key: string, data: Buffer | Uint8Array, mediaType: string): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: mediaType,
      });
      await this.client.send(command);
    } catch (error: unknown) {
      throw this.normalizeError(error, "Failed to upload object");
    }
  }

  async download(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const response = await this.client.send(command);
      if (!response.Body) {
        throw new StorageNotFoundError();
      }
      const stream = response.Body as NodeJS.ReadableStream;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch (error: unknown) {
      if (error instanceof StorageError) throw error;
      throw this.normalizeError(error, "Failed to download object");
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch (error: unknown) {
      const normalized = this.normalizeError(error, "Failed to check object existence");
      if (normalized instanceof StorageNotFoundError) {
        return false;
      }
      throw normalized;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
    } catch (error: unknown) {
      const normalized = this.normalizeError(error, "Failed to delete object");
      if (normalized instanceof StorageNotFoundError) {
        return; // Treating missing provider object as success
      }
      throw normalized;
    }
  }

  async createDownloadGrant(
    key: string,
    expiresInSeconds: number,
  ): Promise<{ downloadUrl: string; expiresAt: Date }> {
    // Bounded to maximum 5 minutes (300 seconds)
    const clampedExpires = Math.min(Math.max(Number(expiresInSeconds) || 300, 1), 300);
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const downloadUrl = await getSignedUrl(this.client, command, {
        expiresIn: clampedExpires,
      });
      const expiresAt = new Date(this.clock().getTime() + clampedExpires * 1000);
      return { downloadUrl, expiresAt };
    } catch (error: unknown) {
      throw this.normalizeError(error, "Failed to generate download grant");
    }
  }

  private normalizeError(error: unknown, fallbackMessage: string): StorageError {
    if (error instanceof StorageError) return error;

    const err = error as { name?: string; $metadata?: { httpStatusCode?: number }; message?: string };
    const name = err.name ?? "";
    const statusCode = err.$metadata?.httpStatusCode;

    if (name === "NoSuchKey" || name === "NotFound" || statusCode === 404) {
      return new StorageNotFoundError("Object not found in storage");
    }

    if (
      name === "TimeoutError" ||
      name === "NetworkingError" ||
      name === "ServiceUnavailable" ||
      statusCode === 503 ||
      statusCode === 504 ||
      statusCode === 500
    ) {
      return new StorageUnavailableError("Storage provider unavailable");
    }

    // Never leak provider credentials, endpoint, bucket or payload details
    return new StorageError(fallbackMessage, "STORAGE_ERROR", statusCode ?? 500);
  }
}
