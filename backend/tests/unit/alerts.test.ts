import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface ParsedAlert {
  alert: string;
  expr: string;
  forDuration: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

function parsePrometheusAlerts(yamlContent: string): ParsedAlert[] {
  const alerts: ParsedAlert[] = [];
  const lines = yamlContent.split("\n");

  let currentAlert: Partial<ParsedAlert> | null = null;
  let currentSection: "labels" | "annotations" | null = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (trimmed.startsWith("- alert:")) {
      if (currentAlert && currentAlert.alert) {
        alerts.push(currentAlert as ParsedAlert);
      }
      currentAlert = {
        alert: trimmed.replace("- alert:", "").trim(),
        labels: {},
        annotations: {},
      };
      currentSection = null;
      continue;
    }

    if (!currentAlert) continue;

    if (trimmed.startsWith("expr:")) {
      currentAlert.expr = trimmed.replace("expr:", "").trim();
      currentSection = null;
    } else if (trimmed.startsWith("for:")) {
      currentAlert.forDuration = trimmed.replace("for:", "").trim();
      currentSection = null;
    } else if (trimmed.startsWith("labels:")) {
      currentSection = "labels";
    } else if (trimmed.startsWith("annotations:")) {
      currentSection = "annotations";
    } else if (
      currentSection === "labels" &&
      (rawLine.startsWith("        ") || rawLine.startsWith("          "))
    ) {
      const match = trimmed.match(/^([^:]+):\s*(.*)$/);
      if (match && match[1] && match[2] !== undefined) {
        currentAlert.labels![match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
      }
    } else if (
      currentSection === "annotations" &&
      (rawLine.startsWith("        ") || rawLine.startsWith("          "))
    ) {
      const match = trimmed.match(/^([^:]+):\s*(.*)$/);
      if (match && match[1] && match[2] !== undefined) {
        currentAlert.annotations![match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  }

  if (currentAlert && currentAlert.alert) {
    alerts.push(currentAlert as ParsedAlert);
  }

  return alerts;
}

const FORBIDDEN_LABEL_KEYS = new Set([
  "user_id",
  "userid",
  "household_id",
  "householdid",
  "email",
  "token",
  "secret",
  "password",
  "object_key",
  "objectkey",
  "signed_url",
  "url",
  "payload",
]);

describe("Prometheus Alert Rules", () => {
  const alertsPath = path.resolve(__dirname, "../../../monitoring/alerts.yml");

  it("alerts file exists and parses properly", () => {
    expect(fs.existsSync(alertsPath)).toBe(true);
    const content = fs.readFileSync(alertsPath, "utf-8");
    const alerts = parsePrometheusAlerts(content);
    expect(alerts.length).toBeGreaterThanOrEqual(9);
  });

  it("covers all required alert contracts with valid expressions and thresholds", () => {
    const content = fs.readFileSync(alertsPath, "utf-8");
    const alerts = parsePrometheusAlerts(content);
    const alertMap = new Map(alerts.map((a) => [a.alert, a]));

    const REQUIRED_ALERTS = [
      "FDPReadinessUnavailable",
      "FDPHttp5xxRateWarning",
      "FDPHttp5xxRateCritical",
      "FDPOldestPendingOutboxAgeWarning",
      "FDPOldestPendingOutboxAgeCritical",
      "FDPJobFailureRateHigh",
      "FDPStorageFailuresSustained",
      "FDPPrivacyOperationFailedOrStuck",
      "FDPAuthFailureSurge",
      "FDPBackupStaleOrRestoreRehearsalMissing",
      "FDPDependencyReadinessFailed",
    ];

    for (const name of REQUIRED_ALERTS) {
      expect(alertMap.has(name), `Missing required alert rule: ${name}`).toBe(true);
      const alert = alertMap.get(name)!;
      expect(alert.expr.length).toBeGreaterThan(0);
      expect(["warning", "critical"]).toContain(alert.labels.severity);

      // Verify annotations
      expect(alert.annotations.summary, `Missing summary on ${name}`).toBeTruthy();
      expect(alert.annotations.impact, `Missing impact on ${name}`).toBeTruthy();
      expect(alert.annotations.first_diagnostic_step, `Missing first_diagnostic_step on ${name}`).toBeTruthy();
      expect(alert.annotations.runbook_reference, `Missing runbook_reference on ${name}`).toBeTruthy();
    }
  });

  it("rejects privacy-unsafe labels across all alerts", () => {
    const content = fs.readFileSync(alertsPath, "utf-8");
    const alerts = parsePrometheusAlerts(content);

    for (const alert of alerts) {
      for (const labelKey of Object.keys(alert.labels)) {
        expect(
          FORBIDDEN_LABEL_KEYS.has(labelKey.toLowerCase()),
          `Unsafe label '${labelKey}' found in alert '${alert.alert}'`,
        ).toBe(false);
      }
    }
  });
});
