// Keys treated as sensitive wherever they appear in an object being logged — matches the
// credential-shaped fields already redacted in LoggerModule.forRoot()'s pino config
// (server/src/modules/app/loader.ts) for HTTP request/response logs. Extend via
// LOGGER_REDACT, the same comma-separated env var that config already reads.
const DEFAULT_SENSITIVE_KEYS = [
  'password',
  'current_password',
  'new_password',
  'token',
  'invitation_token',
  'access_token',
  'refresh_token',
  'secret',
  'api_key',
  'authorization',
  'cookie',
];

const sensitiveKeys = new Set(
  [...DEFAULT_SENSITIVE_KEYS, ...(process.env.LOGGER_REDACT ? process.env.LOGGER_REDACT.split(',') : [])].map((key) =>
    key.trim().toLowerCase()
  )
);

const REDACTED = '[REDACTED]';

/**
 * Recursively redacts sensitive keys from a value before it's ever flattened into a log
 * string.
 *
 * Pino's own `redact` option (loader.ts) can only match key paths on a structured object
 * *before* serialization — it can't reach into a value that's already been turned into a
 * string. TransactionLogger.enrichLogData() does exactly that: every object param passed
 * to appLogger.log(msg, someObject) gets JSON.stringify'd into the message string before
 * pino (or the OTel log stream downstream of it) ever sees it. This has to run before
 * that flattening, not after, or there's no object structure left to redact.
 */
export function redactSensitiveKeys(value: unknown, seen = new WeakSet<object>()): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveKeys(item, seen));
  }
  if (value && typeof value === 'object') {
    if (seen.has(value)) return '[CIRCULAR]';
    seen.add(value);
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = sensitiveKeys.has(key.toLowerCase()) ? REDACTED : redactSensitiveKeys(val, seen);
    }
    return result;
  }
  return value;
}
