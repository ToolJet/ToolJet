import { MigrationInterface, QueryRunner } from 'typeorm';
import { withShortLock } from '../../../../../../../src/migration-helpers/with-short-lock'; // migration-import-allowed: cleanup steps must go through the short-lock helper
import { SVG_COPY_SET, SVG_NEEDS_COPY } from '../data/1790800000021-CopyFixtureWidgetKeys'; // migration-import-allowed: reruns the copy for late rows

// Verbatim the cleanup migration template in server/docs/APP_DEFINITION_MIGRATIONS.md; only the names differ.

export class DropFixtureWidgetOldKeys1790800000022 implements MigrationInterface {
  transaction = false;
  requires = 'CopyFixtureWidgetKeys1790800000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await withShortLock(queryRunner, [
      // Rows old code saved after the copy ran only have the old keys.
      `UPDATE components SET ${SVG_COPY_SET} WHERE ${SVG_NEEDS_COPY}`,
      // Each old key goes only where its new key exists.
      `UPDATE components SET
         styles = CASE WHEN COALESCE(properties::jsonb, '{}'::jsonb) ? 'visibility'
                    THEN (styles::jsonb - 'visibility')::json ELSE styles END,
         general_properties = CASE WHEN COALESCE(properties::jsonb, '{}'::jsonb) ? 'tooltip'
                    THEN (general_properties::jsonb - 'tooltip')::json ELSE general_properties END,
         general_styles = CASE WHEN COALESCE(styles::jsonb, '{}'::jsonb) ? 'boxShadow'
                    THEN (general_styles::jsonb - 'boxShadow')::json ELSE general_styles END
       WHERE type = 'SvgImage' AND (COALESCE(styles::jsonb, '{}'::jsonb) ? 'visibility'
         OR COALESCE(general_properties::jsonb, '{}'::jsonb) ? 'tooltip'
         OR COALESCE(general_styles::jsonb, '{}'::jsonb) ? 'boxShadow')`,
    ]);
  }

  public async down(): Promise<void> {
    // The old keys are not restored: no release that can still be rolled back to reads them.
  }
}
