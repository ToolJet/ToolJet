import { QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';
import { DataMigration } from '../../src/migration-helpers/migration-mode';
import {
  ComponentKeyMove,
  copyMovedKeys,
  createKeyMoveSync,
  dropKeyMoveSync,
} from '../../src/migration-helpers/component-key-moves'; // migration-import-allowed: copy, sync trigger and cleanup come from one declaration

const MIGRATION_NAME = 'CopySvgImageAdditionalActions1794252760838';

/**
 * SvgImage's visibility moves from styles to properties, the universal tooltip to `properties.tooltip`, and the
 * universal box shadow to `styles.boxShadow`, under the widget's own "Svg image" accordion. Old exports get the same
 * moves on import (`NewRevampedComponents` in app-import-export.service.ts). A value saved before the upgrade wins
 * over the new defaults. Shared with the cleanup.
 */
export const SVG_IMAGE_MOVES: ComponentKeyMove[] = [
  { types: ['SvgImage'], from: ['styles', 'visibility'], to: ['properties', 'visibility'] },
  { types: ['SvgImage'], from: ['general_properties', 'tooltip'], to: ['properties', 'tooltip'] },
  { types: ['SvgImage'], from: ['general_styles', 'boxShadow'], to: ['styles', 'boxShadow'] },
];
/** Names the trigger that keeps both places equal until the cleanup. */
export const SVG_IMAGE_SYNC = 'svg_image_additional_actions';

export class CopySvgImageAdditionalActions1794252760838 implements DataMigration {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const touchedVersions = new Set(await copyMovedKeys(queryRunner, MIGRATION_NAME, SVG_IMAGE_MOVES));

    // tooltipFormat pairs with the properties-based tooltip; BackfillTooltipFormat did not cover SvgImage, so every
    // SvgImage without one gets the plain-text default here: a key added where missing, nothing removed.
    const seeded: { app_version_id: string }[] = await queryRunner.query(
      `WITH seeded AS (
         UPDATE components
         SET properties = (COALESCE(properties::jsonb, '{}'::jsonb) || $1::jsonb)::json
         WHERE type = 'SvgImage' AND NOT COALESCE(properties::jsonb, '{}'::jsonb) ? 'tooltipFormat'
         RETURNING page_id)
       SELECT p.app_version_id FROM seeded JOIN pages p ON p.id = seeded.page_id`,
      [JSON.stringify({ tooltipFormat: { value: 'plainText' } })]
    );
    seeded.forEach(({ app_version_id }) => app_version_id && touchedVersions.add(app_version_id));
    console.log(`${MIGRATION_NAME}: [SUCCESS] Seed tooltipFormat finished. Updated: ${seeded.length}`);

    if (touchedVersions.size) {
      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: [...touchedVersions] },
        MIGRATION_NAME
      );
    }
  }

  /** Until the cleanup, keeps both places equal whatever release writes them. */
  public async beforeCommit(queryRunner: QueryRunner): Promise<void> {
    await createKeyMoveSync(queryRunner, SVG_IMAGE_SYNC, SVG_IMAGE_MOVES);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // The copied keys stay: the previous release ignores them. Deleted app-history snapshots are unrecoverable.
    await queryRunner.query(dropKeyMoveSync(SVG_IMAGE_SYNC));
  }
}
