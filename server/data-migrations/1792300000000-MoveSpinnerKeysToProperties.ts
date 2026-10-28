import { MigrationInterface, QueryRunner } from 'typeorm';
import { MigrationProgress, deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

// Spinner keys moved from styles/general into properties; existing properties win (same move as migrateProperties on import).
const MIGRATION_NAME = 'MoveSpinnerKeysToProperties1792300000000';
const TYPE = 'Spinner';
const STYLE_KEYS = ['visibility'];
const BATCH_SIZE = 500;

type Bucket = Record<string, unknown> | null;
export interface SpinnerKeysRow {
  properties: Bucket;
  styles: Bucket;
  general_properties: Bucket;
}

export function moveSpinnerKeysToProperties(row: SpinnerKeysRow) {
  const properties = { ...(row.properties ?? {}) };
  const styles = { ...(row.styles ?? {}) };
  const general = row.general_properties ? { ...row.general_properties } : row.general_properties;

  for (const key of STYLE_KEYS) {
    if (styles[key] !== undefined) {
      if (properties[key] === undefined) properties[key] = styles[key];
      delete styles[key];
    }
  }
  if (general && general.tooltip !== undefined) {
    if (properties.tooltip === undefined) properties.tooltip = general.tooltip;
    delete general.tooltip;
  }
  if (properties.tooltipFormat === undefined) properties.tooltipFormat = { value: 'plainText' };

  return { properties, styles, general_properties: general };
}

export class MoveSpinnerKeysToProperties1792300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE type = $1`, [TYPE]);
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Move Spinner keys to properties: ${total}`);
    if (total === 0) {
      console.log(`${MIGRATION_NAME}: [SUCCESS] Move Spinner keys to properties finished.`);
      return;
    }

    const progress = new MigrationProgress(MIGRATION_NAME, total);
    const appVersionIds = new Set<string>();
    let lastId = '00000000-0000-0000-0000-000000000000';

    // Keyset paging on id: updated rows never shift later pages.
    while (true) {
      const rows: ({ id: string; app_version_id: string | null } & SpinnerKeysRow)[] = await queryRunner.query(
        `SELECT c.id, c.properties, c.styles, c.general_properties, p.app_version_id
           FROM components c
           LEFT JOIN pages p ON c.page_id = p.id
          WHERE c.type = $1 AND c.id > $2
          ORDER BY c.id ASC
          LIMIT $3`,
        [TYPE, lastId, BATCH_SIZE]
      );
      if (rows.length === 0) break;
      lastId = rows[rows.length - 1].id;

      for (const row of rows) {
        const moved = moveSpinnerKeysToProperties(row);
        await queryRunner.query(
          `UPDATE components SET properties = $1, styles = $2, general_properties = $3 WHERE id = $4`,
          [
            JSON.stringify(moved.properties),
            JSON.stringify(moved.styles),
            moved.general_properties ? JSON.stringify(moved.general_properties) : moved.general_properties,
            row.id,
          ]
        );
        if (row.app_version_id) appVersionIds.add(row.app_version_id);
        progress.show();
      }
    }

    // App history holds the old key layout; replaying it would undo the move.
    if (appVersionIds.size > 0) {
      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: Array.from(appVersionIds) },
        MIGRATION_NAME
      );
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Move Spinner keys to properties finished.`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
