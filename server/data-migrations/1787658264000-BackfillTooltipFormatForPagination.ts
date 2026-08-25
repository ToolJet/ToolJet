import { MigrationProgress, deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'BackfillTooltipFormatForPagination1787658264000';
const BATCH_SIZE = 2000;
const TYPE = 'Pagination';

export class BackfillTooltipFormatForPagination1787658264000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE type = $1`, [TYPE]);
    const total = parseInt(count, 10);
    if (total === 0) {
      console.log(`${MIGRATION_NAME}: no Pagination components found.`);
      return;
    }
    const progress = new MigrationProgress(MIGRATION_NAME, total);

    let lastId = '00000000-0000-0000-0000-000000000000';
    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components WHERE type = $1 AND id > $2 ORDER BY id ASC LIMIT $3`,
        [TYPE, lastId, BATCH_SIZE]
      );
      if (rows.length === 0) break;
      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      // An earlier migration (MigrateVisibilityDisabledStatesForPagination) already moved
      // visibility/disabledState/tooltip/boxShadow for Pagination, but predates tooltipFormat.
      // Only that field needs backfilling here.
      await queryRunner.query(
        `UPDATE components SET
             properties = (
               COALESCE(properties::jsonb,'{}'::jsonb)
               || CASE WHEN NOT (COALESCE(properties::jsonb,'{}'::jsonb) ? 'tooltipFormat')
                    THEN '{"tooltipFormat":{"value":"plainText"}}'::jsonb ELSE '{}'::jsonb END
             )::json
           WHERE id = ANY($1::uuid[])`,
        [ids]
      );
      rows.forEach(() => progress.show());
    }

    const versions: { app_version_id: string }[] = await queryRunner.query(
      `SELECT DISTINCT p.app_version_id FROM components c
         INNER JOIN pages p ON c.page_id = p.id WHERE c.type = $1`,
      [TYPE]
    );
    await deleteAppHistoryForStructuralMigration(
      queryRunner.manager,
      { appVersionIds: versions.map((v) => v.app_version_id) },
      MIGRATION_NAME
    );
  }

  public async down(): Promise<void> {}
}
