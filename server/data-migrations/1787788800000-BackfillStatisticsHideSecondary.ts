import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'BackfillStatisticsHideSecondary1787788800000';
const BATCH_SIZE = 2000;

const COMPONENT_TYPE = 'Statistics';

/**
 * hideSecondary was never written to saved definitions, so the new default of true would reach
 * existing components through AppsUtilService.buildComponentMetaDefinition and hide their
 * secondary value. Pin the absent ones to false; a user's own setting is left untouched.
 */
const HIDE_SECONDARY_PATCH = JSON.stringify({
  hideSecondary: { value: '{{false}}' },
});

const PROPERTY_KEYS = ['hideSecondary'];

export class BackfillStatisticsHideSecondary1787788800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const updatedAppVersionIds = new Set<string>();

    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) FROM components
       WHERE type = $1
         AND (properties IS NULL OR NOT (properties::jsonb ?& $2::text[]))`,
      [COMPONENT_TYPE, PROPERTY_KEYS]
    );
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Total Statistics widgets to pin: ${total}`);

    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components
         WHERE type = $1
           AND id > $2
           AND (properties IS NULL OR NOT (properties::jsonb ?& $3::text[]))
         ORDER BY id ASC
         LIMIT $4`,
        [COMPONENT_TYPE, lastId, PROPERTY_KEYS, BATCH_SIZE]
      );

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      await queryRunner.query(
        `UPDATE components
         SET properties = ($1::jsonb || COALESCE(properties, '{}')::jsonb)::json
         WHERE id = ANY($2::uuid[])`,
        [HIDE_SECONDARY_PATCH, ids]
      );

      const batchVersionRows: { app_version_id: string }[] = await queryRunner.query(
        `SELECT DISTINCT p.app_version_id
         FROM components c
         INNER JOIN pages p ON c.page_id = p.id
         WHERE c.id = ANY($1::uuid[])`,
        [ids]
      );
      for (const row of batchVersionRows) {
        if (row.app_version_id) updatedAppVersionIds.add(row.app_version_id);
      }

      totalUpdated += rows.length;
      const percentage = total > 0 ? ((totalUpdated / total) * 100).toFixed(1) : '0.0';
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${totalUpdated}/${total} (${percentage}%)`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Backfill finished. Updated: ${totalUpdated}`);

    if (totalUpdated > 0 && updatedAppVersionIds.size > 0) {
      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: Array.from(updatedAppVersionIds) },
        MIGRATION_NAME
      );
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
