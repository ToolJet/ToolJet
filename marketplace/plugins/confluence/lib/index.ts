import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
  User,
  App,
  OAuthUnauthorizedClientError,
  getCurrentToken,
  validateUrlForSSRF,
  getSSRFProtectionOptions,
} from '@tooljet-marketplace/common';
import got, { OptionsOfTextResponseBody } from 'got';
import crypto from 'crypto';
import { SourceOptions, QueryOptions } from './types';

const JSON5 = require('json5');

const ATLASSIAN_AUTH_URL = 'https://auth.atlassian.com/authorize';
const ATLASSIAN_TOKEN_URL = 'https://auth.atlassian.com/oauth/token';
const ATLASSIAN_API_GATEWAY = 'https://api.atlassian.com';
const ACCESSIBLE_RESOURCES_URL = `${ATLASSIAN_API_GATEWAY}/oauth/token/accessible-resources`;

// The spec's paths are relative to the v2 API root (`/pages`, `/spaces/{id}`), so every
// request URL gets this prefix.
const API_PATH_PREFIX = '/wiki/api/v2';

// site hostname -> Atlassian cloud id. The mapping never changes for a given hostname (renaming a
// site changes the hostname, and therefore the key), so entries do not need to expire. Shared
// across datasources because it is keyed by hostname alone; a token that cannot reach the site is
// still rejected by Atlassian on the request itself.
const CLOUD_ID_CACHE = new Map<string, string>();

export default class Confluence implements QueryService {
  // ---- option helpers ------------------------------------------------------
  // sourceOptions reaches this plugin in three shapes depending on the entry point:
  // a plain object (run/testConnection), an object of `{ value }` wrappers (authUrl, called
  // straight off the datasource record), or an array of `{ key, value }` (accessDetailsFrom).
  private option(sourceOptions: any, key: string): any {
    if (Array.isArray(sourceOptions)) {
      return sourceOptions.find((entry: any) => entry?.key === key)?.value;
    }
    const value = sourceOptions?.[key];
    return value && typeof value === 'object' && 'value' in value ? value.value : value;
  }

  private redirectUri(): string {
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    return `${host}${subpath ? subpath : '/'}oauth2/authorize`;
  }

  /**
   * Hostname of the site this connection points at, from the `site_url` connection field.
   * Accepts what the user has in their address bar in any of its usual shapes —
   * `example.atlassian.net`, `https://example.atlassian.net`, `https://example.atlassian.net/wiki`.
   */
  private siteHostname(sourceOptions: SourceOptions): string {
    const raw = (this.option(sourceOptions, 'site_url') || '').trim();
    if (!raw) {
      throw new QueryError(
        'Site not configured',
        'Set the Site URL on the Confluence datasource (e.g. https://your-site.atlassian.net) so queries know which site to call.',
        { code: 'MISSING_SITE_URL' }
      );
    }

    try {
      // Bare hostnames have no scheme for the URL parser to work with, so give them one.
      return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.toLowerCase();
    } catch {
      throw new QueryError(
        'Invalid Site URL',
        `"${raw}" is not a valid Confluence site URL. Use the address of your site, e.g. https://your-site.atlassian.net.`,
        { code: 'INVALID_SITE_URL' }
      );
    }
  }

  /**
   * Base URL for a query: https://api.atlassian.com/ex/confluence/{cloudId}/wiki/api/v2.
   *
   * 3LO tokens are only valid against the Atlassian API gateway, addressed by cloud id — they never
   * work against the site domain directly. The user configures the site by its URL (the value they
   * actually know), so the hostname is translated to its cloud id here, against the sites the token
   * can reach. The mapping is fixed for a given hostname, so it is cached per process.
   */
  private async baseUrl(sourceOptions: SourceOptions, accessToken: string): Promise<string> {
    const hostname = this.siteHostname(sourceOptions);

    const cached = CLOUD_ID_CACHE.get(hostname);
    if (cached) return `${ATLASSIAN_API_GATEWAY}/ex/confluence/${encodeURIComponent(cached)}${API_PATH_PREFIX}`;

    const sites = await this.fetchSites(accessToken);
    const match = sites.find((site: any) => this.hostnameOf(site?.url) === hostname);

    if (!match?.id) {
      throw new QueryError(
        'Site not accessible',
        `The authorized Atlassian account cannot reach "${hostname}". ${
          sites.length
            ? `Sites it can reach: ${sites.map((site: any) => site.url).join(', ')}.`
            : 'It has no accessible Confluence sites — check that the Confluence API is added to your Atlassian app.'
        } Correct the Site URL, or authorize an account with access.`,
        { code: 'SITE_NOT_ACCESSIBLE', hostname, accessibleSites: sites.map((site: any) => site.url) }
      );
    }

    CLOUD_ID_CACHE.set(hostname, match.id);
    return `${ATLASSIAN_API_GATEWAY}/ex/confluence/${encodeURIComponent(match.id)}${API_PATH_PREFIX}`;
  }

  /** Hostname of a site URL returned by Atlassian, for comparison against the configured one. */
  private hostnameOf(url: string | undefined): string | undefined {
    if (!url) return undefined;
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return undefined;
    }
  }

  /** Access token for the current user, honouring multi-auth (per-user tokens). */
  private accessToken(sourceOptions: SourceOptions, context?: { user?: User; app?: App }): string | undefined {
    if (sourceOptions.multiple_auth_enabled) {
      const currentToken = getCurrentToken(true, sourceOptions.tokenData, context?.user?.id, context?.app?.isPublic);
      return currentToken?.['access_token'];
    }
    // Single auth: the token lands either as a plain option (plugin token exchange) or inside
    // tokenData (generic REST-style exchange), depending on how the datasource was authorized.
    return sourceOptions.access_token || sourceOptions.tokenData?.['access_token'];
  }

  private refreshTokenFor(sourceOptions: SourceOptions, userId?: string, isAppPublic?: boolean): string | undefined {
    if (sourceOptions.multiple_auth_enabled) {
      const forUser = getCurrentToken(true, sourceOptions.tokenData, userId, isAppPublic)?.['refresh_token'];
      if (forUser || userId) return forUser;
      // No user in context — only testConnection calls in that state, where any token on the
      // datasource is enough to prove the grant still works.
      return Array.isArray(sourceOptions.tokenData) ? sourceOptions.tokenData[0]?.refresh_token : undefined;
    }
    return sourceOptions.refresh_token || sourceOptions.tokenData?.['refresh_token'];
  }

  // ---- OAuth ---------------------------------------------------------------

  /**
   * Atlassian rejects the authorization request without `audience` (it fronts several products)
   * and without `state`, and only returns a refresh token when `offline_access` is in scope —
   * none of which the shared getAuthUrl() helper adds, so the URL is built here.
   */
  authUrl(sourceOptions: any): string {
    const clientId = this.option(sourceOptions, 'client_id');
    if (!clientId) {
      throw new QueryError('Invalid configuration', 'Missing OAuth client ID on the Confluence datasource.', {
        code: 'MISSING_CLIENT_ID',
      });
    }

    const scopes: string = (this.option(sourceOptions, 'scopes') || '').trim();

    // offline_access on its own grants no API access, and Atlassian rejects an authorization
    // request that asks for no product scope. Failing here keeps that as a legible ToolJet
    // error instead of an opaque Atlassian consent-screen failure.
    const productScopes = scopes.split(/\s+/).filter((scope) => scope && scope !== 'offline_access');
    if (productScopes.length === 0) {
      throw new QueryError(
        'Invalid configuration',
        'Add at least one Confluence scope, e.g. read:page:confluence. Scopes must also be granted to your Atlassian app under Permissions.',
        { code: 'MISSING_SCOPES' }
      );
    }

    const finalScopes = scopes.includes('offline_access') ? scopes : `${scopes} offline_access`;

    const authUrl = new URL(this.option(sourceOptions, 'auth_url') || ATLASSIAN_AUTH_URL);
    authUrl.searchParams.set('audience', 'api.atlassian.com');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('scope', finalScopes);
    authUrl.searchParams.set('redirect_uri', this.redirectUri());
    authUrl.searchParams.set('state', crypto.randomBytes(16).toString('hex'));
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('prompt', 'consent');

    return authUrl.toString();
  }

  async accessDetailsFrom(authCode: string, sourceOptions: any, resetSecureData = false): Promise<object> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
      ];
    }

    const clientId = this.option(sourceOptions, 'client_id');
    const clientSecret = this.option(sourceOptions, 'client_secret');

    try {
      const response = await got(this.option(sourceOptions, 'access_token_url') || ATLASSIAN_TOKEN_URL, {
        method: 'post',
        json: {
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code: authCode,
          redirect_uri: this.redirectUri(),
        },
        responseType: 'json',
      });

      const result = response.body as { access_token?: string; refresh_token?: string };
      if (!result?.access_token) {
        throw new QueryError('Failed to retrieve access token', 'Atlassian did not return an access token', {
          response: result,
        });
      }

      return [
        ['access_token', result.access_token],
        ['refresh_token', result.refresh_token ?? ''],
      ];
    } catch (error) {
      throw new QueryError('Failed to retrieve access token', this.errorMessage(error), this.errorDetails(error));
    }
  }

  /**
   * Atlassian rotates refresh tokens: every refresh returns a new one and invalidates the old,
   * so the new refresh token must be handed back for persistence alongside the access token.
   */
  async refreshToken(sourceOptions: any, _dataSourceId?: string, userId?: string, isAppPublic?: boolean) {
    const refreshToken = this.refreshTokenFor(sourceOptions, userId, isAppPublic);
    if (!refreshToken) {
      throw new OAuthUnauthorizedClientError(
        'Query could not be completed',
        'No refresh token found for this datasource. Re-authorize the Confluence connection.',
        { code: 'MISSING_REFRESH_TOKEN' }
      );
    }

    try {
      const response = await got(sourceOptions['access_token_url'] || ATLASSIAN_TOKEN_URL, {
        method: 'post',
        json: {
          grant_type: 'refresh_token',
          client_id: sourceOptions['client_id'],
          client_secret: sourceOptions['client_secret'],
          refresh_token: refreshToken,
        },
        responseType: 'json',
      });

      const result = response.body as { access_token?: string; refresh_token?: string };
      if (!result?.access_token) {
        throw new QueryError('Could not refresh access token', 'Atlassian did not return an access token', {
          response: result,
        });
      }

      return {
        access_token: result.access_token,
        refresh_token: result.refresh_token ?? refreshToken,
      };
    } catch (error) {
      // A rejected refresh token cannot be recovered from — surface it as an auth error so the
      // caller restarts the 3LO flow instead of retrying.
      if (this.statusCode(error) === 400 || this.statusCode(error) === 401 || this.statusCode(error) === 403) {
        throw new OAuthUnauthorizedClientError('Could not refresh access token', this.errorMessage(error), {
          ...this.errorDetails(error),
        });
      }
      throw new QueryError('Could not refresh access token', this.errorMessage(error), this.errorDetails(error));
    }
  }

  // ---- query execution -----------------------------------------------------

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    _dataSourceId?: string,
    _dataSourceUpdatedAt?: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult> {
    const { operation, path } = queryOptions;

    if (!operation || !path) {
      throw new QueryError('Operation not selected', 'Select an endpoint in the query editor.', {
        code: 'MISSING_OPERATION',
      });
    }

    const method = operation.toLowerCase();
    const pathParams = queryOptions.params?.path ?? {};
    const queryParams = queryOptions.params?.query ?? {};
    const bodyParams = queryOptions.params?.request ?? {};

    const accessToken = this.accessToken(sourceOptions, context);
    if (!accessToken) {
      // No token yet — hand the auth URL back so the query panel opens the consent screen.
      return { status: 'needs_oauth', data: { auth_url: this.authUrl(sourceOptions) } } as any;
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    };

    let url = `${await this.baseUrl(sourceOptions, accessToken)}${path}`;
    for (const param of Object.keys(pathParams)) {
      url = url.replace(`{${param}}`, encodeURIComponent(pathParams[param]));
    }

    await validateUrlForSSRF(url);

    const requestOptions: OptionsOfTextResponseBody = {
      method: method as any,
      headers,
      ...(Object.keys(queryParams).length > 0 && { searchParams: this.searchParams(queryParams) }),
    };

    if (!['get', 'delete', 'head'].includes(method)) {
      this.setRequestBody(requestOptions, queryOptions, bodyParams);
    }

    try {
      const response = await got(url, getSSRFProtectionOptions(undefined, requestOptions));
      return { status: 'ok', data: this.parseResponse(response.body) };
    } catch (error) {
      const statusCode = this.statusCode(error);

      if (statusCode === 401 || statusCode === 403) {
        // Atlassian answers "scope does not match" when the token simply lacks the scope this
        // endpoint needs. Refreshing cannot fix that — a refreshed token carries the same
        // scopes — so report it as a configuration problem instead of triggering a retry loop,
        // and name the scope the spec says is required.
        if (this.isScopeMismatch(error)) {
          const required = this.requiredScopes(queryOptions);
          throw new QueryError(
            'Missing OAuth scope',
            `${this.errorMessage(error)}. ${
              required.length ? `This operation requires ${required.join(', ')}. ` : ''
            }Add it to the datasource's Scope(s) and to your Atlassian app under Permissions, then reconnect the datasource — an existing token keeps the scopes it was issued with.`,
            { ...this.errorDetails(error), requiredScopes: required }
          );
        }

        throw new OAuthUnauthorizedClientError('Query could not be completed', this.errorMessage(error), {
          ...this.errorDetails(error),
        });
      }

      throw new QueryError('Query could not be completed', this.errorMessage(error), this.errorDetails(error));
    }
  }

  /** Scopes the spec declares for the selected endpoint, e.g. ['delete:page:confluence']. */
  private requiredScopes(queryOptions: QueryOptions): string[] {
    const security = queryOptions.selectedOperation?.security;
    if (!Array.isArray(security)) return [];
    for (const requirement of security) {
      for (const scopes of Object.values(requirement ?? {})) {
        if (Array.isArray(scopes) && scopes.length) return scopes as string[];
      }
    }
    return [];
  }

  private isScopeMismatch(error: any): boolean {
    return /scope/i.test(this.errorMessage(error) || '');
  }

  /**
   * Query params come out of the endpoint picker as strings. Arrays are repeated rather than
   * comma-joined, which is what Confluence expects for repeatable params (e.g. `id`, `status`).
   */
  private searchParams(queryParams: Record<string, any>): URLSearchParams {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((entry) => params.append(key, String(entry)));
      } else {
        params.append(key, String(value));
      }
    });
    return params;
  }

  /**
   * Property schemas of the selected endpoint's JSON request body, flattened the same way the
   * endpoint picker flattens them so the keys line up with the fields the user filled in.
   */
  private bodySchemaProperties(queryOptions: QueryOptions): Record<string, any> {
    const content = queryOptions.selectedOperation?.requestBody?.content;
    const schema = content?.['application/json']?.schema ?? Object.values(content ?? {})[0]?.['schema'];
    const collect = (node: any): Record<string, any> => {
      if (!node || typeof node !== 'object') return {};
      if (node.properties) return node.properties;
      for (const combinator of ['allOf', 'oneOf', 'anyOf']) {
        if (Array.isArray(node[combinator])) {
          return node[combinator].reduce((acc: any, sub: any) => ({ ...acc, ...collect(sub) }), {});
        }
      }
      return {};
    };
    return collect(schema);
  }

  /** Whether the spec expects a structured value (object/array) for this body field. */
  private expectsStructuredValue(propertySchema: any): boolean {
    if (!propertySchema || typeof propertySchema !== 'object') return false;
    if (propertySchema.type === 'object' || propertySchema.type === 'array') return true;
    // `body` on pages/comments is a oneOf of shapes with no type of its own.
    return ['properties', 'items', 'oneOf', 'anyOf', 'allOf'].some((key) => key in propertySchema);
  }

  // Every write endpoint in the v2 API takes application/json — the API has no multipart
  // bodies at all (attachment upload lives in the v1 API, which this plugin does not expose).
  private setRequestBody(
    requestOptions: OptionsOfTextResponseBody,
    queryOptions: QueryOptions,
    bodyParams: Record<string, any>
  ): void {
    if (!bodyParams || Object.keys(bodyParams).length === 0) return;

    // A body with a single `body` key is what the endpoint picker produces for schema-less
    // request bodies; pass it through as-is rather than wrapping it.
    const payload =
      Object.keys(bodyParams).length === 1 && 'body' in bodyParams
        ? this.parseMaybeJson(bodyParams.body)
        : this.coerceStructuredFields(queryOptions, bodyParams);

    requestOptions.headers = { ...requestOptions.headers, 'Content-Type': 'application/json' };
    if (typeof payload === 'string') {
      requestOptions.body = payload;
    } else {
      requestOptions.json = payload as any;
    }
  }

  /**
   * Every field in the endpoint picker is a text input, so nested values like a page's
   * `body` or `version` arrive as strings. Sending those through as strings makes Confluence
   * reject the whole request with INVALID_MESSAGE, so parse them back into objects wherever
   * the spec says the field is structured. JSON5 is used so both strict JSON and the
   * JavaScript-flavoured form the code editor encourages are accepted.
   */
  private coerceStructuredFields(queryOptions: QueryOptions, bodyParams: Record<string, any>): Record<string, unknown> {
    const properties = this.bodySchemaProperties(queryOptions);
    const hasSchema = Object.keys(properties).length > 0;

    return Object.entries(bodyParams).reduce((acc: Record<string, unknown>, [key, value]) => {
      if (typeof value !== 'string') {
        acc[key] = value;
        return acc;
      }

      const trimmed = value.trim();
      const looksStructured = /^[[{]/.test(trimmed) && /[\]}]$/.test(trimmed);
      // With a schema, trust it. Without one (a query saved before the endpoint was picked),
      // fall back to shape — a value that both looks like and parses as JSON was meant as one.
      const shouldParse = hasSchema ? this.expectsStructuredValue(properties[key]) && looksStructured : looksStructured;

      acc[key] = shouldParse ? this.parseMaybeJson(trimmed) : value;
      return acc;
    }, {});
  }

  private parseMaybeJson(value: any): any {
    if (typeof value !== 'string') return value;
    try {
      return JSON5.parse(value);
    } catch {
      return value;
    }
  }

  private parseResponse(body: string): any {
    if (!body) return {};
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  // ---- errors --------------------------------------------------------------

  private statusCode(error: any): number | undefined {
    return error?.response?.statusCode ?? error?.statusCode;
  }

  private parsedBody(error: any): any {
    const body = error?.response?.body;
    if (!body) return undefined;
    if (typeof body === 'object') return body;
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  /**
   * v2 errors look like `{ errors: [{ status, code, title, detail }] }`, v1 errors like
   * `{ statusCode, message }`, and OAuth errors like `{ error, error_description }`.
   */
  private errorMessage(error: any): string {
    const body = this.parsedBody(error);
    if (typeof body === 'string' && body) return body;

    const first = body?.errors?.[0];
    return (
      first?.detail ||
      first?.title ||
      body?.message ||
      body?.error_description ||
      body?.error ||
      error?.message ||
      'An unknown error occurred'
    );
  }

  private errorDetails(error: any): Record<string, unknown> {
    const body = this.parsedBody(error);
    const statusCode = this.statusCode(error);
    const retryAfter = error?.response?.headers?.['retry-after'];

    return {
      statusCode,
      code: body?.errors?.[0]?.code || body?.error || error?.code,
      errors: body?.errors,
      response: body,
      // Confluence rate limits aggressively; surfacing Retry-After lets app builders back off.
      ...(statusCode === 429 && retryAfter ? { retryAfter } : {}),
    };
  }

  // ---- connection test ------------------------------------------------------

  /**
   * The server resolves credentials before calling this, so a token is available once the
   * datasource has been authorized — but not before, since there is nothing to test until the
   * 3LO handshake has happened.
   *
   * Unlike run(), this gets no user context, so a multi-auth datasource cannot resolve "the
   * current user's token". Any token on the datasource still proves the app credentials and
   * scopes are good, which is what a connection test is for, so the first one is used.
   */
  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const accessToken =
      this.accessToken(sourceOptions) ??
      (Array.isArray(sourceOptions.tokenData) ? sourceOptions.tokenData[0]?.access_token : undefined);

    if (!accessToken) {
      throw new QueryError(
        'Connection could not be established',
        'Authorize the Confluence datasource before testing the connection. Running any query opens the Atlassian consent screen.',
        { code: 'MISSING_ACCESS_TOKEN' }
      );
    }

    let sites: any[];
    try {
      sites = await this.fetchSites(accessToken);
    } catch (error) {
      // An expired access token is not a broken connection — queries refresh it transparently.
      // Do the same here so a healthy datasource doesn't report failure just because it's been
      // idle. The refreshed token isn't persisted; this call only proves the grant is still good.
      if (!(error instanceof OAuthUnauthorizedClientError)) throw error;
      const refreshed = await this.refreshToken(sourceOptions);
      sites = await this.fetchSites(refreshed.access_token);
    }

    if (!Array.isArray(sites) || sites.length === 0) {
      throw new QueryError(
        'Connection could not be established',
        'The authorized Atlassian account has no accessible Confluence sites. Check that the Confluence API is added to your Atlassian app.',
        { code: 'NO_ACCESSIBLE_SITES' }
      );
    }

    // A grant covers whichever sites that account authorized, which is not necessarily the site
    // configured here — most easily hit with per-user tokens, where each user's grant differs.
    // Atlassian answers an unreachable cloud id with a bare 404, so name the mismatch here
    // instead of letting every query fail opaquely.
    const hostname = this.siteHostname(sourceOptions);
    if (!sites.some((site: any) => this.hostnameOf(site?.url) === hostname)) {
      throw new QueryError(
        'Connection could not be established',
        `The authorized account cannot reach "${hostname}". Sites it can reach: ${sites
          .map((site: any) => `${site.name} (${site.url})`)
          .join(', ')}. Correct the Site URL, or authorize an account with access.`,
        { code: 'SITE_NOT_ACCESSIBLE', hostname, accessibleSites: sites.map((site: any) => site.url) }
      );
    }

    return { status: 'ok' };
  }

  /**
   * The 3LO token is not tied to one site — this is how a token maps to the sites it can reach,
   * and to their cloud ids. Used to translate the configured Site URL into a cloud id, and to
   * validate that mapping on a connection test.
   */
  private async fetchSites(accessToken: string): Promise<any[]> {
    try {
      const response = await got(ACCESSIBLE_RESOURCES_URL, {
        method: 'get',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        responseType: 'json',
      });
      const resources = (response.body as any[]) || [];
      // An Atlassian account can hold Jira and Confluence grants on the same token.
      return resources.filter(
        (resource) =>
          !Array.isArray(resource?.scopes) ||
          resource.scopes.length === 0 ||
          resource.scopes.some((scope: string) => scope.includes('confluence'))
      );
    } catch (error) {
      if (this.statusCode(error) === 401 || this.statusCode(error) === 403) {
        throw new OAuthUnauthorizedClientError('Failed to fetch sites', this.errorMessage(error), {
          ...this.errorDetails(error),
        });
      }
      throw new QueryError('Failed to fetch sites', this.errorMessage(error), this.errorDetails(error));
    }
  }
}
