import { QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';
import { DataMigration } from '../../src/migration-helpers/migration-mode';
import {
  ComponentKeyMove,
  copyMovedKeys,
  createKeyMoveSync,
  dropKeyMoveSync,
} from '../../src/migration-helpers/component-key-moves'; // migration-import-allowed: copy, sync trigger and cleanup come from one declaration

const MIGRATION_NAME = 'CopySvgImageAdditionalActions1795418406139';
/** Every Svg Image gets a plain-text tooltipFormat: a key added where missing (BackfillTooltipFormat skipped it). */
const NEEDS_TOOLTIP_FORMAT = `type = 'SvgImage' AND NOT COALESCE(properties::jsonb, '{}'::jsonb) ? 'tooltipFormat'`;

/**
 * SvgImage's Visibility moves from styles, and its tooltip from general, to properties (svgImage.js, Additional
 * Actions), next to a tooltipFormat; its box shadow moves from generalStyles to styles, under the widget's own
 * accordion. A value already at the new place wins. Old exports get the same moves on import
 * (`NewRevampedComponents` in app-import-export.service.ts). The old places stay, kept equal by a trigger, until
 * DropSvgImageOldAdditionalActions1795418406142 removes them one upgrade later.
 */
export class CopySvgImageAdditionalActions1795418406139 implements DataMigration {
  /** Static, not exported: a migration file exports only its class. The cleanup reads them from here. */
  static readonly MOVES: readonly ComponentKeyMove[] = [
    { types: ['SvgImage'], from: ['styles', 'visibility'], to: ['properties', 'visibility'] },
    { types: ['SvgImage'], from: ['general_properties', 'tooltip'], to: ['properties', 'tooltip'] },
    { types: ['SvgImage'], from: ['general_styles', 'boxShadow'], to: ['styles', 'boxShadow'] },
  ];
  /** Names the trigger that keeps both places equal until the cleanup. */
  static readonly SYNC = 'svg_image_additional_actions';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const touchedVersions = new Set(
      await copyMovedKeys(queryRunner, MIGRATION_NAME, CopySvgImageAdditionalActions1795418406139.MOVES)
    );

    // Every tooltip renders as plain text, as before the tooltip gained a format.
    const [{ count }] = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE ${NEEDS_TOOLTIP_FORMAT}`);
    console.log(`${MIGRATION_NAME}: [START] Seed tooltipFormat | Total: ${count}`);
    const seeded: { app_version_id: string }[] = await queryRunner.query(
      `WITH seeded AS (
         UPDATE components
         SET properties = (COALESCE(properties::jsonb, '{}'::jsonb) || $1::jsonb)::json
         WHERE ${NEEDS_TOOLTIP_FORMAT}
         RETURNING page_id)
       SELECT p.app_version_id FROM seeded JOIN pages p ON p.id = seeded.page_id`,
      [JSON.stringify({ tooltipFormat: { value: 'plainText' } })]
    );
    seeded.forEach(({ app_version_id }) => app_version_id && touchedVersions.add(app_version_id));
    console.log(`${MIGRATION_NAME}: [SUCCESS] Seed tooltipFormat finished. Updated: ${seeded.length}`);

    // App history holds the old key layout; restoring a snapshot would bring back rows without the new keys.
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
    await createKeyMoveSync(
      queryRunner,
      CopySvgImageAdditionalActions1795418406139.SYNC,
      CopySvgImageAdditionalActions1795418406139.MOVES
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // The copied keys stay: the previous release ignores them. Deleted app-history snapshots are unrecoverable.
    await queryRunner.query(dropKeyMoveSync(CopySvgImageAdditionalActions1795418406139.SYNC));
  }
}
