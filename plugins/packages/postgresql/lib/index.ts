import {
  ConnectionTestResult,
  cacheConnectionWithConfiguration,
  generateSourceOptionsHash,
  getCachedConnection,
  QueryService,
  QueryResult,
  QueryError,
  getTooljetEdition,
  createQueryBuilder,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import knex, { Knex } from 'knex';
import { isEmpty } from '@tooljet-plugins/common';
import { Client } from 'ssh2';
import { URL } from 'url';
import net from 'net';

async function createLocalSSHTunnel(
  sourceOptions: SourceOptions,
  targetHost: string,
  targetPort: number
): Promise<{
  sshClient: Client;
  server: net.Server;
  localPort: number;
}> {
  return new Promise((resolve, reject) => {
    const ssh = new Client();
    ssh.on('ready', () => {
      const server = net.createServer((localSocket) => {
        ssh.forwardOut(
          localSocket.remoteAddress || '127.0.0.1',
          localSocket.remotePort || 0,
          targetHost,
          targetPort,
          (err, remoteStream) => {
            if (err) {
              localSocket.destroy();
              return;
            }

            localSocket.pipe(remoteStream).pipe(localSocket);

            remoteStream.on('error', () => {
              localSocket.destroy();
            });

            localSocket.on('error', () => {
              remoteStream.destroy();
            });
          }
        );
      });

      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as net.AddressInfo;
        resolve({
          sshClient: ssh,
          server,
          localPort: addr.port,
        });
      });
    });

    ssh.on('error', (e) => {
      reject(e);
    });

    const sshConfig: any = {
      host: sourceOptions.ssh_host,
      port: Number(sourceOptions.ssh_port) || 22,
      username: sourceOptions.ssh_username,
      readyTimeout: 20000, // recommended
    };

    if (sourceOptions.ssh_auth_type === 'private_key') {
      if (!sourceOptions.ssh_private_key || sourceOptions.ssh_private_key.trim() === '') {
        return reject(new Error('SSH private key is required for private_key auth type'));
      }
      sshConfig.privateKey = Buffer.from(sourceOptions.ssh_private_key);
      if (sourceOptions.ssh_passphrase && sourceOptions.ssh_passphrase.trim() !== '') {
        sshConfig.passphrase = sourceOptions.ssh_passphrase;
      }
    } else if (sourceOptions.ssh_auth_type === 'password') {
      if (!sourceOptions.ssh_password || sourceOptions.ssh_password.trim() === '') {
        return reject(new Error('SSH password is required for password auth type'));
      }
      sshConfig.password = sourceOptions.ssh_password;
    } else {
      return reject(new Error(`Unsupported SSH auth type: ${sourceOptions.ssh_auth_type}`));
    }
    ssh.connect(sshConfig);
  });
}

export default class PostgresqlQueryService implements QueryService {
  private static _instance: PostgresqlQueryService;
  private STATEMENT_TIMEOUT;
  private tooljet_edition: string;

  constructor() {
    this.tooljet_edition = getTooljetEdition();
    // Default 120 secs
    this.STATEMENT_TIMEOUT =
      process.env?.PLUGINS_SQL_DB_STATEMENT_TIMEOUT && !isNaN(Number(process.env?.PLUGINS_SQL_DB_STATEMENT_TIMEOUT))
        ? Number(process.env.PLUGINS_SQL_DB_STATEMENT_TIMEOUT)
        : 120000;

    if (PostgresqlQueryService._instance) {
      return PostgresqlQueryService._instance;
    }
    PostgresqlQueryService._instance = this;
    return PostgresqlQueryService._instance;
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    let pgPool, pgConnection, checkCache, knexInstance;

    if (sourceOptions['allow_dynamic_connection_parameters']) {
      if (sourceOptions.connection_type === 'manual') {
        sourceOptions['host'] = queryOptions['host'] ? queryOptions['host'] : sourceOptions['host'];
        sourceOptions['database'] = queryOptions['database'] ? queryOptions['database'] : sourceOptions['database'];
      } else if (sourceOptions.connection_type === 'string') {
        const modifiedConnectionString = new URL(sourceOptions.connection_string);
        if (queryOptions['host']) modifiedConnectionString.hostname = queryOptions['host'];
        if (queryOptions['database']) modifiedConnectionString.pathname = `/${queryOptions['database']}`;
        sourceOptions['connection_string'] = modifiedConnectionString.toString();
      }
    }

    try {
      // If dynamic connection parameters is toggled on - We don't cache the connection also destroy the connection created.
      checkCache = sourceOptions['allow_dynamic_connection_parameters'] ? false : true;
      knexInstance = await this.getConnection(sourceOptions, {}, checkCache, dataSourceId, dataSourceUpdatedAt);

      switch (queryOptions.mode) {
        case 'sql': {
          if (this.isSqlParametersUsed(queryOptions)) {
            return await this.handleRawQuery(knexInstance, queryOptions);
          } else {
            pgPool = knexInstance.client.pool;
            pgConnection = await pgPool.acquire().promise;
            const query = queryOptions.query;
            let result = { rows: [] };

            result = await pgConnection.query(query);
            return {
              status: 'ok',
              data: result.rows,
            };
          }
        }
        case 'gui': {
          return await this.handleGuiQuery(knexInstance, queryOptions);
        }
        default:
          throw new Error("Invalid query mode. Must be either 'sql' or 'gui'.");
      }
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred';
      const errorDetails: any = {};
      if (err && err instanceof Error) {
        const postgresError = err as any;
        const { code, detail, hint, routine } = postgresError;
        errorDetails.code = code || null;
        errorDetails.detail = detail || null;
        errorDetails.hint = hint || null;
        errorDetails.routine = routine || null;
      }
      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    } finally {
      if (pgPool && pgConnection) pgPool.release(pgConnection);
      if (!checkCache && knexInstance) {
        const tunnel = (knexInstance as any).__sshTunnel;
        await knexInstance.destroy();
        if (tunnel) {
          tunnel.server.close();
          tunnel.sshClient.end();
        }
      }
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    let knexInstance: Knex | undefined;
    try {
      knexInstance = await this.getConnection(sourceOptions, {}, false);

      await knexInstance.raw('SELECT version();').timeout(this.STATEMENT_TIMEOUT);

      return { status: 'ok' };
    } catch (err: any) {
      let message = 'Connection test failed';
      let details: any = {};
      //  PostgreSQL driver errors
      if (err?.code || err?.detail || err?.hint) {
        message = err.message;
        details = {
          code: err.code ?? null,
          detail: err.detail ?? null,
          hint: err.hint ?? null,
          routine: err.routine ?? null,
        };
      }
      //  Invalid connection string
      else if (err instanceof TypeError && err.message?.includes('Invalid URL')) {
        message = 'Invalid PostgreSQL connection string';
      }

      //  SSH errors
      else if (err?.message?.includes('SSH')) {
        message = `SSH connection failed : ${err.message}`;
      }

      //  Knex timeout
      else if (err?.name === 'KnexTimeoutError') {
        message = 'Database connection timeout. Please check host/port/firewall';
      }

      //  fallback
      else if (err?.message) {
        message = err.message;
      }

      throw new QueryError('Connection test failed', message, details);
    } finally {
      //  Always cleanup SSH tunnel + knex
      if (knexInstance) {
        const tunnel = (knexInstance as any).__sshTunnel;
        await knexInstance.destroy();
        if (tunnel) {
          tunnel.server.close();
          tunnel.sshClient.end();
        }
      }
    }
  }

  async invokeMethod(methodName: string, _context: unknown, sourceOptions: SourceOptions, args?: any): Promise<any> {
    if (methodName === 'listSchemas') {
      return await this._fetchSchemas(sourceOptions);
    }
    if (methodName === 'listTables') {
      const schema = args?.values?.schema || 'public';
      return await this._fetchTables(sourceOptions, schema);
    }
    if (methodName === 'listColumns') {
      const schema = args?.values?.schema || 'public';
      const table = args?.values?.table || '';
      return await this._fetchColumns(sourceOptions, schema, table);
    }

    if (methodName === 'getTables') {
      const dataSourceId = args?.dataSourceId || '';
      const dataSourceUpdatedAt = args?.dataSourceUpdatedAt || '';
      const result = await this.listTables(sourceOptions, dataSourceId, dataSourceUpdatedAt);

      // safely unwrap possible structures
      const tables = (result as any)?.data?.data ?? (result as any)?.data ?? [];

      const formattedTables = tables.map((row: any) => ({
        label: String(row.table_name),
        value: String(row.table_name),
      }));

      return {
        status: 'ok',
        data: formattedTables,
      };
    }
    throw new QueryError('Method not found', `Method '${methodName}' is not supported by the PostgreSQL plugin`, {});
  }

  async listSchemas(
    sourceOptions: SourceOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    const data = await this._fetchSchemas(sourceOptions, dataSourceId, dataSourceUpdatedAt);
    return { status: 'ok', data };
  }

  async listTables(
    sourceOptions: SourceOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    schema = 'public'
  ): Promise<QueryResult> {
    const data = await this._fetchTables(sourceOptions, schema, dataSourceId, dataSourceUpdatedAt);
    return { status: 'ok', data };
  }

  async listColumns(
    sourceOptions: SourceOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    schema = 'public',
    table: string
  ): Promise<QueryResult> {
    const data = await this._fetchColumns(sourceOptions, schema, table, dataSourceId, dataSourceUpdatedAt);
    return { status: 'ok', data };
  }

  private async _fetchSchemas(
    sourceOptions: SourceOptions,
    dataSourceId = '',
    dataSourceUpdatedAt = ''
  ): Promise<Array<{ value: string; label: string }>> {
    try {
      const knexInstance = await this.getConnection(
        sourceOptions,
        {},
        !!dataSourceId,
        dataSourceId,
        dataSourceUpdatedAt
      );
      const { rows } = await knexInstance.raw(`
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
          AND schema_name NOT LIKE 'pg_temp_%'
          AND schema_name NOT LIKE 'pg_toast_temp_%'
        ORDER BY schema_name;
      `);
      return rows.map((r: any) => ({ value: r.schema_name, label: r.schema_name }));
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred';
      throw new QueryError('Could not fetch schemas', errorMessage, {});
    }
  }

  private async _fetchTables(
    sourceOptions: SourceOptions,
    schema = 'public',
    dataSourceId = '',
    dataSourceUpdatedAt = ''
  ): Promise<Array<{ value: string; label: string }>> {
    try {
      const knexInstance = await this.getConnection(
        sourceOptions,
        {},
        !!dataSourceId,
        dataSourceId,
        dataSourceUpdatedAt
      );
      const { rows } = await knexInstance.raw(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = ?
           AND table_type = 'BASE TABLE'
         ORDER BY table_name;`,
        [schema]
      );
      return rows.map((r: any) => ({ value: r.table_name, label: r.table_name }));
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred';
      throw new QueryError('Could not fetch tables', errorMessage, {});
    }
  }

  private async _fetchColumns(
    sourceOptions: SourceOptions,
    schema = 'public',
    table: string,
    dataSourceId = '',
    dataSourceUpdatedAt = ''
  ): Promise<Array<{ value: string; label: string }>> {
    try {
      const knexInstance = await this.getConnection(
        sourceOptions,
        {},
        !!dataSourceId,
        dataSourceId,
        dataSourceUpdatedAt
      );
      const { rows } = await knexInstance.raw(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema = ?
           AND table_name = ?
         ORDER BY ordinal_position;`,
        [schema, table]
      );
      return rows.map((r: any) => ({ value: r.column_name, label: r.column_name }));
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred';
      throw new QueryError('Could not fetch columns', errorMessage, {});
    }
  }

  private async handleGuiQuery(knexInstance: Knex, queryOptions: QueryOptions): Promise<QueryResult> {
    const { operation, table, schema } = queryOptions;
    const queryBuilder = createQueryBuilder('postgresql');

    switch (operation) {
      case 'list_rows': {
        const { list_rows, limit, offset } = queryOptions;
        const { where_filters, order_filters, aggregates, group_by } = list_rows || {};
        const { query, params } = queryBuilder.listRows(table, {
          schema,
          where_filters,
          order_filters,
          aggregates,
          group_by,
          limit,
          offset,
        }) as { query: string; params: unknown[] };
        const rows = await this.executeParameterizedQuery(knexInstance, query, params);
        return { status: 'ok', data: rows };
      }

      case 'create_row': {
        const { columns } = queryOptions.create_row || {};
        const { query, params } = queryBuilder.createRow(table, schema, columns) as {
          query: string;
          params: unknown[];
        };
        const rows = await this.executeParameterizedQuery(knexInstance, `${query} RETURNING *`, params);
        return { status: 'ok', data: rows };
      }

      case 'update_rows': {
        const { allow_multiple_updates, zero_records_as_success } = queryOptions;
        const { columns, where_filters } = queryOptions.update_rows || {};
        const hasWhereFilters = where_filters && Object.keys(where_filters).length > 0;
        if (!hasWhereFilters) {
          throw new Error(
            'Update rows requires at least one filter condition when multiple row updates are not allowed.'
          );
        }
        const { query, params } = queryBuilder.updateRows(table, { schema, columns, where_filters }) as {
          query: string;
          params: unknown[];
        };
        const rows = await this.executeWriteQuery(knexInstance, query, params, {
          allow_multiple_updates,
          zero_records_as_success,
          operationLabel: 'updated',
        });
        return { status: 'ok', data: rows };
      }

      case 'upsert_rows': {
        const { primary_key_columns, allow_multiple_updates, zero_records_as_success } = queryOptions;
        const { columns } = queryOptions.upsert_rows || {};
        const { query, params } = queryBuilder.upsertRows(table, { schema, primary_key_columns, columns }) as {
          query: string;
          params: unknown[];
        };
        const rows = await this.executeWriteQuery(knexInstance, query, params, {
          allow_multiple_updates,
          zero_records_as_success,
          operationLabel: 'upserted',
        });
        return { status: 'ok', data: rows };
      }

      case 'delete_rows': {
        const { limit, zero_records_as_success } = queryOptions;
        const { where_filters } = queryOptions.delete_rows || {};
        const hasWhereFilters = where_filters && Object.keys(where_filters).length > 0;
        const hasLimit = limit != null && limit !== '';
        if (!hasWhereFilters && !hasLimit) {
          throw new Error(
            'delete_rows requires at least one filter condition or a limit to prevent accidental mass deletions.'
          );
        }
        const { query, params } = queryBuilder.deleteRows(table, { schema, where_filters, limit }) as {
          query: string;
          params: unknown[];
        };
        const deletedRows = await this.executeParameterizedQuery(knexInstance, `${query} RETURNING *`, params);
        const deletedRecords = deletedRows.length;

        if (zero_records_as_success === false && deletedRecords === 0) {
          throw new Error('No rows were deleted.');
        }

        return { status: 'ok', data: deletedRows };
      }

      case 'bulk_insert': {
        const { records } = queryOptions;
        const { query, params } = queryBuilder.bulkInsert(table, { schema, rows_insert: records }) as {
          query: string;
          params: unknown[];
        };
        const rows = await this.executeParameterizedQuery(knexInstance, `${query} RETURNING *`, params);
        return { status: 'ok', data: rows };
      }

      case 'bulk_update_pkey': {
        const { primary_key_columns, records } = queryOptions;
        const { queries } = queryBuilder.bulkUpdateWithPrimaryKey(table, {
          schema,
          primary_key: primary_key_columns,
          rows_update: records,
        }) as { queries: { query: string; params: unknown[] }[] };
        const data = await this.executeBulkQueriesInTransaction(knexInstance, queries);
        return { status: 'ok', data, bulk_update_status: 'success' } as unknown as QueryResult;
      }

      case 'bulk_upsert_pkey': {
        const { primary_key_columns, records } = queryOptions;
        const { queries } = queryBuilder.bulkUpsertWithPrimaryKey(table, {
          schema,
          primary_key: primary_key_columns,
          row_upsert: records,
        }) as { queries: { query: string; params: unknown[] }[] };
        const data = await this.executeBulkQueriesInTransaction(knexInstance, queries);
        return { status: 'ok', data, bulk_upsert_status: 'success' } as unknown as QueryResult;
      }

      default:
        throw new Error(`Unsupported GUI operation: "${operation}"`);
    }
  }

  private async executeParameterizedQuery(knexInstance: Knex, query: string, params: unknown[]): Promise<unknown[]> {
    const { rows } = await knexInstance.raw(query, params as any[]);
    return rows;
  }

  private async executeWriteQuery(
    knexInstance: Knex,
    query: string,
    params: unknown[],
    options: { allow_multiple_updates?: boolean; zero_records_as_success?: boolean; operationLabel: string }
  ): Promise<unknown[]> {
    const { allow_multiple_updates, zero_records_as_success, operationLabel } = options;
    const hasConstraints = allow_multiple_updates === false || zero_records_as_success === false;

    if (!hasConstraints) {
      // No constraint checks — run directly, RETURNING * surfaces the affected rows
      const { rows: affectedRows } = await knexInstance.raw(`${query} RETURNING *`, params as any[]);
      return affectedRows;
    }

    // Wrap in a transaction so any thrown error automatically rolls back the write
    return knexInstance.transaction(async (trx) => {
      const { rows: affectedRows } = await trx.raw(`${query} RETURNING *`, params as any[]);

      if (allow_multiple_updates === false && affectedRows.length > 1) {
        throw new Error(
          'Query matches more than one row. Enable "Allow this Query to modify multiple rows" to permit this.'
        );
      }

      if (zero_records_as_success === false && affectedRows.length === 0) {
        throw new Error(`No rows were ${operationLabel}.`);
      }

      return affectedRows;
    });
  }

  private async executeBulkQueriesInTransaction(
    knexInstance: Knex,
    queries: { query: string; params: unknown[] }[]
  ): Promise<unknown[]> {
    const allRows: unknown[] = [];
    await knexInstance.transaction(async (transaction) => {
      for (const { query, params } of queries) {
        const { rows } = await transaction.raw(`${query} RETURNING *`, params as any[]);
        allRows.push(...rows);
      }
    });
    return allRows;
  }

  private isSqlParametersUsed(queryOptions: QueryOptions): boolean {
    const { query_params } = queryOptions;
    const queryParams = query_params || [];
    const sanitizedQueryParams: string[][] = queryParams.filter(([key]) => !isEmpty(key));
    return !!sanitizedQueryParams.length;
  }

  private async handleRawQuery(knexInstance: Knex, queryOptions: QueryOptions): Promise<QueryResult> {
    const { query, query_params } = queryOptions;
    const queryParams = query_params || [];
    const sanitizedQueryParams: Record<string, any> = Object.fromEntries(queryParams.filter(([key]) => !isEmpty(key)));
    const result = await this.executeQuery(knexInstance, query, sanitizedQueryParams);

    return { status: 'ok', data: result };
  }

  private async executeQuery(knexInstance: Knex, query: string, sanitizedQueryParams: Record<string, any> = {}) {
    if (isEmpty(query)) throw new Error('Query is empty');
    const { rows } = await knexInstance.raw(query, sanitizedQueryParams);
    return rows;
  }

  private connectionOptions(sourceOptions: SourceOptions) {
    const _connectionOptions = (sourceOptions.connection_options || []).filter((o) => o.some((e) => !isEmpty(e)));
    const connectionOptions = Object.fromEntries(_connectionOptions);
    Object.keys(connectionOptions).forEach((key) =>
      connectionOptions[key] === '' ? delete connectionOptions[key] : {}
    );
    return connectionOptions;
  }

  private async buildConnection(sourceOptions: SourceOptions): Promise<Knex> {
    let connectionConfig: any;
    let tunnel: Awaited<ReturnType<typeof createLocalSSHTunnel>> | null = null;

    // Resolve the base connection parameters depending on connection_type
    let resolvedHost: string = sourceOptions.host;
    let resolvedPort: number | undefined = Number(sourceOptions.port) || undefined;
    let resolvedUser: string = sourceOptions.username;
    let resolvedPass: string = sourceOptions.password;
    let resolvedDb: string = sourceOptions.database;

    if (sourceOptions.connection_type === 'string' && sourceOptions.connection_string) {
      const parsedUrl = new URL(sourceOptions.connection_string);

      const connUser = parsedUrl.username || '';
      const connPass = parsedUrl.password || '';
      const connHost = parsedUrl.hostname || '';
      const connPort: number = parsedUrl.port ? Number(parsedUrl.port) : 5432;
      const connDb = parsedUrl.pathname ? parsedUrl.pathname.replace('/', '') : '';
      const sslmode = parsedUrl.searchParams.get('sslmode') || parsedUrl.searchParams.get('ssl') || '';

      let connSslEnabled: boolean | undefined;

      if (sslmode === 'require' || sslmode === 'verify-full' || sslmode === 'verify-ca' || sslmode === 'true') {
        connSslEnabled = true;
      } else if (sslmode === 'disable' || sslmode === 'false') {
        connSslEnabled = false;
      }
      // Explicit UI values override connection string values
      resolvedUser = sourceOptions.username || connUser;
      resolvedPass = sourceOptions.password || connPass;
      // Only override if user explicitly changed away from the default
      resolvedHost = sourceOptions.host && sourceOptions.host !== 'localhost' ? sourceOptions.host : connHost;

      resolvedPort = sourceOptions.port && Number(sourceOptions.port) !== 5432 ? Number(sourceOptions.port) : connPort;

      resolvedDb = sourceOptions.database || connDb;

      // SSL Autofill
      if (!sourceOptions.ssl_enabled && connSslEnabled) {
        sourceOptions.ssl_enabled = connSslEnabled;
      }
    }

    // --- SSL config ---
    const sslConfig = this.getSslConfig(sourceOptions);

    // Set up SSH tunnel if enabled — pass targetHost/targetPort explicitly to avoid type conflicts
    if (sourceOptions.ssh_enabled === 'enabled') {
      tunnel = await createLocalSSHTunnel(sourceOptions, resolvedHost, resolvedPort ?? 5432);

      connectionConfig = {
        host: '127.0.0.1',
        port: tunnel.localPort,
        user: resolvedUser,
        password: resolvedPass,
        database: resolvedDb,
        ssl: sslConfig,
        ...(this.tooljet_edition !== 'cloud' ? { statement_timeout: this.STATEMENT_TIMEOUT } : {}),
      };
    } else {
      connectionConfig = {
        host: resolvedHost,
        port: resolvedPort,
        user: resolvedUser,
        password: resolvedPass,
        database: resolvedDb,
        ssl: sslConfig,
        ...(this.tooljet_edition !== 'cloud' ? { statement_timeout: this.STATEMENT_TIMEOUT } : {}),
      };
    }
    const knexInstance = knex({
      client: 'pg',
      connection: connectionConfig,
      pool: { min: 0, max: 10, acquireTimeoutMillis: 10000 },
      acquireConnectionTimeout: 60000,
      ...this.connectionOptions(sourceOptions),
    });
    // Attach tunnel reference for cleanup in run()/testConnection()
    if (tunnel) {
      (knexInstance as any).__sshTunnel = tunnel;
    }
    return knexInstance;
  }

  private getSslConfig(sourceOptions: SourceOptions) {
    if (!sourceOptions.ssl_enabled) return false;

    return {
      rejectUnauthorized: (sourceOptions.ssl_certificate ?? 'none') !== 'none',
      ca: sourceOptions.ssl_certificate === 'ca_certificate' ? sourceOptions.ca_cert : undefined,
      key: sourceOptions.ssl_certificate === 'self_signed' ? sourceOptions.client_key : undefined,
      cert: sourceOptions.ssl_certificate === 'self_signed' ? sourceOptions.client_cert : undefined,
    };
  }

  async getConnection(
    sourceOptions: SourceOptions,
    options: any,
    checkCache: boolean,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string
  ): Promise<Knex> {
    if (checkCache) {
      const optionsHash = generateSourceOptionsHash(sourceOptions);
      const enhancedCacheKey = `${dataSourceId}_${optionsHash}`;
      const cachedConnection = await getCachedConnection(enhancedCacheKey, dataSourceUpdatedAt);
      if (cachedConnection) return cachedConnection;

      const connection = await this.buildConnection(sourceOptions);
      cacheConnectionWithConfiguration(dataSourceId, enhancedCacheKey, connection);
      return connection;
    }

    return await this.buildConnection(sourceOptions);
  }

  buildBulkUpdateQuery(queryOptions: QueryOptions): string {
    let queryText = '';

    const { table: tableName, primary_key_column: primaryKey, records } = queryOptions;

    for (const record of records) {
      const primaryKeyValue = typeof record[primaryKey] === 'string' ? `'${record[primaryKey]}'` : record[primaryKey];

      queryText = `${queryText} UPDATE ${tableName} SET`;

      for (const key of Object.keys(record)) {
        if (key !== primaryKey) {
          queryText = ` ${queryText} ${key} = ${record[key] === null ? null : `'${record[key]}'`},`;
        }
      }

      queryText = queryText.slice(0, -1);
      queryText = `${queryText} WHERE ${primaryKey} = ${primaryKeyValue};`;
    }

    return queryText.trim();
  }
}
