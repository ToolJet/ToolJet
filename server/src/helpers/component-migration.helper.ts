import { QueryRunner } from 'typeorm';

type JsonObject = Record<string, unknown>;

/**
 * Native-SQL helper for data migrations that rewrite the JSON columns of `components`.
 *
 * FROZEN CONTRACT — migrations that already shipped depend on this exact behaviour.
 * Do not import TypeORM entities here and do not change the semantics below; if a new
 * behaviour is needed, add a new function instead of modifying this one.
 *
 * Column names are the physical `components` columns, not the entity property names
 * (e.g. `general_properties`, not `general`), so entity refactors can't break old migrations.
 */
export interface ComponentJsonRow {
  id: string;
  type: string;
  properties: JsonObject | null;
  styles: JsonObject | null;
  general_properties: JsonObject | null;
  general_styles: JsonObject | null;
  validation: JsonObject | null;
}

interface MigrateComponentsByTypeOptions {
  migrationName: string;
  componentTypes: string[];
  /** Mutates the row's JSON columns in place; every visited row is written back. */
  transform: (row: ComponentJsonRow) => void;
  batchSize?: number;
}

// SQL NULL for null/undefined; JSON.stringify(null) would store a JSON `null` instead.
const toJsonParam = (value: unknown): string | null => (value == null ? null : JSON.stringify(value));

export async function migrateComponentsByType(
  queryRunner: QueryRunner,
  { migrationName, componentTypes, transform, batchSize = 100 }: MigrateComponentsByTypeOptions
): Promise<void> {
  const [{ count }] = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE type = ANY($1::text[])`, [
    componentTypes,
  ]);
  const total = parseInt(count, 10);
  console.log(`${migrationName}: [START] Migrate ${componentTypes.join(', ')} components: ${total}`);

  // Keyset pagination on id: every row is visited exactly once regardless of what the transform changes.
  let lastId = '00000000-0000-0000-0000-000000000000';
  let processed = 0;

  while (true) {
    const rows: ComponentJsonRow[] = await queryRunner.query(
      `SELECT id, type, properties, styles, general_properties, general_styles, validation
       FROM components
       WHERE type = ANY($1::text[]) AND id > $2
       ORDER BY id ASC
       LIMIT $3`,
      [componentTypes, lastId, batchSize]
    );

    if (rows.length === 0) break;
    lastId = rows[rows.length - 1].id;

    for (const row of rows) {
      transform(row);

      await queryRunner.query(
        `UPDATE components SET
           properties = $1::json,
           styles = $2::json,
           general_properties = $3::json,
           general_styles = $4::json,
           validation = $5::json,
           updated_at = now()
         WHERE id = $6`,
        [
          toJsonParam(row.properties),
          toJsonParam(row.styles),
          toJsonParam(row.general_properties),
          toJsonParam(row.general_styles),
          toJsonParam(row.validation),
          row.id,
        ]
      );
    }

    processed += rows.length;
    const percent = total ? ((processed / total) * 100).toFixed(1) : '100.0';
    console.log(`${migrationName}: [PROGRESS] ${processed}/${total} (${percent}%)`);
  }

  console.log(`${migrationName}: [SUCCESS] Migrate ${componentTypes.join(', ')} components finished.`);
}
