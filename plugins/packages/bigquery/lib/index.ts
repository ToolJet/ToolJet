import {
  QueryError,
  QueryResult,
  QueryService,
  OAuthUnauthorizedClientError,
  App,
  User,
  ConnectionTestResult,
  getCurrentToken,
  cacheConnectionWithConfiguration,
  getCachedConnection,
  generateSourceOptionsHash,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { BigQuery } from '@google-cloud/bigquery';
import got, { Headers } from 'got';
const JSON5 = require('json5');
const _ = require('lodash');
export default class Bigquery implements QueryService {
  private getOptionValue(sourceOptions: any, key: string): any {
    const option = sourceOptions?.[key];
    if (option !== null && typeof option === 'object' && 'value' in option) {
      return option.value;
    }
    return option;
  }

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
      throw new OAuthUnauthorizedClientError(
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
      if (error.response.statusCode === 401 || error.response.statusCode === 403) {
        throw new OAuthUnauthorizedClientError('Query could not be completed', error, {
          ...error,
          ...error,
        });
      }
      throw new QueryError(
        'could not connect to BigQuery',
        JSON.stringify({ statusCode: error.response?.statusCode, message: error.response?.body }),
        {}
      );
    }

    return accessTokenDetails;
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
    dataSourceUpdatedAt?: string,
    userId?: string,
    isAppPublic?: boolean
  ): Promise<any> {
    if (checkCache) {
      const optionsHash = generateSourceOptionsHash(sourceOptions);
      const isMultiAuthEnabled = sourceOptions['multiple_auth_enabled'];
      const cacheKeySuffix = isMultiAuthEnabled && userId ? `${userId}_${optionsHash}` : optionsHash;
      const enhancedCacheKey = `${dataSourceId}_${cacheKeySuffix}`;
      let connection = await getCachedConnection(enhancedCacheKey, dataSourceUpdatedAt);

      if (connection) {
        return connection;
      } else {
        connection = await this.buildConnection(sourceOptions, userId, isAppPublic);
        cacheConnectionWithConfiguration(dataSourceId, enhancedCacheKey, connection);
        return connection;
      }
    } else {
      return await this.buildConnection(sourceOptions, userId, isAppPublic);
    }
  }

  private async buildConnection(sourceOptions: any, userId?: string, isAppPublic?: boolean): Promise<any> {
    const authType = this.getOptionValue(sourceOptions, 'authentication_type');
    if (authType === 'service_account') {
      return this.getServiceAccountConnection(sourceOptions);
    }

    const isMultiAuthEnabled = sourceOptions['multiple_auth_enabled'];
    let accessToken: string;
    let refreshToken: string;

    if (isMultiAuthEnabled) {
      const userToken = getCurrentToken(isMultiAuthEnabled, sourceOptions['tokenData'], userId, isAppPublic);
      if (!userToken) {
        throw new OAuthUnauthorizedClientError(
          'Authentication required',
          'Access token not found for current user. Please authenticate via OAuth first.',
          {}
        );
      }
      accessToken = userToken['access_token'];
      refreshToken = userToken['refresh_token'];
    } else {
      accessToken = this.getOptionValue(sourceOptions, 'access_token');
      refreshToken = sourceOptions['refresh_token'];
    }

    if (!accessToken) {
      throw new OAuthUnauthorizedClientError(
        'Authentication required',
        'BigQuery access token not found. Please authenticate first.',
        {}
      );
    }

    const projectId = this.getOptionValue(sourceOptions, 'project_id');
    const clientId = sourceOptions['client_id'];
    const clientSecret = sourceOptions['client_secret'];
    const location = this.getOptionValue(sourceOptions, 'location');
    //Internally the access token is refreshed and cached by google-auth-library
    return new BigQuery({
      projectId,
      ...(location ? { location } : {}),
      credentials: {
        type: 'authorized_user',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      },
    } as any);
  }

  private getServiceAccountConnection(sourceOptions: any): BigQuery {
    const privateKey = this.getPrivateKey(this.getOptionValue(sourceOptions, 'private_key'));
    const location = this.getOptionValue(sourceOptions, 'location');
    let scopes: string[] = [];
    const scopeValue = this.getOptionValue(sourceOptions, 'scope');
    if (scopeValue) {
      scopes = typeof scopeValue === 'string' ? scopeValue.trim().split(/\s+/).filter(Boolean) : [];
    }

    return new BigQuery({
      projectId: privateKey?.project_id,
      credentials: {
        client_email: privateKey?.client_email,
        private_key: privateKey?.private_key,
      },
      ...(scopes.length > 0 ? { scopes } : {}),
      ...(location ? { location } : {}),
    });
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
    const userId = context?.user?.id;
    const isAppPublic = context?.app?.isPublic;
    const client = await this.getConnection(
      sourceOptions,
      {},
      true,
      dataSourceId,
      dataSourceUpdatedAt,
      userId,
      isAppPublic
    );

    if (queryOptions.mode === 'sql') {
      return this.executeSqlMode(client, sourceOptions, queryOptions);
    }

    return this.executeOperation(client, sourceOptions, queryOptions);
  }

  // SQL query params arrive as strings; coerce back to their original type before sending to BigQuery
  private coerceParam(value: any): any {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value.trim());
    } catch {
      return value;
    }
  }

  private async executeSqlMode(
    client: any,
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<QueryResult> {
    try {
      const queryParams = (queryOptions.query_params || []).filter(([key]: [string, any]) => key?.trim());
      const jobOptions: any = {
        ...this.parseJSON(queryOptions.queryOptions),
        query: queryOptions.query,
      };

      if (queryParams.length > 0) {
        jobOptions.params = Object.fromEntries(
          queryParams.map(([key, value]: [string, any]) => [key, this.coerceParam(value)])
        );
      }

      const [job] = await client.createQueryJob(jobOptions);
      const [rows] = await job.getQueryResults(this.parseJSON(queryOptions.queryResultsOptions));
      return { status: 'ok', data: rows };
    } catch (error) {
      const errorMessage = error.message || 'An unknown error occurred.';
      const statusCode = error.response?.statusCode || error.code || error.data?.statusCode || error.statusCode;
      const isServiceAccount = this.getOptionValue(sourceOptions, 'authentication_type') === 'service_account';

      if (!isServiceAccount && (statusCode === 401 || statusCode === 403)) {
        throw new OAuthUnauthorizedClientError('Query could not be completed', errorMessage, error);
      }

      throw new QueryError('Query could not be completed', errorMessage, {});
    }
  }

  private async executeOperation(
    client: any,
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions
  ): Promise<QueryResult> {
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
          const queryParams = (queryOptions.query_params || []).filter(([key]: [string, any]) => key?.trim());
          const jobOptions: any = {
            ...this.parseJSON(queryOptions.queryOptions),
            query: queryOptions.query,
          };
          if (queryParams.length > 0) {
            jobOptions.params = Object.fromEntries(
              queryParams.map(([key, value]: [string, any]) => [key, this.coerceParam(value)])
            );
          }
          const [job] = await client.createQueryJob(jobOptions);
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

        case 'bulk_insert': {
          const records = Array.isArray(queryOptions.records)
            ? queryOptions.records
            : (this.parseJSON(queryOptions.records) as any[]);
          const insertResult = await client.dataset(queryOptions.datasetId).table(queryOptions.tableId).insert(records);
          result = { ...insertResult[0], inserted: records.length };
          break;
        }

        case 'bulk_update_pkey': {
          const records = Array.isArray(queryOptions.records)
            ? queryOptions.records
            : (this.parseJSON(queryOptions.records) as any[]);
          const pkColumns = this.parsePrimaryKeyColumns(queryOptions.primary_key_columns);
          const query = this.buildMergeQuery(
            queryOptions.datasetId,
            queryOptions.tableId,
            pkColumns,
            records,
            'update'
          );
          const [job] = await client.createQueryJob({ query });
          const [rows] = await job.getQueryResults();
          result = rows;
          break;
        }

        case 'bulk_upsert_pkey': {
          const records = Array.isArray(queryOptions.records)
            ? queryOptions.records
            : (this.parseJSON(queryOptions.records) as any[]);
          const pkColumns = this.parsePrimaryKeyColumns(queryOptions.primary_key_columns);
          const query = this.buildMergeQuery(
            queryOptions.datasetId,
            queryOptions.tableId,
            pkColumns,
            records,
            'upsert'
          );
          const [job] = await client.createQueryJob({ query });
          const [rows] = await job.getQueryResults();
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

      const isServiceAccount = this.getOptionValue(sourceOptions, 'authentication_type') === 'service_account';

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
    const userId = context?.user?.id;
    const isAppPublic = context?.app?.isPublic;

    if (methodName === 'listDatasets') {
      return await this._fetchDatasets(sourceOptions, args?.search, args?.page, args?.limit, userId, isAppPublic);
    }

    if (methodName === 'listTables') {
      const datasetId = args?.values?.datasetId || '';
      return await this._fetchTables(
        sourceOptions,
        datasetId,
        args?.search,
        args?.page,
        args?.limit,
        userId,
        isAppPublic
      );
    }

    if (methodName === 'getTables') {
      const datasetId = args?.values?.datasetId || '';
      const isPaginated = !!args?.limit;

      const result = await this.listTables(
        sourceOptions,
        '',
        '',
        { datasetId, search: args?.search, page: args?.page, limit: args?.limit },
        userId,
        isAppPublic
      );

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
    queryOptions?: { datasetId?: string; search?: string; page?: number; limit?: number },
    userId?: string,
    isAppPublic?: boolean
  ): Promise<QueryResult> {
    try {
      const checkCache = !!dataSourceId;
      const client = await this.getConnection(
        sourceOptions,
        {},
        checkCache,
        dataSourceId,
        dataSourceUpdatedAt,
        userId,
        isAppPublic
      );
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
    const authType = this.getOptionValue(sourceOptions, 'authentication_type');
    if (authType === 'service_account') {
      const client = this.getServiceAccountConnection(sourceOptions);
      if (!client) {
        throw new Error('Invalid credentials');
      }
      await client.getDatasets();
      return { status: 'ok' };
    }

    // OAuth test: verify the token is valid
    const isMultiAuthEnabled = (sourceOptions as any)['multiple_auth_enabled'];
    let accessToken: string;
    if (isMultiAuthEnabled) {
      const tokenData = (sourceOptions as any)['tokenData'];
      const firstToken = Array.isArray(tokenData) ? tokenData[0] : null;
      accessToken = firstToken?.access_token;
    } else {
      accessToken = this.getOptionValue(sourceOptions, 'access_token');
    }
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

  private parsePrimaryKeyColumns(primary_key_columns: any): string[] {
    if (Array.isArray(primary_key_columns)) return primary_key_columns;
    const s = String(primary_key_columns).trim();
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : [s];
    } catch {
      return [s];
    }
  }

  private bqLiteral(value: any): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    return `'${JSON.stringify(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  }

  private buildMergeQuery(
    datasetId: string,
    tableId: string,
    pkColumns: string[],
    records: any[],
    mode: 'update' | 'upsert'
  ): string {
    if (!records.length) throw new Error('No records provided');

    const allColumns = Object.keys(records[0]);
    const nonPkColumns = allColumns.filter((col) => !pkColumns.includes(col));

    const structRows = records.map((record) => {
      const fields = allColumns.map((col) => `${this.bqLiteral(record[col])} AS \`${col}\``);
      return `STRUCT(${fields.join(', ')})`;
    });

    if (mode === 'update' && nonPkColumns.length === 0) {
      throw new Error('No non-primary-key columns to update.');
    }

    const joinCondition = pkColumns.map((pk) => `T.\`${pk}\` = S.\`${pk}\``).join(' AND ');

    let query = `MERGE \`${datasetId}.${tableId}\` AS T
USING UNNEST([${structRows.join(', ')}]) AS S
ON ${joinCondition}`;

    if (nonPkColumns.length > 0) {
      const updateSet = nonPkColumns.map((col) => `T.\`${col}\` = S.\`${col}\``).join(', ');
      query += `\nWHEN MATCHED THEN UPDATE SET ${updateSet}`;
    }

    if (mode === 'upsert') {
      const insertCols = allColumns.map((col) => `\`${col}\``).join(', ');
      const insertVals = allColumns.map((col) => `S.\`${col}\``).join(', ');
      query += `\nWHEN NOT MATCHED THEN INSERT (${insertCols}) VALUES (${insertVals})`;
    }

    return query;
  }

  private async _fetchDatasets(
    sourceOptions: SourceOptions,
    search = '',
    page?: number,
    limit?: number,
    userId?: string,
    isAppPublic?: boolean
  ): Promise<
    Array<{ value: string; label: string }> | { items: Array<{ value: string; label: string }>; totalCount: number }
  > {
    try {
      const client = await this.getConnection(sourceOptions, {}, false, undefined, undefined, userId, isAppPublic);
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
    limit?: number,
    userId?: string,
    isAppPublic?: boolean
  ): Promise<
    Array<{ value: string; label: string }> | { items: Array<{ value: string; label: string }>; totalCount: number }
  > {
    try {
      const client = await this.getConnection(sourceOptions, {}, false, undefined, undefined, userId, isAppPublic);
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

  private parseJSON(json?: string | object): object {
    if (!json) return {};
    if (typeof json === 'object') return json;
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
