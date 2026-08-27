import { EntityManager, QueryRunner } from 'typeorm';

// Structurally compatible with both QueryRunner and EntityManager - a read-only lookup outside a
// queryRunner's own transaction (foreign-key identity resolution) can pass either.
type Queryable = Pick<QueryRunner, 'query'> | Pick<EntityManager, 'query'>;

export interface TableSchemaSnapshotColumn {
  name: string;
  uuid: string;
  data_type: string;
  is_nullable: boolean;
  default: string | null;
  is_primary_key: boolean;
}

export interface TableSchemaSnapshotConstraint {
  name: string;
  column_names: string[];
}

export interface TableSchemaSnapshotIndex {
  name: string;
  column_names: string[];
  is_unique: boolean;
}

export interface TableSchemaSnapshotForeignKey {
  name: string;
  column_names: string[];
  referenced_table: string;
  referenced_column_names: string[];
}

export interface TableSchemaSnapshot {
  columns: TableSchemaSnapshotColumn[];
  primary_key: string[];
  unique_constraints: TableSchemaSnapshotConstraint[];
  indexes: TableSchemaSnapshotIndex[];
  foreign_keys: TableSchemaSnapshotForeignKey[];
}

/**
 * Introspects a physical relation's current shape: columns (each annotated with the logical uuid
 * its name maps to in `columnNames`), primary key, unique constraints, indexes and foreign keys.
 *
 * Assumes the relation exists. A missing relation is not a snapshot concern - callers that need to
 * tell "doesn't exist" apart from "exists but empty" (baselining, drop_table adjudication) can do so
 * from an all-empty result, since Postgres has no way to have a real table with zero columns.
 *
 * Every column list that comes from a multi-column constraint is ordered by `conkey`/`indkey`
 * ordinality, not by attnum: a composite key that replays in a different column order is a
 * different key, and losing that order would make two genuinely different keys compare equal.
 */
export async function buildTableSchemaSnapshot(
  queryRunner: QueryRunner,
  schema: string,
  relationId: string,
  columnNames: Record<string, string>
): Promise<TableSchemaSnapshot> {
  const [rawColumns, primaryKey, uniqueConstraints, indexes, foreignKeys] = await Promise.all([
    queryRunner.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position`,
      [schema, relationId]
    ),
    fetchPrimaryKeyColumns(queryRunner, schema, relationId),
    fetchUniqueConstraints(queryRunner, schema, relationId),
    fetchIndexes(queryRunner, schema, relationId),
    fetchForeignKeys(queryRunner, schema, relationId),
  ]);

  const primaryKeySet = new Set(primaryKey);
  const columns: TableSchemaSnapshotColumn[] = rawColumns.map((col) => ({
    name: col.column_name,
    uuid: columnNames[col.column_name],
    data_type: col.data_type,
    is_nullable: col.is_nullable === 'YES',
    default: col.column_default,
    is_primary_key: primaryKeySet.has(col.column_name),
  }));

  return {
    columns,
    primary_key: primaryKey,
    unique_constraints: uniqueConstraints,
    indexes,
    foreign_keys: foreignKeys,
  };
}

async function fetchPrimaryKeyColumns(queryRunner: QueryRunner, schema: string, tableName: string): Promise<string[]> {
  const rows: Array<{ column_name: string }> = await queryRunner.query(
    `SELECT a.attname AS column_name
     FROM pg_constraint c
     JOIN pg_class t ON t.oid = c.conrelid
     JOIN pg_namespace n ON n.oid = t.relnamespace
     JOIN unnest(c.conkey) WITH ORDINALITY AS ck(attnum, ord) ON true
     JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ck.attnum
     WHERE c.contype = 'p' AND n.nspname = $1 AND t.relname = $2
     ORDER BY ck.ord`,
    [schema, tableName]
  );
  return rows.map((r) => r.column_name);
}

async function fetchUniqueConstraints(
  queryRunner: QueryRunner,
  schema: string,
  tableName: string
): Promise<TableSchemaSnapshotConstraint[]> {
  return queryRunner.query(
    `SELECT c.conname AS name, array_agg(a.attname::text ORDER BY x.n) AS column_names
     FROM pg_constraint c
     JOIN pg_class t ON t.oid = c.conrelid
     JOIN pg_namespace n ON n.oid = t.relnamespace
     JOIN unnest(c.conkey) WITH ORDINALITY AS x(attnum, n) ON true
     JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = x.attnum
     WHERE c.contype = 'u' AND n.nspname = $1 AND t.relname = $2
     GROUP BY c.conname`,
    [schema, tableName]
  );
}

async function fetchIndexes(
  queryRunner: QueryRunner,
  schema: string,
  tableName: string
): Promise<TableSchemaSnapshotIndex[]> {
  return queryRunner.query(
    `SELECT ic.relname AS name, array_agg(a.attname::text ORDER BY x.n) AS column_names, ix.indisunique AS is_unique
     FROM pg_index ix
     JOIN pg_class t ON t.oid = ix.indrelid
     JOIN pg_class ic ON ic.oid = ix.indexrelid
     JOIN pg_namespace n ON n.oid = t.relnamespace
     JOIN unnest(ix.indkey::int2[]) WITH ORDINALITY AS x(attnum, n) ON true
     JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = x.attnum
     WHERE n.nspname = $1 AND t.relname = $2
     GROUP BY ic.relname, ix.indisunique`,
    [schema, tableName]
  );
}

/**
 * Exported for foreign-key operations' normalize/apply split: identifying "the constraint named X"
 * or "the constraint matching this structural shape" reuses this same introspection rather than a
 * second copy of the conkey/confkey join.
 */
export async function fetchForeignKeys(
  queryRunner: Queryable,
  schema: string,
  tableName: string
): Promise<TableSchemaSnapshotForeignKey[]> {
  return queryRunner.query(
    `SELECT
       c.conname AS name,
       array_agg(a.attname::text ORDER BY x.n) AS column_names,
       rt.relname AS referenced_table,
       array_agg(ra.attname::text ORDER BY x.n) AS referenced_column_names
     FROM pg_constraint c
     JOIN pg_class t ON t.oid = c.conrelid
     JOIN pg_namespace n ON n.oid = t.relnamespace
     JOIN pg_class rt ON rt.oid = c.confrelid
     JOIN unnest(c.conkey) WITH ORDINALITY AS x(attnum, n) ON true
     JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = x.attnum
     JOIN unnest(c.confkey) WITH ORDINALITY AS y(attnum, n) ON y.n = x.n
     JOIN pg_attribute ra ON ra.attrelid = rt.oid AND ra.attnum = y.attnum
     WHERE c.contype = 'f' AND n.nspname = $1 AND t.relname = $2
     GROUP BY c.conname, rt.relname`,
    [schema, tableName]
  );
}
