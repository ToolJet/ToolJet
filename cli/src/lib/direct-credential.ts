/*
  A credential ToolJet takes as it is, with no personal access token exchange, and how each one travels:
  - 'session': a ToolJet session (an in-product build's), sent as the tj_auth_token cookie.
  - 'delegation': an MCP OAuth delegation (the user connected an MCP server to ToolJet with OAuth). ToolJet takes it
    only in the x-tooljet-delegation header and refuses it as the cookie (server jwt.strategy.ts).
  Both arrive in TOOLJET_SESSION_TOKEN; the token's audience tells them apart.
*/
export type DirectKind = 'session' | 'delegation';

/** A direct credential's kind and the workspace it acts in. */
export interface DirectIdentity {
  kind: DirectKind;
  workspaceId: string;
}

/** The audience ToolJet signs an MCP OAuth delegation with (server mcp-oauth/protocol.ts, DELEGATION_AUDIENCE). */
const DELEGATION_AUDIENCE = 'tooljet:mcp:delegation';

export const jwtPayload = (jwt: string): Record<string, unknown> => {
  try {
    return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8')) ?? {};
  } catch {
    return {};
  }
};

export const directKindOf = (token: string): DirectKind =>
  jwtPayload(token).aud === DELEGATION_AUDIENCE ? 'delegation' : 'session';

export const directHeaders = (kind: DirectKind, token: string, workspaceId: string): Record<string, string> =>
  kind === 'delegation'
    ? { 'x-tooljet-delegation': token, 'tj-workspace-id': workspaceId }
    : { Cookie: `tj_auth_token=${token}`, 'tj-workspace-id': workspaceId };

/** The headers that carry a credential: a direct one the way ToolJet takes it, else a personal access token as Bearer. */
export const credentialHeaders = (token: string, direct?: DirectIdentity): Record<string, string> =>
  direct ? directHeaders(direct.kind, token, direct.workspaceId) : { Authorization: `Bearer ${token}` };

/**
 * fetch options for a request that carries a credential. On a redirect to another host fetch drops cookies and
 * Authorization but keeps a custom header, so a delegation would go wherever the redirect points: its requests refuse
 * redirects instead.
 */
export const credentialFetchOptions = (kind?: DirectKind): { redirect?: 'error' } =>
  kind === 'delegation' ? { redirect: 'error' } : {};

/** Added to a delegation's 401: it lasts minutes and the CLI cannot renew it, and a bare 401 reads as a bad login. */
export const DELEGATION_REFUSED_HINT =
  " The OAuth connection's access may have expired or been withdrawn: run the build again, or reconnect the MCP client to ToolJet.";
