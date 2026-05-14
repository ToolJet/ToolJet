import { Knex, knex } from 'knex';
import oracledb from 'oracledb';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as unzipper from 'unzipper';
import {
  cacheConnectionWithConfiguration,
  generateSourceOptionsHash,
  getCachedConnection,
  ConnectionTestResult,
  QueryService,
  QueryResult,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';

export default class OracledbQueryService implements QueryService {
  private static _instance: OracledbQueryService;

  constructor() {
    if (OracledbQueryService._instance) {
      return OracledbQueryService._instance;
    }

    OracledbQueryService._instance = this;
    return OracledbQueryService._instance;
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    let result = {
      rows: [],
    };
    let query = '';

    if (queryOptions.mode === 'gui') {
      if (queryOptions.operation === 'bulk_update_pkey') {
        query = await this.buildBulkUpdateQuery(queryOptions);
      } else {
        return await this.handleGuiOperations(sourceOptions, queryOptions, dataSourceId, dataSourceUpdatedAt);
      }
    } else {
      query = queryOptions.query;
    }

    const binds = this.isSqlParametersUsed(queryOptions)
      ? this.sanitizeQueryParams(queryOptions)
      : {};

    if (sourceOptions.use_tns_alias == 'thin') {
      try {
        const connection: any = await this.buildConnection(sourceOptions);
        result = await connection.execute(query, binds, {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
          autoCommit: true,
        });
        await connection.close();
        return {
          status: 'ok',
          data: result.rows,
        };
      } catch (err) {
        throw err;
      }
    }

    let knexInstance;
    let checkCache = true;

    try {
      if (sourceOptions['allow_dynamic_connection_parameters']) {
        const qo = queryOptions as any;
        sourceOptions.host = qo.host || sourceOptions.host;
        sourceOptions.database = qo.database || sourceOptions.database;
      }

      checkCache = sourceOptions['allow_dynamic_connection_parameters'] ? false : true;

      knexInstance = await this.getConnection(sourceOptions, {}, checkCache, dataSourceId, dataSourceUpdatedAt);

      result = await knexInstance.raw(query, binds);

      return {
        status: 'ok',
        data: result,
      };
    } catch (err) {
      throw err;
    } finally {
      if (!checkCache && knexInstance) {
        await knexInstance.destroy();
      }
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    if (sourceOptions.use_tns_alias == 'thin') {
      const connection: any = await this.buildConnection(sourceOptions);
      await connection.execute('SELECT * FROM v$version');
      await connection.close();
      return {
        status: 'ok',
      };
    }
    const knexInstance = await this.getConnection(sourceOptions, {}, false);
    await knexInstance.raw('SELECT * FROM v$version');
    knexInstance.destroy();

    return {
      status: 'ok',
    };
  }

  // If in Windows, you use backslashes in the libDir string, you will
  // need to double them.
  // clientOpts = { libDir: 'C:\\oracle\\instantclient_19_19' };
  // else on other platforms like Linux
  // the system library search path MUST always be
  // set before Node.js is started, for example with ldconfig or LD_LIBRARY_PATH.
  initOracleClient(clientPathType: string, customPath: string, instantClientVersion: string, initOptions: any = {}) {
    try {
      const clientOpts: any = { ...initOptions };

      if (clientPathType === 'custom') {
        clientOpts.libDir = customPath;
      } else if (clientPathType === 'default') {
        clientOpts.libDir = `/opt/oracle/instantclient_${instantClientVersion}`;
      }

      // enable node-oracledb Thick mode
      oracledb.initOracleClient(clientOpts);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async buildConnection(sourceOptions: SourceOptions) {
    try {
      if (sourceOptions.use_tns_alias == 'thin' && sourceOptions.wallet_file) {
        const base64Data = sourceOptions.wallet_file.split(',')[1] || sourceOptions.wallet_file;
        const buffer = Buffer.from(base64Data, 'base64');

        const tempWalletDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oracle-wallet-'));
        const zipPath = path.join(tempWalletDir, 'wallet.zip');

        fs.writeFileSync(zipPath, buffer);
        await fs
          .createReadStream(zipPath)
          .pipe(unzipper.Extract({ path: tempWalletDir }))
          .promise();

        const extractedContents = fs
          .readdirSync(tempWalletDir)
          .filter((f) => f !== 'wallet.zip' && !f.startsWith('__MACOSX'));

        if (
          extractedContents.length === 1 &&
          fs.statSync(path.join(tempWalletDir, extractedContents[0])).isDirectory()
        ) {
          sourceOptions.config_dir = path.join(tempWalletDir, extractedContents[0]);
          sourceOptions.wallet_file_path = sourceOptions.config_dir;
        } else {
          sourceOptions.config_dir = tempWalletDir;
          sourceOptions.wallet_file_path = sourceOptions.config_dir;
        }
      }

      try {
        const initOptions: any = {};

        if (sourceOptions.use_tns_alias == 'thick' && sourceOptions.config_dir) {
          initOptions.configDir = sourceOptions.config_dir;
        }
        if (sourceOptions.use_tns_alias != 'thin')
          this.initOracleClient(
            sourceOptions.client_path_type,
            sourceOptions.path,
            sourceOptions.instant_client_version,
            initOptions
          );
      } catch (err) {
        console.error('Oracle client failed to initialize', err);
        //SKIP THrowing error since oracle node driver caches the request
        //TODO Cache the Oracle client initialization result to avoid repeated initialization attempts
      }

      const connectionConfig: any = {
        user: sourceOptions.username,
        password: sourceOptions.password,
      };
      if (sourceOptions.use_tns_alias == 'thick' || sourceOptions.use_tns_alias == 'thin') {
        connectionConfig.connectString = sourceOptions.tns_alias;

        if (sourceOptions.config_dir) {
          connectionConfig.walletLocation = sourceOptions.wallet_file_path || sourceOptions.config_dir;
          connectionConfig.configDir = sourceOptions.config_dir;
        }
        if (sourceOptions.wallet_password) {
          connectionConfig.walletPassword = sourceOptions.wallet_password;
        }
      } else {
        connectionConfig.connectString = `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${sourceOptions.host})(PORT=${sourceOptions.port}))(CONNECT_DATA=(SERVER=DEDICATED)(${sourceOptions.database_type}=${sourceOptions.database})))`;
        connectionConfig.ssl = sourceOptions.ssl_enabled;
      }

      const config: Knex.Config = {
        client: 'oracledb',
        connection: connectionConfig,
      };
      if (sourceOptions.use_tns_alias == 'thin') {
        const connection = await oracledb.getConnection(connectionConfig);
        return connection;
      }

      return knex(config);
    } catch (err) {
      console.error('Error building OracleDB connection:', err);
      throw err;
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

  private isSqlParametersUsed(queryOptions: QueryOptions): boolean {
    const { query_params } = queryOptions;
    const queryParams = query_params || [];
    return queryParams.filter(([key]) => key?.trim()).length > 0;
  }

  private sanitizeQueryParams(queryOptions: QueryOptions) {
    const { query_params } = queryOptions;
    const queryParams = query_params || [];
    return Object.fromEntries(queryParams.filter(([key]) => key?.trim()));
  }

  async buildBulkUpdateQuery(queryOptions: any): Promise<string> {
    let queryText = '';

    const tableName = queryOptions['table'];
    const primaryKey = queryOptions['primary_key_column'];
    const records = queryOptions['records'];

    for (const record of records) {
      queryText = `${queryText} UPDATE ${tableName} SET`;

      for (const key of Object.keys(record)) {
        if (key !== primaryKey) {
          queryText = ` ${queryText} ${key} = '${record[key]}',`;
        }
      }

      queryText = queryText.slice(0, -1);
      queryText = `begin ${queryText} WHERE ${primaryKey} = ${record[primaryKey]}; end;`;
    }

    return queryText.trim();
  }

  // ─── invokeMethod ─────────────────────────────────────────────────────────────

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
      const result = await this.listTables(sourceOptions, args?.dataSourceId || '', args?.dataSourceUpdatedAt || '', {
        search: args?.search,
        page: args?.page,
        limit: args?.limit,
      });

      const payload = (result as any)?.data ?? [];

      if (isPaginated) {
        const rows       = (payload as any)?.rows ?? [];
        const totalCount = (payload as any)?.totalCount ?? 0;
        return {
          items:      rows.map((r: any) => ({ label: String(r.value), value: String(r.value) })),
          totalCount,
        };
      }

      const rows = Array.isArray(payload) ? payload : [];
      return { status: 'ok', data: rows };
    }

    throw new Error(`Method '${methodName}' is not supported by the OracleDB plugin`);
  }

  // ─── Meta queries ─────────────────────────────────────────────────────────────

  // ─── Public method (mirrors PostgreSQL's listTables) ─────────────────────────

  async listTables(
    sourceOptions: SourceOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    queryOptions?: { search?: string; page?: number; limit?: number }
  ): Promise<QueryResult> {
    const result = await this._fetchTables(
      sourceOptions,
      queryOptions?.search || '',
      queryOptions?.page,
      queryOptions?.limit,
    );

    if (queryOptions?.limit) {
      // paginated — result is { items, totalCount }
      const { items, totalCount } = result as { items: any[]; totalCount: number };
      return {
        status: 'ok',
        data: { rows: items, totalCount },
      };
    }

    return { status: 'ok', data: result };
  }

  private async _fetchTables(
    sourceOptions: SourceOptions,
    search = '',
    page?: number,
    limit?: number,
  ): Promise<
    Array<{ value: string; label: string }> |
    { items: Array<{ value: string; label: string }>; totalCount: number }
  > {
    const isThin = sourceOptions.use_tns_alias === 'thin';
    const conn = await this.buildConnection(sourceOptions);

    try {
      const searchPattern = `%${search.toUpperCase()}%`;

      if (limit) {
        const offset  = ((page || 1) - 1) * limit;
        const startRow = offset + 1;
        const endRow   = offset + limit;

        // Oracle 11g-compatible pagination — no FETCH FIRST / OFFSET (needs 12c+)
        const dataSql = `
          SELECT table_name FROM (
            SELECT table_name, ROWNUM AS rn FROM (
              SELECT table_name
              FROM   user_tables
              WHERE  table_name LIKE ${isThin ? ':1' : '?'}
              ORDER  BY table_name
            ) WHERE ROWNUM <= ${endRow}
          ) WHERE rn >= ${startRow}
        `;

        const countSql = `
          SELECT COUNT(*) AS total
          FROM   user_tables
          WHERE  table_name LIKE ${isThin ? ':1' : '?'}
        `;

        const [dataRows, countRows] = await Promise.all([
          this.execSql(conn, dataSql, [searchPattern], isThin),
          this.execSql(conn, countSql, [searchPattern], isThin),
        ]);

        const totalCount = parseInt(String(countRows[0]?.TOTAL ?? countRows[0]?.total ?? '0'), 10);

        return {
          items: dataRows.map((r: any) => ({
            value: String(r.TABLE_NAME ?? r.table_name),
            label: String(r.TABLE_NAME ?? r.table_name),
          })),
          totalCount,
        };
      }

      const dataSql = `
        SELECT table_name
        FROM   user_tables
        WHERE  table_name LIKE ${isThin ? ':1' : '?'}
        ORDER  BY table_name
      `;

      const dataRows = await this.execSql(conn, dataSql, [searchPattern], isThin);

      return dataRows.map((r: any) => ({
        value: String(r.TABLE_NAME ?? r.table_name),
        label: String(r.TABLE_NAME ?? r.table_name),
      }));
    } finally {
      isThin ? await (conn as any).close() : await (conn as any).destroy();
    }
  }

  private async _fetchColumns(
    sourceOptions: SourceOptions,
    table: string,
  ): Promise<Array<{ value: string; label: string }>> {
    if (!table) return [];

    const isThin = sourceOptions.use_tns_alias === 'thin';
    const conn = await this.buildConnection(sourceOptions);

    try {
      const sql = `
        SELECT column_name
        FROM   user_tab_columns
        WHERE  table_name = ${isThin ? ':1' : '?'}
        ORDER  BY column_id
      `;

      const rows = await this.execSql(conn, sql, [table.toUpperCase()], isThin);

      return rows.map((r: any) => ({
        value: String(r.COLUMN_NAME ?? r.column_name),
        label: String(r.COLUMN_NAME ?? r.column_name),
      }));
    } finally {
      isThin ? await (conn as any).close() : await (conn as any).destroy();
    }
  }

  // ─── GUI Operations ───────────────────────────────────────────────────────────

  private async handleGuiOperations(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string
  ): Promise<QueryResult> {
    const isThin = sourceOptions.use_tns_alias === 'thin';

    if (isThin) {
      const conn = await this.buildConnection(sourceOptions);
      try {
        return await this.dispatchGuiOperation(conn, queryOptions, true);
      } finally {
        await (conn as any).close();
      }
    } else {
      const checkCache = !sourceOptions.allow_dynamic_connection_parameters;
      const conn = await this.getConnection(sourceOptions, {}, checkCache, dataSourceId, dataSourceUpdatedAt);
      try {
        return await this.dispatchGuiOperation(conn, queryOptions, false);
      } finally {
        if (!checkCache) {
          await (conn as any).destroy();
        }
      }
    }
  }

  private async dispatchGuiOperation(conn: any, queryOptions: QueryOptions, isThin: boolean): Promise<QueryResult> {
    switch (queryOptions.operation) {
      case 'list_rows':        return await this.guiListRows(conn, queryOptions, isThin);
      case 'create_row':       return await this.guiCreateRow(conn, queryOptions, isThin);
      case 'update_rows':      return await this.guiUpdateRows(conn, queryOptions, isThin);
      case 'delete_rows':      return await this.guiDeleteRows(conn, queryOptions, isThin);
      case 'upsert_rows':      return await this.guiUpsertRows(conn, queryOptions, isThin);
      case 'bulk_insert':      return await this.guiBulkInsert(conn, queryOptions, isThin);
      case 'bulk_upsert_pkey': return await this.guiBulkUpsertPkey(conn, queryOptions, isThin);
      default:
        throw new Error(`Unsupported GUI operation: ${queryOptions.operation}`);
    }
  }

  private async execSql(conn: any, sql: string, binds: any[], isThin: boolean): Promise<any[]> {
    if (isThin) {
      const result = await conn.execute(sql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: true,
      });
      return result.rows ?? [];
    } else {
      const result = await conn.raw(sql, binds);
      const rows = Array.isArray(result) ? result : Array.isArray(result?.rows) ? result.rows : [];
      return rows;
    }
  }

  private async execManySql(conn: any, sql: string, bindsArray: any[][], isThin: boolean): Promise<void> {
    if (isThin) {
      await conn.executeMany(sql, bindsArray, { autoCommit: true });
    } else {
      await conn.transaction(async (trx: any) => {
        for (const binds of bindsArray) {
          await trx.raw(sql, binds);
        }
      });
    }
  }

  private placeholder(i: number, isThin: boolean): string {
    return isThin ? `:${i + 1}` : '?';
  }

  private buildWhereClause(
    filters: Record<string, any>,
    isThin: boolean,
    offset = 0
  ): { clause: string; binds: any[] } {
    const entries = Object.values(filters);
    if (!entries.length) return { clause: '', binds: [] };

    const binds: any[] = [];
    const parts = entries.map((f: any, i: number) => {
      binds.push(f.value);
      return `${f.column} ${f.operator} ${this.placeholder(offset + i, isThin)}`;
    });

    return { clause: `WHERE ${parts.join(' AND ')}`, binds };
  }

  private buildSetClause(
    columns: Record<string, any>,
    isThin: boolean,
    offset = 0
  ): { clause: string; binds: any[] } {
    const entries = Object.values(columns);
    const binds: any[] = [];
    const parts = entries.map((c: any, i: number) => {
      binds.push(c.value);
      return `${c.column} = ${this.placeholder(offset + i, isThin)}`;
    });
    return { clause: parts.join(', '), binds };
  }

  private async guiListRows(conn: any, q: QueryOptions, isThin: boolean): Promise<QueryResult> {
    const { table, limit, offset } = q as any;
    const { where_filters, order_filters } = q.list_rows || {};

    let sql = `SELECT * FROM ${table}`;
    const binds: any[] = [];

    if (where_filters && Object.keys(where_filters).length) {
      const where = this.buildWhereClause(where_filters, isThin, 0);
      sql += ` ${where.clause}`;
      binds.push(...where.binds);
    }

    if (order_filters && Object.keys(order_filters).length) {
      const orderParts = Object.values(order_filters).map(
        (f: any) => `${f.column} ${f.direction ?? 'ASC'}`
      );
      sql += ` ORDER BY ${orderParts.join(', ')}`;
    }

    const parsedOffset = offset ? parseInt(String(offset)) : 0;
    const parsedLimit  = limit  ? parseInt(String(limit))  : 0;

    if (parsedOffset > 0 || parsedLimit > 0) {
      const inner = sql;
      if (parsedOffset > 0) {
        sql = `SELECT * FROM (SELECT a.*, ROWNUM rnum FROM (${inner}) a WHERE ROWNUM <= ${parsedOffset + parsedLimit}) WHERE rnum > ${parsedOffset}`;
      } else {
        sql = `SELECT * FROM (${inner}) WHERE ROWNUM <= ${parsedLimit}`;
      }
    }

    const rows = await this.execSql(conn, sql, binds, isThin);
    return { status: 'ok', data: rows };
  }

  private async guiCreateRow(conn: any, q: QueryOptions, isThin: boolean): Promise<QueryResult> {
    const { table } = q as any;
    const cols = Object.values(q.create_row?.columns ?? {});

    const names        = cols.map((c: any) => c.column).join(', ');
    const placeholders = cols.map((_: any, i: number) => this.placeholder(i, isThin)).join(', ');
    const binds        = cols.map((c: any) => c.value);

    const sql = `INSERT INTO ${table} (${names}) VALUES (${placeholders})`;

    await this.execSql(conn, sql, binds, isThin);
    return { status: 'ok', data: [] };
  }

  private async guiUpdateRows(conn: any, q: QueryOptions, isThin: boolean): Promise<QueryResult> {
    const { table } = q as any;
    const { columns, where_filters } = q.update_rows || {};
    if (!columns || !Object.keys(columns).length) throw new Error('update_rows: no columns provided');

    const { clause: setClause, binds: setBinds } = this.buildSetClause(columns, isThin, 0);
    const { clause: whereClause, binds: whereBinds } = this.buildWhereClause(
      where_filters ?? {},
      isThin,
      setBinds.length
    );

    const sql = `UPDATE ${table} SET ${setClause}${whereClause ? ` ${whereClause}` : ''}`;
    const binds = [...setBinds, ...whereBinds];

    await this.execSql(conn, sql, binds, isThin);
    return { status: 'ok', data: [] };
  }

  private async guiDeleteRows(conn: any, q: QueryOptions, isThin: boolean): Promise<QueryResult> {
    const { table, limit } = q as any;
    const { where_filters } = q.delete_rows || {};

    const { clause: whereClause, binds } = this.buildWhereClause(where_filters ?? {}, isThin, 0);

    let sql = `DELETE FROM ${table}`;
    if (whereClause && limit) {
      sql += ` ${whereClause} AND ROWNUM <= ${parseInt(String(limit))}`;
    } else if (whereClause) {
      sql += ` ${whereClause}`;
    } else if (limit) {
      sql += ` WHERE ROWNUM <= ${parseInt(String(limit))}`;
    }

    await this.execSql(conn, sql, binds, isThin);
    return { status: 'ok', data: [] };
  }

  private async guiUpsertRows(conn: any, q: QueryOptions, isThin: boolean): Promise<QueryResult> {
    const { table } = q as any;
    const cols = Object.values(q.upsert_rows?.columns ?? {});
    const pkRaw = (q as any).primary_key_columns ?? [];
    const pk: string[] = Array.isArray(pkRaw) ? pkRaw : [pkRaw];
    if (!cols.length) throw new Error('upsert_rows: no columns provided');
    if (!pk.length) throw new Error('upsert_rows: primary_key_columns is required');

    const allColNames = cols.map((c: any) => c.column);
    const binds       = cols.map((c: any) => c.value);

    const srcCols = cols.map((c: any, i: number) =>
      `${this.placeholder(i, isThin)} AS ${c.column}`
    ).join(', ');

    const onClause  = pk.map((k: string) => `t.${k} = s.${k}`).join(' AND ');
    const updateSet = allColNames
      .filter((c: string) => !pk.includes(c))
      .map((c: string) => `t.${c} = s.${c}`)
      .join(', ');
    const insertCols = allColNames.join(', ');
    const insertVals = allColNames.map((c: string) => `s.${c}`).join(', ');

    const sql = `
      MERGE INTO ${table} t
      USING (SELECT ${srcCols} FROM dual) s
      ON (${onClause})
      WHEN MATCHED THEN UPDATE SET ${updateSet}
      WHEN NOT MATCHED THEN INSERT (${insertCols}) VALUES (${insertVals})
    `;

    await this.execSql(conn, sql, binds, isThin);
    return { status: 'ok', data: [] };
  }

  private async guiBulkInsert(conn: any, q: QueryOptions, isThin: boolean): Promise<QueryResult> {
    const { table } = q as any;
    const rawRecords = (q as any).records ?? [];
    const records: Record<string, any>[] = typeof rawRecords === 'string'
      ? JSON.parse(rawRecords)
      : rawRecords;
    if (!records.length) return { status: 'ok', data: [] };

    const cols       = Object.keys(records[0]);
    const bindsArray = records.map((r) => cols.map((c) => r[c]));

    if (isThin) {
      const placeholders = cols.map((_: any, i: number) => `:${i + 1}`).join(', ');
      const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;
      await conn.executeMany(sql, bindsArray, { autoCommit: true });
    } else {
      const placeholders = cols.map(() => '?').join(', ');
      const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;
      await conn.transaction(async (trx: any) => {
        for (const binds of bindsArray) {
          await trx.raw(sql, binds);
        }
      });
    }

    return { status: 'ok', data: [] };
  }

  private async guiBulkUpsertPkey(conn: any, q: QueryOptions, isThin: boolean): Promise<QueryResult> {
    const rawRecords = (q as any).records ?? [];
    const records: Record<string, any>[] = typeof rawRecords === 'string'
      ? JSON.parse(rawRecords)
      : rawRecords;
    if (!records.length) return { status: 'ok', data: [] };

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const syntheticQ = {
        ...q,
        upsert_rows: {
          columns: Object.fromEntries(
            Object.keys(record).map((k) => [k, { column: k, value: record[k] }])
          ),
        },
      };
      await this.guiUpsertRows(conn, syntheticQ as any, isThin);
    }

    return { status: 'ok', data: [] };
  }
}