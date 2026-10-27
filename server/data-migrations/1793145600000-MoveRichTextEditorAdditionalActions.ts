import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'MoveRichTextEditorAdditionalActions1793145600000';
const BATCH_SIZE = 2000;

const COMPONENT_TYPE = 'RichTextEditor';

/**
 * RichTextEditor modernization (bug-fix batch 2026-10-27):
 *   1. `visibility` and `disabledState` move from the `styles` column to the
 *      `properties` column (they now render in the inspector's Additional
 *      Actions section, like every modern widget).
 *   2. The old universal `general_properties.tooltip` moves to
 *      `properties.tooltip` (+ a `plainText` `tooltipFormat` seed), matching
 *      the per-widget tooltip pattern (AudioRecorder/Camera precedent).
 *   3. The universal `general_styles.boxShadow` moves to the newly registered
 *      `styles.boxShadow` — RichTextEditor joined `NewRevampedComponents`
 *      (app-import-export.service.ts), whose import-time normalization performs
 *      the same four moves for imported old exports; this migration keeps
 *      DB rows and imports identical.
 *
 * Saved values win over the new defaults: a hidden/disabled/tooltipped/shadowed
 * editor saved before this change keeps behaving exactly the same afterwards.
 * The widget also carries a runtime styles-fallback for definitions that bypass
 * both paths.
 *
 * Idempotent: rows are selected only while an old-location key is still
 * present; target keys are never overwritten if already set.
 */
export class MoveRichTextEditorAdditionalActions1793145600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const updatedAppVersionIds = new Set<string>();

    const selection = `type = $1
         AND (
           COALESCE(styles::jsonb, '{}'::jsonb) ?| ARRAY['visibility', 'disabledState']
           OR COALESCE(general_properties::jsonb, '{}'::jsonb) ? 'tooltip'
           OR (
             COALESCE(general_styles::jsonb, '{}'::jsonb) ? 'boxShadow'
             AND NOT COALESCE(styles::jsonb, '{}'::jsonb) ? 'boxShadow'
           )
         )`;

    const [{ count }] = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE ${selection}`, [COMPONENT_TYPE]);
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Move RichTextEditor visibility/disabledState/tooltip | Total: ${total}`);

    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components
         WHERE ${selection}
           AND id > $2
         ORDER BY id ASC
         LIMIT $3`,
        [COMPONENT_TYPE, lastId, BATCH_SIZE]
      );

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      // One bulk UPDATE per batch:
      //  - properties gains the moved keys (saved values win; existing
      //    properties keys are never overwritten — idempotence belt).
      //  - tooltip values are normalized to the `{ value: ... }` envelope
      //    (editor-written rows already carry it; API-written rows may be raw).
      //  - tooltipFormat is seeded `plainText` only when a tooltip moves.
      //  - the old locations are cleared so the move never reapplies.
      await queryRunner.query(
        `UPDATE components
         SET
           properties = (
             COALESCE(properties::jsonb, '{}'::jsonb)
             || jsonb_strip_nulls(jsonb_build_object(
                  'visibility',
                  CASE WHEN COALESCE(properties::jsonb, '{}'::jsonb) ? 'visibility' THEN NULL
                       ELSE styles::jsonb -> 'visibility' END,
                  'disabledState',
                  CASE WHEN COALESCE(properties::jsonb, '{}'::jsonb) ? 'disabledState' THEN NULL
                       ELSE styles::jsonb -> 'disabledState' END,
                  'tooltip',
                  CASE
                    WHEN COALESCE(properties::jsonb, '{}'::jsonb) ? 'tooltip' THEN NULL
                    WHEN general_properties::jsonb -> 'tooltip' IS NULL THEN NULL
                    WHEN jsonb_typeof(general_properties::jsonb -> 'tooltip') = 'object'
                      THEN general_properties::jsonb -> 'tooltip'
                    ELSE jsonb_build_object('value', general_properties::jsonb -> 'tooltip')
                  END,
                  'tooltipFormat',
                  CASE
                    WHEN COALESCE(properties::jsonb, '{}'::jsonb) ? 'tooltipFormat' THEN NULL
                    WHEN general_properties::jsonb -> 'tooltip' IS NULL THEN NULL
                    ELSE jsonb_build_object('value', 'plainText')
                  END
                ))
           )::json,
           styles = (
             (COALESCE(styles::jsonb, '{}'::jsonb) - 'visibility' - 'disabledState')
             || jsonb_strip_nulls(jsonb_build_object(
                  'boxShadow',
                  CASE WHEN COALESCE(styles::jsonb, '{}'::jsonb) ? 'boxShadow' THEN NULL
                       ELSE general_styles::jsonb -> 'boxShadow' END
                ))
           )::json,
           general_properties = (COALESCE(general_properties::jsonb, '{}'::jsonb) - 'tooltip')::json,
           general_styles = (COALESCE(general_styles::jsonb, '{}'::jsonb) - 'boxShadow')::json
         WHERE id = ANY($1::uuid[])`,
        [ids]
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

    console.log(`${MIGRATION_NAME}: [SUCCESS] Move finished. Updated: ${totalUpdated}`);

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
