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
    try {
      const knexInstance = await this.getConnection(sourceOptions, {}, true, dataSourceId, dataSourceUpdatedAt);

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

  private async handleGuiQuery(knexInstance: Knex, queryOptions: QueryOptions): Promise<QueryResult> {
    const { operation, table } = queryOptions;
    const queryBuilder = createQueryBuilder('mssql');

    switch (operation) {
      case 'list_rows': {
        const { list_rows, limit, offset } = queryOptions;
        const { where_filters, order_filters, aggregates, group_by } = list_rows || {};
        const { query, params } = queryBuilder.listRows(table, {
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
        const { query, params } = queryBuilder.createRow(table, columns) as { query: string; params: unknown[] };
        const queryWithOutput = this.injectMssqlOutput(query, 'INSERTED');
        const result = await knexInstance.raw(queryWithOutput, params as any[]).timeout(this.STATEMENT_TIMEOUT);
        return { status: 'ok', data: result.recordset ?? [] };
      }

      case 'update_rows': {
        const { allow_multiple_updates, zero_records_as_success } = queryOptions;
        const { columns, where_filters } = queryOptions.update_rows || {};
        const { query, params } = queryBuilder.updateRows(table, { columns, where_filters }) as {
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
        const { primary_key_column, allow_multiple_updates, zero_records_as_success } = queryOptions;
        const { columns } = queryOptions.upsert_rows || {};
        const { query, params } = queryBuilder.upsertRows(table, { primary_key_column, columns }) as {
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
        const { query, params } = queryBuilder.deleteRows(table, { where_filters, limit }) as {
          query: string;
          params: unknown[];
        };
        const queryWithOutput = this.injectMssqlOutput(query, 'DELETED');
        const result = await knexInstance.raw(queryWithOutput, params as any[]).timeout(this.STATEMENT_TIMEOUT);
        const deletedRecords = (result.recordset ?? []).length;

        if (zero_records_as_success === false && deletedRecords === 0) {
          throw new Error('No rows were deleted.');
        }

        return { status: 'ok', deletedRecords } as unknown as QueryResult;
      }

      case 'bulk_insert': {
        const { records } = queryOptions;
        const { query, params } = queryBuilder.bulkInsert(table, { rows_insert: records }) as {
          query: string;
          params: unknown[];
        };
        const queryWithOutput = this.injectMssqlOutput(query, 'INSERTED');
        const result = await knexInstance.raw(queryWithOutput, params as any[]).timeout(this.STATEMENT_TIMEOUT);
        return { status: 'ok', data: result.recordset ?? [] };
      }

      case 'bulk_update_pkey': {
        const { primary_key_column, records } = queryOptions;
        const { queries } = queryBuilder.bulkUpdateWithPrimaryKey(table, {
          primary_key: [primary_key_column],
          rows_update: records,
        }) as { queries: { query: string; params: unknown[] }[] };
        const data = await this.executeBulkQueriesInTransaction(knexInstance, queries);
        return { status: 'ok', data, bulk_update_status: 'success' } as unknown as QueryResult;
      }

      case 'bulk_upsert_pkey': {
        const { primary_key_column, records } = queryOptions;
        const { queries } = queryBuilder.bulkUpsertWithPrimaryKey(table, {
          primary_key: [primary_key_column],
          row_upsert: records,
        }) as { queries: { query: string; params: unknown[] }[] };
        const data = await this.executeBulkQueriesInTransaction(knexInstance, queries);
        return { status: 'ok', data, bulk_upsert_status: 'success' } as unknown as QueryResult;
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

    // MERGE statement — inject OUTPUT before the trailing semicolon
    const trimmedQuery = query.trimEnd();
    if (trimmedQuery.toUpperCase().startsWith('MERGE')) {
      const base = trimmedQuery.endsWith(';') ? trimmedQuery.slice(0, -1) : trimmedQuery;
      return `${base} ${outputClause};`;
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
    const hasConstraints = allow_multiple_updates === false || zero_records_as_success === false;

    const queryWithOutput = this.injectMssqlOutput(query, 'INSERTED');

    if (!hasConstraints) {
      const result = await knexInstance.raw(queryWithOutput, params as any[]).timeout(this.STATEMENT_TIMEOUT);
      return result.recordset ?? [];
    }

    // Wrap in a transaction so any thrown error automatically rolls back the write
    return knexInstance.transaction(async (trx) => {
      const result = await trx.raw(queryWithOutput, params as any[]).timeout(this.STATEMENT_TIMEOUT);
      const affectedRows: unknown[] = result.recordset ?? [];

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

  private async executeBulkQueriesInTransaction(
    knexInstance: Knex,
    queries: { query: string; params: unknown[] }[]
  ): Promise<unknown[]> {
    const allRows: unknown[] = [];
    await knexInstance.transaction(async (transaction) => {
      for (const { query, params } of queries) {
        const queryWithOutput = this.injectMssqlOutput(query, 'INSERTED');
        const result = await transaction.raw(queryWithOutput, params as any[]).timeout(this.STATEMENT_TIMEOUT);
        allRows.push(...(result.recordset ?? []));
      }
    });
    return allRows;
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
    let finalOptions: SourceOptions;

    if (sourceOptions.connection_type === 'string') {
      const parsedOptions = this.parseConnectionString(sourceOptions.connection_string || '');

      finalOptions = { ...sourceOptions };
      if (parsedOptions.host) finalOptions.host = finalOptions.host || parsedOptions.host;
      if (parsedOptions.port) finalOptions.port = finalOptions.port || parsedOptions.port;
      if (parsedOptions.database) finalOptions.database = finalOptions.database || parsedOptions.database;
      if (parsedOptions.username) finalOptions.username = finalOptions.username || parsedOptions.username;
      if (parsedOptions.password) finalOptions.password = finalOptions.password || parsedOptions.password;
      if (parsedOptions.instanceName)
        finalOptions.instanceName = finalOptions.instanceName || parsedOptions.instanceName;
      if (parsedOptions.azure !== undefined) finalOptions.azure = finalOptions.azure || parsedOptions.azure;
    } else {
      finalOptions = sourceOptions;
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

    const config: Knex.Config = {
      client: 'mssql',
      connection: {
        host: host,
        user: finalOptions.username,
        password: finalOptions.password,
        database: finalOptions.database,
        port: port,
        options: {
          encrypt: finalOptions.azure ?? false,
          instanceName: finalOptions.instanceName,
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

  buildBulkUpdateQuery(queryOptions: QueryOptions): string {
    let queryText = '';

    const { table, primary_key_column, records } = queryOptions;

    for (const record of records) {
      const primaryKeyValue =
        typeof record[primary_key_column] === 'string' ? `'${record[primary_key_column]}'` : record[primary_key_column];

      queryText = `${queryText} UPDATE ${table} SET`;

      for (const key of Object.keys(record)) {
        if (key !== primary_key_column) {
          queryText = ` ${queryText} ${key} = '${record[key]}',`;
        }
      }

      queryText = queryText.slice(0, -1);
      queryText = `${queryText} WHERE ${primary_key_column} = ${primaryKeyValue};`;
    }

    return queryText.trim();
  }

  async listTables(sourceOptions: SourceOptions): Promise<QueryResult> {
    let knexInstance;
    try {
      knexInstance = await this.buildConnection(sourceOptions);

      const result = await knexInstance
        .raw(
          `
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_TYPE = 'BASE TABLE' 
          AND TABLE_CATALOG = ?
          ORDER BY TABLE_NAME
        `,
          [sourceOptions.database]
        )
        .timeout(this.STATEMENT_TIMEOUT);

      const tables = result.map((row: any) => ({
        label: row.TABLE_NAME,
        value: row.TABLE_NAME,
      }));

      return {
        status: 'ok',
        data: tables,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err?.message : 'An unknown error occurred';
      throw new QueryError('Could not fetch tables', errorMessage, {});
    } finally {
      if (knexInstance) {
        await knexInstance.destroy();
      }
    }
  }

  async invokeMethod(
    methodName: string,
    context: { user?: User; app?: App },
    sourceOptions: SourceOptions,
    args?: any
  ): Promise<any> {
    try {
      if (methodName === 'getTables') {
        return await this.listTables(sourceOptions);
      }
      throw new QueryError('Method not found', `Method ${methodName} is not supported for MSSQL plugin`, {
        availableMethods: ['getTables'],
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
