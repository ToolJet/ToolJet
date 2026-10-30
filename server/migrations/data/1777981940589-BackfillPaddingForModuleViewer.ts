import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'BackfillPaddingForModuleViewer1777981940589';
const BATCH_SIZE = 2000;
const COMPONENT_TYPES = ['ModuleViewer'];

const PADDING_PATCH = JSON.stringify({
  padding: { value: 'default' },
});

export class BackfillPaddingForModuleViewer1777981940589 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) FROM components
       WHERE type = ANY($1)
         AND (styles IS NULL OR NOT (styles::jsonb ? 'padding'))`,
      [COMPONENT_TYPES]
    );
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Backfill padding for ModuleViewer | Total: ${total}`);

    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components
         WHERE type = ANY($1)
           AND id > $2
           AND (styles IS NULL OR NOT (styles::jsonb ? 'padding'))
         ORDER BY id ASC
         LIMIT $3`,
        [COMPONENT_TYPES, lastId, BATCH_SIZE]
      );

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      await queryRunner.query(
        `UPDATE components
         SET styles = (COALESCE(styles, '{}')::jsonb || $1::jsonb)::json
         WHERE id = ANY($2::uuid[])`,
        [PADDING_PATCH, ids]
      );

      totalUpdated += rows.length;
      const percentage = total > 0 ? ((totalUpdated / total) * 100).toFixed(1) : '0.0';
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${totalUpdated}/${total} (${percentage}%)`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Backfill padding for ModuleViewer finished.`);

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
