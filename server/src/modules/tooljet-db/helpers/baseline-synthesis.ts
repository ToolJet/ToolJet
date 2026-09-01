import { QueryRunner } from 'typeorm';
import {
  buildTableSchemaSnapshot,
  TableSchemaSnapshotColumn,
  TableSchemaSnapshotForeignKey,
} from '@modules/tooljet-db/helpers/table-schema-snapshot';

export interface BaselineMigration {
  sequence: number;
  payload: any;
  resultingSchema: any;
}

/**
 * Pure metadata write: records what the physical table already looks like as one (or two)
 * "baseline" migration rows, fully applied. Never executes DDL against the TJDB — the table's
 * shape already matches what's being recorded. Throws (caller stores the message as
 * baseline_error) for the known unbaselineable cases: missing physical relation, or a foreign
 * key referencing a composite primary key (TJDB's structured-migration format can't represent
 * that shape).
 */
export async function synthesizeBaseline(
  queryRunner: QueryRunner,
  tjdbQueryRunner: QueryRunner,
  schema: string,
  tableId: string,
  configurations: any
): Promise<BaselineMigration[]> {
  const [{ oid }] = await tjdbQueryRunner.query(`SELECT to_regclass($1) AS oid`, [`"${schema}"."${tableId}"`]);
  if (!oid) throw new Error(`physical relation "${schema}"."${tableId}" does not exist`);

  const columnNames = configurations.columns.column_names;
  const snapshot = await buildTableSchemaSnapshot(tjdbQueryRunner, schema, tableId, columnNames);

  // Referenced tables live in this same tenant schema - cross-workspace foreign keys are not
  // reachable through the app (fetchAndCheckIfValidForeignKeyTables scopes candidates to the
  // organization), so the composite-PK check never needs to cross a schema boundary.
  for (const fk of snapshot.foreign_keys) {
    const referencedSnapshot = await buildTableSchemaSnapshot(tjdbQueryRunner, schema, fk.referenced_table, {});
    if (
      referencedSnapshot.primary_key.length > 1 &&
      fk.referenced_column_names.some((c) => referencedSnapshot.primary_key.includes(c))
    ) {
      throw new Error(
        `foreign key "${fk.name}" references composite primary key of "${schema}"."${fk.referenced_table}"`
      );
    }
  }

  // resulting_schema is "shape at authoring time" per migration row, not a shared final shape —
  // the sequence-1 (create) row predates the FKs, so it must not claim them.
  const migrations: BaselineMigration[] = [
    {
      sequence: 1,
      payload: {
        ddl: buildCreateTableDdl(schema, tableId, snapshot.columns, snapshot.primary_key),
        refs: {},
        // Portability contract (also relied on by raw-SQL migrations): the DDL never bakes
        // in a physical relation id. "{{self}}" is the relation this migration is replayed onto;
        // every other placeholder is a key into `refs`, resolved through the FK's co_relation_id
        // to whichever relation stands for that table in the replay target's own environment.
        // column_uuids rides alongside the DDL so replay can assign the same column identities
        // the source table already has, instead of minting fresh ones for the target relation.
        column_uuids: columnNames,
      },
      resultingSchema: {
        columns: snapshot.columns,
        primary_key: snapshot.primary_key,
        unique_constraints: snapshot.unique_constraints,
        indexes: snapshot.indexes,
        foreign_keys: [],
      },
    },
  ];
  if (snapshot.foreign_keys.length) {
    const refs: Record<string, string> = {};
    const ddl = await buildForeignKeyDdl(queryRunner, schema, snapshot.foreign_keys, refs);
    migrations.push({
      sequence: 2,
      payload: { ddl, refs },
      resultingSchema: {
        columns: snapshot.columns,
        primary_key: snapshot.primary_key,
        unique_constraints: snapshot.unique_constraints,
        indexes: snapshot.indexes,
        foreign_keys: snapshot.foreign_keys,
      },
    });
  }

  return migrations;
}

// Schema is baked in as a literal, not a placeholder: TJDB's tenant schema is one per
// organization, shared by every environment - unlike a relation id, it never differs between
// the relation this migration was recorded against and whatever relation replays it.
export function buildCreateTableDdl(
  schema: string,
  tableId: string,
  columns: TableSchemaSnapshotColumn[],
  primaryKeyColumns: string[]
): string {
  const { columns: rewrittenColumns, sequenceDdl, ownershipDdl } = rewriteSerialDefaults(schema, tableId, columns);

  const columnDdl = rewrittenColumns.map((col) => {
    const notNull = col.is_nullable ? '' : ' NOT NULL';
    const withDefault = col.default ? ` DEFAULT ${col.default}` : '';
    return `  "${col.name}" ${col.data_type}${notNull}${withDefault}`;
  });
  if (primaryKeyColumns.length) {
    columnDdl.push(`  PRIMARY KEY (${primaryKeyColumns.map((c) => `"${c}"`).join(', ')})`);
  }
  const createTable = `CREATE TABLE "${schema}"."{{self}}" (\n${columnDdl.join(',\n')}\n)`;
  return [...sequenceDdl, createTable, ...ownershipDdl].join(';\n');
}

/**
 * A `serial`/identity column's introspected default is `nextval('"<schema>"."<tableId>_..._seq"'::regclass)`
 * - the physical relation id of the table being read from, baked into the sequence name the same
 * way a physical relation id could leak into any other part of generated DDL. Left as a literal, a
 * relation minted from these columns would have its id column default point at the *source's*
 * sequence object - two relations sharing one counter, and a dangling default if the source is later
 * dropped (the sequence is OWNED BY its column). Rewritten here to a `{{self}}`-derived sequence
 * name, to be created fresh for whichever relation this ends up applying to - the same placeholder
 * substitution `{{self}}` already gets for the table name itself.
 *
 * Exported standalone (not just through `buildCreateTableDdl`) so a caller with a `LIKE`-created
 * relation - which inherits the source's default expressions verbatim, sequence name included - can
 * detect and rewrite them the same way generated DDL does, without going through DDL generation at all.
 */
export function rewriteSerialDefaults(
  schema: string,
  tableId: string,
  columns: TableSchemaSnapshotColumn[]
): { columns: TableSchemaSnapshotColumn[]; sequenceDdl: string[]; ownershipDdl: string[] } {
  const sequenceDdl: string[] = [];
  const ownershipDdl: string[] = [];

  const rewritten = columns.map((col) => {
    const suffix = ownSequenceSuffix(schema, tableId, col.default);
    if (!suffix) return col;
    const sequenceRef = `"${schema}"."{{self}}${suffix}"`;
    sequenceDdl.push(`CREATE SEQUENCE ${sequenceRef}`);
    ownershipDdl.push(`ALTER SEQUENCE ${sequenceRef} OWNED BY "${schema}"."{{self}}"."${col.name}"`);
    return { ...col, default: `nextval('${sequenceRef}'::regclass)` };
  });

  return { columns: rewritten, sequenceDdl, ownershipDdl };
}

/**
 * A column's default is "its own" sequence only when the sequence name is derived from this
 * exact physical relation id - the pattern Postgres emits for a column it created via
 * `serial`/`GENERATED ... AS IDENTITY`. Returns the suffix after `"<tableId>_"` (e.g. `id_seq`)
 * so the caller can rebuild the same name against `{{self}}`; returns null for every other kind
 * of default (a literal, a different function call, a sequence some other table owns, NULL) -
 * those are copied through unchanged.
 */
function ownSequenceSuffix(schema: string, tableId: string, columnDefault: string | null): string | null {
  if (!columnDefault) return null;
  const match = columnDefault.match(
    new RegExp(`^nextval\\('(?:"${schema}"\\.)?"${tableId}(_[a-zA-Z0-9_]+)"'::regclass\\)$`)
  );
  return match ? match[1] : null;
}

/**
 * Every row this migration baselines still satisfies relation.id === internal_table.id (true for
 * every row that predates this migration), including whatever a foreign key references - so a
 * referenced relation id is looked up as an internal_tables id directly. This shortcut is only
 * safe here; normal perform()/replay code must go through the relation resolver instead.
 */
export async function buildForeignKeyDdl(
  queryRunner: QueryRunner,
  schema: string,
  foreignKeys: TableSchemaSnapshotForeignKey[],
  refs: Record<string, string>
): Promise<string> {
  const placeholderByRelationId = new Map<string, string>();
  const statements: string[] = [];

  for (const fk of foreignKeys) {
    let placeholder = placeholderByRelationId.get(fk.referenced_table);
    if (!placeholder) {
      const [row] = await queryRunner.query(`SELECT co_relation_id FROM internal_tables WHERE id = $1`, [
        fk.referenced_table,
      ]);
      if (!row) throw new Error(`foreign key "${fk.name}" references unknown internal table "${fk.referenced_table}"`);
      placeholder = `ref_${placeholderByRelationId.size}`;
      placeholderByRelationId.set(fk.referenced_table, placeholder);
      refs[placeholder] = row.co_relation_id;
    }

    statements.push(
      `ALTER TABLE "${schema}"."{{self}}" ADD CONSTRAINT "${fk.name}" FOREIGN KEY (${fk.column_names
        .map((c) => `"${c}"`)
        .join(', ')}) REFERENCES "${schema}"."{{${placeholder}}}" (${fk.referenced_column_names
        .map((c) => `"${c}"`)
        .join(', ')})`
    );
  }

  return statements.join(';\n');
}
