import { MigrationProgress, deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'MigrateVisibilityDisabledStatesForPagination1780393833724';
const BATCH_SIZE = 2000;
const TYPE = 'Pagination';

export class MigrateVisibilityDisabledStatesForPagination1780393833724 implements MigrationInterface {
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

      // Move visibility/disabledState (styles→properties), tooltip (general→properties),
      // boxShadow (generalStyles→styles); backfill loadingState. Only fill a target when
      // unset so the user's saved value is preserved. Delete the stale keys.
      await queryRunner.query(
        `UPDATE components SET
             properties = (
               COALESCE(properties::jsonb,'{}'::jsonb)
               || CASE WHEN (styles::jsonb ? 'visibility') AND NOT (COALESCE(properties::jsonb,'{}'::jsonb) ? 'visibility')
                    THEN jsonb_build_object('visibility', styles::jsonb->'visibility') ELSE '{}'::jsonb END
               || CASE WHEN (styles::jsonb ? 'disabledState') AND NOT (COALESCE(properties::jsonb,'{}'::jsonb) ? 'disabledState')
                    THEN jsonb_build_object('disabledState', styles::jsonb->'disabledState') ELSE '{}'::jsonb END
               || CASE WHEN (general_properties::jsonb ? 'tooltip') AND NOT (COALESCE(properties::jsonb,'{}'::jsonb) ? 'tooltip')
                    THEN jsonb_build_object('tooltip', general_properties::jsonb->'tooltip') ELSE '{}'::jsonb END
               || CASE WHEN NOT (COALESCE(properties::jsonb,'{}'::jsonb) ? 'loadingState')
                    THEN '{"loadingState":{"value":"{{false}}"}}'::jsonb ELSE '{}'::jsonb END
             )::json,
             styles = (
               ( COALESCE(styles::jsonb,'{}'::jsonb)
                 || CASE WHEN (general_styles::jsonb ? 'boxShadow') AND NOT (COALESCE(styles::jsonb,'{}'::jsonb) ? 'boxShadow')
                      THEN jsonb_build_object('boxShadow', general_styles::jsonb->'boxShadow') ELSE '{}'::jsonb END
               ) - 'visibility' - 'disabledState'
             )::json,
             general_properties = (COALESCE(general_properties::jsonb,'{}'::jsonb) - 'tooltip')::json,
             general_styles    = (COALESCE(general_styles::jsonb,'{}'::jsonb) - 'boxShadow')::json
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
