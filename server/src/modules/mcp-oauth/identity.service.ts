import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { User } from '@entities/user.entity';
import { UserRepository } from '@modules/users/repositories/repository';
import type { ILoginConfigsUtilService } from '@modules/login-configs/interfaces/IUtilsService';
import { OAuthStore } from './store';
import { isDelegationClaims, isViewerClaims } from './claims';
import { DELEGATION_AUDIENCE, VIEWER_AUDIENCE, RejectedOAuthGrant } from './protocol';
import { parseOAuthSettings } from './parsers';
import { loadLoginPolicy } from './policy';

/** Per-request identity checks, independent of registration and browser consent. */
@Injectable()
export class McpOAuthIdentityService {
  constructor(readonly dataSource: DataSource, private readonly config: ConfigService,
    private readonly jwt: JwtService, private readonly users: UserRepository,
    @Inject('MCP_LOGIN_CONFIGS') private readonly loginConfigs: Pick<ILoginConfigsUtilService, 'fetchOrganizationDetails'>) {}
  private settings() { return parseOAuthSettings(this.config); }
  private store(manager = this.dataSource.manager) {
    const policies = new Map<string, ReturnType<typeof loadLoginPolicy>>();
    return new OAuthStore(manager, async (grant) => {
      if (!policies.has(grant.organization_id))
        policies.set(grant.organization_id, loadLoginPolicy(this.dataSource, this.loginConfigs, grant.organization_id));
      const policy = await policies.get(grant.organization_id);
      if (grant.authentication.policyFingerprint !== policy.fingerprint) {
        throw new RejectedOAuthGrant(grant.id, 'Workspace login policy changed; reconnect the client');
      }
    });
  }

  private async persistRevocationOnFailure<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof RejectedOAuthGrant) {
        // Run after the failed transaction has rolled back. Throwing inside the transaction
        // would undo revocation and let an old policy/account state revive this consent.
        await this.dataSource.query(
          'UPDATE mcp_oauth_grants SET revoked_at = COALESCE(revoked_at, now()) WHERE id = $1',
          [error.grantId],
        );
      }
      throw error;
    }
  }

  async authenticateViewer(credential: string, workspaceId?: string): Promise<User> {
    let payload: unknown;
    try {
      payload = this.jwt.verify(credential, { secret: this.config.get('SECRET_KEY_BASE'),
        issuer: this.settings().issuer, audience: VIEWER_AUDIENCE, algorithms: ['HS256'] });
    } catch { throw new UnauthorizedException(); }
    return this.validateViewer(payload, workspaceId);
  }
  async validateViewer(payload: unknown, workspaceId?: string): Promise<User> {
    if (!isViewerClaims(payload)) throw new UnauthorizedException();
    const user = await this.validateDelegation({ ...payload, aud: DELEGATION_AUDIENCE }, workspaceId);
    if (!user.oauthScopes.includes('apps') || !user.oauthScopes.includes('data')) throw new UnauthorizedException();
    const [app] = await this.dataSource.query('SELECT id FROM apps WHERE id = $1 AND organization_id = $2',
      [payload.oauthAppId, user.organizationId]);
    if (!app) throw new UnauthorizedException();
    user.oauthAppId = payload.oauthAppId;
    return user;
  }
  async authenticateDelegation(credential: string, workspaceId: string): Promise<User> {
    const { issuer } = this.settings();
    let payload: unknown;
    try {
      payload = this.jwt.verify(credential, {
        secret: this.config.get('SECRET_KEY_BASE'),
        issuer,
        audience: DELEGATION_AUDIENCE,
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException();
    }
    return this.validateDelegation(payload, workspaceId);
  }
  async validateDelegation(payload: unknown, workspaceId?: string): Promise<User> {
    const { issuer } = this.settings();
    if (
      !isDelegationClaims(payload) ||
      payload.iss !== issuer ||
      payload.exp <= Date.now() / 1000
    ) {
      throw new UnauthorizedException();
    }
    const store = this.store();
    let grant;
    try {
      grant = await this.persistRevocationOnFailure(() => store.activeGrant(payload.oauthGrantId));
    } catch {
      throw new UnauthorizedException();
    }
    const [artifact] = await this.dataSource.query(
      "SELECT * FROM mcp_oauth_artifacts WHERE id = $1 AND grant_id = $2 AND kind = 'access' AND expires_at > now()",
      [payload.oauthTokenId, grant.id],
    );
    if (!artifact || payload.sub !== grant.user_id || (workspaceId && workspaceId !== grant.organization_id))
      throw new UnauthorizedException();
    const owner = await this.users.findOne({ where: { id: grant.user_id } });
    const user = owner && (await this.users.findByEmail(owner.email, grant.organization_id, 'active'));
    if (!user) throw new UnauthorizedException();
    user.organizationId = grant.organization_id;
    user.organizationIds = [grant.organization_id];
    user.isSSOLogin = false;
    user.isPasswordLogin = false;
    user.isPATLogin = false;
    user.oauthGrantId = grant.id;
    user.oauthClientId = grant.client_id;
    user.oauthScopes = artifact.payload.scope;
    user.tjApiSource = 'mcp_oauth';
    return user;
  }
}
