import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'BackfillLoadingStateListView1774412653882';
const BATCH_SIZE = 2000;
const COMPONENT_TYPES = ['Listview'];

export class BackfillLoadingStateListView1774412653882 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;
    let batchNumber = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components
         WHERE type = ANY($1)
           AND id > $2
           AND (
             (styles IS NOT NULL AND styles::jsonb ? 'visibility')
             OR (styles IS NOT NULL AND styles::jsonb ? 'disabledState')
             OR (general_properties IS NOT NULL AND general_properties::jsonb ? 'tooltip')
             OR (properties IS NULL OR NOT (properties::jsonb ? 'tooltip'))
             OR (general_styles IS NOT NULL AND general_styles::jsonb ? 'boxShadow')
             OR (properties IS NULL OR NOT (properties::jsonb ? 'loadingState'))
           )
         ORDER BY id ASC
         LIMIT $3`,
        [COMPONENT_TYPES, lastId, BATCH_SIZE]
      );

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      await queryRunner.query(
        `UPDATE components
         SET
           properties = (
             COALESCE(properties, '{}')::jsonb
             || CASE WHEN styles IS NOT NULL AND styles::jsonb ? 'visibility'
                          AND NOT (COALESCE(properties, '{}')::jsonb ? 'visibility')
                     THEN jsonb_build_object('visibility', styles::jsonb -> 'visibility')
                     ELSE '{}'::jsonb END
             || CASE WHEN styles IS NOT NULL AND styles::jsonb ? 'disabledState'
                          AND NOT (COALESCE(properties, '{}')::jsonb ? 'disabledState')
                     THEN jsonb_build_object('disabledState', styles::jsonb -> 'disabledState')
                     ELSE '{}'::jsonb END
             || CASE WHEN NOT (COALESCE(properties, '{}')::jsonb ? 'tooltip')
                          AND general_properties IS NOT NULL AND general_properties::jsonb ? 'tooltip'
                     THEN jsonb_build_object('tooltip', general_properties::jsonb -> 'tooltip')
                     WHEN NOT (COALESCE(properties, '{}')::jsonb ? 'tooltip')
                     THEN '{"tooltip": {"value": ""}}'::jsonb
                     ELSE '{}'::jsonb END
             || CASE WHEN NOT (COALESCE(properties, '{}')::jsonb ? 'loadingState')
                     THEN '{"loadingState": {"value": "{{false}}"}}'::jsonb
                     ELSE '{}'::jsonb END
           )::json,
           styles = (
             (COALESCE(styles, '{}')::jsonb - 'visibility' - 'disabledState')
             || CASE WHEN general_styles IS NOT NULL AND general_styles::jsonb ? 'boxShadow'
                          AND NOT (COALESCE(styles, '{}')::jsonb ? 'boxShadow')
                     THEN jsonb_build_object('boxShadow', general_styles::jsonb -> 'boxShadow')
                     ELSE '{}'::jsonb END
           )::json,
           general_properties = CASE
             WHEN general_properties IS NOT NULL AND general_properties::jsonb ? 'tooltip'
             THEN (general_properties::jsonb - 'tooltip')::json
             ELSE general_properties
           END,
           general_styles = CASE
             WHEN general_styles IS NOT NULL AND general_styles::jsonb ? 'boxShadow'
             THEN (general_styles::jsonb - 'boxShadow')::json
             ELSE general_styles
           END
         WHERE id = ANY($1::uuid[])`,
        [ids]
      );

      totalUpdated += rows.length;
      batchNumber++;
      console.log(`${MIGRATION_NAME}: Batch ${batchNumber} | Updated ${rows.length} (total: ${totalUpdated})`);
    }

    console.log(`${MIGRATION_NAME}: Done. Total updated: ${totalUpdated}`);

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
