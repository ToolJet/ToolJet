import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'MigrateVisibilityDisabledStatesForPagination1780393833724';
const BATCH_SIZE = 2000;
const COMPONENT_TYPE = 'Pagination';

// Selects Pagination components that still need any part of the move applied:
//  - visibility / disabledState still in styles
//  - tooltip still in general_properties
//  - boxShadow still in general_styles
//  - loadingState not yet present in properties
const SELECT_CONDITION = `
  type = '${COMPONENT_TYPE}'
  AND id > $1
  AND (
       (styles::jsonb ? 'visibility')
    OR (styles::jsonb ? 'disabledState')
    OR (general_properties::jsonb ? 'tooltip')
    OR (general_styles::jsonb ? 'boxShadow')
    OR NOT (COALESCE(properties::jsonb, '{}'::jsonb) ? 'loadingState')
  )
`;

export class MigrateVisibilityDisabledStatesForPagination1780393833724 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log(`${MIGRATION_NAME}: [START] Move visibility/disable/tooltip/boxShadow + backfill loadingState`);

    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components
         WHERE ${SELECT_CONDITION}
         ORDER BY id ASC
         LIMIT $2`,
        [lastId, BATCH_SIZE]
      );

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      // Move keys between sections atomically per row. Only fill the target when it
      // is not already set, so any value the user customised is preserved.
      await queryRunner.query(
        `UPDATE components
         SET
           properties = (
             COALESCE(properties::jsonb, '{}'::jsonb)
             || CASE WHEN (styles::jsonb ? 'visibility') AND NOT (COALESCE(properties::jsonb, '{}'::jsonb) ? 'visibility')
                  THEN jsonb_build_object('visibility', styles::jsonb -> 'visibility') ELSE '{}'::jsonb END
             || CASE WHEN (styles::jsonb ? 'disabledState') AND NOT (COALESCE(properties::jsonb, '{}'::jsonb) ? 'disabledState')
                  THEN jsonb_build_object('disabledState', styles::jsonb -> 'disabledState') ELSE '{}'::jsonb END
             || CASE WHEN (general_properties::jsonb ? 'tooltip') AND NOT (COALESCE(properties::jsonb, '{}'::jsonb) ? 'tooltip')
                  THEN jsonb_build_object('tooltip', general_properties::jsonb -> 'tooltip') ELSE '{}'::jsonb END
             || CASE WHEN NOT (COALESCE(properties::jsonb, '{}'::jsonb) ? 'loadingState')
                  THEN '{"loadingState":{"value":"{{false}}"}}'::jsonb ELSE '{}'::jsonb END
           )::json,
           styles = (
             (
               COALESCE(styles::jsonb, '{}'::jsonb)
               || CASE WHEN (general_styles::jsonb ? 'boxShadow') AND NOT (COALESCE(styles::jsonb, '{}'::jsonb) ? 'boxShadow')
                    THEN jsonb_build_object('boxShadow', general_styles::jsonb -> 'boxShadow') ELSE '{}'::jsonb END
             ) - 'visibility' - 'disabledState'
           )::json,
           general_properties = (COALESCE(general_properties::jsonb, '{}'::jsonb) - 'tooltip')::json,
           general_styles = (COALESCE(general_styles::jsonb, '{}'::jsonb) - 'boxShadow')::json
         WHERE id = ANY($1::uuid[])`,
        [ids]
      );

      totalUpdated += rows.length;
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${totalUpdated} updated`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Move finished. Total updated: ${totalUpdated}`);

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
