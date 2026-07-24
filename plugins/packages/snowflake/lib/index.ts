import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
  cacheConnectionWithConfiguration,
  generateSourceOptionsHash,
  getCachedConnection,
  getAuthUrl,
  sanitizeParams,
  User,
  App,
  validateAndSetRequestOptionsBasedOnAuthType,
  getCurrentToken,
  createQueryBuilder,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import * as snowflake from 'snowflake-sdk';
import * as crypto from 'crypto';
import got from 'got';

export default class Snowflake implements QueryService {
  async connExecuteAsync(connection: snowflake.Connection, options: any) {
    return new Promise((resolve, reject) => {
      connection.execute({
        ...options,
        complete: function (err, stmt, rows) {
          if (err) {
            reject(err);
          } else {
            resolve({ stmt, rows });
          }
        },
      });
    });
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    context?: { user?: User; app?: App }
  ): Promise<QueryResult> {
    const sqlText = queryOptions.query;
    const grantType = sourceOptions.grant_type;
    const authType = sourceOptions.auth_type;
    const multipleAuthEnabled = sourceOptions.multiple_auth_enabled;

    if (authType === 'oauth2' && grantType === 'authorization_code' && multipleAuthEnabled === true) {
      const authValidatedRequestOptions = await validateAndSetRequestOptionsBasedOnAuthType(
        sourceOptions,
        context,
        {},
        { kind: 'snowflake' }
      );
      if (authValidatedRequestOptions.status === 'needs_oauth') return authValidatedRequestOptions;
    }

    if (sourceOptions.allow_dynamic_connection_parameters) {
      if (queryOptions.database) sourceOptions.database = queryOptions.database;
      if (queryOptions.warehouse) sourceOptions.warehouse = queryOptions.warehouse;
      if (queryOptions.role) sourceOptions.role = queryOptions.role;
    }

    const checkCache = !sourceOptions.allow_dynamic_connection_parameters;

    const connection: snowflake.Connection = await this.getConnection(
      sourceOptions,
      {},
      checkCache,
      dataSourceId,
      dataSourceUpdatedAt,
      context
    );

    try {
      if (queryOptions.mode === 'gui') {
        return await this.handleGuiQuery(connection, queryOptions);
      }

      const result: any = await this.connExecuteAsync(connection, { sqlText });
      return { status: 'ok', data: result.rows };
    } catch (err) {
      if (err instanceof QueryError) throw err;
      const errorMessage = err.message || 'An unknown error occurred';
      const errorDetails: any = {};
      if (err) {
        errorDetails.code = err.code ?? null;
        errorDetails.sqlState = err.sqlState ?? null;
        errorDetails.data = err.data ?? null;
      }
      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    }
  }

  async invokeMethod(methodName: string, context: unknown, sourceOptions: SourceOptions, args?: any): Promise<any> {
    const { datasourceId, datasourceUpdatedAt, dataSourceOptionsEnvironmentId } =
      (context as any)?.dataSourceDetails ?? {};
    const dataSourceId =
      datasourceId && dataSourceOptionsEnvironmentId
        ? `${datasourceId}-${dataSourceOptionsEnvironmentId}`
        : datasourceId;

    if (sourceOptions.allow_dynamic_connection_parameters) {
      if (args?.database != null && args?.database !== '') sourceOptions.database = args.database;
      if (args?.warehouse != null && args?.warehouse !== '') sourceOptions.warehouse = args.warehouse;
      if (args?.role != null && args?.role !== '') sourceOptions.role = args.role;
    }

    if (methodName === 'listTables') {
      return await this._fetchTables(
        sourceOptions,
        context,
        args?.search,
        args?.page,
        args?.limit,
        dataSourceId,
        datasourceUpdatedAt
      );
    }
    if (methodName === 'listColumns') {
      const table = args?.values?.table || '';
      return await this._fetchColumns(sourceOptions, context, table, dataSourceId, datasourceUpdatedAt);
    }
    throw new QueryError('Method not found', `Method '${methodName}' is not supported by the Snowflake plugin`, {});
  }

  async listTables(
    sourceOptions: SourceOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    queryOptions?: { search?: string; page?: number; limit?: number }
  ): Promise<QueryResult> {
    try {
      const connection: any = await this.getConnection(sourceOptions, {}, true, dataSourceId, dataSourceUpdatedAt);
      const search = queryOptions?.search || '';
      const searchPattern = `%${search.toUpperCase()}%`;
      const schemaName = sourceOptions.schema ? sourceOptions.schema.toUpperCase() : null;
      const schemaCondition = schemaName ? ` AND TABLE_SCHEMA = ?` : '';

      const baseSqlText = `SELECT TABLE_NAME, TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND UPPER(TABLE_NAME) LIKE ?${schemaCondition}`;
      const baseBinds: unknown[] = [searchPattern];
      if (schemaName) baseBinds.push(schemaName);

      if (queryOptions?.limit) {
        const page = queryOptions.page || 1;
        const limit = queryOptions.limit;
        const offset = (page - 1) * limit;
        const countSqlText = `SELECT COUNT(*) AS TOTAL FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND UPPER(TABLE_NAME) LIKE ?${schemaCondition}`;

        const [tableResult, countResult]: any[] = await Promise.all([
          this.connExecuteAsync(connection, {
            sqlText: `${baseSqlText} ORDER BY TABLE_NAME LIMIT ? OFFSET ?`,
            binds: [...baseBinds, limit, offset],
          }),
          this.connExecuteAsync(connection, { sqlText: countSqlText, binds: [...baseBinds] }),
        ]);

        const totalCount = parseInt(countResult.rows[0]?.TOTAL ?? '0', 10);
        const rows = tableResult.rows.map((row: any) => ({
          table_name: row.TABLE_NAME,
          table_schema: row.TABLE_SCHEMA,
        }));
        return { status: 'ok', data: { rows, totalCount } };
      }

      const result: any = await this.connExecuteAsync(connection, {
        sqlText: `${baseSqlText} ORDER BY TABLE_NAME`,
        binds: baseBinds,
      });
      const tables = result.rows.map((row: any) => ({ table_name: row.TABLE_NAME, table_schema: row.TABLE_SCHEMA }));
      return { status: 'ok', data: tables };
    } catch (err) {
      throw new QueryError('Could not fetch tables', err.message || 'An unknown error occurred', {});
    }
  }

  private async _fetchTables(
    sourceOptions: SourceOptions,
    context: unknown,
    search = '',
    page?: number,
    limit?: number,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string
  ): Promise<
    Array<{ value: string; label: string }> | { items: Array<{ value: string; label: string }>; totalCount: number }
  > {
    try {
      const checkCache = !sourceOptions.allow_dynamic_connection_parameters;
      const connection: any = await this.getConnection(
        sourceOptions,
        {},
        checkCache,
        dataSourceId,
        dataSourceUpdatedAt,
        context
      );
      const searchPattern = `%${search.toUpperCase()}%`;
      const schemaName = sourceOptions.schema ? sourceOptions.schema.toUpperCase() : null;
      const schemaCondition = schemaName ? ` AND TABLE_SCHEMA = ?` : '';

      const baseSqlText = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND UPPER(TABLE_NAME) LIKE ?${schemaCondition}`;
      const baseBinds: unknown[] = [searchPattern];
      if (schemaName) baseBinds.push(schemaName);

      if (limit) {
        const offset = ((page || 1) - 1) * limit;
        const countSqlText = `SELECT COUNT(*) AS TOTAL FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND UPPER(TABLE_NAME) LIKE ?${schemaCondition}`;
        const [tableResult, countResult]: any[] = await Promise.all([
          this.connExecuteAsync(connection, {
            sqlText: `${baseSqlText} ORDER BY TABLE_NAME LIMIT ? OFFSET ?`,
            binds: [...baseBinds, limit, offset],
          }),
          this.connExecuteAsync(connection, { sqlText: countSqlText, binds: [...baseBinds] }),
        ]);
        const totalCount = parseInt(countResult.rows[0]?.TOTAL ?? '0', 10);
        return {
          items: tableResult.rows.map((row: any) => ({ value: row.TABLE_NAME, label: row.TABLE_NAME })),
          totalCount,
        };
      }

      const result: any = await this.connExecuteAsync(connection, {
        sqlText: `${baseSqlText} ORDER BY TABLE_NAME`,
        binds: baseBinds,
      });
      return result.rows.map((row: any) => ({ value: row.TABLE_NAME, label: row.TABLE_NAME }));
    } catch (err) {
      throw new QueryError('Could not fetch tables', err.message || 'An unknown error occurred', {});
    }
  }

  private async _fetchColumns(
    sourceOptions: SourceOptions,
    context: unknown,
    table: string,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string
  ): Promise<Array<{ value: string; label: string }>> {
    try {
      const checkCache = !sourceOptions.allow_dynamic_connection_parameters;
      const connection: any = await this.getConnection(
        sourceOptions,
        {},
        checkCache,
        dataSourceId,
        dataSourceUpdatedAt,
        context
      );
      const schemaName = sourceOptions.schema ? sourceOptions.schema.toUpperCase() : null;
      const schemaCondition = schemaName ? ` AND TABLE_SCHEMA = ?` : '';
      const sqlText = `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ?${schemaCondition} ORDER BY ORDINAL_POSITION`;
      const binds: unknown[] = [table.toUpperCase()];
      if (schemaName) binds.push(schemaName);
      const result: any = await this.connExecuteAsync(connection, { sqlText, binds });
      return result.rows.map((row: any) => ({ value: row.COLUMN_NAME, label: row.COLUMN_NAME }));
    } catch (err) {
      throw new QueryError('Could not fetch columns', err.message || 'An unknown error occurred', {});
    }
  }

  private async handleGuiQuery(connection: snowflake.Connection, queryOptions: QueryOptions): Promise<QueryResult> {
    const { operation, table } = queryOptions;
    const queryBuilder = createQueryBuilder('snowflake');

    switch (operation) {
      case 'list_rows': {
        const { list_rows, limit, offset } = queryOptions as any;
        const { where_filters, order_filters, aggregates, group_by } = list_rows || {};
        const { query, params } = queryBuilder.listRows(table, {
          where_filters,
          order_filters,
          aggregates,
          group_by,
          limit,
          offset,
        }) as { query: string; params: unknown[] };
        const result: any = await this.connExecuteAsync(connection, { sqlText: query, binds: params });
        return { status: 'ok', data: result.rows };
      }

      case 'create_row': {
        const { columns } = (queryOptions as any).create_row || {};
        const { query, params } = queryBuilder.createRow(table, null, columns) as {
          query: string;
          params: unknown[];
        };
        const rowsAffected = await this.executeBulkQueriesInTransaction(connection, [{ query, params }]);
        return { status: 'ok', data: { rowsCreated: rowsAffected } };
      }

      case 'update_rows': {
        const { allow_multiple_updates = false, zero_records_as_success = false } = queryOptions;
        const allowMultipleUpdates = this._normalizeBool(allow_multiple_updates);
        const zeroRecordsAsSuccess = this._normalizeBool(zero_records_as_success);
        const { columns, where_filters } = (queryOptions as any).update_rows || {};
        const hasWhereFilters = where_filters && Object.keys(where_filters).length > 0;
        if (!hasWhereFilters)
          throw new QueryError('Filter required', 'Update rows requires at least one filter condition', {});
        const { query, params } = queryBuilder.updateRows(table, { columns, where_filters }) as {
          query: string;
          params: unknown[];
        };
        return await this.executeWriteQuery(connection, query, params, {
          allow_multiple_updates: allowMultipleUpdates,
          zero_records_as_success: zeroRecordsAsSuccess,
          operationLabel: 'updated',
        });
      }

      case 'upsert_rows': {
        const { allow_multiple_updates = false, zero_records_as_success = false } = queryOptions;
        const allowMultipleUpdates = this._normalizeBool(allow_multiple_updates);
        const zeroRecordsAsSuccess = this._normalizeBool(zero_records_as_success);
        const { primary_key_columns } = queryOptions;
        const { columns } = (queryOptions as any).upsert_rows || {};
        const { query, params } = queryBuilder.upsertRows(table, { primary_key_columns, columns }) as {
          query: string;
          params: unknown[];
        };
        return await this.executeWriteQuery(connection, query, params, {
          allow_multiple_updates: allowMultipleUpdates,
          zero_records_as_success: zeroRecordsAsSuccess,
          operationLabel: 'upserted',
        });
      }

      case 'delete_rows': {
        const { allow_multiple_updates = false, zero_records_as_success = false } = queryOptions;
        const allowMultipleUpdates = this._normalizeBool(allow_multiple_updates);
        const zeroRecordsAsSuccess = this._normalizeBool(zero_records_as_success);
        const { where_filters } = (queryOptions as any).delete_rows || {};
        const hasWhereFilters = where_filters && Object.keys(where_filters).length > 0;
        if (!hasWhereFilters) {
          throw new QueryError(
            'Filter required',
            'Delete rows requires at least one filter condition to prevent accidental mass deletions',
            {}
          );
        }
        const { query, params } = queryBuilder.deleteRows(table, { where_filters }) as {
          query: string;
          params: unknown[];
        };
        return await this.executeWriteQuery(connection, query, params, {
          allow_multiple_updates: allowMultipleUpdates,
          zero_records_as_success: zeroRecordsAsSuccess,
          operationLabel: 'deleted',
        });
      }

      case 'bulk_insert': {
        const { records } = queryOptions;
        const batchSize = this.computeBatchSize(records);
        const recordBatches = this.splitIntoBatches(records, batchSize);
        const batchInsertQueries = recordBatches.map((batchRecords) => {
          const { query, params } = queryBuilder.bulkInsert(table, { rows_insert: batchRecords }) as {
            query: string;
            params: unknown[];
          };
          return { query, params };
        });
        const rowsAffected = await this.executeBulkQueriesInTransaction(connection, batchInsertQueries);
        return { status: 'ok', data: { rowsAffected }, sqlCommand: 'BATCH INSERT' } as unknown as QueryResult;
      }

      case 'bulk_update_pkey': {
        const { primary_key_columns, records } = queryOptions;
        const batchSize = this.computeBatchSize(records);
        const recordBatches = this.splitIntoBatches(records, batchSize);
        const allUpdateQueries: { query: string; params: unknown[] }[] = [];
        for (const batchRecords of recordBatches) {
          const { queries } = queryBuilder.bulkUpdateWithPrimaryKey(table, {
            primary_key: primary_key_columns,
            rows_update: batchRecords,
          }) as { queries: { query: string; params: unknown[] }[] };
          allUpdateQueries.push(...queries);
        }
        const rowsAffected = await this.executeBulkQueriesInTransaction(connection, allUpdateQueries);
        return { status: 'ok', data: { rowsAffected }, sqlCommand: 'BULK_UPDATE_BY_KEY' } as unknown as QueryResult;
      }

      case 'bulk_upsert_pkey': {
        const { primary_key_columns, records } = queryOptions;
        const batchSize = this.computeBatchSize(records);
        const recordBatches = this.splitIntoBatches(records, batchSize);
        const allUpsertQueries: { query: string; params: unknown[] }[] = [];
        for (const batchRecords of recordBatches) {
          const { queries } = queryBuilder.bulkUpsertWithPrimaryKey(table, {
            primary_key: primary_key_columns,
            row_upsert: batchRecords,
          }) as { queries: { query: string; params: unknown[] }[] };
          allUpsertQueries.push(...queries);
        }
        const rowsAffected = await this.executeBulkQueriesInTransaction(connection, allUpsertQueries);
        return { status: 'ok', data: { rowsAffected }, sqlCommand: 'BULK_UPDATE_BY_KEY' } as unknown as QueryResult;
      }

      default:
        throw new QueryError('Unsupported operation', `GUI operation "${operation}" is not supported`, {});
    }
  }

  private _getRowsAffected(result: { stmt: any; rows: any[] }): number {
    if (typeof result.stmt?.getNumRowsAffected === 'function') {
      return result.stmt.getNumRowsAffected();
    }
    // Fallback: Snowflake DML result rows contain the affected counts
    const resultRow = result.rows?.[0] ?? {};
    return (
      Number(resultRow['number of rows inserted'] ?? 0) +
      Number(resultRow['number of rows updated'] ?? 0) +
      Number(resultRow['number of rows deleted'] ?? 0)
    );
  }

  private _normalizeBool(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'true';
    return false;
  }

  private async executeWriteQuery(
    connection: snowflake.Connection,
    sqlText: string,
    binds: unknown[],
    options: { allow_multiple_updates?: boolean; zero_records_as_success?: boolean; operationLabel: string }
  ): Promise<QueryResult> {
    const { allow_multiple_updates, zero_records_as_success, operationLabel } = options;

    await this.connExecuteAsync(connection, { sqlText: 'BEGIN' });
    try {
      const result: any = await this.connExecuteAsync(connection, { sqlText, binds });
      const rowsAffected = this._getRowsAffected(result);

      if (!allow_multiple_updates && rowsAffected > 1) {
        throw new QueryError(
          'Multiple rows affected',
          'Query matches more than one row. Enable "Allow this Query to modify multiple rows" to permit this.',
          {}
        );
      }
      if (!zero_records_as_success && rowsAffected === 0) {
        throw new QueryError('No rows affected', `No rows were ${operationLabel}.`, {});
      }

      await this.connExecuteAsync(connection, { sqlText: 'COMMIT' });
      return { status: 'ok', data: { rowsAffected } };
    } catch (err) {
      await this.connExecuteAsync(connection, { sqlText: 'ROLLBACK' });
      throw err;
    }
  }

  private static readonly PARAM_THRESHOLD = 16384;

  private computeBatchSize(records: Record<string, unknown>[]): number {
    if (!records || records.length === 0) return 1000;
    const SAMPLE_SIZE = 500;
    const sample =
      records.length <= SAMPLE_SIZE * 2 ? records : [...records.slice(0, SAMPLE_SIZE), ...records.slice(-SAMPLE_SIZE)];
    const numberOfColumns = Math.max(...sample.map((record) => Object.keys(record).length));
    if (numberOfColumns === 0) return 1000;
    return Math.max(1, Math.floor(Snowflake.PARAM_THRESHOLD / numberOfColumns));
  }

  private splitIntoBatches<RecordType>(records: RecordType[], batchSize: number): RecordType[][] {
    const batches: RecordType[][] = [];
    for (let startIndex = 0; startIndex < records.length; startIndex += batchSize) {
      batches.push(records.slice(startIndex, startIndex + batchSize));
    }
    return batches;
  }

  private async executeBulkQueriesInTransaction(
    connection: snowflake.Connection,
    queries: { query: string; params: unknown[] }[]
  ): Promise<number> {
    await this.connExecuteAsync(connection, { sqlText: 'BEGIN' });
    try {
      let totalRowsAffected = 0;
      for (const { query, params } of queries) {
        const result: any = await this.connExecuteAsync(connection, { sqlText: query, binds: params });
        totalRowsAffected += this._getRowsAffected(result);
      }
      await this.connExecuteAsync(connection, { sqlText: 'COMMIT' });
      return totalRowsAffected;
    } catch (err) {
      await this.connExecuteAsync(connection, { sqlText: 'ROLLBACK' });
      throw err;
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      const connection = await this.getConnection(sourceOptions, {}, false, undefined, undefined, undefined, {
        connectionTimeout: 20000,
      });
      const isConnectionValid = await connection.isValidAsync();

      if (isConnectionValid) return { status: 'ok' };

      throw new QueryError('Connection test failed', 'Connection is invalid', {});
    } catch (err) {
      if (err instanceof QueryError) throw err;
      const errorMessage = err.message || 'Connection test failed';
      const errorDetails: any = {};
      if (err) {
        errorDetails.code = err.code ?? null;
        errorDetails.sqlState = err.sqlState ?? null;
        errorDetails.data = err.data ?? null;
      }
      throw new QueryError('Connection test failed', errorMessage, errorDetails);
    }
  }

  async connAsync(connection: snowflake.Connection) {
    return new Promise((resolve, reject) => {
      connection.connect(function (err, conn) {
        if (err) reject(err);
        resolve(conn);
      });
    });
  }

  async buildConnection(sourceOptions: SourceOptions, context?, options?: { connectionTimeout?: number }) {
    const connectionConfig: any = {
      account: sourceOptions.account,
      warehouse: sourceOptions.warehouse,
      database: sourceOptions.database,
      schema: sourceOptions.schema,
      role: sourceOptions.role,
      clientSessionKeepAlive: true,
      clientSessionKeepAliveHeartbeatFrequency: 900,
      ...(options?.connectionTimeout != null && { timeout: options.connectionTimeout }),
    };

    if (sourceOptions.auth_type === 'oauth2') {
      let accessToken = sourceOptions.access_token;
      if (sourceOptions.multiple_auth_enabled && sourceOptions.tokenData) {
        if (Array.isArray(sourceOptions.tokenData) && sourceOptions.tokenData.length > 0) {
          const userTokenData = sourceOptions.tokenData.find((token) => token.user_id === context.user.id);
          if (!userTokenData) throw new Error('No token data for the particular UserId');
          accessToken = userTokenData.access_token;
        } else if (sourceOptions.tokenData.access_token) {
          accessToken = sourceOptions.tokenData.access_token;
        }
      }
      if (accessToken) {
        connectionConfig.accessToken = accessToken;
        connectionConfig.token = accessToken;
        connectionConfig.authenticator = 'OAUTH';
      } else {
        throw new QueryError('OAuth access token not found', 'Access token is required for OAuth authentication', {});
      }
    } else if (sourceOptions.auth_type === 'bearer_token') {
      if (!sourceOptions.bearer_token) {
        throw new QueryError('Bearer token not found', 'Bearer token is required for bearer token authentication', {});
      }
      connectionConfig.token = sourceOptions.bearer_token;
      connectionConfig.authenticator = 'PROGRAMMATIC_ACCESS_TOKEN';
    } else if (sourceOptions.auth_type === 'key_pair') {
      if (!sourceOptions.username) {
        throw new QueryError('Username not found', 'Username is required for key pair authentication', {});
      }
      if (!sourceOptions.private_key) {
        throw new QueryError('Private key not found', 'Private key is required for key pair authentication', {});
      }
      connectionConfig.username = sourceOptions.username;
      connectionConfig.authenticator = 'SNOWFLAKE_JWT';
      try {
        const privateKeyObject = crypto.createPrivateKey({
          key: sourceOptions.private_key,
          format: 'pem',
          ...(sourceOptions.private_key_passphrase && { passphrase: sourceOptions.private_key_passphrase }),
        });
        connectionConfig.privateKey = privateKeyObject.export({ type: 'pkcs8', format: 'pem' }) as string;
      } catch (err) {
        throw new QueryError('Invalid private key', err.message, {});
      }
    } else if (sourceOptions.auth_type === 'basic') {
      connectionConfig.password = sourceOptions.password;
      connectionConfig.username = sourceOptions.username;
    }

    const connection = snowflake.createConnection(connectionConfig);
    return await this.connAsync(connection);
  }

  authUrl(sourceOptions: SourceOptions): string {
    const modifiedOptions = { ...sourceOptions };

    Object.keys(sourceOptions).forEach((key) => {
      if (sourceOptions[key] && typeof sourceOptions[key] === 'object' && 'value' in sourceOptions[key]) {
        modifiedOptions[key] = sourceOptions[key].value;
      } else {
        modifiedOptions[key] = sourceOptions[key];
      }
    });

    if (modifiedOptions['oauth_type'] === 'tooljet_app') {
      modifiedOptions['client_id'] = process.env.SNOWFLAKE_CLIENT_ID;
    }
    return getAuthUrl(modifiedOptions);
  }

  async accessDetailsFrom(authCode: string, source_options, resetSecureData = false): Promise<object> {
    if (resetSecureData) {
      return [
        ['access_token', ''],
        ['refresh_token', ''],
      ];
    }

    const getOptionValue = (key: string) => {
      if (Array.isArray(source_options)) {
        return source_options.find((item) => item.key === key)?.value;
      } else return source_options[key];
    };

    const oauth_type = getOptionValue('oauth_type');
    let client_id = '';
    let client_secret = '';

    if (oauth_type === 'tooljet_app') {
      client_id = process.env.SNOWFLAKE_CLIENT_ID;
      client_secret = process.env.SNOWFLAKE_CLIENT_SECRET;
    } else {
      client_id = getOptionValue('client_id');
      client_secret = getOptionValue('client_secret');
    }

    const access_token_url = getOptionValue('access_token_url');
    const client_auth = getOptionValue('client_auth');
    const custom_auth_params = sanitizeParams(getOptionValue('custom_auth_params'));

    // Append offline_access to scope so Snowflake returns a refresh token during initial auth code exchange
    const userScope: string = getOptionValue('scope') || '';
    const scopeParts = userScope.split(' ').filter(Boolean);
    if (!scopeParts.includes('offline_access')) scopeParts.push('offline_access');
    const scope = scopeParts.join(' ');

    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;

    const tokenRequestBody = {
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: redirectUri,
      scope,
      ...custom_auth_params,
    };

    const headers: any = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (client_auth === 'header') {
      const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    } else {
      tokenRequestBody['client_id'] = client_id;
      tokenRequestBody['client_secret'] = client_secret;
    }

    try {
      const response = await got(access_token_url, {
        method: 'post',
        headers,
        form: tokenRequestBody,
      });

      const tokenData = JSON.parse(response.body);
      const authDetails = [];
      if (tokenData.access_token) {
        authDetails.push(['access_token', tokenData.access_token]);
      }
      if (tokenData.refresh_token) {
        authDetails.push(['refresh_token', tokenData.refresh_token]);
      }
      if (tokenData.expires_in) {
        authDetails.push(['expires_in', tokenData.expires_in.toString()]);
      }
      if (tokenData.token_type) {
        authDetails.push(['token_type', tokenData.token_type]);
      }
      return authDetails;
    } catch (error) {
      throw new QueryError('Authorization Error', error.message, {});
    }
  }

  async refreshToken(sourceOptions: SourceOptions, _error: any, userId: string, isAppPublic: boolean): Promise<object> {
    let refreshToken: string;

    if (sourceOptions?.multiple_auth_enabled) {
      const currentToken = getCurrentToken(
        sourceOptions.multiple_auth_enabled,
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

    const oauth_type = sourceOptions['oauth_type'];
    let client_id = sourceOptions['client_id'];
    let client_secret = sourceOptions['client_secret'];

    if (oauth_type === 'tooljet_app') {
      client_id = process.env.SNOWFLAKE_CLIENT_ID;
      client_secret = process.env.SNOWFLAKE_CLIENT_SECRET;
    }

    if (!client_id || !client_secret) {
      throw new QueryError(
        'OAuth credentials missing',
        'client_id and client_secret are required for token refresh',
        {}
      );
    }

    const access_token_url = sourceOptions['access_token_url'];
    if (!access_token_url) {
      throw new QueryError('Access token URL missing', 'access_token_url is required for token refresh', {});
    }

    const client_auth = sourceOptions['client_auth'];
    const custom_auth_params = sanitizeParams(sourceOptions['custom_auth_params']);

    // Append offline_access if not already present to ensure Snowflake returns a new refresh token (token rotation)
    const userScope: string = sourceOptions['scope'] || '';
    const scopeParts = userScope.split(' ').filter(Boolean);
    if (!scopeParts.includes('offline_access')) {
      scopeParts.push('offline_access');
    }
    const scope = scopeParts.join(' ');

    const host = process.env.TOOLJET_HOST;
    const subpath = process.env.SUB_PATH;
    const fullUrl = `${host}${subpath ? subpath : '/'}`;
    const redirectUri = `${fullUrl}oauth2/authorize`;

    const tokenRequestBody: any = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      redirect_uri: redirectUri,
      scope,
      ...custom_auth_params,
    };

    // Snowflake OAuth token refresh requires application/x-www-form-urlencoded
    const headers: any = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (client_auth === 'header') {
      const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    } else {
      tokenRequestBody['client_id'] = client_id;
      tokenRequestBody['client_secret'] = client_secret;
    }

    try {
      const response = await got(access_token_url, {
        method: 'post',
        headers,
        form: tokenRequestBody,
      });

      const tokenData = JSON.parse(response.body);
      const accessTokenDetails: any = {};

      if (tokenData.access_token) accessTokenDetails['access_token'] = tokenData.access_token;
      if (tokenData.refresh_token) accessTokenDetails['refresh_token'] = tokenData.refresh_token;
      if (tokenData.expires_in) accessTokenDetails['expires_in'] = tokenData.expires_in.toString();
      if (tokenData.token_type) accessTokenDetails['token_type'] = tokenData.token_type;

      return accessTokenDetails;
    } catch (err) {
      throw new QueryError('Token Refresh Error', err.message, {});
    }
  }

  async getConnection(
    sourceOptions: any,
    options: any,
    checkCache: boolean,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string,
    context?,
    buildOptions?: { connectionTimeout?: number }
  ): Promise<any> {
    if (checkCache) {
      const optionsHash = generateSourceOptionsHash(sourceOptions);
      const userId = context?.user?.id;
      let enhancedCacheKey = '';
      if (sourceOptions.multiple_auth_enabled) {
        enhancedCacheKey = `${dataSourceId}_${userId}_${optionsHash}`;
      } else {
        enhancedCacheKey = `${dataSourceId}_${optionsHash}`;
      }

      let connection = await getCachedConnection(enhancedCacheKey, dataSourceUpdatedAt);

      if (connection && (await connection.isValidAsync())) {
        return connection;
      } else {
        connection = await this.buildConnection(sourceOptions, context, buildOptions);
        cacheConnectionWithConfiguration(dataSourceId, enhancedCacheKey, connection);
        return connection;
      }
    } else {
      return await this.buildConnection(sourceOptions, context, buildOptions);
    }
  }
}
