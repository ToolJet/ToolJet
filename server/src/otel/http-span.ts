// Express span attributes. Bodies are never recorded: they carry passwords, tokens and AI prompts.
export const REDACTED = '[REDACTED]';
const SECRET_KEY = /pass|token|secret|key|auth|code|otp|session|cookie|credential/i;

type Plain = Record<string, unknown>;

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value === null || typeof value !== 'object') return typeof value === 'function' ? undefined : value;
  const out: Plain = {};
  for (const [k, v] of Object.entries(value as Plain)) out[k] = SECRET_KEY.test(k) ? REDACTED : redact(v);
  return out;
}

export function requestSpanAttributes(request: { params?: Plain; query?: Plain }): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (request.params && Object.keys(request.params).length)
    attrs['http.params'] = JSON.stringify(redact(request.params));
  if (request.query && Object.keys(request.query).length) attrs['http.query'] = JSON.stringify(redact(request.query));
  return attrs;
}

// Redacts secret query values in a raw path or full URL; unchanged when no query.
export function redactUrlQuery(url: string): string {
  const q = url.indexOf('?');
  if (q === -1) return url;
  const hash = url.indexOf('#', q);
  const end = hash === -1 ? url.length : hash;
  const query = url
    .slice(q + 1, end)
    .split('&')
    .map((pair) => {
      const eq = pair.indexOf('=');
      const key = eq === -1 ? pair : pair.slice(0, eq);
      let decoded = key;
      try {
        decoded = decodeURIComponent(key);
      } catch {
        // keep raw key
      }
      return eq !== -1 && SECRET_KEY.test(decoded) ? `${key}=${REDACTED}` : pair;
    })
    .join('&');
  return url.slice(0, q + 1) + query + url.slice(end);
}
