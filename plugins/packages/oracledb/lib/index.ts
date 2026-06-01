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
  QueryError,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';

// Maximum number of bind parameters Oracle supports reliably
const ORACLE_MAX_BIND_PARAMS = 1000;

// Operator key → SQL symbol map (mirrors QueryBuilder in common)
const ORACLE_OPERATORS: Record<string, string> = {
  eq:      '=',
  neq:     '!=',
  gt:      '>',
  gte:     '>=',
  lt:      '<',
  lte:     '<=',
  like:    'LIKE',
  ilike:   'LIKE',   // Oracle has no ILIKE, fall back to LIKE
  in:      'IN',
  not_in:  'NOT IN',
};

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
      let connection: any;
      try {
        connection = await this.buildConnection(sourceOptions);
        result = await connection.execute(query, binds, {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
          autoCommit: true,
        });
        return {
          status: 'ok',
          data: result.rows,
        };
      } catch (err) {
        const errorMessage = err.message || 'An unknown error occurred';
        throw new QueryError('Query could not be completed', errorMessage, {
          code: err.code || null,
        });
      } finally {
        if (connection) {
          await connection.close();
        }
      }
    }

    let knexInstance;
    let checkCache = true;

    try {
      checkCache = true;

      knexInstance = await this.getConnection(sourceOptions, {}, checkCache, dataSourceId, dataSourceUpdatedAt);

      result = await knexInstance.raw(query, binds);

      return {
        status: 'ok',
        data: result,
      };
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred';
      throw new QueryError('Query could not be completed', errorMessage, {
        code: err.code || null,
      });
    } finally {
      if (!checkCache && knexInstance) {
        await knexInstance.destroy();
      }
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    if (sourceOptions.use_tns_alias == 'thin') {
      let connection: any;
      try {
        connection = await this.buildConnection(sourceOptions);
        await connection.execute('SELECT * FROM v$version');
        return { status: 'ok' };
      } catch (err) {
        const errorMessage = err.message || 'Connection test failed';
        throw new QueryError('Connection test failed', errorMessage, {
          code: err.code || null,
        });
      } finally {
        if (connection) {
          await connection.close();
        }
      }
    }

    let knexInstance: Knex | undefined;
    try {
      knexInstance = await this.getConnection(sourceOptions, {}, false);
      await knexInstance.raw('SELECT * FROM v$version');
      return { status: 'ok' };
    } catch (err) {
      const errorMessage = err.message || 'Connection test failed';
      throw new QueryError('Connection test failed', errorMessage, {
        code: err.code || null,
      });
    } finally {
      if (knexInstance) {
        await knexInstance.destroy();
      }
    }
  }
  // If in Windows, you use backslashes in the libDir string, you will
  // need to double them.
  // clientOpts = { libDir: 'C:\\oracle\\instantclient_19_19' };
  // else on other platforms like Linux
  // the system library search path MUST always be
  // set before Node.js is started, for example with ldconfig or LD_LIBRARY_PATH.
  initOracleClient(clientPathType: string, customPath: string,instantClientVersion: string, initOptions: any = {}) {
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
      if ((sourceOptions.use_tns_alias == 'thin' || sourceOptions.use_tns_alias == 'thick') && sourceOptions.wallet_file) {
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
    if (methodName === 'listSchemas') {
      return await this._fetchSchemas(sourceOptions);
    }

    if (methodName === 'listTables') {
      const schema = args?.values?.schema || null;
      return await this._fetchTables(sourceOptions, schema, args?.search || '', args?.page, args?.limit);
    }

    if (methodName === 'listColumns') {
      const schema = args?.values?.schema || null;
      const table = args?.values?.table || '';
      return await this._fetchColumns(sourceOptions, table, schema);
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

    throw new QueryError(
      `Method '${methodName}' is not supported by the OracleDB plugin`,
      `Method '${methodName}' is not supported`,
      {}
    );
  }

  // ─── Meta queries ─────────────────────────────────────────────────────────────

  private async _fetchSchemas(
    sourceOptions: SourceOptions
  ): Promise<Array<{ value: string; label: string }>> {
    const isThin = sourceOptions.use_tns_alias === 'thin';
    const conn = await this.buildConnection(sourceOptions);

    try {
      const sql = `
        SELECT DISTINCT owner AS schema_name
        FROM   all_tables
        ORDER  BY owner
      `;

      const rows = await this.execSql(conn, sql, [], isThin);

      return rows.map((r: any) => ({
        value: String(r.SCHEMA_NAME ?? r.schema_name),
        label: String(r.SCHEMA_NAME ?? r.schema_name),
      }));
    } finally {
      isThin ? await (conn as any).close() : await (conn as any).destroy();
    }
  }

  async listTables(
    sourceOptions: SourceOptions,
    dataSourceId: string,
    dataSourceUpdatedAt: string,
    queryOptions?: { schema?: string; search?: string; page?: number; limit?: number }
  ): Promise<QueryResult> {
    const result = await this._fetchTables(
      sourceOptions,
      queryOptions?.schema || null,
      queryOptions?.search || '',
      queryOptions?.page,
      queryOptions?.limit,
    );

    if (queryOptions?.limit) {
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
    schema: string | null = null,
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
      const useAllTables = schema && schema.trim().length > 0;

      const tableSource = useAllTables ? 'all_tables' : 'user_tables';
      const schemaFilter = useAllTables
        ? (isThin ? `owner = :owner AND table_name LIKE :1` : `owner = ? AND table_name LIKE ?`)
        : (isThin ? `table_name LIKE :1` : `table_name LIKE ?`);

      const baseParams = useAllTables
        ? (isThin ? { owner: schema.toUpperCase(), 1: searchPattern } : [schema.toUpperCase(), searchPattern])
        : (isThin ? [searchPattern] : [searchPattern]);

      if (limit) {
        const offset  = ((page || 1) - 1) * limit;
        const startRow = offset + 1;
        const endRow   = offset + limit;

        let dataSql: string;
        let countSql: string;
        let dataParams: any;
        let countParams: any;

        if (isThin) {
          dataSql = `
            SELECT table_name FROM (
              SELECT table_name, ROWNUM AS rn FROM (
                SELECT table_name
                FROM   ${tableSource}
                WHERE  ${schemaFilter}
                ORDER  BY table_name
              ) WHERE ROWNUM <= ${endRow}
            ) WHERE rn >= ${startRow}
          `;
          countSql = `
            SELECT COUNT(*) AS total
            FROM   ${tableSource}
            WHERE  ${schemaFilter}
          `;
          dataParams  = useAllTables ? { owner: schema.toUpperCase(), 1: searchPattern } : [searchPattern];
          countParams = useAllTables ? { owner: schema.toUpperCase(), 1: searchPattern } : [searchPattern];
        } else {
          dataSql = `
            SELECT table_name FROM (
              SELECT table_name, ROWNUM AS rn FROM (
                SELECT table_name
                FROM   ${tableSource}
                WHERE  ${schemaFilter}
                ORDER  BY table_name
              ) WHERE ROWNUM <= ${endRow}
            ) WHERE rn >= ${startRow}
          `;
          countSql = `
            SELECT COUNT(*) AS total
            FROM   ${tableSource}
            WHERE  ${schemaFilter}
          `;
          dataParams  = useAllTables ? [schema.toUpperCase(), searchPattern] : [searchPattern];
          countParams = useAllTables ? [schema.toUpperCase(), searchPattern] : [searchPattern];
        }

        const [dataRows, countRows] = await Promise.all([
          this.execSql(conn, dataSql, dataParams, isThin),
          this.execSql(conn, countSql, countParams, isThin),
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

      let dataSql: string;
      let dataParams: any;

      if (isThin) {
        dataSql = `
          SELECT table_name
          FROM   ${tableSource}
          WHERE  ${schemaFilter}
          ORDER  BY table_name
        `;
        dataParams = useAllTables ? { owner: schema.toUpperCase(), 1: searchPattern } : [searchPattern];
      } else {
        dataSql = `
          SELECT table_name
          FROM   ${tableSource}
          WHERE  ${schemaFilter}
          ORDER  BY table_name
        `;
        dataParams = useAllTables ? [schema.toUpperCase(), searchPattern] : [searchPattern];
      }

      const dataRows = await this.execSql(conn, dataSql, dataParams, isThin);

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
    schema: string | null = null,
  ): Promise<Array<{ value: string; label: string }>> {
    if (!table) return [];

    const isThin = sourceOptions.use_tns_alias === 'thin';
    const conn = await this.buildConnection(sourceOptions);

    try {
      const useAllColumns = schema && schema.trim().length > 0;

      let sql: string;
      let params: any;

      if (useAllColumns) {
        sql = isThin
          ? `SELECT column_name FROM all_tab_columns WHERE owner = :1 AND table_name = :2 ORDER BY column_id`
          : `SELECT column_name FROM all_tab_columns WHERE owner = ? AND table_name = ? ORDER BY column_id`;
        params = isThin ? [schema.toUpperCase(), table.toUpperCase()] : [schema.toUpperCase(), table.toUpperCase()];
      } else {
        sql = isThin
          ? `SELECT column_name FROM user_tab_columns WHERE table_name = :1 ORDER BY column_id`
          : `SELECT column_name FROM user_tab_columns WHERE table_name = ? ORDER BY column_id`;
        params = [table.toUpperCase()];
      }

      const rows = await this.execSql(conn, sql, params, isThin);

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
      const checkCache = true;
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
        throw new QueryError(
          `Unsupported GUI operation: ${queryOptions.operation}`,
          `Operation '${queryOptions.operation}' is not supported`,
          {}
        );
    }
  }

  private async execSql(conn: any, sql: string, binds: any, isThin: boolean): Promise<any[]> {
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

  private buildTableRef(table: string, schema?: string | null): string {
    if (schema && schema.trim().length > 0) {
      return `${schema.trim().toUpperCase()}.${table}`;
    }
    return table;
  }

  private buildWhereClause(
    filters: Record<string, any>,
    isThin: boolean,
    offset = 0
  ): { clause: string; binds: any[] } {
    const entries = Object.values(filters);
    if (!entries.length) return { clause: '', binds: [] };

    const binds: any[] = [];
    const parts: string[] = [];

    for (const f of entries) {
      // skip fully empty rows
      const hasColumn   = !!(f.column   && String(f.column).trim());
      const hasOperator = !!(f.operator && String(f.operator).trim());
      const isValueEmpty = f.value === undefined || f.value === null || f.value === '';
      if (!hasColumn && !hasOperator && isValueEmpty) continue;

      if (!hasColumn)   throw new QueryError('A filter condition has a value or operator but no column specified', '', {});
      if (!hasOperator) throw new QueryError(`Filter on column "${f.column}" is missing an operator`, '', {});

      // IS NULL / IS NOT NULL
      if (f.operator === 'is') {
        if (f.value === 'null')     { parts.push(`${f.column} IS NULL`);     continue; }
        if (f.value === 'not_null') { parts.push(`${f.column} IS NOT NULL`); continue; }
        throw new QueryError(`Unknown value for "is" operator: "${f.value}"`, '', {});
      }

      // IN / NOT IN — value may be array or comma-separated string
      if (f.operator === 'in' || f.operator === 'not_in') {
        const values: any[] = Array.isArray(f.value)
          ? f.value
          : String(f.value).split(',').map((v: string) => v.trim());
        if (!values.length) throw new QueryError(`"${f.operator}" requires at least one value`, '', {});
        const placeholders = values.map((v, i) => {
          binds.push(v);
          return this.placeholder(offset + binds.length - 1, isThin);
        });
        const sqlOp = f.operator === 'in' ? 'IN' : 'NOT IN';
        parts.push(`${f.column} ${sqlOp} (${placeholders.join(', ')})`);
        continue;
      }

      // BETWEEN — value must be [from, to]
      if (f.operator === 'between') {
        if (!Array.isArray(f.value) || f.value.length !== 2) {
          throw new QueryError('"between" requires value to be a 2-element array [from, to]', '', {});
        }
        binds.push(f.value[0]);
        const p1 = this.placeholder(offset + binds.length - 1, isThin);
        binds.push(f.value[1]);
        const p2 = this.placeholder(offset + binds.length - 1, isThin);
        parts.push(`${f.column} BETWEEN ${p1} AND ${p2}`);
        continue;
      }

      // All other operators — resolve key → SQL symbol
      const sqlOp = ORACLE_OPERATORS[f.operator] ?? f.operator;
      binds.push(f.value);
      parts.push(`${f.column} ${sqlOp} ${this.placeholder(offset + binds.length - 1, isThin)}`);
    }

    if (!parts.length) return { clause: '', binds: [] };
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
  
  private _buildSelectClause(aggregates?: Record<string, any>, group_by?: Record<string, any>): string {
    const parts: string[] = [];
    if (aggregates && Object.keys(aggregates).length) {
      for (const agg of Object.values(aggregates)) {

        const fn = String((agg as any).aggFx).toLowerCase();
        const col = (agg as any).column;

        const expr =
          fn === 'count_distinct'
            ? `COUNT(DISTINCT ${col})`
            : `${fn.toUpperCase()}(${col})`;

        parts.push(expr);
      }
    }
    const result = parts.length ? parts.join(', ') : '*';
    return result;
  }

  private async guiListRows(conn: any, q: QueryOptions, isThin: boolean): Promise<QueryResult> {
    const { table, schema, limit, offset } = q as any;
    const { where_filters, order_filters, aggregates, group_by } = q.list_rows || {};
    const tableRef = this.buildTableRef(table, schema);
    const selectExpr = this._buildSelectClause(aggregates, group_by);
    let sql = `SELECT ${selectExpr} FROM ${tableRef}`;
    const binds: any[] = [];

    if (where_filters && Object.keys(where_filters).length) {
      const where = this.buildWhereClause(where_filters, isThin, 0);
      sql += ` ${where.clause}`;
      binds.push(...where.binds);
    }
    if (group_by && Object.keys(group_by).length) {
      const cols = Object.values(group_by)
        .flat()
        .map((c: any) => String(c));
      sql += ` GROUP BY ${cols.join(', ')}`;
    }

    if (order_filters && Object.keys(order_filters).length) {
      const orderParts = Object.values(order_filters)
        .filter((f: any) => !!(f.column && String(f.column).trim()))
        .map((f: any) => {
          const order = String(f.order ?? 'ASC')
            .trim()
            .toUpperCase();
          const normalizedOrder =
            order === 'DESC'
              ? 'DESC'
              : 'ASC';
          return `${f.column} ${normalizedOrder}`;
        });
      if (orderParts.length > 0) {
        sql += ` ORDER BY ${orderParts.join(', ')}`;
      }
    }

    const parsedOffset = offset ? parseInt(String(offset)) : 0;
    const parsedLimit = limit ? parseInt(String(limit)) : 0;

    if (parsedOffset > 0 || parsedLimit > 0) {
      const inner = sql;
      if (parsedOffset > 0) {
        sql = `SELECT * FROM (
          SELECT a.*, ROWNUM rnum
          FROM (${inner}) a
          WHERE ROWNUM <= ${parsedOffset + parsedLimit}
        ) WHERE rnum > ${parsedOffset}`;
      } else {
        sql = `SELECT * FROM (${inner}) WHERE ROWNUM <= ${parsedLimit}`;
      }
    }

    const rows = await this.execSql(conn, sql, binds, isThin);
    return { status: 'ok', data: rows };
  }

  private async guiCreateRow(conn: any, q: QueryOptions, isThin: boolean): Promise<QueryResult> {
    const { table, schema } = q as any;
    const rawCols = Object.values(q.create_row?.columns ?? {});

    const cols = rawCols.filter((c: any) => {
      const hasColumn = !!(c.column && String(c.column).trim());
      const isValueEmpty = c.value === undefined || c.value === null || c.value === '';
      if (!hasColumn && isValueEmpty) return false;
      if (!hasColumn) throw new QueryError(
        'A column entry has a value but no column name specified',
        'Column name is missing for a provided value',
        {}
      );
      return true;
    });

    if (!cols.length) {
      throw new QueryError('create_row: no columns provided', 'At least one column is required to create a row', {});
    }

    const tableRef     = this.buildTableRef(table, schema);
    const names        = cols.map((c: any) => c.column).join(', ');
    const placeholders = cols.map((_: any, i: number) => this.placeholder(i, isThin)).join(', ');
    const binds        = cols.map((c: any) => c.value);

    const sql = `INSERT INTO ${tableRef} (${names}) VALUES (${placeholders})`;

    await this.execSql(conn, sql, binds, isThin);
    return { status: 'ok', data: [] };
  }

  private async guiUpdateRows(conn: any, q: QueryOptions, isThin: boolean): Promise<QueryResult> {
        const { table, schema } = q as any;
        const { columns, where_filters } = q.update_rows || {};

        const validColumns = Object.values(columns ?? {}).filter((col: any) => {
          const hasColumn = !!(col.column && String(col.column).trim());
          const isValueEmpty = col.value === undefined || col.value === null || col.value === '';
          if (!hasColumn && isValueEmpty) return false;
          if (!hasColumn) throw new QueryError(
            'An update entry has a value but no column name specified',
            'Column name is missing for a provided value',
            {}
          );
          return true;
        });

        if (!validColumns.length) {
          throw new QueryError('update_rows: no columns provided', 'At least one column is required for update', {});
        }

        const validColumnsMap = Object.fromEntries(validColumns.map((c: any) => [c.column, c]));
        const { clause: setClause, binds: setBinds } = this.buildSetClause(validColumnsMap, isThin, 0);
        const { clause: whereClause, binds: whereBinds } = this.buildWhereClause(
          where_filters ?? {},
          isThin,
          setBinds.length
        );

        const tableRef = this.buildTableRef(table, schema);
        const sql = `UPDATE ${tableRef} SET ${setClause}${whereClause ? ` ${whereClause}` : ''}`;
        const binds = [...setBinds, ...whereBinds];

        const countSql =
      `SELECT COUNT(*) AS COUNT FROM ${tableRef}` +
      `${whereClause ? ` ${whereClause}` : ''}`;

    if (isThin) {
      const countResult = await conn.execute(countSql, whereBinds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      const rowsMatched =
        Number(countResult.rows?.[0]?.COUNT ?? 0);
      if (!q.allow_multiple_updates && rowsMatched > 1) {
        throw new QueryError(
          'Multiple row updates are not allowed',
          'Query matched more than one row',
          {}
        );
      }
      if (!q.zero_records_as_success && rowsMatched === 0) {
        throw new QueryError(
          'No rows were updated',
          'Query matched zero rows',
          {}
        );
      }
      await conn.execute(sql, binds, {
        autoCommit: true,
      });

    } else {
      await conn.transaction(async (trx: any) => {
        const countResult = await trx.raw(countSql, whereBinds);
        const rowsMatched =
          Number(
            countResult?.[0]?.COUNT ??
            countResult?.rows?.[0]?.COUNT ??
            0
          );
        if (!q.allow_multiple_updates && rowsMatched > 1) {
          throw new QueryError(
            'Multiple row updates are not allowed',
            'Query matched more than one row',
            {}
          );
        }
        if (!q.zero_records_as_success && rowsMatched === 0) {
          throw new QueryError(
            'No rows were updated',
            'Query matched zero rows',
            {}
          );
        }
        await trx.raw(sql, binds);
      });
    }
    return { status: 'ok', data: [] };
  }

  private async guiDeleteRows(
  conn: any,
  q: QueryOptions,
  isThin: boolean
): Promise<QueryResult> {

  const { table, schema, limit } = q as any;
  const { where_filters } = q.delete_rows || {};

  const hasFilters =
    where_filters &&
    Object.keys(where_filters).length > 0;
  const hasLimit =
    limit !== undefined &&
    limit !== null &&
    String(limit).trim() !== '';

  // Prevent full table delete
  if (!hasFilters && !hasLimit) {
    throw new QueryError(
      'Filter or limit is mandatory',
      'Deleting entire table is not allowed',
      {}
    );
  }
  const tableRef = this.buildTableRef(table, schema);
  const {
    clause: whereClause,
    binds: whereBinds,
  } = this.buildWhereClause(where_filters ?? {}, isThin, 0);

  const parsedLimit = hasLimit
    ? parseInt(String(limit), 10)
    : null;

  let countSql = `SELECT COUNT(*) AS COUNT FROM ${tableRef}`;
  let deleteSql = `DELETE FROM ${tableRef}`;

  if (whereClause) {
    countSql += ` ${whereClause}`;
  }
  // Oracle delete with limit
  if (parsedLimit) {
    const limitedWhere = whereClause
      ? `${whereClause} AND ROWNUM <= ${parsedLimit}`
      : `WHERE ROWNUM <= ${parsedLimit}`;

    deleteSql += ` ${limitedWhere}`;
    countSql += whereClause
      ? ` AND ROWNUM <= ${parsedLimit}`
      : ` WHERE ROWNUM <= ${parsedLimit}`;

  } else if (whereClause) {
    deleteSql += ` ${whereClause}`;
  }
  if (isThin) {
    const countResult = await conn.execute(
      countSql,
      whereBinds,
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      }
    );
    const rowsMatched =
      Number(countResult.rows?.[0]?.COUNT ?? 0);

    if (!q.allow_multiple_updates && rowsMatched > 1) {
      throw new QueryError(
        'Multiple row deletes are not allowed',
        'Query matched more than one row',
        {}
      );
    }
    if (!q.zero_records_as_success && rowsMatched === 0) {
      throw new QueryError(
        'No rows were deleted',
        'Query matched zero rows',
        {}
      );
    }
    await conn.execute(deleteSql, whereBinds, {
        autoCommit: true,
      });
    } else {
      await conn.transaction(async (trx: any) => {
        const countResult = await trx.raw(
          countSql,
          whereBinds
        );
        const rowsMatched =
          Number(
            countResult?.[0]?.COUNT ??
            countResult?.rows?.[0]?.COUNT ??
            0
          );
        if (!q.allow_multiple_updates && rowsMatched > 1) {
          throw new QueryError(
            'Multiple row deletes are not allowed',
            'Query matched more than one row',
            {}
          );
        }
        if (!q.zero_records_as_success && rowsMatched === 0) {
          throw new QueryError(
            'No rows were deleted',
            'Query matched zero rows',
            {}
          );
        }
        await trx.raw(deleteSql, whereBinds);
      });
    }
    return {
      status: 'ok',
      data: [],
    };
  }

 private async guiUpsertRows(
    conn: any,
    q: QueryOptions,
    isThin: boolean
  ): Promise<QueryResult> {
    const { table, schema } = q as any;
    const rawCols: any[] = Object.values(
      q.upsert_rows?.columns ?? {}
    );
    const pkRaw = (q as any).primary_key_columns ?? [];
    const pk: string[] = Array.isArray(pkRaw)
      ? pkRaw
      : [pkRaw];
    const cols = rawCols.filter((c: any) => {
      const hasColumn =
        !!(c.column && String(c.column).trim());
      const isValueEmpty =
        c.value === undefined ||
        c.value === null ||
        c.value === '';

      if (!hasColumn && isValueEmpty) return false;
      if (!hasColumn) {
        throw new QueryError(
          'An upsert entry has a value but no column name specified',
          'Column name is missing for a provided value',
          {}
        );
      }
      return true;
    });

    if (!cols.length) {
      throw new QueryError(
        'upsert_rows: no columns provided',
        'At least one column is required for upsert',
        {}
      );
    }
    if (!pk.length) {
      throw new QueryError(
        'upsert_rows: primary_key_columns is required',
        'Primary key columns are required for upsert',
        {}
      );
    }

    const allColNames = cols.map((c: any) => c.column);
    const binds = cols.map((c: any) => c.value);
    const tableRef = this.buildTableRef(table, schema);
    // PK validation
    const pkFilters: Record<string, any> = {};
    pk.forEach((key) => {
      const matchedCol = cols.find(
        (c: any) => c.column === key
      );

      if (!matchedCol) {
        throw new QueryError(
          `Primary key column "${key}" value missing`,
          'Primary key value required for upsert',
          {}
        );
      }

      pkFilters[key] = {
        column: key,
        operator: 'eq',
        value: matchedCol.value,
      };
    });

    const {
      clause: whereClause,
      binds: whereBinds,
    } = this.buildWhereClause(
      pkFilters,
      isThin,
      0
    );

    const countSql =
      `SELECT COUNT(*) AS COUNT FROM ${tableRef} ${whereClause}`;

    const srcCols = cols.map((c: any, i: number) =>
      `${this.placeholder(i, isThin)} AS ${c.column}`
    ).join(', ');

    const onClause = pk
      .map((k: string) => `t.${k} = s.${k}`)
      .join(' AND ');
    const updateSet = allColNames
      .filter((c: string) => !pk.includes(c))
      .map((c: string) => `t.${c} = s.${c}`)
      .join(', ');
    const insertCols = allColNames.join(', ');
    const insertVals = allColNames
      .map((c: string) => `s.${c}`)
      .join(', ');

    const sql = `
      MERGE INTO ${tableRef} t
      USING (SELECT ${srcCols} FROM dual) s
      ON (${onClause})
      WHEN MATCHED THEN
        UPDATE SET ${updateSet}
      WHEN NOT MATCHED THEN
        INSERT (${insertCols})
        VALUES (${insertVals})
    `;

    if (isThin) {
      const countResult = await conn.execute(
        countSql,
        whereBinds,
        {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        }
      );
      const rowsMatched =
        Number(countResult.rows?.[0]?.COUNT ?? 0);
      if (!q.allow_multiple_updates && rowsMatched > 1) {
        throw new QueryError(
          'Multiple row upserts are not allowed',
          'Query matched more than one row',
          {}
        );
      }
      if (
        !q.zero_records_as_success &&
        rowsMatched === 0
      ) {
        // For upsert:
        // zero means INSERT path
        // so this should still be allowed
      }
      await conn.execute(sql, binds, {
        autoCommit: true,
      });
    } else {
      await conn.transaction(async (trx: any) => {
        const countResult = await trx.raw(
          countSql,
          whereBinds
        );
        const rowsMatched =
          Number(
            countResult?.[0]?.COUNT ??
            countResult?.rows?.[0]?.COUNT ??
            0
          );
        if (
          !q.allow_multiple_updates &&
          rowsMatched > 1
        ) {
          throw new QueryError(
            'Multiple row upserts are not allowed',
            'Query matched more than one row',
            {}
          );
        }
        await trx.raw(sql, binds);
      });
    }
    return {
      status: 'ok',
      data: [],
    };
  }
  
  private computeOracleBatchSize(records: Record<string, any>[], maxParams = ORACLE_MAX_BIND_PARAMS): number {
    if (!records || records.length === 0) return 100;
    const SAMPLE_SIZE = 100;
    const sample =
      records.length <= SAMPLE_SIZE * 2 ? records : [...records.slice(0, SAMPLE_SIZE), ...records.slice(-SAMPLE_SIZE)];
    const numColumns = Math.max(...sample.map((r) => Object.keys(r).length));
    if (numColumns === 0) return 100;
    return Math.max(1, Math.floor(maxParams / numColumns));
  }

  private splitIntoBatches<T>(records: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }
    return batches;
  }

  private async guiBulkInsert(conn: any, q: QueryOptions, isThin: boolean): Promise<QueryResult> {
    const { table, schema } = q as any;
    const rawRecords = (q as any).records ?? [];
    const records: Record<string, any>[] = typeof rawRecords === 'string'
      ? JSON.parse(rawRecords)
      : rawRecords;
    if (!records.length) return { status: 'ok', data: [] };

    const tableRef = this.buildTableRef(table, schema);
    const cols     = Object.keys(records[0]);

    const batchSize   = this.computeOracleBatchSize(records);
    const batches     = this.splitIntoBatches(records, batchSize);

    for (const batch of batches) {
      const bindsArray = batch.map((r) => cols.map((c) => r[c]));

      if (isThin) {
        const placeholders = cols.map((_: any, i: number) => `:${i + 1}`).join(', ');
        const sql = `INSERT INTO ${tableRef} (${cols.join(', ')}) VALUES (${placeholders})`;
        await conn.executeMany(sql, bindsArray, { autoCommit: true });
      } else {
        const placeholders = cols.map(() => '?').join(', ');
        const sql = `INSERT INTO ${tableRef} (${cols.join(', ')}) VALUES (${placeholders})`;
        await conn.transaction(async (trx: any) => {
          for (const binds of bindsArray) {
            await trx.raw(sql, binds);
          }
        });
      }
    }

    return { status: 'ok', data: [] };
  }

  private async guiBulkUpsertPkey(conn: any, q: QueryOptions, isThin: boolean): Promise<QueryResult> {
    const rawRecords = (q as any).records ?? [];
    const records: Record<string, any>[] = typeof rawRecords === 'string'
      ? JSON.parse(rawRecords)
      : rawRecords;
    if (!records.length) return { status: 'ok', data: [] };

    const batchSize = this.computeOracleBatchSize(records);
    const batches   = this.splitIntoBatches(records, batchSize);

    for (const batch of batches) {
      for (const record of batch) {
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
    }

    return { status: 'ok', data: [] };
  }
}