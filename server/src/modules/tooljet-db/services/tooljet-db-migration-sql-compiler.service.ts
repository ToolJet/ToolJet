import { Injectable } from '@nestjs/common';
import { InternalTableMigration } from '@entities/internal_table_migration.entity';
import { StructuredMigrationPayload } from './tooljet-db-migration-recorder.service';

type ColumnDef = {
  column_name: string;
  data_type: string;
  column_default?: string | number | boolean | null;
  constraints_type?: { is_not_null?: boolean; is_unique?: boolean };
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
  compile(migration: InternalTableMigration): string | null {
    if (migration.kind === 'raw_sql') {
      return (migration.payload as { sql: string })?.sql ?? null;
    }
    if (migration.kind === 'baseline') {
      return null;
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
        // ponytail: delete_foreign_key's payload only carries the constraint id, not its name or
        // columns, so a real `DROP CONSTRAINT <name>` can't be emitted. Upgrade if that action ever
        // starts recording the removed definition.
        return `-- Foreign key constraint removed (id: ${payload.request.foreign_key_id})`;
      default:
        return null;
    }
  }

  private compileCreateTable(request: {
    table_name: string;
    columns: ColumnDef[];
    foreign_keys?: ForeignKeyDef[];
  }): string {
    const columnLines = request.columns.map((c) => `  ${columnDefinitionSql(c)}`).join(',\n');
    const lines = [`CREATE TABLE ${request.table_name} (\n${columnLines}\n);`];
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
    if (hasDefault(column.column_default)) {
      lines.push(
        `ALTER TABLE ${table_name} ALTER COLUMN ${targetName} SET DEFAULT ${formatDefaultValue(column.column_default, column.data_type)};`
      );
    }
    if (column.constraints_type?.is_not_null)
      lines.push(`ALTER TABLE ${table_name} ALTER COLUMN ${targetName} SET NOT NULL;`);
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
