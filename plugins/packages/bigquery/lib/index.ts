import {
  QueryError,
  QueryResult,
  QueryService,
  OAuthUnauthorizedClientError,
  App,
  User,
  ConnectionTestResult,
  validateAndSetRequestOptionsBasedOnAuthType,
  getCurrentToken,
  cacheConnectionWithConfiguration,
  getCachedConnection,
  generateSourceOptionsHash,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { BigQuery } from '@google-cloud/bigquery';
import got, { Headers, OptionsOfTextResponseBody } from 'got';
import { google } from 'googleapis';
const JSON5 = require('json5');
const _ = require('lodash');

export default class Bigquery implements QueryService {
  /* ────────────────────────────────────────────
   *  OAuth helpers
   * ──────────────────────────────────────────── */

  authUrl(source_options: SourceOptions): string {
    const getSourceOptionValue = (key: string) => {
      const option = Array.isArray(source_options)
        ? source_options.find((item) => item.key === key)
        : source_options[key];

      if (Array.isArray(source_options)) {
        return option?.value || '';
      } else {
        return option?.value || option || '';
      }
    };

    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const oauth_type = getSourceOptionValue('oauth_type');

    const clientId = oauth_type === 'tooljet_app' ? process.env.GOOGLE_CLIENT_ID : getSourceOptionValue('client_id');

    if (!clientId) {
      throw Error('You need to define Google OAuth environment variables');
    }

    // BigQuery scopes based on access_type
    const accessType = getSourceOptionValue('access_type');
    const dataScopes =
      accessType === 'write'
        ? 'https://www.googleapis.com/auth/bigquery'
        : 'https://www.googleapis.com/auth/bigquery.readonly';

    const allScopes = new Set(
      `${dataScopes} https://www.googleapis.com/auth/cloud-platform.read-only`.trim().split(/\s+/)
    );
    const scope = Array.from(allScopes).join(' ');

    return (
      'https://accounts.google.com/o/oauth2/v2/auth' +
      `?response_type=code&client_id=${clientId}` +
      `&redirect_uri=${fullUrl}oauth2/authorize` +
      `&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`
    );
  }

  async accessDetailsFrom(authCode: string, source_options: any, resetSecureData = false): Promise<object> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
      ];
    }

    const getSourceOptionValue = (key: string) => {
      const option = Array.isArray(source_options)
        ? source_options.find((item) => item.key === key)
        : source_options[key];

      if (Array.isArray(source_options)) {
        return option?.value || '';
      } else {
        return option?.value || option || '';
      }
    };

    let clientId = '';
    let clientSecret = '';
    const oauth_type = getSourceOptionValue('oauth_type');

    if (oauth_type === 'tooljet_app') {
      clientId = process.env.GOOGLE_CLIENT_ID;
      clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    } else {
      clientId = getSourceOptionValue('client_id');
      clientSecret = getSourceOptionValue('client_secret');
    }

    if (!clientId || !clientSecret) {
      throw new Error(`Missing OAuth credentials. ClientId: ${!!clientId}, ClientSecret: ${!!clientSecret}`);
    }

    const accessTokenUrl = 'https://oauth2.googleapis.com/token';
    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;

    const data = {
      code: authCode,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      prompt: 'consent',
      access_type: 'offline',
    };

    const authDetails = [];

    try {
      const response = await got(accessTokenUrl, {
        method: 'post',
        json: data,
        headers: { 'Content-Type': 'application/json' },
      });

      const result = JSON.parse(response.body);

      if (response.statusCode !== 200) {
        throw Error('could not connect to BigQuery');
      }

      if (result['access_token']) {
        authDetails.push(['access_token', result['access_token']]);
      }

      if (result['refresh_token']) {
        authDetails.push(['refresh_token', result['refresh_token']]);
      }
    } catch (error) {
      console.log('OAuth error response:', error.response?.body);
      throw Error('could not connect to BigQuery');
    }

    return authDetails;
  }

  authHeader(token: string): Headers {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async refreshToken(sourceOptions: any, dataSourceId: string, userId: string, isAppPublic: boolean) {
    let refreshToken: string;

    const currentUserToken = sourceOptions['refresh_token']
      ? sourceOptions
      : getCurrentToken(sourceOptions['multiple_auth_enabled'], sourceOptions['tokenData'], userId, isAppPublic);

    if (currentUserToken && currentUserToken['refresh_token']) {
      refreshToken = currentUserToken['refresh_token'];
    } else {
      throw new QueryError(
        'could not connect to BigQuery',
        'Refresh token not found. Please re-authenticate to continue.',
        {}
      );
    }

    const accessTokenUrl = 'https://oauth2.googleapis.com/token';
    let clientId = '';
    let clientSecret = '';
    const oauth_type = sourceOptions['oauth_type'];

    if (oauth_type === 'tooljet_app') {
      clientId = process.env.GOOGLE_CLIENT_ID;
      clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    } else {
      clientId = sourceOptions['client_id'];
      clientSecret = sourceOptions['client_secret'];
    }

    const data = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };

    const accessTokenDetails: Record<string, string> = {};

    try {
      const response = await got(accessTokenUrl, {
        method: 'post',
        json: data,
        headers: { 'Content-Type': 'application/json' },
      });
      const result = JSON.parse(response.body);

      if (!(response.statusCode >= 200 && response.statusCode < 300)) {
        throw new QueryError(
          'could not connect to BigQuery',
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
            responseObject: {
              statusCode: response.statusCode,
              responseBody: response.body,
            },
            responseHeaders: response.headers,
          }
        );
      }
    } catch (error) {
      console.error(
        `Error while BigQuery refresh token call. Status code : ${error.response?.statusCode}, Message : ${error.response?.body}`
      );
      throw new QueryError(
        'could not connect to BigQuery',
        JSON.stringify({ statusCode: error.response?.statusCode, message: error.response?.body }),
        {}
      );
    }

    return accessTokenDetails;
  }

  /* ────────────────────────────────────────────
   *  Multi-auth / source-option helpers
   * ──────────────────────────────────────────── */

  private constructSourceOptions(sourceOptions: any) {
    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';

    const accessType = sourceOptions?.access_type;
    const dataScopes =
      accessType === 'write'
        ? 'https://www.googleapis.com/auth/bigquery'
        : 'https://www.googleapis.com/auth/bigquery.readonly';

    const alwaysScopes = ['https://www.googleapis.com/auth/cloud-platform.read-only'];
    const allScopesSet = new Set(`${dataScopes} ${alwaysScopes.join(' ')}`.trim().split(/\s+/));
    const finalScopes = Array.from(allScopesSet).join(' ');

    const addSourceOptions = {
      url: 'https://bigquery.googleapis.com/bigquery/v2',
      auth_url: authUrl,
      add_token_to: 'header',
      header_prefix: 'Bearer ',
      access_token_url: 'https://oauth2.googleapis.com/token',
      audience: '',
      username: '',
      password: '',
      bearer_token: '',
      client_auth: 'header',
      headers: [
        ['', ''],
        ['tj-x-forwarded-for', '::1'],
      ],
      custom_query_params: [
        ['access_type', 'offline'],
        ['prompt', 'consent'],
      ],
      custom_auth_params: [['', '']],
      access_token_custom_headers: [['', '']],
      ssl_certificate: 'none',
      retry_network_errors: true,
      scopes: finalScopes,
    };

    return { ...sourceOptions, ...addSourceOptions };
  }

  private convertQueryOptions(queryOptions: any = {}, customHeaders?: Record<string, string>): any {
    const { operation = 'get', params = {} } = queryOptions;

    const result: any = {
      method: (operation || 'get').toLowerCase(),
      headers: customHeaders || {},
    };

    if (params.query && Object.keys(params.query).length > 0) {
      const urlParams = new URLSearchParams();
      Object.entries(params.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => urlParams.append(key, String(v)));
          } else {
            urlParams.append(key, String(value));
          }
        }
      });
      result.searchParams = urlParams;
    }

    if (!['get', 'delete'].includes(result.method) && params.request) {
      result.json = params.request;
    }

    return result;
  }

  /**
   * Resolves an access token from OAuth or service account, depending on
   * the authentication_type in sourceOptions.
   */
  private async resolveAccessToken(
    sourceOptions: any,
    context?: { user?: User; app?: App }
  ): Promise<{ accessToken: string; needsOAuth?: any }> {
    // Backward compatibility: treat missing authentication_type as service_account
    // when a private_key is present (matches original plugin behaviour).
    const authType = sourceOptions['authentication_type'];
    if (authType === 'service_account' || (!authType && sourceOptions['private_key'])) {
      const token = await this.getServiceAccountToken(sourceOptions);
      return { accessToken: token };
    }

    const oauth_type = sourceOptions?.oauth_type?.value || sourceOptions?.oauth_type;
    if (oauth_type === 'tooljet_app') {
      sourceOptions['client_id'] = process.env.GOOGLE_CLIENT_ID;
      sourceOptions['client_secret'] = process.env.GOOGLE_CLIENT_SECRET;
    }

    let accessToken = sourceOptions['access_token'];

    if (sourceOptions['multiple_auth_enabled']) {
      const customHeaders = { 'tj-x-forwarded-for': '::1' };
      const newSourceOptions = this.constructSourceOptions(sourceOptions);
      const authValidatedRequestOptions = this.convertQueryOptions({}, customHeaders);

      const _requestOptions = await validateAndSetRequestOptionsBasedOnAuthType(
        newSourceOptions,
        context,
        authValidatedRequestOptions as any,
        { kind: 'bigquery' }
      );

      if (_requestOptions.status === 'needs_oauth') {
        return { accessToken: '', needsOAuth: _requestOptions };
      }

      const requestOptions = _requestOptions.data as OptionsOfTextResponseBody;
      const authHeader = requestOptions.headers['Authorization'];

      if (Array.isArray(authHeader)) {
        accessToken = authHeader[0].replace('Bearer ', '');
      } else if (typeof authHeader === 'string') {
        accessToken = authHeader.replace('Bearer ', '');
      }
    }

    return { accessToken };
  }

  /* ────────────────────────────────────────────
   *  BigQuery client helpers
   * ──────────────────────────────────────────── */

  /**
   * Returns a BigQuery client.
   * For service accounts this uses the JSON key directly.
   * For OAuth it creates a client authenticated with the bearer token.
   */
  async getConnection(
    sourceOptions: any,
    _options?: object,
    checkCache?: boolean,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string
  ): Promise<any> {
    if (checkCache) {
      const optionsHash = generateSourceOptionsHash(sourceOptions);
      const enhancedCacheKey = `${dataSourceId}_${optionsHash}`;
      let connection = await getCachedConnection(enhancedCacheKey, dataSourceUpdatedAt);

      if (connection) {
        return connection;
      } else {
        connection = await this.buildConnection(sourceOptions);
        cacheConnectionWithConfiguration(dataSourceId, enhancedCacheKey, connection);
        return connection;
      }
    } else {
      return await this.buildConnection(sourceOptions);
    }
  }

  private async buildConnection(sourceOptions: any): Promise<any> {
    // Backward compatibility: if authentication_type is not set, fall back to
    // service_account when a private_key is present (original behaviour).
    const authType = sourceOptions['authentication_type'];
    if (authType === 'service_account' || (!authType && sourceOptions['private_key'])) {
      return this.getServiceAccountConnection(sourceOptions);
    }

    // OAuth path – we need an access token that was already resolved
    // The caller should pass the token through sourceOptions['access_token']
    const accessToken = sourceOptions['access_token'];
    if (!accessToken) {
      throw new QueryError(
        'Authentication required',
        'BigQuery access token not found. Please authenticate first.',
        {}
      );
    }

    // Create an OAuth2 client and set credentials
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    return new BigQuery({ authClient: oauth2Client as any });
  }

  private getServiceAccountConnection(sourceOptions: any): BigQuery {
    const privateKey = this.getPrivateKey(sourceOptions?.private_key);
    let scopes: string[] = [];
    if (sourceOptions?.scope) {
      scopes = typeof sourceOptions?.scope === 'string' ? sourceOptions.scope.trim().split(/\s+/).filter(Boolean) : [];
    }

    return new BigQuery({
      projectId: privateKey?.project_id,
      credentials: {
        client_email: privateKey?.client_email,
        private_key: privateKey?.private_key,
      },
      ...(scopes.length > 0 ? { scopes } : {}),
    });
  }

  private async getServiceAccountToken(sourceOptions: any): Promise<string> {
    const privateKey = this.getPrivateKey(sourceOptions?.private_key);

    const scopes = ['https://www.googleapis.com/auth/bigquery', 'https://www.googleapis.com/auth/cloud-platform'];

    const jwtClient = new google.auth.JWT({
      email: privateKey?.client_email,
      key: privateKey?.private_key,
      scopes,
    });

    const tokenResponse = await jwtClient.authorize();

    if (!tokenResponse || !tokenResponse.access_token) {
      throw new QueryError(
        'Connection could not be established',
        'Failed to obtain access token for service account',
        {}
      );
    }

    return tokenResponse.access_token;
  }

  /* ────────────────────────────────────────────
   *  run()
   * ──────────────────────────────────────────── */

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt?: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult> {
    // Resolve the access token (handles both OAuth and service account)
    const { accessToken, needsOAuth } = await this.resolveAccessToken(sourceOptions, context);
    if (needsOAuth) {
      return needsOAuth;
    }

    // Inject the resolved token so getConnection can use it for OAuth path
    const enrichedSourceOptions = { ...sourceOptions, access_token: accessToken };
    const client = await this.getConnection(enrichedSourceOptions, {}, true, dataSourceId, dataSourceUpdatedAt);

    const operation = queryOptions.operation;
    let result = {};

    try {
      switch (operation) {
        case 'list_datasets': {
          const [datasets] = await client.getDatasets();
          result = this.sanitizeResponse(datasets, ['metadata.datasetReference']);
          break;
        }

        case 'get_dataset_info': {
          const [metadata] = await client.dataset(queryOptions.datasetId).getMetadata();
          result = this.sanitizeResponse(metadata, [
            'datasetReference',
            'location',
            'description',
            'creationTime',
            'lastModifiedTime',
            'labels',
          ]);
          break;
        }

        case 'list_tables': {
          const [tables] = await client.dataset(queryOptions.datasetId).getTables();
          result = this.sanitizeResponse(tables, ['metadata.tableReference']);
          break;
        }

        case 'create_table': {
          const [table] = await client
            .dataset(queryOptions.datasetId)
            .createTable(queryOptions.tableId, this.parseJSON(queryOptions.options));
          result = { tableId: table.id };
          break;
        }

        case 'delete_table': {
          await client.dataset(queryOptions.datasetId).table(queryOptions.tableId).delete();
          result = `Table ${queryOptions.tableId} deleted.`;
          break;
        }

        case 'create_view': {
          const query = `CREATE VIEW ${queryOptions.datasetId}.${queryOptions.view_name} AS
          SELECT ${queryOptions.viewcolumns}
          FROM ${queryOptions.datasetId}.${queryOptions.tableId}
          ${queryOptions.condition ? `WHERE ${queryOptions.condition}` : 'WHERE TRUE'}`;

          const [job] = await client.createQueryJob({
            ...this.parseJSON(queryOptions.queryOptions),
            query,
          });
          const [rows] = await job.getQueryResults(this.parseJSON(queryOptions.queryResultsOptions));
          result = rows;
          break;
        }

        case 'query': {
          const [job] = await client.createQueryJob({
            ...this.parseJSON(queryOptions.queryOptions),
            query: queryOptions.query,
          });
          const [rows] = await job.getQueryResults(this.parseJSON(queryOptions.queryResultsOptions));
          result = rows;
          break;
        }

        case 'delete_record': {
          const query = `DELETE FROM ${queryOptions.datasetId}.${queryOptions.tableId} ${
            queryOptions.condition ? `WHERE ${queryOptions.condition}` : 'WHERE TRUE'
          }`;
          const [job] = await client.createQueryJob({
            ...this.parseJSON(queryOptions.queryOptions),
            query,
          });
          const [rows] = await job.getQueryResults(this.parseJSON(queryOptions.queryResultsOptions));
          result = rows;
          break;
        }

        case 'insert_record': {
          const rows = await client
            .dataset(queryOptions.datasetId)
            .table(queryOptions.tableId)
            .insert(this.parseJSON(queryOptions.rows));
          result = { ...rows[0], records: (this.parseJSON(queryOptions.rows) as []).length };
          break;
        }

        case 'update_record': {
          const columString = await this.columnBuilder(queryOptions);
          const query = `UPDATE ${queryOptions.datasetId}.${queryOptions.tableId} SET ${columString} ${
            queryOptions.condition ? `WHERE ${queryOptions.condition}` : 'WHERE TRUE'
          }`;

          const [job] = await client.createQueryJob({
            ...this.parseJSON(queryOptions.queryOptions),
            query,
          });
          const [rows] = await job.getQueryResults(this.parseJSON(queryOptions.queryResultsOptions));
          result = rows;
          break;
        }
      }
    } catch (error) {
      console.error({ statusCode: error?.response?.statusCode, message: error?.response?.body || error.message });

      const errorMessage = error.message || 'An unknown error occurred.';
      const errorDetails: any = {};

      if (error && error instanceof Error) {
        const bigqueryError = error as any;
        errorDetails.error = bigqueryError;

        const reason = bigqueryError.response?.status?.errorResult?.reason || 'unknownError';
        errorDetails.reason = reason;
        errorDetails.message = errorMessage;
        errorDetails.jobId = bigqueryError.response?.jobReference?.jobId;
        errorDetails.location = bigqueryError.response?.jobReference?.location;
        errorDetails.query = bigqueryError.response?.configuration?.query?.query;
      }

      // Handle OAuth 401/403 errors
      const statusCode = error.response?.statusCode || error.code || error.data?.statusCode || error.statusCode;

      const isServiceAccount =
        sourceOptions['authentication_type'] === 'service_account' ||
        (!sourceOptions['authentication_type'] && sourceOptions['private_key']);

      if (!isServiceAccount && (statusCode === 401 || statusCode === 403)) {
        throw new OAuthUnauthorizedClientError('Query could not be completed', errorMessage, {
          ...error,
          ...errorDetails,
        });
      }

      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  /* ────────────────────────────────────────────
   *  invokeMethod()
   * ──────────────────────────────────────────── */

  async invokeMethod(
    methodName: string,
    context: { user?: User; app?: App },
    sourceOptions: any,
    args?: any
  ): Promise<any> {
    // Resolve access token for both auth types
    const { accessToken, needsOAuth } = await this.resolveAccessToken(sourceOptions, context);
    if (needsOAuth) {
      throw new QueryError(
        'Could not connect to BigQuery',
        JSON.stringify({
          statusCode: 401,
          message: 'OAuth authentication required',
          data: 'OAuth authentication required',
        }),
        {}
      );
    }

    const enrichedSourceOptions = { ...sourceOptions, access_token: accessToken };

    if (methodName === 'listDatasets') {
      return await this._fetchDatasets(enrichedSourceOptions, args?.search, args?.page, args?.limit);
    }

    if (methodName === 'listTables') {
      const datasetId = args?.values?.datasetId || '';
      return await this._fetchTables(enrichedSourceOptions, datasetId, args?.search, args?.page, args?.limit);
    }

    if (methodName === 'getTables') {
      const datasetId = args?.values?.datasetId || '';
      const isPaginated = !!args?.limit;

      const result = await this.listTables(enrichedSourceOptions, '', '', {
        datasetId,
        search: args?.search,
        page: args?.page,
        limit: args?.limit,
      });

      const payload = (result as any)?.data ?? [];

      if (isPaginated) {
        const rows = (payload as any)?.rows ?? [];
        const totalCount = (payload as any)?.totalCount ?? 0;
        const formattedTables = rows.map((row: any) => ({
          label: String(row.table_name),
          value: String(row.table_name),
          dataset_id: String(row.dataset_id),
        }));
        return { items: formattedTables, totalCount };
      }

      const rows = Array.isArray(payload) ? payload : [];
      const formattedTables = rows.map((row: any) => ({
        label: String(row.table_name),
        value: String(row.table_name),
        dataset_id: String(row.dataset_id),
      }));

      return { status: 'ok', data: formattedTables };
    }

    throw new QueryError('Method not found', `Method ${methodName} is not supported`, {});
  }

  /* ────────────────────────────────────────────
   *  listTables (used internally and by invokeMethod)
   * ──────────────────────────────────────────── */

  async listTables(
    sourceOptions: SourceOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    queryOptions?: { datasetId?: string; search?: string; page?: number; limit?: number }
  ): Promise<QueryResult> {
    try {
      const checkCache = !!dataSourceId;
      const client = await this.getConnection(sourceOptions, {}, checkCache, dataSourceId, dataSourceUpdatedAt);
      const search = queryOptions?.search || '';
      const page = queryOptions?.page || 1;
      const limit = queryOptions?.limit;
      const datasetId = queryOptions?.datasetId || '';

      let datasetIds: string[] = [];
      if (datasetId) {
        datasetIds = [datasetId];
      } else {
        const [datasets] = await client.getDatasets();
        datasetIds = datasets.map((d: any) => d.id);
      }

      const allTablesRaw = await Promise.all(
        datasetIds.map(async (dsId: string) => {
          const [tables] = await client.dataset(dsId).getTables();
          return tables.map((t: any) => ({
            table_name: t.id,
            dataset_id: dsId,
          }));
        })
      );

      let allTables = allTablesRaw.flat();

      if (search) {
        const searchLower = search.toLowerCase();
        allTables = allTables.filter((t) => t.table_name.toLowerCase().includes(searchLower));
      }

      const totalCount = allTables.length;

      if (limit) {
        const offset = (page - 1) * limit;
        const paged = allTables.slice(offset, offset + limit);
        return { status: 'ok', data: { rows: paged, totalCount } };
      }

      return { status: 'ok', data: allTables };
    } catch (error) {
      const errorMessage = error.message || 'An unknown error occurred';
      throw new QueryError('Could not fetch tables', errorMessage, {});
    }
  }

  /* ────────────────────────────────────────────
   *  Test connection
   * ──────────────────────────────────────────── */

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const authType = sourceOptions['authentication_type'];
    if (authType === 'service_account' || (!authType && sourceOptions['private_key'])) {
      const client = this.getServiceAccountConnection(sourceOptions);
      if (!client) {
        throw new Error('Invalid credentials');
      }
      await client.getDatasets();
      return { status: 'ok' };
    }

    // OAuth test: verify the token is valid
    const accessToken = sourceOptions['access_token'];
    if (!accessToken) {
      throw new QueryError(
        'Connection could not be established',
        'Access token not found. Please authenticate via OAuth first.',
        {}
      );
    }

    const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
    if (response.ok) {
      return { status: 'ok' };
    } else {
      return { status: 'failed' };
    }
  }

  /* ────────────────────────────────────────────
   *  Private helpers
   * ──────────────────────────────────────────── */

  async columnBuilder(queryOptions: any): Promise<string> {
    const columString = [];
    const columns = queryOptions.columns;
    for (const [key, value] of Object.entries(columns)) {
      const primaryKeyValue = typeof value === 'string' ? `'${value}'` : value;
      columString.push(`${key}=${primaryKeyValue}`);
    }
    return columString.join(',');
  }

  private async _fetchDatasets(
    sourceOptions: SourceOptions,
    search = '',
    page?: number,
    limit?: number
  ): Promise<
    Array<{ value: string; label: string }> | { items: Array<{ value: string; label: string }>; totalCount: number }
  > {
    try {
      const client = await this.getConnection(sourceOptions);
      const [datasets] = await client.getDatasets();

      const searchLower = search.toLowerCase();
      const filtered = search ? datasets.filter((d: any) => d.id.toLowerCase().includes(searchLower)) : datasets;
      const totalCount = filtered.length;

      if (limit) {
        const offset = ((page || 1) - 1) * limit;
        const paged = filtered.slice(offset, offset + limit);
        return { items: paged.map((d: any) => ({ value: d.id, label: d.id })), totalCount };
      }

      return filtered.map((d: any) => ({ value: d.id, label: d.id }));
    } catch (error) {
      const errorMessage = error.message || 'An unknown error occurred';
      throw new QueryError('Could not fetch datasets', errorMessage, {});
    }
  }

  private async _fetchTables(
    sourceOptions: SourceOptions,
    datasetId: string,
    search = '',
    page?: number,
    limit?: number
  ): Promise<
    Array<{ value: string; label: string }> | { items: Array<{ value: string; label: string }>; totalCount: number }
  > {
    try {
      const client = await this.getConnection(sourceOptions);
      const [tables] = await client.dataset(datasetId).getTables();

      const searchLower = search.toLowerCase();
      const filtered = search ? tables.filter((t: any) => t.id.toLowerCase().includes(searchLower)) : tables;
      const totalCount = filtered.length;

      if (limit) {
        const offset = ((page || 1) - 1) * limit;
        const paged = filtered.slice(offset, offset + limit);
        return {
          items: paged.map((t: any) => ({ value: t.id, label: t.id, table_name: t.id, dataset_id: datasetId })),
          totalCount,
        };
      }

      return filtered.map((t: any) => ({ value: t.id, label: t.id, table_name: t.id, dataset_id: datasetId }));
    } catch (error) {
      const errorMessage = error.message || 'An unknown error occurred';
      throw new QueryError('Could not fetch tables', errorMessage, {});
    }
  }

  private parseJSON(json?: string): object {
    if (!json) return {};
    return JSON5.parse(json);
  }

  private getPrivateKey(configs?: string): {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  } {
    return this.parseJSON(configs);
  }

  private sanitizeResponse(response: object | [], pickFields: string[]): object | [] {
    if (!response) return response;

    if (Array.isArray(response)) {
      return response.map((item) => this.sanitizeResponse(item, pickFields));
    }

    const pickedKeyValue = pickFields.map((field) => _.result(response, field));

    if (pickedKeyValue.length === 1) {
      return pickedKeyValue[0];
    }

    return pickedKeyValue;
  }
}
