import {
  QueryError,
  QueryResult,
  QueryService,
  OAuthUnauthorizedClientError,
  App,
  User,
  ConnectionTestResult,
  getCurrentToken,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { DBSQLClient } from '@databricks/sql';
import IDBSQLSession from '@databricks/sql/dist/contracts/IDBSQLSession';
import IOperation from '@databricks/sql/dist/contracts/IOperation';
import got, { Headers } from 'got';
import Int64 from 'node-int64';
import * as crypto from 'crypto';

// Temporary server-side storage for PKCE code_verifiers during oauth_u2m flow.
// Keyed by state param. Entries expire after 5 minutes.
const pkceStore = new Map<string, { codeVerifier: string; expiresAt: number }>();
const PKCE_TTL_MS = 5 * 60 * 1000;

function generateCodeVerifier(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return Array.from(crypto.randomBytes(64))
    .map((b) => chars[b % chars.length])
    .join('');
}

function generateCodeChallenge(codeVerifier: string): string {
  return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
}

function storePkceVerifier(state: string, codeVerifier: string): void {
  const now = Date.now();
  // Clean expired entries to prevent unbounded growth
  for (const [k, v] of pkceStore.entries()) {
    if (v.expiresAt < now) pkceStore.delete(k);
  }
  pkceStore.set(state, { codeVerifier, expiresAt: now + PKCE_TTL_MS });
}

function retrieveAndDeletePkceVerifier(state: string): string | null {
  const entry = pkceStore.get(state);
  if (!entry) return null;
  pkceStore.delete(state);
  if (entry.expiresAt < Date.now()) return null;
  return entry.codeVerifier;
}

export default class Databricks implements QueryService {
  private getSourceOptionValue(source_options: any, key: string): string {
    const option = Array.isArray(source_options)
      ? source_options.find((item: any) => item.key === key)
      : source_options[key];

    if (Array.isArray(source_options)) {
      return option?.value || '';
    }
    return option?.value || option || '';
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  authUrl — generates the OAuth authorization URL
  // ──────────────────────────────────────────────────────────────────────────

  authUrl(source_options: SourceOptions): string {
    const authType = this.getSourceOptionValue(source_options as any, 'authentication_type') || 'personal_access_token';

    if (authType === 'oauth_u2m') {
      return this.authUrlForOauthU2M(source_options);
    }

    // Legacy oauth2 path (backward compatibility)
    return this.authUrlForOauth2(source_options);
  }

  private authUrlForOauthU2M(source_options: SourceOptions): string {
    const workspaceHost = this.getSourceOptionValue(source_options as any, 'host');
    const clientId = this.getSourceOptionValue(source_options as any, 'client_id');

    if (!workspaceHost) throw new Error('Databricks workspace host is required for OAuth U2M');
    if (!clientId) throw new Error('Databricks OAuth Client ID is required');

    const tooljetHost = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${tooljetHost}${subpath ? subpath : '/'}`;

    const state = crypto.randomBytes(32).toString('hex');
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    storePkceVerifier(state, codeVerifier);

    return (
      `https://${workspaceHost}/oidc/v1/authorize` +
      `?response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(`${fullUrl}oauth2/authorize`)}` +
      `&scope=${encodeURIComponent('sql offline_access')}` +
      `&state=${state}` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256`
    );
  }

  private authUrlForOauth2(source_options: SourceOptions): string {
    const workspaceHost = this.getSourceOptionValue(source_options as any, 'host');
    const clientId = this.getSourceOptionValue(source_options as any, 'client_id');

    if (!workspaceHost) throw new Error('Databricks workspace host is required for OAuth');
    if (!clientId) throw new Error('Databricks OAuth Client ID is required');

    const tooljetHost = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${tooljetHost}${subpath ? subpath : '/'}`;

    return (
      `https://${workspaceHost}/oidc/v1/authorize` +
      `?response_type=code&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${fullUrl}oauth2/authorize` +
      `&scope=${encodeURIComponent('all-apis offline_access')}`
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  accessDetailsFrom — exchanges auth code for access + refresh tokens
  // ──────────────────────────────────────────────────────────────────────────

  async accessDetailsFrom(authCode: string, source_options: any, resetSecureData = false): Promise<object> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
      ];
    }

    const authType = this.getSourceOptionValue(source_options, 'authentication_type') || 'personal_access_token';

    if (authType === 'oauth_u2m') {
      return this.accessDetailsFromOauthU2M(authCode, source_options);
    }

    return this.accessDetailsFromOauth2(authCode, source_options);
  }

  private async accessDetailsFromOauthU2M(authCode: string, source_options: any): Promise<object> {
    const workspaceHost = this.getSourceOptionValue(source_options, 'host');
    const clientId = this.getSourceOptionValue(source_options, 'client_id');
    const clientSecret = this.getSourceOptionValue(source_options, 'client_secret');
    // pkce_state is injected by the server before calling accessDetailsFrom
    const state: string = source_options['pkce_state'] || '';

    if (!clientId || !clientSecret) {
      throw new Error(`Missing OAuth credentials. ClientId: ${!!clientId}, ClientSecret: ${!!clientSecret}`);
    }

    const codeVerifier = retrieveAndDeletePkceVerifier(state);
    if (!codeVerifier) {
      throw new Error('PKCE code verifier not found or expired. Please re-authenticate.');
    }

    const tooljetHost = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${tooljetHost}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;
    const tokenUrl = `https://${workspaceHost}/oidc/v1/token`;

    const data = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      scope: 'sql offline_access',
    };

    const authDetails: [string, string][] = [];

    try {
      const response = await got(tokenUrl, {
        method: 'POST',
        form: data,
      });

      const result = JSON.parse(response.body);

      if (response.statusCode !== 200) {
        throw new Error('could not connect to Databricks');
      }

      if (result['access_token']) {
        authDetails.push(['access_token', result['access_token']]);
      }
      if (result['refresh_token']) {
        authDetails.push(['refresh_token', result['refresh_token']]);
      }
    } catch (error) {
      console.log('OAuth U2M token exchange error:', error.response?.body);
      throw new Error('could not connect to Databricks');
    }

    return authDetails;
  }

  private async accessDetailsFromOauth2(authCode: string, source_options: any): Promise<object> {
    const workspaceHost = this.getSourceOptionValue(source_options, 'host');
    const clientId = this.getSourceOptionValue(source_options, 'client_id');
    const clientSecret = this.getSourceOptionValue(source_options, 'client_secret');

    if (!clientId || !clientSecret) {
      throw new Error(`Missing OAuth credentials. ClientId: ${!!clientId}, ClientSecret: ${!!clientSecret}`);
    }

    const tokenUrl = `https://${workspaceHost}/oidc/v1/token`;
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const data = {
      code: authCode,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      scope: 'all-apis offline_access',
    };

    const authDetails: [string, string][] = [];

    try {
      const response = await got(tokenUrl, {
        method: 'POST',
        form: data,
        headers: { Authorization: `Basic ${basicAuth}` },
      });

      const result = JSON.parse(response.body);

      if (response.statusCode !== 200) {
        throw new Error('could not connect to Databricks');
      }

      if (result['access_token']) {
        authDetails.push(['access_token', result['access_token']]);
      }
      if (result['refresh_token']) {
        authDetails.push(['refresh_token', result['refresh_token']]);
      }
    } catch (error) {
      console.log('OAuth error response:', error.response?.body);
      throw new Error('could not connect to Databricks');
    }

    return authDetails;
  }

  authHeader(token: string): Headers {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  refreshToken
  // ──────────────────────────────────────────────────────────────────────────

  async refreshToken(sourceOptions: any, dataSourceId: string, userId: string, isAppPublic: boolean) {
    const authType = sourceOptions['authentication_type'] || 'personal_access_token';

    if (authType === 'oauth_u2m') {
      return this.refreshTokenForOauthU2M(sourceOptions, userId, isAppPublic);
    }

    return this.refreshTokenForOauth2(sourceOptions, userId, isAppPublic);
  }

  private async refreshTokenForOauthU2M(sourceOptions: any, userId: string, isAppPublic: boolean) {
    const isMultiAuthEnabled = sourceOptions['multiple_auth_enabled'];

    const currentUserToken = isMultiAuthEnabled
      ? getCurrentToken(isMultiAuthEnabled, sourceOptions['tokenData'], userId, isAppPublic)
      : sourceOptions;

    const refreshTokenValue = currentUserToken?.['refresh_token'] || sourceOptions['refresh_token'];

    if (!refreshTokenValue) {
      throw new OAuthUnauthorizedClientError(
        'could not connect to Databricks',
        'Refresh token not found. Please re-authenticate to continue.',
        {}
      );
    }

    const workspaceHost = sourceOptions['host'];
    const clientId = sourceOptions['client_id'];
    const clientSecret = sourceOptions['client_secret'];
    const tokenUrl = `https://${workspaceHost}/oidc/v1/token`;

    const data = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshTokenValue,
    };

    const accessTokenDetails: Record<string, string> = {};

    try {
      const response = await got(tokenUrl, {
        method: 'POST',
        form: data,
      });

      const result = JSON.parse(response.body);

      if (!(response.statusCode >= 200 && response.statusCode < 300)) {
        throw new QueryError(
          'could not connect to Databricks',
          JSON.stringify({ statusCode: response?.statusCode, message: response?.body }),
          {}
        );
      }

      if (result['access_token']) {
        accessTokenDetails['access_token'] = result['access_token'];
        if (result['refresh_token']) {
          accessTokenDetails['refresh_token'] = result['refresh_token'];
        }
      } else {
        throw new QueryError(
          'access_token not found in the response',
          {},
          {
            responseObject: { statusCode: response.statusCode, responseBody: response.body },
            responseHeaders: response.headers,
          }
        );
      }
    } catch (error) {
      console.error(
        `Error while Databricks oauth_u2m refresh. Status: ${error.response?.statusCode}, Message: ${error.response?.body}`
      );
      if (error.response?.statusCode === 401 || error.response?.statusCode === 403) {
        throw new OAuthUnauthorizedClientError('Query could not be completed', error, { ...error });
      }
      throw new QueryError(
        'could not connect to Databricks',
        JSON.stringify({ statusCode: error.response?.statusCode, message: error.response?.body }),
        {}
      );
    }

    return accessTokenDetails;
  }

  private async refreshTokenForOauth2(sourceOptions: any, userId: string, isAppPublic: boolean) {
    let refreshToken: string;

    const currentUserToken = sourceOptions['refresh_token']
      ? sourceOptions
      : getCurrentToken(sourceOptions['multiple_auth_enabled'], sourceOptions['tokenData'], userId, isAppPublic);

    if (currentUserToken && currentUserToken['refresh_token']) {
      refreshToken = currentUserToken['refresh_token'];
    } else {
      throw new OAuthUnauthorizedClientError(
        'could not connect to Databricks',
        'Refresh token not found. Please re-authenticate to continue.',
        {}
      );
    }

    const workspaceHost = sourceOptions['host'];
    const clientId = sourceOptions['client_id'];
    const clientSecret = sourceOptions['client_secret'];
    const tokenUrl = `https://${workspaceHost}/oidc/v1/token`;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const data = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: 'all-apis offline_access',
    };

    const accessTokenDetails: Record<string, string> = {};

    try {
      const response = await got(tokenUrl, {
        method: 'POST',
        form: data,
        headers: { Authorization: `Basic ${basicAuth}` },
      });

      const result = JSON.parse(response.body);

      if (!(response.statusCode >= 200 && response.statusCode < 300)) {
        throw new QueryError(
          'could not connect to Databricks',
          JSON.stringify({ statusCode: response?.statusCode, message: response?.body }),
          {}
        );
      }

      if (result['access_token']) {
        accessTokenDetails['access_token'] = result['access_token'];
      } else {
        throw new QueryError(
          'access_token not found in the response',
          {},
          {
            responseObject: { statusCode: response.statusCode, responseBody: response.body },
            responseHeaders: response.headers,
          }
        );
      }
    } catch (error) {
      console.error(
        `Error while Databricks refresh token. Status: ${error.response?.statusCode}, Message: ${error.response?.body}`
      );
      if (error.response?.statusCode === 401 || error.response?.statusCode === 403) {
        throw new OAuthUnauthorizedClientError('Query could not be completed', error, { ...error });
      }
      throw new QueryError(
        'could not connect to Databricks',
        JSON.stringify({ statusCode: error.response?.statusCode, message: error.response?.body }),
        {}
      );
    }

    return accessTokenDetails;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  testConnection
  // ──────────────────────────────────────────────────────────────────────────

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const authType = sourceOptions['authentication_type'] || 'personal_access_token';

    if (authType === 'oauth_u2m') {
      // http_path is at query level for oauth_u2m, so just verify a token exists
      const isMultiAuthEnabled = sourceOptions['multiple_auth_enabled'];
      let accessToken: string;
      if (isMultiAuthEnabled) {
        const tokenData = sourceOptions['tokenData'];
        const firstToken = Array.isArray(tokenData) ? tokenData[0] : null;
        accessToken = firstToken?.access_token;
      } else {
        accessToken = sourceOptions['access_token'] as string;
      }

      if (!accessToken) {
        throw new QueryError(
          'Connection could not be established',
          'Access token not found. Please authenticate via OAuth U2M first.',
          {}
        );
      }
      return { status: 'ok' };
    }

    if (authType === 'oauth2') {
      const isMultiAuthEnabled = sourceOptions['multiple_auth_enabled'];
      let accessToken: string;
      if (isMultiAuthEnabled) {
        const tokenData = sourceOptions['tokenData'];
        const firstToken = Array.isArray(tokenData) ? tokenData[0] : null;
        accessToken = firstToken?.access_token;
      } else {
        accessToken = sourceOptions['access_token'] as string;
      }
      if (!accessToken) {
        throw new QueryError(
          'Connection could not be established',
          'Access token not found. Please authenticate via OAuth first.',
          {}
        );
      }
    }

    let result;
    const client = await this.getConnection(sourceOptions);
    const session: IDBSQLSession = await client.openSession();
    try {
      const queryOperation: IOperation = await session.executeStatement('SELECT 1', {
        runAsync: true,
        queryTimeout: new Int64(10000),
      });
      result = await queryOperation.fetchAll();
    } catch (error) {
      throw new Error('Error in connection: ' + error.message);
    } finally {
      await session.close();
      await client.close();
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  getConnection — DBSQLClient for PAT and legacy oauth2 paths
  // ──────────────────────────────────────────────────────────────────────────

  async getConnection(sourceOptions: SourceOptions, userId?: string, isAppPublic?: boolean): Promise<DBSQLClient> {
    const authType = sourceOptions['authentication_type'] || 'personal_access_token';
    let token: string;

    if (authType === 'oauth2') {
      const isMultiAuthEnabled = sourceOptions['multiple_auth_enabled'];
      let currentUserToken: any;

      if (isMultiAuthEnabled) {
        currentUserToken = getCurrentToken(isMultiAuthEnabled, sourceOptions['tokenData'], userId, isAppPublic);
      } else {
        currentUserToken = sourceOptions;
      }

      const accessToken = currentUserToken?.['access_token'] || sourceOptions['access_token'];

      if (!accessToken) {
        throw new OAuthUnauthorizedClientError(
          'Authentication required',
          'Databricks access token not found. Please authenticate via OAuth first.',
          {}
        );
      }
      token = accessToken;
    } else {
      token = sourceOptions.personal_access_token;
    }

    const credentials: any = {
      host: sourceOptions.host,
      path: sourceOptions.http_path,
      token,
      socketTimeout: 60 * 1000,
    };

    try {
      const client = new DBSQLClient();
      client.connect(credentials);
      client.on('error', (error) => {
        console.error('Error in connection: ' + error.message);
      });
      return client;
    } catch (error) {
      throw new Error('Error in connection: ' + error.message);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  run
  // ──────────────────────────────────────────────────────────────────────────

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt?: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult> {
    const authType = sourceOptions['authentication_type'] || 'personal_access_token';
    const userId = context?.user?.id;
    const isAppPublic = context?.app?.isPublic;

    if (authType === 'oauth_u2m') {
      return this.runWithOauthU2M(sourceOptions, queryOptions, userId, isAppPublic);
    }

    // PAT and legacy oauth2 — use DBSQLClient
    let result;
    const client = await this.getConnection(sourceOptions, userId, isAppPublic);
    const session: IDBSQLSession = await client.openSession();
    try {
      const queryOperation: IOperation = await session.executeStatement(queryOptions.sql_query, {
        runAsync: true,
        queryTimeout: new Int64(10000),
      });
      result = await queryOperation.fetchAll();
    } catch (error) {
      const statusCode = error.response?.statusCode || error.code || error.statusCode;
      if (authType === 'oauth2' && (statusCode === 401 || statusCode === 403)) {
        throw new OAuthUnauthorizedClientError('Query could not be completed', error.message, {});
      }
      throw new QueryError('Error fetching query result', error.message, {});
    } finally {
      await session.close();
      await client.close();
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  private async runWithOauthU2M(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    userId: string,
    isAppPublic: boolean
  ): Promise<QueryResult> {
    const isMultiAuthEnabled = sourceOptions['multiple_auth_enabled'];
    let accessToken: string;

    if (isMultiAuthEnabled) {
      const currentUserToken = getCurrentToken(isMultiAuthEnabled, sourceOptions['tokenData'], userId, isAppPublic);
      if (!currentUserToken) {
        throw new OAuthUnauthorizedClientError(
          'Authentication required',
          'Access token not found for current user. Please authenticate via OAuth U2M.',
          {}
        );
      }
      accessToken = currentUserToken['access_token'];
    } else {
      accessToken = sourceOptions['access_token'] as string;
    }

    if (!accessToken) {
      throw new OAuthUnauthorizedClientError(
        'Authentication required',
        'Databricks access token not found. Please authenticate via OAuth U2M.',
        {}
      );
    }

    // http_path is at query level for oauth_u2m
    const httpPath: string = (queryOptions as any).http_path || '';
    if (!httpPath) {
      throw new QueryError('Missing http_path', 'HTTP path (warehouse path) is required for OAuth U2M queries', {});
    }

    const warehouseId = this.extractWarehouseId(httpPath);
    const host = sourceOptions.host;

    try {
      const response = await got(`https://${host}/api/2.0/sql/statements`, {
        method: 'POST',
        json: {
          warehouse_id: warehouseId,
          statement: queryOptions.sql_query,
          wait_timeout: '50s',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = JSON.parse(response.body);
      const state = result.status?.state;

      if (state === 'FAILED') {
        throw new QueryError(
          'Query execution failed',
          result.status?.error?.message || 'Unknown Databricks error',
          {}
        );
      }

      if (state === 'RUNNING' || state === 'PENDING') {
        return await this.pollStatementResult(host, result.statement_id, accessToken);
      }

      return { status: 'ok', data: this.formatStatementResult(result) };
    } catch (error) {
      const statusCode = error.response?.statusCode || error.statusCode;
      if (statusCode === 401 || statusCode === 403) {
        throw new OAuthUnauthorizedClientError('Query could not be completed', error.message || '', {});
      }
      if (error instanceof QueryError || error instanceof OAuthUnauthorizedClientError) throw error;
      throw new QueryError('Error executing SQL statement', error.message, {});
    }
  }

  private async pollStatementResult(host: string, statementId: string, accessToken: string): Promise<QueryResult> {
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await got(`https://${host}/api/2.0/sql/statements/${statementId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const result = JSON.parse(response.body);
      const state = result.status?.state;

      if (state === 'SUCCEEDED') {
        return { status: 'ok', data: this.formatStatementResult(result) };
      }
      if (state === 'FAILED') {
        throw new QueryError(
          'Query execution failed',
          result.status?.error?.message || 'Unknown Databricks error',
          {}
        );
      }
    }

    throw new QueryError('Query timed out', 'Statement execution exceeded maximum wait time', {});
  }

  private formatStatementResult(result: any): any[] {
    const columns = result.manifest?.schema?.columns || [];
    const rows = result.result?.data_array || [];

    return rows.map((row: any[]) => {
      const obj: Record<string, any> = {};
      columns.forEach((col: any, idx: number) => {
        obj[col.name] = row[idx];
      });
      return obj;
    });
  }

  private extractWarehouseId(httpPath: string): string {
    const match = httpPath.match(/\/warehouses\/([^\/]+)$/);
    if (!match) {
      throw new QueryError(
        'Invalid http_path',
        `Cannot extract warehouse_id from http_path: "${httpPath}". Expected format: /sql/1.0/warehouses/<id>`,
        {}
      );
    }
    return match[1];
  }
}
