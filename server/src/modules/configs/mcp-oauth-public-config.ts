import { isMcpOAuthEnabled } from '@modules/mcp-oauth/http-security';

// Only public connection information belongs here. OAuth exchange secrets stay on the server.
export function getMcpOAuthPublicConfig(env: NodeJS.ProcessEnv) {
  const disabled = { MCP_OAUTH_ENABLED: 'false', MCP_OAUTH_RESOURCE_URL: null };
  if (!isMcpOAuthEnabled(env.TOOLJET_EDITION, env.MCP_OAUTH_ENABLED) || !env.MCP_OAUTH_RESOURCE_URL) {
    return disabled;
  }

  try {
    const resource = new URL(env.MCP_OAUTH_RESOURCE_URL);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(resource.hostname);
    if (
      resource.username ||
      resource.password ||
      resource.search ||
      resource.hash ||
      !(resource.protocol === 'https:' || (resource.protocol === 'http:' && loopback))
    ) {
      return disabled;
    }

    return {
      MCP_OAUTH_ENABLED: 'true',
      MCP_OAUTH_RESOURCE_URL: resource.href.replace(/\/$/, ''),
    };
  } catch {
    return disabled;
  }
}
