import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

/**
 * Timer kept Visibility and Disable under `styles` and its tooltip under `general`, so the Inspector
 * showed them in the wrong places and the tooltip had no format. They now live in `properties`
 * (timer.js), next to a `tooltipFormat`.
 *
 * Per Timer row:
 *   styles.visibility       -> properties.visibility       (value unchanged)
 *   styles.disabledState    -> properties.disabledState    (value unchanged)
 *   general.tooltip         -> properties.tooltip          (text unchanged)
 *   properties.tooltipFormat = plainText when absent, so every existing tooltip renders exactly as before
 *
 * A key already present in `properties` always wins. The import path makes the same move for apps
 * exported before this change (`migrateProperties` in app-import-export.service.ts).
 */
const MIGRATION_NAME = 'MoveTimerVisibilityDisabledTooltipToProperties1792200000000';
const BATCH_SIZE = 2000;

const NEEDS_MOVE = `
  type = 'Timer'
  AND (
    COALESCE(styles, '{}')::jsonb ?| ARRAY['visibility', 'disabledState']
    OR COALESCE(general_properties, '{}')::jsonb ? 'tooltip'
    OR NOT (COALESCE(properties, '{}')::jsonb ? 'tooltipFormat')
  )`;

export class MoveTimerVisibilityDisabledTooltipToProperties1792200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE ${NEEDS_MOVE}`);
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Move Timer keys to properties: ${total}`);

    const updatedAppVersionIds = new Set<string>();
    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components WHERE ${NEEDS_MOVE} AND id > $1 ORDER BY id ASC LIMIT $2`,
        [lastId, BATCH_SIZE]
      );
      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      // Later operands of `||` win, so existing `properties` override anything moved in.
      await queryRunner.query(
        `UPDATE components
         SET properties = (
               '{"tooltipFormat": {"value": "plainText"}}'::jsonb
               || CASE WHEN COALESCE(styles, '{}')::jsonb ? 'visibility'
                    THEN jsonb_build_object('visibility', styles::jsonb -> 'visibility') ELSE '{}'::jsonb END
               || CASE WHEN COALESCE(styles, '{}')::jsonb ? 'disabledState'
                    THEN jsonb_build_object('disabledState', styles::jsonb -> 'disabledState') ELSE '{}'::jsonb END
               || CASE WHEN COALESCE(general_properties, '{}')::jsonb ? 'tooltip'
                    THEN jsonb_build_object('tooltip', general_properties::jsonb -> 'tooltip') ELSE '{}'::jsonb END
               || COALESCE(properties, '{}')::jsonb
             )::json,
             styles = (COALESCE(styles, '{}')::jsonb - 'visibility' - 'disabledState')::json,
             general_properties = CASE
               WHEN general_properties IS NOT NULL THEN (general_properties::jsonb - 'tooltip')::json
               ELSE general_properties
             END
         WHERE id = ANY($1::uuid[])`,
        [ids]
      );

      const versionRows: { app_version_id: string }[] = await queryRunner.query(
        `SELECT DISTINCT p.app_version_id
         FROM components c
         INNER JOIN pages p ON c.page_id = p.id
         WHERE c.id = ANY($1::uuid[])`,
        [ids]
      );
      for (const row of versionRows) {
        if (row.app_version_id) updatedAppVersionIds.add(row.app_version_id);
      }

      totalUpdated += rows.length;
      const percentage = total > 0 ? ((totalUpdated / total) * 100).toFixed(1) : '0.0';
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${totalUpdated}/${total} (${percentage}%)`);
    }

    // App history holds the old key layout; replaying it would undo the move.
    if (totalUpdated > 0 && updatedAppVersionIds.size > 0) {
      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: Array.from(updatedAppVersionIds) },
        MIGRATION_NAME
      );
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Move Timer keys to properties finished.`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
