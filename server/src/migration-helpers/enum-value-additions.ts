import { Migration } from 'typeorm';

/**
 * Matches `ALTER TYPE <type> ADD VALUE [IF NOT EXISTS] '<value>'` inside a migration's
 * SQL. <type> may be quoted and schema-qualified, so all of these are captured:
 *   ALTER TYPE source ADD VALUE 'openid'
 *   ALTER TYPE "resource_type" ADD VALUE IF NOT EXISTS 'workflow'
 *   ALTER TYPE "public"."resource_type" ADD VALUE IF NOT EXISTS 'workflow_folder'
 * Capture 1 = the type expression verbatim; capture 2 = the enum value.
 */
export const ADD_ENUM_VALUE_REGEX =
  /ALTER\s+TYPE\s+((?:"[^"]+"|[A-Za-z_]\w*)(?:\.(?:"[^"]+"|[A-Za-z_]\w*))?)\s+ADD\s+VALUE\s+(?:IF\s+NOT\s+EXISTS\s+)?'([^']+)'/gi;

export interface EnumValueAddition {
  typeExpression: string; // verbatim, e.g. "public"."resource_type"
  typeName: string; // bare, unquoted, e.g. resource_type
  value: string; // e.g. workflow_folder
  migrationName: string;
}

// Bare, unquoted type name for pg_type lookups — the last dotted segment, minus quotes.
export function bareTypeName(typeExpression: string): string {
  return (typeExpression.split('.').pop() ?? typeExpression).replace(/"/g, '');
}

/**
 * Scans each migration's up() source for `ALTER TYPE ... ADD VALUE` statements. up()
 * bodies in this repo issue enum additions as literal SQL strings, so reading the
 * function source is enough to find them without executing anything.
 */
export function extractEnumValueAdditions(migrations: Migration[]): EnumValueAddition[] {
  const additions: EnumValueAddition[] = [];
  for (const migration of migrations) {
    const up = migration.instance?.up;
    if (!up) continue;
    const source = up.toString();
    for (const match of source.matchAll(ADD_ENUM_VALUE_REGEX)) {
      const [, typeExpression, value] = match;
      additions.push({ typeExpression, typeName: bareTypeName(typeExpression), value, migrationName: migration.name });
    }
  }
  return additions;
}
