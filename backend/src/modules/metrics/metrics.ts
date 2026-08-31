import crypto from "node:crypto";

export const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS", "HEAD"]);
export const ALLOWED_STATUS_CLASSES = new Set(["2xx", "3xx", "4xx", "5xx"]);
export const ALLOWED_OPERATIONS = new Set(["upload", "download", "delete", "check", "metadata"]);
export const ALLOWED_OUTCOMES = new Set(["completed", "failed", "cancelled", "success", "failure"]);
export const ALLOWED_AUTH_REASONS = new Set([
  "invalid_credentials",
  "token_expired",
  "session_revoked",
  "invalid_token",
  "csrf_failed",
  "reauth_required",
  "rate_limited",
  "unauthorized",
  "forbidden",
  "registration_disabled",
  "google_registration_disabled",
  "invalid_invitation",
  "closed_beta_restricted",
]);
export const ALLOWED_DEPENDENCIES = new Set(["database", "redis"]);
export const ALLOWED_JOB_NAMES = new Set([
  "privacy_export",
  "household_deletion",
  "drift_check",
  "plan_calculation",
  "research_run",
  "generic_job",
]);

const DURATION_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

export function normalizeRoute(path: string): string {
  if (!path || path === "") return "/";
  // Remove query string
  const cleanPath = path.split("?")[0] || "/";
  if (cleanPath === "/health" || cleanPath === "/ready" || cleanPath === "/metrics") {
    return cleanPath;
  }
  // Replace UUIDs
  let normalized = cleanPath.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, ":id");
  // Replace numeric IDs
  normalized = normalized.replace(/\/\d+(?=\/|$)/g, "/:id");
  if (normalized.startsWith("/api/v1/") && !normalized.split("/").some((segment) => segment.length > 64)) {
    return normalized;
  }
  if (normalized === "/unmatched") return normalized;
  return "/other";
}

export function sanitizeStatusClass(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) return "2xx";
  if (statusCode >= 300 && statusCode < 400) return "3xx";
  if (statusCode >= 400 && statusCode < 500) return "4xx";
  if (statusCode >= 500 && statusCode < 600) return "5xx";
  return "unknown";
}

type Labels = Record<string, string>;

function labelsKey(labels: Labels): string {
  const sortedKeys = Object.keys(labels).sort();
  return sortedKeys.map((k) => `${k}="${labels[k]}"`).join(",");
}

function formatLabels(labels: Labels): string {
  const keys = Object.keys(labels).sort();
  if (keys.length === 0) return "";
  return `{${keys.map((k) => `${k}="${labels[k]}"`).join(",")}}`;
}

class Counter {
  private values = new Map<string, { labels: Labels; value: number }>();
  constructor(
    public readonly name: string,
    public readonly help: string,
  ) {}

  inc(labels: Labels = {}, amount = 1) {
    if (amount <= 0) return;
    const key = labelsKey(labels);
    const current = this.values.get(key);
    if (current) {
      current.value += amount;
    } else {
      this.values.set(key, { labels: { ...labels }, value: amount });
    }
  }

  get(labels: Labels = {}): number {
    const key = labelsKey(labels);
    return this.values.get(key)?.value ?? 0;
  }

  reset() {
    this.values.clear();
  }

  serialize(): string {
    if (this.values.size === 0) {
      return `# HELP ${this.name} ${this.help}\n# TYPE ${this.name} counter\n`;
    }
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} counter`];
    for (const { labels, value } of this.values.values()) {
      lines.push(`${this.name}${formatLabels(labels)} ${value}`);
    }
    return `${lines.join("\n")}\n`;
  }
}

class Gauge {
  private values = new Map<string, { labels: Labels; value: number }>();
  constructor(
    public readonly name: string,
    public readonly help: string,
  ) {}

  set(labels: Labels, value: number): void;
  set(value: number): void;
  set(arg1: Labels | number, arg2?: number) {
    const labels = typeof arg1 === "object" ? arg1 : {};
    const value = typeof arg1 === "number" ? arg1 : (arg2 ?? 0);
    const key = labelsKey(labels);
    this.values.set(key, { labels: { ...labels }, value });
  }

  get(labels: Labels = {}): number {
    const key = labelsKey(labels);
    return this.values.get(key)?.value ?? 0;
  }

  reset() {
    this.values.clear();
  }

  serialize(): string {
    if (this.values.size === 0) {
      return `# HELP ${this.name} ${this.help}\n# TYPE ${this.name} gauge\n`;
    }
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} gauge`];
    for (const { labels, value } of this.values.values()) {
      lines.push(`${this.name}${formatLabels(labels)} ${value}`);
    }
    return `${lines.join("\n")}\n`;
  }
}

interface HistogramSample {
  labels: Labels;
  count: number;
  sum: number;
  bucketCounts: number[];
}

class Histogram {
  private values = new Map<string, HistogramSample>();
  private readonly buckets: number[];

  constructor(
    public readonly name: string,
    public readonly help: string,
    buckets: number[] = DURATION_BUCKETS,
  ) {
    this.buckets = [...buckets].sort((a, b) => a - b);
  }

  observe(labels: Labels, value: number) {
    if (value < 0) return;
    const key = labelsKey(labels);
    let sample = this.values.get(key);
    if (!sample) {
      sample = {
        labels: { ...labels },
        count: 0,
        sum: 0,
        bucketCounts: new Array(this.buckets.length).fill(0),
      };
      this.values.set(key, sample);
    }
    sample.count += 1;
    sample.sum += value;
    for (let i = 0; i < this.buckets.length; i++) {
      if (value <= this.buckets[i]!) {
        sample.bucketCounts[i] += 1;
      }
    }
  }

  reset() {
    this.values.clear();
  }

  serialize(): string {
    if (this.values.size === 0) {
      return `# HELP ${this.name} ${this.help}\n# TYPE ${this.name} histogram\n`;
    }
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} histogram`];
    for (const sample of this.values.values()) {
      for (let i = 0; i < this.buckets.length; i++) {
        const bucketLabels = { ...sample.labels, le: String(this.buckets[i]) };
        lines.push(`${this.name}_bucket${formatLabels(bucketLabels)} ${sample.bucketCounts[i]}`);
      }
      const infLabels = { ...sample.labels, le: "+Inf" };
      lines.push(`${this.name}_bucket${formatLabels(infLabels)} ${sample.count}`);
      lines.push(`${this.name}_sum${formatLabels(sample.labels)} ${sample.sum.toFixed(6)}`);
      lines.push(`${this.name}_count${formatLabels(sample.labels)} ${sample.count}`);
    }
    return `${lines.join("\n")}\n`;
  }
}

class MetricsRegistry {
  public readonly httpRequestsTotal = new Counter(
    "fdp_http_requests_total",
    "Total HTTP requests by method, normalized route, and status class",
  );
  public readonly httpRequestDurationSeconds = new Histogram(
    "fdp_http_request_duration_seconds",
    "HTTP request latency in seconds",
  );
  public readonly jobsTotal = new Counter(
    "fdp_jobs_total",
    "Total worker jobs processed by name and outcome",
  );
  public readonly outboxDispatchedTotal = new Counter(
    "fdp_outbox_dispatched_total",
    "Total outbox records dispatched by outcome",
  );
  public readonly jobRecoveryRetriesTotal = new Counter(
    "fdp_job_recovery_retries_total",
    "Total job recovery retry attempts",
  );
  public readonly queueDepth = new Gauge(
    "fdp_queue_depth",
    "Current depth of BullMQ and outbox queues",
  );
  public readonly outboxOldestPendingAgeSeconds = new Gauge(
    "fdp_outbox_oldest_pending_age_seconds",
    "Age of oldest pending outbox record in seconds",
  );
  public readonly storageOperationsTotal = new Counter(
    "fdp_storage_operations_total",
    "Total object storage operations by operation and status",
  );
  public readonly privacyOperationsTotal = new Counter(
    "fdp_privacy_operations_total",
    "Total privacy export and deletion operations by operation and outcome",
  );
  public readonly authFailuresTotal = new Counter(
    "fdp_auth_failures_total",
    "Total authentication failures by bounded reason",
  );
  public readonly readinessState = new Gauge(
    "fdp_readiness_state",
    "Dependency readiness state (1 = ready, 0 = not ready)",
  );
  public readonly readinessProbeFailuresTotal = new Counter(
    "fdp_readiness_probe_failures_total",
    "Total readiness probe failures by dependency",
  );

  reset() {
    this.httpRequestsTotal.reset();
    this.httpRequestDurationSeconds.reset();
    this.jobsTotal.reset();
    this.outboxDispatchedTotal.reset();
    this.jobRecoveryRetriesTotal.reset();
    this.queueDepth.reset();
    this.outboxOldestPendingAgeSeconds.reset();
    this.storageOperationsTotal.reset();
    this.privacyOperationsTotal.reset();
    this.authFailuresTotal.reset();
    this.readinessState.reset();
    this.readinessProbeFailuresTotal.reset();
  }

  serialize(): string {
    return [
      this.httpRequestsTotal.serialize(),
      this.httpRequestDurationSeconds.serialize(),
      this.jobsTotal.serialize(),
      this.outboxDispatchedTotal.serialize(),
      this.jobRecoveryRetriesTotal.serialize(),
      this.queueDepth.serialize(),
      this.outboxOldestPendingAgeSeconds.serialize(),
      this.storageOperationsTotal.serialize(),
      this.privacyOperationsTotal.serialize(),
      this.authFailuresTotal.serialize(),
      this.readinessState.serialize(),
      this.readinessProbeFailuresTotal.serialize(),
    ].join("\n");
  }
}

export const metrics = new MetricsRegistry();

export function recordHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number) {
  const safeMethod = ALLOWED_METHODS.has(method.toUpperCase()) ? method.toUpperCase() : "UNKNOWN";
  const safeRoute = normalizeRoute(route);
  const safeStatusClass = sanitizeStatusClass(statusCode);
  const labels = { method: safeMethod, route: safeRoute, status_class: safeStatusClass };
  metrics.httpRequestsTotal.inc(labels);
  metrics.httpRequestDurationSeconds.observe(labels, durationSeconds);
}

export function recordJobOutcome(name: string, outcome: string) {
  const safeName = ALLOWED_JOB_NAMES.has(name) ? name : "generic_job";
  const safeOutcome = ALLOWED_OUTCOMES.has(outcome) ? outcome : "unknown";
  metrics.jobsTotal.inc({ name: safeName, outcome: safeOutcome });
}

export function recordOutboxDispatch(outcome: "success" | "failure") {
  metrics.outboxDispatchedTotal.inc({ outcome });
}

export function recordStorageOperation(operation: string, status: "success" | "failure") {
  const safeOp = ALLOWED_OPERATIONS.has(operation) ? operation : "unknown";
  metrics.storageOperationsTotal.inc({ operation: safeOp, status });
}

export function recordPrivacyOperation(operation: "export" | "deletion" | "consent", outcome: "completed" | "failed" | "cancelled") {
  metrics.privacyOperationsTotal.inc({ operation, outcome });
}

export function recordAuthFailure(reason: string) {
  const safeReason = ALLOWED_AUTH_REASONS.has(reason) ? reason : "unknown";
  metrics.authFailuresTotal.inc({ reason: safeReason });
}

export function setReadinessState(dependency: "database" | "redis", isReady: boolean) {
  metrics.readinessState.set({ dependency }, isReady ? 1 : 0);
  if (!isReady) {
    metrics.readinessProbeFailuresTotal.inc({ dependency });
  }
}

export function verifyMetricsToken(providedHeader: string | undefined, expectedToken: string): boolean {
  if (!providedHeader || !expectedToken || expectedToken.trim().length === 0) {
    return false;
  }
  const match = /^Bearer\s+(\S+)$/i.exec(providedHeader.trim());
  if (!match || !match[1]) {
    return false;
  }
  const provided = Buffer.from(match[1], "utf-8");
  const expected = Buffer.from(expectedToken, "utf-8");
  if (provided.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(provided, expected);
}
