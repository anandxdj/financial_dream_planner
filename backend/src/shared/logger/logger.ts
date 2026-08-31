type LogFields = Record<string, unknown>;

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "cookies",
  "objectkey",
  "object_key",
  "signedurl",
  "signed_url",
  "downloadurl",
  "download_url",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "idtoken",
  "id_token",
  "rawtoken",
  "raw_token",
  "tokenhash",
  "token_hash",
  "confirmationtoken",
  "confirmation_token",
  "clientsecret",
  "client_secret",
  "secretaccesskey",
  "secret_access_key",
  "accesskeyid",
  "access_key_id",
  "apikey",
  "api_key",
  "credentials",
  "certificate",
  "codecontent",
  "privatekey",
  "private_key",
]);

export function redactSensitiveData(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    // Redact bearer tokens in strings
    if (/Bearer\s+[A-Za-z0-9._~+/-]+=*/i.test(value)) {
      return value.replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED]");
    }
    // Redact potential JWTs
    if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(value) && value.length > 30) {
      return "[REDACTED_TOKEN]";
    }
    return value;
  }

  if (typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[CIRCULAR]";
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item, seen));
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase().replace(/[-_]/g, "");
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes("secret") || lowerKey.includes("password") || lowerKey.includes("token")) {
      result[key] = "[REDACTED]";
    } else {
      result[key] = redactSensitiveData(val, seen);
    }
  }

  return result;
}

function write(level: string, message: string, fields?: LogFields) {
  const sanitizedFields = fields ? (redactSensitiveData(fields) as LogFields) : {};
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...sanitizedFields,
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }
  console.log(line);
}

export const logger = {
  info(message: string, fields?: LogFields) {
    write("info", message, fields);
  },
  warn(message: string, fields?: LogFields) {
    write("warn", message, fields);
  },
  error(message: string, fields?: LogFields) {
    write("error", message, fields);
  },
};
