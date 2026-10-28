import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'BackfillKeyValuePairContainerStylesNeutral1782086400000';
const BATCH_SIZE = 2000;

const COMPONENT_TYPE = 'KeyValuePair';

const NEUTRAL_STYLES_PATCH = JSON.stringify({
  backgroundColor: { value: 'transparent' },
  borderColor: { value: '#00000000' },
  borderRadius: { value: 0 },
  boxShadow: { value: '0px 0px 0px 0px #00000000' },
});

const STYLE_KEYS = ['backgroundColor', 'borderColor', 'borderRadius', 'boxShadow'];

export class BackfillKeyValuePairContainerStylesNeutral1782086400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const updatedAppVersionIds = new Set<string>();

    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) FROM components
       WHERE type = $1
         AND (styles IS NULL OR NOT (styles::jsonb ?& $2::text[]))`,
      [COMPONENT_TYPE, STYLE_KEYS]
    );
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Total KeyValuePair widgets to pin: ${total}`);

    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components
         WHERE type = $1
           AND id > $2
           AND (styles IS NULL OR NOT (styles::jsonb ?& $3::text[]))
         ORDER BY id ASC
         LIMIT $4`,
        [COMPONENT_TYPE, lastId, STYLE_KEYS, BATCH_SIZE]
      );

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      await queryRunner.query(
        `UPDATE components
         SET styles = ($1::jsonb || COALESCE(styles, '{}')::jsonb)::json
         WHERE id = ANY($2::uuid[])`,
        [NEUTRAL_STYLES_PATCH, ids]
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
