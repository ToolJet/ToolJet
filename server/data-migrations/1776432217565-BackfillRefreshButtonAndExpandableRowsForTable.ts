import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'BackfillRefreshButtonAndExpandableRowsForTable1776432217565';
const BATCH_SIZE = 2000;
const COMPONENT_TYPES = ['Table'];

const PROPERTY_PATCH = JSON.stringify({
  showRefreshButton: { value: '{{false}}' },
  enableExpandableRows: { value: '{{false}}' },
  expansionHeight: { value: '{{229}}' },
});

export class BackfillRefreshButtonAndExpandableRowsForTable1776432217565 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) FROM components
           WHERE type = ANY($1)
             AND (properties IS NULL OR NOT (properties::jsonb ? 'showRefreshButton'))`,
      [COMPONENT_TYPES]
    );
    const total = parseInt(count, 10);
    console.log(
      `${MIGRATION_NAME}: [START] Backfill showRefreshButton, enableExpandableRows and expansionHeight | Total: ${total}`
    );

    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components
             WHERE type = ANY($1)
               AND id > $2
               AND (properties IS NULL OR NOT (properties::jsonb ? 'showRefreshButton'))
             ORDER BY id ASC
             LIMIT $3`,
        [COMPONENT_TYPES, lastId, BATCH_SIZE]
      );

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      await queryRunner.query(
        `UPDATE components
             SET properties = (COALESCE(properties, '{}')::jsonb || $1::jsonb)::json
             WHERE id = ANY($2::uuid[])`,
        [PROPERTY_PATCH, ids]
      );

      totalUpdated += rows.length;
      const percentage = total > 0 ? ((totalUpdated / total) * 100).toFixed(1) : '0.0';
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${totalUpdated}/${total} (${percentage}%)`);
    }

    console.log(
      `${MIGRATION_NAME}: [SUCCESS] Backfill showRefreshButton, enableExpandableRows and expansionHeight finished.`
    );

    if (totalUpdated > 0) {
      const appVersionRows: { app_version_id: string }[] = await queryRunner.query(
        `SELECT DISTINCT p.app_version_id
             FROM components c
             INNER JOIN pages p ON c.page_id = p.id
             WHERE c.type = ANY($1)`,
        [COMPONENT_TYPES]
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
