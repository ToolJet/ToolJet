// Removes credentials from text that may reach a client, a log or an audit entry: git provider tokens
// (GitHub, GitLab), credentials embedded in URLs, auth headers and PEM keys. Used by the global exception
// filter, so a git error that echoes an authenticated clone URL never reaches the browser.

const GITLAB_TOKEN_PREFIXES = 'pat|oas|dt|rt|cbt|ptt|ft|imt|agent|soat|ffct|ddt|cit';

export function scrubSecrets(input: string): string {
  return (
    String(input ?? '')
      .replace(/x-access-token:[^@\s]+@/gi, 'x-access-token:[REDACTED]@')
      .replace(/(authorization:\s*(?:basic|bearer|token)\s+)[A-Za-z0-9+/=._-]+/gi, '$1[REDACTED]')
      // GitLab API headers, e.g. "PRIVATE-TOKEN: <value>"
      .replace(/((?:private-token|job-token|x-gitlab-token)\s*[:=]?\s*)[A-Za-z0-9._-]{8,}/gi, '$1[REDACTED]')
      // GitHub tokens: ghp/ghs/gho/ghu/ghr (real ones are 40+ chars) and fine-grained PATs
      .replace(/\bgh[a-z]_[A-Za-z0-9]{20,}/g, '[REDACTED]')
      .replace(/\bgithub_pat_[A-Za-z0-9_]{20,}/g, '[REDACTED]')
      // GitLab tokens: glpat-, gldt-, glrt-, … wherever they appear, not only inside URLs
      .replace(new RegExp(`\\bgl(?:${GITLAB_TOKEN_PREFIXES})-[A-Za-z0-9_-]{10,}`, 'g'), '[REDACTED]')
      // URL credentials: scheme://user:pass@ and scheme://token@
      .replace(/(\b[a-z][a-z0-9+.-]*:\/\/)[^/\s:@]+:(?!\[REDACTED\]@)[^/\s@]+@/gi, '$1[REDACTED]@')
      .replace(/(\bhttps?:\/\/)(?!\[REDACTED\])[^/\s:@]+@/gi, '$1[REDACTED]@')
      .replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g, '[REDACTED]')
  );
}

/** scrubSecrets for a value that may be a string, a list of strings, or anything else (returned as is). */
export function scrubSecretsIn<T>(value: T): T {
  if (typeof value === 'string') return scrubSecrets(value) as T;
  if (Array.isArray(value)) return value.map((item) => (typeof item === 'string' ? scrubSecrets(item) : item)) as T;
  return value;
}
