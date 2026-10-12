/** These protocol endpoints never authenticate using browser cookies. Consent and connection
 * management are intentionally absent: they require the normal origin and CSRF checks. */
export function isPublicOAuthProtocolPath(path: string, subpath = ''): boolean {
  const prefix = subpath.replace(/^\/+|\/+$/g, '');
  const base = `${prefix ? `/${prefix}` : ''}/api/mcp-oauth`;
  return ['register', 'token', 'revoke'].some(
    (endpoint) => path === `${base}/${endpoint}` || path === `${base}/${endpoint}/`,
  );
}
