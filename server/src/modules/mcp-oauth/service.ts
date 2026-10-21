import { Cron } from '@nestjs/schedule';
import type { ILoginConfigsUtilService } from '@modules/login-configs/interfaces/IUtilsService';
import { ForbiddenException, Inject, Injectable, NotFoundException, OnModuleInit, Optional, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomUUID } from 'crypto';
import OAuth2Server = require('@node-oauth/oauth2-server');
import { User } from '@entities/user.entity';
import { UserRepository } from '@modules/users/repositories/repository';
import { OAuthStore } from './store';
import { createOAuthEngine } from './engine';
import { DelegationIdentity, ViewerIdentity, isDelegationClaims, isViewerClaims } from './claims';
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
  RejectedOAuthGrant,
  equalSecret,
  hash,
  secret,
  canonicalJson,
  scopesParam,
  stringParam,
  trustedUrl,
  validateRedirects,
  matchesRedirectUri,
  WorkspaceAuthentication,
  CLIENT_AUTH_METHODS,
  clientAuthentication,
} from './protocol';

export const needsBrowserBootstrap = (issuer: string, browserTarget: string) =>
  new URL(browserTarget).hostname !== new URL(issuer).hostname;

@Injectable()
export class McpOAuthService implements OnModuleInit {
  constructor(
    readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly users: UserRepository,
    @Inject('MCP_LOGIN_CONFIGS')
    private readonly loginConfigs: Pick<ILoginConfigsUtilService, 'fetchOrganizationDetails'>,
    @Optional() @Inject('MCP_CUSTOM_DOMAINS')
    private readonly customDomains?: { resolveCustomDomain(domain: string): Promise<{ organizationId: string }> },
  ) {}

  onModuleInit() {
    if (this.enabled()) this.settings();
  }

  @Cron('0 4 * * *')
  async cleanExpiredCredentials() {
    if (!this.enabled()) return;
    await this.dataSource.transaction(async (manager) => {
      const [lock] = await manager.query(
        "SELECT pg_try_advisory_xact_lock(hashtext('mcp-oauth-cleanup')) AS acquired",
      );
      if (!lock.acquired) return;
      await manager.query('DELETE FROM mcp_oauth_grants WHERE expires_at < now()');
      await manager.query(
        "DELETE FROM mcp_oauth_artifacts WHERE expires_at < now() AND kind IN ('access','interaction')",
      );
      // Keep approved registrations for cached clients; collect abandoned registrations only.
      await manager.query(`DELETE FROM mcp_oauth_clients c WHERE first_authorized_at IS NULL
        AND created_at < now() - interval '24 hours'
        AND NOT EXISTS (SELECT 1 FROM mcp_oauth_grants g WHERE g.client_id = c.id)
        AND NOT EXISTS (SELECT 1 FROM mcp_oauth_artifacts a WHERE a.client_id = c.id)`);
    });
  }
  private async loginPolicy(organizationId: string) {
    const configs: any = await this.loginConfigs.fetchOrganizationDetails(
      organizationId,
      [true, false],
      true,
      true,
    );
    if (!configs) throw new UnauthorizedException('Workspace login is unavailable');
    const providers = ['form', 'google', 'git', 'openid', 'saml', 'ldap'].flatMap((type) => {
      const list = Array.isArray(configs[type]) ? configs[type] : configs[type] ? [configs[type]] : [];
      return list.map((provider) => ({
        type,
        id: provider.configId || provider.config_id,
        enabled:
          !!provider.enabled && provider.featureIncluded !== false && provider.feature_included !== false,
        config: Object.fromEntries(Object.entries(provider.configs || {}).filter(([key]) => key !== 'name')),
      }));
    });
    // Include workspace and instance restrictions that are not in the public provider list.
    const [workspacePolicy] = await this.dataSource.query(
      'SELECT slug, domain, password_allowed_domains, password_restricted_domains, inherit_sso FROM organizations WHERE id = $1',
      [organizationId],
    );
    const instancePolicy = await this.dataSource.query(
      "SELECT key,value FROM instance_settings WHERE key IN ('ALLOWED_DOMAINS','PASSWORD_ALLOWED_DOMAINS','PASSWORD_RESTRICTED_DOMAINS','ENABLE_WORKSPACE_LOGIN_CONFIGURATION','MFA_ENABLED') ORDER BY key",
    );
    // Hash stored encrypted configuration, never store or expose it in OAuth credentials.
    // Public login metadata intentionally hides secrets and group mappings.
    const storedProviders = await this.dataSource.query(
      `SELECT id, sso, enabled, config_scope,
         CASE WHEN jsonb_typeof(configs::jsonb) = 'object' THEN configs::jsonb - 'name' ELSE configs::jsonb END AS configs
       FROM sso_configs
       WHERE organization_id = $1 OR config_scope = 'instance' ORDER BY id`,
      [organizationId],
    );
    const groupSync = await this.dataSource.query(
      `SELECT sso_config_id, organization_id, claim_name, group_mapping, enable_group_sync
       FROM sso_config_oidc_group_sync WHERE organization_id = $1 OR organization_id IS NULL ORDER BY id`,
      [organizationId],
    );
    return {
      providers,
      fingerprint: hash(canonicalJson({
        providers: providers.sort((a, b) => `${a.type}:${a.id || ''}`.localeCompare(`${b.type}:${b.id || ''}`)),
        version: 1,
        workspacePolicy,
        instancePolicy,
        storedProviders,
        groupSync,
      })),
      password: providers.some((p) => p.type === 'form' && p.enabled),
      sso: providers.some((p) => p.type !== 'form' && p.enabled),
    };
  }
  async captureAuthentication(organizationId: string, method: string, providerId?: string): Promise<WorkspaceAuthentication | undefined> {
    if (!this.enabled() || !organizationId) return undefined;
    const policy = await this.loginPolicy(organizationId);
    const provider = policy.providers.find((candidate) =>
      candidate.enabled && candidate.type === method &&
      (method === 'form' || (candidate.id || null) === (providerId || null)),
    );
    if (!provider) return undefined;
    return { organizationId, method, providerId: provider.id || null, verifiedAt: Math.floor(Date.now() / 1000), policyFingerprint: policy.fingerprint };
  }
  async assertCurrentAuthentication(user: User, organizationId: string): Promise<WorkspaceAuthentication> {
    this.assertBrowserUser(user, organizationId);
    const evidence = user.workspaceAuthentication;
    const now = Math.floor(Date.now() / 1000);
    if (!evidence || evidence.organizationId !== organizationId ||
        !Number.isInteger(evidence.verifiedAt) || evidence.verifiedAt > now + 30 || now - evidence.verifiedAt > 600) {
      throw new UnauthorizedException('Sign in to this workspace again before authorizing a connection');
    }
    const policy = await this.loginPolicy(organizationId);
    if (evidence.policyFingerprint !== policy.fingerprint || !policy.providers.some((provider) =>
      provider.enabled && provider.type === evidence.method && (provider.id || null) === evidence.providerId,
    )) throw new UnauthorizedException('Sign in using a current workspace login method');
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
          [error.grantId],
        );
      }
      throw error;
    }
  }

  enabled() {
    return this.config.get('MCP_OAUTH_ENABLED') === 'true';
  }
  assertEnabled() {
    if (!this.enabled()) throw new NotFoundException();
  }
  settings() {
    this.assertEnabled();
    const subpath = (this.config.get<string>('SUB_PATH') || '').replace(/^\/+|\/+$/g, '');
    const browser =
      trustedUrl(this.config.get<string>('TOOLJET_HOST')).origin + (subpath ? `/${subpath}` : '');
    const configuredIssuer = this.config.get<string>('MCP_OAUTH_ISSUER') || `${browser}/api/mcp-oauth`;
    const configuredResource = this.config.get<string>('MCP_OAUTH_RESOURCE_URL');
    const issuer = trustedUrl(configuredIssuer).href.replace(/\/$/, '');
    const resource = configuredResource && trustedUrl(configuredResource).href.replace(/\/$/, '');
    if (new URL(issuer).pathname !== `${subpath ? `/${subpath}` : ''}/api/mcp-oauth`)
      throw new Error('MCP_OAUTH_ISSUER must point to this installation’s /api/mcp-oauth endpoint');
    if (
      !resource ||
      !this.config.get<string>('MCP_OAUTH_EXCHANGE_SECRET') ||
      this.config.get<string>('MCP_OAUTH_EXCHANGE_SECRET').length < 32
    ) {
      throw new Error('MCP OAuth requires a resource URL and an exchange secret of at least 32 characters');
    }
    for (const value of [configuredIssuer, configuredResource]) {
      const url = trustedUrl(value);
      if (url.search || value.endsWith('/'))
        throw new Error('MCP OAuth URLs must have no query or trailing slash');
    }
    // Consent needs the host-only cookie issued by /authorize, including when SSO
    // returns from a custom domain. Split backends must proxy this public endpoint.
    const issuerUrl = new URL(issuer);
    const browserUrl = new URL(browser);
    if (issuerUrl.hostname !== browserUrl.hostname || issuerUrl.protocol !== browserUrl.protocol)
      throw new Error('MCP OAuth issuer must use the TOOLJET_HOST hostname and scheme; proxy /api/mcp-oauth through the browser host');
    return { browser, issuer, resource };
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
      [organizationId],
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
  private async assertInteractionOrigin(row, origin: string, manager: EntityManager = this.dataSource.manager, lock = false) {
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
    const redirects = validateRedirects(body.redirect_uris);
    const name = stringParam(body.client_name, 'client_name', true) || 'MCP client';
    if (name.length > 120 || /[\x00-\x1f\x7f]/.test(name))
      throw new OAuthFailure('invalid_client_metadata', 'Invalid client name');
    // RFC 7591 defaults new registrations to Basic; existing rows and explicit public clients stay none.
    const authMethod = body.token_endpoint_auth_method === undefined ? 'client_secret_basic' : body.token_endpoint_auth_method;
    if (!CLIENT_AUTH_METHODS.includes(authMethod as any))
      throw new OAuthFailure('invalid_client_metadata', 'Unsupported client authentication method');
    const clientSecret = authMethod === 'none' ? undefined : secret('tj_mcp_secret_');
    if (
      body.grant_types !== undefined &&
      (!Array.isArray(body.grant_types) ||
        body.grant_types.some((g) => !['authorization_code', 'refresh_token'].includes(g)))
    ) {
      throw new OAuthFailure('invalid_client_metadata', 'Unsupported grant type');
    }
    if (
      body.response_types !== undefined &&
      (!Array.isArray(body.response_types) || body.response_types.some((g) => g !== 'code'))
    ) {
      throw new OAuthFailure('invalid_client_metadata', 'Only the code response type is supported');
    }
    const id = secret('tj_mcp_client_');
    await this.dataSource.transaction(async (manager) => {
      // Cross-replica quota. Registration does not confer any ToolJet permissions.
      await manager.query("SELECT pg_advisory_xact_lock(hashtext('mcp-oauth-registration'))");
      const [count] = await manager.query('SELECT count(*)::int AS total FROM mcp_oauth_clients');
      if (count.total >= 10000)
        throw new OAuthFailure('temporarily_unavailable', 'Client registration limit reached', 503);
      await manager.query(`INSERT INTO mcp_oauth_clients
        (id,name,redirect_uris,token_endpoint_auth_method,client_secret_hash) VALUES ($1,$2,$3,$4,$5)`, [
        id,
        name,
        JSON.stringify(redirects),
        authMethod,
        clientSecret ? hash(clientSecret) : null,
      ]);
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
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(workspace))
      throw new OAuthFailure('invalid_target', 'Use a workspace MCP URL');
    const [org] = await manager.query(
      "SELECT id,name,slug FROM organizations WHERE (id::text = $1 OR slug = $1) AND status = 'active'",
      [workspace],
    );
    if (!org) throw new OAuthFailure('invalid_target', 'Workspace is unavailable');
    return org;
  }
  async start(query: Record<string, unknown>) {
    const { browser } = this.settings();
    const params = Object.fromEntries(
      [
        'client_id',
        'redirect_uri',
        'response_type',
        'state',
        'code_challenge',
        'code_challenge_method',
        'resource',
      ].map((key) => [key, stringParam(query[key], key)]),
    );
    if (
      params.response_type !== 'code' ||
      params.code_challenge_method !== 'S256' ||
      !/^[A-Za-z0-9_-]{43}$/.test(params.code_challenge)
    ) {
      throw new OAuthFailure('invalid_request', 'Authorization Code with S256 PKCE is required');
    }
    const scopes = scopesParam(query.scope);
    const store = this.store();
    const client = await store.client(params.client_id);
    if (!client || !client.redirectUris.some((registered) => matchesRedirectUri(params.redirect_uri, registered)))
      throw new OAuthFailure('invalid_client', 'Unregistered client or redirect URI');
    const org = await this.workspace(params.resource);
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
      new Date(Date.now() + INTERACTION_SECONDS * 1000),
    );
    return { id, csrf, browser, location: `${browserTarget.url}/mcp/consent?request=${encodeURIComponent(id)}${bootstrap ? `#bootstrap=${bootstrap}` : ''}` };
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
      await manager.query('SELECT id FROM mcp_oauth_artifacts WHERE id = $1 FOR UPDATE', [hash(id)]);
      const row = await this.store(manager).artifact(id, 'interaction');
      if (!row || row.consumed_at || row.expires_at <= new Date() ||
          !row.payload.bootstrapHash || !equalSecret(hash(token), row.payload.bootstrapHash))
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
      await manager.query('UPDATE mcp_oauth_artifacts SET payload = $2 WHERE id = $1',
        [row.id, JSON.stringify({ ...payload, bootstrapNonceHash: nonceHash, customCsrfHash: hash(csrf) })]);
      return csrf;
    });
  }
  async interaction(id: string, csrf: string, manager = this.dataSource.manager, origin = new URL(this.settings().browser).origin) {
    this.assertEnabled();
    stringParam(id, 'request');
    const row = await this.store(manager).artifact(id, 'interaction');
    if (
      !row ||
      row.consumed_at ||
      row.expires_at <= new Date() ||
      typeof csrf !== 'string' ||
      !equalSecret(hash(csrf), origin === new URL(this.settings().browser).origin
        ? row.payload.csrfHash : row.payload.customCsrfHash || '')
    ) {
      throw new OAuthFailure('invalid_request', 'Connection request expired or belongs to another browser');
    }
    await this.assertInteractionOrigin(row, origin, manager);
    return row;
  }
  async preview(id: string, csrf: string, origin = new URL(this.settings().browser).origin): Promise<InteractionPreviewResponse> {
    const row = await this.interaction(id, csrf, this.dataSource.manager, origin);
    const client = await this.store().client(row.client_id);
    if (!client) throw new OAuthFailure('invalid_client', 'Client is unavailable');
    const org = await this.workspace(row.payload.params.resource);
    // A primary-domain SSO callback stays on the primary host with its original
    // transaction cookie. Custom-domain callbacks use the separately bootstrapped cookie.
    const browser = origin === new URL(this.settings().browser).origin
      ? this.settings().browser : row.payload.browserTarget.url;
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
  async consent(id: string, csrf: string, user: User, allow: boolean, origin = new URL(this.settings().browser).origin) {
    const { issuer } = this.settings();
    return this.dataSource.transaction(async (manager) => {
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
      const [session] = await manager.query(
        'SELECT created_at FROM user_sessions WHERE id = $1 AND user_id = $2',
        [user.sessionId, user.id],
      );
      if (!session) throw new UnauthorizedException();
      // Lock the client before the grant's policy lock, matching the client-disable transaction.
      await manager.query(
        'UPDATE mcp_oauth_clients SET first_authorized_at = now() WHERE id = $1 AND first_authorized_at IS NULL',
        [interaction.client_id],
      );
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
        ],
      );
      await store.activeGrant(grantId);
      const request = new OAuth2Server.Request({ method: 'GET', headers: {}, query: params });
      const code = await createOAuthEngine(store, params.resource).authorize(
        request,
        new OAuth2Server.Response(),
        {
          authenticateHandler: { handle: async () => ({ id: user.id, grantId }) },
        },
      );
      redirect.searchParams.set('code', code.authorizationCode);
      return { redirectUrl: redirect.href };
    });
  }
  private async authenticateClient(body: Record<string, unknown>, authorization?: string, store = this.store()) {
    const credentials = clientAuthentication(body, authorization);
    const client = await store.client(credentials.clientId);
    if (!client || client.authMethod !== credentials.method ||
        (credentials.method !== 'none' && !equalSecret(hash(credentials.clientSecret), client.secretHash))) {
      throw new OAuthFailure('invalid_client', 'Invalid client authentication', authorization ? 401 : 400);
    }
    return { client, credentials };
  }
  async token(body: Record<string, unknown>, authorization?: string) {
    return this.persistRevocationOnFailure(() => this.issueTokens(body, authorization));
  }
  private async issueTokens(body: Record<string, unknown>, authorization?: string) {
    this.settings();
    const kind =
      body.grant_type === 'authorization_code'
        ? 'code'
        : body.grant_type === 'refresh_token'
          ? 'refresh'
          : null;
    if (!kind)
      throw new OAuthFailure(
        'unsupported_grant_type',
        'Only authorization_code and refresh_token are supported',
      );
    const raw = stringParam(body[kind === 'code' ? 'code' : 'refresh_token'], kind);
    const resource = stringParam(body.resource, 'resource');
    const result = await this.dataSource.transaction(async (manager) => {
      const store = this.store(manager);
      const { client, credentials } = await this.authenticateClient(body, authorization, store);
      const artifact = await store.artifact(raw, kind);
      if (!artifact || artifact.client_id !== client.id)
        throw new OAuthFailure('invalid_grant', 'Invalid credential');
      const grant = await store.activeGrant(artifact.grant_id, true);
      // Lock the parent so concurrent refreshes cannot rotate the same token twice.
      const current = await store.artifact(raw, kind);
      if (grant.resource !== resource)
        throw new OAuthFailure('invalid_target', 'Resource does not match this connection');
      if (current.consumed_at) {
        await store.revoke(grant.id);
        return {
          failure: new OAuthFailure('invalid_grant', 'Credential was already used; reconnect the client'),
        };
      }
      if (
        body.scope !== undefined &&
        scopesParam(body.scope).some((scope) => !current.payload.scope.includes(scope))
      ) {
        throw new OAuthFailure('invalid_scope', 'Cannot increase the permissions of a connection');
      }
      const response = new OAuth2Server.Response();
      const tokenBody = { ...body, client_id: client.id,
        ...(credentials.clientSecret === undefined ? {} : { client_secret: credentials.clientSecret }) };
      try {
        await createOAuthEngine(store, resource, client).token(
          new OAuth2Server.Request({
            method: 'POST',
            headers: {
              'content-type': 'application/x-www-form-urlencoded',
              'content-length': String(
                Buffer.byteLength(new URLSearchParams(tokenBody as Record<string, string>).toString()),
              ),
            },
            query: {},
            body: tokenBody,
          }),
          response,
        );
        return { body: response.body };
      } catch (error) {
        // The engine consumes an authorization code before validating PKCE. Commit that
        // consumption, and revoke its grant, while rolling back actual storage errors.
        if (error instanceof OAuth2Server.OAuthError && error.code < 500) {
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
      Math.min(ACCESS_SECONDS, Math.floor((artifact.expires_at.getTime() - Date.now()) / 1000)),
    );
    if (seconds === 0) throw new OAuthFailure('invalid_token', 'Access token expired', 401);
    const identity: DelegationIdentity = {
      sub: grant.user_id,
      oauthGrantId: grant.id,
      oauthTokenId: artifact.id,
    };
    const accessToken = this.jwt.sign(
      identity,
      {
        secret: this.config.get('SECRET_KEY_BASE'),
        issuer,
        audience: DELEGATION_AUDIENCE,
        expiresIn: seconds,
      },
    );
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
    if (!user.oauthScopes.includes('apps') || !user.oauthScopes.includes('data') ||
        typeof appId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appId))
      throw new OAuthFailure('access_denied', 'App rendering requires apps and data access', 403);
    const [app] = await this.dataSource.query('SELECT id FROM apps WHERE id = $1 AND organization_id = $2', [appId, workspaceId]);
    if (!app) throw new OAuthFailure('access_denied', 'App is unavailable in this workspace', 403);
    const parent = this.jwt.verify(credential, {
      secret: this.config.get('SECRET_KEY_BASE'), issuer: this.settings().issuer,
      audience: DELEGATION_AUDIENCE, algorithms: ['HS256'],
    });
    if (!isDelegationClaims(parent)) throw new UnauthorizedException();
    const seconds = Math.min(VIEWER_SECONDS, Math.floor(parent.exp - Date.now() / 1000));
    if (seconds < 1) throw new UnauthorizedException();
    const identity: ViewerIdentity = { sub: user.id, oauthGrantId: parent.oauthGrantId,
      oauthTokenId: parent.oauthTokenId, oauthAppId: appId };
    return {
      access_token: this.jwt.sign(identity, {
        secret: this.config.get('SECRET_KEY_BASE'), issuer: this.settings().issuer,
        audience: VIEWER_AUDIENCE, expiresIn: seconds,
      }),
      token_type: 'Bearer', expires_in: seconds, organization_id: workspaceId, app_id: appId,
    };
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
  async connections(user: User): Promise<ConnectedClientResponse[]> {
    this.assertEnabled();
    this.assertBrowserUser(user, user.organizationId);
    const rows: { id: string; client_name: string; scopes: string[]; created_at: Date; expires_at: Date }[] = await this.dataSource.query(
      `SELECT g.id, c.name AS client_name, g.scopes, g.created_at, g.expires_at FROM mcp_oauth_grants g
       JOIN mcp_oauth_clients c ON c.id = g.client_id WHERE g.user_id = $1 AND g.organization_id = $2
       AND g.revoked_at IS NULL AND g.expires_at > now() ORDER BY g.created_at DESC`,
      [user.id, user.organizationId],
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
      [id, user.id, user.organizationId],
    );
  }
}
