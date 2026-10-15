import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'BackfillCheckboxDynamicHeightOff1790400000000';
const BATCH_SIZE = 2000;
const COMPONENT_TYPE = 'Checkbox';

// Checkbox now ships dynamicHeight on, and buildComponentMetaDefinition fills any key a saved
// component lacks from the config default, so without this pin every existing checkbox would
// silently start growing.
const DYNAMIC_HEIGHT_PATCH = JSON.stringify({
  dynamicHeight: { value: '{{false}}' },
});

export class BackfillCheckboxDynamicHeightOff1790400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) FROM components
       WHERE type = $1
         AND (properties IS NULL OR NOT (properties::jsonb ? 'dynamicHeight'))`,
      [COMPONENT_TYPE]
    );
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Backfill Checkbox dynamicHeight | Total: ${total}`);

    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components
         WHERE type = $1
           AND id > $2
           AND (properties IS NULL OR NOT (properties::jsonb ? 'dynamicHeight'))
         ORDER BY id ASC
         LIMIT $3`,
        [COMPONENT_TYPE, lastId, BATCH_SIZE]
      );

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      await queryRunner.query(
        `UPDATE components
         SET properties = (COALESCE(properties, '{}')::jsonb || $1::jsonb)::json
         WHERE id = ANY($2::uuid[])`,
        [DYNAMIC_HEIGHT_PATCH, ids]
      );

      totalUpdated += rows.length;
      const percentage = total > 0 ? ((totalUpdated / total) * 100).toFixed(1) : '0.0';
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${totalUpdated}/${total} (${percentage}%)`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Backfill Checkbox dynamicHeight finished.`);

    if (totalUpdated > 0) {
      const appVersionRows: { app_version_id: string }[] = await queryRunner.query(
        `SELECT DISTINCT p.app_version_id
         FROM components c
         INNER JOIN pages p ON c.page_id = p.id
         WHERE c.type = $1`,
        [COMPONENT_TYPE]
      );

      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: appVersionRows.map((r) => r.app_version_id) },
        MIGRATION_NAME
      );
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentional no-op — structural migrations are not reversed
  }
}
