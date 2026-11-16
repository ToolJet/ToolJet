import { Injectable } from '@nestjs/common';
import { InternalTableMigration } from '@entities/internal_table_migration.entity';
import { StructuredMigrationPayload } from './tooljet-db-migration-recorder.service';
import { TableSchemaSnapshot, TableSchemaSnapshotColumn } from '../helpers/table-schema-snapshot';

type ColumnDef = {
  column_name: string;
  data_type: string;
  column_default?: string | number | boolean | null;
  constraints_type?: { is_not_null?: boolean; is_unique?: boolean; is_primary_key?: boolean };
};

type ForeignKeyDef = {
  column_names: string[];
  referenced_table_name: string;
  referenced_column_names: string[];
  on_delete?: string;
  on_update?: string;
};

const NUMERIC_TYPES = new Set([
  'integer',
  'int',
  'int4',
  'int8',
  'bigint',
  'smallint',
  'serial',
  'bigserial',
  'smallserial',
  'numeric',
  'real',
  'double precision',
  'decimal',
  'float4',
  'float8',
]);

function formatDefaultValue(value: string | number | boolean, dataType: string): string {
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (NUMERIC_TYPES.has(dataType) && value !== '' && !isNaN(Number(value))) return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function hasDefault(value: string | number | boolean | null | undefined): value is string | number | boolean {
  return value !== undefined && value !== null && value !== '';
}

function columnDefinitionSql(column: ColumnDef): string {
  const parts = [`${column.column_name} ${column.data_type}`];
  if (hasDefault(column.column_default))
    parts.push(`DEFAULT ${formatDefaultValue(column.column_default, column.data_type)}`);
  if (column.constraints_type?.is_not_null) parts.push('NOT NULL');
  if (column.constraints_type?.is_unique) parts.push('UNIQUE');
  return parts.join(' ');
}

// Baseline rows record physical relation ids and a physical table shape, so rendering one needs the
// table's current name and a relation-id -> table-name lookup for every foreign key's target.
export type BaselineSqlContext = {
  tableName: string;
  tableNameByRelationId: Map<string, string>;
};

const BASELINE_DESCRIPTION = 'Recorded from the table as it existed when environments were enabled. No SQL was run.';

const SERIAL_TYPE_BY_INTEGER_TYPE: Record<string, string> = {
  integer: 'serial',
  bigint: 'bigserial',
  smallint: 'smallserial',
};
const SEQUENCE_DEFAULT = /^nextval\('.*_seq"?'::regclass\)$/;

function baselineColumnSql(column: TableSchemaSnapshotColumn): string {
  const serialType = SEQUENCE_DEFAULT.test(column.default ?? '') && SERIAL_TYPE_BY_INTEGER_TYPE[column.data_type];
  const parts = [`${column.name} ${serialType || column.data_type}`];
  if (!column.is_nullable) parts.push('NOT NULL');
  // A snapshot default is already a Postgres expression ('open'::text, now()), so it is not re-quoted.
  if (!serialType && column.default) parts.push(`DEFAULT ${column.default}`);
  return parts.join(' ');
}

function foreignKeyAlterSql(tableName: string, fk: ForeignKeyDef): string {
  let clause = `ALTER TABLE ${tableName} ADD FOREIGN KEY (${fk.column_names.join(', ')}) REFERENCES ${fk.referenced_table_name}(${fk.referenced_column_names.join(', ')})`;
  if (fk.on_delete) clause += ` ON DELETE ${fk.on_delete}`;
  if (fk.on_update) clause += ` ON UPDATE ${fk.on_update}`;
  return `${clause};`;
}

/**
 * Turns a stored structured-migration payload back into a display DDL string, for the migration
 * history drawer and the promote preview screen. Display only — never executed, and deliberately
 * separate from `replayStructuredMigration` (the real apply/promote path), which re-runs the
 * forward action via query-builder calls rather than producing a SQL string.
 *
 * `payload.request` is always the raw, untransformed controller DTO for all 9 recorded actions
 * (confirmed at every `.record()` call site in tooljet-db-table-operations.service.ts) — no
 * intermediate normalized-request type needed.
 */
@Injectable()
export class TooljetDbMigrationSqlCompilerService {
  compile(migration: InternalTableMigration, baselineContext?: BaselineSqlContext): string | null {
    if (migration.kind === 'raw_sql') {
      return (migration.payload as { sql: string })?.sql ?? null;
    }
    if (migration.kind === 'baseline') {
      return baselineContext ? this.compileBaseline(migration, baselineContext) : null;
    }

    const payload = migration.payload as StructuredMigrationPayload;
    switch (payload.action) {
      case 'create_table':
        return this.compileCreateTable(payload.request);
      case 'drop_table':
        return `DROP TABLE ${payload.request.table_name};`;
      case 'add_column':
        return this.compileAddColumn(payload.request);
      case 'drop_column':
        return `ALTER TABLE ${payload.request.table_name} DROP COLUMN ${payload.request.column.column_name};`;
      case 'edit_column':
        return this.compileEditColumn(payload.request);
      case 'edit_table':
        return this.compileEditTable(payload.request);
      case 'create_foreign_key':
        return payload.request.foreign_keys
          .map((fk: ForeignKeyDef) => foreignKeyAlterSql(payload.request.table_name, fk))
          .join('\n');
      case 'update_foreign_key':
        return [
          `-- Updates foreign key constraint ${payload.request.foreign_key_id}`,
          ...payload.request.foreign_keys.map((fk: ForeignKeyDef) =>
            foreignKeyAlterSql(payload.request.table_name, fk)
          ),
        ].join('\n');
      case 'delete_foreign_key':
        // `foreign_key_id` is the constraint's name on the relation it was authored against. Quoted:
        // those names are derived from the relation uuid, hyphens included.
        return `ALTER TABLE ${payload.request.table_name} DROP CONSTRAINT "${payload.request.foreign_key_id}";`;
      default:
        return null;
    }
  }

  /**
   * Baseline rows are written without a name or description (Migration A, repairBaseline), so the
   * history drawer derives them on read. Mirrors `defaultMigrationName` in the recorder. A stored
   * name or description always wins at the call site.
   */
  baselineLabel(migration: InternalTableMigration, tableName: string): { name: string; description: string } | null {
    if (migration.kind !== 'baseline') return null;
    return {
      name: Number(migration.sequence) === 1 ? `Create table "${tableName}"` : `Add foreign keys on "${tableName}"`,
      description: BASELINE_DESCRIPTION,
    };
  }

  /**
   * A baseline is recorded from the physical table, never run, so there is no authored request to
   * replay. Display SQL is rebuilt from `resultingSchema` (not `payload.ddl`, which is replay DDL full
   * of `{{self}}` placeholders and sequence statements). Sequence 1 is the CREATE TABLE; sequence 2
   * carries the foreign keys. ON DELETE / ON UPDATE are not part of the snapshot and are omitted.
   */
  private compileBaseline(migration: InternalTableMigration, context: BaselineSqlContext): string | null {
    const schema = migration.resultingSchema as TableSchemaSnapshot | null;
    if (!schema) return null;
    const header = '-- Reconstructed from the existing table (not executed)';
    const body = schema.foreign_keys.length
      ? this.compileBaselineForeignKeys(schema, context)
      : this.compileBaselineCreateTable(schema, context.tableName);
    return `${header}\n${body}`;
  }

  private compileBaselineCreateTable(schema: TableSchemaSnapshot, tableName: string): string {
    const lines = schema.columns.map((column) => `  ${baselineColumnSql(column)}`);
    if (schema.primary_key.length) lines.push(`  PRIMARY KEY (${schema.primary_key.join(', ')})`);
    schema.unique_constraints.forEach((constraint) => lines.push(`  UNIQUE (${constraint.column_names.join(', ')})`));
    return `CREATE TABLE ${tableName} (\n${lines.join(',\n')}\n);`;
  }

  private compileBaselineForeignKeys(schema: TableSchemaSnapshot, context: BaselineSqlContext): string {
    return schema.foreign_keys
      .map((fk) => {
        const referencedTableName = context.tableNameByRelationId.get(fk.referenced_table);
        if (!referencedTableName) {
          return `-- foreign key (${fk.column_names.join(', ')}) references a table that could not be found`;
        }
        return foreignKeyAlterSql(context.tableName, {
          column_names: fk.column_names,
          referenced_table_name: referencedTableName,
          referenced_column_names: fk.referenced_column_names,
        });
      })
      .join('\n');
  }

  private compileCreateTable(request: {
    table_name: string;
    columns: ColumnDef[];
    foreign_keys?: ForeignKeyDef[];
  }): string {
    const columnLines = request.columns.map((c) => `  ${columnDefinitionSql(c)}`);
    const primaryKeyColumns = request.columns.filter((c) => c.constraints_type?.is_primary_key);
    if (primaryKeyColumns.length)
      columnLines.push(`  PRIMARY KEY (${primaryKeyColumns.map((c) => c.column_name).join(', ')})`);
    const lines = [`CREATE TABLE ${request.table_name} (\n${columnLines.join(',\n')}\n);`];
    (request.foreign_keys || []).forEach((fk) => lines.push(foreignKeyAlterSql(request.table_name, fk)));
    return lines.join('\n');
  }

  private compileAddColumn(request: { table_name: string; column: ColumnDef; foreign_keys?: ForeignKeyDef[] }): string {
    const lines = [`ALTER TABLE ${request.table_name}\n  ADD COLUMN ${columnDefinitionSql(request.column)};`];
    (request.foreign_keys || []).forEach((fk) => lines.push(foreignKeyAlterSql(request.table_name, fk)));
    return lines.join('\n');
  }

  private compileEditColumn(request: {
    table_name: string;
    column: ColumnDef & { column_name: string; new_column_name?: string };
  }): string {
    const { table_name, column } = request;
    const lines: string[] = [];
    const isRenamed = column.new_column_name && column.new_column_name !== column.column_name;
    if (isRenamed)
      lines.push(`ALTER TABLE ${table_name} RENAME COLUMN ${column.column_name} TO ${column.new_column_name};`);
    const targetName = column.new_column_name || column.column_name;
    if (column.data_type) lines.push(`ALTER TABLE ${table_name} ALTER COLUMN ${targetName} TYPE ${column.data_type};`);
    // The request is the column's full target definition (applied via changeColumn), so an absent
    // default / NOT NULL means "remove it", not "leave it alone".
    if (hasDefault(column.column_default)) {
      lines.push(
        `ALTER TABLE ${table_name} ALTER COLUMN ${targetName} SET DEFAULT ${formatDefaultValue(column.column_default, column.data_type)};`
      );
    } else {
      lines.push(`ALTER TABLE ${table_name} ALTER COLUMN ${targetName} DROP DEFAULT;`);
    }
    lines.push(
      `ALTER TABLE ${table_name} ALTER COLUMN ${targetName} ${column.constraints_type?.is_not_null ? 'SET' : 'DROP'} NOT NULL;`
    );
    return lines.join('\n');
  }

  private compileEditTable(request: {
    table_name: string;
    new_table_name?: string;
    columns: Array<{ old_column?: ColumnDef; new_column?: ColumnDef }>;
  }): string {
    const lines: string[] = [];
    const isRenamed = request.new_table_name && request.new_table_name !== request.table_name;
    if (isRenamed) lines.push(`ALTER TABLE ${request.table_name} RENAME TO ${request.new_table_name};`);
    const tableName = request.new_table_name || request.table_name;

    (request.columns || []).forEach(({ old_column, new_column }) => {
      if (old_column && new_column) {
        if (new_column.column_name !== old_column.column_name) {
          lines.push(`ALTER TABLE ${tableName} RENAME COLUMN ${old_column.column_name} TO ${new_column.column_name};`);
        }
        lines.push(`ALTER TABLE ${tableName} ALTER COLUMN ${new_column.column_name} TYPE ${new_column.data_type};`);
      } else if (new_column && !old_column) {
        lines.push(`ALTER TABLE ${tableName}\n  ADD COLUMN ${columnDefinitionSql(new_column)};`);
      } else if (old_column && !new_column) {
        lines.push(`ALTER TABLE ${tableName} DROP COLUMN ${old_column.column_name};`);
      }
    });

    return lines.join('\n');
  }
}
