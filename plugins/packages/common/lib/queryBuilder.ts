'use strict';

// ─── Error ────────────────────────────────────────────────────────────────────

export class QueryBuilderError extends Error {
  operation: string | null;
  dialect: string | null;

  constructor(
    message: string,
    { operation = null, dialect = null }: { operation?: string | null; dialect?: string | null } = {}
  ) {
    super(message);
    this.name = 'QueryBuilderError';
    this.operation = operation;
    this.dialect = dialect;
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OPERATORS: Record<string, string> = {
  eq: '=',
  neq: '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  like: 'LIKE',
  ilike: 'ILIKE', // PostgreSQL native; falls back to LIKE on other dialects
  in: 'IN',
  not_in: 'NOT IN',
  between: 'BETWEEN',
};

const AGGREGATE_FNS = new Set(['sum', 'count', 'avg', 'min', 'max', 'count_distinct']);

const VALID_ORDER_DIRECTIONS = new Set(['ASC', 'DESC']);

// ─── Dialects ─────────────────────────────────────────────────────────────────

abstract class BaseDialect {
  abstract quote(id: string): string;
  limitOffset(_limit: number | string | null | undefined, _offset: number | string | null | undefined): string {
    return '';
  }
  supportsIlike(): boolean {
    return false;
  }
}

class PostgreSQLDialect extends BaseDialect {
  get name() {
    return 'postgresql';
  }
  quote(id: string): string {
    return `"${String(id).replace(/"/g, '""')}"`;
  }
  supportsIlike(): boolean {
    return true;
  }
  limitOffset(limit: number | string | null | undefined, offset: number | string | null | undefined): string {
    let s = '';
    if (limit != null || limit !== undefined) s += ` LIMIT ${toPositiveInt(limit)}`;
    if (offset != null || offset !== undefined) s += ` OFFSET ${toPositiveInt(offset)}`;
    return s;
  }
}

class MySQLDialect extends BaseDialect {
  get name() {
    return 'mysql';
  }
  quote(id: string): string {
    return `\`${String(id).replace(/`/g, '``')}\``;
  }
  limitOffset(limit: number | string | null | undefined, offset: number | string | null | undefined): string {
    if (limit == null) return '';
    let s = ` LIMIT ${toPositiveInt(limit)}`;
    if (offset != null) s += ` OFFSET ${toPositiveInt(offset)}`;
    return s;
  }
}

class MSSQLDialect extends BaseDialect {
  get name() {
    return 'mssql';
  }
  quote(id: string): string {
    return `[${String(id).replace(/\]/g, ']]')}]`;
  }
  /**
   * MSSQL OFFSET/FETCH – requires ORDER BY in the surrounding query.
   * Call only when offset is set; TOP handles the limit-only case.
   */
  limitOffset(limit: number | string | null | undefined, offset: number | string | null | undefined): string {
    if (offset == null) return '';
    const offsetPart = ` OFFSET ${toPositiveInt(offset)} ROWS`;
    if (limit != null) return `${offsetPart} FETCH NEXT ${toPositiveInt(limit)} ROWS ONLY`;
    return offsetPart;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toPositiveInt(value: number | string): number {
  const parsedNumber = parseInt(String(value), 10);
  if (isNaN(parsedNumber) || parsedNumber < 0) {
    throw new QueryBuilderError(`Expected a non-negative integer, got: "${value}"`);
  }
  return parsedNumber;
}

function getDialect(name: string): BaseDialect {
  switch (String(name).toLowerCase()) {
    case 'postgresql':
    case 'postgres':
      return new PostgreSQLDialect();
    case 'mysql':
      return new MySQLDialect();
    case 'mssql':
    case 'sqlserver':
      return new MSSQLDialect();
    default:
      throw new QueryBuilderError(`Unsupported dialect: "${name}"`);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface WhereFilter {
  column: string;
  operator: string;
  value?: unknown;
}

interface OrderFilter {
  column: string;
  order?: string;
}

interface AggregateEntry {
  aggFx: string;
  column: string;
  table_id?: string;
}

interface CreateRowEntry {
  column: string;
  value?: unknown;
}

interface UpdateRowEntry {
  column: string;
  value?: unknown;
}

interface ListRowsInput {
  aggregates?: Record<string, AggregateEntry>;
  group_by?: Record<string, string[]>;
  where_filters?: Record<string, WhereFilter>;
  order_filters?: Record<string, OrderFilter>;
  limit?: string | number;
  offset?: string | number;
  fields?: Array<{ name: string; table: string }>;
}

interface DeleteRowsInput {
  limit?: string | number;
  where_filters?: Record<string, WhereFilter>;
}

interface UpdateRowsInput {
  columns: Record<string, UpdateRowEntry>;
  where_filters?: Record<string, WhereFilter>;
}

interface UpsertRowsInput {
  primary_key_column: string;
  columns: Record<string, UpdateRowEntry>;
}

interface BulkInsertInput {
  rows_insert: Record<string, unknown>[];
}

interface BulkUpdateWithPrimaryKeyInput {
  primary_key: string[];
  rows_update: Record<string, unknown>[];
}

interface BulkUpsertWithPrimaryKeyInput {
  primary_key: string[];
  row_upsert: Record<string, unknown>[];
}

interface QueryResult {
  query: string;
  params: unknown[];
}

interface BulkQueryResult {
  queries: QueryResult[];
}

// ─── QueryBuilder ─────────────────────────────────────────────────────────────

export class QueryBuilder {
  private _dialect: BaseDialect;
  private _params: unknown[];

  constructor(dialectName = 'postgresql') {
    this._dialect = getDialect(dialectName);
    this._params = [];
  }

  // ── Internal state ──────────────────────────────────────────────────────────

  private _reset(): void {
    this._params = [];
  }

  private _addParam(value: unknown): string {
    this._params.push(value);
    return '?';
  }

  // ── WHERE builder ───────────────────────────────────────────────────────────

  private _whereClause(whereFilters: Record<string, WhereFilter> | null | undefined): string {
    if (!whereFilters || Object.keys(whereFilters).length === 0) return '';
    const conditions = Object.values(whereFilters).map((f) => this._condition(f));
    return ` WHERE ${conditions.join(' AND ')}`;
  }

  private _condition({ column, operator, value }: WhereFilter): string {
    if (!column) throw new QueryBuilderError('Filter is missing "column"');
    if (!operator) throw new QueryBuilderError('Filter is missing "operator"');

    const col = this._dialect.quote(column);

    // 'is' operator: the stored value ('null' | 'not_null') determines the SQL fragment
    if (operator === 'is') {
      if (value === 'null') return `${col} IS NULL`;
      if (value === 'not_null') return `${col} IS NOT NULL`;
      throw new QueryBuilderError(`Unknown value for "is" operator: "${value}". Expected "null" or "not_null".`);
    }

    const sqlOp = OPERATORS[operator];
    if (!sqlOp) throw new QueryBuilderError(`Unknown operator: "${operator}"`);

    const effectiveOp = operator === 'ilike' && !this._dialect.supportsIlike() ? 'LIKE' : sqlOp;

    if (operator === 'in' || operator === 'not_in') {
      const values: unknown[] = Array.isArray(value)
        ? value
        : String(value)
            .split(',')
            .map((v) => v.trim());
      if ((values as unknown[]).length === 0) {
        throw new QueryBuilderError(`"${operator}" requires at least one value`);
      }
      const placeholders = (values as unknown[]).map((v) => this._addParam(v));
      return `${col} ${effectiveOp} (${placeholders.join(', ')})`;
    }

    if (operator === 'between') {
      if (!Array.isArray(value) || (value as unknown[]).length !== 2) {
        throw new QueryBuilderError('"between" requires value to be a 2-element array [from, to]');
      }
      return `${col} ${effectiveOp} ${this._addParam((value as unknown[])[0])} AND ${this._addParam(
        (value as unknown[])[1]
      )}`;
    }

    return `${col} ${effectiveOp} ${this._addParam(value)}`;
  }

  // ── SELECT clause builder ───────────────────────────────────────────────────

  private _selectClause(
    fields: Array<{ name: string; table: string }> | null | undefined,
    aggregates: Record<string, AggregateEntry> | null | undefined
  ): string {
    const parts: string[] = [];

    if (fields && fields.length > 0) {
      parts.push(
        ...fields.map((f) => {
          if (!f.name) throw new QueryBuilderError('fields entry is missing "name"');
          return this._dialect.quote(f.name);
        })
      );
    }

    if (aggregates && Object.keys(aggregates).length > 0) {
      for (const agg of Object.values(aggregates)) {
        if (!agg.aggFx) throw new QueryBuilderError('Aggregate entry is missing "aggFx"');
        if (!agg.column) throw new QueryBuilderError('Aggregate entry is missing "column"');
        const fn = String(agg.aggFx).toLowerCase();
        if (!AGGREGATE_FNS.has(fn)) {
          throw new QueryBuilderError(`Unknown aggregate function: "${agg.aggFx}"`);
        }
        const col = this._dialect.quote(agg.column);
        parts.push(fn === 'count_distinct' ? `COUNT(DISTINCT ${col})` : `${fn.toUpperCase()}(${col})`);
      }
    }

    return parts.length > 0 ? parts.join(', ') : '*';
  }

  // ── Operations ──────────────────────────────────────────────────────────────
  // ✅
  createRow(tableName: string, createRow: Record<string, CreateRowEntry> | undefined | null): QueryResult {
    this._reset();
    this._assertTableName(tableName, 'create_row');

    const entries = Object.values(createRow || {});

    if (entries.length === 0) {
      const query = `INSERT INTO ${this._dialect.quote(tableName)} DEFAULT VALUES`;
      return { query, params: [] };
    }

    for (const e of entries) {
      if (!e.column) throw new QueryBuilderError('create_row entry is missing "column"', { operation: 'create_row' });
    }

    const cols = entries.map((e) => this._dialect.quote(e.column));
    const placeholders = entries.map((e) => this._addParam(e.value));

    const query = `INSERT INTO ${this._dialect.quote(tableName)} (${cols.join(', ')}) VALUES (${placeholders.join(
      ', '
    )})`;
    return { query, params: [...this._params] };
  }

  updateRows(tableName: string, updateRows: UpdateRowsInput): QueryResult {
    this._reset();
    this._assertTableName(tableName, 'update_rows');

    const { columns, where_filters } = updateRows;
    if (!columns || Object.keys(columns).length === 0) {
      throw new QueryBuilderError('update_rows.columns must have at least one entry', { operation: 'update_rows' });
    }

    const setClauses = Object.values(columns).map((col) => {
      if (!col.column)
        throw new QueryBuilderError('update_rows column entry is missing "column"', { operation: 'update_rows' });
      return `${this._dialect.quote(col.column)} = ${this._addParam(col.value)}`;
    });

    let query = `UPDATE ${this._dialect.quote(tableName)} SET ${setClauses.join(', ')}`;
    query += this._whereClause(where_filters);

    return { query, params: [...this._params] };
  }

  upsertRows(tableName: string, upsertRowsData: UpsertRowsInput): QueryResult {
    this._reset();
    this._assertTableName(tableName, 'upsert_rows');

    const { primary_key_column, columns } = upsertRowsData;

    if (!primary_key_column || !String(primary_key_column).trim()) {
      throw new QueryBuilderError('upsert_rows.primary_key_column is required', { operation: 'upsert_rows' });
    }
    if (!columns || Object.keys(columns).length === 0) {
      throw new QueryBuilderError('upsert_rows.columns must have at least one entry', { operation: 'upsert_rows' });
    }

    const columnEntries = Object.values(columns);
    for (const entry of columnEntries) {
      if (!entry.column) {
        throw new QueryBuilderError('upsert_rows column entry is missing "column"', { operation: 'upsert_rows' });
      }
    }

    const allColumnNames = columnEntries.map((entry) => entry.column);
    const updateColumnNames = allColumnNames.filter((col) => col !== primary_key_column);
    const row = Object.fromEntries(columnEntries.map((entry) => [entry.column, entry.value]));
    const table = this._dialect.quote(tableName);

    if (this._dialect instanceof PostgreSQLDialect) {
      return this._pgUpsert(table, [primary_key_column], allColumnNames, updateColumnNames, row);
    } else if (this._dialect instanceof MySQLDialect) {
      return this._mysqlUpsert(table, [primary_key_column], allColumnNames, updateColumnNames, row);
    } else {
      return this._mssqlUpsert(table, [primary_key_column], allColumnNames, updateColumnNames, row);
    }
  }

  deleteRows(tableName: string, deleteRows: DeleteRowsInput): QueryResult {
    this._reset();
    this._assertTableName(tableName, 'delete_rows');

    const { limit: rawLimit, where_filters } = deleteRows;
    const limit = rawLimit === '' ? undefined : rawLimit;
    const table = this._dialect.quote(tableName);
    let query: string;

    if (this._dialect instanceof MySQLDialect) {
      query = `DELETE FROM ${table}`;
      query += this._whereClause(where_filters);
      if (limit != null) query += ` LIMIT ${toPositiveInt(limit)}`;
    } else if (this._dialect instanceof MSSQLDialect) {
      const top = limit != null ? `TOP(${toPositiveInt(limit)}) ` : '';
      query = `DELETE ${top}FROM ${table}`;
      query += this._whereClause(where_filters);
    } else {
      // PostgreSQL – use ctid subquery to honour a LIMIT
      if (limit != null) {
        const innerWhere = this._whereClause(where_filters);
        query = `DELETE FROM ${table} WHERE ctid IN (SELECT ctid FROM ${table}${innerWhere} LIMIT ${toPositiveInt(
          limit
        )})`;
      } else {
        query = `DELETE FROM ${table}`;
        query += this._whereClause(where_filters);
      }
    }

    return { query, params: [...this._params] };
  }

  listRows(tableName: string, listRows: ListRowsInput = {}): QueryResult {
    this._reset();
    this._assertTableName(tableName, 'list_rows');

    const { aggregates, group_by, where_filters, order_filters, limit: rawLimit, offset: rawOffset, fields } = listRows;
    const limit = rawLimit === '' ? undefined : rawLimit;
    const offset = rawOffset === '' ? undefined : rawOffset;
    const table = this._dialect.quote(tableName);

    const selectExpr = this._selectClause(fields, aggregates);

    let topClause = '';
    if (this._dialect instanceof MSSQLDialect && limit != null && offset == null) {
      topClause = `TOP ${toPositiveInt(limit)} `;
    }

    let query = `SELECT ${topClause}${selectExpr} FROM ${table}`;

    query += this._whereClause(where_filters);

    if (group_by && Object.keys(group_by).length > 0) {
      const cols = Object.values(group_by)
        .flat()
        .map((c) => this._dialect.quote(c));
      query += ` GROUP BY ${cols.join(', ')}`;
    }

    let hasOrderBy = false;
    if (order_filters && Object.keys(order_filters).length > 0) {
      const orders = Object.values(order_filters).map((of) => {
        if (!of.column) throw new QueryBuilderError('order_filters entry is missing "column"');
        const dir = String(of.order || 'ASC').toUpperCase();
        if (!VALID_ORDER_DIRECTIONS.has(dir)) {
          throw new QueryBuilderError(`Invalid order direction: "${of.order}". Use "asc" or "desc".`);
        }
        return `${this._dialect.quote(of.column)} ${dir}`;
      });
      query += ` ORDER BY ${orders.join(', ')}`;
      hasOrderBy = true;
    }

    if (this._dialect instanceof MSSQLDialect) {
      if (offset != null) {
        if (!hasOrderBy) query += ' ORDER BY (SELECT NULL)';
        query += this._dialect.limitOffset(limit, offset);
      }
    } else {
      query += this._dialect.limitOffset(limit, offset);
    }

    return { query, params: [...this._params] };
  }

  bulkInsert(tableName: string, bulkInsert: BulkInsertInput): QueryResult {
    this._reset();
    this._assertTableName(tableName, 'bulk_insert');

    const { rows_insert } = bulkInsert;
    if (!rows_insert || rows_insert.length === 0) {
      throw new QueryBuilderError('bulk_insert.rows_insert must have at least one row', { operation: 'bulk_insert' });
    }

    const allCols = [...new Set(rows_insert.flatMap((row) => Object.keys(row)))];
    if (allCols.length === 0) {
      throw new QueryBuilderError('bulk_insert rows must have at least one column', { operation: 'bulk_insert' });
    }

    const quotedCols = allCols.map((c) => this._dialect.quote(c));
    const valueGroups = rows_insert.map((row) => {
      const placeholders = allCols.map((col) => this._addParam(col in row ? row[col] : null));
      return `(${placeholders.join(', ')})`;
    });

    const query = `INSERT INTO ${this._dialect.quote(tableName)} (${quotedCols.join(', ')}) VALUES ${valueGroups.join(
      ', '
    )}`;
    return { query, params: [...this._params] };
  }

  bulkUpdateWithPrimaryKey(tableName: string, bulkUpdate: BulkUpdateWithPrimaryKeyInput): BulkQueryResult {
    this._assertTableName(tableName, 'bulk_update_with_primary_key');

    const { primary_key, rows_update } = bulkUpdate;
    if (!primary_key || primary_key.length === 0) {
      throw new QueryBuilderError('bulk_update_with_primary_key.primary_key must have at least one column', {
        operation: 'bulk_update_with_primary_key',
      });
    }
    if (!rows_update || rows_update.length === 0) {
      throw new QueryBuilderError('bulk_update_with_primary_key.rows_update must have at least one row', {
        operation: 'bulk_update_with_primary_key',
      });
    }

    const primaryKeySet = new Set(primary_key);
    const table = this._dialect.quote(tableName);

    const queries = rows_update.map((row, rowIndex) => {
      this._reset();

      for (const primaryKey of primary_key) {
        if (!(primaryKey in row)) {
          throw new QueryBuilderError(
            `bulk_update_with_primary_key rows_update[${rowIndex}] is missing primary key column "${primaryKey}"`,
            { operation: 'bulk_update_with_primary_key' }
          );
        }
      }

      const updateCols = Object.keys(row).filter((col) => !primaryKeySet.has(col));
      if (updateCols.length === 0) {
        throw new QueryBuilderError(
          `bulk_update_with_primary_key rows_update[${rowIndex}] has no columns to update (only primary key columns present)`,
          { operation: 'bulk_update_with_primary_key' }
        );
      }

      const setClauses = updateCols.map((col) => `${this._dialect.quote(col)} = ${this._addParam(row[col])}`);
      const whereClauses = primary_key.map((pk) => `${this._dialect.quote(pk)} = ${this._addParam(row[pk])}`);

      const query = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')}`;
      return { query, params: [...this._params] };
    });

    return { queries };
  }

  bulkUpsertWithPrimaryKey(tableName: string, bulkUpsert: BulkUpsertWithPrimaryKeyInput): BulkQueryResult {
    this._assertTableName(tableName, 'bulk_upsert_with_primary_key');

    const { primary_key, row_upsert } = bulkUpsert;
    if (!primary_key || primary_key.length === 0) {
      throw new QueryBuilderError('bulk_upsert_with_primary_key.primary_key must have at least one column', {
        operation: 'bulk_upsert_with_primary_key',
      });
    }
    if (!row_upsert || row_upsert.length === 0) {
      throw new QueryBuilderError('bulk_upsert_with_primary_key.row_upsert must have at least one row', {
        operation: 'bulk_upsert_with_primary_key',
      });
    }

    const primaryKeySet = new Set(primary_key);
    const table = this._dialect.quote(tableName);

    const queries = row_upsert.map((row, rowIndex) => {
      this._reset();

      for (const primaryKey of primary_key) {
        if (!(primaryKey in row)) {
          throw new QueryBuilderError(
            `bulk_upsert_with_primary_key row_upsert[${rowIndex}] is missing primary key column "${primaryKey}"`,
            { operation: 'bulk_upsert_with_primary_key' }
          );
        }
      }

      const allCols = Object.keys(row);
      const updateCols = allCols.filter((col) => !primaryKeySet.has(col));

      if (this._dialect instanceof PostgreSQLDialect) {
        return this._pgUpsert(table, primary_key, allCols, updateCols, row);
      } else if (this._dialect instanceof MySQLDialect) {
        return this._mysqlUpsert(table, primary_key, allCols, updateCols, row);
      } else {
        return this._mssqlUpsert(table, primary_key, allCols, updateCols, row);
      }
    });

    return { queries };
  }

  // ── Dialect-specific upsert helpers ─────────────────────────────────────────

  private _pgUpsert(
    table: string,
    primaryKey: string[],
    allCols: string[],
    updateCols: string[],
    row: Record<string, unknown>
  ): QueryResult {
    const quotedCols = allCols.map((c) => this._dialect.quote(c));
    const placeholders = allCols.map((col) => this._addParam(row[col]));
    const conflictTarget = primaryKey.map((pk) => this._dialect.quote(pk)).join(', ');

    let query = `INSERT INTO ${table} (${quotedCols.join(', ')}) VALUES (${placeholders.join(', ')})`;
    query += ` ON CONFLICT (${conflictTarget})`;
    query +=
      updateCols.length === 0
        ? ' DO NOTHING'
        : ` DO UPDATE SET ${updateCols
            .map((col) => `${this._dialect.quote(col)} = EXCLUDED.${this._dialect.quote(col)}`)
            .join(', ')}`;

    return { query, params: [...this._params] };
  }

  private _mysqlUpsert(
    table: string,
    primaryKey: string[],
    allCols: string[],
    updateCols: string[],
    row: Record<string, unknown>
  ): QueryResult {
    const quotedCols = allCols.map((c) => this._dialect.quote(c));
    const placeholders = allCols.map((col) => this._addParam(row[col]));

    let query = `INSERT INTO ${table} (${quotedCols.join(', ')}) VALUES (${placeholders.join(', ')})`;

    const setCols = updateCols.length > 0 ? updateCols : [primaryKey[0]];
    const setClauses = setCols.map((col) => `${this._dialect.quote(col)} = VALUES(${this._dialect.quote(col)})`);
    query += ` ON DUPLICATE KEY UPDATE ${setClauses.join(', ')}`;

    return { query, params: [...this._params] };
  }

  private _mssqlUpsert(
    table: string,
    primaryKey: string[],
    allCols: string[],
    updateCols: string[],
    row: Record<string, unknown>
  ): QueryResult {
    const quotedCols = allCols.map((c) => this._dialect.quote(c));
    const placeholders = allCols.map((col) => this._addParam(row[col]));
    const onClause = primaryKey
      .map((pk) => `[_target].${this._dialect.quote(pk)} = [_source].${this._dialect.quote(pk)}`)
      .join(' AND ');

    let query = `MERGE INTO ${table} WITH (HOLDLOCK) AS [_target]`;
    query += ` USING (VALUES (${placeholders.join(', ')})) AS [_source] (${quotedCols.join(', ')})`;
    query += ` ON ${onClause}`;

    if (updateCols.length > 0) {
      const setClauses = updateCols.map(
        (col) => `[_target].${this._dialect.quote(col)} = [_source].${this._dialect.quote(col)}`
      );
      query += ` WHEN MATCHED THEN UPDATE SET ${setClauses.join(', ')}`;
    }

    const insertValues = allCols.map((c) => `[_source].${this._dialect.quote(c)}`).join(', ');
    query += ` WHEN NOT MATCHED THEN INSERT (${quotedCols.join(', ')}) VALUES (${insertValues});`;

    return { query, params: [...this._params] };
  }

  // ── Unified entry point ─────────────────────────────────────────────────────

  build(operation: string, tableName: string, data: Record<string, unknown>): QueryResult | BulkQueryResult {
    switch (String(operation).toLowerCase()) {
      case 'create_row':
        return this.createRow(tableName, data as Record<string, CreateRowEntry>);
      case 'update_rows':
        return this.updateRows(tableName, data as unknown as UpdateRowsInput);
      case 'upsert_rows':
        return this.upsertRows(tableName, data as unknown as UpsertRowsInput);
      case 'delete_rows':
        return this.deleteRows(tableName, data as DeleteRowsInput);
      case 'list_rows':
        return this.listRows(tableName, data as ListRowsInput);
      case 'bulk_insert':
        return this.bulkInsert(tableName, data as unknown as BulkInsertInput);
      case 'bulk_update_with_primary_key':
        return this.bulkUpdateWithPrimaryKey(tableName, data as unknown as BulkUpdateWithPrimaryKeyInput);
      case 'bulk_upsert_with_primary_key':
        return this.bulkUpsertWithPrimaryKey(tableName, data as unknown as BulkUpsertWithPrimaryKeyInput);
      default:
        throw new QueryBuilderError(`Unsupported operation: "${operation}"`, { operation });
    }
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  private _assertTableName(tableName: string, operation: string): void {
    if (!tableName || typeof tableName !== 'string' || !tableName.trim()) {
      throw new QueryBuilderError('table_name is required and must be a non-empty string', { operation });
    }
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createQueryBuilder(dialect = 'postgresql'): QueryBuilder {
  return new QueryBuilder(dialect);
}
