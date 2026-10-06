/**
 * Which column type changes ToolJet offers, and how each one is carried out.
 *
 * Split on data dependency, because that is what decides whether a change can be promoted safely:
 *
 *   'lossless'  -> a structured `edit_column` request carrying the new type. Postgres applies these
 *                  through an implicit cast, so no USING clause is needed and the outcome cannot
 *                  depend on the rows. Must stay in lockstep with STRUCTURED_TYPE_CHANGES in
 *                  server/src/modules/tooljet-db/helpers/column-type-change.ts.
 *   'safe'      -> generated `ALTER ... USING ...` recorded as a raw SQL migration. Needs the cast
 *                  spelled out, but no value can fail it.
 *   'may_fail'  -> same, but a bad row raises 22P02/22003. These carry a `probe`: a descriptor for
 *                  the condition that is TRUE for a value that will cast - `{ kind: 'regex', pattern,
 *                  ci? }` or `{ kind: 'range', min, max }`. Used both to build the SQL that counts
 *                  offending rows (`buildCastabilityCountQuery`) and, for regex probes, the PostgREST
 *                  filter that shows them (`inconsistentRowsFilter`) - one descriptor, two consumers,
 *                  so the "does this value cast" definition can't drift between the two.
 *
 * Anything absent from this table is blocked, deliberately. Notably absent:
 *   - `double precision -> integer/bigint`, `integer/bigint -> boolean`: succeed while silently
 *     changing values. A user who wants rounding writes `USING round(x)::integer` themselves.
 *   - `character varying <-> timestamp with time zone`: the result depends on the Postgres session's
 *     TimeZone/DateStyle, which the TJDB pool does not set, so dev and prod can produce different
 *     values from identical rows. A date conversion needs an explicit `to_timestamp(x, 'FMT')`.
 *   - anything involving `serial`: it is a sequence plus a default, not a type.
 *
 * Types are `information_schema.columns.data_type` spellings, matching `dataTypes` in ./constants.
 */

// POSIX character classes, not \d / \s: these patterns travel through the SQL-mode AST parser on
// their way to Postgres, and backslash escapes are the first thing to break there.
const INTEGER_PROBE = { kind: 'regex', pattern: `^[[:space:]]*[+-]?[0-9]+[[:space:]]*$` };
const FLOAT_PROBE = {
  kind: 'regex',
  pattern: `^[[:space:]]*[+-]?([0-9]+\\.?[0-9]*|\\.[0-9]+)([eE][+-]?[0-9]+)?[[:space:]]*$`,
};
// Case-insensitive regex, not `lower(btrim(col)) IN (...)` - same set of accepted spellings, but a
// regex is also a PostgREST `match`/`imatch` filter, so this stays usable by inconsistentRowsFilter
// below. A SQL function wrapped around the column (lower/btrim) has no PostgREST equivalent.
const BOOLEAN_PROBE = {
  kind: 'regex',
  ci: true,
  pattern: `^[[:space:]]*(t|true|y|yes|on|1|f|false|n|no|off|0)[[:space:]]*$`,
};
const INT4_RANGE_PROBE = { kind: 'range', min: -2147483648, max: 2147483647 };

export const CAST_TIERS = [
  { from: 'integer', to: 'bigint', tier: 'lossless' },
  { from: 'integer', to: 'double precision', tier: 'lossless' },
  { from: 'bigint', to: 'double precision', tier: 'lossless' },

  { from: 'integer', to: 'character varying', tier: 'safe' },
  { from: 'bigint', to: 'character varying', tier: 'safe' },
  { from: 'double precision', to: 'character varying', tier: 'safe' },
  { from: 'boolean', to: 'character varying', tier: 'safe' },

  { from: 'character varying', to: 'integer', tier: 'may_fail', probe: INTEGER_PROBE },
  { from: 'character varying', to: 'bigint', tier: 'may_fail', probe: INTEGER_PROBE },
  { from: 'character varying', to: 'double precision', tier: 'may_fail', probe: FLOAT_PROBE },
  { from: 'character varying', to: 'boolean', tier: 'may_fail', probe: BOOLEAN_PROBE },
  // No predicate can express "is valid JSON" in plain SQL on PG13 (pg_input_is_valid is PG16), so
  // this one cannot be checked in advance - the report says so rather than claiming zero bad rows.
  { from: 'character varying', to: 'jsonb', tier: 'may_fail', probe: null },
  { from: 'bigint', to: 'integer', tier: 'may_fail', probe: INT4_RANGE_PROBE },
];

const BLOCKED_REASONS = [
  {
    match: (from, to) => from === 'double precision' && (to === 'integer' || to === 'bigint'),
    reason: 'Converting a decimal to a whole number would round every value without warning.',
  },
  {
    match: (from, to) => (from === 'integer' || from === 'bigint') && to === 'boolean',
    reason: 'Every non-zero number would become true, collapsing distinct values.',
  },
  // `general: true` - these two hold regardless of the column's current type, so the dropdown's
  // "not seeing the type you need?" popover always shows them, on top of whatever is context-specific.
  {
    match: (from, to) => from === 'serial' || to === 'serial',
    reason: 'Auto-incrementing columns carry a sequence that would have to change with them.',
    general: true,
  },
  {
    match: (from, to) =>
      (from === 'character varying' && to === 'timestamp with time zone') ||
      (from === 'timestamp with time zone' && to === 'character varying'),
    reason:
      'Date conversions depend on the database timezone, so environments could end up with ' +
      'different values. Write the conversion yourself with an explicit format.',
    general: true,
  },
];

export const ALWAYS_BLOCKED_REASONS = BLOCKED_REASONS.filter((entry) => entry.general).map((entry) => entry.reason);

export function castFor(fromType, toType) {
  return CAST_TIERS.find((entry) => entry.from === fromType && entry.to === toType);
}

export function allowedTargets(fromType) {
  return CAST_TIERS.filter((entry) => entry.from === fromType).map(({ to, tier }) => ({ to, tier }));
}

export function blockedReason(fromType, toType) {
  if (fromType === toType || castFor(fromType, toType)) return null;
  const specific = BLOCKED_REASONS.find(({ match }) => match(fromType, toType));
  return specific ? specific.reason : 'This conversion is not supported. Write a SQL migration instead.';
}

function quoteIdentifier(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

/**
 * `{{self}}` is substituted server-side with the relation being targeted, so the same recorded SQL
 * replays correctly into every environment - never write a physical table name here.
 *
 * DROP DEFAULT comes first because `ALTER COLUMN ... TYPE` also casts the existing default, so a
 * varchar column defaulting to 'abc' fails even with a valid USING clause. The default is not
 * re-added: only the user knows what it should be in the new type, and a wrong guess is worse than
 * no default.
 *
 * @param targetType must come from CAST_TIERS, never from free text - it is interpolated into DDL.
 */
export function buildTypeChangeSql({ columnName, targetType, hasDefault }) {
  const col = quoteIdentifier(columnName);
  const statements = [];
  if (hasDefault) {
    statements.push(`-- The old default cannot survive the cast. Set a new one below if you need it.`);
    statements.push(`ALTER TABLE "{{self}}" ALTER COLUMN ${col} DROP DEFAULT;`);
  }
  statements.push(`ALTER TABLE "{{self}}" ALTER COLUMN ${col} TYPE ${targetType} USING ${col}::${targetType};`);
  return statements.join('\n');
}

// The SQL condition a probe describes, against an already-quoted column identifier. Shared by
// buildCastabilityCountQuery (wrapped in NOT (), for the count) - the one place a probe becomes SQL.
function probeSql(probe, col) {
  if (probe.kind === 'regex') return `${col} ${probe.ci ? '~*' : '~'} '${probe.pattern}'`;
  if (probe.kind === 'range') return `${col} BETWEEN ${probe.min} AND ${probe.max}`;
  return null;
}

/**
 * How many rows in this column fail to cast - a plain count, not a sample, so there's nothing to
 * truncate or slice client-side.
 *
 * `{{self}}` is substituted server-side with the relation being targeted, same as buildTypeChangeSql -
 * seedDataSqlExecution rejects any seed-data SQL that doesn't use it.
 */
export function buildCastabilityCountQuery({ columnName, probe }) {
  if (!probe) return null;
  const col = quoteIdentifier(columnName);
  return `SELECT COUNT(*) FROM "{{self}}" WHERE ${col} IS NOT NULL AND NOT (${probeSql(probe, col)})`;
}

/**
 * The PostgREST column/operator/value shape that filters the table down to the same rows the count
 * above counts - only possible for regex probes (PostgREST has no BETWEEN/function-wrapped filter).
 * Range probes (bigint -> integer overflow) return null; the caller falls back to a count-only
 * message with no "show rows" link for those.
 */
export function inconsistentRowsFilter(probe) {
  if (!probe || probe.kind !== 'regex') return null;
  return { operator: probe.ci ? 'not.imatch' : 'not.match', value: probe.pattern };
}
