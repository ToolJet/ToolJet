import {
  QueryError,
  QueryResult,
  QueryService,
  User,
  App,
  initializeOAuth,
  OAuthUnauthorizedClientError,
  validateUrlForSSRF,
} from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import jsforce from 'jsforce';
import { createHash } from 'crypto';
import { isIP } from 'net';
import { getCurrentToken } from '@tooljet-marketplace/common';

const GRANT_AUTHORIZATION_CODE = 'authorization_code';
const GRANT_AUTHORIZATION_CODE_PKCE = 'authorization_code_pkce';
// RFC 7636: 43-128 chars from the unreserved set
const CODE_VERIFIER_PATTERN = /^[A-Za-z0-9\-._~]{43,128}$/;

const DEFAULT_RESOURCE_NAME = 'Account';
// Standard, custom (Xyz__c) and namespaced (ns__Obj__c) object API names
const RESOURCE_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;
// Path of a next records url, e.g. /services/data/v50.0/query/01gxx0000000001AAA-2000
const NEXT_RECORDS_URL_PATTERN = /^\/services\/data\/v\d+\.\d+\/query\/[A-Za-z0-9_-]+$/;
const NEXT_RECORDS_URL_HELP =
  'Next records URL must be the nextRecordsUrl returned by the previous SOQL query, for example /services/data/v50.0/query/<locator> (the full https://<instance>/services/data/... URL also works).';

const LOGIN_URL_PRODUCTION = 'https://login.salesforce.com';
const LOGIN_URL_SANDBOX = 'https://test.salesforce.com';

export default class Salesforce implements QueryService {
  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt?: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult> {
    let result = {};
    const grantType = sourceOptions.grant_type;
    const authType = sourceOptions.auth_type;
    const multipleAuthEnabled = sourceOptions.multiple_auth_enabled;

    // By default initially we will consider the grant type as authorization_code if not provided.
    const isAuthCodeGrant =
      !grantType || grantType === GRANT_AUTHORIZATION_CODE || grantType === GRANT_AUTHORIZATION_CODE_PKCE;

    if (authType === 'oauth2' && isAuthCodeGrant && multipleAuthEnabled === true) {
      const authValidationResult = initializeOAuth(sourceOptions, context, this.authUrl.bind(this));

      if (authValidationResult.status === 'needs_oauth') return authValidationResult as any;
      // Based on multui-user auth - token will be fetched.
      const conn = await this.getConnectionWithValidatedAuth(sourceOptions, queryOptions, context);
      result = await this.executeOperation(conn, queryOptions);
    } else {
      const conn = await this.getConnection(sourceOptions, queryOptions);
      result = await this.executeOperation(conn, queryOptions);
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  // Empty / whitespace / missing means "not paginating": the regular SOQL query runs.
  private getNextRecordsUrl(queryOptions: QueryOptions): string {
    const value = queryOptions.next_records_url;
    if (value === undefined || value === null) return '';
    if (typeof value !== 'string') {
      throw new QueryError('Invalid next records URL', 'Next records URL must be a string.', {});
    }
    const nextRecordsUrl = value.trim();
    if (!nextRecordsUrl) return '';

    // The nextRecordsUrl returned by a query is absolute (instance url + path, as built by jsforce), while Salesforce
    // itself returns a relative path. Accept both and only keep the path: jsforce resolves the locator against the
    // authenticated instance url, so the host in the value is never used.
    let path = nextRecordsUrl;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(nextRecordsUrl)) {
      try {
        const url = new URL(nextRecordsUrl);
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Unsupported url');
        path = url.pathname;
      } catch (error) {
        throw new QueryError('Invalid next records URL', NEXT_RECORDS_URL_HELP, {});
      }
    }
    if (!NEXT_RECORDS_URL_PATTERN.test(path)) {
      throw new QueryError('Invalid next records URL', NEXT_RECORDS_URL_HELP, {});
    }
    return path;
  }

  // Missing / empty resource name falls back to Account (the only object supported before).
  private getResourceName(queryOptions: QueryOptions): string {
    const value = queryOptions.resource_name;
    if (value === undefined || value === null) return DEFAULT_RESOURCE_NAME;
    if (typeof value !== 'string') {
      throw new QueryError('Invalid resource name', 'Resource name must be a string, for example Account.', {});
    }
    const resourceName = value.trim() || DEFAULT_RESOURCE_NAME;
    if (!RESOURCE_NAME_PATTERN.test(resourceName)) {
      throw new QueryError(
        'Invalid resource name',
        'Resource name must be a Salesforce object API name, for example Account, Contact or Custom__c.',
        {}
      );
    }
    return resourceName;
  }

  // The id is placed in the REST path, so keep it from changing the path.
  private assertValidResourceId(resourceId: any): void {
    if (typeof resourceId === 'string' && /[/?#]|\.\./.test(resourceId)) {
      throw new QueryError('Invalid resource ID', 'Resource ID must not contain "/", "?", "#" or "..".', {});
    }
  }

  private async executeOperation(conn: any, queryOptions: QueryOptions) {
    let result = {};
    let response = null;
    const operation = queryOptions.operation;

    try {
      switch (operation) {
        case 'soql': {
          const nextRecordsUrl = this.getNextRecordsUrl(queryOptions);
          if (nextRecordsUrl) {
            // Pagination: jsforce resolves the locator against the authenticated instance url only.
            result = await conn.queryMore(nextRecordsUrl);
            break;
          }

          const query = queryOptions.soql_query;
          if (!query || query.trim() === '') {
            throw new QueryError('Invalid Query', 'The SOQL query cannot be empty. Please provide a valid query.', {});
          }
          result = await conn.query(query);
          break;
        }
        case 'crud': {
          const actiontype = queryOptions.actiontype;
          const resource_name = this.getResourceName(queryOptions);
          const resource_id = queryOptions.resource_id;
          const resource_body = queryOptions.resource_body;
          this.assertValidResourceId(resource_id);

          switch (actiontype) {
            case 'retrieve':
              response = await conn.sobject(resource_name).retrieve(resource_id);
              result = response;
              break;

            case 'create':
              response = await conn.sobject(resource_name).create(resource_body);
              result = response;
              break;

            case 'update':
              response = await conn.sobject(resource_name).update({ Id: resource_id, ...resource_body });
              result = response;
              break;

            case 'delete':
              response = await conn.sobject(resource_name).destroy(resource_id);
              result = response;
              break;

            default:
              throw new QueryError('Invalid CRUD operation', 'Please specify a valid operation', {});
          }
          break;
        }
      }
    } catch (error) {
      if (error instanceof QueryError) throw error;

      // Check for 401 status code in various locations where jsforce might set it
      const statusCode = error?.response?.statusCode || error?.statusCode || error?.response?.status;

      // Check for refresh token errors (jsforce specific)
      const isRefreshTokenError =
        error?.message?.includes('No refresh token found') ||
        error?.message?.includes('refresh token') ||
        error?.errorCode === 'INVALID_SESSION_ID';

      // Check for session/authentication errors
      const isAuthError = statusCode === 401 || error?.name === 'INVALID_SESSION_ID' || isRefreshTokenError;

      if (isAuthError) {
        throw new OAuthUnauthorizedClientError('Unauthorized - Session expired or invalid', error.message, {});
      }

      throw new QueryError('Query could not be completed', error.message, {});
    }
    return result;
  }

  async getConnectionWithValidatedAuth(sourceOptions: SourceOptions, queryOptions: QueryOptions, context) {
    try {
      const { client_id, client_secret, redirect_uri } = this.getOAuthCredentials(sourceOptions);
      const tokenData = this.getTokenDataFromValidatedSource(sourceOptions, context);
      const accessToken = tokenData.access_token;
      const instanceUrl = tokenData.instance_url;

      if (!instanceUrl) {
        throw new Error('Instance URL is missing from token data in salesforce');
      }

      const oauth2 = new jsforce.OAuth2({
        clientId: client_id,
        clientSecret: client_secret,
        redirectUri: redirect_uri,
      });

      const conn = new jsforce.Connection({
        oauth2: oauth2,
        instanceUrl: instanceUrl,
        accessToken: accessToken,
      });
      return conn;
    } catch (error) {
      throw new QueryError('Connection Error in Salesforce with validated auth', error.message, {});
    }
  }

  private getTokenDataFromValidatedSource(sourceOptions: SourceOptions, context): any {
    if (sourceOptions.tokenData) {
      if (
        sourceOptions.multiple_auth_enabled &&
        Array.isArray(sourceOptions.tokenData) &&
        sourceOptions.tokenData.length > 0
      ) {
        const userTokenData = sourceOptions.tokenData.find((token) => token.user_id === context.user.id);
        if (!userTokenData) throw new Error('No token data for the particular UserId');
        if (userTokenData) return userTokenData;
      } else if (sourceOptions.tokenData) {
        return sourceOptions.tokenData;
      }
    }

    throw new Error('No token data found');
  }

  async getConnection(sourceOptions: SourceOptions, queryOptions: QueryOptions) {
    try {
      const { client_id, client_secret, redirect_uri } = this.getOAuthCredentials(sourceOptions);
      const instanceUrl = sourceOptions.instance_url;
      const access_token = sourceOptions.access_token;

      const oauth2 = new jsforce.OAuth2({
        clientId: client_id,
        clientSecret: client_secret,
        redirectUri: redirect_uri,
      });

      const conn = new jsforce.Connection({
        oauth2: oauth2,
        instanceUrl: instanceUrl,
        accessToken: access_token,
      });
      return conn;
    } catch (error) {
      throw new QueryError('Connection Error in Salesforce', error.message, {});
    }
  }

  authUrl(source_options): string {
    const { client_id, client_secret, redirect_uri } = this.getOAuthCredentials(source_options);
    if (!this.hasRequiredCredentials(source_options, { client_id, client_secret, redirect_uri })) {
      throw new Error('OAuth2 client credentials are missing from authUrl');
    }
    const oauth2 = this.createOAuth2(source_options, {
      clientId: client_id,
      clientSecret: 'authurl',
      redirectUri: redirect_uri,
    });

    const scopes = this.getScopes(source_options);
    const params: Record<string, string> = {
      // Update the scopes as per your requirement.
      scope: `${scopes} refresh_token offline_access`,
    };

    if (this.isPkceGrant(source_options)) {
      const codeVerifier = this.getCodeVerifier(source_options);
      const method = this.getCodeChallengeMethod(source_options);
      params.code_challenge = this.buildCodeChallenge(codeVerifier, method);
      params.code_challenge_method = method;
    }

    let authorizationUrl = oauth2.getAuthorizationUrl(params);

    // Note: Prompt for login each time, even if it's not multi-user auth ( Skip Salesforce session for Oauth flow )
    // if (source_options.multiple_auth_enabled) {
    authorizationUrl += '&prompt=login';

    return authorizationUrl;
  }

  async accessDetailsFrom(authCode: string, source_options, resetSecureData = false): Promise<object> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
        ['instance_url', ''],
      ];
    }

    const { client_id, client_secret, redirect_uri } = this.getOAuthCredentials(source_options);
    if (!this.hasRequiredCredentials(source_options, { client_id, client_secret, redirect_uri })) {
      throw new Error('OAuth2 client credentials are missing from accessDetailsFrom in salesforce');
    }

    await this.assertLoginUrlIsSafe(this.getLoginUrl(source_options));

    const oauth2 = this.createOAuth2(source_options, {
      clientId: client_id,
      clientSecret: client_secret || undefined,
      redirectUri: redirect_uri,
    });
    const conn = new jsforce.Connection({ oauth2: oauth2 });

    const tokenParams: Record<string, string> = {};
    if (this.isPkceGrant(source_options)) {
      tokenParams.code_verifier = this.getCodeVerifier(source_options);
    }

    try {
      await conn.authorize(authCode, tokenParams);
    } catch (error) {
      throw new QueryError('Authorization Error', error.message, {});
    }

    const authDetails = [];
    if (conn['accessToken']) {
      authDetails.push(['access_token', conn['accessToken']]);
    }
    if (conn['refreshToken']) {
      authDetails.push(['refresh_token', conn['refreshToken']]);
    }
    if (conn['instanceUrl']) {
      authDetails.push(['instance_url', conn['instanceUrl']]);
    }
    return authDetails;
  }

  private normalizeSourceOptions(source_options: any): Record<string, any> {
    if (!Array.isArray(source_options)) {
      return source_options;
    }

    const normalized = {};
    source_options.forEach((item) => {
      normalized[item.key] = item.value;
    });
    return normalized;
  }

  private getOptionValue(option: any): any {
    if (option?.value !== undefined) {
      return option.value;
    }
    return option;
  }

  private getStringOption(source_options: any, key: string): string {
    const value = this.getOptionValue(this.normalizeSourceOptions(source_options)?.[key]);
    return typeof value === 'string' ? value.trim() : '';
  }

  private getGrantType(source_options: any): string {
    return this.getStringOption(source_options, 'grant_type') || GRANT_AUTHORIZATION_CODE;
  }

  private isPkceGrant(source_options: any): boolean {
    return this.getGrantType(source_options) === GRANT_AUTHORIZATION_CODE_PKCE;
  }

  private getScopes(source_options: any): string {
    return this.getStringOption(source_options, 'scopes') || 'full';
  }

  private getCodeVerifier(source_options: any): string {
    const codeVerifier = this.getStringOption(source_options, 'code_verifier');
    if (!CODE_VERIFIER_PATTERN.test(codeVerifier)) {
      throw new QueryError(
        'Invalid code verifier',
        'Code verifier is required for Authorization code with PKCE and must be 43-128 characters long (A-Z, a-z, 0-9, "-", ".", "_", "~").',
        {}
      );
    }
    return codeVerifier;
  }

  // Client secret is optional for PKCE: some Salesforce apps don't require it for the web server / refresh flow.
  private hasRequiredCredentials(
    source_options: any,
    credentials: { client_id: string; client_secret: string; redirect_uri: string }
  ): boolean {
    const { client_id, client_secret, redirect_uri } = credentials;
    return !!client_id && !!redirect_uri && (!!client_secret || this.isPkceGrant(source_options));
  }

  private getCodeChallengeMethod(source_options: any): 'S256' | 'plain' {
    return this.getStringOption(source_options, 'code_challenge_method') === 'plain' ? 'plain' : 'S256';
  }

  private buildCodeChallenge(codeVerifier: string, method: 'S256' | 'plain'): string {
    return method === 'plain' ? codeVerifier : createHash('sha256').update(codeVerifier).digest('base64url');
  }

  private createOAuth2(
    source_options: any,
    credentials: { clientId: string; clientSecret: string; redirectUri: string }
  ) {
    return new jsforce.OAuth2({ ...credentials, loginUrl: this.getLoginUrl(source_options) });
  }

  // Accepts "mycompany.my.salesforce.com" or "https://mycompany.my.salesforce.com/..." and returns "https://<host>".
  // Any https host is accepted; the SSRF check in the async OAuth calls guards against internal addresses.
  private normalizeCustomDomain(rawDomain: string): string {
    const invalid = (message: string) => new QueryError('Invalid custom domain', message, {});
    let value = rawDomain.trim().toLowerCase();
    if (!value) throw invalid('Custom domain is required when Login type is Custom domain.');
    // Only https is accepted; any other scheme (http://, ftp://, ...) is rejected rather than mis-parsed as a host.
    if (/^[a-z][a-z0-9+.-]*:\/\//.test(value) && !value.startsWith('https://')) {
      throw invalid('Custom domain must use https.');
    }
    value = value.replace(/^https:\/\//, '');

    let url: URL;
    try {
      url = new URL(`https://${value}`);
    } catch (error) {
      throw invalid('Custom domain is not a valid host name.');
    }
    if (url.username || url.password) throw invalid('Custom domain must not contain credentials.');
    // Salesforce login hosts are always host names (TLS certificates are issued for names, not IPs).
    if (isIP(url.hostname.replace(/^\[|\]$/g, ''))) {
      throw invalid('Custom domain must be a host name, not an IP address.');
    }

    // Only the host (and port, if any) is kept: path, query and fragment are dropped.
    return `https://${url.host}`;
  }

  // Missing / empty / unknown login type is production, which is what the plugin used before this option existed.
  getLoginUrl(source_options: any): string {
    // The ToolJet managed app uses ToolJet's own client secret: never send it to a user supplied host.
    if (this.getStringOption(source_options, 'oauth_type') === 'tooljet_app') return LOGIN_URL_PRODUCTION;

    switch (this.getStringOption(source_options, 'login_type')) {
      case 'sandbox':
        return LOGIN_URL_SANDBOX;
      case 'custom_domain':
        return this.normalizeCustomDomain(this.getStringOption(source_options, 'custom_domain'));
      default:
        return LOGIN_URL_PRODUCTION;
    }
  }

  // Production / sandbox are fixed hosts. Only the user supplied custom domain needs the SSRF check.
  private async assertLoginUrlIsSafe(loginUrl: string): Promise<void> {
    if (loginUrl === LOGIN_URL_PRODUCTION || loginUrl === LOGIN_URL_SANDBOX) return;
    await validateUrlForSSRF(loginUrl);
  }

  getOAuthCredentials(source_options: any) {
    const options = this.normalizeSourceOptions(source_options);
    const oauth_type = this.getOptionValue(options.oauth_type);
    let client_id = this.getOptionValue(options.client_id);
    let client_secret = this.getOptionValue(options.client_secret);

    let host = process.env.TOOLJET_HOST;
    if (oauth_type === 'tooljet_app') {
      client_id = process.env.SALESFORCE_CLIENT_ID;
      client_secret = process.env.SALESFORCE_CLIENT_SECRET;
    } else {
      host = this.getOptionValue(options.tj_redirect_host) || process.env.TOOLJET_HOST;
    }

    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirect_uri = `${fullUrl}oauth2/authorize`;

    return { client_id, client_secret, redirect_uri };
  }

  async refreshToken(sourceOptions, dataSourceId, userId, isAppPublic): Promise<any> {
    let refreshToken: string;
    // If multi user authentication is enabled, we would need specific users refresh token.
    if (sourceOptions?.multiple_auth_enabled) {
      const currentToken = getCurrentToken(
        sourceOptions['multiple_auth_enabled'],
        sourceOptions['tokenData'],
        userId,
        isAppPublic
      );

      if (!currentToken?.refresh_token) {
        throw new QueryError('Refresh token not found', 'Refresh token is required to refresh access token', {});
      }
      refreshToken = currentToken['refresh_token'];
    } else {
      if (!sourceOptions?.refresh_token) {
        throw new QueryError('Refresh token not found', 'Refresh token is required to refresh access token', {});
      }
      refreshToken = sourceOptions['refresh_token'];
    }

    const accessTokenDetails = {};
    // Refresh logic
    const { client_id, client_secret, redirect_uri } = this.getOAuthCredentials(sourceOptions);
    if (!this.hasRequiredCredentials(sourceOptions, { client_id, client_secret, redirect_uri })) {
      throw new Error('OAuth2 client credentials are missing from accessDetailsFrom in salesforce');
    }

    await this.assertLoginUrlIsSafe(this.getLoginUrl(sourceOptions));

    const oauth2 = this.createOAuth2(sourceOptions, {
      clientId: client_id,
      clientSecret: client_secret || undefined,
      redirectUri: redirect_uri,
    });

    let tokenResponse = {};
    try {
      tokenResponse = await oauth2.refreshToken(refreshToken);
    } catch (error) {
      if (error.message.includes('invalid_grant') || error.message.includes('token validity expired')) {
        // Refresh token is invalid - need to re-authenticate
        throw new Error('Refresh token expired. User needs to re-authorize.');
      }
      throw new QueryError('Authorization Error', error.message, {});
    }

    if (tokenResponse['access_token']) accessTokenDetails['access_token'] = tokenResponse['access_token'];
    if (tokenResponse['refresh_token']) accessTokenDetails['refresh_token'] = tokenResponse['refresh_token'];
    if (tokenResponse['instance_url']) accessTokenDetails['instance_url'] = tokenResponse['instance_url'];

    return accessTokenDetails;
  }
}
