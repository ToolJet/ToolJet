import {
  QueryError,
  QueryResult,
  QueryService,
  OAuthUnauthorizedClientError,
  App,
  User,
  ConnectionTestResult,
  getCurrentToken,
  createQueryBuilder,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { DBSQLClient } from '@databricks/sql';
import IDBSQLSession from '@databricks/sql/dist/contracts/IDBSQLSession';
import IOperation from '@databricks/sql/dist/contracts/IOperation';
import got, { Headers } from 'got';
import Int64 from 'node-int64';

export default class Databricks implements QueryService {
  private static readonly PARAM_THRESHOLD = 16384;

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

    return (
      `https://${workspaceHost}/oidc/v1/authorize` +
      `?response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(`${fullUrl}oauth2/authorize`)}` +
      `&scope=${encodeURIComponent('sql offline_access')}`
      // `&state=${state}` +
      // `&code_challenge=${codeChallenge}` +
      // `&code_challenge_method=S256`
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
    // const state: string = source_options['pkce_state'] || '';

    if (!clientId || !clientSecret) {
      throw new Error(`Missing OAuth credentials. ClientId: ${!!clientId}, ClientSecret: ${!!clientSecret}`);
    }

    // const codeVerifier = retrieveAndDeletePkceVerifier(state);
    // if (!codeVerifier) {
    //   throw new Error('PKCE code verifier not found or expired. Please re-authenticate.');
    // }

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
      // code_verifier: codeVerifier,
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

  async refreshToken(sourceOptions: any, _dataSourceId: string, userId: string, isAppPublic: boolean) {
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

    let result: any[];
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
    _dataSourceId: string,
    _dataSourceUpdatedAt?: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult> {
    const authType = sourceOptions['authentication_type'] || 'personal_access_token';
    const userId = context?.user?.id;
    const isAppPublic = context?.app?.isPublic;

    if (queryOptions.mode === 'gui') {
      return this.handleGuiQuery(sourceOptions, queryOptions, userId, isAppPublic);
    }

    if (authType === 'oauth_u2m') {
      return this.runWithOauthU2M(sourceOptions, queryOptions, userId, isAppPublic);
    }

    // PAT and legacy oauth2 — use DBSQLClient
    const sqlText = queryOptions.query || queryOptions.sql_query;
    const finalSql = this.isSqlParametersUsed(queryOptions)
      ? this._substituteNamedParams(
          sqlText,
          Object.fromEntries((queryOptions.query_params || []).filter(([k]) => k && k.trim() !== ''))
        )
      : sqlText;

    let result: any[];
    const client = await this.getConnection(sourceOptions, userId, isAppPublic);
    const session: IDBSQLSession = await client.openSession();
    try {
      const queryOperation: IOperation = await session.executeStatement(finalSql, {
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

    const httpPath: string = sourceOptions.http_path || '';
    if (!httpPath) {
      throw new QueryError(
        'Missing http_path',
        'HTTP path (warehouse path) is required for OAuth U2M queries. Please set it in the datasource configuration.',
        {}
      );
    }

    const warehouseId = this.extractWarehouseId(httpPath);
    const host = sourceOptions.host;

    const sqlText = queryOptions.query || queryOptions.sql_query;
    const finalSql = this.isSqlParametersUsed(queryOptions)
      ? this._substituteNamedParams(
          sqlText,
          Object.fromEntries((queryOptions.query_params || []).filter(([k]) => k && k.trim() !== ''))
        )
      : sqlText;

    try {
      const response = await got(`https://${host}/api/2.0/sql/statements`, {
        method: 'POST',
        json: {
          warehouse_id: warehouseId,
          statement: finalSql,
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
        throw new QueryError('Query execution failed', result.status?.error?.message || 'Unknown Databricks error', {});
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
        throw new QueryError('Query execution failed', result.status?.error?.message || 'Unknown Databricks error', {});
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

  // ──────────────────────────────────────────────────────────────────────────
  //  invokeMethod — called by dynamic-selector widgets (listTables, listColumns)
  // ──────────────────────────────────────────────────────────────────────────

  async invokeMethod(
    methodName: string,
    context: { user?: User; app?: App },
    sourceOptions: SourceOptions,
    args?: any
  ): Promise<any> {
    const authType = sourceOptions['authentication_type'] || 'personal_access_token';
    const userId = context?.user?.id;
    const isAppPublic = context?.app?.isPublic;

    if (methodName === 'listTables') {
      if (authType === 'oauth_u2m') {
        const httpPath = sourceOptions.http_path || '';
        if (!httpPath)
          throw new QueryError('Missing http_path', 'HTTP path is required for OAuth U2M table listing.', {});
        try {
          const accessToken = this._getOAuthU2MAccessToken(sourceOptions, userId, isAppPublic);
          return await this._fetchTablesViaRest(
            sourceOptions.host,
            accessToken,
            httpPath,
            args?.search,
            args?.page,
            args?.limit
          );
        } catch (err) {
          if (err instanceof OAuthUnauthorizedClientError) throw err;
          throw new QueryError('Could not fetch tables', err.message || 'Unknown error', {});
        }
      }
      try {
        return await this._fetchTables(sourceOptions, args?.search, args?.page, args?.limit, userId, isAppPublic);
      } catch (err) {
        throw new QueryError('Could not fetch tables', err.message || 'Unknown error', {});
      }
    }

    if (methodName === 'listColumns') {
      const table = args?.values?.table || '';
      if (!table) return [];
      if (authType === 'oauth_u2m') {
        const httpPath = sourceOptions.http_path || '';
        if (!httpPath)
          throw new QueryError('Missing http_path', 'HTTP path is required for OAuth U2M column listing.', {});
        try {
          const accessToken = this._getOAuthU2MAccessToken(sourceOptions, userId, isAppPublic);
          return await this._fetchColumnsViaRest(sourceOptions.host, accessToken, httpPath, table);
        } catch (err) {
          if (err instanceof OAuthUnauthorizedClientError) throw err;
          throw new QueryError('Could not fetch columns', err.message || 'Unknown error', {});
        }
      }
      try {
        return await this._fetchColumns(sourceOptions, table, userId, isAppPublic);
      } catch (err) {
        throw new QueryError('Could not fetch columns', err.message || 'Unknown error', {});
      }
    }

    throw new QueryError('Method not found', `Method '${methodName}' is not supported by the Databricks plugin`, {});
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  _fetchTables — list tables via information_schema (PAT / oauth2 only)
  // ──────────────────────────────────────────────────────────────────────────

  private async _fetchTables(
    sourceOptions: SourceOptions,
    search = '',
    page?: number,
    limit?: number,
    userId?: string,
    isAppPublic?: boolean
  ): Promise<
    { items: Array<{ value: string; label: string }>; totalCount: number } | Array<{ value: string; label: string }>
  > {
    const client = await this.getConnection(sourceOptions, userId, isAppPublic);
    const session: IDBSQLSession = await client.openSession();
    try {
      const safeSearch = search.replace(/'/g, "''");
      const safeCatalog = sourceOptions.default_catalog?.replace(/`/g, '``');
      const infoSchema = safeCatalog ? `\`${safeCatalog}\`.information_schema` : 'information_schema';
      const schemaFilter = sourceOptions.default_schema
        ? `AND table_schema = '${sourceOptions.default_schema.replace(/'/g, "''")}' `
        : '';
      const searchFilter = safeSearch ? `AND table_name LIKE '%${safeSearch}%' ` : '';
      const baseWhere = `table_type = 'BASE TABLE' ${schemaFilter}${searchFilter}`;

      if (limit) {
        const offset = ((page || 1) - 1) * limit;

        const countOp: IOperation = await session.executeStatement(
          `SELECT COUNT(*) AS cnt FROM ${infoSchema}.tables WHERE ${baseWhere}`,
          { runAsync: true, queryTimeout: new Int64(10000) }
        );
        const countRows = await countOp.fetchAll();
        const totalCount = Number((countRows as any[])?.[0]?.cnt ?? (countRows as any[])?.[0]?.CNT ?? 0);

        const dataOp: IOperation = await session.executeStatement(
          `SELECT table_name FROM ${infoSchema}.tables WHERE ${baseWhere} ORDER BY table_name LIMIT ${limit} OFFSET ${offset}`,
          { runAsync: true, queryTimeout: new Int64(10000) }
        );
        const dataRows = (await dataOp.fetchAll()) as any[];
        const items = dataRows.map((row) => {
          const name = row.table_name || row.TABLE_NAME;
          const qualified = this._qualifyTableName(name, sourceOptions.default_catalog, sourceOptions.default_schema);
          return { value: qualified, label: qualified };
        });
        return { items, totalCount };
      }

      const op: IOperation = await session.executeStatement(
        `SELECT table_name FROM ${infoSchema}.tables WHERE ${baseWhere} ORDER BY table_name`,
        { runAsync: true, queryTimeout: new Int64(10000) }
      );
      const rows = (await op.fetchAll()) as any[];
      return rows.map((row) => {
        const name = row.table_name || row.TABLE_NAME;
        const qualified = this._qualifyTableName(name, sourceOptions.default_catalog, sourceOptions.default_schema);
        return { value: qualified, label: qualified };
      });
    } catch (err) {
      console.log(err, 'sus');
      throw new QueryError('Could not fetch tables', err.message || 'Unknown error', {});
    } finally {
      await session.close();
      await client.close();
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  _fetchColumns — list columns via information_schema (PAT / oauth2 only)
  // ──────────────────────────────────────────────────────────────────────────

  private async _fetchColumns(
    sourceOptions: SourceOptions,
    table: string,
    userId?: string,
    isAppPublic?: boolean
  ): Promise<Array<{ value: string; label: string }>> {
    const client = await this.getConnection(sourceOptions, userId, isAppPublic);
    const session: IDBSQLSession = await client.openSession();
    try {
      const safeTable = table.replace(/'/g, "''");
      const safeCatalog = sourceOptions.default_catalog?.replace(/`/g, '``');
      const infoSchema = safeCatalog ? `\`${safeCatalog}\`.information_schema` : 'information_schema';
      const schemaFilter = sourceOptions.default_schema
        ? `AND table_schema = '${sourceOptions.default_schema.replace(/'/g, "''")}' `
        : '';

      const op: IOperation = await session.executeStatement(
        `SELECT column_name FROM ${infoSchema}.columns WHERE table_name = '${safeTable}' ${schemaFilter} ORDER BY ordinal_position`,
        { runAsync: true, queryTimeout: new Int64(10000) }
      );
      const rows = (await op.fetchAll()) as any[];
      return rows.map((row) => ({
        value: row.column_name || row.COLUMN_NAME,
        label: row.column_name || row.COLUMN_NAME,
      }));
    } finally {
      await session.close();
      await client.close();
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  _getOAuthU2MAccessToken — extracts the current user's access token
  // ──────────────────────────────────────────────────────────────────────────

  private _getOAuthU2MAccessToken(sourceOptions: SourceOptions, userId?: string, isAppPublic?: boolean): string {
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

    return accessToken;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  _executeSqlViaRest — run a SQL statement via the Statements API
  // ──────────────────────────────────────────────────────────────────────────

  private async _executeSqlViaRest(
    host: string,
    accessToken: string,
    warehouseId: string,
    sql: string,
    catalog?: string,
    schema?: string
  ): Promise<any[]> {
    const body: Record<string, any> = { warehouse_id: warehouseId, statement: sql, wait_timeout: '50s' };
    if (catalog) body.catalog = catalog;
    if (schema) body.schema = schema;
    const response = await got(`https://${host}/api/2.0/sql/statements`, {
      method: 'POST',
      json: body,
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    const result = JSON.parse(response.body);
    const state = result.status?.state;
    if (state === 'FAILED') {
      throw new QueryError('SQL execution failed', result.status?.error?.message || 'Unknown error', {});
    }
    if (state === 'RUNNING' || state === 'PENDING') {
      const polled = await this.pollStatementResult(host, result.statement_id, accessToken);
      return Array.isArray(polled.data) ? (polled.data as any[]) : [];
    }
    return this.formatStatementResult(result);
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  _fetchTablesViaRest — list all tables across all schemas (oauth_u2m)
  //  Queries information_schema.tables using the warehouse's default (workspace) catalog.
  // ──────────────────────────────────────────────────────────────────────────

  private async _fetchTablesViaRest(
    host: string,
    accessToken: string,
    httpPath: string,
    search = '',
    page?: number,
    limit?: number
  ): Promise<
    { items: Array<{ value: string; label: string }>; totalCount: number } | Array<{ value: string; label: string }>
  > {
    const warehouseId = this.extractWarehouseId(httpPath);

    const catalogRows = await this._executeSqlViaRest(
      host,
      accessToken,
      warehouseId,
      'SELECT current_catalog() AS catalog'
    );
    const workspaceCatalog = catalogRows[0]?.catalog || catalogRows[0]?.CATALOG || '';

    const infoSchema = workspaceCatalog ? `\`${workspaceCatalog}\`.information_schema` : 'information_schema';
    const tableRows = await this._executeSqlViaRest(
      host,
      accessToken,
      warehouseId,
      `SELECT table_catalog, table_schema, table_name FROM ${infoSchema}.tables` +
        ` WHERE table_type NOT IN ('VIEW', 'MATERIALIZED_VIEW') ORDER BY table_schema, table_name`
    );

    const allTables = tableRows
      .map((row: any) => {
        const catalog = row.table_catalog || row.TABLE_CATALOG;
        const schema = row.table_schema || row.TABLE_SCHEMA;
        const name = row.table_name || row.TABLE_NAME;
        if (!schema || !name) return null;
        const fullName = catalog ? `${catalog}.${schema}.${name}` : `${schema}.${name}`;
        return { value: fullName, label: fullName };
      })
      .filter(Boolean) as Array<{ value: string; label: string }>;

    const filtered = search ? allTables.filter((t) => t.label.toLowerCase().includes(search.toLowerCase())) : allTables;

    if (limit) {
      const offset = ((page || 1) - 1) * limit;
      return { items: filtered.slice(offset, offset + limit), totalCount: filtered.length };
    }

    return filtered;
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  _fetchColumnsViaRest — list columns for a table via SQL (oauth_u2m)
  //  Accepts catalog.schema.table or schema.table
  // ──────────────────────────────────────────────────────────────────────────

  private async _fetchColumnsViaRest(
    host: string,
    accessToken: string,
    httpPath: string,
    table: string
  ): Promise<Array<{ value: string; label: string }>> {
    const parts = table.split('.');
    if (parts.length < 2) return [];

    const warehouseId = this.extractWarehouseId(httpPath);
    let sql: string;

    if (parts.length >= 3) {
      const [catalog, schema, tableName] = parts;
      const safeCatalog = catalog.replace(/`/g, '``');
      const safeSchema = schema.replace(/'/g, "''");
      const safeTable = tableName.replace(/'/g, "''");
      sql =
        `SELECT column_name FROM \`${safeCatalog}\`.information_schema.columns` +
        ` WHERE table_schema = '${safeSchema}' AND table_name = '${safeTable}' ORDER BY ordinal_position`;
    } else {
      const [schema, tableName] = parts;
      const safeSchema = schema.replace(/'/g, "''");
      const safeTable = tableName.replace(/'/g, "''");
      sql =
        `SELECT column_name FROM information_schema.columns` +
        ` WHERE table_schema = '${safeSchema}' AND table_name = '${safeTable}' ORDER BY ordinal_position`;
    }

    const rows = await this._executeSqlViaRest(host, accessToken, warehouseId, sql);
    return rows.map((row: any) => {
      const name = row.column_name || row.COLUMN_NAME;
      return { value: name, label: name };
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  GUI mode — helpers
  // ──────────────────────────────────────────────────────────────────────────

  private isSqlParametersUsed(queryOptions: QueryOptions): boolean {
    const queryParams = queryOptions.query_params || [];
    return queryParams.some(([key]) => key && key.trim() !== '');
  }

  // Substitute :name placeholders for SQL mode named parameters.
  private _substituteNamedParams(query: string, params: Record<string, any>): string {
    return query.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, name) => {
      if (!(name in params)) return `:${name}`;
      const val = params[name];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number' && isFinite(val as number)) return String(val);
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      return `'${String(val).replace(/'/g, "''")}'`;
    });
  }

  // Safely substitute ? placeholders with their values to produce a final SQL string.
  // Databricks does not support client-side positional binding via a standard driver interface,
  // so we inline params with proper escaping here.
  private _substituteParams(query: string, params: unknown[]): string {
    let i = 0;
    return query.replace(/\?/g, () => {
      if (i >= params.length) return 'NULL';
      const val = params[i++];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number' && isFinite(val as number)) return String(val);
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      return `'${String(val).replace(/'/g, "''")}'`;
    });
  }

  private _normalizeBool(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'true';
    return false;
  }

  // Extract rows-affected count from Databricks DML result rows.
  // INSERT/UPDATE/DELETE/MERGE all return a result set with num_affected_rows.
  private _getRowsAffected(rows: any[]): number {
    if (!rows || rows.length === 0) return 0;
    const row = rows[0];
    const numAffected = row['num_affected_rows'] ?? row['NUM_AFFECTED_ROWS'];
    if (numAffected !== undefined && numAffected !== null) return Number(numAffected);
    // MERGE may return per-operation counts instead
    const numInserted = Number(row['num_inserted_rows'] ?? row['NUM_INSERTED_ROWS'] ?? 0);
    const numUpdated = Number(row['num_updated_rows'] ?? row['NUM_UPDATED_ROWS'] ?? 0);
    const numDeleted = Number(row['num_deleted_rows'] ?? row['NUM_DELETED_ROWS'] ?? 0);
    if (numInserted + numUpdated + numDeleted > 0) return numInserted + numUpdated + numDeleted;
    return rows.length;
  }

  private _computeBatchSize(records: Record<string, unknown>[]): number {
    if (!records || records.length === 0) return 1000;
    const sample = records.slice(0, Math.min(records.length, 100));
    const totalParams = sample.reduce((acc, row) => acc + Object.keys(row).length, 0);
    const avgParams = totalParams / sample.length;
    if (avgParams === 0) return 1000;
    return Math.max(1, Math.floor(Databricks.PARAM_THRESHOLD / avgParams));
  }

  private _splitIntoBatches<T>(records: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }
    return batches;
  }

  private _qualifyTableName(table: string, catalog?: string, schema?: string): string {
    if (catalog && schema) return `${catalog}.${schema}.${table}`;
    if (schema) return `${schema}.${table}`;
    return table;
  }

  // Split backtick-quoted dotted identifiers: `a.b.c` → `a`.`b`.`c`
  private _fixDottedIdentifiers(sql: string): string {
    return sql.replace(/`([^`]*\.[^`]*)`/g, (_, inner) =>
      inner
        .split('.')
        .map((p: string) => `\`${p.replace(/`/g, '``')}\``)
        .join('.')
    );
  }

  // Execute a built SQL string (with params substituted) using the appropriate auth path.
  private async _executeGuiSql(
    sourceOptions: SourceOptions,
    sql: string,
    params: unknown[],
    userId?: string,
    isAppPublic?: boolean
  ): Promise<any[]> {
    const finalSql = this._fixDottedIdentifiers(this._substituteParams(sql, params));
    const authType = sourceOptions['authentication_type'] || 'personal_access_token';

    if (authType === 'oauth_u2m') {
      const isMultiAuthEnabled = sourceOptions['multiple_auth_enabled'];
      let accessToken: string;
      if (isMultiAuthEnabled) {
        const currentUserToken = getCurrentToken(isMultiAuthEnabled, sourceOptions['tokenData'], userId, isAppPublic);
        if (!currentUserToken) {
          throw new OAuthUnauthorizedClientError('Authentication required', 'Access token not found.', {});
        }
        accessToken = currentUserToken['access_token'];
      } else {
        accessToken = sourceOptions['access_token'] as string;
      }
      if (!accessToken) {
        throw new OAuthUnauthorizedClientError('Authentication required', 'Databricks access token not found.', {});
      }

      const httpPath: string = sourceOptions.http_path || '';
      if (!httpPath) {
        throw new QueryError(
          'Missing http_path',
          'HTTP path (warehouse path) is required for OAuth U2M queries. Please set it in the datasource configuration.',
          {}
        );
      }

      const warehouseId = this.extractWarehouseId(httpPath);
      const host = sourceOptions.host;

      const response = await got(`https://${host}/api/2.0/sql/statements`, {
        method: 'POST',
        json: { warehouse_id: warehouseId, statement: finalSql, wait_timeout: '50s' },
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });

      const result = JSON.parse(response.body);
      const state = result.status?.state;

      if (state === 'FAILED') {
        throw new QueryError('Query execution failed', result.status?.error?.message || 'Unknown error', {});
      }
      if (state === 'RUNNING' || state === 'PENDING') {
        const polled = await this.pollStatementResult(host, result.statement_id, accessToken);
        return Array.isArray(polled.data) ? (polled.data as any[]) : [];
      }
      return this.formatStatementResult(result);
    }

    // PAT / oauth2 — use DBSQLClient
    const client = await this.getConnection(sourceOptions, userId, isAppPublic);
    const session: IDBSQLSession = await client.openSession();
    try {
      const op: IOperation = await session.executeStatement(finalSql, {
        runAsync: true,
        queryTimeout: new Int64(10000),
      });
      const rows = await op.fetchAll();
      return Array.isArray(rows) ? (rows as any[]) : [];
    } finally {
      await session.close();
      await client.close();
    }
  }

  // Execute a DML query and validate affected row count against user-configured guards.
  private async _executeGuiWriteQuery(
    sourceOptions: SourceOptions,
    sql: string,
    params: unknown[],
    options: { allow_multiple_updates: boolean; zero_records_as_success: boolean; operationLabel: string },
    userId?: string,
    isAppPublic?: boolean
  ): Promise<QueryResult> {
    const rows = await this._executeGuiSql(sourceOptions, sql, params, userId, isAppPublic);
    const rowsAffected = this._getRowsAffected(rows);
    const { allow_multiple_updates, zero_records_as_success, operationLabel } = options;

    if (!allow_multiple_updates && rowsAffected > 1) {
      throw new QueryError(
        'Multiple rows affected',
        `Query ${operationLabel} more than one row. Enable "Allow this Query to modify multiple rows" to permit this.`,
        {}
      );
    }
    if (!zero_records_as_success && rowsAffected === 0) {
      throw new QueryError('No rows affected', `No rows were ${operationLabel}.`, {});
    }

    return { status: 'ok', data: { rowsAffected } };
  }

  private async handleGuiQuery(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    userId?: string,
    isAppPublic?: boolean
  ): Promise<QueryResult> {
    const { operation, table } = queryOptions;
    if (!table) {
      throw new QueryError('Table is required', 'A table name must be specified for GUI mode queries', {});
    }

    const qb = createQueryBuilder('mysql');

    switch (operation) {
      case 'list_rows': {
        const { list_rows, limit, offset } = queryOptions;
        const { where_filters, order_filters, aggregates, group_by } = list_rows || {};
        const { query, params } = qb.listRows(table, {
          where_filters,
          order_filters,
          aggregates,
          group_by,
          limit,
          offset,
        }) as { query: string; params: unknown[] };
        const rows = await this._executeGuiSql(sourceOptions, query, params, userId, isAppPublic);
        return { status: 'ok', data: rows };
      }

      case 'create_row': {
        const { columns } = queryOptions.create_row || {};
        const { query, params } = qb.createRow(table, undefined, columns) as { query: string; params: unknown[] };
        const rows = await this._executeGuiSql(sourceOptions, query, params, userId, isAppPublic);
        return { status: 'ok', data: { rowsCreated: this._getRowsAffected(rows) } };
      }

      case 'update_rows': {
        const { allow_multiple_updates = false, zero_records_as_success = false } = queryOptions;
        const { columns, where_filters } = queryOptions.update_rows || {};
        const hasFilters = Object.values(where_filters || {}).some((f: any) => f?.column?.trim());
        if (!hasFilters) {
          throw new QueryError('Filter required', 'Update rows requires at least one filter condition', {});
        }
        const { query, params } = qb.updateRows(table, { columns, where_filters }) as {
          query: string;
          params: unknown[];
        };
        return this._executeGuiWriteQuery(
          sourceOptions,
          query,
          params,
          {
            allow_multiple_updates: this._normalizeBool(allow_multiple_updates),
            zero_records_as_success: this._normalizeBool(zero_records_as_success),
            operationLabel: 'updated',
          },
          userId,
          isAppPublic
        );
      }

      case 'upsert_rows': {
        const { primary_key_columns, allow_multiple_updates = false, zero_records_as_success = false } = queryOptions;
        const { columns } = queryOptions.upsert_rows || {};
        const { query, params } = qb.upsertRows(table, { primary_key_columns, columns }) as {
          query: string;
          params: unknown[];
        };
        return this._executeGuiWriteQuery(
          sourceOptions,
          query,
          params,
          {
            allow_multiple_updates: this._normalizeBool(allow_multiple_updates),
            zero_records_as_success: this._normalizeBool(zero_records_as_success),
            operationLabel: 'upserted',
          },
          userId,
          isAppPublic
        );
      }

      case 'delete_rows': {
        const { allow_multiple_updates = false, zero_records_as_success = false } = queryOptions;
        const { where_filters } = queryOptions.delete_rows || {};
        const hasFilters = Object.values(where_filters || {}).some((f: any) => f?.column?.trim());
        if (!hasFilters) {
          throw new QueryError(
            'Filter required',
            'Delete rows requires at least one filter condition to prevent accidental mass deletions',
            {}
          );
        }
        const { query, params } = qb.deleteRows(table, { where_filters }) as {
          query: string;
          params: unknown[];
        };
        return this._executeGuiWriteQuery(
          sourceOptions,
          query,
          params,
          {
            allow_multiple_updates: this._normalizeBool(allow_multiple_updates),
            zero_records_as_success: this._normalizeBool(zero_records_as_success),
            operationLabel: 'deleted',
          },
          userId,
          isAppPublic
        );
      }

      case 'bulk_insert': {
        const { records } = queryOptions;
        if (!records || records.length === 0) {
          throw new QueryError('Records required', 'No records provided for bulk insert', {});
        }
        const batchSize = this._computeBatchSize(records);
        const batches = this._splitIntoBatches(records, batchSize);
        let totalRows = 0;
        for (const batch of batches) {
          const { query, params } = qb.bulkInsert(table, { rows_insert: batch }) as {
            query: string;
            params: unknown[];
          };
          const rows = await this._executeGuiSql(sourceOptions, query, params, userId, isAppPublic);
          totalRows += this._getRowsAffected(rows);
        }
        return { status: 'ok', data: { rowsAffected: totalRows } };
      }

      case 'bulk_update_pkey': {
        const { primary_key_columns, records } = queryOptions;
        if (!records || records.length === 0) {
          throw new QueryError('Records required', 'No records provided for bulk update', {});
        }
        const batchSize = this._computeBatchSize(records);
        const batches = this._splitIntoBatches(records, batchSize);
        let totalRows = 0;
        for (const batch of batches) {
          const { queries } = qb.bulkUpdateWithPrimaryKey(table, {
            primary_key: primary_key_columns,
            rows_update: batch,
          }) as { queries: { query: string; params: unknown[] }[] };
          for (const { query, params } of queries) {
            const rows = await this._executeGuiSql(sourceOptions, query, params, userId, isAppPublic);
            totalRows += this._getRowsAffected(rows);
          }
        }
        return { status: 'ok', data: { rowsAffected: totalRows } };
      }

      case 'bulk_upsert_pkey': {
        const { primary_key_columns, records } = queryOptions;
        if (!records || records.length === 0) {
          throw new QueryError('Records required', 'No records provided for bulk upsert', {});
        }
        const batchSize = this._computeBatchSize(records);
        const batches = this._splitIntoBatches(records, batchSize);
        let totalRows = 0;
        for (const batch of batches) {
          const { queries } = qb.bulkUpsertWithPrimaryKey(table, {
            primary_key: primary_key_columns,
            row_upsert: batch,
          }) as { queries: { query: string; params: unknown[] }[] };
          for (const { query, params } of queries) {
            const rows = await this._executeGuiSql(sourceOptions, query, params, userId, isAppPublic);
            totalRows += this._getRowsAffected(rows);
          }
        }
        return { status: 'ok', data: { rowsAffected: totalRows } };
      }

      default:
        throw new QueryError('Unsupported operation', `GUI operation "${operation}" is not supported`, {});
    }
  }
}
