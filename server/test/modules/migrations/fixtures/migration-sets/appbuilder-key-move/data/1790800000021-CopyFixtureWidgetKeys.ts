import { QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';
import { DataMigration } from '../../../../../../../src/migration-helpers/migration-mode';
import {
  ComponentKeyMove,
  copyMovedKeys,
  createKeyMoveSync,
  dropKeyMoveSync,
} from '../../../../../../../src/migration-helpers/component-key-moves'; // migration-import-allowed: copy, sync trigger and cleanup come from one declaration

// Verbatim the data migration template in server/docs/APP_DEFINITION_MIGRATIONS.md; only the names differ.

const MIGRATION_NAME = 'CopyFixtureWidgetKeys1790800000021';

/** SvgImage's visibility, tooltip and box shadow move to the places the other widgets use. Shared with the cleanup. */
export const SVG_IMAGE_MOVES: ComponentKeyMove[] = [
  { types: ['SvgImage'], from: ['styles', 'visibility'], to: ['properties', 'visibility'] },
  { types: ['SvgImage'], from: ['general_properties', 'tooltip'], to: ['properties', 'tooltip'] },
  { types: ['SvgImage'], from: ['general_styles', 'boxShadow'], to: ['styles', 'boxShadow'] },
];
/** Names the trigger that keeps both places equal until the cleanup. */
export const SVG_IMAGE_SYNC = 'svg_image_additional_actions';

export class CopyFixtureWidgetKeys1790800000021 implements DataMigration {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const touchedVersions = await copyMovedKeys(queryRunner, MIGRATION_NAME, SVG_IMAGE_MOVES);
    if (touchedVersions.length) {
      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: touchedVersions },
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
