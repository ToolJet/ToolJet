import { isMcpOAuthEnabled } from './http-security';
import { REFRESH_RETRY_SECONDS, sealRefreshRetry, openRefreshRetry } from './refresh-retry';
import { McpOAuthIdentityService } from './identity.service';
import { parseOAuthSettings, parseRegistration } from './parsers';
import { loadLoginPolicy, lockMcpOAuthConsent } from './policy';
import { Cron } from '@nestjs/schedule';
import type { ILoginConfigsUtilService } from '@modules/login-configs/interfaces/IUtilsService';
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomUUID } from 'crypto';
import * as OAuth2Server from '@node-oauth/oauth2-server';
import { User } from '@entities/user.entity';
import { OAuthStore } from './store';
import { createOAuthEngine } from './engine';
import { DelegationIdentity, ViewerIdentity, isDelegationClaims } from './claims';
import { ConnectedClientResponse, InteractionPreviewResponse } from './dto';
import {
  OAUTH_SCOPES,
  ACCESS_SECONDS,
  GRANT_SECONDS,
  INTERACTION_SECONDS,
  DELEGATION_AUDIENCE,
  VIEWER_AUDIENCE,
  VIEWER_SECONDS,
  OAuthFailure,
  OAuthRedirectFailure,
  RejectedOAuthGrant,
  equalSecret,
  hash,
  secret,
  canonicalJson,
  scopesParam,
  stringParam,
  trustedUrl,
  matchesRedirectUri,
  WorkspaceAuthentication,
  CLIENT_AUTH_METHODS,
  clientAuthentication,
} from './protocol';

export const needsBrowserBootstrap = (issuer: string, browserTarget: string) =>
  new URL(browserTarget).hostname !== new URL(issuer).hostname;

@Injectable()
export class McpOAuthService implements OnModuleInit {
  @Inject(McpOAuthIdentityService) readonly identity: McpOAuthIdentityService;
  constructor(
    readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    @Inject('MCP_LOGIN_CONFIGS')
    private readonly loginConfigs: Pick<ILoginConfigsUtilService, 'fetchOrganizationDetails'>,
    @Optional()
    @Inject('MCP_CUSTOM_DOMAINS')
    private readonly customDomains?: { resolveCustomDomain(domain: string): Promise<{ organizationId: string }> }
  ) {}

  onModuleInit() {
    if (this.enabled()) this.settings();
  }

  @Cron('0 4 * * *')
  async cleanExpiredCredentials() {
    if (!this.enabled()) return;
    await this.dataSource.transaction(async (manager) => {
      const [lock] = await manager.query("SELECT pg_try_advisory_xact_lock(hashtext('mcp-oauth-cleanup')) AS acquired");
      if (!lock.acquired) return;
      await manager.query("SELECT pg_advisory_xact_lock(hashtext('mcp-oauth-registration'))");
      await manager.query('DELETE FROM mcp_oauth_grants WHERE expires_at < now()');
      await manager.query(
        "DELETE FROM mcp_oauth_artifacts WHERE expires_at < now() AND kind IN ('access','interaction')"
      );
      // Keep approved registrations for cached clients; collect abandoned registrations only.
      await manager.query(`DELETE FROM mcp_oauth_clients c WHERE first_authorized_at IS NULL
        AND created_at < now() - interval '1 hour'
        AND NOT EXISTS (SELECT 1 FROM mcp_oauth_grants g WHERE g.client_id = c.id)
        AND NOT EXISTS (SELECT 1 FROM mcp_oauth_artifacts a WHERE a.client_id = c.id)`);
    });
  }
  private loginPolicy(organizationId: string) {
    return loadLoginPolicy(this.dataSource, this.loginConfigs, organizationId);
  }
  async captureAuthentication(
    organizationId: string,
    method: string,
    providerId?: string
  ): Promise<WorkspaceAuthentication | undefined> {
    if (!this.enabled() || !organizationId) return undefined;
    const policy = await this.loginPolicy(organizationId);
    const provider = policy.providers.find(
      (candidate) =>
        candidate.enabled &&
        candidate.type === method &&
        (method === 'form' || (candidate.id || null) === (providerId || null))
    );
    if (!provider) return undefined;
    return {
      organizationId,
      method,
      providerId: provider.id || null,
      verifiedAt: Math.floor(Date.now() / 1000),
      policyFingerprint: policy.fingerprint,
    };
  }
  async assertCurrentAuthentication(user: User, organizationId: string): Promise<WorkspaceAuthentication> {
    this.assertBrowserUser(user, organizationId);
    const evidence = user.workspaceAuthentication;
    const now = Math.floor(Date.now() / 1000);
    if (
      !evidence ||
      evidence.organizationId !== organizationId ||
      !Number.isInteger(evidence.verifiedAt) ||
      evidence.verifiedAt > now + 30 ||
      now - evidence.verifiedAt > 600
    ) {
      throw new UnauthorizedException('Sign in to this workspace again before authorizing a connection');
    }
    const policy = await this.loginPolicy(organizationId);
    if (
      evidence.policyFingerprint !== policy.fingerprint ||
      !policy.providers.some(
        (provider) =>
          provider.enabled && provider.type === evidence.method && (provider.id || null) === evidence.providerId
      )
    )
      throw new UnauthorizedException('Sign in using a current workspace login method');
    return evidence;
  }
  private store(manager = this.dataSource.manager) {
    const policies = new Map<string, ReturnType<McpOAuthService['loginPolicy']>>();
    return new OAuthStore(manager, async (grant) => {
      if (!policies.has(grant.organization_id))
        policies.set(grant.organization_id, this.loginPolicy(grant.organization_id));
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
          [error.grantId]
        );
      }
      throw error;
    }
  }

  enabled() {
    return isMcpOAuthEnabled(this.config.get('TOOLJET_EDITION'), this.config.get('MCP_OAUTH_ENABLED'));
  }
  assertEnabled() {
    if (!this.enabled()) throw new NotFoundException();
  }
  settings() {
    return parseOAuthSettings(this.config);
  }
  /** Read current domain ownership directly: stale cache entries must not authorize a removed domain. */
  async browserTarget(organizationId: string, manager: EntityManager = this.dataSource.manager, lock = false) {
    const { browser } = this.settings();
    const primary = { url: browser, revision: 'primary' };
    if (this.config.get('ENABLE_CUSTOM_DOMAINS') !== 'true' || !this.customDomains) return primary;
    const [domain] = await manager.query(
      `SELECT id,domain FROM custom_domains
       WHERE organization_id = $1 AND status = 'active' AND ssl_status = 'active'
       ${lock ? 'FOR SHARE' : ''}`,
      [organizationId]
    );
    if (!domain) return primary;
    if (typeof domain.domain !== 'string' || !/^[a-z0-9.-]+$/i.test(domain.domain))
      throw new Error('Invalid workspace custom domain');
    try {
      const resolved = await this.customDomains.resolveCustomDomain(domain.domain);
      if (!resolved || resolved.organizationId !== organizationId) return primary;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) return primary;
      throw error;
    }
    const origin = trustedUrl(`https://${domain.domain}`).origin;
    return {
      url: origin + new URL(browser).pathname.replace(/\/$/, ''),
      revision: `${domain.id}:${domain.domain.toLowerCase()}`,
    };
  }
  private async browserTargetOrPrimary(organizationId: string) {
    try {
      return await this.browserTarget(organizationId);
    } catch {
      return { url: this.settings().browser, revision: 'primary' };
    }
  }
  async assertBrowserOrigin(organizationId: string, origin: string) {
    const { browser } = this.settings();
    if (origin === new URL(browser).origin) return;
    if (origin !== new URL((await this.browserTarget(organizationId)).url).origin)
      throw new OAuthFailure('access_denied', 'Invalid browser origin', 403);
  }
  private async assertInteractionOrigin(
    row,
    origin: string,
    manager: EntityManager = this.dataSource.manager,
    lock = false
  ) {
    const primary = new URL(this.settings().browser).origin;
    const target = row.payload.browserTarget || { url: this.settings().browser, revision: 'primary' };
    if (origin !== primary && origin !== new URL(target.url).origin)
      throw new OAuthFailure('access_denied', 'Invalid browser origin', 403);
    if (row.payload.primaryOrigin && row.payload.primaryOrigin !== primary)
      throw new OAuthFailure('invalid_request', 'ToolJet domain changed; restart the connection');
    if (row.payload.browserTarget) {
      const current = await this.browserTarget(row.payload.organizationId, manager, lock);
      if (current.url !== target.url || current.revision !== target.revision)
        throw new OAuthFailure('invalid_request', 'Workspace domain changed; restart the connection');
    }
  }
  metadata() {
    const { issuer } = this.settings();
    return {
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      registration_endpoint: `${issuer}/register`,
      revocation_endpoint: `${issuer}/revoke`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_methods_supported: [...CLIENT_AUTH_METHODS],
      revocation_endpoint_auth_methods_supported: [...CLIENT_AUTH_METHODS],
      code_challenge_methods_supported: ['S256'],
      scopes_supported: [...OAUTH_SCOPES],
      authorization_response_iss_parameter_supported: true,
    };
  }
  async register(body: Record<string, unknown>) {
    this.settings();
    const { redirects, name, authMethod } = parseRegistration(body);
    const clientSecret = authMethod === 'none' ? undefined : secret('tj_mcp_secret_');
    const id = secret('tj_mcp_client_');
    await this.dataSource.transaction(async (manager) => {
      // Cross-replica quota. Registration does not confer any ToolJet permissions.
      await manager.query("SELECT pg_advisory_xact_lock(hashtext('mcp-oauth-registration'))");
      // Pending clients are a bounded rolling cache, not consumers of the approved-client quota.
      // Evict expired/oldest pending entries synchronously so junk registrations cannot close onboarding.
      await manager.query(`DELETE FROM mcp_oauth_clients WHERE first_authorized_at IS NULL
        AND created_at < now() - interval '1 hour'`);
      await manager.query(`DELETE FROM mcp_oauth_clients WHERE id IN (
        SELECT id FROM mcp_oauth_clients WHERE first_authorized_at IS NULL
        ORDER BY created_at DESC, id DESC OFFSET 999)`);
      await manager.query(
        `INSERT INTO mcp_oauth_clients
        (id,name,redirect_uris,token_endpoint_auth_method,client_secret_hash) VALUES ($1,$2,$3,$4,$5)`,
        [id, name, JSON.stringify(redirects), authMethod, clientSecret ? hash(clientSecret) : null]
      );
    });
    return {
      client_id: id,
      client_name: name,
      redirect_uris: redirects,
      token_endpoint_auth_method: authMethod,
      ...(clientSecret ? { client_secret: clientSecret, client_secret_expires_at: 0 } : {}),
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    };
  }
  async workspace(resource: string, manager = this.dataSource.manager) {
    const base = this.settings().resource;
    if (!resource.startsWith(`${base}/`)) throw new OAuthFailure('invalid_target', 'Unknown MCP resource');
    const workspace = resource.slice(base.length + 1);
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(workspace)) throw new OAuthFailure('invalid_target', 'Use a workspace MCP URL');
    const [org] = await manager.query(
      "SELECT id,name,slug FROM organizations WHERE (id::text = $1 OR slug = $1) AND status = 'active'",
      [workspace]
    );
    if (!org) throw new OAuthFailure('invalid_target', 'Workspace is unavailable');
    return org;
  }
  async start(query: Record<string, unknown>) {
    const { browser } = this.settings();
    const clientId = stringParam(query.client_id, 'client_id');
    const redirectUri = stringParam(query.redirect_uri, 'redirect_uri');
    const store = this.store();
    const client = await store.client(clientId);
    if (!client || !client.redirectUris.some((registered) => matchesRedirectUri(redirectUri, registered)))
      throw new OAuthFailure('invalid_client', 'Unregistered client or redirect URI');
    const parsed = await (async () => {
      try {
        const params = Object.fromEntries(
          [
            'client_id',
            'redirect_uri',
            'response_type',
            'state',
            'code_challenge',
            'code_challenge_method',
            'resource',
          ].map((key) => [key, stringParam(query[key], key)])
        );
        if (
          params.response_type !== 'code' ||
          params.code_challenge_method !== 'S256' ||
          !/^[A-Za-z0-9_-]{43}$/.test(params.code_challenge)
        ) {
          throw new OAuthFailure('invalid_request', 'Authorization Code with S256 PKCE is required');
        }
        const scopes = scopesParam(query.scope);
        const org = await this.workspace(params.resource);
        return { params, scopes, org };
      } catch (error) {
        if (!(error instanceof OAuthFailure)) throw error;
        const redirect = new URL(redirectUri);
        redirect.searchParams.set('error', error.error);
        redirect.searchParams.set('iss', this.settings().issuer);
        if (typeof query.state === 'string' && query.state.length <= 4096)
          redirect.searchParams.set('state', query.state);
        throw new OAuthRedirectFailure(error, redirect.href);
      }
    })();
    const { params, scopes, org } = parsed;
    const browserTarget = await this.browserTarget(org.id);
    const id = secret();
    const csrf = secret();
    // /authorize sets a host-only cookie on the issuer. Bootstrap whenever the
    // consent page is on another host so its API calls remain first-party.
    const bootstrap = needsBrowserBootstrap(this.settings().issuer, browserTarget.url) ? secret() : undefined;
    await store.put(
      id,
      'interaction',
      client.id,
      null,
      {
        params: { ...params, scope: scopes.join(' ') },
        organizationId: org.id,
        csrfHash: hash(csrf),
        primaryOrigin: new URL(browser).origin,
        browserTarget,
        ...(bootstrap ? { bootstrapHash: hash(bootstrap) } : {}),
      },
      new Date(Date.now() + INTERACTION_SECONDS * 1000)
    );
    return {
      id,
      csrf,
      browser,
      location: `${browserTarget.url}/mcp/consent?request=${encodeURIComponent(id)}${bootstrap ? `#bootstrap=${bootstrap}` : ''}`,
    };
  }
  cookieName(id: string) {
    return `tj_mcp_${hash(id).slice(0, 16)}`;
  }
  async bootstrapBrowser(id: string, ticket: unknown, nonce: unknown, origin: string) {
    this.assertEnabled();
    stringParam(id, 'request');
    const token = stringParam(ticket, 'bootstrap');
    const browserNonce = stringParam(nonce, 'nonce');
    if (!/^[A-Za-z0-9_-]{43}$/.test(browserNonce))
      throw new OAuthFailure('invalid_request', 'Invalid browser bootstrap');
    return this.dataSource.transaction(async (manager) => {
      await manager.query("SELECT pg_advisory_xact_lock(hashtext('mcp-oauth-registration'))");
      await manager.query('SELECT id FROM mcp_oauth_artifacts WHERE id = $1 FOR UPDATE', [hash(id)]);
      const row = await this.store(manager).artifact(id, 'interaction');
      if (
        !row ||
        row.consumed_at ||
        row.expires_at <= new Date() ||
        !row.payload.bootstrapHash ||
        !equalSecret(hash(token), row.payload.bootstrapHash)
      )
        throw new OAuthFailure('invalid_request', 'Connection request expired or already opened');
      await this.assertInteractionOrigin(row, origin, manager, true);
      if (origin !== new URL(row.payload.browserTarget.url).origin)
        throw new OAuthFailure('access_denied', 'Open the connection on its workspace domain', 403);
      const nonceHash = hash(browserNonce);
      if (row.payload.bootstrapNonceHash && !equalSecret(nonceHash, row.payload.bootstrapNonceHash))
        throw new OAuthFailure('invalid_request', 'Connection request expired or already opened');
      // Deterministic only for this ticket+browser nonce. This makes an
      // ambiguous network retry idempotent without issuing a second browser
      // binding or storing the CSRF secret in the database.
      const csrf = createHmac('sha256', this.config.get<string>('MCP_OAUTH_EXCHANGE_SECRET'))
        .update(`${id}\0${token}\0${browserNonce}`)
        .digest('base64url');
      const payload = row.payload;
      await manager.query('UPDATE mcp_oauth_artifacts SET payload = $2 WHERE id = $1', [
        row.id,
        JSON.stringify({ ...payload, bootstrapNonceHash: nonceHash, customCsrfHash: hash(csrf) }),
      ]);
      return csrf;
    });
  }
  async interaction(
    id: string,
    csrf: string,
    manager = this.dataSource.manager,
    origin = new URL(this.settings().browser).origin
  ) {
    this.assertEnabled();
    stringParam(id, 'request');
    const row = await this.store(manager).artifact(id, 'interaction');
    if (
      !row ||
      row.consumed_at ||
      row.expires_at <= new Date() ||
      typeof csrf !== 'string' ||
      !equalSecret(
        hash(csrf),
        origin === new URL(this.settings().browser).origin ? row.payload.csrfHash : row.payload.customCsrfHash || ''
      )
    ) {
      throw new OAuthFailure('invalid_request', 'Connection request expired or belongs to another browser');
    }
    await this.assertInteractionOrigin(row, origin, manager);
    return row;
  }
  async preview(
    id: string,
    csrf: string,
    origin = new URL(this.settings().browser).origin
  ): Promise<InteractionPreviewResponse> {
    const row = await this.interaction(id, csrf, this.dataSource.manager, origin);
    const client = await this.store().client(row.client_id);
    if (!client) throw new OAuthFailure('invalid_client', 'Client is unavailable');
    const org = await this.workspace(row.payload.params.resource);
    // A primary-domain SSO callback stays on the primary host with its original
    // transaction cookie. Custom-domain callbacks use the separately bootstrapped cookie.
    const browser =
      origin === new URL(this.settings().browser).origin ? this.settings().browser : row.payload.browserTarget.url;
    return {
      clientName: client.name,
      clientId: client.id,
      redirectUri: row.payload.params.redirect_uri,
      organizationId: org.id,
      organizationName: org.name,
      organizationSlug: org.slug,
      scopes: row.payload.params.scope.split(' '),
      csrfToken: csrf,
      loginUrl: `${browser}/login/${encodeURIComponent(org.slug || org.id)}?oauth_reauthenticate=1&redirectTo=${encodeURIComponent(`/mcp/consent?request=${id}`)}`,
    };
  }
  assertBrowserUser(user: User, organizationId: string) {
    if (
      !user ||
      user.isPATLogin ||
      user.oauthGrantId ||
      !(user.isPasswordLogin || user.isSSOLogin) ||
      user.organizationId !== organizationId
    ) {
      throw new UnauthorizedException('Sign in to this workspace before authorizing a connection');
    }
  }
  async consent(
    id: string,
    csrf: string,
    user: User,
    allow: boolean,
    origin = new URL(this.settings().browser).origin
  ) {
    const { issuer } = this.settings();
    return this.dataSource.transaction(async (manager) => {
      await manager.query("SELECT pg_advisory_xact_lock(hashtext('mcp-oauth-registration'))");
      await manager.query('SELECT id FROM mcp_oauth_artifacts WHERE id = $1 FOR UPDATE', [hash(id)]);
      const interaction = await this.interaction(id, csrf, manager, origin);
      // Serialize consent with custom-domain replacement/removal. The
      // interaction was checked above; the locked recheck closes the race
      // before the grant is created.
      await this.assertInteractionOrigin(interaction, origin, manager, true);
      const authentication = await this.assertCurrentAuthentication(user, interaction.payload.organizationId);
      const store = this.store(manager);
      if (!(await store.client(interaction.client_id)))
        throw new OAuthFailure('invalid_client', 'Client is unavailable');
      await store.consume(interaction.id);
      const params = interaction.payload.params;
      const redirect = new URL(params.redirect_uri);
      redirect.searchParams.set('state', params.state);
      redirect.searchParams.set('iss', issuer);
      if (!allow) {
        redirect.searchParams.set('error', 'access_denied');
        return { redirectUrl: redirect.href };
      }
      const grantId = randomUUID();
      const [session] = await manager.query('SELECT created_at FROM user_sessions WHERE id = $1 AND user_id = $2', [
        user.sessionId,
        user.id,
      ]);
      if (!session) throw new UnauthorizedException();
      const [capacity] = await manager.query(
        `SELECT
        (SELECT count(*) FROM mcp_oauth_clients WHERE first_authorized_at IS NOT NULL) AS approved,
        (SELECT first_authorized_at IS NOT NULL FROM mcp_oauth_clients WHERE id = $1) AS existing`,
        [interaction.client_id]
      );
      if (!capacity.existing && Number(capacity.approved) >= 10000)
        throw new OAuthFailure('temporarily_unavailable', 'Approved client limit reached', 503);
      // Lock the client before the grant's policy lock, matching the client-disable transaction.
      await manager.query(
        'UPDATE mcp_oauth_clients SET first_authorized_at = now() WHERE id = $1 AND first_authorized_at IS NULL',
        [interaction.client_id]
      );
      await lockMcpOAuthConsent(manager);
      await manager.query(
        `INSERT INTO mcp_oauth_grants(id,client_id,user_id,organization_id,resource,scopes,authentication,expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          grantId,
          interaction.client_id,
          user.id,
          user.organizationId,
          params.resource,
          JSON.stringify(params.scope.split(' ')),
          JSON.stringify(authentication),
          new Date(Date.now() + GRANT_SECONDS * 1000),
        ]
      );
      await store.activeGrant(grantId);
      // Administrative termination may have committed while INSERT waited for the policy lock.
      const [liveSession] = await manager.query('SELECT id FROM user_sessions WHERE id = $1 AND user_id = $2', [
        user.sessionId,
        user.id,
      ]);
      if (!liveSession) throw new UnauthorizedException();
      const request = new OAuth2Server.Request({ method: 'GET', headers: {}, query: params });
      const code = await createOAuthEngine(store, params.resource).authorize(request, new OAuth2Server.Response(), {
        authenticateHandler: { handle: async () => ({ id: user.id, grantId }) },
      });
      redirect.searchParams.set('code', code.authorizationCode);
      return { redirectUrl: redirect.href };
    });
  }
  private async authenticateClient(body: Record<string, unknown>, authorization?: string, store = this.store()) {
    const credentials = clientAuthentication(body, authorization);
    const client = await store.client(credentials.clientId);
    if (
      !client ||
      client.authMethod !== credentials.method ||
      (credentials.method !== 'none' && !equalSecret(hash(credentials.clientSecret), client.secretHash))
    ) {
      throw new OAuthFailure('invalid_client', 'Invalid client authentication', authorization ? 401 : 400);
    }
    return { client, credentials };
  }
  /** Only proof of a stored credential or verified delegation selects a grant's rate bucket.
   * A public client_id or unverified JWT claim never lets an attacker spend another grant's quota. */
  async rateLimitGrant(
    route: string,
    body: Record<string, unknown>,
    headers: Record<string, any>
  ): Promise<string | undefined> {
    try {
      if (route === 'viewer') {
        const user = await this.authenticateDelegation(headers['x-tooljet-delegation'], headers['tj-workspace-id']);
        return user.oauthGrantId;
      }
      if (route !== 'token' && route !== 'revoke') return undefined;
      const { client } = await this.authenticateClient(body, headers.authorization);
      const kind =
        route === 'revoke'
          ? null
          : body.grant_type === 'refresh_token'
            ? 'refresh'
            : body.grant_type === 'authorization_code'
              ? 'code'
              : null;
      const raw = stringParam(
        route === 'revoke' ? body.token : body[kind === 'code' ? 'code' : 'refresh_token'],
        'credential'
      );
      const artifact = kind
        ? await this.store().artifact(raw, kind)
        : (await this.store().artifact(raw, 'access')) || (await this.store().artifact(raw, 'refresh'));
      if (artifact?.client_id === client.id && artifact.grant_id && artifact.expires_at > new Date()) {
        // Preserve the bounded refresh retry, but spent/revoked credentials cannot populate grant buckets.
        if (artifact.consumed_at && !(kind === 'refresh' && Date.now() - artifact.consumed_at.getTime() <= 5000))
          return undefined;
        const [grant] = await this.dataSource.query(
          'SELECT id FROM mcp_oauth_grants WHERE id=$1 AND revoked_at IS NULL AND expires_at > now()',
          [artifact.grant_id]
        );
        return grant?.id;
      }
    } catch {
      /* Invalid callers share only their own network-address bucket. */
    }
    return undefined;
  }
  async token(body: Record<string, unknown>, authorization?: string) {
    return this.persistRevocationOnFailure(() => this.issueTokens(body, authorization));
  }
  private async issueTokens(body: Record<string, unknown>, authorization?: string) {
    this.settings();
    const kind =
      body.grant_type === 'authorization_code' ? 'code' : body.grant_type === 'refresh_token' ? 'refresh' : null;
    if (!kind)
      throw new OAuthFailure('unsupported_grant_type', 'Only authorization_code and refresh_token are supported');
    const raw = stringParam(body[kind === 'code' ? 'code' : 'refresh_token'], kind);
    const resource = stringParam(body.resource, 'resource');
    const result = await this.dataSource.transaction(async (manager) => {
      const store = this.store(manager);
      const { client, credentials } = await this.authenticateClient(body, authorization, store);
      const artifact = await store.artifact(raw, kind);
      if (!artifact || artifact.client_id !== client.id) throw new OAuthFailure('invalid_grant', 'Invalid credential');
      const grant = await store.activeGrant(artifact.grant_id, true);
      // Lock the parent so concurrent refreshes cannot rotate the same token twice.
      const current = await store.artifact(raw, kind);
      if (grant.resource !== resource)
        throw new OAuthFailure('invalid_target', 'Resource does not match this connection');
      let retryKey: string | undefined;
      try {
        const retryScope = body.scope === undefined ? current.payload.scope : scopesParam(body.scope);
        retryKey = hash(canonicalJson({ resource, scope: [...retryScope].sort() }));
      } catch (error) {
        // Invalid retry parameters must not bypass consumed-token replay detection.
        if (!current.consumed_at) throw error;
      }
      if (
        current.consumed_at &&
        kind === 'refresh' &&
        retryKey !== undefined &&
        current.expires_at > new Date() &&
        current.payload.retryKey === retryKey &&
        typeof current.payload.retryResponse === 'string'
      ) {
        const [clock] = await manager.query('SELECT clock_timestamp() AS now');
        const age = (clock.now.getTime() - current.consumed_at.getTime()) / 1000;
        const cached =
          age >= 0 && age <= REFRESH_RETRY_SECONDS
            ? openRefreshRetry(this.config.get('SECRET_KEY_BASE'), current.id, current.payload.retryResponse)
            : undefined;
        if (cached && typeof cached.access_token === 'string' && typeof cached.refresh_token === 'string') {
          const access = await store.artifact(cached.access_token, 'access');
          const refresh = await store.artifact(cached.refresh_token, 'refresh');
          if (
            access?.grant_id === grant.id &&
            refresh?.grant_id === grant.id &&
            !refresh.consumed_at &&
            access.expires_at > clock.now &&
            refresh.expires_at > clock.now
          ) {
            return {
              body: {
                ...cached,
                expires_in: Math.max(0, Math.floor((access.expires_at.getTime() - clock.now.getTime()) / 1000)),
              },
            };
          }
        }
      }
      if (current.consumed_at) {
        await store.revoke(grant.id);
        return {
          failure: new OAuthFailure('invalid_grant', 'Credential was already used; reconnect the client'),
        };
      }
      if (body.scope !== undefined && scopesParam(body.scope).some((scope) => !current.payload.scope.includes(scope))) {
        throw new OAuthFailure('invalid_scope', 'Cannot increase the permissions of a connection');
      }
      // Validate syntax before the engine consumes the code. Incorrect but well-formed
      // PKCE still goes through the engine's one-attempt check and revokes the grant.
      if (
        kind === 'code' &&
        (body.redirect_uri !== current.payload.redirectUri ||
          typeof body.code_verifier !== 'string' ||
          !/^[A-Za-z0-9._~-]{43,128}$/.test(body.code_verifier))
      ) {
        throw new OAuthFailure('invalid_request', 'Invalid redirect URI or PKCE verifier');
      }
      const response = new OAuth2Server.Response();
      const tokenBody = {
        ...body,
        client_id: client.id,
        ...(credentials.clientSecret === undefined ? {} : { client_secret: credentials.clientSecret }),
      };
      try {
        await createOAuthEngine(store, resource, client).token(
          new OAuth2Server.Request({
            method: 'POST',
            headers: {
              'content-type': 'application/x-www-form-urlencoded',
              'content-length': String(
                Buffer.byteLength(new URLSearchParams(tokenBody as Record<string, string>).toString())
              ),
            },
            query: {},
            body: tokenBody,
          }),
          response
        );
        if (kind === 'refresh') {
          await manager.query('UPDATE mcp_oauth_artifacts SET payload = $2 WHERE id = $1', [
            current.id,
            JSON.stringify({
              ...current.payload,
              retryKey,
              retryResponse: sealRefreshRetry(this.config.get('SECRET_KEY_BASE'), current.id, response.body),
            }),
          ]);
        }
        return { body: response.body };
      } catch (error) {
        // Never leave an active grant with an irretrievably consumed code and no tokens.
        if (error instanceof OAuth2Server.OAuthError && error.code < 500) {
          if (error.name === 'invalid_grant' || (kind === 'code' && (await store.artifact(raw, kind))?.consumed_at))
            await store.revoke(grant.id);
          return { failure: new OAuthFailure(error.name, 'Invalid OAuth credential or request', error.code) };
        }
        throw error;
      }
    });
    if (result.failure) throw result.failure;
    return result.body;
  }
  async revoke(body: Record<string, unknown>, authorization?: string) {
    this.settings();
    const raw = stringParam(body.token, 'token');
    const store = this.store();
    const { client } = await this.authenticateClient(body, authorization, store);
    const artifact = (await store.artifact(raw, 'refresh')) || (await store.artifact(raw, 'access'));
    if (artifact?.client_id === client.id) await store.revoke(artifact.grant_id);
  }
  async exchange(body: Record<string, unknown>, authorization?: string) {
    return this.persistRevocationOnFailure(() => this.exchangeToken(body, authorization));
  }
  private async exchangeToken(body: Record<string, unknown>, authorization?: string) {
    const { issuer } = this.settings();
    if (!equalSecret(authorization || '', `Bearer ${this.config.get('MCP_OAUTH_EXCHANGE_SECRET')}`))
      throw new OAuthFailure('invalid_client', 'MCP exchange service authentication failed', 401);
    if (
      body.grant_type !== 'urn:ietf:params:oauth:grant-type:token-exchange' ||
      body.subject_token_type !== 'urn:ietf:params:oauth:token-type:access_token'
    ) {
      throw new OAuthFailure('invalid_request', 'Unsupported token exchange');
    }
    const raw = stringParam(body.subject_token, 'subject_token');
    const resource = stringParam(body.resource, 'resource');
    const store = this.store();
    const artifact = await store.artifact(raw, 'access');
    if (!artifact || artifact.expires_at <= new Date())
      throw new OAuthFailure('invalid_token', 'Access token expired or invalid', 401);
    const grant = await store.activeGrant(artifact.grant_id);
    if (grant.resource !== resource) throw new OAuthFailure('invalid_target', 'Incorrect MCP resource', 403);
    const org = await this.workspace(resource);
    const seconds = Math.max(
      0,
      Math.min(ACCESS_SECONDS, Math.floor((artifact.expires_at.getTime() - Date.now()) / 1000))
    );
    if (seconds === 0) throw new OAuthFailure('invalid_token', 'Access token expired', 401);
    const identity: DelegationIdentity = {
      sub: grant.user_id,
      oauthGrantId: grant.id,
      oauthTokenId: artifact.id,
    };
    const accessToken = this.jwt.sign(identity, {
      secret: this.config.get('SECRET_KEY_BASE'),
      issuer,
      audience: DELEGATION_AUDIENCE,
      expiresIn: seconds,
    });
    return {
      access_token: accessToken,
      issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      token_type: 'Bearer',
      expires_in: seconds,
      organization_id: grant.organization_id,
      organization_slug: org.slug,
      browser_url: (await this.browserTargetOrPrimary(grant.organization_id)).url,
      user_id: grant.user_id,
      grant_id: grant.id,
      client_id: grant.client_id,
      scope: artifact.payload.scope.join(' '),
    };
  }
  /** A browser render credential never contains the full delegation or creates a PAT/session. */
  async viewer(credential: string, workspaceId: string, appId: unknown) {
    const user = await this.authenticateDelegation(credential, workspaceId);
    if (
      !user.oauthScopes.includes('apps') ||
      !user.oauthScopes.includes('data') ||
      typeof appId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appId)
    )
      throw new OAuthFailure('access_denied', 'App rendering requires apps and data access', 403);
    const [app] = await this.dataSource.query('SELECT id FROM apps WHERE id = $1 AND organization_id = $2', [
      appId,
      workspaceId,
    ]);
    if (!app) throw new OAuthFailure('access_denied', 'App is unavailable in this workspace', 403);
    const parent = this.jwt.verify(credential, {
      secret: this.config.get('SECRET_KEY_BASE'),
      issuer: this.settings().issuer,
      audience: DELEGATION_AUDIENCE,
      algorithms: ['HS256'],
    });
    if (!isDelegationClaims(parent)) throw new UnauthorizedException();
    const store = this.store();
    const grant = await store.activeGrant(parent.oauthGrantId);
    const seconds = Math.min(VIEWER_SECONDS, Math.floor((grant.expires_at.getTime() - Date.now()) / 1000));
    if (seconds < 1) throw new UnauthorizedException();
    // An independent, hashed artifact keeps the viewer usable through a parent access-token
    // expiry while retaining live grant/policy checks and its own short expiry.
    const viewerArtifact = secret();
    await store.put(
      viewerArtifact,
      'access',
      grant.client_id,
      grant.id,
      { scope: ['apps', 'data'] },
      new Date(Date.now() + seconds * 1000)
    );
    const identity: ViewerIdentity = {
      sub: user.id,
      oauthGrantId: parent.oauthGrantId,
      oauthTokenId: hash(viewerArtifact),
      oauthAppId: appId,
    };
    return {
      access_token: this.jwt.sign(identity, {
        secret: this.config.get('SECRET_KEY_BASE'),
        issuer: this.settings().issuer,
        audience: VIEWER_AUDIENCE,
        expiresIn: seconds,
      }),
      token_type: 'Bearer',
      expires_in: seconds,
      organization_id: workspaceId,
      app_id: appId,
    };
  }
  authenticateViewer(credential: string, workspaceId?: string) {
    return this.identity.authenticateViewer(credential, workspaceId);
  }
  authenticateDelegation(credential: string, workspaceId: string) {
    return this.identity.authenticateDelegation(credential, workspaceId);
  }
  async connections(user: User): Promise<ConnectedClientResponse[]> {
    this.assertEnabled();
    this.assertBrowserUser(user, user.organizationId);
    const rows: { id: string; client_name: string; scopes: string[]; created_at: Date; expires_at: Date }[] =
      await this.dataSource.query(
        `SELECT g.id, c.name AS client_name, g.scopes, g.created_at, g.expires_at FROM mcp_oauth_grants g
       JOIN mcp_oauth_clients c ON c.id = g.client_id WHERE g.user_id = $1 AND g.organization_id = $2
       AND g.revoked_at IS NULL AND g.expires_at > now() ORDER BY g.created_at DESC`,
        [user.id, user.organizationId]
      );
    return rows.map((row) => ({
      id: row.id,
      client_name: row.client_name,
      scopes: row.scopes,
      created_at: row.created_at.toISOString(),
      expires_at: row.expires_at.toISOString(),
    }));
  }
  async disconnect(user: User, id: string) {
    this.assertEnabled();
    this.assertBrowserUser(user, user.organizationId);
    await this.dataSource.query(
      'UPDATE mcp_oauth_grants SET revoked_at = now() WHERE id::text = $1 AND user_id = $2 AND organization_id = $3',
      [id, user.id, user.organizationId]
    );
  }
}
