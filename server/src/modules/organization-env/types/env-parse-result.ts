/**
 * Branded so a raw secret can't be assigned where a masked key name is expected — the
 * template/admin-display path only ever produces EnvKeyName values, never real values.
 */
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

/**
 * `if (!result.ok)` doesn't always narrow a generic EnvParseResult<T> (TS control-flow
 * narrowing on a discriminated union can fail when the union's own type depends on an
 * unresolved generic) — use this explicit predicate instead wherever T is generic.
 */
export function isParseFailure<T>(result: EnvParseResult<T>): result is { ok: false; issues: EnvIssue[] } {
  return result.ok === false;
}
