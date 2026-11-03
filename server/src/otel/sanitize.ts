const CREDENTIAL_KEYS =
  /^(?:password|current_password|new_password|token|access_token|refresh_token|subject_token|actor_token|id_token|client_secret|code|code_verifier|code_challenge|state|ticket|bootstrap|nonce|clientSecret|csrfToken|secret|authorization|cookie|tj_oauth_viewer|x-tooljet-delegation|x-tooljet-oauth-csrf)$/i;

/** Keep credential-bearing OAuth requests out of trace attributes. */
export function sanitizeTraceObject(value: any): any {
  if (Array.isArray(value)) return value.map(sanitizeTraceObject);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => typeof item !== 'function')
      .map(([key, item]) => [key, CREDENTIAL_KEYS.test(key) ? '[REDACTED]' : sanitizeTraceObject(item)]),
  );
}

/** Remove authorization parameters and browser interaction handles from HTTP telemetry. */
export function sanitizeOAuthUrl(value: unknown): unknown {
  if (typeof value !== 'string' || !value) return value;
  try {
    const url = new URL(value, 'http://telemetry.invalid');
    const oauthPath = /\/(?:mcp-oauth|mcp\/consent)(?:\/|$)/.test(url.pathname);
    const oauthReturn = /(?:mcp(?:%2f|\/)consent)/i.test(url.search);
    const secretQuery = [...url.searchParams.keys()].some((key) => CREDENTIAL_KEYS.test(key));
    if (!oauthPath && !oauthReturn && !secretQuery) return value;
    const path = url.pathname.replace(/(\/mcp-oauth\/interactions\/)[^/]+/, '$1[REDACTED]');
    return value.startsWith('/') ? path : `${url.origin}${path}`;
  } catch {
    return '[REDACTED URL]';
  }
}

export function sanitizeOAuthRequest(request: any): any {
  const url = sanitizeOAuthUrl(request.url);
  const oauth = typeof request.url === 'string' && request.url.includes('/mcp-oauth/');
  return {
    ...request,
    url,
    ...(request.query ? { query: oauth ? '[REDACTED]' : sanitizeTraceObject(request.query) } : {}),
    ...(request.params && oauth ? { params: '[REDACTED]' } : {}),
    ...(request.body ? { body: sanitizeTraceObject(request.body) } : {}),
    ...(request.headers ? { headers: { ...request.headers, referer: sanitizeOAuthUrl(request.headers.referer) } } : {}),
  };
}
