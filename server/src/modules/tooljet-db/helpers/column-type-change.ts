import { BadRequestException } from '@nestjs/common';
import { TJDB } from '../types';
import { TableSchemaSnapshotColumn } from './table-schema-snapshot';

/**
 * The only column type changes `edit_column` performs itself.
 *
 * Every pair here is a widening cast Postgres applies through an implicit/assignment cast, so
 * `ALTER COLUMN ... TYPE` needs no `USING` clause and its outcome never depends on the rows in the
 * table. That is what makes them safe to replay into an environment whose data this migration has
 * never seen - every other cast is either row-dependent (`character varying -> integer` fails on
 * one bad row) or silently lossy (`double precision -> integer` rounds), and belongs in a
 * user-reviewed raw SQL migration where the coercion is visible.
 *
 * Because these three emit no `USING` expression, no cast expression is ever generated on the
 * backend - so this list carries no append-only obligation the way a generated-expression matrix
 * would. Ordering is asserted by the unit test; keep it stable.
 *
 * Keyed on `information_schema.columns.data_type` spellings, not the frontend's labels.
 */
export const STRUCTURED_TYPE_CHANGES: ReadonlyArray<readonly [string, string]> = [
  ['integer', 'bigint'],
  ['integer', 'double precision'],
  ['bigint', 'double precision'],
];

/**
 * `serial` is a ToolJet label, not a Postgres type: the column is `integer` with a `nextval(...)`
 * default. A request carrying `data_type: 'serial'` therefore has to compare against the
 * `integer` an introspection will report, or an untouched serial column would read as a type
 * change on every edit.
 */
export function normalizeRequestedType(requestedType: string): string {
  return requestedType === 'serial' ? 'integer' : requestedType;
}

export function isStructuredTypeChangeAllowed(fromType: string, toType: string): boolean {
  return STRUCTURED_TYPE_CHANGES.some(([from, to]) => from === fromType && to === toType);
}

/**
 * @param currentDefault the column's introspected `column_default`, used only to recognise a
 *   serial/identity column - a `nextval` default means the sequence's own type would have to move
 *   with the column's, which v1 does not do.
 */
export function assertStructuredTypeChangeAllowed(
  columnName: string,
  fromType: string,
  toType: string,
  currentDefault: string | null
): void {
  if (fromType === toType) return;

  if (currentDefault && /^nextval\(/.test(currentDefault)) {
    throw new BadRequestException(
      `Cannot change the type of "${columnName}": it is an auto-incrementing column, whose sequence ` +
        `would have to change with it. Record a SQL migration if you need this.`
    );
  }

  if (isStructuredTypeChangeAllowed(fromType, toType)) return;

  throw new BadRequestException(
    `Cannot change column "${columnName}" from ${fromType} to ${toType} directly: this cast either depends ` +
      `on the column's data or would change values silently. Record a SQL migration with an explicit ` +
      `USING clause instead.`
  );
}

const SUPPORTED_TYPES: ReadonlySet<string> = new Set(Object.values(TJDB));

/**
 * `format_type()` (what `buildTableSchemaSnapshot` uses) prints modifiers inline - `character
 * varying(255)`, `numeric(10,2)`, and mid-string as in `timestamp(3) with time zone` - which the
 * supported-type set never carries. Stripped globally rather than off the tail for that mid-string
 * case; without it a merely-parameterised supported type would misread as unsupported.
 */
function normalizeDataType(dataType: string): string {
  return dataType.replace(/\([^)]*\)/g, '').trim();
}

/**
 * Flags columns a raw SQL migration introduced with a type ToolJet Database's structured routes
 * don't support - the caller rejects the migration on a non-empty result, so a column can never
 * reach a state add_column/edit_column afterwards cannot represent.
 *
 * This gate is temporary: it exists only until native Postgres types are escalated into `TJDB`
 * properly. Deleting it is the intended end state, not a regression.
 *
 * Deliberately does not re-flag a pre-existing unsupported column whose type never changed: a
 * migration authored before this check existed (or one that only touches other columns) must not
 * retroactively block every future migration on the table over something its author never touched.
 *
 * Matched on `uuid`, never `name` - a rename in the same migration would otherwise read as a
 * dropped column plus a brand-new one (same reasoning as `findTypeChangedColumns` in
 * `tooljet-db-raw-sql-migration.service.ts`). Arbitrary SQL can add a column before anything mints
 * a uuid for it, so a uuid-less column counts as new rather than matching another uuid-less one.
 */
export function unsupportedColumnTypes(
  before: TableSchemaSnapshotColumn[],
  after: TableSchemaSnapshotColumn[]
): Array<{ name: string; dataType: string }> {
  const previousTypeByUuid = new Map(
    before.filter((column) => column.uuid !== undefined).map((column) => [column.uuid, column.data_type])
  );

  return after
    .filter((column) => {
      if (SUPPORTED_TYPES.has(normalizeDataType(column.data_type))) return false;

      // Absent (new column) reads as a type change against any real type, which is the intent.
      const previousType = column.uuid !== undefined ? previousTypeByUuid.get(column.uuid) : undefined;
      return previousType !== column.data_type;
    })
    .map((column) => ({ name: column.name, dataType: column.data_type }));
}
