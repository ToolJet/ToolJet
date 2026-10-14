export interface LiveCustomDomainResolver {
  resolveCustomDomain(domain: string, options?: { requireActiveSsl?: boolean }): Promise<{ organizationId: string }>;
}

/** Resolve browser authority from live repository + license state. Callers must
 * not use the routing cache for OAuth callback selection. */
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
