import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'BackfillEmptyConfirmationMessageOnDataQueries1778096864115';
const BATCH_SIZE = 2000;

const CONFIRMATION_MESSAGE_PATCH = JSON.stringify({
  confirmationMessage: '',
});

export class BackfillEmptyConfirmationMessageOnDataQueries1778096864115 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) FROM data_queries
       WHERE options IS NULL OR NOT (options::jsonb ? 'confirmationMessage')`
    );
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Backfill confirmationMessage on data_queries | Total: ${total}`);

    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM data_queries
         WHERE id > $1
           AND (options IS NULL OR NOT (options::jsonb ? 'confirmationMessage'))
         ORDER BY id ASC
         LIMIT $2`,
        [lastId, BATCH_SIZE]
      );

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      await queryRunner.query(
        `UPDATE data_queries
         SET options = (COALESCE(options, '{}')::jsonb || $1::jsonb)::json
         WHERE id = ANY($2::uuid[])`,
        [CONFIRMATION_MESSAGE_PATCH, ids]
      );

      totalUpdated += rows.length;
      const percentage = total > 0 ? ((totalUpdated / total) * 100).toFixed(1) : '0.0';
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${totalUpdated}/${total} (${percentage}%)`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Backfill confirmationMessage finished.`);

    if (totalUpdated > 0) {
      const appVersionRows: { app_version_id: string }[] = await queryRunner.query(
        `SELECT DISTINCT app_version_id FROM data_queries WHERE app_version_id IS NOT NULL`
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
