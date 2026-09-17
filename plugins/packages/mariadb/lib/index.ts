import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
  getCachedConnection,
  cacheConnectionWithConfiguration,
  generateSourceOptionsHash,
  createQueryBuilder,
  isEmpty,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import { Client } from 'ssh2';
const mariadb = require('mariadb');

// ─── SSH helper (mirrors MySQL implementation) ────────────────────────────────

function createSSHStream(sourceOptions: SourceOptions): Promise<{ client: Client; stream: NodeJS.ReadWriteStream }> {
  return new Promise((resolve, reject) => {
    const sshClient = new Client();

    sshClient.on('ready', () => {
      sshClient.forwardOut(
        '127.0.0.1',
        0,
        sourceOptions.host,
        Number(sourceOptions.port),
        (err, stream) => {
          if (err) {
            sshClient.end();
            return reject(err);
          }

          stream.on('error', (streamErr) => {
            console.error('SSH stream error (suppressed):', streamErr.message);
          });

          stream.on('close', () => {
            setImmediate(() => {
              try {
                if (sshClient) sshClient.destroy();
              } catch (e) {
                console.error('Error closing SSH client (suppressed):', (e as Error).message);
              }
            });
          });

          // MariaDB driver calls socket methods that SSH Channel streams don't implement
          const sshChannel: any = stream;
          if (typeof sshChannel.unref !== 'function')        sshChannel.unref        = () => {};
          if (typeof sshChannel.ref !== 'function')          sshChannel.ref          = () => {};
          if (typeof sshChannel.setKeepAlive !== 'function') sshChannel.setKeepAlive = () => {};
          if (typeof sshChannel.setNoDelay !== 'function')   sshChannel.setNoDelay   = () => {};

          resolve({ client: sshClient, stream });
        }
      );
    });

    sshClient.on('error', (err) => {
      reject(err);
    });

    sshClient.on('end', () => {
      console.log('SSH connection ended');
    });

    sshClient.on('close', () => {
      console.log('SSH connection closed');
    });

    sshClient.connect({
      host: sourceOptions.ssh_host,
      port: sourceOptions.ssh_port || 22,
      username: sourceOptions.ssh_username,
      ...(sourceOptions.ssh_auth_type === 'password'
        ? { password: sourceOptions.ssh_password }
        : {
            privateKey: sourceOptions.ssh_private_key,
            passphrase: sourceOptions.ssh_passphrase,
          }),
      readyTimeout: 20000,
      keepaliveInterval: 10000,
    });
  });
}

export default class Mariadb implements QueryService {
  private defaultConnectionLimit = '10';

  // MariaDB/MySQL hard limit for bound parameters in a single prepared statement.
  // Using 65_000 as a conservative buffer under the 65_535 hard cap.
  private static readonly PARAM_THRESHOLD = 65_000;

  // ─── run ─────────────────────────────────────────────────────────────────────

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    // ── Dynamic connection parameter overrides ────────────────────────────────
    if (sourceOptions.allow_dynamic_connection_parameters) {
      sourceOptions['host'] = queryOptions['host'] ? queryOptions['host'] : sourceOptions['host'];
      sourceOptions['database'] = queryOptions['database'] ? queryOptions['database'] : sourceOptions['database'];
    }

    const checkCache = !sourceOptions.allow_dynamic_connection_parameters;
    let conn;
    const pool = await this.getConnection(sourceOptions, {}, checkCache, dataSourceId, dataSourceUpdatedAt);

    try {
      conn = await pool.getConnection();

      switch (queryOptions.mode) {
        case 'gui':
          return await this.handleGuiQuery(conn, queryOptions);
        case 'sql':
        default:
          return await this.handleSqlQuery(conn, queryOptions);
      }
    } catch (error) {
      if (error instanceof QueryError) throw error;
      throw new QueryError('Query could not be completed', error.message, {});
    } finally {
      if (conn) conn.release();
      if (!checkCache) {
        try { await pool.end(); } catch (_) { /* ignore */ }
      }
    }
  }

  private connectionOptions(sourceOptions: SourceOptions) {
    const _connectionOptions = (sourceOptions?.connection_options || []).filter((o) => o.some((e) => !isEmpty(e)));
    const connectionOptions = Object.fromEntries(_connectionOptions);
    Object.keys(connectionOptions).forEach((key) =>
      connectionOptions[key] === '' ? delete connectionOptions[key] : {}
    );
    return connectionOptions;
  }

  // ─── SQL mode ────────────────────────────────────────────────────────────────

  private async handleSqlQuery(conn: any, queryOptions: QueryOptions): Promise<QueryResult> {
    const { query, query_params } = queryOptions;
    const queryParams = query_params || [];
    const sanitizedQueryParams: Record<string, any> = Object.fromEntries(
      queryParams.filter(([key]: [string, any]) => !isEmpty(key))
    );
    const rows = await conn.query(query, sanitizedQueryParams);
    return { status: 'ok', data: this.toJson(rows) };
  }

  // ─── GUI mode ────────────────────────────────────────────────────────────────

  private async handleGuiQuery(conn: any, queryOptions: QueryOptions): Promise<QueryResult> {
    const { operation, table } = queryOptions;
    const queryBuilder = createQueryBuilder('mariadb');

    try {
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
          const rows = await conn.query(query, params);
          return { status: 'ok', data: this.toJson(rows) };
        }

        case 'create_row': {
          const { columns } = queryOptions.create_row || {};
          const { query, params } = queryBuilder.createRow(table, undefined, columns) as {
            query: string;
            params: unknown[];
          };
          const result = await conn.query(query, params);
          return {
            status: 'ok',
            data: { insertId: result?.insertId != null ? Number(result.insertId) : null },
          };
        }

        case 'update_rows': {
          const { allow_multiple_updates = false, zero_records_as_success = false } = queryOptions;
          const { columns, where_filters } = queryOptions.update_rows || {};

          const hasWhereFilters = where_filters && Object.keys(where_filters).length > 0;
          if (!hasWhereFilters) {
            throw new QueryError(
              'Query could not be completed',
              'Update rows requires at least one filter condition.',
              {}
            );
          }

          const { query, params } = queryBuilder.updateRows(table, { columns, where_filters }) as {
            query: string;
            params: unknown[];
          };

          const affectedRows = await this.executeWriteInTransaction(conn, query, params as unknown[], {
            allow_multiple_updates: this._normalizeBool(allow_multiple_updates),
            zero_records_as_success: this._normalizeBool(zero_records_as_success),
            operationLabel: 'updated',
          });

          return { status: 'ok', data: { affectedRows } };
        }

        case 'upsert_rows': {
          const { allow_multiple_updates = false, zero_records_as_success = false } = queryOptions;
          const { primary_key_columns } = queryOptions;
          const { columns } = queryOptions.upsert_rows || {};

          const { query, params } = queryBuilder.upsertRows(table, {
            primary_key_columns,
            columns,
          }) as { query: string; params: unknown[] };

          const rawAffected = await this.executeWriteInTransaction(conn, query, params as unknown[], {
            allow_multiple_updates: this._normalizeBool(allow_multiple_updates),
            zero_records_as_success: this._normalizeBool(zero_records_as_success),
            operationLabel: 'upserted',
            normalizeAffectedRows: (n) => (n === 2 ? 1 : n),
          });

          return { status: 'ok', data: { affectedRows: rawAffected } };
        }

        case 'delete_rows': {
          const { limit, allow_multiple_updates = false, zero_records_as_success = false } = queryOptions;
          const { where_filters } = queryOptions.delete_rows || {};

          const hasWhereFilters = where_filters && Object.keys(where_filters).length > 0;
          const hasLimit = limit != null && limit !== '';
          if (!hasWhereFilters && !hasLimit) {
            throw new QueryError(
              'Query could not be completed',
              'delete_rows requires at least one filter condition or a limit to prevent accidental mass deletions.',
              {}
            );
          }

          const { query, params } = queryBuilder.deleteRows(table, { where_filters, limit }) as {
            query: string;
            params: unknown[];
          };

          const affectedRows = await this.executeWriteInTransaction(conn, query, params as unknown[], {
            allow_multiple_updates: this._normalizeBool(allow_multiple_updates),
            zero_records_as_success: this._normalizeBool(zero_records_as_success),
            operationLabel: 'deleted',
          });

          return { status: 'ok', data: { affectedRows } };
        }

        case 'bulk_insert': {
          const { records } = queryOptions;
          const batches = this.splitIntoBatches(records, this.computeBatchSize(records));

          const batchQueries: { query: string; params: unknown[] }[] = batches.map((batch) => {
            return queryBuilder.bulkInsert(table, { rows_insert: batch }) as {
              query: string;
              params: unknown[];
            };
          });

          const totalAffected = await this.executeBulkInTransaction(conn, batchQueries);
          return { status: 'ok', data: { affectedRows: totalAffected } };
        }

        case 'bulk_update_pkey': {
          const { primary_key_columns, records } = queryOptions;
          const batches = this.splitIntoBatches(records, this.computeBatchSize(records));

          const allQueries: { query: string; params: unknown[] }[] = [];
          for (const batch of batches) {
            const { queries } = queryBuilder.bulkUpdateWithPrimaryKey(table, {
              primary_key: primary_key_columns,
              rows_update: batch,
            }) as { queries: { query: string; params: unknown[] }[] };
            allQueries.push(...queries);
          }

          const totalAffected = await this.executeBulkInTransaction(conn, allQueries);
          return { status: 'ok', data: { affectedRows: totalAffected }, bulk_update_status: 'success' } as any;
        }

        case 'bulk_upsert_pkey': {
          const { primary_key_columns, records } = queryOptions;
          const batches = this.splitIntoBatches(records, this.computeBatchSize(records));

          const allQueries: { query: string; params: unknown[] }[] = [];
          for (const batch of batches) {
            const { queries } = queryBuilder.bulkUpsertWithPrimaryKey(table, {
              primary_key: primary_key_columns,
              row_upsert: batch,
            }) as { queries: { query: string; params: unknown[] }[] };
            allQueries.push(...queries);
          }

          const totalAffected = await this.executeBulkInTransaction(conn, allQueries);
          return { status: 'ok', data: { affectedRows: totalAffected }, bulk_upsert_status: 'success' } as any;
        }

        default:
          throw new QueryError('Query could not be completed', `Unsupported GUI operation: "${operation}"`, {});
      }
    } catch (error) {
      if (error instanceof QueryError) throw error;
      throw new QueryError('Query could not be completed', error.message, {});
    }
  }

  // ─── Transaction helpers ──────────────────────────────────────────────────────

  private async executeWriteInTransaction(
    conn: any,
    query: string,
    params: unknown[],
    options: {
      allow_multiple_updates?: boolean;
      zero_records_as_success?: boolean;
      operationLabel: string;
      normalizeAffectedRows?: (n: number) => number;
    }
  ): Promise<number> {
    const { allow_multiple_updates, zero_records_as_success, operationLabel, normalizeAffectedRows } = options;
    const hasConstraints = allow_multiple_updates === false || zero_records_as_success === false;

    if (!hasConstraints) {
      const result = await conn.query(query, params);
      const raw = Number(result?.affectedRows ?? 0);
      return normalizeAffectedRows ? normalizeAffectedRows(raw) : raw;
    }

    await conn.beginTransaction();
    try {
      const result = await conn.query(query, params);
      const raw = Number(result?.affectedRows ?? 0);
      const affectedRows = normalizeAffectedRows ? normalizeAffectedRows(raw) : raw;

      if (allow_multiple_updates === false && affectedRows > 1) {
        await conn.rollback();
        throw new QueryError(
          'Query could not be completed',
          `Query matches more than one row. Enable "Allow this Query to ${operationLabel} multiple rows" to permit this.`,
          {}
        );
      }

      if (zero_records_as_success === false && affectedRows === 0) {
        await conn.rollback();
        throw new QueryError('Query could not be completed', `No rows were ${operationLabel}.`, {});
      }

      await conn.commit();
      return affectedRows;
    } catch (error) {
      try { await conn.rollback(); } catch (_) { /* ignore secondary rollback errors */ }
      throw error;
    }
  }

  private async executeBulkInTransaction(
    conn: any,
    queries: { query: string; params: unknown[] }[]
  ): Promise<number> {
    let totalAffected = 0;
    await conn.beginTransaction();
    try {
      for (const { query, params } of queries) {
        const result = await conn.query(query, params);
        totalAffected += Number(result?.affectedRows ?? 0);
      }
      await conn.commit();
      return totalAffected;
    } catch (error) {
      try { await conn.rollback(); } catch (_) { /* ignore secondary rollback errors */ }
      throw error;
    }
  }


  async invokeMethod(methodName: string, _context: unknown, sourceOptions: SourceOptions, args?: any): Promise<any> {
    if (methodName === 'listTables') {
      return await this._fetchTables(sourceOptions, args?.search || '', args?.page, args?.limit);
    }
    if (methodName === 'listColumns') {
      const table = args?.values?.table || '';
      return await this._fetchColumns(sourceOptions, table);
    }
    if (methodName === 'getTables') {
      const isPaginated = !!args?.limit;
      const result = await this._fetchTables(sourceOptions, args?.search || '', args?.page, args?.limit);
      if (isPaginated) return result;
      const rows = Array.isArray(result) ? result : [];
      return { status: 'ok', data: rows };
    }
    throw new QueryError('Method not found', `Method '${methodName}' is not supported by the MariaDB plugin`, {});
  }


  private async _fetchTables(
    sourceOptions: SourceOptions,
    search = '',
    page?: number,
    limit?: number
  ): Promise<
    | Array<{ value: string; label: string }>
    | { items: Array<{ value: string; label: string }>; totalCount: number }
  > {
    let conn;
    try {
      conn = await this.buildTestConnection(sourceOptions);
      const db = sourceOptions.database;
      const searchPattern = `%${search}%`;

      if (limit) {
        const offset = ((page || 1) - 1) * limit;
        const rows: any[] = await conn.query(
          `SELECT TABLE_NAME FROM information_schema.TABLES
           WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME LIKE ?
           ORDER BY TABLE_NAME LIMIT ? OFFSET ?`,
          [db, searchPattern, limit, offset]
        );
        const countRows: any[] = await conn.query(
          `SELECT COUNT(*) AS total FROM information_schema.TABLES
           WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME LIKE ?`,
          [db, searchPattern]
        );
        const totalCount = parseInt(countRows?.[0]?.total ?? '0', 10);
        return {
          items: rows.map((r: any) => ({ value: r.TABLE_NAME, label: r.TABLE_NAME })),
          totalCount,
        };
      }

      const rows: any[] = await conn.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME LIKE ?
         ORDER BY TABLE_NAME`,
        [db, searchPattern]
      );
      return rows.map((r: any) => ({ value: r.TABLE_NAME, label: r.TABLE_NAME }));
    } catch (err) {
      throw new QueryError('Could not fetch tables', err.message, {});
    } finally {
      if (conn) try { await conn.end(); } catch (_) { /* ignore */ }
    }
  }

  private async _fetchColumns(
    sourceOptions: SourceOptions,
    table: string
  ): Promise<Array<{ value: string; label: string }>> {
    let conn;
    try {
      conn = await this.buildTestConnection(sourceOptions);
      const db = sourceOptions.database;
      const rows: any[] = await conn.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
        [db, table]
      );
      return rows.map((r: any) => ({ value: r.COLUMN_NAME, label: r.COLUMN_NAME }));
    } catch (err) {
      throw new QueryError('Could not fetch columns', err.message, {});
    } finally {
      if (conn) try { await conn.end(); } catch (_) { /* ignore */ }
    }
  }


  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    let conn;

    try {
      conn = await this.buildTestConnection(sourceOptions);
      const rows = await conn.query('SELECT 1 as val');
      if (!rows) throw new Error('Connection test returned no results');
      return { status: 'ok' };
    } catch (error) {
      throw new QueryError(`Connection test failed: ${error.sqlMessage}`, error.message, {});
    } finally {
      if (conn) try { await conn.end(); } catch (_) { /* ignore */ }
    }
  }


  private buildSSLObject(sourceOptions: SourceOptions, isSSH = false): any | null {
    if (!sourceOptions.ssl_enabled) return null;
    if (isSSH && (sourceOptions.ssl_certificate ?? 'none') === 'none') return null;
    const sslObject: any = { rejectUnauthorized: (sourceOptions.ssl_certificate ?? 'none') !== 'none' };
    if (sourceOptions.ssl_certificate === 'ca_certificate') {
      sslObject.ca = sourceOptions.ca;
    }
    if (sourceOptions.ssl_certificate === 'self_signed') {
      sslObject.ca = sourceOptions.ca;
      sslObject.cert = sourceOptions.cert;
      sslObject.key = sourceOptions.key;
    }
    return sslObject;
  }

  private async buildConnectionPool(sourceOptions: SourceOptions): Promise<any> {
    const connectionLimit =
      sourceOptions.connectionLimit && sourceOptions.connectionLimit !== ''
        ? sourceOptions.connectionLimit
        : this.defaultConnectionLimit;

    const sslObject = this.buildSSLObject(sourceOptions, sourceOptions.ssh_enabled === 'enabled');

    if (sourceOptions.ssh_enabled === 'enabled') {
      const poolConfig: any = {
        user: sourceOptions.user,
        password: sourceOptions.password,
        database: sourceOptions.database,
        stream: (cb: (err: Error | null, stream: any) => void) => {
          createSSHStream(sourceOptions)
            .then(({ stream }) => cb(null, stream))
            .catch((err) => {
              console.error('[MariaDB][pool][SSH] SSH stream creation failed:', err.message);
              cb(err, null);
            });
        },
        namedPlaceholders: true,
        multipleStatements: true,
        connectionLimit,
        connectTimeout: 60000,
        minConnections: 0,
        ...(sslObject ? { ssl: sslObject } : {}),
      };
      try {
        const pool = mariadb.createPool({
          ...poolConfig,
          ...this.connectionOptions(sourceOptions),
        });
        pool.on('error', (error: any) => console.error(error));
        return pool;
      } catch (error) {
        console.error('Error while creating database connection pool:', error.message);
        throw new QueryError('Database connection failed', error.message, {});
      }
    }

    // ── Direct connection ─────────────────────────────────────────────────────
    const poolConfig: any = {
      host: sourceOptions.host,
      user: sourceOptions.user,
      password: sourceOptions.password,
      port: sourceOptions.port,
      database: sourceOptions.database,
      namedPlaceholders: true,
      multipleStatements: true,
      connectionLimit,
      connectTimeout: 60000,
      minConnections: 0,
      ...(sslObject ? { ssl: sslObject } : {}),
    };

    try {
      const pool = mariadb.createPool({
        ...poolConfig,
        ...this.connectionOptions(sourceOptions), 
      });
      pool.on('error', (error: any) => console.error(error));
      return pool;
    } catch (error) {
      console.error('Error while creating database connection pool:', error.message);
      throw new QueryError('Database connection failed', error.message, {});
    }
  }

  private async buildTestConnection(sourceOptions: SourceOptions): Promise<any> {
    const sslObject = this.buildSSLObject(sourceOptions, sourceOptions.ssh_enabled === 'enabled');

    // ── SSH tunnel ────────────────────────────────────────────────────────────
    if (sourceOptions.ssh_enabled === 'enabled') {
      const connectionConfig: any = {
        user: sourceOptions.user,
        password: sourceOptions.password,
        database: sourceOptions.database,
        stream: (callback: any) => {
          createSSHStream(sourceOptions)
            .then(({ stream }) => {
              callback(null, stream);
            })
            .catch((err) => {
              callback(err);
            });
        },
        namedPlaceholders: true,
        connectTimeout: 60000,
        ...(sslObject ? { ssl: sslObject } : {}),
      };
      try {
        return await mariadb.createConnection(connectionConfig);
      } catch (error) {
        console.error('Error while establishing database connection:', error.message);
        throw new QueryError('Database connection failed', error.message, {});
      }
    }

    // ── Direct connection ─────────────────────────────────────────────────────
    const connectionConfig: any = {
      host: sourceOptions.host,
      user: sourceOptions.user,
      password: sourceOptions.password,
      port: sourceOptions.port,
      database: sourceOptions.database,
      namedPlaceholders: true,
      connectTimeout: 60000,
      ...(sslObject ? { ssl: sslObject } : {}),
    };

    try {
      return await mariadb.createConnection(connectionConfig);
    } catch (error) {
      console.error('Error while establishing database connection:', error.message);
      throw new QueryError('Database connection failed', error.message, {});
    }
  }

  async getConnection(
    sourceOptions: SourceOptions,
    options: any,
    checkCache: boolean,
    dataSourceId?: string,
    dataSourceUpdatedAt?: string
  ): Promise<any> {
    if (checkCache) {
      const optionsHash = generateSourceOptionsHash(sourceOptions);
      const enhancedCacheKey = `${dataSourceId}_${optionsHash}`;
      const cachedPool = await getCachedConnection(enhancedCacheKey, dataSourceUpdatedAt);
      if (cachedPool) return cachedPool;

      const pool = await this.buildConnectionPool(sourceOptions);
      cacheConnectionWithConfiguration(dataSourceId, enhancedCacheKey, pool);
      return pool;
    }
    return this.buildConnectionPool(sourceOptions);
  }


  private computeBatchSize(records: Record<string, unknown>[]): number {
    if (!records || records.length === 0) return 1000;
    const SAMPLE_SIZE = 500;
    const sample =
      records.length <= SAMPLE_SIZE * 2
        ? records
        : [...records.slice(0, SAMPLE_SIZE), ...records.slice(-SAMPLE_SIZE)];
    const numColumns = Math.max(...sample.map((r) => Object.keys(r).length));
    if (numColumns === 0) return 1000;
    return Math.max(1, Math.floor(Mariadb.PARAM_THRESHOLD / numColumns));
  }

  private splitIntoBatches<T>(records: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }
    return batches;
  }


  private _normalizeBool(val: unknown): boolean | undefined {
    if (val === true || val === 'true') return true;
    if (val === false || val === 'false') return false;
    return undefined;
  }

  private toJson(data: any): any {
    return JSON.parse(
      JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? `${v}n` : v)).replace(/"(-?\d+)n"/g, (_, a) => a)
    );
  }
}