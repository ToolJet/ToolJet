import {
  QueryError,
  QueryResult,
  QueryService,
  User,
  App,
  initializeOAuth,
  OAuthUnauthorizedClientError,
} from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import jsforce from 'jsforce';
import { createHash } from 'crypto';
import { getCurrentToken } from '@tooljet-marketplace/common';

const GRANT_AUTHORIZATION_CODE = 'authorization_code';
const GRANT_AUTHORIZATION_CODE_PKCE = 'authorization_code_pkce';
// RFC 7636: 43-128 chars from the unreserved set
const CODE_VERIFIER_PATTERN = /^[A-Za-z0-9\-._~]{43,128}$/;

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
    const isAuthCodeGrant = !grantType || grantType === GRANT_AUTHORIZATION_CODE || grantType === GRANT_AUTHORIZATION_CODE_PKCE;

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

  private async executeOperation(conn: any, queryOptions: QueryOptions) {
    let result = {};
    let response = null;
    const operation = queryOptions.operation;

    try {
      switch (operation) {
        case 'soql': {
          const query = queryOptions.soql_query;
          if (!query || query.trim() === '') {
            throw new QueryError(
              'Invalid Query', 
              'The SOQL query cannot be empty. Please provide a valid query.', 
              {}
            );
          }
          result = await conn.query(query);
          break;
        }
        case 'crud': {
          const actiontype = queryOptions.actiontype;
          const resource_id = queryOptions.resource_id;
          const resource_body = queryOptions.resource_body;

          switch (actiontype) {
            case 'retrieve':
              response = await conn.sobject('Account').retrieve(resource_id);
              result = response;
              break;

            case 'create':
              response = await conn.sobject('Account').create(resource_body);
              result = response;
              break;

            case 'update':
              response = await conn.sobject('Account').update({ Id: resource_id, ...resource_body });
              result = response;
              break;

            case 'delete':
              response = await conn.sobject('Account').destroy(resource_id);
              result = response;
              break;

            default:
              throw new QueryError('Invalid CRUD operation', 'Please specify a valid operation', {});
          }
          break;
        }
      }
    } catch (error) {
      if(error instanceof QueryError)
        throw error;

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
    return new jsforce.OAuth2(credentials);
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
