export interface LiveCustomDomainResolver {
  resolveCustomDomain(domain: string, options?: { requireActiveSsl?: boolean }): Promise<{ organizationId: string }>;
}

/** Ordinary SSO retains its existing routing cache. Only MCP login requires live authority. */
export async function resolveSsoCustomDomainHost(
  tooljetHost: string,
  requestHost: string | undefined,
  organizationId: string | undefined,
  cache: { getActiveDomainForOrg(organizationId: string): Promise<string> } | undefined,
  live: LiveCustomDomainResolver | undefined,
  mcpOAuthLogin = false
): Promise<string | null> {
  if (mcpOAuthLogin) return resolveLiveCustomDomainHost(tooljetHost, requestHost, organizationId, live);
  if (!requestHost || !organizationId || !cache) return null;
  try {
    if (requestHost === new URL(tooljetHost).hostname) return null;
    const activeDomain = await cache.getActiveDomainForOrg(organizationId);
    if (activeDomain === requestHost) return `https://${activeDomain}`;
  } catch {
    // Preserve the existing fallback to the configured ToolJet host.
  }
  return null;
}

/** Resolve MCP browser authority from live repository + license state.
 * MCP callback selection must not use the routing cache. */
export async function resolveLiveCustomDomainHost(
  tooljetHost: string,
  requestHost: string | undefined,
  organizationId: string | undefined,
  resolver?: LiveCustomDomainResolver
): Promise<string | null> {
  if (!requestHost || !organizationId || !resolver) return null;
  try {
    const canonical = new URL(tooljetHost);
    if (requestHost === canonical.hostname) return null;
    if (requestHost.includes(':') || !/^[a-z0-9.-]+$/i.test(requestHost)) return null;
    const resolved = await resolver.resolveCustomDomain(requestHost, { requireActiveSsl: true });
    return resolved?.organizationId === organizationId ? `https://${requestHost}` : null;
  } catch {
    return null;
  }
}
