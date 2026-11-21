import {
  ConnectionTestResult,
  OAuthUnauthorizedClientError,
  QueryError,
  QueryResult,
  QueryService,
  User,
  App,
  getCurrentToken,
  validateUrlForSSRF,
  getSSRFProtectionOptions,
} from '@tooljet-marketplace/common';
import got, { Options } from 'got';
import crypto from 'crypto';
import FormData from 'form-data';
import JSON5 from 'json5';
import { SourceOptions, QueryOptions, Region } from './types';

// ─── Region maps ─────────────────────────────────────────────────────────────

const REGION_BASE_URLS: Record<Region, string> = {
  us: 'https://api.smartsheet.com/2.0',
  eu: 'https://api.smartsheet.eu/2.0',
  au: 'https://api.smartsheet.au/2.0',
};

const REGION_AUTH_URLS: Record<Region, string> = {
  us: 'https://app.smartsheet.com/b/authorize',
  eu: 'https://app.smartsheet.eu/b/authorize',
  au: 'https://app.smartsheet.au/b/authorize',
};

const REGION_TOKEN_URLS: Record<Region, string> = {
  us: 'https://api.smartsheet.com/2.0/token',
  eu: 'https://api.smartsheet.eu/2.0/token',
  au: 'https://api.smartsheet.au/2.0/token',
};

// Shared got defaults: explicit timeout prevents indefinite hangs, and retry:0
// ensures got v11 surfaces 429s and 5xx responses to our error handler rather
// than sleeping on Retry-After headers before re-attempting the request.
const GOT_DEFAULTS = {
  timeout: { request: 30_000 },
  retry: { limit: 0 },
} as const;

// ─── Plugin ───────────────────────────────────────────────────────────────────

export default class Smartsheet implements QueryService {
  // ── Option helpers ────────────────────────────────────────────────────────

  private option(sourceOptions: any, key: string): any {
    if (Array.isArray(sourceOptions)) {
      return sourceOptions.find((entry: any) => entry?.key === key)?.value;
    }
    const value = sourceOptions?.[key];
    return value && typeof value === 'object' && 'value' in value ? value.value : value;
  }

  private region(sourceOptions: any): Region {
    const region = String(this.option(sourceOptions, 'region') || 'us').toLowerCase();
    return (['us', 'eu', 'au'].includes(region) ? region : 'us') as Region;
  }

  private baseUrl(sourceOptions: any): string {
    return REGION_BASE_URLS[this.region(sourceOptions)];
  }

  private authUrlForRegion(region: Region): string {
    return REGION_AUTH_URLS[region] || REGION_AUTH_URLS.us;
  }

  private tokenUrlForRegion(region: Region): string {
    return REGION_TOKEN_URLS[region] || REGION_TOKEN_URLS.us;
  }

  // ── Auth token resolution ─────────────────────────────────────────────────

  // Read multiple_auth_enabled and tokenData through this.option() so both the
  // flat-object and array-of-{key,value} sourceOptions storage formats are handled
  // consistently with every other field read in the class.
  private getAccessToken(sourceOptions: SourceOptions, context?: { user?: User; app?: App }): string | undefined {
    const isMultiAuthEnabled = this.option(sourceOptions, 'multiple_auth_enabled');
    if (isMultiAuthEnabled) {
      const tokenData = this.option(sourceOptions, 'tokenData');
      const currentToken = getCurrentToken(true, tokenData, context?.user?.id ?? '', context?.app?.isPublic ?? false);
      if (currentToken?.access_token) return currentToken.access_token;
      // No user context (e.g. testConnection), so any token on the datasource is enough
      // to prove the grant is still good. Mirror the same fallback getRefreshToken uses.
      return Array.isArray(tokenData) ? tokenData[0]?.access_token : undefined;
    }
    const authType = this.option(sourceOptions, 'auth_type');
    if (authType === 'personal_access_token') {
      return this.option(sourceOptions, 'access_token');
    }
    // OAuth2 or fallback: prefer the top-level access_token, then tokenData.
    const tokenData = this.option(sourceOptions, 'tokenData');
    const tokenDataAccessToken = Array.isArray(tokenData) ? tokenData[0]?.access_token : tokenData?.access_token;
    return this.option(sourceOptions, 'access_token') || tokenDataAccessToken;
  }

  private getRefreshToken(sourceOptions: SourceOptions, userId?: string, isAppPublic?: boolean): string | undefined {
    const isMultiAuthEnabled = this.option(sourceOptions, 'multiple_auth_enabled');
    if (isMultiAuthEnabled) {
      const tokenData = this.option(sourceOptions, 'tokenData');
      const currentToken = getCurrentToken(true, tokenData, userId ?? '', isAppPublic ?? false);
      if (currentToken?.refresh_token) return currentToken.refresh_token;
      // No user in context: testConnection is the only caller in that state, and any token
      // on the datasource is enough to prove the grant still works.
      return Array.isArray(tokenData) ? tokenData[0]?.refresh_token : undefined;
    }
    const tokenData = this.option(sourceOptions, 'tokenData');
    const tokenDataRefreshToken = Array.isArray(tokenData) ? tokenData[0]?.refresh_token : tokenData?.refresh_token;
    return this.option(sourceOptions, 'refresh_token') || tokenDataRefreshToken;
  }

  // ── Request helpers ───────────────────────────────────────────────────────

  private authHeader(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };
  }

  private resolveRedirectUrl(sourceOptions: any): string {
    const redirectUrl = this.option(sourceOptions, 'redirect_url');
    if (redirectUrl) {
      return redirectUrl;
    }
    const host = process.env.TOOLJET_HOST || '';
    const subPath = process.env.SUB_PATH || '/';
    const normalizedSubPath = subPath.endsWith('/') ? subPath : `${subPath}/`;
    return `${host}${normalizedSubPath}oauth2/authorize`;
  }

  // ── Public OAuth methods ──────────────────────────────────────────────────

  authUrl(sourceOptions: any): string {
    const clientId = this.option(sourceOptions, 'client_id');
    if (!clientId) {
      throw new QueryError('Invalid configuration', 'Missing Smartsheet client ID.', { code: 'MISSING_CLIENT_ID' });
    }

    const scopes = String(this.option(sourceOptions, 'scopes') || '').trim();
    const region = this.region(sourceOptions);
    const authBase = this.option(sourceOptions, 'auth_url') || this.authUrlForRegion(region);
    const url = new URL(authBase);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('scope', scopes);
    url.searchParams.set('redirect_uri', this.resolveRedirectUrl(sourceOptions));
    url.searchParams.set('state', crypto.randomBytes(16).toString('hex'));

    return url.toString();
  }

  async accessDetailsFrom(
    authCode: string,
    sourceOptions: any,
    resetSecureData = false
  ): Promise<Array<[string, string]>> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
      ];
    }

    const clientId = this.option(sourceOptions, 'client_id');
    const clientSecret = this.option(sourceOptions, 'client_secret');
    const region = this.region(sourceOptions);
    const tokenUrl = this.option(sourceOptions, 'access_token_url') || this.tokenUrlForRegion(region);

    if (!clientId || !clientSecret) {
      throw new QueryError('Invalid configuration', 'Missing Smartsheet OAuth credentials.', {
        code: 'MISSING_OAUTH_CREDENTIALS',
      });
    }

    // access_token_url is user-supplied and carries the client secret in the Basic
    // auth header, so validate it for SSRF before making the request.
    await validateUrlForSSRF(tokenUrl);

    try {
      const response = await got(tokenUrl, {
        ...GOT_DEFAULTS,
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          redirect_uri: this.resolveRedirectUrl(sourceOptions),
        }).toString(),
        responseType: 'json',
      });

      const body = response.body as Record<string, any>;
      if (!body?.access_token) {
        throw new QueryError('Failed to retrieve access token', 'Smartsheet did not return an access token.', {
          response: body,
        });
      }
      return [
        ['access_token', body?.access_token || ''],
        ['refresh_token', body?.refresh_token || ''],
      ];
    } catch (error: any) {
      if (error instanceof QueryError) throw error;
      throw new QueryError('Failed to retrieve access token', this.errorMessage(error), this.errorDetails(error));
    }
  }

  async refreshToken(
    sourceOptions: any,
    _dataSourceId?: string,
    userId?: string,
    isAppPublic?: boolean
  ): Promise<{ access_token: string; refresh_token: string }> {
    const refreshToken = this.getRefreshToken(sourceOptions, userId, isAppPublic);
    const clientId = this.option(sourceOptions, 'client_id');
    const clientSecret = this.option(sourceOptions, 'client_secret');
    const region = this.region(sourceOptions);
    const tokenUrl = this.option(sourceOptions, 'access_token_url') || this.tokenUrlForRegion(region);

    if (!refreshToken) {
      throw new OAuthUnauthorizedClientError(
        'Query could not be completed',
        'No refresh token found. Reconnect the Smartsheet datasource.',
        { code: 'MISSING_REFRESH_TOKEN' }
      );
    }

    if (!clientId || !clientSecret) {
      throw new QueryError('Invalid configuration', 'Missing Smartsheet OAuth credentials.', {
        code: 'MISSING_OAUTH_CREDENTIALS',
      });
    }

    // Same SSRF guard as accessDetailsFrom, since the token URL carries the client secret.
    await validateUrlForSSRF(tokenUrl);

    try {
      const response = await got(tokenUrl, {
        ...GOT_DEFAULTS,
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: String(refreshToken),
        }).toString(),
        responseType: 'json',
      });

      const body = response.body as Record<string, any>;

      // An empty access_token means the grant was silently revoked; surface it as
      // an auth error so ToolJet triggers re-authorization rather than caching an
      // empty token and failing on every subsequent query.
      if (!body?.access_token) {
        throw new OAuthUnauthorizedClientError(
          'Could not refresh access token',
          'Smartsheet did not return a new access token. Reconnect the datasource.',
          { code: 'EMPTY_ACCESS_TOKEN' }
        );
      }

      return {
        access_token: body.access_token,
        // Smartsheet issues non-rotating refresh tokens; if the server does not echo
        // a new one back, keep the existing token rather than clearing it.
        refresh_token: body?.refresh_token || String(refreshToken),
      };
    } catch (error: any) {
      if (error instanceof OAuthUnauthorizedClientError) throw error;
      const statusCode = error?.response?.statusCode || error?.statusCode;
      if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
        throw new OAuthUnauthorizedClientError('Could not refresh access token', this.errorMessage(error), {
          ...this.errorDetails(error),
        });
      }
      throw new QueryError('Failed to refresh access token', this.errorMessage(error), this.errorDetails(error));
    }
  }

  // ── Connection test ───────────────────────────────────────────────────────

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const accessToken = this.getAccessToken(sourceOptions);

    if (!accessToken) {
      const authType = this.option(sourceOptions, 'auth_type');
      if (authType === 'oauth2') {
        throw new QueryError(
          'Connection could not be established',
          'Authorize the Smartsheet datasource before testing the connection. Running any query opens the Smartsheet consent screen.',
          { code: 'MISSING_ACCESS_TOKEN' }
        );
      }
      throw new QueryError('Connection could not be established', 'API access token is required.', {
        code: 'MISSING_ACCESS_TOKEN',
      });
    }

    try {
      await got(`${this.baseUrl(sourceOptions)}/users/me`, {
        ...GOT_DEFAULTS,
        method: 'get',
        headers: this.authHeader(accessToken),
        responseType: 'json',
      });

      return {
        status: 'ok',
        message: 'Successfully connected to Smartsheet',
      };
    } catch (error: any) {
      const statusCode = error?.response?.statusCode || error?.statusCode;
      // A 401 for oauth2 means the access token has expired; try refreshing once before
      // reporting failure. A 403 is a permissions problem, and refreshing cannot help there.
      if (statusCode === 401) {
        const authType = this.option(sourceOptions, 'auth_type');
        if (authType === 'oauth2') {
          try {
            const refreshed = await this.refreshToken(sourceOptions);
            await got(`${this.baseUrl(sourceOptions)}/users/me`, {
              ...GOT_DEFAULTS,
              method: 'get',
              headers: this.authHeader(refreshed.access_token),
              responseType: 'json',
            });
            return { status: 'ok', message: 'Successfully connected to Smartsheet (token refreshed)' };
          } catch (refreshError: any) {
            // Only convert OAuthUnauthorizedClientError to the friendly OAUTH_TOKEN_EXPIRED
            // message. Any other error (config problem, network, etc.) propagates as-is so
            // the real cause is not hidden.
            if (!(refreshError instanceof OAuthUnauthorizedClientError)) throw refreshError;
            throw new QueryError(
              'Connection could not be established',
              'OAuth token expired or invalid. Reconnect the Smartsheet datasource.',
              { code: 'OAUTH_TOKEN_EXPIRED' }
            );
          }
        }
      }
      if (statusCode === 401 || statusCode === 403) {
        throw new QueryError(
          'Connection could not be established',
          'API token is invalid or expired. Check your Smartsheet API token.',
          { code: 'INVALID_API_TOKEN' }
        );
      }
      throw new QueryError('Connection could not be established', this.errorMessage(error), this.errorDetails(error));
    }
  }

  // ── Query helpers ─────────────────────────────────────────────────────────

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

  private parseMaybeJson(value: any): any {
    if (typeof value !== 'string') return value;
    try {
      return JSON5.parse(value);
    } catch {
      return value;
    }
  }

  private expectsStructuredValue(propertySchema: any): boolean {
    if (!propertySchema || typeof propertySchema !== 'object') return false;
    if (propertySchema.type === 'object' || propertySchema.type === 'array') return true;
    return ['properties', 'items', 'oneOf', 'anyOf', 'allOf'].some((key) => key in propertySchema);
  }

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

  // Array bodies (e.g. bulk row add) are passed through untouched. For object bodies,
  // every field the endpoint picker emits as a string is parsed back to the structured
  // value the API expects wherever the OpenAPI schema or the value's own shape indicates
  // it should be an object or array.
  private coerceStructuredFields(
    queryOptions: QueryOptions,
    bodyParams: Record<string, any> | unknown[]
  ): Record<string, unknown> | unknown[] {
    if (Array.isArray(bodyParams)) return bodyParams;

    const properties = this.bodySchemaProperties(queryOptions);
    const hasSchema = Object.keys(properties).length > 0;

    return Object.entries(bodyParams as Record<string, any>).reduce((acc: Record<string, unknown>, [key, value]) => {
      if (typeof value !== 'string') {
        acc[key] = value;
        return acc;
      }

      const trimmed = value.trim();
      const looksStructured = /^[[{]/.test(trimmed) && /[\]}]$/.test(trimmed);
      const shouldParse = hasSchema ? this.expectsStructuredValue(properties[key]) && looksStructured : looksStructured;

      acc[key] = shouldParse ? this.parseMaybeJson(trimmed) : value;
      return acc;
    }, {});
  }

  // ── Attachment helpers ────────────────────────────────────────────────────

  private detectAttachmentMode(requestBody: Record<string, any>): 'multipart' | 'binary' | 'url' | null {
    const fileObj = requestBody.file;
    if (fileObj && typeof fileObj === 'object') {
      if (fileObj.base64Data) return 'multipart';
      if (fileObj.content || fileObj.buffer) return 'binary';
    }
    if (requestBody.url && requestBody.attachmentType) {
      return 'url';
    }
    return null;
  }

  private buildMultipartRequest(
    requestBody: Record<string, any>
  ): { body: any; headers: Record<string, string> } | null {
    const fileObj = requestBody.file;
    if (!fileObj || typeof fileObj !== 'object' || !fileObj.base64Data) {
      return null;
    }

    const form = new FormData();
    const buffer = Buffer.from(String(fileObj.base64Data), 'base64');
    form.append('file', buffer, {
      filename: fileObj.name || fileObj.filename || 'file',
      contentType: fileObj.contentType || fileObj.type || 'application/octet-stream',
      knownLength: buffer.length,
    });

    for (const key of Object.keys(requestBody)) {
      if (key === 'file') continue;
      const value = requestBody[key];
      if (value !== undefined && value !== null) {
        form.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      }
    }

    return {
      body: form,
      headers: form.getHeaders(),
    };
  }

  private buildBinaryRequest(
    requestBody: Record<string, any>
  ): { body: Buffer; headers: Record<string, string> } | null {
    const fileObj = requestBody.file;
    if (!fileObj || typeof fileObj !== 'object') {
      return null;
    }

    const bufferSource = fileObj.content || fileObj.buffer || fileObj.base64Data;
    if (!bufferSource) {
      return null;
    }

    // Preserve a real Buffer object; fall back to string-based decoding for base64 or utf-8
    // strings coming from the UI.
    let buffer: Buffer;
    if (Buffer.isBuffer(bufferSource)) {
      buffer = bufferSource;
    } else {
      buffer = Buffer.from(String(bufferSource), fileObj.base64Data ? 'base64' : 'utf8');
    }

    const headers: Record<string, string> = {
      'Content-Type': fileObj.contentType || fileObj.type || 'application/octet-stream',
    };

    if (fileObj.name) {
      // Strip characters that are illegal in a Content-Disposition header value
      // (double-quotes, CR, LF) to prevent header injection.
      const safeName = String(fileObj.name).replace(/["\r\n]/g, '');
      headers['Content-Disposition'] = `attachment; filename="${safeName}"`;
    }

    return { body: buffer, headers };
  }

  private buildUrlAttachmentRequest(
    requestBody: Record<string, any>
  ): { body: any; headers: Record<string, string> } | null {
    if (!requestBody.url || !requestBody.attachmentType) {
      return null;
    }

    const body = {
      url: requestBody.url,
      name: requestBody.name || 'Attachment',
      attachmentType: requestBody.attachmentType,
    };

    return {
      body,
      headers: { 'Content-Type': 'application/json' },
    };
  }

  // ── Main query runner ─────────────────────────────────────────────────────

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    _dataSourceId: string,
    _dataSourceUpdatedAt?: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult> {
    const accessToken = this.getAccessToken(sourceOptions, context);
    if (!accessToken) {
      const authType = this.option(sourceOptions, 'auth_type');
      if (authType === 'oauth2') {
        return {
          status: 'needs_oauth',
          data: { auth_url: this.authUrl(sourceOptions) },
        } as any;
      }
      throw new QueryError('Authentication required', 'Access token is required.', { code: 'MISSING_ACCESS_TOKEN' });
    }

    const operation = String(queryOptions.operation || '').toLowerCase();
    const path = queryOptions.path || '';
    const params = queryOptions.params || {};
    const pathParams = params.path ?? {};
    const queryParams = params.query ?? {};
    const requestBody = params.request ?? {};

    if (!path) {
      throw new QueryError('Invalid configuration', 'Request path is required.', { code: 'MISSING_PATH' });
    }

    if (!['get', 'post', 'put', 'patch', 'delete'].includes(operation)) {
      throw new QueryError('Invalid configuration', `Unsupported operation: ${operation}`, {
        code: 'UNSUPPORTED_OPERATION',
      });
    }

    // Catch empty/null/undefined path param values before substitution so the request
    // never reaches Smartsheet with a placeholder-less URL like /sheets/ or /sheets/undefined.
    const missingBeforeSubstitution = Object.entries(pathParams)
      .filter(([, v]) => v === '' || v === null || v === undefined)
      .map(([k]) => `{${k}}`);
    if (missingBeforeSubstitution.length > 0) {
      throw new QueryError(
        'Invalid configuration',
        `Missing value for path parameter(s): ${missingBeforeSubstitution.join(', ')}`,
        { code: 'MISSING_PATH_PARAM' }
      );
    }

    // Use split/join instead of new RegExp(`{${key}}`) to avoid breaking on keys
    // that contain regex special characters (e.g. dots, brackets).
    let url = `${this.baseUrl(sourceOptions)}${path}`;
    for (const key of Object.keys(pathParams)) {
      const encoded = encodeURIComponent(String(pathParams[key]));
      url = url.split(`{${key}}`).join(encoded);
    }

    const unresolvedPathParams = url.match(/{[^{}]+}/g);
    if (unresolvedPathParams) {
      throw new QueryError(
        'Invalid configuration',
        `Missing value for path parameter(s): ${unresolvedPathParams.join(', ')}`,
        { code: 'MISSING_PATH_PARAM' }
      );
    }

    // responseType is intentionally left at got's default ('text') so that export
    // operations returning CSV, XLSX or PDF are not rejected, and 204 No Content
    // responses (empty body) do not throw. The body is parsed as JSON below where
    // possible. Accept: application/json in the auth header still signals to
    // Smartsheet that we prefer JSON for non-export endpoints.
    const requestOptions: Options = {
      ...GOT_DEFAULTS,
      method: operation as any,
      headers: this.authHeader(accessToken),
      searchParams: this.searchParams(queryParams),
    };

    // GET has no body in the Smartsheet API. DELETE can have one (e.g. Remove report
    // scope: DELETE /reports/{reportId}/scope takes a JSON array body). Array.isArray
    // is checked first because Object.keys on an array returns index strings, not a
    // meaningful "has body" signal.
    const hasBody = Array.isArray(requestBody) ? requestBody.length > 0 : Object.keys(requestBody).length > 0;

    if (operation !== 'get' && hasBody) {
      const attachmentMode = Array.isArray(requestBody)
        ? null
        : this.detectAttachmentMode(requestBody as Record<string, any>);

      if (attachmentMode === 'multipart') {
        const multipartRequest = this.buildMultipartRequest(requestBody as Record<string, any>);
        if (multipartRequest) {
          requestOptions.body = multipartRequest.body;
          requestOptions.headers = { ...requestOptions.headers, ...multipartRequest.headers };
        }
      } else if (attachmentMode === 'binary') {
        const binaryRequest = this.buildBinaryRequest(requestBody as Record<string, any>);
        if (binaryRequest) {
          requestOptions.body = binaryRequest.body;
          requestOptions.headers = { ...requestOptions.headers, ...binaryRequest.headers };
        }
      } else if (attachmentMode === 'url') {
        const urlRequest = this.buildUrlAttachmentRequest(requestBody as Record<string, any>);
        if (urlRequest) {
          requestOptions.json = urlRequest.body;
          requestOptions.headers = { ...requestOptions.headers, ...urlRequest.headers };
        }
      } else {
        // Plain JSON body. coerceStructuredFields also handles the array-body case
        // (returns the array unchanged without iterating its entries as object keys).
        requestOptions.json = this.coerceStructuredFields(queryOptions, requestBody as any);
      }
    }

    try {
      await validateUrlForSSRF(url);
      const response = await got(url, getSSRFProtectionOptions(undefined, requestOptions));

      // Parse the text body as JSON where possible. An empty string (204 No Content)
      // becomes {} so callers always receive an object.
      const rawBody = response.body as any;
      let body: any;
      if (rawBody === '' || rawBody === null || rawBody === undefined) {
        body = {};
      } else if (typeof rawBody === 'string') {
        try {
          body = JSON.parse(rawBody);
        } catch {
          body = { raw: rawBody };
        }
      } else {
        body = rawBody;
      }

      return { status: 'ok', data: body };
    } catch (error: any) {
      throw this.toQueryError(error, queryOptions, sourceOptions);
    }
  }

  // ── Error handling ────────────────────────────────────────────────────────

  // OAuthUnauthorizedClientError is the signal ToolJet uses to trigger an
  // automatic token refresh, so it must only be thrown when a refresh is actually
  // possible and likely to help:
  //   401 + oauth2  → token expired; ToolJet should refresh and retry
  //   401 + PAT     → bad API key; refreshing is impossible, plain QueryError
  //   403           → plan gate or permissions; refreshing cannot help, plain QueryError
  //
  // isScopeMismatch is restricted to 403: a 401 body often contains the word
  // "unauthorized" but that describes an expired token, not a missing scope.
  private toQueryError(
    error: any,
    queryOptions?: QueryOptions,
    sourceOptions?: SourceOptions
  ): QueryError | OAuthUnauthorizedClientError {
    const statusCode = error?.response?.statusCode || error?.statusCode;
    const authType = sourceOptions ? this.option(sourceOptions, 'auth_type') : undefined;

    if (statusCode === 403) {
      if (this.isScopeMismatch(error, 403)) {
        const required = this.requiredScopes(queryOptions);
        const scopeClause = required.length ? ` This operation requires ${required.join(', ')}.` : '';
        return new QueryError(
          'Missing OAuth scope',
          `${this.errorMessage(
            error
          )}.${scopeClause} Add the required scope to your Smartsheet app and reconnect the datasource.`,
          { ...this.errorDetails(error), requiredScopes: required }
        );
      }
      return new QueryError('Query could not be completed', this.errorMessage(error), {
        ...this.errorDetails(error),
        code: 'FORBIDDEN',
      });
    }

    if (statusCode === 401) {
      if (authType === 'oauth2') {
        // OAuthUnauthorizedClientError signals ToolJet's runtime to start the refresh
        // cycle. The caller does `throw this.toQueryError(...)` which re-throws it.
        return new OAuthUnauthorizedClientError('OAuth token expired or invalid', this.errorMessage(error), {
          statusCode,
          body: this.errorBody(error),
        });
      }
      return new QueryError('Query could not be completed', this.errorMessage(error), {
        ...this.errorDetails(error),
        code: 'UNAUTHORIZED',
      });
    }

    if (statusCode === 429) {
      const retryAfter = error?.response?.headers?.['retry-after'];
      return new QueryError('Rate limited', this.errorMessage(error), {
        statusCode: 429,
        body: this.errorBody(error),
        ...(retryAfter ? { retryAfter } : {}),
      });
    }

    return new QueryError('Query execution failed', this.errorMessage(error), {
      statusCode,
      body: this.errorBody(error),
      code: error?.code,
    });
  }

  private requiredScopes(queryOptions?: QueryOptions): string[] {
    const security = queryOptions?.selectedOperation?.security;
    if (!Array.isArray(security)) return [];
    for (const requirement of security) {
      for (const scopes of Object.values(requirement ?? {})) {
        if (Array.isArray(scopes) && scopes.length) return scopes as string[];
      }
    }
    return [];
  }

  // Keyword heuristic (scope/permission/unauthorized) is limited to 403 responses:
  // those words in a 401 body indicate an expired/invalid token, not a missing scope.
  // errorCode 1008 is Smartsheet's canonical "missing scope" code and is checked
  // regardless of HTTP status.
  private isScopeMismatch(error: any, statusCode?: number): boolean {
    const body = this.errorBody(error);
    if (body && body.errorCode === 1008) return true;
    if (statusCode !== 403) return false;
    const msg = this.errorMessage(error).toLowerCase();
    return msg.includes('scope') || msg.includes('permission') || msg.includes('unauthorized');
  }

  // ── Error utilities ───────────────────────────────────────────────────────

  private errorMessage(error: any): string {
    const body = this.errorBody(error);
    if (!body) return error?.message || 'Smartsheet request failed';

    if (body.errorCode !== undefined && body.message) {
      return `[${body.errorCode}] ${body.message}${body.detail ? `: ${body.detail}` : ''}`;
    }
    if (body.message) return body.message;
    if (body.error) return body.error;
    if (body.error_description) return body.error_description;

    return error?.message || 'Smartsheet request failed';
  }

  private errorBody(error: any): any {
    const body = error?.response?.body;
    if (!body) return undefined;

    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return { raw: body };
      }
    }
    return body;
  }

  private errorDetails(error: any): Record<string, any> {
    const details: Record<string, any> = {
      statusCode: error?.response?.statusCode || error?.statusCode,
      body: this.errorBody(error),
      code: error?.code,
    };
    const retryAfter = error?.response?.headers?.['retry-after'];
    if (retryAfter) {
      details.retryAfter = retryAfter;
    }
    return details;
  }
}
