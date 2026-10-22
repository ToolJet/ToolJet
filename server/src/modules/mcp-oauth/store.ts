import { EntityManager } from 'typeorm';
import { hash, RejectedOAuthGrant } from './protocol';

export interface OAuthGrant {
  id: string;
  client_id: string;
  user_id: string;
  organization_id: string;
  resource: string;
  scopes: string[];
  authentication: Record<string, unknown>;
  expires_at: Date;
  revoked_at: Date | null;
}
export type OAuthArtifactKind = 'interaction' | 'code' | 'access' | 'refresh';
export interface OAuthArtifact {
  id: string;
  kind: OAuthArtifactKind;
  client_id: string;
  grant_id: string | null;
  payload: Record<string, any>;
  expires_at: Date;
  consumed_at: Date | null;
}
export class OAuthStore {
  constructor(
    readonly manager: EntityManager,
    private readonly validatePolicy?: (grant: OAuthGrant) => Promise<void>,
  ) {}
  async client(id: string) {
    const [row] = await this.manager.query('SELECT * FROM mcp_oauth_clients WHERE id = $1 AND NOT disabled', [
      id,
    ]);
    return (
      row && {
        id: row.id,
        name: row.name,
        redirectUris: row.redirect_uris,
        authMethod: row.token_endpoint_auth_method,
        secretHash: row.client_secret_hash,
        grants: ['authorization_code', 'refresh_token'],
      }
    );
  }
  async artifact(raw: string, kind: OAuthArtifactKind): Promise<OAuthArtifact | undefined> {
    const [row] = await this.manager.query('SELECT * FROM mcp_oauth_artifacts WHERE id = $1 AND kind = $2', [
      hash(raw),
      kind,
    ]);
    return row;
  }
  async put(
    raw: string,
    kind: OAuthArtifactKind,
    clientId: string,
    grantId: string | null,
    payload: object,
    expiry: Date,
  ) {
    await this.manager.query(
      'INSERT INTO mcp_oauth_artifacts(id, kind, client_id, grant_id, payload, expires_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [hash(raw), kind, clientId, grantId, JSON.stringify(payload), expiry],
    );
  }
  async consume(id: string): Promise<boolean> {
    const rows = await this.manager.query(
      'WITH consumed AS (UPDATE mcp_oauth_artifacts SET consumed_at = now() WHERE id = $1 AND consumed_at IS NULL RETURNING id) SELECT id FROM consumed',
      [id],
    );
    return rows.length === 1;
  }
  async activeGrant(id: string, lock = false): Promise<OAuthGrant> {
    const [grant] = await this.manager.query(
      `SELECT g.* FROM mcp_oauth_grants g JOIN mcp_oauth_clients c ON c.id = g.client_id
       JOIN users u ON u.id = g.user_id JOIN organizations o ON o.id = g.organization_id
       WHERE g.id = $1 AND g.revoked_at IS NULL AND g.expires_at > now() AND NOT c.disabled
         AND u.status = 'active' AND o.status = 'active'
         AND NOT EXISTS (SELECT 1 FROM user_ban_list b WHERE lower(b.email) = lower(u.email))
         AND EXISTS (SELECT 1 FROM organization_users ou WHERE ou.user_id = g.user_id
                     AND ou.organization_id = g.organization_id AND ou.status = 'active')
         AND NOT EXISTS (SELECT 1 FROM workspace_ban_list b WHERE b.organization_id = g.organization_id)
       ${lock ? 'FOR UPDATE OF g' : ''}`,
      [id],
    );
    if (!grant) throw new RejectedOAuthGrant(id, 'Connection expired or access was removed');
    await this.validatePolicy?.(grant);
    return grant;
  }
  async revoke(grantId: string) {
    await this.manager.query(
      'UPDATE mcp_oauth_grants SET revoked_at = COALESCE(revoked_at, now()) WHERE id = $1',
      [grantId],
    );
  }
}
