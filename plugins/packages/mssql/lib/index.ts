import { Knex, knex } from 'knex';
import {
  ConnectionTestResult,
  QueryError,
  QueryResult,
  QueryService,
  cacheConnectionWithConfiguration,
  generateSourceOptionsHash,
  getCachedConnection,
  createQueryBuilder,
  User,
  App,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { isEmpty } from '@tooljet-plugins/common';
import { Client } from 'ssh2';
import net from 'net';

interface SSHTunnel {
  client: Client;
  server: net.Server;
  localPort: number;
}

const recognizedBooleans = {
  true: true,
  false: false,
};

function interpretValue(value: string): string | boolean | number {
  return recognizedBooleans[value.toLowerCase()] ?? (!isNaN(Number.parseInt(value)) ? Number.parseInt(value) : value);
}

function createSSHTunnel(sourceOptions: SourceOptions): Promise<SSHTunnel> {
  return new Promise((resolve, reject) => {
    const sshClient = new Client();

    sshClient.on('ready', () => {
      const server = net.createServer((socket) => {
        sshClient.forwardOut(
          socket.remoteAddress || '127.0.0.1',
          socket.remotePort || 0,
          sourceOptions.host,
          Number(sourceOptions.port),
          (err, stream) => {
            if (err) {
              socket.destroy();
              return;
            }
            socket.pipe(stream);
            stream.pipe(socket);
          }
        );
      });

      server.on('error', (err) => {
        sshClient.end();
        reject(err);
      });

      server.listen(0, '127.0.0.1', () => {
        const { port } = server.address() as net.AddressInfo;
        resolve({ client: sshClient, server, localPort: port });
      });
    });

    sshClient.on('error', reject);

    sshClient.connect({
      host: sourceOptions.ssh_host,
      port: sourceOptions.ssh_port || 22,
      username: sourceOptions.ssh_username,
      readyTimeout: 20000,
      keepaliveInterval: 10000,
      ...(sourceOptions.ssh_auth_type === 'password'
        ? { password: sourceOptions.ssh_password }
        : {
            privateKey: sourceOptions.ssh_private_key,
            ...(sourceOptions.ssh_passphrase ? { passphrase: sourceOptions.ssh_passphrase } : {}),
          }),
    });
  });
}

export default class MssqlQueryService implements QueryService {
  private static _instance: MssqlQueryService;
  // MSSQL hard limit is 2100 parameters per batch; use 2000 as a safe threshold
  private static readonly MSSQL_PARAM_THRESHOLD = 2000;
  private STATEMENT_TIMEOUT;

  constructor() {
    this.STATEMENT_TIMEOUT =
      process.env?.PLUGINS_SQL_DB_STATEMENT_TIMEOUT && !isNaN(Number(process.env?.PLUGINS_SQL_DB_STATEMENT_TIMEOUT))
        ? Number(process.env.PLUGINS_SQL_DB_STATEMENT_TIMEOUT)
        : 120000;

    if (!MssqlQueryService._instance) {
      MssqlQueryService._instance = this;
      process.on('uncaughtException', (err: any) => {
        if (err?.code === 'ESOCKET') return;
        throw err;
      });
    }
    return MssqlQueryService._instance;
  }

  sanitizeOptions(options: string[][]) {
    const _connectionOptions = (options || [])
      .filter((o) => o.every((e) => !!e))
      .map(([key, value]) => [key, interpretValue(value)]);

    return Object.fromEntries(_connectionOptions);
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    let knexInstance: Knex | undefined;
    let checkCache: boolean;

    // Dynamic connection parameters
    if (sourceOptions.allow_dynamic_connection_parameters) {
      if (sourceOptions.connection_type === 'manual') {
        sourceOptions.host = queryOptions['host'] ? queryOptions['host'] : sourceOptions.host;
        sourceOptions.database = queryOptions['database'] ? queryOptions['database'] : sourceOptions.database;
      } else if (sourceOptions.connection_type === 'string') {
        if (queryOptions['host']) sourceOptions.host = queryOptions['host'];
        if (queryOptions['database']) sourceOptions.database = queryOptions['database'];
      }
    }
    // eslint-disable-next-line prefer-const
    checkCache = sourceOptions.allow_dynamic_connection_parameters ? false : true;
    try {
      knexInstance = await this.getConnection(sourceOptions, {}, checkCache, dataSourceId, dataSourceUpdatedAt);
      switch (queryOptions.mode) {
        case 'sql':
          return await this.handleRawQuery(knexInstance, queryOptions);
        case 'gui':
          return await this.handleGuiQuery(knexInstance, queryOptions);
        default:
          throw new Error("Invalid query mode. Must be either 'sql' or 'gui'.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err?.message : 'An unknown error occurred';
      const errorDetails: any = {};

      if (err && err instanceof Error) {
        const msSqlError = err as any;
        const { code, severity, state, number, lineNumber, serverName, class: errorClass } = msSqlError;
        errorDetails.code = code || null;
        errorDetails.severity = severity || null;
        errorDetails.state = state || null;
        errorDetails.number = number || null;
        errorDetails.lineNumber = lineNumber || null;
        errorDetails.serverName = serverName || null;
        errorDetails.class = errorClass || null;
      }
      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    }
  }

  /** Coerces UI-supplied values (boolean or string) to a proper boolean. */
  private _normalizeBool(val: unknown): boolean | undefined {
    if (val === true || val === 'true') return true;
    if (val === false || val === 'false') return false;
    return undefined;
  }

  /** Normalises the result from knex.raw() for MSSQL so that both SELECT-like
   *  results (plain array) and DML-with-OUTPUT results (object with .recordset)
   *  are returned as a consistent array of rows. */
  private _extractRecordset(result: any): unknown[] {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.recordset)) return result.recordset;
    return [];
  }

  private async handleGuiQuery(knexInstance: Knex, queryOptions: QueryOptions): Promise<QueryResult> {
    const { operation, table, schema } = queryOptions;
    const queryBuilder = createQueryBuilder('mssql');

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
        const result = await this.executeParameterizedQuery(knexInstance, query, params);
        return { status: 'ok', data: result };
      }

      case 'create_row': {
        const { columns } = queryOptions.create_row || {};
        const { query, params } = queryBuilder.createRow(table, schema, columns) as {
          query: string;
          params: unknown[];
        };
        const queryWithOutput = this.injectMssqlOutput(query, 'INSERTED');
        const result = await knexInstance.raw(queryWithOutput, params as any[]).timeout(this.STATEMENT_TIMEOUT);
        return { status: 'ok', data: this._extractRecordset(result) };
      }

      case 'update_rows': {
        const allow_multiple_updates = this._normalizeBool(queryOptions.allow_multiple_updates ?? false);
        const zero_records_as_success = this._normalizeBool(queryOptions.zero_records_as_success ?? false);
        const { columns, where_filters } = queryOptions.update_rows || {};
        const hasAtLeastOneFilter = Object.values(where_filters || {}).some((f: any) => f?.column?.trim());
        if (allow_multiple_updates !== true && !hasAtLeastOneFilter)
          throw new Error('At least one filter condition is required.');

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
        const { primary_key_columns } = queryOptions;
        const allow_multiple_updates = this._normalizeBool(queryOptions.allow_multiple_updates ?? false);
        const zero_records_as_success = this._normalizeBool(queryOptions.zero_records_as_success ?? false);
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
        const { limit } = queryOptions;
        const allow_multiple_updates = this._normalizeBool(queryOptions.allow_multiple_updates ?? false);
        const zero_records_as_success = this._normalizeBool(queryOptions.zero_records_as_success ?? false);
        const { where_filters } = queryOptions.delete_rows || {};
        const hasAtLeastOneFilter = Object.values(where_filters || {}).some((f: any) => f?.column?.trim());
        const hasLimit = limit != null && limit !== '';
        if (!hasAtLeastOneFilter && !hasLimit) {
          throw new Error(
            'Delete requires at least one filter condition or a limit to prevent deleting all rows unintentionally.'
          );
        }
        const { query, params } = queryBuilder.deleteRows(table, { schema, where_filters, limit }) as {
          query: string;
          params: unknown[];
        };
        const queryWithOutput = this.injectMssqlOutput(query, 'DELETED');

        const deletedRecords = await knexInstance.transaction(async (trx) => {
          const result = await trx.raw(queryWithOutput, params as any[]).timeout(this.STATEMENT_TIMEOUT);
          const deletedRows = this._extractRecordset(result);

          if (allow_multiple_updates === false && deletedRows.length > 1) {
            throw new Error(
              'Query matches more than one row. Enable "Allow this Query to delete multiple rows" to permit this.'
            );
          }

          if (zero_records_as_success === false && deletedRows.length === 0) {
            throw new Error('No rows were deleted.');
          }

          return deletedRows.length;
        });

        return { status: 'ok', data: { deletedRecords } };
      }

      case 'bulk_insert': {
        const { records } = queryOptions;
        const recordBatches = this.splitIntoBatches(records, this.computeBatchSize(records));
        const batchInsertQueries: { query: string; params: unknown[] }[] = recordBatches.map((batchRecords) => {
          const { query, params } = queryBuilder.bulkInsert(table, { schema, rows_insert: batchRecords }) as {
            query: string;
            params: unknown[];
          };
          return { query, params };
        });
        const affectedRows = await this.executeBulkQueriesAndCountAffected(knexInstance, batchInsertQueries);
        return { status: 'ok', data: { affectedRows } };
      }

      case 'bulk_update_pkey': {
        const { primary_key_column: primary_key_columns, records } = queryOptions;
        const recordBatches = this.splitIntoBatches(records, this.computeBatchSize(records));
        const allUpdateQueries: { query: string; params: unknown[] }[] = [];
        for (const batchRecords of recordBatches) {
          const { queries } = queryBuilder.bulkUpdateWithPrimaryKey(table, {
            schema,
            primary_key: primary_key_columns,
            rows_update: batchRecords,
          }) as { queries: { query: string; params: unknown[] }[] };
          allUpdateQueries.push(...queries);
        }
        const affectedRows = await this.executeBulkQueriesAndCountAffected(knexInstance, allUpdateQueries);
        return { status: 'ok', data: { affectedRows }, bulk_update_status: 'success' } as unknown as QueryResult;
      }

      case 'bulk_upsert_pkey': {
        const { primary_key_columns, records } = queryOptions;
        const recordBatches = this.splitIntoBatches(records, this.computeBatchSize(records));
        const allUpsertQueries: { query: string; params: unknown[] }[] = [];
        for (const batchRecords of recordBatches) {
          const { queries } = queryBuilder.bulkUpsertWithPrimaryKey(table, {
            schema,
            primary_key: primary_key_columns,
            row_upsert: batchRecords,
          }) as { queries: { query: string; params: unknown[] }[] };
          allUpsertQueries.push(...queries);
        }
        const affectedRows = await this.executeBulkQueriesAndCountAffected(knexInstance, allUpsertQueries);
        return { status: 'ok', data: { affectedRows }, bulk_upsert_status: 'success' } as unknown as QueryResult;
      }

      default:
        throw new Error(`Unsupported GUI operation: "${operation}"`);
    }
  }

  /**
   * Injects an MSSQL OUTPUT clause into a generated SQL statement so that
   * affected rows are returned.
   *
   * - INSERT:  OUTPUT INSERTED.* is placed before the VALUES keyword.
   * - MERGE:   OUTPUT INSERTED.* is placed before the trailing semicolon.
   * - UPDATE / DELETE: OUTPUT clause is placed before the WHERE clause
   *   (or appended when there is no WHERE).
   */
  private injectMssqlOutput(query: string, outputType: 'INSERTED' | 'DELETED'): string {
    const outputClause = `OUTPUT ${outputType}.*`;

    const trimmedQuery = query.trimEnd();

    // IF EXISTS / IF NOT EXISTS — OUTPUT clauses are already embedded in each branch
    if (/^IF\s+(?:NOT\s+)?EXISTS\b/i.test(trimmedQuery)) {
      return trimmedQuery;
    }

    // MERGE statement — inject OUTPUT before the trailing semicolon
    if (trimmedQuery.toUpperCase().startsWith('MERGE')) {
      const base = trimmedQuery.endsWith(';') ? trimmedQuery.slice(0, -1) : trimmedQuery;
      return `${base} ${outputClause};`;
    }

    // INSERT with DEFAULT VALUES — inject OUTPUT before the DEFAULT VALUES clause
    const defaultValuesMatch = /\bDEFAULT\s+VALUES\b/i;
    if (defaultValuesMatch.test(trimmedQuery)) {
      return trimmedQuery.replace(defaultValuesMatch, `${outputClause} DEFAULT VALUES`);
    }

    // INSERT statement — inject OUTPUT before the VALUES keyword
    const valuesIndex = query.indexOf(' VALUES ');
    if (valuesIndex !== -1) {
      return `${query.slice(0, valuesIndex)} ${outputClause}${query.slice(valuesIndex)}`;
    }

    // UPDATE / DELETE — inject OUTPUT before the WHERE clause
    const whereIndex = query.lastIndexOf(' WHERE ');
    if (whereIndex !== -1) {
      return `${query.slice(0, whereIndex)} ${outputClause}${query.slice(whereIndex)}`;
    }

    // No WHERE clause — append at end
    return `${query} ${outputClause}`;
  }

  /**
   * Executes a write query (UPDATE / MERGE) with OUTPUT INSERTED.* to surface
   * affected rows. Wraps in a transaction when constraint checks are active so
   * that any thrown error automatically rolls back the write.
   */
  private async executeWriteQuery(
    knexInstance: Knex,
    query: string,
    params: unknown[],
    options: { allow_multiple_updates?: boolean; zero_records_as_success?: boolean; operationLabel: string }
  ): Promise<unknown[]> {
    const { allow_multiple_updates, zero_records_as_success, operationLabel } = options;
    const queryWithOutput = this.injectMssqlOutput(query, 'INSERTED');

    // Wrap in a transaction so any thrown error automatically rolls back the write
    return knexInstance.transaction(async (trx) => {
      const result = await trx.raw(queryWithOutput, params as any[]).timeout(this.STATEMENT_TIMEOUT);
      const affectedRows: unknown[] = this._extractRecordset(result);

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

  private async executeParameterizedQuery(knexInstance: Knex, query: string, params: unknown[]): Promise<unknown> {
    const result = await knexInstance.raw(query, params as any[]).timeout(this.STATEMENT_TIMEOUT);
    return result;
  }

  private async executeBulkQueriesAndCountAffected(
    knexInstance: Knex,
    queries: { query: string; params: unknown[] }[]
  ): Promise<number> {
    let totalAffectedRows = 0;
    await knexInstance.transaction(async (transaction) => {
      for (const { query, params } of queries) {
        // upsert queries already embed OUTPUT INSERTED.* in each IF/ELSE branch;
        // injectMssqlOutput leaves them unchanged and adds it to plain INSERT/UPDATE.
        const queryWithOutput = this.injectMssqlOutput(query, 'INSERTED');
        const result = await transaction.raw(queryWithOutput, params as any[]).timeout(this.STATEMENT_TIMEOUT);
        totalAffectedRows += this._extractRecordset(result).length;
      }
    });
    return totalAffectedRows;
  }

  private computeBatchSize(records: Record<string, unknown>[]): number {
    if (!records || records.length === 0) return 1000;
    const SAMPLE_SIZE = 500;
    const sample =
      records.length <= SAMPLE_SIZE * 2 ? records : [...records.slice(0, SAMPLE_SIZE), ...records.slice(-SAMPLE_SIZE)];
    const numberOfColumns = Math.max(...sample.map((record) => Object.keys(record).length));
    if (numberOfColumns === 0) return 1000;
    return Math.max(1, Math.floor(MssqlQueryService.MSSQL_PARAM_THRESHOLD / numberOfColumns));
  }

  private splitIntoBatches<RecordType>(records: RecordType[], batchSize: number): RecordType[][] {
    const batches: RecordType[][] = [];
    for (let startIndex = 0; startIndex < records.length; startIndex += batchSize) {
      batches.push(records.slice(startIndex, startIndex + batchSize));
    }
    return batches;
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

    const result = await knexInstance.raw(query, sanitizedQueryParams).timeout(this.STATEMENT_TIMEOUT);
    return result;
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    let knexInstance;
    try {
      knexInstance = await this.getConnection(sourceOptions, {}, false);
      await knexInstance.raw('select @@version;').timeout(this.STATEMENT_TIMEOUT);
      try {
        await knexInstance.destroy();
        // eslint-disable-next-line no-empty
      } catch (_) {}
      return {
        status: 'ok',
      };
    } catch (err: any) {
      let message = 'Connection test failed';
      let details: any = {};

      if (err?.code || err?.number || err?.serverName) {
        message = err.message;
        details = {
          code: err.code ?? null,
          severity: err.severity ?? null,
          state: err.state ?? null,
          number: err.number ?? null,
          lineNumber: err.lineNumber ?? null,
          serverName: err.serverName ?? null,
          class: err.class ?? null,
        };
      } else if (err?.code === 'ESOCKET' || err?.code === 'ECONNREFUSED' || err?.code === 'ETIMEDOUT') {
        message = `Network error: ${err.message}`;
      } else if (err?.code === 'ELOGIN') {
        message = `Authentication failed: ${err.message}`;
      } else if (err?.message?.includes('SSH')) {
        message = `SSH connection failed: ${err.message}`;
      } else if (err?.name === 'KnexTimeoutError') {
        message = 'Database connection timeout. Please check host/port/firewall';
      } else if (err?.message) {
        message = err.message;
      }

      throw new QueryError('Connection test failed', message, details);
    } finally {
      if (knexInstance) {
        try {
          await knexInstance.destroy();
          // eslint-disable-next-line no-empty
        } catch (_) {}
      }
    }
  }

  private parseConnectionString(connectionString: string): Partial<SourceOptions> {
    const parsed: Partial<SourceOptions> = {};

    if (!connectionString) return parsed;

    const trimmed = connectionString.trim();

    const withoutScheme = /^sqlserver:\/\//i.test(trimmed) ? trimmed.replace(/^sqlserver:\/\//i, '') : trimmed;

    const looksLikeHybrid = withoutScheme.includes(';') && !/^[a-z ]+=/i.test(withoutScheme.split(';')[0]);

    if (looksLikeHybrid) {
      const firstSemi = withoutScheme.indexOf(';');
      const hostSegment = withoutScheme.slice(0, firstSemi);
      const rest = withoutScheme.slice(firstSemi + 1);

      const hostMatch = hostSegment.match(/^([^:\\,]+)(?::(\d+))?(?:\\([^,]*))?(?:,(\d+))?/);
      if (hostMatch) {
        if (hostMatch[1]) parsed.host = hostMatch[1].trim();
        if (hostMatch[2]) parsed.port = parseInt(hostMatch[2], 10);
        if (hostMatch[3]) parsed.instanceName = hostMatch[3].trim();
        if (hostMatch[4]) parsed.port = parseInt(hostMatch[4], 10);
      }

      rest.split(';').forEach((pair) => {
        if (!pair.includes('=')) return;
        const [key, ...valueParts] = pair.split('=');
        const value = valueParts.join('=').trim();
        const lowerKey = key.trim().toLowerCase();

        if (lowerKey === 'database' || lowerKey === 'initial catalog') {
          parsed.database = value;
        } else if (lowerKey === 'user id' || lowerKey === 'uid' || lowerKey === 'user') {
          parsed.username = value;
        } else if (lowerKey === 'password' || lowerKey === 'pwd') {
          parsed.password = value;
        } else if (lowerKey === 'encrypt') {
          parsed.azure = ['true', '1', 'yes'].includes(value.toLowerCase()) as any;
        } else if (lowerKey === 'port') {
          parsed.port = parseInt(value, 10);
        } else if (lowerKey === 'instance' || lowerKey === 'instance name') {
          parsed.instanceName = value;
        }
      });
    }

    return parsed;
  }

  async buildConnection(sourceOptions: SourceOptions): Promise<Knex> {
    const finalOptions: SourceOptions = sourceOptions;
    // SSL config
    const shouldUseSSL = finalOptions.ssl_enabled === true;
    let sslObject: any = null;

    if (shouldUseSSL) {
      if (finalOptions.ssl_certificate === 'ca_certificate') {
        sslObject = {
          rejectUnauthorized: true,
          ca: finalOptions.ca_cert,
          key: finalOptions.client_key,
          cert: finalOptions.client_cert,
        };
      } else if (finalOptions.ssl_certificate === 'self_signed') {
        sslObject = {
          rejectUnauthorized: false,
          ca: finalOptions.root_cert,
          key: finalOptions.client_key,
          cert: finalOptions.client_cert,
        };
      } else {
        sslObject = { rejectUnauthorized: false };
      }
    }

    let tunnel: SSHTunnel | null = null;

    let host: string;
    let port: number;

    if (sourceOptions.ssh_enabled == 'enabled') {
      tunnel = await createSSHTunnel(sourceOptions);
      host = '127.0.0.1';
      port = tunnel.localPort;
    } else {
      host = finalOptions.host;
      port = +finalOptions.port;
    }

    // Service Principal (Azure AD) authentication
    const isServicePrincipal = finalOptions.auth_type === 'service_principal';

    const config: Knex.Config = {
      client: 'mssql',
      connection: {
        ...(isServicePrincipal
          ? {
              // Knex mssql dialect builds the tedious auth block from these FLAT fields.
              // It ignores any nested 'authentication' object entirely.
              server: host,
              type: 'azure-active-directory-service-principal-secret',
              tenantId: finalOptions.sp_tenant_id,
              clientId: finalOptions.sp_client_id,
              clientSecret: finalOptions.sp_client_secret,
            }
          : {
              host: host,
              user: finalOptions.username,
              password: finalOptions.password,
            }),
        database: finalOptions.database,
        port: port,
        options: {
          encrypt: isServicePrincipal ? true : (finalOptions.azure ?? false) || shouldUseSSL,
          instanceName: finalOptions.instanceName,
          trustServerCertificate: !isServicePrincipal && shouldUseSSL && finalOptions.ssl_certificate === 'none',
          requestTimeout: this.STATEMENT_TIMEOUT,
          ...(shouldUseSSL && !isServicePrincipal ? { cryptoCredentialsDetails: sslObject } : {}),
          ...(finalOptions.connection_options && this.sanitizeOptions(finalOptions.connection_options)),
        },
      },
      pool: {
        min: 0,
        afterCreate: (conn: any, done: (err: Error | null, conn: any) => void) => {
          conn.on('error', (_err: Error) => {});
          done(null, conn);
        },
      },
    };

    const knexInstance = knex(config);

    if (tunnel) {
      const originalDestroy = knexInstance.destroy.bind(knexInstance);
      Object.defineProperty(knexInstance, 'destroy', {
        value: async function () {
          try {
            await originalDestroy();
          } finally {
            tunnel.server.close();
            tunnel.client.end();
          }
        },
      });
    }
    return knexInstance;
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

  async listTables(
    sourceOptions: SourceOptions,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string,
    queryOptions?: { search?: string; page?: number; limit?: number }
  ): Promise<QueryResult> {
    let knexInstance;
    try {
      knexInstance = await this.buildConnection(sourceOptions);

      const search = typeof queryOptions?.search === 'string' ? queryOptions.search : '';
      const searchPattern = `%${search}%`;
      const db = sourceOptions.database;

      if (queryOptions?.limit) {
        const limit = queryOptions.limit;
        const page = queryOptions.page || 1;
        const offset = (page - 1) * limit;

        const [dataResult, countResult] = await Promise.all([
          knexInstance
            .raw(
              `SELECT TABLE_NAME, TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG = ? AND TABLE_NAME LIKE ? ORDER BY TABLE_NAME OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
              [db, searchPattern, offset, limit]
            )
            .timeout(this.STATEMENT_TIMEOUT),
          knexInstance
            .raw(
              `SELECT COUNT(*) AS total FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG = ? AND TABLE_NAME LIKE ?`,
              [db, searchPattern]
            )
            .timeout(this.STATEMENT_TIMEOUT),
        ]);

        const rows = dataResult.map((row: any) => ({ table_name: row.TABLE_NAME, table_schema: row.TABLE_SCHEMA }));
        const totalCount = parseInt(countResult?.[0]?.total ?? '0', 10);

        return { status: 'ok', data: { rows, totalCount } };
      }

      const result = await knexInstance
        .raw(
          `SELECT TABLE_NAME, TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG = ? AND TABLE_NAME LIKE ? ORDER BY TABLE_NAME`,
          [db, searchPattern]
        )
        .timeout(this.STATEMENT_TIMEOUT);

      const tables = result.map((row: any) => ({ table_name: row.TABLE_NAME, table_schema: row.TABLE_SCHEMA }));

      return { status: 'ok', data: tables };
    } catch (err) {
      const errorMessage = err instanceof Error ? err?.message : 'An unknown error occurred';
      throw new QueryError('Could not fetch tables', errorMessage, {});
    } finally {
      if (knexInstance) await knexInstance.destroy();
    }
  }

  private async _fetchSchemas(sourceOptions: SourceOptions): Promise<Array<{ value: string; label: string }>> {
    let knexInstance;
    try {
      knexInstance = await this.buildConnection(sourceOptions);
      const result = await knexInstance
        .raw(
          `SELECT SCHEMA_NAME
           FROM INFORMATION_SCHEMA.SCHEMATA
           WHERE SCHEMA_NAME NOT IN ('sys', 'INFORMATION_SCHEMA', 'guest', 'db_owner', 'db_accessadmin',
             'db_securityadmin', 'db_ddladmin', 'db_backupoperator', 'db_datareader', 'db_datawriter',
             'db_denydatareader', 'db_denydatawriter')
           ORDER BY SCHEMA_NAME`
        )
        .timeout(this.STATEMENT_TIMEOUT);
      return result.map((row: any) => ({ value: row.SCHEMA_NAME, label: row.SCHEMA_NAME }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      throw new QueryError('Could not fetch schemas', errorMessage, {});
    } finally {
      if (knexInstance) await knexInstance.destroy();
    }
  }

  private async _fetchTablesForSchema(
    sourceOptions: SourceOptions,
    schema: string
  ): Promise<Array<{ value: string; label: string }>> {
    let knexInstance;
    try {
      knexInstance = await this.buildConnection(sourceOptions);
      const result = await knexInstance
        .raw(
          `SELECT TABLE_NAME
           FROM INFORMATION_SCHEMA.TABLES
           WHERE TABLE_TYPE = 'BASE TABLE'
           AND TABLE_CATALOG = ?
           AND TABLE_SCHEMA = ?
           AND OBJECTPROPERTY(OBJECT_ID(QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME)), 'IsMSShipped') = 0
           ORDER BY TABLE_NAME`,
          [sourceOptions.database, schema]
        )
        .timeout(this.STATEMENT_TIMEOUT);
      return result.map((row: any) => ({ value: row.TABLE_NAME, label: row.TABLE_NAME }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      throw new QueryError('Could not fetch tables', errorMessage, {});
    } finally {
      if (knexInstance) await knexInstance.destroy();
    }
  }

  private async _fetchColumnsForTable(
    sourceOptions: SourceOptions,
    schema: string,
    table: string
  ): Promise<Array<{ value: string; label: string }>> {
    let knexInstance;
    try {
      knexInstance = await this.buildConnection(sourceOptions);
      const result = await knexInstance
        .raw(
          `SELECT COLUMN_NAME
           FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_CATALOG = ?
           AND TABLE_SCHEMA = ?
           AND TABLE_NAME = ?
           ORDER BY ORDINAL_POSITION`,
          [sourceOptions.database, schema, table]
        )
        .timeout(this.STATEMENT_TIMEOUT);
      return result.map((row: any) => ({ value: row.COLUMN_NAME, label: row.COLUMN_NAME }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      throw new QueryError('Could not fetch columns', errorMessage, {});
    } finally {
      if (knexInstance) await knexInstance.destroy();
    }
  }

  async invokeMethod(
    methodName: string,
    context: { user?: User; app?: App },
    sourceOptions: SourceOptions,
    args?: any
  ): Promise<any> {
    try {
      if (sourceOptions.allow_dynamic_connection_parameters) {
        if (args?.host != null && args?.host !== '') sourceOptions.host = args.host;
        if (args?.database != null && args?.database !== '') sourceOptions.database = args.database;
      }

      if (methodName === 'getTables') {
        const isPaginated = !!args?.limit;
        const result = await this.listTables(sourceOptions, undefined, undefined, {
          search: args?.search,
          page: args?.page,
          limit: args?.limit,
        });

        const payload = (result as any)?.data ?? [];

        if (isPaginated) {
          const rows = (payload as any)?.rows ?? [];
          const totalCount = (payload as any)?.totalCount ?? 0;
          const formattedTables = rows.map((row: any) => ({
            label: String(row.table_name || row.label),
            value: String(row.table_name || row.value),
          }));
          return { items: formattedTables, totalCount };
        }

        const rows = Array.isArray(payload) ? payload : [];
        const formattedTables = rows.map((row: any) => ({
          label: String(row.table_name || row.label),
          value: String(row.table_name || row.value),
        }));

        return { status: 'ok', data: formattedTables };
      }

      if (methodName === 'listSchemas') {
        const schemas = await this._fetchSchemas(sourceOptions);
        return { status: 'ok', data: schemas };
      }

      if (methodName === 'listTables') {
        const schema = args?.values?.schema || '';
        if (!schema) return { status: 'ok', data: [] };
        const tables = await this._fetchTablesForSchema(sourceOptions, schema);
        return { status: 'ok', data: tables };
      }

      if (methodName === 'listColumns') {
        const schema = args?.values?.schema || '';
        const table = args?.values?.table || '';
        if (!schema || !table) return { status: 'ok', data: [] };
        const columns = await this._fetchColumnsForTable(sourceOptions, schema, table);
        return { status: 'ok', data: columns };
      }

      throw new QueryError('Method not found', `Method ${methodName} is not supported for MSSQL plugin`, {
        availableMethods: ['getTables', 'listSchemas', 'listTables', 'listColumns'],
      });
    } catch (err) {
      if (err instanceof QueryError) {
        throw err;
      }

      const errorMessage = err instanceof Error ? err?.message : 'An unknown error occurred';
      const errorDetails: any = {};

      if (err && err instanceof Error) {
        const msSqlError = err as any;
        const { code, severity, state, number, lineNumber, serverName, class: errorClass } = msSqlError;
        errorDetails.code = code || null;
        errorDetails.severity = severity || null;
        errorDetails.state = state || null;
        errorDetails.number = number || null;
        errorDetails.lineNumber = lineNumber || null;
        errorDetails.serverName = serverName || null;
        errorDetails.class = errorClass || null;
      }
      throw new QueryError('Method invocation failed', errorMessage, errorDetails);
    }
  }
}
