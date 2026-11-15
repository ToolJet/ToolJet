/*
  A credential ToolJet takes as it is, with no personal access token exchange, and how each one travels:
  - 'session': a ToolJet session (an in-product build's), sent as the tj_auth_token cookie.
  - 'delegation': an MCP OAuth delegation (the user connected an MCP server to ToolJet with OAuth). ToolJet takes it
    only in the x-tooljet-delegation header and refuses it as the cookie (server jwt.strategy.ts).
  Both arrive in TOOLJET_SESSION_TOKEN; the token's audience tells them apart.
*/
export type DirectKind = 'session' | 'delegation';

/** The audience ToolJet signs an MCP OAuth delegation with (server mcp-oauth/protocol.ts, DELEGATION_AUDIENCE). */
const DELEGATION_AUDIENCE = 'tooljet:mcp:delegation';

export const jwtPayload = (jwt: string): Record<string, unknown> => {
  try {
    return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8')) ?? {};
  } catch {
    return {};
  }
};

export const directKindOf = (token: string): DirectKind => {
  const aud = jwtPayload(token).aud;
  return (Array.isArray(aud) ? aud : [aud]).includes(DELEGATION_AUDIENCE) ? 'delegation' : 'session';
};

export const directHeaders = (kind: DirectKind, token: string, workspaceId: string): Record<string, string> =>
  kind === 'delegation'
    ? { 'x-tooljet-delegation': token, 'tj-workspace-id': workspaceId }
    : { Cookie: `tj_auth_token=${token}`, 'tj-workspace-id': workspaceId };
