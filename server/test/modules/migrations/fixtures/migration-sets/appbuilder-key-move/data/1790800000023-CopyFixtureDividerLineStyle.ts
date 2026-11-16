import { QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';
import { DataMigration } from '../../../../../../../src/migration-helpers/migration-mode';
import {
  ComponentKeyMove,
  copyMovedKeys,
  createKeyMoveSync,
  dropKeyMoveSync,
} from '../../../../../../../src/migration-helpers/component-key-moves'; // migration-import-allowed: copy, sync trigger and cleanup come from one declaration

// Verbatim the format change example in server/docs/APP_DEFINITION_MIGRATIONS.md; only the names differ.

const MIGRATION_NAME = 'CopyFixtureDividerLineStyle1790800000023';

/** Divider's boolean `dashed` property becomes the `lineStyle` style, 'dashed' or 'solid'. Shared with the cleanup. */
export const DIVIDER_MOVES: ComponentKeyMove[] = [
  {
    types: ['Divider'],
    from: ['properties', 'dashed'],
    to: ['styles', 'lineStyle'],
    convert: {
      toNew: `jsonb_build_object('value', CASE WHEN value ->> 'value' = '{{true}}' THEN 'dashed' ELSE 'solid' END)`,
      toOld: `jsonb_build_object('value', CASE WHEN value ->> 'value' = 'dashed' THEN '{{true}}' ELSE '{{false}}' END)`,
    },
  },
];
/** Names the trigger that keeps both places equal until the cleanup. */
export const DIVIDER_SYNC = 'divider_line_style';

export class CopyFixtureDividerLineStyle1790800000023 implements DataMigration {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const touchedVersions = await copyMovedKeys(queryRunner, MIGRATION_NAME, DIVIDER_MOVES);
    if (touchedVersions.length) {
      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: touchedVersions },
        MIGRATION_NAME
      );
    }
  }

  /** Until the cleanup, keeps both places equal, each in its own format, whatever release writes them. */
  public async beforeCommit(queryRunner: QueryRunner): Promise<void> {
    await createKeyMoveSync(queryRunner, DIVIDER_SYNC, DIVIDER_MOVES);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // The copied keys stay: the previous release ignores them. Deleted app-history snapshots are unrecoverable.
    await queryRunner.query(dropKeyMoveSync(DIVIDER_SYNC));
  }
}
