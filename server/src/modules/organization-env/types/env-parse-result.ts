export type EnvKeyName = string & { readonly __brand: 'EnvKeyName' };

export function toEnvKeyName(key: string): EnvKeyName {
  return key as EnvKeyName;
}

export interface EnvIssue {
  key: string;
  reason: 'missing' | 'invalid';
  message: string;
}

export type EnvParseResult<T> = { ok: true; config: T } | { ok: false; issues: EnvIssue[] };

export function issue(key: string, reason: EnvIssue['reason'], message: string): EnvIssue {
  return { key, reason, message };
}

export function isParseFailure<T>(result: EnvParseResult<T>): result is { ok: false; issues: EnvIssue[] } {
  return result.ok === false;
}
