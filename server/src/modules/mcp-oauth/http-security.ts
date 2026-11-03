/** Public MCP OAuth is currently available only on explicitly enabled Cloud deployments. */
export function isMcpOAuthEnabled(edition: unknown, flag: unknown): boolean {
  // Match getTooljetEdition's case normalization without accepting other editions.
  return typeof edition === 'string' && edition.toLowerCase() === 'cloud' && flag === 'true';
}

/** A consent return selects the stricter SSO path; it is not authorization by itself. */
export function isMcpOAuthLogin(redirectTo: unknown, edition: unknown, flag: unknown): boolean {
  return isMcpOAuthEnabled(edition, flag) && typeof redirectTo === 'string' &&
    /^\/mcp\/consent\?request=[A-Za-z0-9_-]{43}$/.test(redirectTo);
}

/** These protocol endpoints never authenticate using browser cookies. Consent and connection
 * management are intentionally absent: they require the normal origin and CSRF checks. */
export function isPublicOAuthProtocolPath(path: string, subpath = ''): boolean {
  const prefix = subpath.replace(/^\/+|\/+$/g, '');
  const base = `${prefix ? `/${prefix}` : ''}/api/mcp-oauth`;
  return ['register', 'token', 'revoke'].some(
    (endpoint) => path === `${base}/${endpoint}` || path === `${base}/${endpoint}/`,
  );
}
