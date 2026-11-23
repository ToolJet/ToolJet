import { BadRequestException } from '@nestjs/common';

export type ColumnDefault = { column_name: string; column_default: string | null };

export const quoteIdentifier = (name: string): string => `"${name.replace(/"/g, '""')}"`;

// The column must exist and carry a default, and `where` must name exactly the primary key: no key, a partial key
// or a non-key column would match more than one row.
export function assertCanSetDefault(
  column: string,
  where: Record<string, unknown>,
  columns: ColumnDefault[],
  primaryKeys: string[]
): void {
  const target = columns.find((candidate) => candidate.column_name === column);
  if (!target) throw new BadRequestException(`Column "${column}" does not exist`);
  if (target.column_default == null) throw new BadRequestException(`Column "${column}" has no default value`);
  if (primaryKeys.length === 0) throw new BadRequestException('The table has no primary key to identify the row');
  const given = Object.keys(where);
  const matchesKey =
    given.length === primaryKeys.length && primaryKeys.every((key) => given.includes(key) && where[key] != null);
  if (!matchesKey) throw new BadRequestException('Every primary key column needs a value to identify the row');
}

export function buildSetDefaultQuery(
  schema: string,
  relationId: string,
  column: string,
  where: Record<string, string | number | boolean>,
  primaryKeys: string[]
): { sql: string; params: Array<string | number | boolean> } {
  const conditions = primaryKeys.map((key, index) => `${quoteIdentifier(key)} = $${index + 1}`);
  return {
    sql:
      `UPDATE ${quoteIdentifier(schema)}.${quoteIdentifier(relationId)} SET ${quoteIdentifier(column)} = DEFAULT ` +
      `WHERE ${conditions.join(' AND ')} RETURNING ${quoteIdentifier(column)} AS value`,
    params: primaryKeys.map((key) => where[key]),
  };
}
